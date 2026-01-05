# Deploy su Vercel

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

### 2. Variabili d'ambiente

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

### 3. Build Settings

Vercel dovrebbe rilevare automaticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Deploy

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

