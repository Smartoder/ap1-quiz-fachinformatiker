// Einmalige Analyse: Längen-Bias in QUIZ/QUIZ2 und FAELLE/FAELLE2.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

const mkEl = () => ({
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  dataset: {},
  innerHTML: '',
  textContent: '',
  value: '',
  className: '',
  type: '',
  children: [],
  appendChild(c) {
    this.children.push(c);
    return c;
  },
  append(...a) {
    a.forEach((x) => this.appendChild(x));
  },
  prepend() {},
  remove() {},
  focus() {},
  querySelector: () => mkEl(),
  querySelectorAll: () => [],
  addEventListener() {},
  onclick: null,
  disabled: false,
  setAttribute() {},
  getAttribute: () => null,
  removeAttribute() {},
});
global.document = {
  getElementById: () => mkEl(),
  createElement: () => mkEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: mkEl(),
  documentElement: mkEl(),
  head: mkEl(),
};
global.window = {
  matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { href: '', hash: '' },
  scrollTo() {},
  addEventListener() {},
  innerWidth: 1200,
};
global.localStorage = global.window.localStorage;
global.confirm = () => false;
global.alert = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.setTimeout = () => 0;
global.clearTimeout = () => {};
global.requestAnimationFrame = () => 0;
global.navigator = { userAgent: 'node' };
global.history = { replaceState() {}, pushState() {} };

const runner = new Function(src + '\n; return { QUIZ, QUIZ2, FAELLE, FAELLE2 };');
const { QUIZ, QUIZ2, FAELLE, FAELLE2 } = runner();

const worte = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const zeichen = (s) => String(s).length;

function analyseQuiz(name, arr) {
  let n = 0;
  let langW = 0;
  let langZ = 0;
  let spanne = 0;
  const items = [];
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i];
    if (!f.a || f.a.length !== 4) continue;
    n++;
    const ws = f.a.map(worte);
    const cs = f.a.map(zeichen);
    const rw = ws[f.r];
    const rc = cs[f.r];
    const maxW = Math.max(...ws);
    const maxC = Math.max(...cs);
    const minW = Math.min(...ws);
    const flags = [];
    if (rw === maxW && ws.filter((w) => w === maxW).length === 1) {
      langW++;
      flags.push('W');
    }
    if (rc === maxC && cs.filter((c) => c === maxC).length === 1) {
      langZ++;
      flags.push('Z');
    }
    const sp = minW ? (maxW - minW) / minW : 0;
    if (sp > 0.2) {
      spanne++;
      flags.push('S');
    }
    if (flags.includes('W') || flags.includes('Z')) {
      items.push({
        i,
        r: f.r,
        ws,
        cs,
        q: f.q,
        a: f.a,
        b: f.b,
        flags,
        ratio: rc / (cs.reduce((x, y) => x + y, 0) / 4),
      });
    }
  }
  items.sort((a, b) => b.ratio - a.ratio);
  console.log(
    `${name}: ${n} Fragen | RICHTIG=längsteWorte: ${langW} (${((100 * langW) / n).toFixed(1)}%) | RICHTIG=längsteZeichen: ${langZ} (${((100 * langZ) / n).toFixed(1)}%) | Spanne>20%: ${spanne}`,
  );
  return { n, langW, langZ, spanne, items };
}

function analyseFaelle(name, arr) {
  let steps = 0;
  let lang = 0;
  let spanne = 0;
  const items = [];
  (arr || []).forEach((fall) => {
    (fall.schritte || []).forEach((s, si) => {
      if (!s.optionen || !s.optionen.length) return;
      steps++;
      const ws = s.optionen.map((o) => worte(o.t));
      const cs = s.optionen.map((o) => zeichen(o.t));
      const maxP = Math.max(...s.optionen.map((x) => x.p));
      const richtig = s.optionen.findIndex((o) => o.p === maxP);
      const maxW = Math.max(...ws);
      const minW = Math.min(...ws);
      const flags = [];
      if (richtig === ws.indexOf(maxW) && ws.filter((w) => w === maxW).length === 1) {
        lang++;
        flags.push('W');
      }
      const maxC = Math.max(...cs);
      if (richtig >= 0 && cs[richtig] === maxC && cs.filter((c) => c === maxC).length === 1) {
        flags.push('Z');
      }
      const sp = minW ? (maxW - minW) / minW : 0;
      if (sp > 0.3) {
        spanne++;
        flags.push('S');
      }
      if (flags.length) {
        items.push({
          id: fall.id,
          si,
          ws,
          cs,
          richtig,
          optionen: s.optionen.map((o) => ({ t: o.t, p: o.p })),
          frage: String(s.frage || s.q || s.prompt || '').slice(0, 80),
          flags,
        });
      }
    });
  });
  console.log(
    `${name}: ${(arr || []).length} Fälle / ${steps} Schritte | RICHTIG=längsteWorte: ${lang} (${steps ? ((100 * lang) / steps).toFixed(1) : 0}%) | Spanne>30%: ${spanne}`,
  );
  return { steps, lang, spanne, items };
}

const q1 = analyseQuiz('QUIZ', QUIZ);
const q2 = analyseQuiz('QUIZ2', QUIZ2 || []);
const f1 = analyseFaelle('FAELLE', FAELLE || []);
const f2 = analyseFaelle('FAELLE2', FAELLE2 || []);

console.log('\n--- Schlimmste QUIZ (Top 20 nach Längenratio) ---');
q1.items.slice(0, 20).forEach((d) => {
  console.log(`#${d.i} [${'ABCD'[d.r]}] W=${d.ws.join('/')} Z=${d.cs.join('/')} | ${d.q.slice(0, 72)}`);
  d.a.forEach((o, j) => console.log(`   ${'ABCD'[j]}) (${worte(o)}W/${zeichen(o)}Z) ${o}`));
});

console.log('\n--- FAELLE mit Bias (alle) ---');
f1.items.forEach((d) => {
  console.log(`${d.id} Schritt ${d.si} W=${d.ws.join('/')} Z=${d.cs.join('/')} R=${d.richtig} ${d.flags.join(',')}`);
  d.optionen.forEach((o, j) => console.log(`   ${j}) p=${o.p} (${worte(o.t)}W) ${o.t}`));
});

console.log('\n--- FAELLE2 mit Bias (alle) ---');
f2.items.forEach((d) => {
  console.log(`${d.id} Schritt ${d.si} W=${d.ws.join('/')} Z=${d.cs.join('/')} R=${d.richtig} ${d.flags.join(',')}`);
  d.optionen.forEach((o, j) => console.log(`   ${j}) p=${o.p} (${worte(o.t)}W) ${o.t}`));
});

fs.writeFileSync(
  path.join(__dirname, '_bias-report.json'),
  JSON.stringify(
    {
      quiz: { count: q1.n, longestWord: q1.langW, longestChar: q1.langZ },
      quiz2: { count: q2.n, longestWord: q2.langW, longestChar: q2.langZ },
      faelle: { steps: f1.steps, longestWord: f1.lang, flagged: f1.items.length },
      faelle2: { steps: f2.steps, longestWord: f2.lang, flagged: f2.items.length },
      quizFlagged: q1.items.length + q2.items.length,
      fallFlagged: f1.items.length + f2.items.length,
    },
    null,
    2,
  ),
);
console.log('\nReport geschrieben: _bias-report.json');
