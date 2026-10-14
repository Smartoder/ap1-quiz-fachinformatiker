/**
 * Rest-Bias: exportiert noch auffaellige Quiz-/Fallstudien-Schritte.
 * Flag: RICHTIG eindeutig laengste (Worte ODER Zeichen) UND Spanne > 12 %.
 */
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

function quizRest(name, arr) {
  const out = [];
  arr.forEach((f, i) => {
    if (!f.a || f.a.length !== 4) return;
    const ws = f.a.map(worte);
    const cs = f.a.map(zeichen);
    const maxW = Math.max(...ws);
    const maxC = Math.max(...cs);
    const minW = Math.min(...ws);
    const minC = Math.min(...cs);
    const uniqW = ws[f.r] === maxW && ws.filter((w) => w === maxW).length === 1;
    const uniqC = cs[f.r] === maxC && cs.filter((c) => c === maxC).length === 1;
    const spanW = minW ? (maxW - minW) / minW : 0;
    const spanC = minC ? (maxC - minC) / minC : 0;
    const gapC = cs[f.r] - Math.max(...cs.filter((_, j) => j !== f.r));
    // Nur noch klar erkennbare Faelle: eindeutig laengste UND (>12% Spanne oder >12 Zeichen Vorsprung)
    if ((uniqW || uniqC) && (spanW > 0.12 || spanC > 0.12 || gapC > 12)) {
      out.push({
        sammlung: name,
        i,
        r: f.r,
        q: f.q,
        a: f.a,
        ws,
        cs,
        spanW: +spanW.toFixed(3),
        spanC: +spanC.toFixed(3),
        gapC,
      });
    }
  });
  return out;
}

function fallRest(name, arr) {
  const out = [];
  arr.forEach((fall) => {
    (fall.schritte || []).forEach((s, si) => {
      if (!s.optionen || !s.optionen.length) return;
      const ws = s.optionen.map((o) => worte(o.t));
      const cs = s.optionen.map((o) => zeichen(o.t));
      const maxP = Math.max(...s.optionen.map((x) => x.p));
      const richtig = s.optionen.findIndex((o) => o.p === maxP);
      const maxW = Math.max(...ws);
      const maxC = Math.max(...cs);
      const minW = Math.min(...ws);
      const minC = Math.min(...cs);
      const uniqW = richtig >= 0 && ws[richtig] === maxW && ws.filter((w) => w === maxW).length === 1;
      const uniqC = richtig >= 0 && cs[richtig] === maxC && cs.filter((c) => c === maxC).length === 1;
      const spanW = minW ? (maxW - minW) / minW : 0;
      const spanC = minC ? (maxC - minC) / minC : 0;
      const gapC =
        richtig >= 0 ? cs[richtig] - Math.max(...cs.filter((_, j) => j !== richtig), 0) : 0;
      if ((uniqW || uniqC) && (spanW > 0.12 || spanC > 0.12 || gapC > 12)) {
        out.push({
          sammlung: name,
          id: fall.id,
          si,
          kunde: s.kunde || '',
          optionen: s.optionen.map((o) => ({ t: o.t, p: o.p })),
          richtig,
          ws,
          cs,
          spanW: +spanW.toFixed(3),
          spanC: +spanC.toFixed(3),
          gapC,
        });
      }
    });
  });
  return out;
}

const quiz = [...quizRest('QUIZ', QUIZ), ...quizRest('QUIZ2', QUIZ2)];
const faelle = [...fallRest('FAELLE', FAELLE), ...fallRest('FAELLE2', FAELLE2)];
quiz.sort((a, b) => b.gapC - a.gapC);
faelle.sort((a, b) => b.gapC - a.gapC);

const payload = { quiz, faelle, meta: { quiz: quiz.length, faelle: faelle.length } };
fs.writeFileSync(path.join(__dirname, '_bias-rest.json'), JSON.stringify(payload, null, 2));
console.log('Quiz Rest:', quiz.length);
console.log('Faelle Rest:', faelle.length);
console.log('Top Quiz gaps:', quiz.slice(0, 5).map((x) => `${x.sammlung}#${x.i} gap=${x.gapC}`).join(', '));
console.log('Top Faelle gaps:', faelle.slice(0, 5).map((x) => `${x.id}/${x.si} gap=${x.gapC}`).join(', '));
