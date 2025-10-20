# 📋 Deployment-Checkliste

## Vorbereitung (Lokal)

- [x] Build erstellt (`npm run build`) ✅
- [x] nginx.conf mit API-Proxy aktualisiert ✅
- [x] server.js mit allen API-Endpunkten ✅
- [ ] Server-Daten in `deploy.ps1` eingetragen (SERVER_USER, SERVER_HOST)

## Auf dem Server

### Erste Installation (nur einmalig)

- [ ] Node.js 18+ installiert
- [ ] nginx installiert
- [ ] PM2 installiert (`npm install -g pm2`)
- [ ] Projektverzeichnis erstellt (`/var/www/office-plan/`)
- [ ] Berechtigungen gesetzt

### Bei jedem Update

- [ ] Dateien auf Server hochgeladen:
  - [ ] `build/` Ordner
  - [ ] `server.js`
  - [ ] `package.json`
  - [ ] `nginx.conf`
- [ ] Dependencies installiert (`npm install --production`)
- [ ] nginx-Konfiguration aktualisiert:
  - [ ] `sudo cp nginx.conf /etc/nginx/sites-available/office-plan`
  - [ ] Domain angepasst (falls nötig)
  - [ ] Symlink erstellt (falls erste Installation)
  - [ ] `sudo nginx -t` erfolgreich
  - [ ] `sudo systemctl reload nginx` ausgeführt
- [ ] Node.js-Server gestartet/neu gestartet:
  - [ ] `pm2 restart office-plan-api` oder `pm2 start server.js --name office-plan-api`
  - [ ] `pm2 save` ausgeführt
  - [ ] `pm2 startup` konfiguriert (nur bei erster Installation)

## Verifikation

- [ ] Server läuft: `pm2 status` zeigt "online"
- [ ] nginx läuft: `sudo systemctl status nginx` zeigt "active"
- [ ] Port 8080 offen: `sudo netstat -tulpn | grep 8080`
- [ ] API erreichbar: `curl http://localhost:8080/api/employees` gibt JSON zurück
- [ ] Frontend erreichbar: Browser zeigt die App
- [ ] API funktioniert: Mitarbeiter können hinzugefügt werden
- [ ] Daten werden gespeichert: Seite neu laden, Daten sind noch da
- [ ] Keine Fehler in Browser-Konsole (F12)

## Firewall (falls UFW aktiv)

- [ ] Port 80 offen: `sudo ufw allow 'Nginx Full'`
- [ ] Port 8080 offen: `sudo ufw allow 8080/tcp`

## Optional: SSL/HTTPS

- [ ] Certbot installiert
- [ ] SSL-Zertifikat erstellt: `sudo certbot --nginx -d deine-domain.com`
- [ ] Automatische Erneuerung getestet: `sudo certbot renew --dry-run`

## Backup

- [ ] Backup-Verzeichnis erstellt: `/var/www/office-plan/backups/`
- [ ] Cronjob für tägliches Backup eingerichtet
- [ ] Erstes manuelles Backup erstellt

## Troubleshooting-Befehle

Falls Probleme auftreten:

```bash
# Logs anzeigen
pm2 logs office-plan-api
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Status prüfen
pm2 status
sudo systemctl status nginx
sudo netstat -tulpn | grep 8080

# API testen
curl http://localhost:8080/api/employees
curl http://localhost:8080/api/departments
curl http://localhost:8080/api/attendance

# Server neu starten
pm2 restart office-plan-api
sudo systemctl restart nginx

# Berechtigungen prüfen
ls -la /var/www/office-plan/
ls -la /var/www/office-plan/data.json
```

## Nach erfolgreichem Deployment

✅ App ist live unter: `http://deine-domain.com` oder `http://deine-server-ip`
✅ Alle Benutzer sehen die gleichen Daten
✅ Daten werden zentral gespeichert
✅ API funktioniert korrekt

---

**Datum des letzten Deployments:** _________________

**Notizen:**

