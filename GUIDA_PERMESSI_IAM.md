# 🔐 Guida: Aggiungere Permessi S3 all'Utente IAM

## 📋 Passo-Passo per Aggiungere AmazonS3FullAccess

### Passo 1: Vai alla Pagina Utente IAM

1. Nella console AWS IAM, assicurati di essere nella sezione **Users** (Utenti)
2. Clicca sul nome dell'utente: **evolvia-s3-user**

### Passo 2: Aggiungi i Permessi

1. Nella pagina dell'utente, vai alla tab **Permissions** (Permessi) o **Autorizzazioni**
2. Cerca il pulsante **Add permissions** (Aggiungi permessi) o **Attach policies** (Allega policy)
3. Clicca su **Add permissions**

### Passo 3: Seleziona il Tipo di Permessi

Ti appariranno due opzioni:
- **Attach policies directly** (Allega policy direttamente) ← **Scegli questa**
- **Add user to group** (Aggiungi utente a un gruppo)

### Passo 4: Cerca e Seleziona la Policy

1. Nella barra di ricerca, digita: `AmazonS3FullAccess`
2. Troverai la policy **AmazonS3FullAccess** (gestita da AWS)
3. **Seleziona la checkbox** accanto a questa policy
4. Clicca su **Next** (Avanti) o **Add permissions** (Aggiungi permessi)

### Passo 5: Conferma

1. Verifica che la policy sia selezionata
2. Clicca su **Add permissions** (Aggiungi permessi) per confermare

### Passo 6: Verifica

Dopo aver aggiunto i permessi, dovresti vedere:
- Nella tab **Permissions**, la policy `AmazonS3FullAccess` elencata
- Lo stato dovrebbe essere **Attached** (Allegata)

## ✅ Verifica Finale

Dopo aver aggiunto i permessi, torna al terminale e esegui:

```bash
npm run verify-aws
```

Dovresti vedere:
```
✅ Connessione AWS riuscita!
✅ Bucket "evolvia-documents-2024" trovato e accessibile!
```

## 🖼️ Screenshot Guidato

### Dove Cliccare:

1. **IAM Console** → **Users** → **evolvia-s3-user**
2. Tab **Permissions** (o **Autorizzazioni**)
3. Pulsante **Add permissions** (o **Aggiungi permessi**)
4. Seleziona **Attach policies directly**
5. Cerca `AmazonS3FullAccess`
6. Seleziona la checkbox
7. Clicca **Next** → **Add permissions**

## ⚠️ Note Importanti

- Gli errori IAM che vedi (ListMFADevices, ListAccessKeys, ecc.) sono **normali** e non bloccano l'accesso S3
- Quello che serve è la policy **AmazonS3FullAccess** per l'accesso ai bucket S3
- Non serve dare permessi IAM completi all'utente, solo S3

## 🔒 Alternativa: Policy Più Restrittiva (Opzionale)

Se vuoi essere più sicuro in produzione, puoi creare una policy custom che permette solo l'accesso al tuo bucket specifico invece di tutti i bucket. Ma per ora, `AmazonS3FullAccess` va bene per sviluppo.

