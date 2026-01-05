# Deploy su Vercel

## ⚠️ IMPORTANTE: Configurazione Node.js

**PRIMA DI FARE IL DEPLOY, configura Node.js 20 nelle impostazioni di Vercel:**

1. Vai su https://vercel.com
2. Seleziona il progetto (o crealo)
3. Vai su **Settings** → **General**
4. In **Node.js Version** seleziona **20.x** (NON 24.x)
5. Salva le impostazioni

**Questo è CRUCIALE perché `better-sqlite3` non compila con Node.js 24.**

## ⚠️ IMPORTANTE: Limitazioni SQLite su Vercel

Vercel è una piattaforma serverless, quindi:

1. **Il database SQLite viene salvato in `/tmp`** che è temporaneo
2. **I dati si perdono ad ogni deploy o dopo l'inattività**
3. **Per produzione seria, considera di usare un database remoto** (PostgreSQL, MySQL, ecc.)

## 🚀 Deploy

### 1. Connetti il repository a Vercel

1. Vai su https://vercel.com
2. Clicca "New Project"
3. Importa il repository GitHub `GiovanniCasciaro/utilityportal`
4. Vercel rileverà automaticamente Next.js

### 2. ⚠️ Configura Node.js Version (IMPORTANTE!)

**Nelle impostazioni del progetto su Vercel:**
1. Vai su "Settings" → "General"
2. In "Node.js Version" seleziona **20.x** (NON 24.x)
3. Salva le impostazioni

**Il file `.nvmrc` è già presente nel repository e specifica Node 20.**

### 3. Variabili d'ambiente

Configura queste variabili d'ambiente su Vercel:

- `NODE_ENV=production`
- `VERCEL=1` (impostato automaticamente da Vercel)

Se usi AWS S3 per i file:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`

Se usi email:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### 4. Build Settings

Vercel dovrebbe rilevare automaticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 5. Deploy

Dopo il primo deploy, ogni push su `main` farà un nuovo deploy automatico.

## 📝 Note

- Il database viene inizializzato automaticamente al primo avvio
- Gli utenti predefiniti vengono creati automaticamente:
  - Admin: `admin@evolvia.com` / `Admin123!`
  - Agent: `test@idealize.srl` / `Password1.`
- I dati in `/tmp` sono temporanei - considera un database remoto per produzione

## 🔄 Migrazione a Database Remoto (Raccomandato)

Per un'applicazione in produzione, considera di migrare a:
- **Vercel Postgres** (integrato con Vercel)
- **PlanetScale** (MySQL serverless)
- **Supabase** (PostgreSQL)
- **Railway** (PostgreSQL/MySQL)

## 🐛 Risoluzione Problemi

### Errore: "better-sqlite3 build failed"

Se vedi errori di compilazione di `better-sqlite3`:
1. Verifica che Node.js Version sia impostato su **20.x** (non 24.x)
2. Vai su Settings → General → Node.js Version
3. Seleziona **20.x** e salva
4. Fai un nuovo deploy

### Errore: "npm install failed"

1. Verifica che tutte le dipendenze siano corrette
2. Controlla i log di build su Vercel per dettagli specifici
3. Assicurati che Node.js Version sia 20.x
