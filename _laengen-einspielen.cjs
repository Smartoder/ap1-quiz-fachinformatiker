/**
 * Spielt umgeschriebene Optionen aus _bias-chunks/*-fixed.json in index.html ein.
 * Ersetzt nur die Optionsarrays (a: / optionen:), nichts anderes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const CHUNKS = path.join(ROOT, '_bias-chunks');

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function quizLiteral(a) {
  return '[' + a.map((t) => "'" + esc(t) + "'").join(', ') + ']';
}

function fallLiteral(optionen) {
  return (
    '[\n' +
    optionen.map((o) => `          { t: '${esc(o.t)}', p: ${Number(o.p)} }`).join(',\n') +
    '\n        ]'
  );
}

function loadFixed() {
  const quiz = [];
  const faelle = [];
  for (const name of fs.readdirSync(CHUNKS).sort()) {
    if (!name.endsWith('-fixed.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(CHUNKS, name), 'utf8'));
    if (!Array.isArray(data)) throw new Error(name + ' ist kein Array');
    if (name.startsWith('faelle')) faelle.push(...data);
    else quiz.push(...data);
  }
  return { quiz, faelle };
}

function extractArray(html, name) {
  const start = html.search(new RegExp('const ' + name + ' = \\['));
  if (start < 0) throw new Error(name + ' nicht gefunden');
  const open = html.indexOf('[', start);
  let depth = 0;
  let i = open;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    } else if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch;
      i++;
      while (i < html.length) {
        if (html[i] === '\\') {
          i += 2;
          continue;
        }
        if (html[i] === q) break;
        i++;
      }
    }
  }
  return { start: open, end: i, text: html.slice(open, i) };
}

function evalArray(text) {
  return new Function('return (' + text + ')')();
}

/** Findet das a-[...] nach dem n-ten QUIZ-Objektbeginn. */
function findNthFieldArray(block, fieldName, n) {
  // Suche n-tes Vorkommen von "a:" bzw. "optionen:" auf Objektebene – grob:
  // wir zählen Feld-Treffer mit Wortgrenze.
  const re = new RegExp('\\b' + fieldName + '\\s*:\\s*\\[', 'g');
  let match;
  let count = 0;
  while ((match = re.exec(block)) !== null) {
    if (count === n) {
      const open = match.index + match[0].lastIndexOf('[');
      let depth = 0;
      let i = open;
      for (; i < block.length; i++) {
        const ch = block[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        } else if (ch === "'" || ch === '"' || ch === '`') {
          const q = ch;
          i++;
          while (i < block.length) {
            if (block[i] === '\\') {
              i += 2;
              continue;
            }
            if (block[i] === q) break;
            i++;
          }
        }
      }
      return { start: open, end: i };
    }
    count++;
  }
  return null;
}

function applyQuiz(html, patches) {
  let ersetzt = 0;
  const failed = [];
  const bySam = { QUIZ: [], QUIZ2: [] };
  for (const p of patches) (bySam[p.sammlung] || (bySam[p.sammlung] = [])).push(p);

  let out = html;
  for (const name of ['QUIZ', 'QUIZ2']) {
    const list = bySam[name] || [];
    if (!list.length) continue;
    const block = extractArray(out, name);
    const entries = evalArray(block.text);
    let blockText = block.text;

    // Absteigend nach Index, damit Offsets stabil bleiben bei Ersetzung
    const sorted = [...list].sort((a, b) => b.i - a.i);
    for (const p of sorted) {
      if (!entries[p.i]) {
        failed.push(`${name}[${p.i}] fehlt`);
        continue;
      }
      if (typeof p.r === 'number' && p.r !== entries[p.i].r) {
        failed.push(`${name}[${p.i}] r-mismatch ${entries[p.i].r}->${p.r}`);
        continue;
      }
      if (!Array.isArray(p.a) || p.a.length !== 4) {
        failed.push(`${name}[${p.i}] a-length`);
        continue;
      }
      const loc = findNthFieldArray(blockText, 'a', p.i);
      if (!loc) {
        failed.push(`${name}[${p.i}] a-feld nicht gefunden`);
        continue;
      }
      blockText = blockText.slice(0, loc.start) + quizLiteral(p.a) + blockText.slice(loc.end);
      ersetzt++;
    }
    out = out.slice(0, block.start) + blockText + out.slice(block.end);
  }
  return { html: out, ersetzt, failed };
}

function applyFaelle(html, patches) {
  let ersetzt = 0;
  const failed = [];
  const bySam = { FAELLE: [], FAELLE2: [] };
  for (const p of patches) (bySam[p.sammlung] || (bySam[p.sammlung] = [])).push(p);

  let out = html;
  for (const name of ['FAELLE', 'FAELLE2']) {
    const list = bySam[name] || [];
    if (!list.length) continue;
    const block = extractArray(out, name);
    const entries = evalArray(block.text);
    let blockText = block.text;

    // Baue Liste von (fallIndex, schrittIndex) → absolute optionen-Nummer
    // Einfacher: pro Patch Fall per id finden, Schritt si, dann das optionen-Feld
    // des entsprechenden Schritts ersetzen – über Zählen aller optionen: in Reihenfolge.
    const optionenIndex = [];
    entries.forEach((fall, fi) => {
      (fall.schritte || []).forEach((s, si) => {
        optionenIndex.push({ id: fall.id, si, n: optionenIndex.length });
      });
    });

    const sorted = [...list]
      .map((p) => {
        const meta = optionenIndex.find((x) => x.id === p.id && x.si === p.si);
        return { p, n: meta ? meta.n : -1 };
      })
      .filter((x) => x.n >= 0)
      .sort((a, b) => b.n - a.n);

    for (const { p, n } of sorted) {
      if (!Array.isArray(p.optionen) || !p.optionen.length) {
        failed.push(`${p.id}/${p.si} leer`);
        continue;
      }
      const loc = findNthFieldArray(blockText, 'optionen', n);
      if (!loc) {
        failed.push(`${p.id}/${p.si} optionen nicht gefunden`);
        continue;
      }
      blockText = blockText.slice(0, loc.start) + fallLiteral(p.optionen) + blockText.slice(loc.end);
      ersetzt++;
    }

    // fehlende ids
    for (const p of list) {
      if (!optionenIndex.some((x) => x.id === p.id && x.si === p.si)) {
        failed.push(`${p.id}/${p.si} nicht in ${name}`);
      }
    }

    out = out.slice(0, block.start) + blockText + out.slice(block.end);
  }
  return { html: out, ersetzt, failed };
}

function main() {
  const dry = process.argv.includes('--dry');
  const only = process.argv.includes('--faelle')
    ? 'faelle'
    : process.argv.includes('--quiz')
      ? 'quiz'
      : 'all';
  const { quiz, faelle } = loadFixed();
  console.log(`Patches geladen: ${quiz.length} Quiz, ${faelle.length} Fallstudien`);
  if (!quiz.length && !faelle.length) {
    console.error('Keine *-fixed.json gefunden.');
    process.exit(1);
  }

  let html = fs.readFileSync(INDEX, 'utf8');
  let total = 0;
  const allFailed = [];

  if (only === 'all' || only === 'faelle') {
    const f = applyFaelle(html, faelle);
    html = f.html;
    total += f.ersetzt;
    allFailed.push(...f.failed);
    console.log(`Fallstudien ersetzt: ${f.ersetzt}, Fehler: ${f.failed.length}`);
    if (f.failed.length) console.log(f.failed.slice(0, 30));
  }
  if (only === 'all' || only === 'quiz') {
    const q = applyQuiz(html, quiz);
    html = q.html;
    total += q.ersetzt;
    allFailed.push(...q.failed);
    console.log(`Quiz ersetzt: ${q.ersetzt}, Fehler: ${q.failed.length}`);
    if (q.failed.length) console.log(q.failed.slice(0, 30));
  }

  if (dry) {
    console.log(`Dry-run – ${total} Ersetzungen, nichts geschrieben.`);
    process.exit(allFailed.length ? 1 : 0);
  }

  const bak = INDEX + '.bak-laengen-' + Date.now();
  fs.copyFileSync(INDEX, bak);
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('Backup: ' + bak);
  console.log(`index.html geschrieben (${total} Ersetzungen).`);
  process.exit(allFailed.length ? 1 : 0);
}

main();
