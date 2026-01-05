#!/bin/bash

# Script di backup per Utility Portal
# Crea backup del database e degli uploads

set -e  # Exit on error

# Configurazione
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Crea directory backup se non esiste
mkdir -p "$BACKUP_DIR"

echo "🔄 Inizio backup: $(date)"

# Backup database
if [ -f "./data/evolvia.db" ]; then
  cp "./data/evolvia.db" "$BACKUP_DIR/evolvia_$DATE.db"
  echo "✅ Database backup creato: evolvia_$DATE.db"
  
  # Comprimi il backup per risparmiare spazio
  gzip -f "$BACKUP_DIR/evolvia_$DATE.db"
  echo "✅ Database compresso: evolvia_$DATE.db.gz"
else
  echo "⚠️  Database non trovato in ./data/evolvia.db"
fi

# Backup uploads (solo se non usi S3)
if [ -d "./uploads" ] && [ "$(ls -A ./uploads 2>/dev/null)" ]; then
  tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" ./uploads
  echo "✅ Uploads backup creato: uploads_$DATE.tar.gz"
else
  echo "ℹ️  Uploads directory vuota o non presente (probabilmente usi S3)"
fi

# Mantieni solo gli ultimi 30 backup
echo "🧹 Rimozione backup vecchi (mantenuti ultimi 30)..."
find "$BACKUP_DIR" -name "evolvia_*.db.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +30 -delete 2>/dev/null || true

# Mostra statistiche
DB_SIZE=$(du -h "$BACKUP_DIR/evolvia_$DATE.db.gz" 2>/dev/null | cut -f1 || echo "N/A")
UPLOADS_SIZE=$(du -h "$BACKUP_DIR/uploads_$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")

echo ""
echo "📊 Backup completato:"
echo "   Database: $DB_SIZE"
echo "   Uploads: $UPLOADS_SIZE"
echo "   Data: $DATE"
echo ""

# Conta i backup totali
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "evolvia_*.db.gz" | wc -l)
echo "📦 Backup totali disponibili: $BACKUP_COUNT"

