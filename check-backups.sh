#!/bin/bash
# Skript zum Prüfen und Wiederherstellen von Backups auf dem Server

SERVER_PATH="/var/www/office-plan"
BACKUP_DIR="${SERVER_PATH}/backups"

echo "🔍 Suche nach Backups auf dem Server..."
echo ""

# Prüfe ob Backup-Verzeichnis existiert
if [ -d "$BACKUP_DIR" ]; then
    echo "✅ Backup-Verzeichnis gefunden: $BACKUP_DIR"
    echo ""
    
    # Liste alle Backups
    BACKUPS=$(ls -t ${BACKUP_DIR}/data-backup-*.json 2>/dev/null)
    
    if [ -z "$BACKUPS" ]; then
        echo "❌ Keine Backups gefunden"
    else
        echo "📦 Gefundene Backups:"
        echo ""
        COUNT=1
        for backup in $BACKUPS; do
            SIZE=$(du -h "$backup" | cut -f1)
            DATE=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "  $COUNT. $(basename $backup)"
            echo "     Größe: $SIZE"
            echo "     Datum: $DATE"
            echo ""
            COUNT=$((COUNT + 1))
        done
        
        echo ""
        echo "💡 Zum Wiederherstellen eines Backups:"
        echo "   cp ${BACKUP_DIR}/data-backup-*.json ${SERVER_PATH}/data.json"
    fi
else
    echo "❌ Backup-Verzeichnis nicht gefunden: $BACKUP_DIR"
fi

echo ""
echo "🔍 Prüfe auch nach alten data.json Dateien..."
if [ -f "${SERVER_PATH}/data.json" ]; then
    SIZE=$(du -h "${SERVER_PATH}/data.json" | cut -f1)
    DATE=$(stat -c %y "${SERVER_PATH}/data.json" | cut -d' ' -f1,2 | cut -d'.' -f1)
    echo "✅ data.json gefunden:"
    echo "   Größe: $SIZE"
    echo "   Datum: $DATE"
    echo ""
    
    # Prüfe ob Datei leer ist
    ATTENDANCE_COUNT=$(cat "${SERVER_PATH}/data.json" | grep -o '"attendance":\[' | wc -l)
    if [ "$ATTENDANCE_COUNT" -eq 0 ]; then
        echo "⚠️  Warnung: Die data.json scheint leer zu sein!"
    fi
else
    echo "❌ data.json nicht gefunden"
fi

