import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  ExternalLink, 
  CloudUpload, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Link,
  Layers,
  Info
} from 'lucide-react';
import { INITIAL_GYM_PROGRAM, WorkoutProgram } from '../data/initialProgram';
import { generateProgramCSV, downloadCSV, createGoogleSheetFromProgram } from '../services/googleSheets';
import { getAccessToken } from '../services/firebase';

interface SheetsMatrixViewProps {
  program?: WorkoutProgram;
  spreadsheetId?: string;
  onUpdateSpreadsheetId?: (id: string) => void;
  isGoogleAuthenticated: boolean;
  onConnectGoogle: () => void;
}

export const SheetsMatrixView: React.FC<SheetsMatrixViewProps> = ({
  program = INITIAL_GYM_PROGRAM,
  spreadsheetId = '',
  onUpdateSpreadsheetId,
  isGoogleAuthenticated,
  onConnectGoogle
}) => {
  const [copied, setCopied] = useState(false);
  const [inputSheetUrl, setInputSheetUrl] = useState(spreadsheetId);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Copy CSV to clipboard
  const handleCopyCSV = async () => {
    try {
      const csv = generateProgramCSV(program);
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMessage('Impossibile copiare negli appunti.');
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csv = generateProgramCSV(program);
    downloadCSV('Programma_Palestra_Giacomo_Dario_PT.csv', csv);
  };

  // Create Google Sheet directly in Drive
  const handleCreateGoogleSheet = async () => {
    if (!isGoogleAuthenticated) {
      onConnectGoogle();
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Token Google non disponibile. Effettua nuovamente il login con Google.');
      }

      const result = await createGoogleSheetFromProgram(token, `Scheda Palestra - ${program.athlete} & ${program.trainer}`);
      if (onUpdateSpreadsheetId) {
        onUpdateSpreadsheetId(result.spreadsheetId);
      }
      setInputSheetUrl(result.spreadsheetId);
      setStatusMessage(`Foglio Google creato con successo! ID: ${result.spreadsheetId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante la creazione del Google Sheet');
    } finally {
      setIsCreatingSheet(false);
      setShowConfirmModal(false);
    }
  };

  const handleSaveCustomId = () => {
    let cleanId = inputSheetUrl.trim();
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }
    if (onUpdateSpreadsheetId) {
      onUpdateSpreadsheetId(cleanId);
      setStatusMessage('ID foglio Google collegato correttamente.');
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Card: Google Sheets Connection & Sync Options */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets Sync Bidirezionale</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Documento Condiviso con Dario PT
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualizza la matrice a 6 settimane identica al foglio Google. I dati compilati dall'app vengono sincronizzati senza alterare le colonne.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>{copied ? 'Copiato!' : 'Copia CSV'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Scarica CSV</span>
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isCreatingSheet}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isCreatingSheet ? 'Creazione...' : 'Crea Foglio Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Connect Sheet Input bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Incolla link foglio Google esistente o ID foglio..."
              value={inputSheetUrl}
              onChange={(e) => setInputSheetUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSaveCustomId}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs whitespace-nowrap transition-colors"
          >
            Collega ID
          </button>
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Apri su Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Feedback messages */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Sheet Confirmation Dialog (Required for Google Workspace Operations) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Info className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Conferma Creazione su Google Drive</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stai per creare un nuovo foglio di calcolo Google con il titolo <strong>"Scheda Palestra - {program.athlete} & {program.trainer}"</strong> nel tuo account Google Drive collegato. Il file includerà la tabella esatta con le 6 settimane di progressione e le note tecniche.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateGoogleSheet}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-colors"
              >
                Conferma e Crea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Matrix Visual Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Tabella Ufficiale Formato Google Sheets</span>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              {program.title}: {program.athlete} • {program.trainer}
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
            6 Settimane di Progressione
          </span>
        </div>

        {/* Scrollable Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3 font-semibold min-w-[220px]">ESERCIZIO / GIORNO</th>
                <th className="p-3 font-semibold min-w-[180px]">NOTE TECNICHE</th>
                <th className="p-3 font-semibold min-w-[110px] text-center bg-slate-900/60">1 SETT.</th>
                <th className="p-3 font-semibold min-w-[110px] text-center">2 SETT.</th>
                <th className="p-3 font-semibold min-w-[130px] text-center bg-amber-500/5 text-amber-300">3 SETT.</th>
                <th className="p-3 font-semibold min-w-[110px] text-center">4 SETT.</th>
                <th className="p-3 font-semibold min-w-[130px] text-center bg-amber-500/5 text-amber-300">5 SETT.</th>
                <th className="p-3 font-semibold min-w-[110px] text-center">6 SETT.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {program.days.map((day) => (
                <React.Fragment key={day.id}>
                  {/* Day Banner Row */}
                  <tr className="bg-amber-500/15 text-amber-300 font-bold">
                    <td colSpan={8} className="p-3 uppercase tracking-wider text-xs font-sans">
                      {day.title} — {day.subtitle}
                    </td>
                  </tr>

                  {/* Day Exercise Rows */}
                  {day.exercises.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-white font-sans">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            ex.sectionType === 'progressione' ? 'bg-emerald-400' :
                            ex.sectionType === 'cedimento' ? 'bg-amber-400' : 'bg-indigo-400'
                          }`} />
                          <span>{ex.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 italic text-[11px]">
                        {ex.note || '—'}
                      </td>
                      <td className="p-3 text-center bg-slate-900/40 font-bold text-slate-200">
                        {ex.weeks[1]}
                      </td>
                      <td className="p-3 text-center">
                        {ex.weeks[2]}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-400 bg-amber-500/5">
                        {ex.weeks[3]}
                      </td>
                      <td className="p-3 text-center">
                        {ex.weeks[4]}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-400 bg-amber-500/5">
                        {ex.weeks[5]}
                      </td>
                      <td className="p-3 text-center">
                        {ex.weeks[6]}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Guidelines Rows */}
              <tr className="bg-slate-950 font-bold text-slate-200">
                <td colSpan={8} className="p-3 font-sans">MODALITÀ D'ESECUZIONE</td>
              </tr>
              {program.guidelines.modalitaEsecuzione.map((m, idx) => (
                <tr key={idx} className="text-slate-400 text-xs">
                  <td colSpan={8} className="p-2.5 pl-6 font-sans">• {m}</td>
                </tr>
              ))}

              <tr className="bg-slate-950 font-bold text-slate-200">
                <td colSpan={8} className="p-3 font-sans">PROGRESSIONE</td>
              </tr>
              <tr className="text-slate-400 text-xs">
                <td colSpan={8} className="p-2.5 pl-6 font-sans">• {program.guidelines.progressione}</td>
              </tr>

              <tr className="bg-slate-950 font-bold text-slate-200">
                <td colSpan={8} className="p-3 font-sans">CEDIMENTO</td>
              </tr>
              <tr className="text-slate-400 text-xs">
                <td colSpan={8} className="p-2.5 pl-6 font-sans">• {program.guidelines.cedimento}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
