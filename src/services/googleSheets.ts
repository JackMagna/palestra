import { INITIAL_GYM_PROGRAM, WorkoutProgram } from '../data/initialProgram';

export interface SheetRowRecord {
  giorno: string;
  note: string;
  sett1: string;
  sett2: string;
  sett3: string;
  sett4: string;
  sett5: string;
  sett6: string;
}

// Generates the exact CSV structure matching Giacomo & Dario PT's format
export function generateProgramCSV(program: WorkoutProgram = INITIAL_GYM_PROGRAM): string {
  const lines: string[] = [
    ',,,,,,,',
    ',PROGRAMMA PALESTRA,,,,,,',
    ',,,,,,,',
    `,${program.athlete} •   ${program.trainer},,,,,,`,
    ',,,,,,,',
    ',,,,,,,'
  ];

  for (const day of program.days) {
    lines.push(`${day.title},NOTE,1 SETT.,2 SETT.,3 SETT.,4 SETT.,5 SETT., 6 SETT.`);
    
    // Group exercises by section
    let currentSection = '';
    for (const ex of day.exercises) {
      if (ex.sectionType !== currentSection) {
        currentSection = ex.sectionType;
        const sectionHeader = 
          ex.sectionType === 'progressione' ? "PROGRESSIONE SERIE X REP RIP. 2'" :
          ex.sectionType === 'cedimento' ? "CEDIMENTO SERIE X REP RIP. 2'" : '';
        if (sectionHeader) {
          lines.push(`${sectionHeader},${ex.warmupNote},${ex.weeks[1] || ''},${ex.weeks[2] || ''},${ex.weeks[3] || ''},${ex.weeks[4] || ''},${ex.weeks[5] || ''},${ex.weeks[6] || ''}`);
        }
      }
      lines.push(`${ex.name},${ex.note || ''},${ex.weeks[1] || ''},${ex.weeks[2] || ''},${ex.weeks[3] || ''},${ex.weeks[4] || ''},${ex.weeks[5] || ''},${ex.weeks[6] || ''}`);
    }
    lines.push(',,,,,,,');
    lines.push(',,,,,,,');
  }

  lines.push('MODALITÀ D\'ESECUZIONE,,,,,,,');
  for (const mod of program.guidelines.modalitaEsecuzione) {
    lines.push(`${mod},,,,,,,`);
  }
  lines.push(',,,,,,,');
  lines.push('PROGRESSIONE,,,,,,,');
  lines.push(`${program.guidelines.progressione},,,,,,,`);
  lines.push(',,,,,,,');
  lines.push('CEDIMENTO,,,,,,,');
  lines.push(`${program.guidelines.cedimento},,,,,,,`);

  return lines.join('\n');
}

// Download CSV file directly
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Google Sheets API v4 Integration
export async function createGoogleSheetFromProgram(
  accessToken: string,
  title: string = 'Programma Palestra - Giacomo e Dario PT'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  // Format row values
  const csvText = generateProgramCSV();
  const rows = csvText.split('\n').map(line => line.split(',').map(cell => ({
    userEnteredValue: { stringValue: cell.trim() }
  })));

  const payload = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Scheda Allenamento',
          gridProperties: {
            rowCount: rows.length + 10,
            columnCount: 10
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: rows.map(r => ({ values: r }))
          }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Errore creazione Google Sheet: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl
  };
}

// Append or update workout load log in a dedicated "Log Carichi" tab in Google Sheets
export async function appendWorkoutLogToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sessionData: {
    date: string;
    dayTitle: string;
    weekNumber: number;
    sets: { exerciseName: string; setIndex: number; weightKg: number; reps: number; rpe?: number; notes?: string }[];
  }
) {
  const sheetName = 'Log Carichi';
  
  // First ensure tab exists or create it
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }
        ]
      })
    });
  } catch {
    // Sheet might already exist
  }

  // Append rows
  const values = sessionData.sets.map(s => [
    sessionData.date,
    sessionData.dayTitle,
    `Settimana ${sessionData.weekNumber}`,
    s.exerciseName,
    `Serie ${s.setIndex + 1}`,
    `${s.weightKg} kg`,
    `${s.reps} reps`,
    s.rpe ? `RPE ${s.rpe}` : '',
    s.notes || ''
  ]);

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:I:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Impossibile scrivere sul foglio Google: ${err}`);
  }

  return await response.json();
}
