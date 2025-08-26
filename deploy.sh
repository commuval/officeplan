#!/bin/bash

echo "🚀 Starte Deployment..."

# Build der Anwendung
echo "📦 Baue Anwendung..."
npm run build

# Prüfe ob Build erfolgreich war
if [ ! -d "build" ]; then
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi

echo "✅ Build erfolgreich!"

# Kopiere Dateien auf Server (ersetzen Sie die Pfade entsprechend)
echo "📤 Kopiere Dateien auf Server..."
# rsync -avz --delete build/ user@your-server:/var/www/office-plan/build/
# rsync -avz --delete nginx.conf user@your-server:/etc/nginx/sites-available/office-plan

# Oder für lokales Testing
echo "📁 Dateien bereit für Upload:"
echo "   - build/ Ordner"
echo "   - nginx.conf"
echo "   - server.js"

echo "🔄 Starte Server neu..."
# ssh user@your-server "sudo systemctl reload nginx"

echo "✅ Deployment abgeschlossen!"
echo "🌐 Öffnen Sie die Website und prüfen Sie die Browser-Konsole (F12)"
