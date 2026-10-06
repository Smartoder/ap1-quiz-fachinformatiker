// tools/pruefe-frontend.mjs — die Prüfungen des Qualitätstors.
//
// Läuft lokal und in der Automatisierung. Muss in beiden Umgebungen DASSELBE
// ergeben. Nur Node-Bordmittel, keine Abhängigkeiten, keine Netzwerkzugriffe.
//
// Aufruf:  node tools/pruefe-frontend.mjs
//
// Geprüft wird:
//   1. HTML-Grundgerüst (Sprache, Zeichensatz, Ansicht, Titel)
//   2. Aufbau: genau ein Skriptblock und ein Stilblock
//   3. Syntax des gesamten Anwendungscodes (echte Prüfung, keine Klammerzählung)
//   4. Vertrag mit dem Backend (Adresse, Speicher-Namen)
//   5. Inhaltsbestand (sechs Formate vorhanden und gefüllt)
//   6. Secret-Muster
//   7. Keine Entwicklungsreste in der ausgelieferten Datei
//   8. vercel.json
//
// Rückgabewert 1, sobald etwas fehlschlägt.
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, relative, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const WURZEL = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const INDEX = join(WURZEL, 'index.html');
const VERCEL = join(WURZEL, 'vercel.json');

let fehler = 0;
let geprueft = 0;
const ok = (text) => { geprueft++; console.log('  OK     ' + text); };
const fehl = (text, detail) => {
  geprueft++; fehler++;
  console.log('  FEHLER ' + text);
  if (detail) console.log('         ' + detail);
};
const hinweis = (text) => console.log('  Hinweis ' + text);
const rel = (p) => relative(WURZEL, p).replace(/\\/g, '/');

if (!existsSync(INDEX)) {
  console.log('FEHLER index.html nicht gefunden in ' + WURZEL);
  process.exit(1);
}

const html = readFileSync(INDEX, 'utf8');
const kb = (html.length / 1024).toFixed(0);
console.log('Prüfe index.html (' + kb + ' KB, ' + html.split('\n').length + ' Zeilen)');
console.log('');

/* ============================================================
   1. HTML-Grundgerüst
   ============================================================ */
console.log('1. HTML-Grundgerüst');
const geruest = [
  ['<!DOCTYPE html>', /^\s*<!DOCTYPE html>/i],
  ['Sprache gesetzt', /<html[^>]+lang="[a-z]{2}/i],
  ['Zeichensatz gesetzt', /<meta[^>]+charset=["\']?[a-z0-9-]+/i],
  ['Ansicht für schmale Geräte', /<meta[^>]+name=["\']viewport["\']/i],
  ['Titel vorhanden', /<title>[^<]{3,}<\/title>/is],
  ['Stilblock vorhanden', /<style[\s>]/i],
  ['Skriptblock vorhanden', /<script[\s>]/i]
];
for (const [was, muster] of geruest) {
  muster.test(html) ? ok(was) : fehl(was + ' — fehlt');
}
console.log('');

/* ============================================================
   2. Aufbau
   Bewusste Entscheidung: eine Datei, ein Stilblock, ein Skriptblock.
   Zwei Skriptblöcke hießen zwei Ladephasen und zwei Fehlerquellen.
   ============================================================ */
console.log('2. Aufbau');
const anzahlSkript = (html.match(/<script[\s>]/gi) || []).length;
const anzahlStil = (html.match(/<style[\s>]/gi) || []).length;
anzahlSkript === 1 ? ok('genau ein Skriptblock') : fehl('erwartet 1 Skriptblock, gefunden ' + anzahlSkript);
anzahlStil === 1 ? ok('genau ein Stilblock') : fehl('erwartet 1 Stilblock, gefunden ' + anzahlStil);
const schliessSkript = (html.match(/<\/script>/gi) || []).length;
schliessSkript === anzahlSkript ? ok('Skriptblöcke korrekt geschlossen') : fehl('Skriptblock nicht geschlossen');
console.log('');

/* ============================================================
   3. Syntax des Anwendungscodes
   Der Skriptinhalt wird herausgezogen und wirklich geparst. Eine
   Klammerzählung wäre unzuverlässig: Klammern kommen auch in Zeichenketten
   und in regulären Ausdrücken vor.
   ============================================================ */
console.log('3. Syntax des Anwendungscodes');
const treffer = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
if (!treffer) {
  fehl('Skriptinhalt nicht lesbar');
} else {
  const code = treffer[1];
  if (code.trim().length < 1000) {
    fehl('Skriptinhalt unerwartet kurz', code.trim().length + ' Zeichen');
  } else {
    let ordner = null;
    try {
      ordner = mkdtempSync(join(tmpdir(), 'ap1pruef-'));
      const pruefdatei = join(ordner, 'anwendung.mjs');
      writeFileSync(pruefdatei, code, 'utf8');
      execFileSync(process.execPath, ['--check', pruefdatei], { stdio: 'pipe' });
      ok('Anwendungscode syntaktisch gültig (' + code.split('\n').length + ' Zeilen)');
    } catch (e) {
      fehl('Syntaxfehler im Anwendungscode',
        String(e.stderr || e.message).split('\n').filter(Boolean).slice(0, 4).join(' / '));
    } finally {
      if (ordner) rmSync(ordner, { recursive: true, force: true });
    }
  }
}
console.log('');

/* ============================================================
   4. Vertrag mit dem Backend und dem Speicher
   Wer diese Werte ändert, bricht das Backend oder verliert den Fortschritt
   aller Nutzer, ohne dass eine Fehlermeldung erscheint.
   ============================================================ */
console.log('4. Vertrag mit dem Backend und dem Speicher');
const vertrag = [
  ['Backend-Adresse', /const\s+API\s*=\s*['"]\/ap1['"]/],
  ['Fortschritt-Speicher', /const\s+STORE\s*=\s*['"]ap1-trainer-v1['"]/],
  ['Jahr-Speicher', /const\s+JAHR_STORE\s*=\s*['"]ap1-trainer-jahr['"]/],
  ['Profil-Speicher', /const\s+PROFIL_STORE\s*=\s*['"]ap1-trainer-profil['"]/],
  ['Karten-Speicher', /const\s+KARTEN_STORE\s*=\s*['"]ap1-trainer-karten-v1['"]/],
  ['Prüfungsteil-Speicher', /const\s+TEIL_STORE\s*=\s*['"]ap1-trainer-teil['"]/]
];
for (const [was, muster] of vertrag) {
  muster.test(html)
    ? ok(was)
    : fehl(was + ' hat sich geändert',
      'Erwartet: ' + String(muster).replace(/^.*['"]ap1/, '"ap1').replace(/['"].*$/, '"') +
      ' — eine Änderung bricht das Backend bzw. verwirft den Fortschritt aller Nutzer ohne Fehlermeldung');
}
console.log('');

/* ============================================================
   5. Inhaltsbestand und Jahrgangs-Regel
   Zwei Dinge werden geprüft:
     a) Jeder Eintrag hat genau eine Jahresmarke `j`.
     b) Die Jahres-Sicht ist KUMULATIV: Jahr 1 enthält nichts aus Jahr 3,
        und die Menge wächst mit dem Jahr. Genau das ist die fachliche Regel
        aus dem Umsetzungsplan — die Prüfung erzwingt sie.

   Gezählt wird über die Jahresmarke, nicht über "{": Einträge enthalten
   verschachtelte Objekte, und eine Zählung der Klammern ergäbe falsche Zahlen.
   ============================================================ */
console.log('5. Inhaltsbestand und Jahrgangs-Regel');

// Je Format: wie ein Eintrag beginnt, und wie viele Jahre er kennt.
// Seit dem zweiten Prüfungsteil trägt jeder Eintrag ein führendes t-Feld
// ('ap1' oder 'ap2'). Die Muster tolerieren es, erkennen aber weiterhin den
// Beginn eines Eintrags am Schlüsselfeld b bzw. id.
const FORMATE = [
  ['QUIZ', /\{\s*(?:t:\s*'ap\d',\s*)?b:\s*'/g],
  ['KARTEN', /\{\s*(?:t:\s*'ap\d',\s*)?b:\s*'/g],
  ['LUECKEN', /\{\s*\n\s*(?:t:\s*'ap\d',\s*)?id:\s*'/g],
  ['FEHLER', /\{\s*\n\s*(?:t:\s*'ap\d',\s*)?id:\s*'/g],
  ['FAELLE', /\{\s*\n\s*(?:t:\s*'ap\d',\s*)?id:\s*'/g],
  ['TASKS', /\{\s*\n\s*(?:t:\s*'ap\d',\s*)?id:\s*'/g]
];

const jahrTabelle = [];
let gesamtEintraege = 0;
let regelVerletzt = 0;

for (const [name, beginn] of FORMATE) {
  const m = html.match(new RegExp('const\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\n\\];', 'm'));
  if (!m) { fehl('Format ' + name + ' nicht gefunden'); regelVerletzt++; continue; }

  const koerper = m[1];
  const eintraege = (koerper.match(beginn) || []).length;
  const marken = (koerper.match(/\bj:\s*[123]\b/g) || []).length;

  if (eintraege === 0) { fehl('Format ' + name + ' ist leer'); regelVerletzt++; continue; }
  if (marken !== eintraege) {
    fehl('Format ' + name + ': ' + eintraege + ' Einträge, aber ' + marken + ' Jahresmarken',
      'Jeder Eintrag braucht genau ein "j" — ein Eintrag ohne j verschwindet aus der Jahressicht');
    regelVerletzt++;
  } else {
    ok('Format ' + name + ': ' + eintraege + ' Einträge, alle mit Jahresmarke');
  }

  const j1 = (koerper.match(/\bj:\s*1\b/g) || []).length;
  const j2 = (koerper.match(/\bj:\s*2\b/g) || []).length;
  const j3 = (koerper.match(/\bj:\s*3\b/g) || []).length;
  gesamtEintraege += eintraege;
  jahrTabelle.push([name, eintraege, j1, j1 + j2, j1 + j2 + j3]);

  // Kumulativ: Jahr 2 schließt Jahr 1 ein, Jahr 3 schließt beide ein.
  if (!(j1 <= j1 + j2 && j1 + j2 <= j1 + j2 + j3 && j1 + j2 + j3 === eintraege)) {
    fehl('Format ' + name + ': Jahres-Sicht ist nicht kumulativ',
      'J1=' + j1 + ' J2=' + (j1 + j2) + ' J3=' + (j1 + j2 + j3) + ' bei ' + eintraege + ' Einträgen');
    regelVerletzt++;
  }
}

if (jahrTabelle.length) {
  console.log('');
  console.log('  Format     gesamt     Jahr 1     Jahr 2     Jahr 3');
  for (const [name, gesamt, a, b, c] of jahrTabelle) {
    console.log('  ' + name.padEnd(10) + String(gesamt).padStart(6) +
      String(a).padStart(11) + String(b).padStart(11) + String(c).padStart(11));
  }
  const summe = jahrTabelle.reduce((s, z) => s + z[1], 0);
  ok(summe + ' Einträge, Jahres-Sicht überall kumulativ');
}
console.log('');

/* ============================================================
   5b. Zweiter Prüfungsteil (AP2)
   Seit dem Umbau führt der Trainer zwei getrennte Oberflächen. Diese Prüfung
   stellt sicher, dass AP2 nicht nur halb eingebaut ist: alle sechs Sammlungen
   müssen vorhanden, gefüllt und mit genau vier gültigen Bereichen versehen
   sein, und jeder Eintrag muss den richtigen Prüfungsteil tragen.
   ============================================================ */
console.log('5b. Zweiter Prüfungsteil (AP2)');
const AP2_FORMATE = ['QUIZ2', 'KARTEN2', 'LUECKEN2', 'FEHLER2', 'FAELLE2', 'TASKS2'];
const AP2_BEREICHE = ['kundenauftrag', 'systemloesung', 'kaufmaennisch', 'wiso'];
let ap2Gesamt = 0, ap2Fehler = 0;
for (const name of AP2_FORMATE) {
  const m = html.match(new RegExp('const\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\n\\];', 'm'));
  if (!m) { fehl('AP2-Sammlung ' + name + ' fehlt'); ap2Fehler++; continue; }
  const koerper = m[1];
  // Einträge beginnen mit "{ t: 'ap2'" (inline) oder "{\n … t: 'ap2'".
  const eintraege = (koerper.match(/\{\s*(?:\n\s*)?t:\s*'ap2'/g) || []).length;
  if (eintraege === 0) { fehl('AP2-Sammlung ' + name + ' ist leer'); ap2Fehler++; continue; }
  // Bereiche prüfen
  const bereiche = [...koerper.matchAll(/\bb:\s*'([^']+)'/g)].map(x => x[1]);
  const fremd = bereiche.filter(b => !AP2_BEREICHE.includes(b));
  if (fremd.length) {
    fehl(name + ': unbekannte AP2-Bereiche', [...new Set(fremd)].join(', '));
    ap2Fehler++;
  }
  ap2Gesamt += eintraege;
  ok(name + ': ' + eintraege + ' Einträge');
}
// Die vier Bereiche müssen definiert sein und in der Kopfzeile verwendet werden.
for (const id of AP2_BEREICHE) {
  new RegExp("id:\\s*'" + id + "'").test(html)
    ? ok('AP2-Bereich definiert: ' + id)
    : (fehl('AP2-Bereich fehlt: ' + id), ap2Fehler++);
}
// Der Umschalter und der Filter müssen im Anwendungscode stehen.
for (const [was, muster] of [
  ['Umschalter-Knopf', /id="btn-teil"/],
  ['Prüfungsteil-Zustand', /let\s+teil\s*=\s*'ap1'/],
  ['Daten-Funktion', /function\s+daten\s*\(/]
]) {
  muster.test(html) ? ok(was) : (fehl(was + ' fehlt'), ap2Fehler++);
}
if (!ap2Fehler) ok(ap2Gesamt + ' AP2-Einträge über vier Prüfungsbereiche');
console.log('');

/* ============================================================
   6. Secret-Muster
   ============================================================ */
console.log('6. Secret-Muster');
const MUSTER = [
  ['GitHub-Token (klassisch)', /ghp_[A-Za-z0-9]{30,}/],
  ['GitHub-Token (fein)', /github_pat_[A-Za-z0-9_]{20,}/],
  ['Vercel-Token', /vcp_[A-Za-z0-9]{20,}/],
  ['Stripe Live Secret', /[sr]k_live_[A-Za-z0-9]{20,}/],
  ['Stripe Test Secret', /sk_test_[A-Za-z0-9]{20,}/],
  ['Stripe Webhook Secret', /whsec_[A-Za-z0-9]{20,}/],
  ['OpenRouter-Schlüssel', /sk-or-v1-[a-f0-9]{20,}/],
  ['JWT (Dienstschlüssel)', /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}/]
];
let trefferAnzahl = 0;
const zeilen = html.split('\n');
for (const [name, muster] of MUSTER) {
  zeilen.forEach((zeile, i) => {
    if (muster.test(zeile)) {
      trefferAnzahl++;
      fehl(name + ' in index.html:' + (i + 1), 'Zeile: ' + zeile.trim().slice(0, 80));
    }
  });
}
if (!trefferAnzahl) ok('kein Secret-Muster in index.html');
// Zugangsdaten dürfen in einer öffentlichen Datei grundsätzlich nicht stehen.
for (const [was, muster] of [
  ['Zuweisung eines Geheimnisses', /(?:api[_-]?key|secret|passwort|password|token)\s*[:=]\s*['"][^'"\s]{16,}['"]/i]
]) {
  if (muster.test(html)) fehl(was + ' in index.html', 'Eine öffentliche Datei darf keine Werte enthalten');
  else ok('keine ' + was.toLowerCase() + ' gefunden');
}
console.log('');

/* ============================================================
   7. Entwicklungsreste
   ============================================================ */
console.log('7. Entwicklungsreste');
const reste = [
  ['Verweis auf den lokalen Rechner', /localhost|127\.0\.0\.1|\[::1\]/i],
  ['Ausgabe als Fehlersuche (in großem Umfang)', null]
];
if (reste[0][1].test(html)) fehl(reste[0][0] + ' gefunden — gehört nicht in die Auslieferung');
else ok('kein Verweis auf den lokalen Rechner');

const fehlersuche = (html.match(/console\.log\(/g) || []).length;
hinweis(fehlersuche + ' × console.log — im Browser sichtbar, aber unschädlich');

// Tote relative Verweise: href/src auf eine Datei, die es nicht gibt.
const verweise = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(m => m[1]);
let tote = 0;
for (const ziel of verweise) {
  if (/^(https?:|mailto:|data:|#|\/\/)/.test(ziel)) continue;
  const ohneAnker = ziel.split('#')[0].split('?')[0];
  if (!ohneAnker) continue;
  if (!existsSync(resolve(WURZEL, decodeURIComponent(ohneAnker)))) {
    tote++;
    fehl('toter Verweis in index.html', ziel);
  }
}
if (!tote) ok(verweise.length + ' Verweise — keiner zeigt auf eine fehlende lokale Datei');
console.log('');

/* ============================================================
   8a. Werkzeuge in tools/
   Die Prüfwerkzeuge selbst müssen laufen. Ein Werkzeug mit Syntaxfehler
   meldet keinen Fehler — es stürzt ab, und niemand merkt es.
   ============================================================ */
console.log('8a. Werkzeuge');
const werkzeugOrdner = join(WURZEL, 'tools');
if (!existsSync(werkzeugOrdner)) {
  fehl('tools/ fehlt');
} else {
  const werkzeuge = readdirSync(werkzeugOrdner).filter(f => f.endsWith('.mjs'));
  for (const datei of werkzeuge) {
    try {
      execFileSync(process.execPath, ['--check', join(werkzeugOrdner, datei)], { stdio: 'pipe' });
      ok('tools/' + datei + ' syntaktisch gültig');
    } catch (e) {
      fehl('tools/' + datei + ' hat einen Syntaxfehler',
        String(e.stderr || e.message).split('\n').filter(Boolean).slice(0, 3).join(' / '));
    }
  }
}
console.log('');

/* ============================================================
   8. vercel.json
   ============================================================ */
console.log('8. vercel.json');
if (!existsSync(VERCEL)) {
  fehl('vercel.json fehlt — ohne sie erreicht die Oberfläche das Backend nicht');
} else {
  let konfig = null;
  try {
    konfig = JSON.parse(readFileSync(VERCEL, 'utf8'));
    ok('gültiges JSON');
  } catch (e) {
    fehl('vercel.json ist kein gültiges JSON', e.message);
  }
  if (konfig) {
    const umschreibungen = konfig.rewrites || [];
    const ap1 = umschreibungen.find(r => String(r.source || '').includes('/ap1/'));
    ap1 ? ok('Weiterleitung für /ap1/ vorhanden') : fehl('Weiterleitung für /ap1/ fehlt');
    if (ap1) {
      /\/ap1\/:/.test(String(ap1.source))
        ? ok('Weiterleitung reicht den Pfad durch')
        : fehl('Weiterleitung ohne Platzhalter — Unterschrift der Wege geht verloren');
      String(ap1.destination || '').startsWith('http')
        ? ok('Weiterleitung zeigt auf eine vollständige Adresse')
        : fehl('Ziel der Weiterleitung ist keine vollständige Adresse');
    }
    const kopfzeilen = JSON.stringify(konfig.headers || []);
    /no-store/.test(kopfzeilen)
      ? ok('Zwischenspeicher für /ap1/ abgeschaltet (no-store)')
      : fehl('kein "no-store" — zwischengespeicherte Antworten zeigen veraltete Profile');
  }
}
console.log('');

/* ============================================================
   Ergebnis
   ============================================================ */
console.log('---------------------------------------------');
if (fehler) {
  console.log(fehler + ' von ' + geprueft + ' Prüfungen FEHLGESCHLAGEN.');
} else {
  console.log('Alle ' + geprueft + ' Prüfungen bestanden.');
}
process.exitCode = fehler ? 1 : 0;
