# Schnelle Deployment-Anleitung

## ✅ Build ist fertig!

Der Build wurde bereits erstellt und liegt im `build`-Ordner.

## 📋 Was du jetzt tun musst:

### Option 1: Automatisches Deployment (Empfohlen)

1. **Öffne `deploy.ps1` und passe die Server-Daten an:**
   ```powershell
   $SERVER_USER = "dein-ssh-benutzer"     # z.B. "root" oder "ubuntu"
   $SERVER_HOST = "deine-server-ip"       # z.B. "123.456.789.0" oder "deine-domain.com"
   $SERVER_PATH = "/var/www/office-plan"  # Pfad auf dem Server
   ```

2. **Führe das Deployment-Skript aus:**
   ```powershell
   .\deploy.ps1
   ```

3. **Fertig!** Die App wird automatisch auf den Server hochgeladen und konfiguriert.

---

### Option 2: Manuelles Deployment

#### Schritt 1: Dateien auf den Server hochladen

Lade folgende Dateien/Ordner auf deinen Server (nach `/var/www/office-plan/`):

- ✅ `build/` (kompletter Ordner)
- ✅ `server.js`
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `nginx.conf`

**Tools zum Hochladen:**
- WinSCP (https://winscp.net/)
- FileZilla (https://filezilla-project.org/)
- SCP via PowerShell: `scp -r build server.js package.json nginx.conf benutzer@server-ip:/var/www/office-plan/`

#### Schritt 2: Auf dem Server per SSH verbinden

```bash
ssh benutzer@server-ip
cd /var/www/office-plan
```

#### Schritt 3: Dependencies installieren

```bash
npm install --production
```

#### Schritt 4: nginx-Konfiguration aktualisieren

```bash
# Konfiguration kopieren
sudo cp nginx.conf /etc/nginx/sites-available/office-plan

# Domain anpassen (falls noch nicht geschehen)
sudo nano /etc/nginx/sites-available/office-plan
# Ändere "your-domain.com" zu deiner echten Domain

# Symlink erstellen (falls noch nicht vorhanden)
sudo ln -s /etc/nginx/sites-available/office-plan /etc/nginx/sites-enabled/

# Konfiguration testen
sudo nginx -t

# nginx neu laden
sudo systemctl reload nginx
```

#### Schritt 5: Node.js-Server neu starten

```bash
# Wenn der Server bereits läuft:
pm2 restart office-plan-api

# Wenn der Server noch nicht läuft:
pm2 start server.js --name office-plan-api
pm2 save
pm2 startup  # Für automatischen Start beim Booten
```

#### Schritt 6: Status prüfen

```bash
# Server-Status anzeigen
pm2 status

# Logs anzeigen
pm2 logs office-plan-api

# nginx-Status
sudo systemctl status nginx
```

---

## 🔍 Problem-Prüfung

### API funktioniert nicht?

```bash
# Prüfe ob Node.js-Server läuft
pm2 status

# Prüfe ob Port 8080 offen ist
sudo netstat -tulpn | grep 8080

# API direkt testen
curl http://localhost:8080/api/employees
```

### nginx-Fehler?

```bash
# nginx-Logs anzeigen
sudo tail -f /var/log/nginx/error.log

# nginx-Konfiguration testen
sudo nginx -t
```

### Datenbank-Fehler?

```bash
# Prüfe ob data.json existiert
ls -la /var/www/office-plan/data.json

# Falls nicht, wird sie beim ersten API-Aufruf automatisch erstellt
```

---

## 📝 Wichtige Hinweise

1. **Node.js-Server MUSS laufen** auf Port 8080
2. **nginx MUSS die neue Konfiguration** haben (mit API-Proxy)
3. **Firewall** muss Port 80 (HTTP) und Port 8080 (Node.js) erlauben
4. **Domain** in der nginx.conf anpassen (falls du eine Domain verwendest)

---

## 🎉 Nach dem Deployment

Öffne deine Domain/IP im Browser:
- `http://deine-domain.com` oder
- `http://deine-server-ip`

Die App sollte jetzt funktionieren und Daten speichern können!

---

## 📞 Hilfe benötigt?

Wenn Fehler auftreten:
1. Prüfe die Logs: `pm2 logs office-plan-api`
2. Prüfe nginx-Logs: `sudo tail -f /var/log/nginx/error.log`
3. Teste die API direkt: `curl http://localhost:8080/api/employees`

