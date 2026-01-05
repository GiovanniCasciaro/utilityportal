#!/usr/bin/env node

/**
 * Script di diagnostica per problemi AWS S3
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carica le variabili d'ambiente
config({ path: resolve(process.cwd(), '.env') })

console.log('🔍 Diagnostica Configurazione AWS S3\n')
console.log('=' .repeat(50))

// Verifica lunghezza e formato delle credenziali
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
const region = process.env.AWS_REGION || ''
const bucketName = process.env.AWS_S3_BUCKET_NAME || ''

console.log('\n1️⃣ Verifica Formato Credenziali:\n')

// Verifica Access Key ID
if (!accessKeyId) {
  console.log('   ❌ AWS_ACCESS_KEY_ID: NON CONFIGURATA')
} else {
  const isValidFormat = /^AKIA[0-9A-Z]{16}$/.test(accessKeyId)
  const length = accessKeyId.length
  console.log(`   ${isValidFormat ? '✅' : '⚠️'} AWS_ACCESS_KEY_ID:`)
  console.log(`      - Lunghezza: ${length} caratteri ${length === 20 ? '(corretta)' : '(dovrebbe essere 20)'}`)
  console.log(`      - Formato: ${isValidFormat ? 'Valido (inizia con AKIA)' : 'Potrebbe essere errato'}`)
  console.log(`      - Valore: ${accessKeyId.substring(0, 4)}...${accessKeyId.slice(-4)}`)
}

// Verifica Secret Access Key
if (!secretAccessKey) {
  console.log('   ❌ AWS_SECRET_ACCESS_KEY: NON CONFIGURATA')
} else {
  const length = secretAccessKey.length
  const hasSpaces = secretAccessKey.includes(' ')
  const hasQuotes = secretAccessKey.startsWith('"') || secretAccessKey.startsWith("'")
  const trimmedLength = secretAccessKey.trim().length
  
  console.log(`   ${length >= 40 ? '✅' : '⚠️'} AWS_SECRET_ACCESS_KEY:`)
  console.log(`      - Lunghezza: ${length} caratteri ${length >= 40 ? '(corretta)' : '(dovrebbe essere almeno 40)'}`)
  console.log(`      - Spazi: ${hasSpaces ? '⚠️ CONTIENE SPAZI (rimuovili!)' : 'Nessuno spazio ✅'}`)
  console.log(`      - Virgolette: ${hasQuotes ? '⚠️ CONTIENE VIRGOLETTE (rimuovile!)' : 'Nessuna virgoletta ✅'}`)
  console.log(`      - Lunghezza dopo trim: ${trimmedLength} caratteri`)
  
  if (hasSpaces || hasQuotes) {
    console.log(`\n   💡 PROBLEMA TROVATO!`)
    console.log(`      La Secret Access Key contiene caratteri non validi.`)
    console.log(`      Assicurati che nel file .env sia scritta così:`)
    console.log(`      AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
    console.log(`      (senza spazi, senza virgolette, tutto su una riga)`)
  }
}

// Verifica regione
console.log(`\n   ${region ? '✅' : '❌'} AWS_REGION: ${region || 'NON CONFIGURATA'}`)
if (region) {
  const validRegions = ['us-east-1', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1', 'ap-southeast-1', 'ap-southeast-2']
  const isValid = validRegions.includes(region) || region.match(/^[a-z]+-[a-z]+-[0-9]+$/)
  console.log(`      - Formato: ${isValid ? 'Valido' : 'Verifica che sia corretto'}`)
}

// Verifica bucket
console.log(`\n   ${bucketName ? '✅' : '❌'} AWS_S3_BUCKET_NAME: ${bucketName || 'NON CONFIGURATO'}`)
if (bucketName) {
  const isValidFormat = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(bucketName) && bucketName.length >= 3 && bucketName.length <= 63
  console.log(`      - Formato: ${isValidFormat ? 'Valido' : 'Potrebbe essere errato'}`)
  console.log(`      - Lunghezza: ${bucketName.length} caratteri`)
}

console.log('\n' + '='.repeat(50))
console.log('\n2️⃣ Checklist Risoluzione Problemi:\n')

const issues: string[] = []

if (!accessKeyId) {
  issues.push('❌ AWS_ACCESS_KEY_ID mancante')
} else if (accessKeyId.length !== 20) {
  issues.push('⚠️ AWS_ACCESS_KEY_ID ha lunghezza errata (dovrebbe essere 20 caratteri)')
}

if (!secretAccessKey) {
  issues.push('❌ AWS_SECRET_ACCESS_KEY mancante')
} else {
  if (secretAccessKey.length < 40) {
    issues.push('⚠️ AWS_SECRET_ACCESS_KEY troppo corta (dovrebbe essere almeno 40 caratteri)')
  }
  if (secretAccessKey.includes(' ')) {
    issues.push('⚠️ AWS_SECRET_ACCESS_KEY contiene spazi (rimuovili!)')
  }
  if (secretAccessKey.startsWith('"') || secretAccessKey.startsWith("'")) {
    issues.push('⚠️ AWS_SECRET_ACCESS_KEY contiene virgolette (rimuovile!)')
  }
}

if (!region) {
  issues.push('❌ AWS_REGION mancante')
}

if (!bucketName) {
  issues.push('❌ AWS_S3_BUCKET_NAME mancante')
}

if (issues.length === 0) {
  console.log('✅ Tutte le credenziali sembrano formattate correttamente!')
  console.log('\n💡 Se continui ad avere errori, verifica:')
  console.log('   1. Le credenziali sono state copiate completamente (senza tagliare caratteri)')
  console.log('   2. L\'utente IAM ha i permessi S3 corretti')
  console.log('   3. Il bucket esiste nella regione specificata')
  console.log('   4. Non ci sono caratteri nascosti o spazi extra nel file .env')
} else {
  console.log('⚠️ Problemi trovati:\n')
  issues.forEach(issue => console.log(`   ${issue}`))
  console.log('\n💡 Suggerimenti:')
  console.log('   1. Apri il file .env e verifica che ogni variabile sia su una riga separata')
  console.log('   2. Assicurati che non ci siano spazi prima o dopo il segno =')
  console.log('   3. Non usare virgolette attorno ai valori')
  console.log('   4. Copia le credenziali direttamente da AWS Console senza modifiche')
}

console.log('\n' + '='.repeat(50))
console.log('\n📝 Esempio di file .env corretto:\n')
console.log('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE')
console.log('AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY')
console.log('AWS_REGION=eu-north-1')
console.log('AWS_S3_BUCKET_NAME=evolvia-documents-2024')
console.log('\n')

