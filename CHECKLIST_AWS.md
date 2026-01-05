# ✅ Checklist Risoluzione Problemi AWS S3

## 🔍 Verifica 1: Credenziali IAM

1. Vai su [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → Trova il tuo utente
3. **Security credentials** tab
4. Verifica che l'**Access Key** sia **Active** (non Disabled)
5. Se è disabilitata, crea una nuova access key:
   - Clicca **Create access key**
   - Copia **Access Key ID** e **Secret Access Key**
   - Aggiorna il file `.env`

## 🔍 Verifica 2: Permessi IAM

1. Vai su [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → Seleziona il tuo utente
3. Tab **Permissions** (Permessi)
4. Verifica che ci sia una policy con permessi S3:
   - `AmazonS3FullAccess` (per sviluppo)
   - Oppure una policy custom con permessi S3

Se non ci sono permessi:
- Clicca **Add permissions** → **Attach policies directly**
- Cerca e seleziona `AmazonS3FullAccess`
- Clicca **Add permissions**

## 🔍 Verifica 3: Bucket S3 Esistente

1. Vai su [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Verifica che il bucket `evolvia-documents-2024` esista
3. Controlla la **regione** del bucket:
   - Clicca sul bucket
   - La regione è mostrata in alto (es: `eu-north-1`)
   - Deve corrispondere a `AWS_REGION` nel file `.env`

Se il bucket non esiste:
- Clicca **Create bucket**
- Nome: `evolvia-documents-2024`
- Regione: `eu-north-1` (o quella che preferisci)
- Clicca **Create bucket**

## 🔍 Verifica 4: Test Manuale

Dopo aver verificato tutto sopra, riprova:

```bash
npm run verify-aws
```

## 🆘 Se il Problema Persiste

### Opzione A: Ricrea le Credenziali
1. Vai su IAM → Users → Il tuo utente
2. **Security credentials** → **Delete** la vecchia access key
3. **Create access key** → Crea una nuova
4. Copia le nuove credenziali nel file `.env`

### Opzione B: Verifica Regione
Assicurati che la regione del bucket corrisponda esattamente a `AWS_REGION`:
- Bucket in `eu-north-1` → `AWS_REGION=eu-north-1`
- Bucket in `us-east-1` → `AWS_REGION=us-east-1`

### Opzione C: Test con AWS CLI (opzionale)
Se hai AWS CLI installato:
```bash
aws s3 ls s3://evolvia-documents-2024 --region eu-north-1
```

Se questo comando funziona ma l'app no, il problema è nella configurazione dell'app.

## 📞 Supporto

Se nessuna delle soluzioni funziona, verifica:
- Le credenziali sono state copiate completamente (tutti i 40 caratteri della secret key)
- Non ci sono caratteri nascosti o encoding issues nel file .env
- Il file .env è nella root del progetto (stessa cartella di package.json)

