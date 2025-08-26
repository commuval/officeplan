# Büroplan - Anwesenheitsverwaltung

Eine moderne Webanwendung zur Verwaltung der Mitarbeiteranwesenheit in Unternehmen. Die Anwendung bietet eine intuitive Benutzeroberfläche für die Planung und Übersicht der Büroanwesenheit.

## Features

### 📅 Kalender-Übersicht
- Wochenansicht der Mitarbeiteranwesenheit
- Farbcodierte Status-Anzeige (Anwesend, Remote, Urlaub, Krank, Abwesend)
- Einfache Navigation zwischen Wochen
- Schnelle Eintragung neuer Anwesenheitsdaten

### 👥 Mitarbeiterverwaltung
- Vollständige CRUD-Operationen für Mitarbeiter
- Abteilungszuordnung
- Übersichtliche Mitarbeiterliste mit Statistiken
- E-Mail-Verwaltung

### ⚙️ Einstellungen
- Abteilungsverwaltung mit individuellen Farben
- Datenexport und -import (JSON-Format)
- Systeminformationen
- Daten zurücksetzen

### 🎨 Modernes UI
- Responsive Design für alle Geräte
- Intuitive Benutzeroberfläche
- Professionelles Design mit Tailwind CSS
- Deutsche Lokalisierung

## Technologie-Stack

- **Frontend**: React 18 mit TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Datum/Zeit**: date-fns
- **Speicherung**: LocalStorage

## Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm start
   ```

3. **Anwendung öffnen:**
   Die Anwendung ist unter `http://localhost:3000` verfügbar.

## Verwendung

### Kalender-Ansicht
- Navigieren Sie zwischen Wochen mit den Pfeiltasten
- Klicken Sie auf "Eintrag hinzufügen" um neue Anwesenheitsdaten zu erfassen
- Wählen Sie Mitarbeiter und Status aus
- Die Anwesenheit wird farbcodiert angezeigt

### Mitarbeiterverwaltung
- Fügen Sie neue Mitarbeiter hinzu
- Bearbeiten Sie bestehende Mitarbeiterdaten
- Löschen Sie Mitarbeiter (mit Bestätigung)
- Sehen Sie Statistiken über Ihre Mitarbeiter

### Einstellungen
- Verwalten Sie Abteilungen mit individuellen Farben
- Exportieren Sie Daten für Backup-Zwecke
- Importieren Sie Daten aus JSON-Dateien
- Setzen Sie alle Daten zurück (Vorsicht!)

## Anwesenheitsstatus

- **🟢 Anwesend**: Mitarbeiter ist im Büro
- **🔵 Remote**: Mitarbeiter arbeitet von zu Hause
- **🟡 Urlaub**: Mitarbeiter ist im Urlaub
- **🔴 Krank**: Mitarbeiter ist krank
- **⚫ Abwesend**: Mitarbeiter ist abwesend (ohne Angabe)

## Datenstruktur

Die Anwendung speichert Daten im LocalStorage des Browsers:

- **Mitarbeiter**: Name, E-Mail, Abteilung
- **Abteilungen**: Name, Farbe
- **Anwesenheit**: Mitarbeiter-ID, Datum, Status, optional: Start-/Endzeit, Notizen

## Entwicklung

### Projektstruktur
```
src/
├── components/          # React-Komponenten
│   ├── Header.tsx      # Navigation und Header
│   ├── AttendanceCalendar.tsx  # Kalender-Ansicht
│   ├── EmployeeManagement.tsx  # Mitarbeiterverwaltung
│   └── Settings.tsx    # Einstellungen
├── types/              # TypeScript-Typen
│   └── index.ts
├── utils/              # Hilfsfunktionen
│   └── storage.ts      # LocalStorage-Verwaltung
├── App.tsx             # Hauptkomponente
├── index.tsx           # Einstiegspunkt
└── index.css           # Styles
```

### Build für Produktion
```bash
npm run build
```

## 🚀 Deployment auf DigitalOcean

### Voraussetzungen
- Node.js 16+ installiert
- npm installiert
- DigitalOcean Droplet mit Ubuntu

### Deployment-Schritte

1. **Lokaler Build:**
   ```bash
   npm install
   npm run build
   ```

2. **Dateien auf Server kopieren:**
   ```bash
   # Ersetzen Sie 'your-server' mit Ihrer Server-IP
   rsync -avz --delete build/ root@your-server:/var/www/office-plan/build/
   rsync -avz nginx.conf root@your-server:/etc/nginx/sites-available/office-plan
   ```

3. **Nginx konfigurieren:**
   ```bash
   ssh root@your-server
   sudo ln -sf /etc/nginx/sites-available/office-plan /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Server starten:**
   ```bash
   # Auf dem Server
   cd /var/www/office-plan
   npm install
   pm2 start server.js --name "office-plan"
   ```

### Troubleshooting

**Problem: Status "Mit Hund" funktioniert nicht**
- Öffnen Sie die Browser-Konsole (F12)
- Prüfen Sie die Debug-Logs
- Stellen Sie sicher, dass localStorage verfügbar ist

**Problem: Anwendung lädt nicht**
- Prüfen Sie die nginx-Logs: `sudo tail -f /var/log/nginx/error.log`
- Prüfen Sie die Server-Logs: `pm2 logs office-plan`

**Problem: Cache-Probleme**
- Leeren Sie den Browser-Cache
- Prüfen Sie die nginx-Cache-Einstellungen
- Verwenden Sie Hard-Refresh (Ctrl+F5)

### Browser-Kompatibilität
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Debug-Modus
Die Anwendung enthält umfangreiche Debug-Logs. Öffnen Sie die Browser-Konsole (F12) um diese zu sehen.

## Lizenz

MIT License - Siehe LICENSE-Datei für Details.

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository oder kontaktieren Sie das Entwicklungsteam.

---

**Entwickelt mit ❤️ für moderne Büroplanung**

