#!/bin/bash

# Script di ripristino backup
# Utilizzo: ./scripts/restore.sh [backup_date]
# Esempio: ./scripts/restup.sh 20240115_143022

set -e

BACKUP_DIR="./backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ -z "$1" ]; then
  echo "❌ Errore: Specifica la data del backup"
  echo ""
  echo "Backup disponibili:"
  ls -lh "$BACKUP_DIR"/*.db.gz 2>/dev/null | awk '{print $9}' | sed 's/.*evolvia_//' | sed 's/\.db\.gz$//' || echo "Nessun backup trovato"
  echo ""
  echo "Utilizzo: ./scripts/restore.sh YYYYMMDD_HHMMSS"
  exit 1
fi

BACKUP_DATE=$1
DB_BACKUP="$BACKUP_DIR/evolvia_${BACKUP_DATE}.db.gz"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${BACKUP_DATE}.tar.gz"

# Verifica che il backup esista
if [ ! -f "$DB_BACKUP" ]; then
  echo "❌ Backup database non trovato: $DB_BACKUP"
  exit 1
fi

echo "⚠️  ATTENZIONE: Questo script sovrascriverà il database corrente!"
echo "   Backup da ripristinare: $BACKUP_DATE"
read -p "   Continuare? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Ripristino annullato"
  exit 0
fi

# Ferma l'applicazione se è in esecuzione
echo "🛑 Fermo l'applicazione..."
pm2 stop utilityportal 2>/dev/null || true
docker-compose stop 2>/dev/null || true

# Backup del database corrente prima di ripristinare
if [ -f "./data/evolvia.db" ]; then
  CURRENT_BACKUP="./data/evolvia.db.backup.$(date +%Y%m%d_%H%M%S)"
  cp "./data/evolvia.db" "$CURRENT_BACKUP"
  echo "✅ Backup corrente salvato: $CURRENT_BACKUP"
fi

# Ripristina database
echo "📥 Ripristino database..."
gunzip -c "$DB_BACKUP" > "./data/evolvia.db"
echo "✅ Database ripristinato"

# Ripristina uploads se esiste
if [ -f "$UPLOADS_BACKUP" ]; then
  echo "📥 Ripristino uploads..."
  tar -xzf "$UPLOADS_BACKUP" -C ./
  echo "✅ Uploads ripristinati"
fi

echo ""
echo "✅ Ripristino completato!"
echo "   Riavvia l'applicazione con: pm2 start utilityportal"
echo "   oppure: docker-compose up -d"

