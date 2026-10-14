// Exportiert bias-behaftete Quiz- und Fallstudien-Optionen als JSON.
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

const { QUIZ, QUIZ2, FAELLE, FAELLE2 } = new Function(
  src + '\n; return { QUIZ, QUIZ2, FAELLE, FAELLE2 };',
)();

const worte = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const zeichen = (s) => String(s).length;

function quizFlagged(arr, name) {
  const out = [];
  arr.forEach((f, i) => {
    if (!f.a || f.a.length !== 4) return;
    const cs = f.a.map(zeichen);
    const ws = f.a.map(worte);
    const maxC = Math.max(...cs);
    const maxW = Math.max(...ws);
    const minC = Math.min(...cs);
    const longestChar =
      cs[f.r] === maxC && cs.filter((c) => c === maxC).length === 1;
    const longestWord =
      ws[f.r] === maxW && ws.filter((w) => w === maxW).length === 1;
    const span = minC ? (maxC - minC) / minC : 0;
    if (longestChar || longestWord || span > 0.35) {
      out.push({
        sammlung: name,
        i,
        q: f.q,
        a: f.a.slice(),
        r: f.r,
        e: f.e,
        b: f.b,
        q_: f.q_,
        cs,
        ws,
        flags: { longestChar, longestWord, span: +span.toFixed(2) },
      });
    }
  });
  return out;
}

function fallFlagged(arr, name) {
  const out = [];
  (arr || []).forEach((fall) => {
    (fall.schritte || []).forEach((s, si) => {
      if (!s.optionen) return;
      const cs = s.optionen.map((o) => zeichen(o.t));
      const ws = s.optionen.map((o) => worte(o.t));
      const maxP = Math.max(...s.optionen.map((o) => o.p));
      const richtig = s.optionen.findIndex((o) => o.p === maxP);
      const maxC = Math.max(...cs);
      const maxW = Math.max(...ws);
      const minC = Math.min(...cs);
      const longestChar =
        cs[richtig] === maxC && cs.filter((c) => c === maxC).length === 1;
      const longestWord =
        ws[richtig] === maxW && ws.filter((w) => w === maxW).length === 1;
      const span = minC ? (maxC - minC) / minC : 0;
      if (longestChar || longestWord || span > 0.25) {
        out.push({
          sammlung: name,
          id: fall.id,
          si,
          situation: String(s.situation || '').slice(0, 200),
          kunde: String(s.kunde || '').slice(0, 160),
          optionen: s.optionen.map((o) => ({ t: o.t, p: o.p })),
          richtig,
          cs,
          ws,
          flags: { longestChar, longestWord, span: +span.toFixed(2) },
        });
      }
    });
  });
  return out;
}

const payload = {
  quiz: [...quizFlagged(QUIZ, 'QUIZ'), ...quizFlagged(QUIZ2 || [], 'QUIZ2')],
  faelle: [...fallFlagged(FAELLE, 'FAELLE'), ...fallFlagged(FAELLE2 || [], 'FAELLE2')],
};
fs.writeFileSync(path.join(__dirname, '_bias-items.json'), JSON.stringify(payload, null, 2));
console.log(
  `Export: ${payload.quiz.length} Quiz-Fragen, ${payload.faelle.length} Fallstudien-Schritte`,
);
