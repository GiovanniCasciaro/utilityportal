# 🚀 Configurazione Rapida AWS S3

## Quick Start (5 minuti)

### 1. Crea Account AWS (se non ce l'hai)
- Vai su [aws.amazon.com](https://aws.amazon.com) e crea un account gratuito
- Il Free Tier include 5GB di storage S3 per 12 mesi

### 2. Crea Credenziali IAM
1. Vai su [Console AWS IAM](https://console.aws.amazon.com/iam/)
2. **Users** → **Create user**
3. Nome: `evolvia-s3-user`
4. **Attach policies** → Cerca `AmazonS3FullAccess` → Seleziona
5. Crea utente
6. **Security credentials** → **Create access key**
7. Copia **Access Key ID** e **Secret Access Key** ⚠️ (mostrate solo una volta!)

### 3. Crea Bucket S3
1. Vai su [Console S3](https://s3.console.aws.amazon.com/)
2. **Create bucket**
3. Nome bucket: `evolvia-documents-TUO-NOME` (deve essere univoco globalmente)
4. Regione: Scegli la più vicina (es: `eu-west-1` per Europa)
5. **Create bucket**

### 4. Configura .env
Apri il file `.env` e modifica:

```env
AWS_ACCESS_KEY_ID=AKIA... (la tua access key)
AWS_SECRET_ACCESS_KEY=wJalr... (la tua secret key)
AWS_REGION=eu-west-1 (la regione del tuo bucket)
AWS_S3_BUCKET_NAME=evolvia-documents-TUO-NOME (nome del bucket)
```

### 5. Verifica Configurazione
```bash
npm run verify-aws
```

Se tutto è OK, vedrai:
```
✅ Configurazione AWS S3 completata con successo!
```

### 6. Testa l'Applicazione
```bash
npm run dev
```

Prova a caricare un documento dall'applicazione!

---

## 📖 Guida Dettagliata

Per una guida completa con screenshot e troubleshooting, vedi [AWS_SETUP.md](./AWS_SETUP.md)

## 🆘 Problemi Comuni

### "Bucket not found"
- Verifica che il nome del bucket in `.env` sia esatto (case-sensitive)
- Controlla che la regione sia corretta

### "Access Denied"
- Verifica che l'utente IAM abbia la policy `AmazonS3FullAccess`
- Controlla che le credenziali siano corrette

### "Invalid credentials"
- Ricontrolla Access Key ID e Secret Access Key
- Assicurati di non avere spazi extra

## 💰 Costi

- **Free Tier**: 5GB storage + 20,000 GET requests + 2,000 PUT requests al mese per 12 mesi
- **Dopo Free Tier**: ~$0.023 per GB al mese (varia per regione)
- Per 500MB per utente, con 10 utenti = 5GB = **GRATIS** nel Free Tier!

