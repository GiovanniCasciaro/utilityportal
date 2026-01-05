# 🚀 Quick Start: Deployment Sicuro

## Risposta Rapida alla Tua Domanda

**I tuoi dati NON verranno eliminati quando aggiorni il codice** perché:

1. ✅ Il database (`data/evolvia.db`) è escluso da Git (vedi `.gitignore`)
2. ✅ Gli uploads (`uploads/`) sono esclusi da Git
3. ✅ Il sistema usa `CREATE TABLE IF NOT EXISTS` - non elimina mai tabelle esistenti
4. ✅ Le migrazioni aggiungono solo nuove colonne, non rimuovono dati

## Processo di Aggiornamento (3 Passi)

```bash
# 1. Backup (opzionale ma consigliato)
npm run backup

# 2. Aggiorna il codice
git pull
npm install
npm run build

# 3. Riavvia
pm2 restart utilityportal
# oppure
docker-compose restart
```

**I dati rimangono intatti!** 🎉

## Verifica Stato Database

```bash
npm run db:status
```

## Backup Manuale

```bash
npm run backup
```

I backup vengono salvati in `./backups/` e mantengono gli ultimi 30 giorni.

## In Caso di Problemi

```bash
# Ripristina un backup
npm run restore YYYYMMDD_HHMMSS
```

## Per Maggiori Dettagli

Leggi la guida completa: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

