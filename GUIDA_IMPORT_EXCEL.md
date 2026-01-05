# 📊 Guida Import Excel Clienti

## ✅ Condizioni per l'Import

Per importare correttamente i clienti da Excel, il file deve rispettare questi requisiti:

### 🔴 Campi Obbligatori

Il file Excel **DEVE** contenere queste colonne con dati validi:

1. **Nome** - Nome del cliente
2. **Cognome** - Cognome del cliente  
3. **Codice Fiscale** - Codice fiscale del cliente (deve essere unico)

### 🟢 Campi Opzionali

Queste colonne sono opzionali ma possono essere incluse:

- **Email** - Indirizzo email
- **Cellulare** o **Telefono** - Numero di telefono
- **Ragione Sociale** - Per clienti con partita IVA
- **P.IVA** o **Partita IVA** - Partita IVA
- **PEC** - Indirizzo PEC
- **Codice ATECO** - Codice ATECO
- **Modalità Pagamento** - Modalità di pagamento preferita
- **Stato** - Stato del cliente (default: "attivo")

## 📋 Formato File

- **Formato supportato**: `.xlsx` o `.xls`
- **Prima riga**: Deve contenere i nomi delle colonne (header)
- **Dati**: Dalla seconda riga in poi

## 🔤 Varianti Nome Colonne Supportate

Il sistema riconosce automaticamente queste varianti (case-insensitive):

| Campo | Varianti Supportate |
|-------|---------------------|
| **Nome** | Nome, nome, NOME, Name, name |
| **Cognome** | Cognome, cognome, COGNOME, Surname, surname, Last Name, lastname |
| **Codice Fiscale** | Codice Fiscale, codice_fiscale, codice fiscale, CF, cf, CodiceFiscale, codiceFiscale |
| **Email** | Email, email, EMAIL, E-mail, e-mail, E-Mail |
| **Cellulare** | Cellulare, cellulare, Telefono, telefono, Phone, phone, Tel, tel, Mobile, mobile |
| **Ragione Sociale** | Ragione Sociale, ragione_sociale, ragione sociale, RagioneSociale, ragioneSociale, Company, company, Azienda, azienda |
| **P.IVA** | P.IVA, piva, PIVA, Partita IVA, partita_iva, partita iva, PartitaIVA, VAT, vat |

## 📝 Template Excel

Ecco un esempio di come dovrebbe essere strutturato il file Excel:

| Nome | Cognome | Codice Fiscale | Email | Cellulare | Ragione Sociale | P.IVA |
|------|---------|----------------|-------|-----------|-----------------|-------|
| Mario | Rossi | RSSMRA80A01H501U | mario.rossi@email.com | 3331234567 | | |
| Luigi | Verdi | VRDLGU75B15F205X | luigi.verdi@email.com | 3337654321 | | |
| Azienda | SRL | 12345678901 | info@azienda.it | 061234567 | Azienda SRL | IT12345678901 |

## ⚠️ Errori Comuni

### 1. **0 clienti importati**

**Possibili cause:**
- ❌ Manca una colonna obbligatoria (Nome, Cognome, o Codice Fiscale)
- ❌ I nomi delle colonne non corrispondono a quelli supportati
- ❌ Le celle obbligatorie sono vuote
- ❌ Il file Excel è vuoto o non contiene dati

**Soluzione:**
- Verifica che la prima riga contenga i nomi delle colonne
- Assicurati che tutte le righe abbiano Nome, Cognome e Codice Fiscale compilati
- Controlla i log nella console del browser (F12) per vedere gli errori dettagliati

### 2. **Cliente già esistente**

**Causa:** Un cliente con lo stesso Codice Fiscale esiste già nel database

**Soluzione:** 
- Verifica che il Codice Fiscale sia unico
- Rimuovi i duplicati dal file Excel prima dell'import

### 3. **Formato file non supportato**

**Causa:** Il file non è in formato `.xlsx` o `.xls`

**Soluzione:**
- Salva il file come Excel (.xlsx)
- Non usare CSV o altri formati

## 🔍 Debug

Se l'import fallisce, controlla:

1. **Console del browser** (F12 → Console) per vedere i log dettagliati
2. **Messaggio di errore** che mostra:
   - Quali colonne sono state trovate
   - Quali campi obbligatori mancano
   - Numero di riga con errore

## 💡 Esempio Pratico

### File Excel Corretto ✅

```
| Nome    | Cognome | Codice Fiscale    | Email              |
|---------|---------|------------------|--------------------|
| Mario   | Rossi   | RSSMRA80A01H501U | mario@email.com    |
| Luigi   | Verdi   | VRDLGU75B15F205X | luigi@email.com    |
```

### File Excel Errato ❌

```
| First Name | Last Name | CF              | Email              |
|------------|-----------|-----------------|--------------------|
| Mario      | Rossi     | RSSMRA80A01H501U | mario@email.com    |
```

**Problema:** I nomi delle colonne non corrispondono. Usa "Nome" e "Cognome" invece di "First Name" e "Last Name".

## 📞 Supporto

Se continui ad avere problemi:

1. Verifica che il file Excel abbia la struttura corretta
2. Controlla che tutti i campi obbligatori siano compilati
3. Guarda i messaggi di errore dettagliati nell'alert
4. Controlla la console del browser per log aggiuntivi

