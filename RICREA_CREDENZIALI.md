# 🔑 Guida: Ricreare le Credenziali IAM

Se hai aggiunto i permessi ma l'errore persiste, probabilmente le credenziali nel file `.env` non corrispondono all'utente IAM o sono state create prima di aggiungere i permessi.

## 📋 Passo-Passo per Ricreare le Credenziali

### Passo 1: Vai alla Pagina Utente IAM

1. Vai su [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → Clicca su **evolvia-s3-user**

### Passo 2: Vai alle Credenziali di Sicurezza

1. Nella pagina dell'utente, vai alla tab **Security credentials** (Credenziali di sicurezza)
2. Scorri fino alla sezione **Access keys** (Chiavi di accesso)

### Passo 3: Elimina la Vecchia Access Key (se esiste)

1. Se vedi una Access Key esistente:
   - Clicca sui **tre puntini** (⋮) accanto alla key
   - Seleziona **Delete** (Elimina)
   - Conferma l'eliminazione

### Passo 4: Crea una Nuova Access Key

1. Clicca sul pulsante **Create access key** (Crea chiave di accesso)
2. Seleziona **Application running outside AWS** (Applicazione in esecuzione fuori da AWS)
3. Clicca **Next** (Avanti)
4. Opzionale: Aggiungi una descrizione (es: "Evolvia S3 Access")
5. Clicca **Create access key** (Crea chiave di accesso)

### Passo 5: Copia le Credenziali

⚠️ **IMPORTANTE**: Le credenziali vengono mostrate **SOLO UNA VOLTA**!

1. Copia l'**Access Key ID** (es: `AKIAIOSFODNN7EXAMPLE`)
2. Copia la **Secret Access Key** (es: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
3. **Salva queste credenziali in un posto sicuro** (non perderle!)

### Passo 6: Aggiorna il File .env

1. Apri il file `.env` nella root del progetto
2. Sostituisci le vecchie credenziali con quelle nuove:

```env
AWS_ACCESS_KEY_ID=AKIA... (la nuova Access Key ID)
AWS_SECRET_ACCESS_KEY=wJalr... (la nuova Secret Access Key)
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=evolvia-documents-2024
```

⚠️ **IMPORTANTE**:
- Nessuno spazio prima o dopo il `=`
- Nessuna virgoletta attorno ai valori
- La Secret Access Key deve essere completa (40 caratteri)
- Copia esattamente come mostrato, senza modifiche

### Passo 7: Verifica

Dopo aver aggiornato il file `.env`, esegui:

```bash
npm run verify-aws
```

Dovresti vedere:
```
✅ Connessione AWS riuscita!
✅ Bucket "evolvia-documents-2024" trovato e accessibile!
✅ Configurazione AWS S3 completata con successo!
```

## 🔍 Verifica Aggiuntiva

Se ancora non funziona, verifica:

1. **I permessi sono stati aggiunti correttamente?**
   - IAM → Users → evolvia-s3-user → Permissions
   - Dovresti vedere `AmazonS3FullAccess` nella lista

2. **Il bucket esiste?**
   - S3 Console → Regione: eu-north-1 (Stoccolma)
   - Verifica che `evolvia-documents-2024` esista

3. **Le credenziali sono state copiate correttamente?**
   - Esegui: `npm run diagnose-aws`
   - Verifica che non ci siano spazi o caratteri extra

## 🆘 Se Nulla Funziona

Se dopo aver ricreato le credenziali e verificato tutto, il problema persiste:

1. Verifica che il bucket sia nella regione corretta (`eu-north-1`)
2. Prova a creare un nuovo utente IAM da zero:
   - Crea nuovo utente: `evolvia-s3-user-v2`
   - Aggiungi policy `AmazonS3FullAccess`
   - Crea access key
   - Aggiorna `.env` con le nuove credenziali

