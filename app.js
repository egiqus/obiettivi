"use strict";

const CHIAVE = "obiettivi-v1";
const NOMI_GIORNI = ["L", "M", "M", "G", "V", "S", "D"]; // 0 = lunedì
const MAX_PRIORITA = 3;
const TRAGUARDO = 21;

let stato = carica();
let giorniNuovaAbitudine = [0, 1, 2, 3, 4, 5, 6];

// ---------- dati ----------

function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE));
    if (s) return { task: [], abitudini: [], cattive: [], promemoria: null, note: {}, ...s };
  } catch (e) { /* dati assenti o rovinati */ }
  return { task: [], abitudini: [], cattive: [], promemoria: null, note: {} };
}

function salva() {
  localStorage.setItem(CHIAVE, JSON.stringify(stato));
  disegna();
}

const nuovoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- date ----------

function chiaveData(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${g}`;
}
const oggi = () => chiaveData(new Date());
const giornoSettimana = d => (d.getDay() + 6) % 7; // lunedì = 0

function giorniFa(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function previstaIl(abitudine, d) {
  return abitudine.giorni.includes(giornoSettimana(d));
}

// ---------- logica ----------

// Giorni consecutivi (tra quelli previsti) in cui l'abitudine è stata fatta.
// Se oggi non è ancora fatta non interrompe la serie.
function serie(abitudine) {
  let conta = 0;
  for (let i = 0; i < 400; i++) {
    const d = giorniFa(i);
    if (!previstaIl(abitudine, d)) continue;
    if (abitudine.fatti[chiaveData(d)]) conta++;
    else if (i > 0) break;
  }
  return conta;
}

function giorniPuliti(cattiva) {
  return Math.floor((Date.now() - cattiva.dal) / 86400000);
}

// Testo sul traguardo dei 21 giorni: il conteggio non si ferma mai.
function testoTraguardo(valore, unita) {
  if (valore >= TRAGUARDO) return `🏆 Traguardo dei ${TRAGUARDO} ${unita} raggiunto: continua così!`;
  return `Mancano ${TRAGUARDO - valore} ${unita} al traguardo dei ${TRAGUARDO}`;
}

function percentualeGiorno(d) {
  const k = chiaveData(d);
  let previsti = 0, fatti = 0;
  for (const a of stato.abitudini) {
    if (!previstaIl(a, d) || k < a.creata) continue;
    previsti++;
    if (a.fatti[k]) fatti++;
  }
  for (const t of stato.task) {
    if (t.data !== k) continue;
    previsti++;
    if (t.fatto) fatti++;
  }
  return previsti ? fatti / previsti : null;
}

// ---------- interfaccia ----------

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo !== undefined) e.textContent = testo;
  return e;
}

function bottone(testo, classe, onclick, etichetta) {
  const b = el("button", classe, testo);
  b.type = "button";
  if (etichetta) b.setAttribute("aria-label", etichetta);
  b.onclick = onclick;
  return b;
}

function disegna() {
  disegnaOggi();
  disegnaAbitudini();
  disegnaStat();
}

function disegnaOggi() {
  const data = new Date();
  document.getElementById("sottotitolo").textContent =
    data.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  const lista = document.getElementById("lista-task");
  lista.replaceChildren();
  const task = stato.task
    .filter(t => t.data === oggi())
    .sort((a, b) => a.fatto - b.fatto);
  const aperti = task.filter(t => !t.fatto).length;
  document.getElementById("nota-priorita").textContent =
    aperti > MAX_PRIORITA
      ? `Hai ${aperti} obiettivi aperti: i primi ${MAX_PRIORITA} sono le tue priorità, il resto può aspettare.`
      : "";

  let posizione = 0;
  for (const t of task) {
    const li = el("li", (t.fatto ? "fatto " : "") + (!t.fatto && posizione++ < MAX_PRIORITA ? "top" : ""));
    li.append(bottone(t.fatto ? "✓" : "", "spunta", () => { t.fatto = !t.fatto; salva(); }, "Segna fatto"));
    const corpo = el("div", "corpo");
    corpo.append(el("div", "titolo", t.testo));
    if (t.passo) corpo.append(el("div", "sotto", "Primo passo: " + t.passo));
    li.append(corpo);
    if (!t.fatto) {
      li.append(bottone("→", "icona", () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        t.data = chiaveData(d);
        salva();
      }, "Rimanda a domani"));
    }
    li.append(bottone("✕", "icona pericolo", () => {
      stato.task = stato.task.filter(x => x !== t);
      salva();
    }, "Elimina"));
    lista.append(li);
  }
  if (!task.length) lista.append(el("li", "", "Nessun obiettivo per oggi. Scegline al massimo tre."));

  const abOggi = document.getElementById("lista-abitudini-oggi");
  abOggi.replaceChildren();
  const k = oggi();
  const previste = stato.abitudini.filter(a => previstaIl(a, data));
  for (const a of previste) {
    const fatta = !!a.fatti[k];
    const li = el("li", fatta ? "fatto" : "");
    li.append(bottone(fatta ? "✓" : "", "spunta", () => {
      if (fatta) delete a.fatti[k]; else a.fatti[k] = true;
      salva();
    }, "Segna fatta"));
    const corpo = el("div", "corpo");
    corpo.append(el("div", "titolo", a.nome));
    if (serie(a) >= TRAGUARDO) corpo.append(el("div", "sotto", testoTraguardo(serie(a), a.giorni.length === 7 ? "giorni" : "volte")));
    li.append(corpo, el("span", "streak", `${serie(a) >= TRAGUARDO ? "🏆" : "🔥"} ${serie(a)}`));
    abOggi.append(li);
  }
  if (!previste.length) abOggi.append(el("li", "", "Nessuna abitudine prevista per oggi."));
}

function disegnaAbitudini() {
  const giorni = document.getElementById("giorni");
  giorni.replaceChildren();
  NOMI_GIORNI.forEach((n, i) => {
    const b = bottone(n, giorniNuovaAbitudine.includes(i) ? "on" : "", () => {
      giorniNuovaAbitudine = giorniNuovaAbitudine.includes(i)
        ? giorniNuovaAbitudine.filter(x => x !== i)
        : [...giorniNuovaAbitudine, i];
      disegnaAbitudini();
    });
    giorni.append(b);
  });

  const lista = document.getElementById("lista-abitudini");
  lista.replaceChildren();
  for (const a of stato.abitudini) {
    const li = el("li");
    const corpo = el("div", "corpo");
    corpo.append(el("div", "titolo", a.nome));
    corpo.append(el("div", "sotto", a.giorni.length === 7 ? "Ogni giorno" : a.giorni.map(i => NOMI_GIORNI[i]).join(" ")));
    corpo.append(el("div", "sotto", testoTraguardo(serie(a), a.giorni.length === 7 ? "giorni" : "volte")));
    li.append(corpo, el("span", "streak", `${serie(a) >= TRAGUARDO ? "🏆" : "🔥"} ${serie(a)}`));
    li.append(bottone("✕", "icona pericolo", () => {
      if (!confirm(`Eliminare "${a.nome}"?`)) return;
      stato.abitudini = stato.abitudini.filter(x => x !== a);
      salva();
    }, "Elimina"));
    lista.append(li);
  }

  const cattive = document.getElementById("lista-cattive");
  cattive.replaceChildren();
  for (const c of stato.cattive) {
    const li = el("li");
    const corpo = el("div", "corpo");
    corpo.append(el("div", "titolo", c.nome));
    corpo.append(el("div", "sotto", `Cadute totali: ${c.cadute}`));
    corpo.append(el("div", "sotto", testoTraguardo(giorniPuliti(c), "giorni")));
    li.append(corpo, el("span", "streak", `${giorniPuliti(c) >= TRAGUARDO ? "🏆" : ""} ${giorniPuliti(c)} giorni`.trim()));
    li.append(bottone("Ho ceduto", "", () => {
      c.dal = Date.now();
      c.cadute++;
      (c.log = c.log || []).push(oggi());
      salva();
    }));
    li.append(bottone("✕", "icona pericolo", () => {
      if (!confirm(`Eliminare "${c.nome}"?`)) return;
      stato.cattive = stato.cattive.filter(x => x !== c);
      salva();
    }, "Elimina"));
    cattive.append(li);
  }
}

// ---------- revisione settimanale ----------

let offsetSettimana = 0; // 0 = questa settimana, -1 = la scorsa, ...

function lunedi(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - giornoSettimana(d) + offset * 7);
  return d;
}

// Conta quanto è stato previsto e fatto in una settimana (fino a oggi compreso).
function analisiSettimana(offset) {
  const inizio = lunedi(offset);
  const adesso = oggi();
  let previsti = 0, fatti = 0, taskFatti = 0, taskAperti = 0, cadute = 0;
  const perAbitudine = stato.abitudini.map(a => ({ nome: a.nome, previste: 0, fatte: 0 }));
  for (let i = 0; i < 7; i++) {
    const d = new Date(inizio);
    d.setDate(inizio.getDate() + i);
    const k = chiaveData(d);
    if (k > adesso) break;
    stato.abitudini.forEach((a, n) => {
      if (!previstaIl(a, d) || k < a.creata) return;
      previsti++;
      perAbitudine[n].previste++;
      if (a.fatti[k]) { fatti++; perAbitudine[n].fatte++; }
    });
    for (const t of stato.task) {
      if (t.data !== k) continue;
      previsti++;
      if (t.fatto) { fatti++; taskFatti++; } else taskAperti++;
    }
    for (const c of stato.cattive) cadute += (c.log || []).filter(x => x === k).length;
  }
  const percentuale = previsti ? Math.round((fatti / previsti) * 100) : null;
  return { inizio, previsti, fatti, percentuale, taskFatti, taskAperti, cadute, perAbitudine: perAbitudine.filter(x => x.previste) };
}

function disegnaRevisione() {
  const w = analisiSettimana(offsetSettimana);
  const prec = analisiSettimana(offsetSettimana - 1);
  const fine = new Date(w.inizio);
  fine.setDate(fine.getDate() + 6);
  const f = d => d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  document.getElementById("settimana-titolo").textContent =
    (offsetSettimana === 0 ? "Questa settimana · " : "") + `${f(w.inizio)} – ${f(fine)}`;
  document.getElementById("settimana-dopo").disabled = offsetSettimana === 0;

  const box = document.getElementById("revisione");
  box.replaceChildren();
  const riga = (valore, etichetta) => {
    const r = el("div");
    r.append(el("b", "", valore), el("span", "sotto", etichetta));
    box.append(r);
  };
  riga(w.percentuale === null ? "–" : w.percentuale + "%", "Completato");
  let confronto = "Nessun dato nella settimana prima";
  if (w.percentuale !== null && prec.percentuale !== null) {
    const diff = w.percentuale - prec.percentuale;
    confronto = diff === 0 ? "Come la settimana prima" : `${diff > 0 ? "▲ +" : "▼ "}${diff} punti rispetto alla settimana prima`;
  }
  riga(prec.percentuale === null ? "–" : prec.percentuale + "%", confronto);
  riga(`${w.taskFatti}/${w.taskFatti + w.taskAperti}`, "Obiettivi del giorno fatti");
  riga(String(w.cadute), "Cadute sulle cattive abitudini");

  const dettaglio = document.getElementById("revisione-abitudini");
  dettaglio.replaceChildren();
  for (const x of w.perAbitudine) {
    const li = el("li");
    const corpo = el("div", "corpo");
    corpo.append(el("div", "titolo", x.nome));
    li.append(corpo, el("span", "streak", `${x.fatte}/${x.previste}`));
    dettaglio.append(li);
  }
  if (!w.perAbitudine.length) dettaglio.append(el("li", "", "Nessuna abitudine prevista in questa settimana."));

  const nota = document.getElementById("nota-settimana");
  if (document.activeElement !== nota) nota.value = stato.note[chiaveData(w.inizio)] || "";
}

function disegnaStat() {
  disegnaRevisione();
  const cal = document.getElementById("calendario");
  cal.replaceChildren();
  for (let i = 27; i >= 0; i--) {
    const d = giorniFa(i);
    const p = percentualeGiorno(d);
    const cella = el("div", "", String(d.getDate()));
    if (p !== null) {
      cella.style.background = `rgba(34, 197, 94, ${0.15 + 0.85 * p})`;
      if (p > 0.5) cella.style.color = "#052e16";
    }
    cal.append(cella);
  }

  let previsti = 0, fatti = 0;
  for (let i = 0; i < 7; i++) {
    const d = giorniFa(i), k = chiaveData(d);
    for (const a of stato.abitudini) {
      if (!previstaIl(a, d) || k < a.creata) continue;
      previsti++;
      if (a.fatti[k]) fatti++;
    }
    for (const t of stato.task) {
      if (t.data !== k) continue;
      previsti++;
      if (t.fatto) fatti++;
    }
  }
  const migliore = Math.max(0, ...stato.abitudini.map(serie));
  const pulito = Math.max(0, ...stato.cattive.map(giorniPuliti));
  const riepilogo = document.getElementById("riepilogo");
  riepilogo.replaceChildren();
  for (const [valore, etichetta] of [
    [previsti ? Math.round((fatti / previsti) * 100) + "%" : "–", "Completato, ultimi 7 giorni"],
    [String(fatti), "Cose fatte, ultimi 7 giorni"],
    [String(migliore), "Serie migliore in corso"],
    [String(pulito), "Giorni puliti (record attuale)"],
  ]) {
    const box = el("div");
    box.append(el("b", "", valore), el("span", "sotto", etichetta));
    riepilogo.append(box);
  }
}

// ---------- eventi ----------

document.getElementById("form-task").onsubmit = e => {
  e.preventDefault();
  const testo = document.getElementById("task-testo");
  const passo = document.getElementById("task-passo");
  stato.task.push({ id: nuovoId(), testo: testo.value.trim(), passo: passo.value.trim(), data: oggi(), fatto: false });
  testo.value = passo.value = "";
  salva();
};

document.getElementById("form-abitudine").onsubmit = e => {
  e.preventDefault();
  if (!giorniNuovaAbitudine.length) return alert("Scegli almeno un giorno.");
  const nome = document.getElementById("abitudine-nome");
  stato.abitudini.push({
    id: nuovoId(), nome: nome.value.trim(), giorni: [...giorniNuovaAbitudine].sort(), fatti: {}, creata: oggi(),
  });
  nome.value = "";
  salva();
};

document.getElementById("form-cattiva").onsubmit = e => {
  e.preventDefault();
  const nome = document.getElementById("cattiva-nome");
  stato.cattive.push({ id: nuovoId(), nome: nome.value.trim(), dal: Date.now(), cadute: 0 });
  nome.value = "";
  salva();
};

const TITOLI = { oggi: "Oggi", abitudini: "Abitudini", stat: "Statistiche" };
document.querySelectorAll("nav button").forEach(b => {
  b.onclick = () => {
    const vista = b.dataset.vista;
    document.querySelectorAll("nav button").forEach(x => x.classList.toggle("attivo", x === b));
    for (const v of Object.keys(TITOLI)) document.getElementById("vista-" + v).hidden = v !== vista;
    document.getElementById("titolo").textContent = TITOLI[vista];
    window.scrollTo(0, 0);
  };
});

document.getElementById("esporta").onclick = () => {
  const blob = new Blob([JSON.stringify(stato, null, 2)], { type: "application/json" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = `obiettivi-${oggi()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

document.getElementById("importa").onclick = () => document.getElementById("file-importa").click();
document.getElementById("file-importa").onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dati = JSON.parse(await file.text());
    if (!Array.isArray(dati.task) || !Array.isArray(dati.abitudini) || !Array.isArray(dati.cattive)) throw new Error();
    if (!confirm("Sostituire i dati attuali con quelli del backup?")) return;
    stato = { promemoria: null, note: {}, ...dati };
    salva();
  } catch (err) {
    alert("File non valido.");
  }
  e.target.value = "";
};

document.getElementById("settimana-prima").onclick = () => { offsetSettimana--; disegnaRevisione(); };
document.getElementById("settimana-dopo").onclick = () => { offsetSettimana++; disegnaRevisione(); };
document.getElementById("nota-settimana").oninput = e => {
  // salvataggio diretto, senza ridisegnare per non perdere il cursore
  stato.note[chiaveData(lunedi(offsetSettimana))] = e.target.value;
  localStorage.setItem(CHIAVE, JSON.stringify(stato));
};

// ---------- promemoria ----------
// Una PWA non può inviare notifiche con l'app chiusa senza un server push:
// qui il promemoria scatta quando l'app è aperta o in background.

function aggiornaNotaPromemoria() {
  const nota = document.getElementById("nota-promemoria");
  if (!("Notification" in window)) {
    nota.textContent = "Questo browser non supporta le notifiche.";
  } else if (stato.promemoria && Notification.permission === "granted") {
    nota.textContent = `Promemoria attivo alle ${stato.promemoria}, quando l'app è aperta o in background.`;
  } else {
    nota.textContent = "Il promemoria compare solo se l'app è aperta o in background, non a app chiusa.";
  }
}

document.getElementById("attiva-promemoria").onclick = async () => {
  if (!("Notification" in window)) return aggiornaNotaPromemoria();
  const permesso = await Notification.requestPermission();
  if (permesso === "granted") {
    stato.promemoria = document.getElementById("ora-promemoria").value;
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
  }
  aggiornaNotaPromemoria();
};

setInterval(() => {
  if (!stato.promemoria || !("Notification" in window) || Notification.permission !== "granted") return;
  const ora = new Date().toTimeString().slice(0, 5);
  const ultima = localStorage.getItem(CHIAVE + "-notificato");
  if (ora !== stato.promemoria || ultima === oggi()) return;
  localStorage.setItem(CHIAVE + "-notificato", oggi());
  const aperti = stato.task.filter(t => t.data === oggi() && !t.fatto).length;
  navigator.serviceWorker.ready.then(r =>
    r.showNotification("Obiettivi", { body: aperti ? `Hai ${aperti} obiettivi aperti oggi.` : "Pianifica la tua giornata: scegli 3 priorità.", icon: "icon-192.png" })
  );
}, 30000);

// ---------- avvio ----------

if (stato.promemoria) document.getElementById("ora-promemoria").value = stato.promemoria;
aggiornaNotaPromemoria();
disegna();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
