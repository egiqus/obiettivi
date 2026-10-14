# Obiettivi

App web installabile (PWA) per obiettivi giornalieri, abitudini da costruire e cattive abitudini da eliminare. Nessuna dipendenza né build: solo HTML, CSS e JavaScript. I dati restano nel telefono (`localStorage`).

## Funzioni

- **Oggi**: obiettivi del giorno con "primo passo minuscolo", priorità evidenziate (max 3), pulsante per rimandare a domani, abitudini previste per oggi con serie 🔥.
- **Abitudini**: abitudini ricorrenti per giorni della settimana; contatore "giorni senza…" per le cattive abitudini, con "Ho ceduto" che lo azzera.
- **Statistiche**:
  - **Revisione settimanale** (lunedì–domenica): percentuale completata, confronto con la settimana prima, dettaglio per abitudine, obiettivi fatti, cadute e una nota personale salvata per ogni settimana. Con le frecce ◀ ▶ rivedi le settimane passate.
  - Calendario degli ultimi 28 giorni, backup/ripristino in JSON, promemoria giornaliero.
- **Traguardo dei 21 giorni**: quando una serie (o i giorni senza una cattiva abitudine) arriva a 21 compare 🏆, ma il conteggio continua. Per le abitudini non giornaliere la serie conta le volte previste.

## Provarla sul PC

```bash
cd obiettivi
python -m http.server 8000
```

Poi apri http://localhost:8000. Sul PC `localhost` basta per testare tutto.

## Averla sul cellulare Android

Per installare una PWA serve HTTPS, quindi `http://IP-del-pc:8000` non basta. Pubblica la cartella `obiettivi/` su un hosting statico gratuito, per esempio GitHub Pages, Netlify o Cloudflare Pages. Poi su Android:

1. apri l'indirizzo in **Chrome**;
2. menu ⋮ → **Installa app** (o "Aggiungi a schermata Home");
3. l'app si apre a schermo intero e funziona anche offline.

## Note

- I dati sono salvati nel browser del singolo dispositivo: usa **Esporta backup** ogni tanto. Cancellare i dati di Chrome li elimina.
- Il promemoria compare solo se l'app è aperta o in background. Per notifiche a app chiusa serve un server push (possibile come passo successivo).
- Dopo una modifica ai file, aggiorna `CACHE` in `sw.js` (per esempio `obiettivi-v2`) per forzare l'aggiornamento sui telefoni.
