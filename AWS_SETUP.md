# Guida Configurazione AWS S3

Questa guida ti aiuterà a configurare AWS S3 per lo storage dei documenti.

## 📋 Prerequisiti

1. Un account AWS (se non ce l'hai, crealo su [aws.amazon.com](https://aws.amazon.com))
2. Accesso alla console AWS

## 🔑 Passo 1: Creare le Credenziali AWS (IAM User)

### 1.1 Accedi alla Console AWS
Vai su [console.aws.amazon.com](https://console.aws.amazon.com) e accedi.

### 1.2 Crea un utente IAM
1. Cerca "IAM" nella barra di ricerca
2. Vai su **Users** (Utenti) nel menu laterale
3. Clicca su **Create user** (Crea utente)
4. Inserisci un nome utente (es: `evolvia-s3-user`)
5. Clicca **Next** (Avanti)

### 1.3 Assegna i permessi
1. Seleziona **Attach policies directly** (Allega policy direttamente)
2. Cerca e seleziona la policy: **AmazonS3FullAccess**
   - ⚠️ **Nota**: Per produzione, crea una policy più restrittiva che permetta solo l'accesso al tuo bucket specifico
3. Clicca **Next** (Avanti)
4. Clicca **Create user** (Crea utente)

### 1.4 Ottieni le credenziali
1. Clicca sul nome dell'utente appena creato
2. Vai alla tab **Security credentials** (Credenziali di sicurezza)
3. Clicca su **Create access key** (Crea chiave di accesso)
4. Seleziona **Application running outside AWS** (Applicazione in esecuzione fuori da AWS)
5. Clicca **Next** (Avanti)
6. **IMPORTANTE**: Copia e salva:
   - **Access key ID** (Chiave di accesso)
   - **Secret access key** (Chiave segreta)
   - ⚠️ La chiave segreta viene mostrata solo una volta!

## 🪣 Passo 2: Creare un Bucket S3

### 2.1 Crea il bucket
1. Vai su **S3** nella console AWS
2. Clicca su **Create bucket** (Crea bucket)
3. Configura il bucket:
   - **Bucket name**: Scegli un nome univoco (es: `evolvia-documents-2024`)
     - ⚠️ Il nome deve essere univoco globalmente su tutti i bucket AWS
   - **AWS Region**: Scegli la regione più vicina a te (es: `eu-west-1` per l'Europa)
   - **Object Ownership**: Lascia **ACLs disabled** (consigliato)
   - **Block Public Access**: Lascia tutto selezionato (i file saranno privati)
4. Clicca **Create bucket** (Crea bucket)

### 2.2 Configura CORS (opzionale, se necessario)
Se devi accedere ai file dal browser, configura CORS:
1. Vai al tuo bucket
2. Tab **Permissions** (Permessi)
3. Scorri fino a **Cross-origin resource sharing (CORS)**
4. Clicca **Edit** e incolla:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

⚠️ Per produzione, sostituisci `"*"` con il tuo dominio specifico.

## ⚙️ Passo 3: Configurare il file .env

Apri il file `.env` nella root del progetto e modifica queste variabili:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
AWS_S3_BUCKET_NAME=evolvia-documents-2024
```

**Sostituisci con i tuoi valori reali:**
- `AWS_ACCESS_KEY_ID`: La chiave di accesso ottenuta al Passo 1.4
- `AWS_SECRET_ACCESS_KEY`: La chiave segreta ottenuta al Passo 1.4
- `AWS_REGION`: La regione del tuo bucket (es: `eu-west-1`, `us-east-1`)
- `AWS_S3_BUCKET_NAME`: Il nome del bucket creato al Passo 2.1

## ✅ Passo 4: Verificare la Configurazione

Esegui lo script di verifica:

```bash
npm run verify-aws
```

Oppure testa manualmente caricando un documento dall'applicazione.

## 🔒 Sicurezza - Best Practices

### Per Produzione:
1. **Crea una policy IAM più restrittiva** invece di `AmazonS3FullAccess`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::NOME-BUCKET/*"
       }
     ]
   }
   ```

2. **Usa variabili d'ambiente** invece di hardcodare le credenziali
3. **Non committare il file .env** nel repository (è già nel .gitignore)
4. **Ruota le chiavi** periodicamente per sicurezza

## 🆘 Risoluzione Problemi

### Errore: "Access Denied"
- Verifica che le credenziali siano corrette
- Controlla che l'utente IAM abbia i permessi S3
- Verifica che il nome del bucket sia corretto

### Errore: "Bucket not found"
- Controlla che il nome del bucket sia esatto (case-sensitive)
- Verifica che la regione sia corretta

### Errore: "Invalid credentials"
- Ricontrolla che Access Key ID e Secret Access Key siano copiati correttamente
- Assicurati che non ci siano spazi extra

## 📚 Risorse Utili

- [Documentazione AWS S3](https://docs.aws.amazon.com/s3/)
- [Guida IAM](https://docs.aws.amazon.com/iam/)
- [AWS Free Tier](https://aws.amazon.com/free/) - 5GB di storage S3 gratuito per 12 mesi

