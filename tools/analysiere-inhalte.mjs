#!/usr/bin/env node
// tools/analysiere-inhalte.mjs — Ähnlichkeit und Abdeckung über die Aufgaben.
//
// WARUM LEXIKALISCH UND NICHT MIT EMBEDDINGS?
// Das ist eine begründete Entscheidung, nicht eine Bequemlichkeit:
//   1. Eine Ähnlichkeitsanalyse mit Embeddings schlägt an, sobald ZWEI
//      Aufgaben DASSELBE THEMA haben — das ist bei einem Lehrstoff normal und
//      gewollt. Sie erzeugt deshalb viel Rauschen, das von Hand nachgesehen
//      werden muss.
//   2. Eine lexikalische Analyse schlägt nur an, wenn zwei Aufgaben DIESELBEN
//      WORTE benutzen. Das ist verdächtig und selten: ein echter Dublettenfall.
//   3. Sie braucht kein Modell, keine Erweiterung, keine Kosten und ist
//      jederzeit reproduzierbar.
// Embeddings bleiben sinnvoll, wenn die Wortwahl auseinandergeht ("USV" gegen
// "unterbrechungsfreie Stromversorgung"). Der Bericht sagt ausdrücklich, wo
// diese Grenze liegt — siehe Abschnitt "Grenzen".
//
// Ändert nichts. Schreibt nichts. Aufruf:  node tools/analysiere-inhalte.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const WURZEL = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const INDEX = join(WURZEL, 'index.html');

if (!existsSync(INDEX)) {
  console.error('index.html nicht gefunden in ' + WURZEL);
  process.exit(1);
}
const html = readFileSync(INDEX, 'utf8');

/* ============================================================
   Hilfen
   ============================================================ */
const STOPP = new Set(('der die das den dem des ein eine einer eines einem einen und oder aber ' +
  'ist sind war waren sein wird werden wurde wurden mit von zu zur zum im in auf aus bei nach ' +
  'für fur über uber unter zwischen durch gegen ohne um am an als auch nicht kein keine ' +
  'man sie er es ich wir du ihr sich diese dieser dieses welcher welche welches was wer wie ' +
  'wann wo warum bitte welche folgenden folgende folgendes nennt nennt man alle allen ' +
  'kann können konnen muss müssen mussen soll sollen darf dürfen durfen').split(/\s+/));

function woerter(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')          // Markup entfernen
    .replace(/[^a-zäöüß0-9]+/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPP.has(w));
}

// Zeichenweise Ähnlichkeit. Schnell, deterministisch, ohne Modell.
function trigramme(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
  const menge = new Set();
  for (let i = 0; i < t.length - 2; i++) menge.add(t.slice(i, i + 3));
  return menge;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let gemeinsam = 0;
  for (const x of a) if (b.has(x)) gemeinsam++;
  return gemeinsam / (a.size + b.size - gemeinsam);
}
function haeufigkeitsAnteil(a, b) {
  if (!a.size || !b.size) return 0;
  let gemeinsam = 0;
  for (const x of a) if (b.has(x)) gemeinsam++;
  return gemeinsam / Math.min(a.size, b.size);
}

/* ============================================================
   Einträge einsammeln
   ============================================================ */
function feld(text, name) {
  // Wichtig: das Feld muss an einer Wortgrenze beginnen. Ohne diese Verankerung
  // liest der Ausdruck für "e:" auch das "e: " in "quell**e: '**…'" — genau
  // dieser Fehler hat am 2026-09-29 einen funktionierenden Eintrag als
  // "verdächtig kurz" gemeldet.
  const grenze = '(?:^|[^a-zA-ZäöüßÄÖÜ0-9_])';
  const m = text.match(new RegExp(grenze + name + ":\\s*['\"`]((?:[^'\"`\\\\]|\\\\.){0,900}?)['\"`]", 'i'))
    || text.match(new RegExp(grenze + name + ":\\s*`([\\s\\S]{0,900}?)`"));
  return m ? m[1] : '';
}

const FORMAT = [
  ['QUIZ', 'Frage', 'Multiple-Choice'],
  ['KARTEN', 'Karte', 'Karteikarte'],
  ['LUECKEN', 'Lückentext', 'Lückentext'],
  ['FEHLER', 'Fehlersuche', 'Fehlersuche'],
  ['FAELLE', 'Fallstudie', 'Fallstudie'],
  ['TASKS', 'Aufgabe', 'Rechenaufgabe'],
  /* Teil 2: eigene Sammlungen. Der Prüfungsteil steht zusätzlich als t-Feld
     an jedem Eintrag; der Sammlungsname ist hier nur der Wegweiser. */
  ['QUIZ2', 'Frage', 'Multiple-Choice'],
  ['KARTEN2', 'Karte', 'Karteikarte'],
  ['LUECKEN2', 'Lückentext', 'Lückentext'],
  ['FEHLER2', 'Fehlersuche', 'Fehlersuche'],
  ['FAELLE2', 'Fallstudie', 'Fallstudie'],
  ['TASKS2', 'Aufgabe', 'Rechenaufgabe']
];

// Ein Eintrag beginnt mit "{" in eigener Zeile (Einrückung erlaubt) oder mit
// "{ b:" / "{ id:". Seit dem zweiten Prüfungsteil steht optional ein t-Feld
// davor. Der Ausdruck berücksichtigt beides.
function zerlegeEintraege(koerper) {
  const teile = koerper.split(/\n(?=\s*\{(?:\s*(?:t\s*:\s*['"]ap\d['"]\s*,\s*)?(?:b|id)\s*:|\s*\n))/);
  return teile.filter(t => /\bj:\s*[123]\b/.test(t));
}

const alle = [];
for (const [name] of FORMAT) {
  const m = html.match(new RegExp('const\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\n\\];', 'm'));
  if (!m) continue;
  for (const roh of zerlegeEintraege(m[1])) {
    const j = Number((roh.match(/\bj:\s*([123])\b/) || [])[1]) || 1;
    /* Der Prüfungsteil unterscheidet die beiden Datenbestände. Er kommt aus dem
       t-Feld; fehlt es, gilt der Eintrag als Teil 1 (Altdaten). */
    const teil = (roh.match(/\bt:\s*['"`](ap\d)['"`]/) || [])[1] || 'ap1';
    const b = (roh.match(/\bb:\s*['"`]([^'"`]+)['"`]/) || [])[1]
      || (roh.match(/\bbereich:\s*['"`]([^'"`]+)['"`]/) || [])[1] || '(ohne)';
    const titel = feld(roh, 'q') || feld(roh, 'f') || feld(roh, 'titel') || feld(roh, 'aufgabe') || '';
    const zusatz = feld(roh, 'e') || feld(roh, 'a') || feld(roh, 'text') || feld(roh, 'einstieg') || '';
    if (!titel && !zusatz) continue;
    const text = (titel + ' ' + zusatz).trim();
    alle.push({
      format: name, bereich: b, jahr: j, teil: teil,
      titel: titel || '(ohne Überschrift)',
      woerter: new Set(woerter(text)),
      tri: trigramme(text),
      // Volltext ohne Markup, für die Kürzungsprüfung
      roh: text.replace(/\s+/g, ' ').trim(),
      laenge: text.length
    });
  }
}

/* Die ausführlichen Abschnitte 1 bis 5 prüfen weiter Teil 1 (der eigene
   Datenbestand, an dem sich seit der Einführung von Teil 2 nichts geändert
   hat). Teil 2 bekommt am Ende einen eigenen, gleichartigen Block. */
const eintraege = alle.filter(x => x.teil === 'ap1');
const eintraege2 = alle.filter(x => x.teil === 'ap2');

console.log('Inhaltsanalyse — index.html (' + (html.length / 1024).toFixed(0) + ' KB)');
console.log('Einträge gesamt: ' + alle.length + '  ·  Teil 1: ' + eintraege.length + '  ·  Teil 2: ' + eintraege2.length);
console.log('');

/* ============================================================
   1. Verteilung je Format, Jahr und Bereich
   ============================================================ */
console.log('1. Verteilung');
const proFormat = {};
const proBereich = {};
for (const e of eintraege) {
  proFormat[e.format] = (proFormat[e.format] || 0) + 1;
  proBereich[e.bereich] = (proBereich[e.bereich] || 0) + 1;
}
console.log('  ' + Object.entries(proFormat).map(([k, v]) => k + ' ' + v).join(' · '));
console.log('');
console.log('  Bereiche (nach Anzahl):');
for (const [b, n] of Object.entries(proBereich).sort((x, y) => y[1] - x[1])) {
  const balken = '█'.repeat(Math.max(1, Math.round(n / 2)));
  console.log('    ' + b.padEnd(16) + String(n).padStart(4) + '  ' + balken);
}
console.log('');

/* ============================================================
   2. Abdeckung über die Bereiche × Jahre
   Eine leere Zelle heißt: für diesen Bereich gibt es in diesem Jahr NICHTS.
   ============================================================ */
console.log('2. Abdeckung Bereich × Jahr');
const jahre = [1, 2, 3];
const alleBereiche = Object.keys(proBereich).sort();
const luecken = [];
console.log('    ' + 'Bereich'.padEnd(16) + jahre.map(j => ('J' + j).padStart(6)).join(''));
for (const b of alleBereiche) {
  const zeile = jahre.map(j => eintraege.filter(e => e.bereich === b && e.jahr === j).length);
  // Kumulativ, wie die App filtert.
  const kum = [zeile[0], zeile[0] + zeile[1], zeile[0] + zeile[1] + zeile[2]];
  console.log('    ' + b.padEnd(16) + kum.map(n => String(n).padStart(6)).join(''));
  if (kum[0] === 0) luecken.push([b, 'Jahr 1 ist leer — wer im 1. Jahr ist, sieht zu ' + b + ' nichts']);
  else if (kum[1] === 0) luecken.push([b, 'Jahr 2 ist leer']);
  else if (kum[2] === 0) luecken.push([b, 'Jahr 3 ist leer']);
}
console.log('');
if (luecken.length) {
  console.log('  Gefundene Lücken:');
  for (const [b, text] of luecken) console.log('    ' + b + ': ' + text);
} else {
  console.log('  Keine leere Zelle — jeder Bereich hat in jedem Jahr etwas.');
}
console.log('');

/* ============================================================
   3. Verdächtige Paare
   Zwei Maße, weil eines allein irreführt:
     Jaccard   — Ähnlichkeit der Wortmenge insgesamt (bestraft Längenunterschied)
     Anteil    — welcher Teil des KÜRZEREN Textes im längeren steckt
   Ein Paar gilt nur dann als verdächtig, wenn BEIDE hoch sind.
   Sonst würde eine lange Fallstudie mit allen Texten "ähnlich" sein.
   ============================================================ */
console.log('3. Verdächtige Paare (mögliche Dubletten)');
const SCHWELLE_JACCARD = 0.55;
const SCHWELLE_ANTEIL = 0.80;

const paare = [];
for (let i = 0; i < eintraege.length; i++) {
  for (let k = i + 1; k < eintraege.length; k++) {
    const a = eintraege[i], b = eintraege[k];
    const j = jaccard(a.woerter, b.woerter);
    if (j < SCHWELLE_JACCARD) continue;
    const anteil = haeufigkeitsAnteil(a.woerter, b.woerter);
    if (anteil < SCHWELLE_ANTEIL) continue;
    paare.push({ a, b, j, anteil, jahrGleich: a.jahr === b.jahr });
  }
}
paare.sort((x, y) => y.j - x.j);

// Der wertvollste Befund sind Paare mit UNTERSCHIEDLICHEM Jahr: derselbe Stoff,
// aber die App zeigt ihn je nach Ausbildungsjahr an anderer Stelle — oder gar nicht.
const jahrAbweichung = paare.filter(p => !p.jahrGleich);
const gleichesJahr = paare.filter(p => p.jahrGleich);

// Welche Formate treffen sich überhaupt?
const formatPaare = {};
for (const p of paare) {
  const k = [p.a.format, p.b.format].sort().join(' ↔ ');
  formatPaare[k] = (formatPaare[k] || 0) + 1;
}

console.log('  ' + paare.length + ' Paar(e) über der Schwelle ' +
  '(Ähnlichkeit ≥ ' + SCHWELLE_JACCARD + ' UND Überdeckung ≥ ' + SCHWELLE_ANTEIL + ').');
console.log('');
for (const [k, n] of Object.entries(formatPaare).sort((x, y) => y[1] - x[1])) {
  console.log('    ' + k + ': ' + n);
}
console.log('');

if (jahrAbweichung.length) {
  console.log('  >>> Zu prüfen: gleicher Stoff, UNTERSCHIEDLICHES Jahr (' + jahrAbweichung.length + ')');
  console.log('      Diese Einträge zeigt die App in verschiedenen Ausbildungsjahren —');
  console.log('      oder in einem davon gar nicht. Eine Jahresmarke ist wahrscheinlich falsch.');
  for (const p of jahrAbweichung) {
    console.log('');
    console.log('      Ähnlichkeit ' + (p.j * 100).toFixed(0) + '% · Überdeckung ' + (p.anteil * 100).toFixed(0) + '%');
    console.log('        ' + p.a.format + ' J' + p.a.jahr + ' [' + p.a.bereich + '] ' + p.a.titel.slice(0, 68));
    console.log('        ' + p.b.format + ' J' + p.b.jahr + ' [' + p.b.bereich + '] ' + p.b.titel.slice(0, 68));
  }
  console.log('');
} else {
  console.log('  Kein Paar mit unterschiedlichem Jahr — die Jahresmarken sind in sich stimmig.');
  console.log('');
}

if (gleichesJahr.length) {
  console.log('  Gleiches Jahr, verschiedene Formate (' + gleichesJahr.length + ')');
  console.log('      Erwartet und gewollt: derselbe Stoff in zwei Abfrageformen —');
  console.log('      Quiz fragt ab, Karteikarte erklärt. Kein Handlungsbedarf.');
  for (const p of gleichesJahr) {
    console.log('      ' + (p.j * 100).toFixed(0) + '%  ' + p.a.format + '/' + p.b.format +
      ' J' + p.a.jahr + '  ' + p.a.titel.slice(0, 56));
  }
  console.log('');
}

// Paare INNERHALB eines Formats sind die einzigen echten Dubletten.
const innerhalb = paare.filter(p => p.a.format === p.b.format);
if (innerhalb.length) {
  console.log('  >>> Echte Dublettenprüfung: dasselbe Format, gleicher Stoff (' + innerhalb.length + ')');
  for (const p of innerhalb) {
    console.log('      ' + (p.j * 100).toFixed(0) + '%  ' + p.a.format + ' J' + p.a.jahr +
      '  ' + p.a.titel.slice(0, 50) + '  ↔  ' + p.b.titel.slice(0, 50));
  }
} else {
  console.log('  OK     Keine zwei Einträge IM SELBEN FORMAT sind sich ähnlich.');
  console.log('         Das ist das entscheidende Ergebnis: die Dublettengefahr liegt');
  console.log('         nur zwischen den Formaten, und dort ist sie gewollt.');
}
console.log('');

/* ============================================================
   4. Verdächtig kurze Einträge
   Ein abgeschnittener Text ist ein Datenfehler, der im Betrieb wie ein
   Rechenfehler aussieht.
   ============================================================ */
console.log('4. Verdächtig kurze Einträge (TASKS ausgenommen — Generatoren)');
const kurz = eintraege.filter(e => e.laenge < 40 && e.format !== 'TASKS');
if (!kurz.length) {
  console.log('  Keiner unter 40 Zeichen.');
} else {
  for (const e of kurz) {
    console.log('  ' + String(e.laenge).padStart(4) + ' Zeichen · ' + e.format + ' J' + e.jahr + ' · ' + e.titel.slice(0, 60));
  }
}
const kurzTasks = eintraege.filter(e => e.laenge < 40 && e.format === 'TASKS');
if (kurzTasks.length) {
  console.log('  (Dazu ' + kurzTasks.length + ' TASKS mit kurzem Titel — erwartet, das sind Generatoren.)');
}
console.log('');

/* ============================================================
   5. Vermutete Dubletten über den Dateiinhalt (unabhängig vom Formt)
   Ein sehr kurzer Text, der WORTGLEICH in zwei Einträgen steht, ist fast
   immer ein Kopierfehler.
   ============================================================ */
console.log('5. Wortgleiche Titel');
const nachTitel = {};
for (const e of eintraege) {
  const k = e.titel.toLowerCase().replace(/\s+/g, ' ').trim();
  if (k.length < 8) continue;
  (nachTitel[k] = nachTitel[k] || []).push(e);
}
let gleich = 0;
for (const [k, liste] of Object.entries(nachTitel)) {
  if (liste.length > 1) {
    gleich++;
    console.log('  ' + liste.length + '× "' + k.slice(0, 60) + '" — ' +
      liste.map(e => e.format + ' J' + e.jahr).join(', '));
  }
}
if (!gleich) console.log('  Kein Titel kommt mehrfach vor.');
console.log('');

/* ============================================================
   6. Zweiter Prüfungsteil (AP2)
   Eigener Block, weil Teil 2 eine andere Achse hat: keine Jahrgänge, sondern
   vier Prüfungsbereiche. Geprüft wird die Verteilung je Bereich und ob sich
   Einträge im selben Format zu ähnlich sind.
   ============================================================ */
console.log('6. Zweiter Prüfungsteil (AP2)');
if (!eintraege2.length) {
  console.log('  Keine AP2-Einträge gefunden.');
} else {
  const proFormat2 = {};
  const proBereich2 = {};
  for (const e of eintraege2) {
    proFormat2[e.format] = (proFormat2[e.format] || 0) + 1;
    proBereich2[e.bereich] = (proBereich2[e.bereich] || 0) + 1;
  }
  console.log('  ' + Object.entries(proFormat2).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('');
  console.log('  Prüfungsbereiche:');
  for (const [b, n] of Object.entries(proBereich2).sort((x, y) => y[1] - x[1])) {
    console.log('    ' + b.padEnd(16) + String(n).padStart(4) + '  ' + '█'.repeat(Math.max(1, Math.round(n / 2))));
  }
  console.log('');

  // Dubletten nur INNERHALB eines Formats — wie in Teil 1.
  const paare2 = [];
  for (let i = 0; i < eintraege2.length; i++) {
    for (let k = i + 1; k < eintraege2.length; k++) {
      const a = eintraege2[i], b = eintraege2[k];
      if (a.format !== b.format) continue;
      const j = jaccard(a.woerter, b.woerter);
      if (j < SCHWELLE_JACCARD) continue;
      if (haeufigkeitsAnteil(a.woerter, b.woerter) < SCHWELLE_ANTEIL) continue;
      paare2.push({ a, b, j });
    }
  }
  if (paare2.length) {
    console.log('  >>> Mögliche Dubletten im selben Format (' + paare2.length + '):');
    for (const p of paare2) {
      console.log('      ' + (p.j * 100).toFixed(0) + '%  ' + p.a.format + '  ' + p.a.titel.slice(0, 48) + '  ↔  ' + p.b.titel.slice(0, 48));
    }
  } else if (eintraege2.length >= 20) {
    console.log('  OK     Keine zwei AP2-Einträge IM SELBEN FORMAT sind sich ähnlich.');
  } else {
    console.log('  (Zu wenige AP2-Einträge je Format für eine belastbare Dublettenprüfung.)');
  }
  console.log('');
}

/* ============================================================
   Grenzen dieser Analyse — ausdrücklich genannt
   ============================================================ */
console.log('---------------------------------------------');
console.log('Was diese Analyse NICHT findet:');
console.log('  · zwei Aufgaben mit gleichem Inhalt, aber anderen Worten');
console.log('    ("USV" gegen "unterbrechungsfreie Stromversorgung")');
console.log('  · fachlich falsche Antworten — dafür braucht es einen Menschen');
console.log('  · ungeschickte Formulierungen');
console.log('Genau dort wären Embeddings stärker. Ihr Nachteil: sie melden bei');
console.log('Lehrstoff auch viele gewollte Themenüberschneidungen, und die muss');
console.log('dann jemand von Hand durchsehen.');
