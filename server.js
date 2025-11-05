const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 8080;

// Backup-Verzeichnis
const BACKUP_DIR = path.join(__dirname, 'backups');

// Middleware für JSON-Parsing
app.use(express.json());

// CORS für lokale Entwicklung
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Pfad zur JSON-Datei
const DATA_FILE = path.join(__dirname, 'data.json');

// Standard-Daten
const DEFAULT_DATA = {
  employees: [],
  departments: [
    { id: '1', name: 'IT', color: '#3b82f6' },
    { id: '2', name: 'Marketing', color: '#10b981' },
    { id: '3', name: 'Vertrieb', color: '#f59e0b' },
    { id: '4', name: 'HR', color: '#8b5cf6' },
    { id: '5', name: 'Finanzen', color: '#ef4444' },
  ],
  attendance: []
};

// Hilfsfunktionen für JSON-Datei
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    // Verzeichnis existiert bereits oder kann nicht erstellt werden
    console.log('Backup-Verzeichnis prüfen:', error.message);
  }
}

async function createBackup(data) {
  try {
    await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `data-backup-${timestamp}.json`);
    await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
    console.log(`Backup erstellt: ${backupFile}`);
    
    // Alte Backups löschen (nur die letzten 10 behalten)
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files
        .filter(f => f.startsWith('data-backup-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(BACKUP_DIR, f),
          time: fs.stat(path.join(BACKUP_DIR, f)).then(s => s.mtime)
        }));
      
      const sortedFiles = await Promise.all(backupFiles.map(async f => ({
        ...f,
        time: await f.time
      })));
      
      sortedFiles.sort((a, b) => b.time - a.time);
      
      // Alte Backups löschen (mehr als 10 behalten)
      for (let i = 10; i < sortedFiles.length; i++) {
        await fs.unlink(sortedFiles[i].path);
        console.log(`Altes Backup gelöscht: ${sortedFiles[i].name}`);
      }
    } catch (err) {
      console.log('Fehler beim Bereinigen alter Backups:', err.message);
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des Backups:', error);
  }
}

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Prüfen ob die Datei wirklich Daten enthält oder nur Standard-Daten sind
    if (parsed.attendance && parsed.attendance.length > 0) {
      return parsed;
    }
    if (parsed.employees && parsed.employees.length > 0) {
      return parsed;
    }
    return parsed;
  } catch (error) {
    console.log('Keine Daten-Datei gefunden, prüfe Backups...');
    
    // Versuche das neueste Backup wiederherzustellen
    try {
      await ensureBackupDir();
      const files = await fs.readdir(BACKUP_DIR);
      const backupFiles = files
        .filter(f => f.startsWith('data-backup-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(BACKUP_DIR, f),
          time: fs.stat(path.join(BACKUP_DIR, f)).then(s => s.mtime)
        }));
      
      if (backupFiles.length > 0) {
        const sortedFiles = await Promise.all(backupFiles.map(async f => ({
          ...f,
          time: await f.time
        })));
        
        sortedFiles.sort((a, b) => b.time - a.time);
        const latestBackup = sortedFiles[0];
        
        console.log(`Wiederherstelle Daten aus Backup: ${latestBackup.name}`);
        const backupData = await fs.readFile(latestBackup.path, 'utf8');
        const parsed = JSON.parse(backupData);
        await writeData(parsed);
        return parsed;
      }
    } catch (backupError) {
      console.log('Keine Backups gefunden oder Fehler beim Wiederherstellen:', backupError.message);
    }
    
    console.log('Erstelle neue Standard-Daten');
    await writeData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

async function writeData(data) {
  // Backup erstellen vor dem Schreiben (nur wenn Daten vorhanden sind)
  try {
    const existingData = await fs.readFile(DATA_FILE, 'utf8').catch(() => null);
    if (existingData) {
      const parsed = JSON.parse(existingData);
      // Nur Backup erstellen wenn es bereits Daten gibt
      if (parsed.attendance && parsed.attendance.length > 0 || 
          parsed.employees && parsed.employees.length > 0) {
        await createBackup(parsed);
      }
    }
  } catch (error) {
    // Fehler beim Backup ignorieren, nicht kritisch
  }
  
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// API-Endpunkte

// Mitarbeiter
app.get('/api/employees', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.employees);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Mitarbeiter' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const data = await readData();
    const newEmployee = {
      id: Date.now().toString(),
      ...req.body
    };
    data.employees.push(newEmployee);
    await writeData(data);
    res.json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Hinzufügen des Mitarbeiters' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const data = await readData();
    const employeeIndex = data.employees.findIndex(emp => emp.id === req.params.id);
    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }
    data.employees[employeeIndex] = { ...data.employees[employeeIndex], ...req.body };
    await writeData(data);
    res.json(data.employees[employeeIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Mitarbeiters' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const data = await readData();
    data.employees = data.employees.filter(emp => emp.id !== req.params.id);
    // Auch Anwesenheitsdaten des Mitarbeiters löschen
    data.attendance = data.attendance.filter(entry => entry.employeeId !== req.params.id);
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen des Mitarbeiters' });
  }
});

// Abteilungen
app.get('/api/departments', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.departments);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Abteilungen' });
  }
});

// Anwesenheit
app.get('/api/attendance', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.attendance);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Anwesenheitsdaten' });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const data = await readData();
    const newEntry = req.body;
    
    // Prüfen ob Eintrag für diesen Mitarbeiter und Tag bereits existiert
    const existingIndex = data.attendance.findIndex(
      entry => entry.employeeId === newEntry.employeeId && entry.date === newEntry.date
    );
    
    if (existingIndex >= 0) {
      data.attendance[existingIndex] = newEntry;
    } else {
      data.attendance.push(newEntry);
    }
    
    await writeData(data);
    res.json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Speichern der Anwesenheit' });
  }
});

app.delete('/api/attendance/:employeeId/:date', async (req, res) => {
  try {
    const data = await readData();
    const { employeeId, date } = req.params;
    
    // Eintrag für diesen Mitarbeiter und Tag finden und entfernen
    data.attendance = data.attendance.filter(
      entry => !(entry.employeeId === employeeId && entry.date === date)
    );
    
    await writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen der Anwesenheit' });
  }
});

// Statische Dateien aus dem build-Ordner servieren
app.use(express.static(path.join(__dirname, 'build')));

// Alle anderen Routen auf index.html umleiten (für React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`API-Endpunkte verfügbar unter http://localhost:${PORT}/api/`);
});
