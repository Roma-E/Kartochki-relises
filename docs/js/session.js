// ===== Сессия повторения / заучивания (логика как на сайте, лесенка интервалов) =====
// mode: 'review' — только повтор (и то, что в заучивании), 'learn' — сначала отбор новых, 'mix' — всё вместе
let S = null;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const live = c => D.cards.find(x => x.id === c.id) || c;

function startSession(mode, deckIds) {
  rollDay();
  const ids = deckIds ? new Set(deckIds) : null;
  const cs = D.cards.filter(c => !ids || ids.has(c.deck)), now = Date.now();
  const news = shuffle(cs.filter(c => c.state === 'new'));
  const dues = cs.filter(c => isDue(c, now));
  S = {
    mode, deckIds, phase: 'pick', lrn: shuffle(cs.filter(isLng)), pickList: mode === 'review' ? [] : news, picked: [], queue: [], total: 0,
    dueList: mode === 'learn' ? [] : dues, stats: { ok: 0, fail: 0, learned: 0, known: 0, mastered: 0, fed: 0 }, prev: null, done: 0
  };
  if (!S.pickList.length) buildDrill();
  return S;
}
function buildDrill() {
  S.phase = 'drill';
  const learns = [...S.lrn, ...S.picked].map(c => ({ c, kind: 'learn', ok: Math.min(c.lok || 0, D.settings.need - 1) }));
  const revs = shuffle(S.dueList.map(c => ({ c, kind: 'review', failed: false })));
  if (S.mode === 'mix' || S.mode === 'review') {
    const q = []; let i = 0, j = 0;
    while (i < learns.length || j < revs.length) { if (i < learns.length) q.push(learns[i++]); if (j < revs.length) q.push(revs[j++]); if (j < revs.length) q.push(revs[j++]); }
    S.queue = q;
  } else S.queue = [...learns, ...revs];
  S.total = S.queue.length; if (!S.queue.length) S.phase = 'done';
}
function snap(c) { S.prev = { card: c, data: { ...c }, phase: S.phase, pickList: [...S.pickList], picked: [...S.picked], queue: S.queue.map(i => ({ ...i })), stats: { ...S.stats }, total: S.total, done: S.done, today: { ...D.today }, pet: JSON.parse(JSON.stringify(D.pet)), tokens: D.tokens, days: { ...D.days } }; }
function undoSession() {
  const p = S && S.prev; if (!p) return false;
  const lc = live(p.card); Object.keys(lc).forEach(k => { if (!(k in p.data)) delete lc[k]; }); Object.assign(lc, p.data);
  Object.assign(S, { phase: p.phase, pickList: p.pickList, picked: p.picked, queue: p.queue, stats: p.stats, total: p.total, done: p.done, prev: null });
  D.today = p.today; D.pet = p.pet; D.tokens = p.tokens; D.days = p.days;
  save(); return true;
}
const reinsert = (it, k) => S.queue.splice(Math.min(k, S.queue.length), 0, it);

// текущая карточка и её описание
function sessCurrent() {
  if (!S) return null;
  if (S.phase === 'pick') { const c = S.pickList[0] && live(S.pickList[0]); return c ? { c, kind: 'pick' } : null; }
  if (S.phase === 'drill') { const it = S.queue[0]; if (!it) return null; it.c = live(it.c); return { c: it.c, kind: it.kind, it }; }
  return null;
}
function sessUpcoming(n) {
  if (!S) return [];
  const list = S.phase === 'pick' ? S.pickList.slice(1).map(c => ({ c: live(c) })) : S.queue.slice(1).map(it => ({ c: live(it.c) }));
  return list.slice(0, n);
}
function sessLabel(cur) {
  const c = cur.c, d = getDeck(c.deck), dn = d ? d.name : '—', sj = subjOfCard(c);
  const where = (sj ? sj.name + ' · ' : '') + dn;
  if (cur.kind === 'pick') return [where, 'новая'];
  if (cur.kind === 'learn') return [where, 'заучиваю ' + cur.it.ok + '/' + D.settings.need];
  const iv = ivOf(c); return [where, 'ступень ' + Math.min(c.level, iv.length) + '/' + iv.length];
}
// подписи под кнопками
function sessHints(cur) {
  if (cur.kind === 'pick') return ['уже знаю — пропустить', 'начать заучивать'];
  const c = cur.c, it = cur.it, iv = ivOf(c), L = Math.min(c.level, iv.length);
  if (it.kind === 'review') { const nxt = it.failed ? iv[L - 1] : (L >= iv.length ? null : iv[L]); return ['покажу ещё раз', nxt ? 'снова через ' + fmtDur(nxt) : 'выучена полностью']; }
  return ['ещё раз в этой сессии', it.ok + 1 >= D.settings.need ? 'повтор через ' + fmtDur(iv[0]) : 'ещё раз сегодня'];
}
function sessProgress() {
  if (!S) return { pct: 0, done: 0, left: 0 };
  if (S.phase === 'pick') return { pct: S.picked.length / D.settings.perSession * 100, done: S.done, left: Math.max(0, D.settings.perSession - S.picked.length) };
  if (S.phase === 'drill') return { pct: S.total ? (1 - S.queue.length / S.total) * 100 : 100, done: S.done, left: S.queue.length };
  return { pct: 100, done: S.done, left: 0 };
}

// ответ: ok=true «помню»/«учить», false «не помню»/«уже знаю»
function sessAnswer(ok) {
  const cur = sessCurrent(); if (!cur) return;
  const c = cur.c, now = Date.now(); snap(c);
  if (cur.kind === 'pick') {
    S.pickList.shift(); delete c.lok;
    if (ok) { c.state = 'learning'; c.level = 0; S.picked.push(c); } else { c.state = 'known'; S.stats.known++; }
    S.done++;
    if (S.picked.length >= D.settings.perSession || !S.pickList.length) buildDrill();
    save(); return { fed: false };
  }
  const it = cur.it, iv = ivOf(c), res = { fed: false }; S.queue.shift(); S.done++;
  if (it.kind === 'learn') {
    // шаг заучивания сохраняется в карточке (c.lok) — выход из сессии его не теряет; корм и норма — только когда карточка заучена
    if (ok) { it.ok++; c.lok = it.ok; S.stats.ok++; if (it.ok >= D.settings.need) { c.state = 'review'; c.level = 1; c.due = now + iv[0] * MIN; delete c.lok; S.stats.learned++; S.stats.fed++; countOk(); res.fed = true; } else reinsert(it, 3); }
    else { it.ok = 0; c.lok = 0; S.stats.fail++; reinsert(it, 2); }
  } else {
    if (c.level > iv.length) c.level = iv.length;
    if (ok) {
      S.stats.ok++; S.stats.fed++; countOk(); res.fed = true;
      if (it.failed) c.due = now + iv[c.level - 1] * MIN;
      else if (c.level >= iv.length) { c.state = 'mastered'; c.due = 0; S.stats.mastered++; }
      else { c.level++; c.due = now + iv[c.level - 1] * MIN; }
    } else { S.stats.fail++; if (!it.failed) { c.level = Math.max(1, c.level - 1); c.lapses = (c.lapses || 0) + 1; } it.failed = true; reinsert(it, 3); }
  }
  if (!S.queue.length) S.phase = 'done';
  save(); return res;
}
