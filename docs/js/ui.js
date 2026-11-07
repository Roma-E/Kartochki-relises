// ===== Оформление, иконки, навигация, шторки =====
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const PAL_THEMES = {
  lemon: { name: 'Лимон',
    light: { bg: '#F1EFE9', card: '#FFFFFF', ink: '#16161A', muted: '#66656D', line: '#D9D6CE', sun: '#F4C430', onSun: '#16161A', glow: 'rgba(244,196,48,.55)', flame: '#E8A400', panel: '#0B0B0C', panelTxt: '#EDEDED', track: '#26262A', bubble: '#16161A', bubbleTxt: '#FFFFFF', bar: '#FFFFFF', barTxt: '#16161A', bubbleNav: '#16161A', bubbleNavTxt: '#F4C430', scrim: 'rgba(22,22,26,.32)',
      bands: [['#F4C430', '#16161A'], ['#16161A', '#F4F2EC'], ['#FFFFFF', '#16161A']] },
    dark: { bg: '#0E0E10', card: '#1B1B1F', ink: '#F2F1EC', muted: '#A3A2A8', line: '#2F2F35', sun: '#F4C430', onSun: '#16161A', glow: 'rgba(244,196,48,.35)', flame: '#F4C430', panel: '#1B1B1F', panelTxt: '#EDEDED', track: '#2F2F35', bubble: '#F2F1EC', bubbleTxt: '#16161A', bar: '#1B1B1F', barTxt: '#D3D2D8', bubbleNav: '#F4C430', bubbleNavTxt: '#16161A', scrim: 'rgba(0,0,0,.55)',
      bands: [['#F4C430', '#16161A'], ['#26262B', '#F2F1EC'], ['#F2F1EC', '#16161A']] } },
  signal: { name: 'Сигнал',
    light: { bg: '#E9E4DC', card: '#FFFFFF', ink: '#0B0B0B', muted: '#6B655E', line: '#D2CBC1', sun: '#F2412B', onSun: '#0B0B0B', glow: 'rgba(242,65,43,.45)', flame: '#F2412B', panel: '#0B0B0B', panelTxt: '#EDEDED', track: '#262626', bubble: '#0B0B0B', bubbleTxt: '#FFFFFF', bar: '#FFFFFF', barTxt: '#0B0B0B', bubbleNav: '#F2412B', bubbleNavTxt: '#0B0B0B', scrim: 'rgba(11,11,11,.32)',
      bands: [['#F2412B', '#0B0B0B'], ['#0B0B0B', '#F2EEE8'], ['#FFFFFF', '#0B0B0B']] },
    dark: { bg: '#0B0B0B', card: '#1A1919', ink: '#F3EEE8', muted: '#A39D96', line: '#2E2C2B', sun: '#FF4A33', onSun: '#0B0B0B', glow: 'rgba(255,74,51,.35)', flame: '#FF4A33', panel: '#1A1919', panelTxt: '#EDEDED', track: '#2E2C2B', bubble: '#F3EEE8', bubbleTxt: '#0B0B0B', bar: '#1A1919', barTxt: '#D7D1CB', bubbleNav: '#FF4A33', bubbleNavTxt: '#0B0B0B', scrim: 'rgba(0,0,0,.55)',
      bands: [['#FF4A33', '#0B0B0B'], ['#262423', '#F3EEE8'], ['#F3EEE8', '#0B0B0B']] } },
  olive: { name: 'Олива',
    light: { bg: '#C3C6B2', card: '#E4E5DA', ink: '#1D2118', muted: '#4F5546', line: '#A9AD98', sun: '#E2C24F', onSun: '#1D2118', glow: 'rgba(226,194,79,.55)', flame: '#D9654A', panel: '#1D2118', panelTxt: '#E9EBDF', track: '#353B2E', bubble: '#1D2118', bubbleTxt: '#E9EBDF', bar: '#E4E5DA', barTxt: '#1D2118', bubbleNav: '#1D2118', bubbleNavTxt: '#E2C24F', scrim: 'rgba(29,33,24,.32)',
      bands: [['#E2C24F', '#1D2118'], ['#D9654A', '#1D2118'], ['#4A5244', '#E9EBDF']] },
    dark: { bg: '#171A14', card: '#242920', ink: '#E9EBDF', muted: '#A2A895', line: '#33392D', sun: '#E2C24F', onSun: '#1D2118', glow: 'rgba(226,194,79,.32)', flame: '#E07A5F', panel: '#242920', panelTxt: '#E9EBDF', track: '#353B2E', bubble: '#E9EBDF', bubbleTxt: '#1D2118', bar: '#242920', barTxt: '#C9CDBC', bubbleNav: '#E2C24F', bubbleNavTxt: '#1D2118', scrim: 'rgba(0,0,0,.55)',
      bands: [['#E2C24F', '#1D2118'], ['#D9654A', '#1D2118'], ['#3A4136', '#E9EBDF']] } }
};
let T = null;
const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function isDark() { const t = D.settings.theme; return t === 'dark' || (t === 'auto' && mq && mq.matches); }
function applyTheme() {
  const dark = isDark(), p = PAL_THEMES[D.settings.pal] || PAL_THEMES.lemon;
  T = p[dark ? 'dark' : 'light'];
  const r = document.documentElement; r.dataset.theme = dark ? 'dark' : 'light';
  Object.entries(T).forEach(([k, v]) => { if (typeof v === 'string') r.style.setProperty('--' + k, v); });
  let m = $('meta[name=theme-color]'); if (m) m.content = T.bg;
  if (window.Native) Native.statusBar(T.bg, dark);
}
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (D.settings.theme === 'auto') { applyTheme(); rerender(); } });
const darkText = c => ['#16161A', '#0B0B0B', '#1D2118'].includes(c);

const IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="3"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/>',
  add: '<path d="M12 4v16M4 12h16"/>',
  pets: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 4-6 7 0 2 2 3 3.5 2.5S11 19.5 12 19.5s1 .5 2.5 1S18 20 18 18c0-3-3-7-6-7z"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  arrow: '<path d="M7 17L17 7M9 7h8v8"/>', back: '<path d="M15 5l-7 7 7 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>', play: '<path d="M7 5l12 7-12 7z"/>'
};
const ic = (n, sw = 2.2) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>';
const BONE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 3.5a2.5 2.5 0 0 1 2.4 3.2l6.4 6.4a2.5 2.5 0 1 1 1.9 4.2 2.5 2.5 0 1 1-4.2 1.9l-6.4-6.4A2.5 2.5 0 1 1 4.7 6.5a2.5 2.5 0 0 1 1.8-3z"/></svg>';
const BOLT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>';
const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/></svg>';

function slider(pct, thumb, right, sm) {
  const p = Math.max(0, Math.min(100, pct)), tx = 8 + p * 0.84;
  return '<div class="slider' + (sm ? ' sm' : '') + '"><div class="track"><div class="fill" style="width:' + p + '%"></div><div class="thumb" style="left:' + tx + '%">' + thumb + '</div></div>' + (right ? '<div class="pill">' + right + '</div>' : '') + '</div>';
}

// ---- прокручиваемый блок: классы ft / fb (верх/низ можно листать) для растворения краёв ----
function scrollFade(el) {
  if (!el) return;
  const upd = () => { const t = el.scrollTop > 6, b = el.scrollHeight - el.clientHeight > 8 && el.scrollTop + el.clientHeight < el.scrollHeight - 6; el.classList.toggle('ft', t); el.classList.toggle('fb', b); };
  if (!el._sf) { el._sf = 1; el.addEventListener('scroll', upd, { passive: true }); try { const ro = new ResizeObserver(upd); ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild); } catch (e) { } }
  requestAnimationFrame(upd);
}
// ---- тост ----
let toastEl = null;
function toast(t) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = t; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
// ---- шторка ----
const sheets = [];
function openSheet(html, mount) {
  const w = document.createElement('div'); w.className = 'sheet-wrap';
  w.innerHTML = '<div class="sc"></div><div class="sheet" role="dialog">' + html + '</div>';
  document.body.appendChild(w);
  const close = () => { if (!w.parentNode) return; w.remove(); const i = sheets.indexOf(close); if (i >= 0) sheets.splice(i, 1); };
  w.querySelector('.sc').onclick = close;
  sheets.push(close);
  if (mount) mount(w.querySelector('.sheet'), close);
  return close;
}
function confirmSheet(title, text, okText, fn, danger) {
  openSheet('<h2>' + esc(title) + '</h2><p class="muted" style="margin:0;font-weight:700;font-size:14px;line-height:1.4">' + esc(text) + '</p><div class="acts"><button data-x>Отмена</button><button class="' + (danger ? 'danger' : 'pri') + '" data-ok>' + esc(okText) + '</button></div>', (s, close) => {
    s.querySelector('[data-x]').onclick = close; s.querySelector('[data-ok]').onclick = () => { close(); fn(); };
  });
}
function askText(title, val, okText, fn) {
  openSheet('<h2>' + esc(title) + '</h2><input type="text" id="askIn" maxlength="60"><div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>' + esc(okText || 'Готово') + '</button></div>', (s, close) => {
    const i = s.querySelector('#askIn'); i.value = val || ''; setTimeout(() => i.focus(), 60);
    const ok = () => { const v = i.value.trim(); if (!v) { i.focus(); return; } close(); fn(v); };
    s.querySelector('[data-x]').onclick = close; s.querySelector('[data-ok]').onclick = ok; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}

// ---- роутер ----
const SCREENS = {};
let route = { name: 'home', args: {} };
const history_ = [];
const TAB_SCREENS = ['home', 'cards', 'pets', 'settings'];
function go(name, args, opts = {}) {
  if (!opts.replace && route.name !== name) history_.push(route);
  if (TAB_SCREENS.includes(name)) history_.length = 0;
  route = { name, args: args || {} };
  hideSel(); render(true);
}
function back() {
  if (sheets.length) { sheets[sheets.length - 1](); return true; }
  if (nav.open) { setMenu(false); return true; }
  if (SCREENS[route.name] && SCREENS[route.name].onBack && SCREENS[route.name].onBack()) return true;
  const prev = history_.pop(); if (prev) { route = prev; render(true); return true; }
  if (route.name !== 'home') { go('home'); return true; }
  return false;
}
let curCleanup = null;
function render(anim) {
  const app = $('#app');
  if (curCleanup) { try { curCleanup(); } catch (e) { } curCleanup = null; }
  const old = $('#screen'); if (old) old.remove();
  const sc = SCREENS[route.name] || SCREENS.home;
  const el = document.createElement('div'); el.id = 'screen';
  app.insertBefore(el, $('#nav'));
  curCleanup = sc.render(el, route.args) || null;
  if (anim) el.firstElementChild && el.firstElementChild.classList.add('screen-in');
  updateNav();
}
function rerender() {
  const sc = $('#screen .screen'), y = sc ? sc.scrollTop : 0;
  render(false);
  const n = $('#screen .screen'); if (n && y) n.scrollTop = y;
}

// ---- нижнее меню ----
const nav = { open: false };
const NAV_TABS = [['home', 'Главная'], ['cards', 'Карточки'], ['add', 'Добавить'], ['pets', 'Питомцы'], ['settings', 'Настройки']];
function buildNav() {
  const n = $('#nav');
  n.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="goo" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter></defs></svg>' +
    '<div class="scrim"></div><div class="bar"></div><div class="notch"></div>' +
    '<div class="goo"><div class="bub"></div><div class="blob"></div><div class="blob"></div><div class="blob"></div><div class="blob"></div></div>' +
    NAV_TABS.map(([id, l]) => '<button class="tab" data-tab="' + id + '" aria-label="' + l + '">' + ic(id, 2) + '<span>' + l + '</span></button>').join('') +
    '<div class="bubicon"></div>' +
    [['Карточка', '▭', 'card'], ['Набор', '≡', 'set'], ['Предмет', '∫', 'subj'], ['От друга', '⇣', 'import']].map(b => '<button class="bbtn" data-add="' + b[2] + '">' + b[1] + '<em>' + b[0] + '</em></button>').join('');
  n.querySelector('.scrim').onclick = () => setMenu(false);
  $$('.tab', n).forEach(b => b.onclick = () => { const t = b.dataset.tab; if (t === 'add') setMenu(!nav.open); else { setMenu(false); go(t); } });
  $$('.bbtn', n).forEach(b => b.onclick = () => { setMenu(false); addAction(b.dataset.add); });
}
function navX(i) { const w = Math.min(innerWidth, 480), inner = w - 32 - 20; return 16 + 10 + inner / 5 * (i + .5); }
function updateNav() {
  const n = $('#nav'); const show = TAB_SCREENS.includes(route.name);
  n.hidden = !show; if (!show) return;
  const active = nav.open ? 'add' : route.name, ai = NAV_TABS.findIndex(t => t[0] === active);
  const x = navX(Math.max(0, ai)) + 'px';
  $('.notch', n).style.left = x; $('.bub', n).style.left = x; $('.bubicon', n).style.left = x;
  $('.bubicon', n).innerHTML = ic(active === 'add' ? 'close' : active, 2.2);
  $$('.tab', n).forEach((b, i) => { b.style.left = navX(i) + 'px'; b.classList.toggle('on', NAV_TABS[i][0] === active); });
  const pos = [[-128, -72], [-48, -132], [48, -132], [128, -72]];
  const addX = navX(2) - (Math.min(innerWidth, 480) / 2);
  $$('.blob', n).forEach((b, i) => { b.style.left = 'calc(50% + ' + addX + 'px)'; b.style.transitionDelay = (nav.open ? .12 + i * .05 : (3 - i) * .03) + 's'; b.style.transform = nav.open ? 'translate(' + pos[i][0] + 'px,' + pos[i][1] + 'px) scale(1)' : 'translate(0,0) scale(0)'; });
  $$('.bbtn', n).forEach((b, i) => { b.style.left = 'calc(50% + ' + addX + 'px)'; b.style.transitionDelay = (nav.open ? .12 + i * .05 : 0) + 's'; b.style.transform = nav.open ? 'translate(' + pos[i][0] + 'px,' + pos[i][1] + 'px) scale(1)' : 'translate(0,0) scale(.3)'; });
  n.classList.toggle('open', nav.open);
}
function setMenu(v) { nav.open = v; updateNav(); }
window.addEventListener('resize', () => updateNav());

function addAction(kind) {
  if (kind === 'card') openEditor(null, route.name === 'browse' ? route.args.deck : null);
  else if (kind === 'set') newSetSheet();
  else if (kind === 'import') importSetSheet();
  else if (kind === 'subj') askText('Новый предмет', '', 'Создать', v => { const s = { id: uid('s'), name: v }; D.subjects.push(s); save(); askText('Первый набор в «' + v + '»', 'Основной', 'Создать', n => { D.decks.push({ id: uid('d'), subject: s.id, name: n, speed: D.settings.speed, iv: null }); save(); go('cards'); toast('Предмет создан'); }); });
}
function newSetSheet(subjectId, after) {
  if (!D.subjects.length) {
    askText('Сначала предмет', '', 'Дальше', v => { const s = { id: uid('s'), name: v }; D.subjects.push(s); save(); newSetSheet(s.id, after); });
    return;
  }
  const opts = D.subjects.map(s => '<button class="chip' + (s.id === (subjectId || D.subjects[0].id) ? ' on' : '') + '" data-s="' + s.id + '">' + esc(s.name) + '</button>').join('');
  openSheet('<h2>Новый набор</h2><div class="field">Предмет<div class="setchips" style="margin:0;padding:0">' + opts + '</div></div><div class="field">Название набора<input type="text" id="nsName" placeholder="Например: Пределы" maxlength="60"></div><div class="field">Скорость заучивания<div class="seg" id="nsSp">' +
    ['short', 'mid', 'long'].map(k => '<button data-k="' + k + '" class="' + (k === D.settings.speed ? 'on' : '') + '">' + PRESETS[k].name + '</button>').join('') + '</div></div><div class="ivprev" id="nsPv"></div><div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>Создать</button></div>', (s, close) => {
    let sid = subjectId || D.subjects[0].id, sp = D.settings.speed;
    const pv = () => s.querySelector('#nsPv').textContent = PRESETS[sp].iv.map(fmtDur).join(' → ') + ' → выучено';
    $$('[data-s]', s).forEach(b => b.onclick = () => { sid = b.dataset.s; $$('[data-s]', s).forEach(x => x.classList.toggle('on', x === b)); });
    $$('#nsSp button', s).forEach(b => b.onclick = () => { sp = b.dataset.k; $$('#nsSp button', s).forEach(x => x.classList.toggle('on', x === b)); pv(); });
    pv(); setTimeout(() => s.querySelector('#nsName').focus(), 60);
    s.querySelector('[data-x]').onclick = close;
    s.querySelector('[data-ok]').onclick = () => { const n = s.querySelector('#nsName').value.trim(); if (!n) { s.querySelector('#nsName').focus(); return; } const d = { id: uid('d'), subject: sid, name: n, speed: sp, iv: null }; D.decks.push(d); save(); close(); toast('Набор создан'); if (after) after(d); else go('browse', { deck: d.id }); };
  });
}
