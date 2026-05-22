# Specifiche Tecniche e Funzionali: Budgeter PWA

## 1. Visione del Progetto
L'obiettivo è la creazione di una **Progressive Web App (PWA)** per la gestione del budget personale, ispirata a un modello avanzato di controllo finanziario. L'app deve permettere all'utente di pianificare (Budget Atteso) e monitorare (Budget Effettivo) le proprie finanze su base mensile e annuale, garantendo la totale privacy dei dati.

## 2. Stack Tecnologico Richiesto
- **Frontend:** React JS.
- **Formato:** PWA (Progressive Web App) con supporto Service Worker per installazione su Mobile/Desktop e funzionamento offline.
- **Persistence (Database):** Web Local Storage API (Architettura Zero-Server). Nessun dato deve essere inviato a server esterni.
- **Grafica:** Libreria per grafici (es. Recharts o Chart.js).
- **Styling:** Tailwind CSS (consigliato per approccio mobile-first e responsive).

## 3. Logica Temporale
- **Ciclo Mensile:** Calendario solare standard (dal giorno 1 all'ultimo giorno del mese).
- **Flessibilità:** L'app non deve avere limiti di anno (supporto per 2026, 2027 e successivi).
- **Navigazione:** Selettore dinamico per Anno e Mese nella testata dell'applicazione.

## 4. Modello dei Dati
Le transazioni sono raggruppate per anno e mese. Ogni transazione deve avere:
- `id`: UUID univoco.
- `descrizione`: Stringa (es. "Affitto", "Stipendio").
- `tipo`: Enum [`Ingresso`, `Necessario`, `Sfizio`, `Risparmio`].
- `atteso`: Valore numerico (float).
- `effettivo`: Valore numerico (float).
- `note`: Stringa (opzionale).

### Esempio Struttura JSON in Local Storage:
```json
{
  "2026": {
    "Gennaio": [
      { 
        "id": "123", 
        "desc": "Stipendio", 
        "tipo": "Ingresso", 
        "atteso": 2000, 
        "effettivo": 2100, 
        "note": "" 
      },
      { 
        "id": "456", 
        "desc": "Affitto", 
        "tipo": "Necessario", 
        "atteso": 700, 
        "effettivo": 700, 
        "note": "" 
      }
    ]
  }
}
```

## 5. Funzionalità Core

### A. Modulo Inserimento e Gestione
- Tabella/Lista editabile per il mese selezionato.
- Possibilità di aggiungere, modificare ed eliminare righe.
- Funzione **"Copia in tutti i mesi"**: permette di replicare una voce ricorrente per l'intero anno in corso.

### B. Calcoli e Logica di Business
- **Totali per Categoria:** Somma di 'Atteso' ed 'Effettivo' per ognuna delle 4 categorie.
- **Margine Mensile:** Calcolato come `Totale Ingressi - (Necessario + Sfizi + Risparmi)`.
- **Alert Scostamento:** Evidenziazione visiva (es. colore rosso) se `Effettivo > Atteso` nelle categorie di spesa.

### C. Dashboard e Reporting
- Visualizzazione di 4 grafici a linee (uno per categoria).
- **Asse X:** I 12 mesi dell'anno selezionato.
- **Asse Y:** Valore monetario.
- **Serie Dati:** Ogni grafico deve mostrare due linee a confronto: Pianificato (Atteso) vs Reale (Effettivo).

### D. Privacy & Data Management
- **Local Storage:** Sincronizzazione automatica dello stato di React con il Local Storage.
- **Backup (Esporta):** Funzione per scaricare un file `.json` contenente l'intero database locale.
- **Ripristino (Importa):** Funzione per caricare un file `.json` esterno e sovrascrivere/unire i dati (per migrazione tra dispositivi).
- **Clear Data:** Pulsante per il wipe totale dei dati locali.

## 6. Requisiti UI/UX
- **Mobile First:** L'interfaccia deve essere ottimizzata per l'uso con una sola mano su smartphone.
- **Responsive:** Layout a griglia per sfruttare lo spazio su monitor desktop.
- **Filtri Rapidi:** Switch veloce tra i mesi tramite swipe o menu a tendina.