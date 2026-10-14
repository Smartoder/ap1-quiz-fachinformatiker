/**
 * Erzeugt Rest-Patches (JSON) und spielt sie via _laengen-einspielen ein.
 * Ablenker mit vollständigen Phrasen anheben, wenn Richtige eindeutig länger.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'index.html');
const OUT_QUIZ = path.join(ROOT, '_bias-chunks', 'rest-pass-quiz-fixed.json');
const OUT_FALL = path.join(ROOT, '_bias-chunks', 'faelle-rest-pass-fixed.json');

const PHRASES = [
  ' im betrieblichen Alltag',
  ' nach gängiger IT-Praxis',
  ' in typischen Projekten',
  ' ohne weitere Ausnahme',
  ' für den gesamten Betrieb',
  ' unabhängig vom Hersteller',
  ' in der konkreten Anwendung',
  ' laut üblicher Empfehlung',
  ' bei vergleichbaren Fällen',
  ' über den Projektverlauf',
  ' mit Blick auf den Kunden',
  ' laut Fachliteratur',
];

const html = fs.readFileSync(INDEX, 'utf8');
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

const { QUIZ, QUIZ2, FAELLE, FAELLE2 } = new Function(
  src + '\n; return { QUIZ, QUIZ2, FAELLE, FAELLE2 };',
)();

const zeichen = (s) => String(s).length;
const worte = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function needsFix(texts, richtig) {
  if (!texts || texts.length < 2 || richtig < 0) return false;
  const cs = texts.map(zeichen);
  const ws = texts.map(worte);
  const maxC = Math.max(...cs);
  const minC = Math.min(...cs);
  const maxW = Math.max(...ws);
  const minW = Math.min(...ws);
  const uniqC = cs[richtig] === maxC && cs.filter((c) => c === maxC).length === 1;
  const uniqW = ws[richtig] === maxW && ws.filter((w) => w === maxW).length === 1;
  const gapC = cs[richtig] - Math.max(...cs.filter((_, j) => j !== richtig), 0);
  const spanC = minC ? (maxC - minC) / minC : 0;
  const spanW = minW ? (maxW - minW) / minW : 0;
  return (
    (uniqC && (gapC > 2 || spanC > 0.08)) ||
    (uniqW && spanW > 0.15 && spanC > 0.05)
  );
}

function expandTo(text, target, salt) {
  let out = String(text).trim();
  let used = 0;
  let i = 0;
  while (zeichen(out) < target - 1 && used < 4 && i < 36) {
    const need = target - zeichen(out);
    // kürzeste passende Phrase bevorzugen, sonst nächste die noch ins +12-Fenster passt
    let chosen = null;
    for (let k = 0; k < PHRASES.length; k++) {
      const p = PHRASES[(salt + i + k) % PHRASES.length];
      if (out.endsWith(p)) continue;
      const nextLen = zeichen(out) + zeichen(p);
      if (nextLen <= target + 12) {
        if (!chosen || zeichen(p) < zeichen(chosen)) chosen = p;
        // wenn Phrase den Need ungefähr trifft: nehmen
        if (zeichen(p) >= need - 2 && zeichen(p) <= need + 12) {
          chosen = p;
          break;
        }
      }
    }
    if (!chosen) break;
    out += chosen;
    used++;
    i++;
  }
  return out;
}

function equalize(texts, richtig) {
  const out = texts.map((t) => String(t).trim());
  const ws = out.map(worte);
  const maxW = Math.max(...ws);
  const uniqW = ws[richtig] === maxW && ws.filter((w) => w === maxW).length === 1;
  const target = Math.max(zeichen(out[richtig]), Math.max(...out.map(zeichen)));
  return out.map((t, i) => {
    if (i === richtig) return t;
    let next = t;
    if (zeichen(next) < target - 2) next = expandTo(next, target, i * 11 + richtig * 3);
    // Wort-Bias: auch bei ähnlicher Zeichenlänge eine Phrase anhängen
    if (uniqW && worte(next) < maxW) next = expandTo(next, zeichen(next) + 28, i * 17 + 5);
    return next;
  });
}

const quizPatches = [];
for (const [name, arr] of [
  ['QUIZ', QUIZ],
  ['QUIZ2', QUIZ2],
]) {
  arr.forEach((f, i) => {
    if (!f.a || f.a.length !== 4) return;
    if (!needsFix(f.a, f.r)) return;
    const neu = equalize(f.a, f.r);
    if (neu.every((t, k) => t === f.a[k])) return;
    quizPatches.push({ sammlung: name, i, r: f.r, a: neu });
  });
}

const fallPatches = [];
for (const [name, arr] of [
  ['FAELLE', FAELLE],
  ['FAELLE2', FAELLE2],
]) {
  arr.forEach((fall) => {
    (fall.schritte || []).forEach((s, si) => {
      if (!s.optionen || !s.optionen.length) return;
      const maxP = Math.max(...s.optionen.map((o) => o.p));
      const richtig = s.optionen.findIndex((o) => o.p === maxP);
      const texts = s.optionen.map((o) => o.t);
      if (!needsFix(texts, richtig)) return;
      const neu = equalize(texts, richtig);
      if (neu.every((t, k) => t === texts[k])) return;
      fallPatches.push({
        sammlung: name,
        id: fall.id,
        si,
        optionen: s.optionen.map((o, k) => ({ t: neu[k], p: o.p })),
      });
    });
  });
}

console.log('Quiz-Patches:', quizPatches.length);
console.log('Fall-Patches:', fallPatches.length);
for (const p of quizPatches.slice(0, 3)) {
  console.log(p.sammlung + '#' + p.i, p.a.map((t) => t.length).join('/'));
  p.a.forEach((t, i) => console.log('  ' + (i === p.r ? '*' : ' ') + t));
}

fs.writeFileSync(OUT_QUIZ, JSON.stringify(quizPatches, null, 2));
fs.writeFileSync(OUT_FALL, JSON.stringify(fallPatches, null, 2));
console.log('JSON geschrieben. Starte einspielen…');

const r = spawnSync(process.execPath, [path.join(ROOT, '_laengen-einspielen.cjs')], {
  cwd: ROOT,
  encoding: 'utf8',
});
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
process.exit(r.status || 0);
