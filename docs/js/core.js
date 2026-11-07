// ===== Данные, интервалы, статистика, питомцы =====
const K = 'kartochki-app-v1';
const MIN = 60000, HOUR = 3600000;
let uidN = Date.now();
const uid = p => p + (uidN++).toString(36);

const PRESETS = {
  short: { name: 'Короткие', hint: 'за один день', iv: [2, 5, 7, 10, 15, 30, 60, 120] },
  mid: { name: 'Средние', hint: 'за неделю', iv: [10, 15, 30, 120, 300, 1440, 4320, 10080] },
  long: { name: 'Длинные', hint: 'на месяцы', iv: [30, 480, 1440, 4320, 10080, 20160, 43200, 86400] },
  custom: { name: 'Свои', hint: 'свои интервалы', iv: null }
};

const FOOD_DECAY = 4;      // сытость тратится: % в час
const FOOD_PER_OK = 4;     // +% за каждое «помню»

const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

function sampleData() {
  const s = { id: uid('s'), name: 'Матанализ' };
  const d = { id: uid('d'), subject: s.id, name: 'Пределы', speed: 'mid', iv: null };
  let now = Date.now();
  const mk = (f, b) => ({ id: uid('c'), deck: d.id, front: f, back: b, state: 'new', level: 0, due: 0, lapses: 0, created: now++ });
  return {
    subjects: [s], decks: [d],
    cards: [
      mk('**Первый** замечательный предел', '$$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$$'),
      mk('Второй замечательный предел', '$$\\lim_{x\\to\\infty}\\left(1+\\frac{1}{x}\\right)^{x}=e$$'),
      mk('Определение предела последовательности', '$$\\forall\\varepsilon>0\\ \\exists N:\\ \\forall n>N\\ \\ |a_n-a|<\\varepsilon$$'),
      mk('Теорема о двух милиционерах', '$a_n\\le b_n\\le c_n$, $a_n\\to L$, $c_n\\to L$ $\\Rightarrow$ $b_n\\to L$'),
      mk('Эквивалентные бесконечно малые при $x\\to 0$', '$\\sin x\\sim \\tg x\\sim \\arcsin x\\sim x$, $\\ln(1+x)\\sim x$, $e^x-1\\sim x$'),
      mk('Правило Лопиталя', 'Для неопределённостей $\\frac{0}{0}$ и $\\frac{\\infty}{\\infty}$: $$\\lim\\frac{f}{g}=\\lim\\frac{f\'}{g\'}$$')
    ]
  };
}
function defData() {
  const now = Date.now();
  return {
    v: 3, subjects: [], decks: [], cards: [],
    settings: { perSession: 5, need: 2, notify: true, notifyHour: 19, theme: 'auto', pal: 'lemon', norm: 20, speed: 'mid', updStable: true, updBeta: false, updEvery: 5, focus: null, notifyEvery: 0 },
    pet: { active: 'dog', owned: { dog: { fed: 0, got: now } }, food: 60, foodTs: now },
    tokens: 0, today: { date: dayKey(), ok: 0, normDone: false, tok: 0 }, days: {}, saved: now
  };
}
function normalize(j) {
  const d = defData();
  if (!j || !Array.isArray(j.cards) || !Array.isArray(j.decks) || !Array.isArray(j.subjects)) return d;
  j.v = 3;
  j.settings = { ...d.settings, ...(j.settings || {}) };
  j.pet = j.pet && j.pet.owned ? j.pet : d.pet;
  if (typeof j.tokens !== 'number') j.tokens = d.tokens;
  j.today = j.today || d.today; j.days = j.days || {};
  j.cards.forEach(c => { c.state = c.state || 'new'; c.level = c.level || 0; c.due = c.due || 0; c.lapses = c.lapses || 0; c.created = c.created || Date.now(); });
  j.decks.forEach(x => { x.speed = x.speed || 'mid'; });
  delete j.cur;
  return j;
}
function load() { try { return normalize(JSON.parse(localStorage.getItem(K))); } catch (e) { return defData(); } }
let D = load();
const saveHooks = [];
function save() {
  D.saved = Date.now();
  try { localStorage.setItem(K, JSON.stringify(D)); } catch (e) { toast('Не получилось сохранить — сделай экспорт в настройках'); }
  saveHooks.forEach(f => { try { f(); } catch (e) { } });
}

// ---- выборки ----
const getDeck = id => D.decks.find(d => d.id === id);
const getSubject = id => D.subjects.find(s => s.id === id);
const subjOfCard = c => { const d = getDeck(c.deck); return d && getSubject(d.subject); };
const ivOfDeck = d => (!d ? PRESETS.mid.iv : d.speed === 'custom' && d.iv && d.iv.length ? d.iv : (PRESETS[d.speed] || PRESETS.mid).iv);
const ivOf = c => ivOfDeck(getDeck(c.deck));
const isDue = (c, now = Date.now()) => c.state === 'review' && c.due <= now;
const isLng = c => c.state === 'learning';
const isDone = c => c.state === 'mastered' || c.state === 'known';
const deckCards = id => D.cards.filter(c => c.deck === id);
function dueCount(cards = D.cards) { const now = Date.now(); return cards.filter(c => isDue(c, now) || isLng(c)).length; }
function newCount(cards = D.cards) { return cards.filter(c => c.state === 'new').length; }
function learnedPct(cards = D.cards) {
  if (!cards.length) return 0;
  let s = 0; cards.forEach(c => { if (isDone(c)) s += 1; else if (c.state === 'review') s += Math.min(1, c.level / ivOf(c).length); });
  return Math.round(s / cards.length * 100);
}
function nextDueTime(cards) { let m = Infinity; cards.forEach(c => { if (c.state === 'review' && c.due < m) m = c.due; }); return m; }

function fmtDur(min) {
  min = Math.max(0, Math.round(min));
  if (min < 60) return min + ' мин';
  const h = min / 60; if (h < 24) return (Math.round(h * 10) / 10 + '').replace('.', ',') + ' ч';
  const d = h / 24; if (d < 30) return Math.round(d) + ' дн';
  return (Math.round(d / 30 * 10) / 10 + '').replace('.', ',') + ' мес';
}
function parseIv(s) {
  const out = []; const re = /(\d+(?:[.,]\d+)?)\s*(мин|м|ч|дн|д|нед|н|мес)?/gi; let m;
  while ((m = re.exec(s))) {
    const v = parseFloat(m[1].replace(',', '.')); const u = (m[2] || 'мин').toLowerCase();
    const k = u.startsWith('мес') ? 43200 : u.startsWith('н') ? 10080 : u.startsWith('д') ? 1440 : u === 'ч' ? 60 : 1;
    if (v > 0) out.push(Math.round(v * k));
  }
  return out;
}
const ivStr = a => a.map(m => m % 43200 === 0 ? m / 43200 + 'мес' : m % 1440 === 0 ? m / 1440 + 'д' : m % 60 === 0 ? m / 60 + 'ч' : m + 'м').join(', ');
function plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }

// ---- день, серия, норма ----
function rollDay() {
  const k = dayKey();
  if (D.today.date !== k) D.today = { date: k, ok: 0, normDone: false, tok: 0 };
  if (D.today.tok == null) D.today.tok = D.today.normDone ? 1 : 0;
}
function streak() {
  let n = 0; const t = new Date(); t.setHours(12);
  if (!D.days[dayKey(t)]) t.setDate(t.getDate() - 1); // сегодня ещё не занимался — считаем по вчера
  while (D.days[dayKey(t)]) { n++; t.setDate(t.getDate() - 1); }
  return n;
}
function lastDays(n) { const out = []; const t = new Date(); t.setHours(12); for (let i = n - 1; i >= 0; i--) { const x = new Date(t); x.setDate(t.getDate() - i); out.push(D.days[dayKey(x)] || 0); } return out; }

// ---- сытость ----
function food(now = Date.now()) { const p = D.pet; return Math.max(0, Math.min(100, p.food - (now - p.foodTs) / HOUR * FOOD_DECAY)); }
function hoursLeft() { return food() / FOOD_DECAY; }
function feed(n) {
  const p = D.pet; p.food = Math.min(100, food() + n); p.foodTs = Date.now();
  const o = p.owned[p.active]; if (o) o.fed = (o.fed || 0) + 1;
}
function hungerLine() {
  const f = food();
  if (f >= 85) return 'Я сыт и счастлив!';
  if (f >= 60) return 'Ещё кусочек — и я в форме';
  if (f >= 35) return 'Можно и перекусить…';
  if (f >= 12) return 'Я голодный! Покорми меня…';
  return 'Умираю с голоду… покорми!';
}
// дневная норма для жетона: 15 «помню» + 5 за каждого питомца сверх первого (пользователь не меняет)
const NORM_BASE = 15, NORM_PER_PET = 5;
function normGoal() { const n = Object.keys((D.pet && D.pet.owned) || {}).length || 1; return NORM_BASE + NORM_PER_PET * (n - 1); }
// Жетоны за день: 1-й за норму G, 2-й ещё за 2·G, 3-й ещё за 3·G… (порог k-го = G·k(k+1)/2). Новый день — снова с G.
function normAt(k) { const g = normGoal(); return g * k * (k + 1) / 2; }
function normInfo() { rollDay(); const k = D.today.tok || 0, prev = normAt(k), next = normAt(k + 1); return { k, have: Math.max(0, D.today.ok - prev), need: next - prev, next }; }
// отметить ответ «помню» — корм, норма, жетон
let onNorm = null;
function countOk() {
  rollDay();
  D.today.ok++; D.days[D.today.date] = (D.days[D.today.date] || 0) + 1;
  feed(FOOD_PER_OK);
  while (D.today.ok >= normAt((D.today.tok || 0) + 1)) { D.today.tok = (D.today.tok || 0) + 1; D.today.normDone = true; D.tokens++; if (onNorm) onNorm(D.today.tok); }
}
// что учим: все наборы, один предмет или один набор (Настройка на главной)
function focusDecks() {
  const f = D.settings.focus;
  if (f && f.t === 'deck' && getDeck(f.id)) return [f.id];
  if (f && f.t === 'subj' && getSubject(f.id)) return D.decks.filter(d => d.subject === f.id).map(d => d.id);
  return null;
}
function focusName() {
  const f = D.settings.focus;
  if (f && f.t === 'deck' && getDeck(f.id)) return getDeck(f.id).name;
  if (f && f.t === 'subj' && getSubject(f.id)) return getSubject(f.id).name;
  return 'все наборы';
}
function focusCards() { const ids = focusDecks(); if (!ids) return D.cards; const s = new Set(ids); return D.cards.filter(c => s.has(c.deck)); }

// ---- похожие карточки ----
const plainText = s => (s || '').replace(/\$\$?[^$]*\$\$?/g, ' ').replace(/[*_~=`]/g, '');
const words = s => plainText(s).toLowerCase().replace(/[^a-zа-яё0-9 ]/gi, ' ').split(/\s+/).filter(w => w.length > 2).map(w => w.slice(0, 5));
function findSimilar(text, exceptId) {
  const a = words(text); if (!a.length) return null;
  let best = null, bs = 0;
  D.cards.forEach(c => {
    if (c.id === exceptId) return;
    const b = words(c.front); if (!b.length) return;
    const common = a.filter(w => b.includes(w)).length; const sc = common / Math.min(a.length, b.length);
    if (sc > bs) { bs = sc; best = c; }
  });
  return bs >= 0.6 ? best : null;
}

// ---- импорт старого формата (сайт) ----
function importData(j) {
  if (j && j.app === 'kartochki' && j.set) {
    const sid = j.subjectId || 's_imp';
    j = { subjects: [{ id: sid, name: j.subject || 'Импорт' }], decks: [{ ...j.set, subject: sid }], cards: (j.cards || []).map(c => ({ ...c, deck: j.set.id })) };
  }
  if (!j || !Array.isArray(j.cards) || !Array.isArray(j.decks)) throw new Error('bad');
  const ids = new Set(D.cards.map(c => c.id));
  const remap = {};
  (j.subjects || []).forEach(s => { if (getSubject(s.id)) return; const same = D.subjects.find(x => x.name.toLowerCase() === String(s.name || '').toLowerCase()); if (same) remap[s.id] = same.id; else D.subjects.push({ id: s.id, name: s.name }); });
  j.decks.forEach(d => { if (remap[d.subject]) d.subject = remap[d.subject]; });
  j.decks.forEach(d => { if (!getDeck(d.id)) D.decks.push({ id: d.id, subject: d.subject, name: d.name, speed: d.speed || 'mid', iv: d.iv || null }); });
  let n = 0;
  j.cards.forEach(c => { if (!ids.has(c.id)) { D.cards.push({ state: 'new', level: 0, due: 0, lapses: 0, created: Date.now(), ...c }); n++; } });
  if (j.pet && j.pet.owned) { D.pet = j.pet; D.tokens = j.tokens || D.tokens; D.days = { ...(j.days || {}), ...D.days }; }
  return n;
}
