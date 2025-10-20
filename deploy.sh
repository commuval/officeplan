#!/bin/bash

# Deployment-Skript für Büroplanner
# Verwendung: ./deploy.sh

echo "🚀 Starte Deployment..."

# Konfiguration (ANPASSEN!)
SERVER_USER="dein-benutzer"
SERVER_HOST="deine-server-ip"
SERVER_PATH="/var/www/office-plan"

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob Build-Ordner existiert
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build-Ordner nicht gefunden. Führe 'npm run build' aus.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Übertrage Dateien auf den Server...${NC}"

# Dateien auf den Server kopieren
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'src' \
    --exclude '.env' \
    build/ \
    server.js \
    package.json \
    package-lock.json \
    nginx.conf \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Fehler beim Übertragen der Dateien${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dateien erfolgreich übertragen${NC}"

echo -e "${YELLOW}🔧 Führe Server-Befehle aus...${NC}"

# SSH-Befehle auf dem Server ausführen
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
    cd /var/www/office-plan
    
    echo "📦 Installiere Dependencies..."
    npm install --production
    
    echo "🔄 Aktualisiere nginx-Konfiguration..."
    sudo cp nginx.conf /etc/nginx/sites-available/office-plan
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ nginx-Konfiguration gültig"
        sudo systemctl reload nginx
        echo "✅ nginx neu geladen"
    else
        echo "❌ nginx-Konfiguration fehlerhaft"
        exit 1
    fi
    
    echo "🔄 Starte Node.js-Server neu..."
    pm2 restart office-plan-api || pm2 start server.js --name office-plan-api
    pm2 save
    
    echo "📊 Server-Status:"
    pm2 status
    
    echo "✅ Deployment abgeschlossen!"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment erfolgreich abgeschlossen!${NC}"
    echo -e "${GREEN}Die App ist jetzt live unter: http://${SERVER_HOST}${NC}"
else
    echo -e "${RED}❌ Fehler beim Deployment${NC}"
    exit 1
fi
