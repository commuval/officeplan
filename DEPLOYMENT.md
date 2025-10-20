# Deployment-Anleitung für Büroplanner

## Voraussetzungen

- Linux-Server (Ubuntu/Debian empfohlen)
- Node.js 18+ installiert
- nginx installiert
- PM2 (Process Manager) installiert: `npm install -g pm2`

## Schritt-für-Schritt Deployment

### 1. Code auf den Server kopieren

```bash
# Projekt auf den Server hochladen (z.B. via SCP, Git, oder FTP)
# Zielverzeichnis: /var/www/office-plan/
```

### 2. Dependencies installieren und Build erstellen

```bash
cd /var/www/office-plan
npm install
npm run build
```

### 3. Node.js-Server mit PM2 starten

```bash
# Server starten
pm2 start server.js --name office-plan-api

# Beim Systemstart automatisch starten
pm2 startup
pm2 save
```

### 4. nginx konfigurieren

```bash
# nginx-Konfiguration kopieren
sudo cp nginx.conf /etc/nginx/sites-available/office-plan

# Domain/Server-Name anpassen
sudo nano /etc/nginx/sites-available/office-plan
# Ersetze "your-domain.com" durch deine tatsächliche Domain

# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/office-plan /etc/nginx/sites-enabled/

# nginx-Konfiguration testen
sudo nginx -t

# nginx neu laden
sudo systemctl reload nginx
```

### 5. Firewall-Einstellungen (falls UFW aktiv)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 8080/tcp  # Für Node.js-Backend
```

### 6. Deployment verifizieren

```bash
# Überprüfe ob der Node.js-Server läuft
pm2 status

# Überprüfe nginx-Status
sudo systemctl status nginx

# Logs anzeigen
pm2 logs office-plan-api
```

## Updates deployen

```bash
cd /var/www/office-plan

# Code aktualisieren (z.B. via Git)
git pull

# Dependencies aktualisieren
npm install

# Neuen Build erstellen
npm run build

# Node.js-Server neu starten
pm2 restart office-plan-api

# nginx neu laden (nur wenn nginx.conf geändert wurde)
sudo systemctl reload nginx
```

## Wichtige Dateien und Verzeichnisse

- `/var/www/office-plan/build/` - React-Frontend (statische Dateien)
- `/var/www/office-plan/server.js` - Node.js-Backend
- `/var/www/office-plan/data.json` - Datenbank-Datei (automatisch erstellt)
- `/etc/nginx/sites-available/office-plan` - nginx-Konfiguration

## Backup der Daten

```bash
# Datenbank sichern
cp /var/www/office-plan/data.json /var/www/office-plan/data.json.backup

# Automatisches tägliches Backup einrichten (Cronjob)
sudo crontab -e

# Folgende Zeile hinzufügen:
# 0 2 * * * cp /var/www/office-plan/data.json /var/www/office-plan/backups/data-$(date +\%Y\%m\%d).json
```

## Problembehandlung

### Server startet nicht

```bash
# Logs prüfen
pm2 logs office-plan-api

# Server manuell testen
cd /var/www/office-plan
node server.js
```

### API-Anfragen schlagen fehl

```bash
# Überprüfe ob Port 8080 offen ist
sudo netstat -tulpn | grep 8080

# nginx-Logs prüfen
sudo tail -f /var/log/nginx/error.log

# API direkt testen
curl http://localhost:8080/api/employees
```

### Daten werden nicht gespeichert

```bash
# Berechtigungen prüfen
ls -la /var/www/office-plan/data.json

# Falls nötig, Berechtigungen setzen
sudo chown www-data:www-data /var/www/office-plan/data.json
sudo chmod 644 /var/www/office-plan/data.json
```

## SSL/HTTPS einrichten (optional, empfohlen)

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d deine-domain.com

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

## Monitoring

```bash
# PM2-Web-Interface (optional)
pm2 web

# Monitoring-Dashboard
pm2 monit

# Logs in Echtzeit anzeigen
pm2 logs office-plan-api --lines 100
```

