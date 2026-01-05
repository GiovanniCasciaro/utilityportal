# Guida al Deployment e Gestione Dati

## ⚠️ IMPORTANTE: Preservazione Dati in Produzione

Questa guida spiega come assicurarsi che i dati degli utenti (database, file caricati) **non vengano mai persi** durante gli aggiornamenti dell'applicazione.

## 📁 Struttura Dati

L'applicazione memorizza i dati in due posizioni principali:

1. **Database SQLite**: `./data/evolvia.db`
   - Contiene: utenti, clienti, contratti, fatture, documenti, notifiche
   
2. **File Upload**: `./uploads/` (o AWS S3 se configurato)
   - Contiene: documenti PDF, immagini, file caricati dagli utenti

## ✅ Cosa è già Configurato

Il `.gitignore` esclude già correttamente:
- `/data` - Tutta la directory del database
- `*.db` - File database
- `uploads/` - File caricati

**Questo significa che quando fai `git pull` o aggiorni il codice, questi file NON vengono sovrascritti.**

## 🚀 Processo di Deployment Sicuro

### 1. Prima di Aggiornare il Codice

```bash
# 1. Fai un backup completo
./scripts/backup.sh

# 2. Verifica che il backup sia stato creato
ls -lh backups/
```

### 2. Aggiorna il Codice

```bash
# Pull del nuovo codice
git pull origin main

# Installa nuove dipendenze (se presenti)
npm install

# Build dell'applicazione
npm run build
```

### 3. Verifica Migrazioni

Il sistema di migrazioni si esegue automaticamente all'avvio, ma puoi verificare manualmente:

```bash
# Controlla lo stato del database
npm run db:status
```

### 4. Riavvia l'Applicazione

```bash
# Se usi PM2
pm2 restart utilityportal

# Se usi systemd
sudo systemctl restart utilityportal

# Se usi Docker
docker-compose restart
```

## 🔄 Sistema di Migrazioni

Il database usa `CREATE TABLE IF NOT EXISTS`, quindi:
- ✅ Le tabelle esistenti **non vengono eliminate**
- ✅ I dati esistenti **non vengono modificati**
- ✅ Nuove colonne vengono aggiunte automaticamente se necessario

### Come Funzionano le Migrazioni

1. **All'avvio dell'app**, `lib/db.ts` controlla lo schema
2. Se mancano colonne, le aggiunge con `ALTER TABLE`
3. Se mancano tabelle, le crea con `CREATE TABLE IF NOT EXISTS`

### Aggiungere una Nuova Migrazione

Quando aggiungi una nuova feature che richiede modifiche al database:

```typescript
// In lib/db.ts, dopo le migrazioni esistenti:

// Migra la tabella X: aggiungi colonna Y se non esiste
try {
  const tableInfo = db.prepare("PRAGMA table_info(tabellaX)").all() as any[]
  const colonnaY = tableInfo.find((col: any) => col.name === 'colonnaY')
  
  if (!colonnaY) {
    db.prepare('ALTER TABLE tabellaX ADD COLUMN colonnaY TEXT').run()
    console.log('Added colonnaY column to tabellaX table')
  }
} catch (error) {
  console.log('Migration note:', error)
}
```

## 💾 Backup Automatici

### Script di Backup Manuale

Crea `scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp ./data/evolvia.db "$BACKUP_DIR/evolvia_$DATE.db"

# Backup uploads (se non usi S3)
if [ -d "./uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" ./uploads
fi

# Mantieni solo gli ultimi 30 backup
find $BACKUP_DIR -name "evolvia_*.db" -mtime +30 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "Backup completato: $DATE"
```

Rendi eseguibile:
```bash
chmod +x scripts/backup.sh
```

### Backup Automatico con Cron

Aggiungi a `crontab -e`:

```bash
# Backup ogni giorno alle 2:00 AM
0 2 * * * cd /path/to/utilityportal && ./scripts/backup.sh >> logs/backup.log 2>&1
```

## 🐳 Deployment con Docker (Consigliato)

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      # Monta il database come volume persistente
      - ./data:/app/data
      # Monta gli uploads come volume persistente
      - ./uploads:/app/uploads
      # Monta i backup
      - ./backups:/app/backups
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

**Con Docker, i volumi persistono anche quando aggiorni l'immagine!**

### Processo di Aggiornamento con Docker

```bash
# 1. Backup
./scripts/backup.sh

# 2. Pull nuovo codice
git pull

# 3. Ricostruisci e riavvia
docker-compose up -d --build

# I volumi (data/, uploads/) rimangono intatti!
```

## ☁️ Deployment su Vercel/Netlify (Serverless)

⚠️ **ATTENZIONE**: Vercel/Netlify sono serverless e **non mantengono file persistenti** tra i deploy.

### Soluzioni per Serverless:

1. **Usa un Database esterno**:
   - PostgreSQL (Supabase, Neon, Railway)
   - MySQL (PlanetScale)
   - MongoDB Atlas

2. **Usa Storage esterno per file**:
   - AWS S3 (già configurato nell'app)
   - Cloudflare R2
   - Google Cloud Storage

### Migrazione a PostgreSQL (Esempio)

Se vuoi migrare da SQLite a PostgreSQL:

1. Installa `pg` e modifica `lib/db.ts`
2. Usa variabili d'ambiente per la connessione
3. I dati rimangono nel database cloud, non nel filesystem

## 🔐 Best Practices

### 1. **Mai Committare Dati di Produzione**

```bash
# Verifica sempre prima di commit
git status

# Assicurati che data/ e uploads/ siano esclusi
git check-ignore data/ uploads/
```

### 2. **Testa le Migrazioni in Staging**

Prima di deployare in produzione:
1. Copia il database di produzione in staging
2. Testa le migrazioni
3. Verifica che i dati siano intatti

### 3. **Backup Prima di Ogni Deploy**

```bash
# Crea uno script pre-deploy
#!/bin/bash
./scripts/backup.sh
git pull
npm install
npm run build
# ... resto del deploy
```

### 4. **Monitora lo Spazio**

```bash
# Controlla la dimensione del database
du -h data/evolvia.db

# Controlla gli uploads
du -h uploads/
```

## 📋 Checklist Pre-Deploy

- [ ] Backup database eseguito
- [ ] Backup uploads eseguito (se non usi S3)
- [ ] Verificato che `.gitignore` escluda `data/` e `uploads/`
- [ ] Testate le migrazioni in staging
- [ ] Verificato che non ci siano `DROP TABLE` nel codice
- [ ] Documentate le nuove migrazioni
- [ ] Piano di rollback preparato

## 🆘 Rollback di Emergenza

Se qualcosa va storto:

```bash
# 1. Ferma l'applicazione
pm2 stop utilityportal

# 2. Ripristina il backup
cp backups/evolvia_YYYYMMDD_HHMMSS.db ./data/evolvia.db

# 3. Ripristina uploads (se necessario)
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz

# 4. Ripristina il codice precedente
git checkout <commit-precedente>

# 5. Riavvia
pm2 start utilityportal
```

## 📞 Supporto

In caso di problemi:
1. Controlla i log: `pm2 logs` o `docker-compose logs`
2. Verifica lo stato del database: `npm run db:status`
3. Controlla i backup disponibili: `ls -lh backups/`

