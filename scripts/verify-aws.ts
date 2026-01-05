#!/usr/bin/env node

/**
 * Script per verificare la configurazione AWS S3
 */

import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carica le variabili d'ambiente dal file .env nella root del progetto
config({ path: resolve(process.cwd(), '.env') })

const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
]

async function verifyAWSConfig() {
  console.log('🔍 Verifica configurazione AWS S3...\n')

  // Verifica variabili d'ambiente
  console.log('1️⃣ Verifica variabili d\'ambiente...')
  const missingVars: string[] = []
  
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
      console.log(`   ❌ ${varName}: NON CONFIGURATA`)
    } else {
      // Nascondi i valori sensibili
      const value = varName.includes('SECRET') || varName.includes('KEY')
        ? '***' + process.env[varName]!.slice(-4)
        : process.env[varName]
      console.log(`   ✅ ${varName}: ${value}`)
    }
  }

  if (missingVars.length > 0) {
    console.log('\n❌ Configurazione incompleta!')
    console.log(`\nVariabili mancanti: ${missingVars.join(', ')}`)
    console.log('\nAggiungi queste variabili al file .env')
    process.exit(1)
  }

  // Verifica connessione AWS
  console.log('\n2️⃣ Verifica connessione AWS...')
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // Test: lista bucket
    const listCommand = new ListBucketsCommand({})
    const response = await s3Client.send(listCommand)
    console.log(`   ✅ Connessione AWS riuscita!`)
    console.log(`   📦 Bucket disponibili: ${response.Buckets?.length || 0}`)

    // Verifica bucket specifico
    console.log('\n3️⃣ Verifica bucket S3...')
    const bucketName = process.env.AWS_S3_BUCKET_NAME!
    const headCommand = new HeadBucketCommand({ Bucket: bucketName })
    
    try {
      await s3Client.send(headCommand)
      console.log(`   ✅ Bucket "${bucketName}" trovato e accessibile!`)
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`   ❌ Bucket "${bucketName}" NON TROVATO`)
        console.log(`   💡 Verifica che il nome del bucket sia corretto`)
      } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
        console.log(`   ❌ Accesso negato al bucket "${bucketName}"`)
        console.log(`   💡 Verifica i permessi IAM dell'utente`)
      } else {
        console.log(`   ❌ Errore: ${error.message}`)
      }
      process.exit(1)
    }

    console.log('\n✅ Configurazione AWS S3 completata con successo!')
    console.log('\n📝 Prossimi passi:')
    console.log('   1. Riavvia il server di sviluppo: npm run dev')
    console.log('   2. Prova a caricare un documento dall\'applicazione')
    
  } catch (error: any) {
    console.log(`\n❌ Errore durante la verifica:`)
    console.log(`   ${error.message}`)
    
    if (error.name === 'InvalidAccessKeyId') {
      console.log('\n💡 Suggerimento: Verifica che AWS_ACCESS_KEY_ID sia corretto')
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('\n💡 Suggerimento: Verifica che AWS_SECRET_ACCESS_KEY sia corretto')
    } else if (error.name === 'InvalidRegion') {
      console.log('\n💡 Suggerimento: Verifica che AWS_REGION sia una regione valida (es: eu-west-1)')
    }
    
    process.exit(1)
  }
}

// Esegui la verifica
verifyAWSConfig().catch(console.error)

