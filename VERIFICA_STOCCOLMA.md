# 🔍 Verifica Configurazione AWS S3 - Regione Stoccolma (eu-north-1)

## ✅ Configurazione Attuale

- **Regione**: `eu-north-1` (Stoccolma) ✅ Corretta
- **Bucket**: `evolvia-documents-2024`
- **Access Key ID**: Configurata
- **Secret Access Key**: Configurata

## ⚠️ Problema Rilevato

Errore: "The request signature we calculated does not match the signature you provided"

Questo errore indica che AWS non riesce ad autenticare la richiesta. Le cause più comuni sono:

## 🔧 Checklist di Verifica

### 1. Verifica che il Bucket Esista in Stoccolma

1. Vai su [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Seleziona la regione **Europe (Stockholm) eu-north-1** in alto a destra
3. Verifica che il bucket `evolvia-documents-2024` sia presente
4. Se non c'è, crealo:
   - Clicca **Create bucket**
   - Nome: `evolvia-documents-2024`
   - **AWS Region**: `Europe (Stockholm) eu-north-1`
   - Clicca **Create bucket**

### 2. Verifica le Credenziali IAM

1. Vai su [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → Trova l'utente con l'Access Key che stai usando
3. Tab **Security credentials**
4. Verifica che l'Access Key sia **Active** (non Disabled)
5. Se è disabilitata o non corrisponde:
   - **Delete** la vecchia key
   - **Create access key** → Crea nuova
   - Copia **Access Key ID** e **Secret Access Key**
   - Aggiorna il file `.env`

### 3. Verifica i Permessi IAM

1. Nella stessa pagina utente IAM
2. Tab **Permissions** (Permessi)
3. Verifica che ci sia una policy con permessi S3:
   - `AmazonS3FullAccess` ✅
   - Oppure una policy custom con permessi S3

Se non ci sono permessi:
- Clicca **Add permissions** → **Attach policies directly**
- Cerca `AmazonS3FullAccess`
- Seleziona e clicca **Add permissions**

### 4. Verifica il File .env

Apri il file `.env` e verifica che sia così (senza spazi extra, senza virgolette):

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-north-1
AWS_S3_BUCKET_NAME=evolvia-documents-2024
```

⚠️ **Importante**:
- Nessuno spazio prima o dopo il `=`
- Nessuna virgoletta attorno ai valori
- La Secret Access Key deve essere completa (40 caratteri)

### 5. Test Dopo le Modifiche

Dopo aver verificato/corretto tutto sopra:

```bash
npm run verify-aws
```

## 🆘 Se il Problema Persiste

### Opzione A: Ricrea Tutto da Zero

1. **Crea nuovo utente IAM**:
   - IAM → Users → Create user
   - Nome: `evolvia-s3-user-new`
   - Attach policy: `AmazonS3FullAccess`
   - Crea access key
   - Copia le nuove credenziali

2. **Aggiorna .env** con le nuove credenziali

3. **Verifica bucket**:
   - Assicurati che esista in `eu-north-1`
   - Se non esiste, crealo

4. **Test**:
   ```bash
   npm run verify-aws
   ```

### Opzione B: Verifica con AWS CLI (se installato)

```bash
# Test connessione
aws s3 ls s3://evolvia-documents-2024 --region eu-north-1

# Se funziona, il problema è nella configurazione dell'app
# Se non funziona, il problema è nelle credenziali AWS
```

## 📝 Note Importanti

- La regione **eu-north-1** (Stoccolma) è corretta ✅
- Il problema è probabilmente nelle **credenziali** o nei **permessi**
- Assicurati che il bucket sia nella stessa regione (`eu-north-1`)

## ✅ Quando è Tutto OK

Dovresti vedere:
```
✅ Connessione AWS riuscita!
✅ Bucket "evolvia-documents-2024" trovato e accessibile!
✅ Configurazione AWS S3 completata con successo!
```

