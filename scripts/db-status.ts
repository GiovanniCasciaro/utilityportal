#!/usr/bin/env tsx

/**
 * Script per verificare lo stato del database e delle migrazioni
 */

import db from '../lib/db'
import { getMigrationStatus } from '../lib/migrations'
import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'

console.log('📊 Stato Database Utility Portal\n')
console.log('=' .repeat(50))

// Verifica esistenza database
const dbPath = join(process.cwd(), 'data', 'evolvia.db')
if (!existsSync(dbPath)) {
  console.log('❌ Database non trovato:', dbPath)
  process.exit(1)
}

// Statistiche tabelle
const tables = [
  'utenti',
  'clienti',
  'contratti',
  'fatture',
  'documenti',
  'notifiche',
  'schema_migrations'
]

console.log('\n📈 Statistiche Tabelle:\n')

tables.forEach(table => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any
    console.log(`   ${table.padEnd(20)}: ${count.count} record`)
  } catch (error) {
    console.log(`   ${table.padEnd(20)}: ❌ tabella non trovata`)
  }
})

// Stato migrazioni
console.log('\n🔄 Stato Migrazioni:\n')
const migrations = getMigrationStatus(db as unknown as Database.Database)

if (migrations.length === 0) {
  console.log('   Nessuna migrazione eseguita')
} else {
  migrations.forEach(m => {
    console.log(`   ✅ v${m.version}: ${m.name} (${m.executed_at})`)
  })
}

// Dimensione database
try {
  const fs = require('fs')
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`\n💾 Dimensione Database: ${sizeMB} MB`)
} catch (error) {
  console.log('\n⚠️  Impossibile calcolare la dimensione del database')
}

// Verifica integrità
console.log('\n🔍 Verifica Integrità:\n')
try {
  const integrity = db.prepare('PRAGMA integrity_check').get() as any
  if (integrity.integrity_check === 'ok') {
    console.log('   ✅ Database integro')
  } else {
    console.log('   ⚠️  Problemi di integrità rilevati:', integrity.integrity_check)
  }
} catch (error) {
  console.log('   ⚠️  Impossibile verificare l\'integrità')
}

console.log('\n' + '='.repeat(50))

