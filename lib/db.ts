import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { runMigrations } from './migrations'

// Assicura che la directory data esista
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'evolvia.db')
const db = new Database(dbPath)

// Inizializza le tabelle
db.exec(`
  CREATE TABLE IF NOT EXISTS utenti (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nome TEXT,
    ruolo TEXT NOT NULL DEFAULT 'agente',
    puntoVenditaId TEXT,
    attivo INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (puntoVenditaId) REFERENCES utenti(id)
  );

  CREATE TABLE IF NOT EXISTS clienti (
    id TEXT PRIMARY KEY,
    agenteId TEXT NOT NULL,
    ragioneSociale TEXT,
    pec TEXT,
    nomePersonaFisica TEXT,
    piva TEXT,
    codiceDestinatario TEXT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    codiceFiscale TEXT NOT NULL,
    email TEXT,
    cellulare TEXT,
    codiceAteco TEXT,
    modalitaPagamento TEXT,
    stato TEXT DEFAULT 'attivo',
    dataRegistrazione TEXT DEFAULT (datetime('now')),
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (agenteId) REFERENCES utenti(id)
  );

  CREATE TABLE IF NOT EXISTS contratti (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    clienteId TEXT NOT NULL,
    agenteId TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tipoCliente TEXT,
    dataInizio TEXT NOT NULL,
    dataScadenza TEXT NOT NULL,
    importo REAL NOT NULL,
    stato TEXT DEFAULT 'attivo',
    note TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (clienteId) REFERENCES clienti(id),
    FOREIGN KEY (agenteId) REFERENCES utenti(id)
  );

  CREATE TABLE IF NOT EXISTS fatture (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    clienteId TEXT NOT NULL,
    contrattoId TEXT,
    agenteId TEXT NOT NULL,
    dataEmissione TEXT NOT NULL,
    dataScadenza TEXT NOT NULL,
    importo REAL NOT NULL,
    stato TEXT DEFAULT 'in_attesa',
    note TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (clienteId) REFERENCES clienti(id),
    FOREIGN KEY (contrattoId) REFERENCES contratti(id),
    FOREIGN KEY (agenteId) REFERENCES utenti(id)
  );

  CREATE TABLE IF NOT EXISTS documenti (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    dimensione TEXT,
    dimensioneBytes INTEGER DEFAULT 0,
    path TEXT,
    userId TEXT NOT NULL,
    clienteId TEXT,
    contrattoId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES utenti(id),
    FOREIGN KEY (clienteId) REFERENCES clienti(id),
    FOREIGN KEY (contrattoId) REFERENCES contratti(id)
  );

  CREATE TABLE IF NOT EXISTS notifiche (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    titolo TEXT NOT NULL,
    messaggio TEXT NOT NULL,
    tipo TEXT NOT NULL,
    letta INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES utenti(id)
  );
`)

// Le migrazioni sono ora gestite da lib/migrations.ts
// Vengono eseguite automaticamente dopo l'inizializzazione delle tabelle

// Esegui le migrazioni automatiche
try {
  runMigrations(db)
} catch (error) {
  console.error('Error running migrations:', error)
  // Non bloccare l'applicazione se le migrazioni falliscono
  // ma logga l'errore per debugging
}

// Inserisci utenti predefiniti se non esistono
try {
  const bcrypt = require('bcryptjs')
  
  const existingAdmin = db.prepare('SELECT id FROM utenti WHERE email = ?').get('admin@evolvia.com')
  if (!existingAdmin) {
    const adminPassword = bcrypt.hashSync('Admin123!', 10)
    db.prepare(`
      INSERT INTO utenti (id, email, password, nome, ruolo)
      VALUES ('admin-1', 'admin@evolvia.com', ?, 'Admin', 'punto_vendita')
    `).run(adminPassword)
  }

  const existingAgent = db.prepare('SELECT id FROM utenti WHERE email = ?').get('test@idealize.srl')
  if (!existingAgent) {
    const agentPassword = bcrypt.hashSync('Password1.', 10)
    db.prepare(`
      INSERT INTO utenti (id, email, password, nome, ruolo, puntoVenditaId)
      VALUES ('agent-1', 'test@idealize.srl', ?, 'Test Agent', 'agente', 'admin-1')
    `).run(agentPassword)
  }
} catch (error) {
  // Ignora gli errori se le tabelle non esistono ancora o gli utenti esistono già
  console.log('Database initialization note:', error)
}

export default db

