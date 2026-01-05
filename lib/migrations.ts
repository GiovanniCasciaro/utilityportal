/**
 * Sistema di Migrazioni Database
 * 
 * Questo file gestisce le migrazioni del database in modo sicuro.
 * Le migrazioni vengono eseguite automaticamente all'avvio dell'applicazione.
 */

import Database from 'better-sqlite3'

interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
  down?: (db: Database.Database) => void
}

/**
 * Verifica se una migrazione è già stata eseguita
 */
function isMigrationExecuted(db: Database.Database, version: number): boolean {
  try {
    const result = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version) as any
    return !!result
  } catch (error) {
    return false
  }
}

/**
 * Registra una migrazione come eseguita
 */
function markMigrationExecuted(db: Database.Database, version: number, name: string): void {
  try {
    db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, name)
  } catch (error) {
    console.error(`Error marking migration ${version} as executed:`, error)
  }
}

/**
 * Esegue una migrazione
 */
function runMigration(db: Database.Database, migration: Migration): void {
  if (isMigrationExecuted(db, migration.version)) {
    console.log(`⏭️  Migration ${migration.version} (${migration.name}) already executed, skipping`)
    return
  }

  try {
    console.log(`🔄 Running migration ${migration.version}: ${migration.name}`)
    migration.up(db)
    markMigrationExecuted(db, migration.version, migration.name)
    console.log(`✅ Migration ${migration.version} completed`)
  } catch (error) {
    console.error(`❌ Error running migration ${migration.version}:`, error)
    throw error
  }
}

/**
 * Definizione delle migrazioni
 * IMPORTANTE: Aggiungi sempre nuove migrazioni in fondo alla lista
 * e incrementa il numero di versione
 */
const migrations: Migration[] = [
  {
    version: 1,
    name: 'Add tipoCliente to contratti',
    up: (db) => {
      const tableInfo = db.prepare("PRAGMA table_info(contratti)").all() as any[]
      const tipoClienteColumn = tableInfo.find((col: any) => col.name === 'tipoCliente')
      
      if (!tipoClienteColumn) {
        db.prepare('ALTER TABLE contratti ADD COLUMN tipoCliente TEXT').run()
      }
    }
  },
  {
    version: 2,
    name: 'Add userId and dimensioneBytes to documenti',
    up: (db) => {
      const tableInfo = db.prepare("PRAGMA table_info(documenti)").all() as any[]
      const userIdColumn = tableInfo.find((col: any) => col.name === 'userId')
      const dimensioneBytesColumn = tableInfo.find((col: any) => col.name === 'dimensioneBytes')
      
      if (!userIdColumn) {
        db.prepare('ALTER TABLE documenti ADD COLUMN userId TEXT').run()
      }
      
      if (!dimensioneBytesColumn) {
        db.prepare('ALTER TABLE documenti ADD COLUMN dimensioneBytes INTEGER DEFAULT 0').run()
      }
    }
  },
  {
    version: 3,
    name: 'Add indirizzoResidenza and iban to clienti',
    up: (db) => {
      const tableInfo = db.prepare("PRAGMA table_info(clienti)").all() as any[]
      const indirizzoResidenzaColumn = tableInfo.find((col: any) => col.name === 'indirizzoResidenza')
      const ibanColumn = tableInfo.find((col: any) => col.name === 'iban')
      
      if (!indirizzoResidenzaColumn) {
        db.prepare('ALTER TABLE clienti ADD COLUMN indirizzoResidenza TEXT').run()
      }
      
      if (!ibanColumn) {
        db.prepare('ALTER TABLE clienti ADD COLUMN iban TEXT').run()
      }
    }
  },
  {
    version: 4,
    name: 'Create referenti table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS referenti (
          id TEXT PRIMARY KEY,
          clienteId TEXT NOT NULL,
          cognome TEXT NOT NULL,
          nome TEXT NOT NULL,
          cellulare TEXT,
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (clienteId) REFERENCES clienti(id) ON DELETE CASCADE
        )
      `)
    }
  },
  {
    version: 5,
    name: 'Create forniture table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS forniture (
          id TEXT PRIMARY KEY,
          clienteId TEXT NOT NULL,
          podPdr TEXT,
          indirizzoFornitura TEXT,
          consumoAnnuale REAL,
          tipologiaContratto TEXT DEFAULT 'Residenziale',
          stato TEXT DEFAULT 'Attivo',
          createdAt TEXT DEFAULT (datetime('now')),
          updatedAt TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (clienteId) REFERENCES clienti(id) ON DELETE CASCADE
        )
      `)
    }
  },
  {
    version: 6,
    name: 'Add extended fields to forniture table',
    up: (db) => {
      const tableInfo = db.prepare("PRAGMA table_info(forniture)").all() as any[]
      
      const fieldsToAdd = [
        { name: 'prestazione', type: 'TEXT' },
        { name: 'fornitore', type: 'TEXT' },
        { name: 'offerta', type: 'TEXT' },
        { name: 'prezzo', type: 'REAL' },
        { name: 'ccv', type: 'TEXT' },
        { name: 'scadenza', type: 'TEXT' },
        { name: 'compenso', type: 'REAL' },
        { name: 'commissione', type: 'REAL' },
        { name: 'operatore', type: 'TEXT' },
        { name: 'nrPratica', type: 'TEXT' },
        { name: 'linkPortale', type: 'TEXT' },
        { name: 'checkPagamento', type: 'INTEGER DEFAULT 0' },
        { name: 'checkStorno', type: 'INTEGER DEFAULT 0' },
        { name: 'esitoContratto', type: 'TEXT' },
        { name: 'tipologia', type: 'TEXT' },
        { name: 'note', type: 'TEXT' },
      ]
      
      fieldsToAdd.forEach(field => {
        const column = tableInfo.find((col: any) => col.name === field.name)
        if (!column) {
          db.prepare(`ALTER TABLE forniture ADD COLUMN ${field.name} ${field.type}`).run()
        }
      })
    }
  },
]

/**
 * Esegue tutte le migrazioni pendenti
 */
export function runMigrations(db: Database.Database): void {
  // Crea la tabella delle migrazioni se non esiste
  const MIGRATIONS_TABLE = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TEXT DEFAULT (datetime('now'))
    )
  `
  
  try {
    db.exec(MIGRATIONS_TABLE)
  } catch (error) {
    console.error('Error creating migrations table:', error)
  }

  console.log('🔄 Checking for pending migrations...')
  
  try {
    migrations.forEach(migration => {
      runMigration(db, migration)
    })
    
    const executedMigrations = db.prepare('SELECT COUNT(*) as count FROM schema_migrations').get() as any
    console.log(`✅ Migrations check complete. Total executed: ${executedMigrations.count}`)
  } catch (error) {
    console.error('❌ Error during migrations:', error)
    throw error
  }
}

/**
 * Ottiene lo stato delle migrazioni
 */
export function getMigrationStatus(db: Database.Database): { version: number; name: string; executed_at: string }[] {
  try {
    return db.prepare('SELECT * FROM schema_migrations ORDER BY version').all() as any[]
  } catch (error) {
    console.error('Error getting migration status:', error)
    return []
  }
}

