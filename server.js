const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 8080;

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
  employees: [
    { id: '1', name: 'Max Mustermann', department: 'IT' },
    { id: '2', name: 'Anna Schmidt', department: 'Marketing' },
    { id: '3', name: 'Tom Weber', department: 'Vertrieb' },
    { id: '4', name: 'Lisa Müller', department: 'HR' },
    { id: '5', name: 'Peter Fischer', department: 'Finanzen' },
  ],
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
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Keine Daten-Datei gefunden, erstelle Standard-Daten');
    await writeData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

async function writeData(data) {
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
