import type { WorkoutSession } from '../types';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * File TCX della sessione, importabile in Strava, Garmin Connect e altre app.
 * Sostituisce la vecchia sincronizzazione con le API di Google Fit, dismesse da Google.
 */
export function sessionToTCX(session: WorkoutSession): string {
  const start = new Date(session.startedAt || Date.parse(session.date)).toISOString();
  const seconds = Math.max(60, Math.round((session.endedAt - session.startedAt) / 1000) || session.durationMinutes * 60);
  const notes = `${session.dayTitle}, settimana ${session.weekNumber}. ${session.sets.length} serie, ${session.totalVolumeKg} kg di volume.`;
  const hr = session.avgBpm
    ? `\n        <AverageHeartRateBpm><Value>${Math.round(session.avgBpm)}</Value></AverageHeartRateBpm>` +
      (session.maxBpm ? `\n        <MaximumHeartRateBpm><Value>${Math.round(session.maxBpm)}</Value></MaximumHeartRateBpm>` : '')
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>${start}</Id>
      <Lap StartTime="${start}">
        <TotalTimeSeconds>${seconds}</TotalTimeSeconds>
        <DistanceMeters>0</DistanceMeters>
        <Calories>0</Calories>${hr}
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
      </Lap>
      <Notes>${esc(notes)}</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;
}
