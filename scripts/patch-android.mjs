// Prepara il progetto Android generato da "npx cap add android":
// permessi di Health Connect, schermata dei motivi dei permessi, versione minima di Android.
// Si lancia nel workflow GitHub (vedi .github/workflows/android.yml).
import { readFileSync, writeFileSync } from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let m = readFileSync(manifestPath, 'utf8');

const perms = ['READ_WEIGHT', 'WRITE_WEIGHT', 'READ_BODY_FAT', 'WRITE_BODY_FAT', 'READ_HEART_RATE', 'READ_HEALTH_DATA_HISTORY'];
const lines = perms
  .filter((p) => !m.includes(`android.permission.health.${p}`))
  .map((p) => `    <uses-permission android:name="android.permission.health.${p}" />`)
  .join('\n');
if (lines) m = m.replace(/<application/, `${lines}\n\n    <application`);

// Health Connect chiede all'app di mostrare i motivi dei permessi
if (!m.includes('androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE')) {
  m = m.replace(
    /(<activity[\s\S]*?android:name="\.MainActivity"[\s\S]*?>)/,
    `$1\n            <intent-filter>\n                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />\n            </intent-filter>`
  );
}
// per vedere se Health Connect è installato (Android 11+)
if (!m.includes('com.google.android.apps.healthdata')) {
  m = m.replace(/<application/, `<queries>\n        <package android:name="com.google.android.apps.healthdata" />\n    </queries>\n\n    <application`);
}
writeFileSync(manifestPath, m);

// Health Connect richiede Android 8 (API 26) o più recente
const varsPath = 'android/variables.gradle';
let v = readFileSync(varsPath, 'utf8');
v = v.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26');
writeFileSync(varsPath, v);
console.log('Progetto Android preparato.');
