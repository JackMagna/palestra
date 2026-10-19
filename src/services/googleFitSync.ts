// Google Fit & Android Health Connect cloud synchronization service
// Google Fit REST API: https://www.googleapis.com/fitness/v1/users/me/sessions
// ActivityType 97 = Strength training (Sollevamento pesi / Palestra)

export interface GoogleFitSessionPayload {
  sessionId: string;
  name: string;
  description: string;
  startTimeMillis: number;
  endTimeMillis: number;
  totalVolumeKg: number;
  totalSets: number;
}

export async function syncWorkoutToGoogleFit(
  accessToken: string,
  session: GoogleFitSessionPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const url = `https://www.googleapis.com/fitness/v1/users/me/sessions/${session.sessionId}`;

    const body = {
      id: session.sessionId,
      name: session.name,
      description: `${session.description} - Volume totale: ${session.totalVolumeKg} kg, ${session.totalSets} serie completate.`,
      startTimeMillis: session.startTimeMillis,
      endTimeMillis: session.endTimeMillis,
      application: {
        name: 'IronTrack Gym Companion',
        version: '1.0'
      },
      activityType: 97 // Strength Training
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Google Fit API sync warning:', errText);
      return { success: false, error: errText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    console.error('Google Fit sync exception:', err);
    return { success: false, error: err.message || 'Errore di connessione a Google Fit' };
  }
}
