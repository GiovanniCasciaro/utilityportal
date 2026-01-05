# Evolvia

Replica moderna della piattaforma Idealize TLC con interfaccia rinnovata, mantenendo tutta la struttura e le funzionalità originali.

## Caratteristiche

- ✅ Sistema di autenticazione completo
- ✅ Login con "Ricordami"
- ✅ Recupero password
- ✅ Dashboard moderna con metriche e statistiche
- ✅ Gestione Clienti completa (CRUD)
- ✅ Gestione Contratti TLC
- ✅ Sistema di Fatturazione
- ✅ Report e Statistiche dettagliate
- ✅ Gestione Documenti
- ✅ Sistema Notifiche
- ✅ Impostazioni Account
- ✅ Layout con sidebar navigabile
- ✅ Design moderno e responsive
- ✅ Interfaccia utente migliorata

## Credenziali di Accesso

- **Email**: test@idealize.srl
- **Password**: Password1.

## Installazione

```bash
npm install
```

## Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## Build per Produzione

```bash
npm run build
npm start
```

## Tecnologie Utilizzate

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipizzazione statica
- **Tailwind CSS** - Styling moderno
- **React** - Libreria UI

## Struttura del Progetto

```
evolvia/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       └── logout/
│   ├── dashboard/
│   ├── clienti/
│   ├── contratti/
│   ├── fatturazione/
│   ├── report/
│   ├── documenti/
│   ├── notifiche/
│   ├── settings/
│   ├── forgot-password/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Layout.tsx
│   ├── DashboardContent.tsx
│   ├── LoginPage.tsx
│   ├── ClientiContent.tsx
│   ├── ContrattiContent.tsx
│   ├── FatturazioneContent.tsx
│   ├── ReportContent.tsx
│   ├── DocumentiContent.tsx
│   ├── NotificheContent.tsx
│   └── SettingsContent.tsx
├── lib/
│   └── auth.ts
├── middleware.ts
└── package.json
```

## Funzionalità Implementate

### 1. **Autenticazione**
   - Pagina di login con validazione
   - Checkbox "Ricordami" per sessioni persistenti
   - Link "Password dimenticata"
   - Gestione sessioni con cookie HTTP-only
   - Protezione route con middleware
   - Logout sicuro

### 2. **Dashboard**
   - Metriche in tempo reale (Clienti, Contratti, Fatturato, Chiamate)
   - Attività recenti
   - Azioni rapide
   - Grafici e statistiche
   - Layout responsive

### 3. **Gestione Clienti**
   - Lista completa clienti con ricerca e filtri
   - Visualizzazione dettagli cliente
   - Creazione, modifica ed eliminazione clienti
   - Filtri per stato (attivo/inattivo)
   - Modal per dettagli cliente

### 4. **Gestione Contratti**
   - Lista contratti con filtri
   - Statistiche contratti (attivi, in scadenza, scaduti)
   - Dettagli contratto (numero, cliente, tipo, periodo, importo)
   - Gestione stati contratto
   - Calcolo fatturato mensile

### 5. **Fatturazione**
   - Gestione fatture completa
   - Statistiche fatturazione (totale, pagato, in attesa)
   - Filtri per stato (pagata, in attesa, scaduta)
   - Generazione e invio fatture
   - Export PDF

### 6. **Report e Statistiche**
   - Report fatturato
   - Report clienti
   - Report contratti
   - Report chiamate
   - Report pagamenti
   - Report servizi
   - Filtri per periodo (settimana, mese, trimestre, anno)
   - Export report

### 7. **Gestione Documenti**
   - Caricamento documenti
   - Categorizzazione documenti
   - Ricerca e filtri
   - Download e visualizzazione
   - Statistiche spazio utilizzato

### 8. **Sistema Notifiche**
   - Notifiche in tempo reale
   - Tipi di notifica (info, success, warning, error)
   - Segna come letta/non letta
   - Filtri notifiche
   - Eliminazione notifiche

### 9. **Impostazioni**
   - Gestione profilo utente
   - Modifica dati personali
   - Preferenze notifiche
   - Configurazioni account

### 10. **Layout e Navigazione**
   - Sidebar collassabile
   - Menu di navigazione completo
   - Header con informazioni utente
   - Design responsive mobile-first
   - Footer con copyright

## Note

Questa è una replica educativa della piattaforma originale. Tutte le funzionalità sono state implementate mantenendo la struttura originale ma con un'interfaccia completamente rinnovata e moderna.

## Funzionalità Avanzate Implementate

### ✅ Database Reale
- Database SQLite integrato
- Tabelle per clienti, contratti, fatture, documenti e notifiche
- Persistenza dati completa
- Database file: `./data/evolvia.db`

### ✅ Autenticazione JWT
- Sistema di autenticazione con JWT (JSON Web Tokens)
- Token sicuri con scadenza configurabile
- Verifica token su ogni richiesta
- Cookie HTTP-only per sicurezza

### ✅ Export Dati
- Export clienti in formato CSV
- Export clienti in formato Excel (XLSX)
- API endpoint: `/api/export/clienti?format=csv|xlsx`
- Download diretto dei file

### ✅ Grafici Interattivi
- Grafici interattivi con Recharts
- Line chart per fatturato e trend
- Bar chart per clienti e servizi
- Pie chart per distribuzione contratti
- Grafici responsive e interattivi

### ✅ Integrazione Email
- Sistema email con Nodemailer
- Invio email di benvenuto
- Notifiche via email
- Configurazione SMTP
- API endpoint: `/api/email/send`

### ✅ API RESTful Complete
- **GET/POST** `/api/clienti` - Gestione clienti
- **GET/POST** `/api/contratti` - Gestione contratti
- **GET** `/api/export/clienti` - Export dati
- **POST** `/api/email/send` - Invio email
- Validazione input con Zod
- Gestione errori completa

### ✅ Form Aggiunta
- Form completo per aggiungere nuovo cliente
- Form completo per aggiungere nuovo contratto
- Validazione lato client e server
- Selezione cliente da dropdown
- Generazione automatica numeri contratto

### ✅ Storage AWS S3
- Integrazione completa con AWS S3 per lo storage dei documenti
- Upload automatico su S3 con fallback a storage locale
- Download e eliminazione file da S3
- Configurazione tramite variabili d'ambiente

### ✅ Limiti Storage
- Limite upload singolo file: **5MB**
- Limite spazio totale per utente: **500MB**
- Tracciamento spazio utilizzato per utente
- Validazione lato client e server
- Messaggi di errore informativi

## Configurazione

Copia il file `.env.example` in `.env` e configura:

```bash
cp .env.example .env
```

Modifica le variabili d'ambiente:
- `JWT_SECRET`: Chiave segreta per JWT (cambia in produzione)
- `SMTP_*`: Configurazione email SMTP
- `AWS_ACCESS_KEY_ID`: Chiave di accesso AWS
- `AWS_SECRET_ACCESS_KEY`: Chiave segreta AWS
- `AWS_REGION`: Regione AWS (es: us-east-1)
- `AWS_S3_BUCKET_NAME`: Nome del bucket S3 per lo storage dei documenti

## Note Importanti

- Il database SQLite viene creato automaticamente alla prima esecuzione
- In sviluppo, le email vengono solo loggate (non inviate)
- Per produzione, configura le variabili SMTP per l'invio email reale
- Il JWT_SECRET deve essere cambiato in produzione
- **Storage**: Se AWS S3 non è configurato, il sistema usa storage locale come fallback
- **Limiti Storage**: Ogni utente ha un limite di 500MB di spazio totale e 5MB per singolo file
- Per usare AWS S3, configura tutte le variabili d'ambiente AWS nel file `.env`

## Test automatizzati

- Da implementare in futuro
# utilityportal
