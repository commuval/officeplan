# Deployment-Skript für Büroplanner (Windows PowerShell)
# Verwendung: .\deploy.ps1

Write-Host "🚀 Starte Deployment..." -ForegroundColor Green

# Konfiguration (ANPASSEN!)
$SERVER_USER = "dein-benutzer"
$SERVER_HOST = "deine-server-ip"
$SERVER_PATH = "/var/www/office-plan"
$SERVER = "${SERVER_USER}@${SERVER_HOST}"

# Prüfe ob Build-Ordner existiert
if (-not (Test-Path "build")) {
    Write-Host "❌ Build-Ordner nicht gefunden. Führe 'npm run build' aus." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Übertrage Dateien auf den Server..." -ForegroundColor Yellow

# Prüfe ob SCP/SSH verfügbar ist (OpenSSH sollte in Windows 10/11 dabei sein)
$scpAvailable = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpAvailable) {
    Write-Host "❌ SCP nicht gefunden. Bitte OpenSSH installieren oder WinSCP verwenden." -ForegroundColor Red
    Write-Host "Alternative: Dateien manuell mit WinSCP, FileZilla oder einem anderen FTP-Client hochladen." -ForegroundColor Yellow
    exit 1
}

# Erstelle temporäres Verzeichnis für Deployment
$tempDir = Join-Path $env:TEMP "office-plan-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Kopiere notwendige Dateien
Copy-Item -Path "build" -Destination $tempDir -Recurse
Copy-Item -Path "server.js" -Destination $tempDir
Copy-Item -Path "package.json" -Destination $tempDir
Copy-Item -Path "package-lock.json" -Destination $tempDir
Copy-Item -Path "nginx.conf" -Destination $tempDir

Write-Host "Übertrage: build/" -ForegroundColor Gray
scp -r "build\*" "${SERVER}:${SERVER_PATH}/build/"

Write-Host "Übertrage: server.js, package.json, nginx.conf" -ForegroundColor Gray
scp "server.js" "${SERVER}:${SERVER_PATH}/"
scp "package.json" "${SERVER}:${SERVER_PATH}/"
scp "package-lock.json" "${SERVER}:${SERVER_PATH}/"
scp "nginx.conf" "${SERVER}:${SERVER_PATH}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fehler beim Übertragen der Dateien" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dateien erfolgreich übertragen" -ForegroundColor Green

Write-Host "🔧 Führe Server-Befehle aus..." -ForegroundColor Yellow

# SSH-Befehle auf dem Server ausführen
$sshCommands = @"
cd ${SERVER_PATH}
echo '📦 Installiere Dependencies...'
npm install --production
echo '🔄 Aktualisiere nginx-Konfiguration...'
sudo cp nginx.conf /etc/nginx/sites-available/office-plan
sudo nginx -t && sudo systemctl reload nginx
echo '🔄 Starte Node.js-Server neu...'
pm2 restart office-plan-api || pm2 start server.js --name office-plan-api
pm2 save
echo '📊 Server-Status:'
pm2 status
echo '✅ Deployment abgeschlossen!'
"@

ssh $SERVER $sshCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host "Die App ist jetzt live unter: http://${SERVER_HOST}" -ForegroundColor Green
} else {
    Write-Host "❌ Fehler beim Deployment" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $tempDir -Recurse -Force

