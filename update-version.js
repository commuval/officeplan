const fs = require('fs');
const path = require('path');

// Aktuelles Datum und Zeit im Format YYYY-MM-DD-HHMM
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const newVersion = `${year}-${month}-${day}-${hours}${minutes}`;

// Pfad zur config.ts Datei
const configPath = path.join(__dirname, 'src', 'config.ts');

// Datei lesen
let configContent = fs.readFileSync(configPath, 'utf8');

// Version ersetzen
configContent = configContent.replace(
  /export const DATA_VERSION = '[\d-]+';/,
  `export const DATA_VERSION = '${newVersion}';`
);

// Datei schreiben
fs.writeFileSync(configPath, configContent);

console.log(`✅ DATA_VERSION wurde auf '${newVersion}' aktualisiert`);
console.log('📝 Bitte committen Sie diese Änderung vor dem Deployment');
