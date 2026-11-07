// ===== Связь с Android (Capacitor): уведомления, файлы, статус-бар, кнопка «назад», обновления =====
const Native = (() => {
  const C = window.Capacitor, isNative = !!(C && C.isNativePlatform && C.isNativePlatform());
  const P = n => (C && C.Plugins && C.Plugins[n]) || null;
  async function statusBar(color, dark) {
    const sb = P('StatusBar'); if (!isNative || !sb) return;
    try { await sb.setBackgroundColor({ color }); await sb.setStyle({ style: dark ? 'DARK' : 'LIGHT' }); } catch (e) { }
  }
  async function askNotify() {
    const ln = P('LocalNotifications');
    if (isNative && ln) {
      try {
        let r = await ln.checkPermissions();
        if (r.display !== 'granted') r = await ln.requestPermissions();
        const ok = r.display === 'granted';
        if (!ok) toast('Разреши уведомления для «Карточки» в настройках телефона'); else schedule();
        return ok;
      } catch (e) { return false; }
    }
    if ('Notification' in window && Notification.permission === 'default') { try { return (await Notification.requestPermission()) === 'granted'; } catch (e) { } }
    return 'Notification' in window && Notification.permission === 'granted';
  }
  // расписание напоминаний: когда карточки станут «пора повторить» + вечером, если норма не сделана
  async function schedule() {
    const ln = P('LocalNotifications'); if (!isNative || !ln) return;
    try {
      const pend = await ln.getPending(); if (pend.notifications.length) await ln.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
      if (!D.settings.notify) return;
      const now = Date.now(), list = [];
      const times = D.cards.filter(c => c.state === 'review' && c.due > now).map(c => c.due).sort((a, b) => a - b);
      const N = +D.settings.notifyEvery || 0;
      if (N > 0) {
        // каждые N минут, пока есть что повторить (уже созревшие + заучиваемые + те, что созреют к этому времени)
        const base = dueCount(); let k = 0, id = 100;
        for (let t = now + N * MIN; t < now + 48 * HOUR && list.length < 60; t += N * MIN) {
          while (k < times.length && times[k] <= t) k++;
          const n = base + k, at = new Date(t), hr = at.getHours();
          if (!n || hr < 8 || hr >= 23) continue;
          list.push({ id: id++, title: petName() + ' проголодался', body: 'Пора повторить: ' + n + ' ' + plural(n, 'карточка', 'карточки', 'карточек'), schedule: { at, allowWhileIdle: true }, smallIcon: 'ic_stat_icon' });
        }
      } else {
        const buckets = []; times.forEach(t => { const b = buckets[buckets.length - 1]; if (b && t - b.t < 20 * MIN) b.n++; else buckets.push({ t, n: 1 }); });
        let cum = dueCount();
        buckets.slice(0, 20).forEach((b, i) => {
          cum += b.n; const at = new Date(b.t + 60000), hr = at.getHours();
          if (hr < 8 || hr >= 23) return; // ночью не будим
          list.push({ id: 100 + i, title: petName() + ' проголодался', body: 'Пора повторить: ' + cum + ' ' + plural(cum, 'карточка', 'карточки', 'карточек'), schedule: { at, allowWhileIdle: true }, smallIcon: 'ic_stat_icon' });
        });
      }
      const ev = new Date(); ev.setHours(D.settings.notifyHour, 0, 0, 0);
      rollDay();
      if (ev.getTime() <= now || D.today.normDone) ev.setDate(ev.getDate() + 1);
      list.push({ id: 10, title: 'Дневная норма', body: petName() + ' ждёт: сделай ' + normGoal() + ' «помню» и получи жетон на коробку', schedule: { at: ev, allowWhileIdle: true }, smallIcon: 'ic_stat_icon' });
      const ev2 = new Date(ev); ev2.setDate(ev2.getDate() + 1);
      list.push({ id: 11, title: 'Не забывай про карточки', body: 'Серия не должна прерваться — загляни хотя бы на пару минут', schedule: { at: ev2, allowWhileIdle: true }, smallIcon: 'ic_stat_icon' });
      await ln.schedule({ notifications: list });
    } catch (e) { console.warn('notify', e); }
  }
  async function shareFile(name, text) {
    const fs = P('Filesystem'), sh = P('Share'); if (!fs || !sh) return false;
    try {
      const r = await fs.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
      await sh.share({ title: 'Копия карточек', url: r.uri, dialogTitle: 'Сохранить копию' }); return true;
    } catch (e) { return false; }
  }
  // резервная копия внутри приложения (на случай очистки WebView)
  async function backup() { const fs = P('Filesystem'); if (!isNative || !fs) return; try { await fs.writeFile({ path: 'kartochki-backup.json', data: JSON.stringify(D), directory: 'DATA', encoding: 'utf8' }); } catch (e) { } }
  async function restore() { const fs = P('Filesystem'); if (!isNative || !fs) return null; try { const r = await fs.readFile({ path: 'kartochki-backup.json', directory: 'DATA', encoding: 'utf8' }); return JSON.parse(r.data); } catch (e) { return null; } }
  function openUrl(url) { const b = P('Browser'); if (isNative && b) b.open({ url }); else window.open(url, '_blank'); }
  // Android 13+: без разрешения напоминания молча не показываются — спрашиваем при запуске, пока напоминания включены
  async function ensureNotify() {
    const ln = P('LocalNotifications'); if (!isNative || !ln || !D.settings.notify) return;
    try {
      let r = await ln.checkPermissions();
      if (r.display === 'granted') return;
      if (localStorage.getItem('kartochki-notify-asked') && r.display === 'denied') return; // уже отказали — не надоедаем
      localStorage.setItem('kartochki-notify-asked', '1');
      r = await ln.requestPermissions();
      if (r.display === 'granted') schedule();
    } catch (e) { }
  }
  function init() {
    const app = P('App');
    if (isNative && app) {
      app.addListener('backButton', () => { if (!back()) app.exitApp(); });
      app.addListener('resume', async () => {
        rollDay(); if (!sheets.length) rerender();
        if (Upd.pending && Upd.path) { const u = updater(); if (u && (await u.canInstall()).allowed) installUpdate(); }
        else checkUpdate(false);
      });
    }
  }
  return { isNative, statusBar, askNotify, ensureNotify, schedule, shareFile, backup, restore, openUrl, init };
})();

// ===== обновления: проверка latest.json, скачивание APK внутри приложения и установка =====
// 0.2.2 > 0.2.2-beta.5 > 0.2.1
const vnum = v => { const [base, pre] = String(v || '0').replace(/^v/, '').split('-'); const b = base.split('.').map(n => parseInt(n) || 0); while (b.length < 3) b.push(0);
  return ((b[0] * 1000 + b[1]) * 1000 + b[2]) * 100 + (pre ? Math.min(99, parseInt((pre.match(/\d+/) || ['1'])[0]) || 1) : 99); };
const Upd = { info: null, state: 'idle', pct: 0, path: null, pending: false, shown: false };
const updater = () => (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.ApkUpdater) || null;

// Спрашиваем два источника сразу: raw.githubusercontent (кэш CDN до ~5 мин) и API GitHub (без кэша) — берём более новую версию.
async function fetchRaw(url) { const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' }); if (r.status === 404) return null; if (!r.ok) throw new Error('raw'); return await r.json(); }
async function fetchApi(url) {
  const m = /githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(url);
  if (!m) throw new Error('no url');
  const r = await fetch('https://api.github.com/repos/' + m[1] + '/' + m[2] + '/contents/' + m[4] + '?ref=' + m[3] + '&t=' + Date.now(), { cache: 'no-store' });
  if (r.status === 404) return null; if (!r.ok) throw new Error('api'); const j = await r.json();
  return JSON.parse(decodeURIComponent(escape(atob(j.content.replace(/\n/g, '')))));
}
async function fetchLatest(url = UPDATE_URL) {
  const res = await Promise.allSettled([fetchRaw(url), fetchApi(url)]);
  const ok = res.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!ok.length) throw new Error('offline');
  return ok.filter(x => x && x.version).sort((a, b) => vnum(b.version) - vnum(a.version))[0] || null;
}
// Каналы: стабильные версии (уведомления можно выключить) и бета (по умолчанию выключена —
// пока выключена, бету нельзя ни увидеть, ни установить).
async function checkUpdate(manual) {
  const st = D.settings;
  if (!manual && !st.updStable && !st.updBeta) return;
  try {
    const list = [await fetchLatest(UPDATE_URL)];
    if (st.updBeta) { try { list.push(await fetchLatest(BETA_URL)); } catch (e) { } }
    const j = list.filter(x => x && x.version && (st.updBeta || !/-beta/i.test(x.version))).sort((a, b) => vnum(b.version) - vnum(a.version))[0];
    if (!j) { if (manual) toast('Обновлений пока нет'); return; }
    if (!manual && !st.updStable && !/-beta/i.test(j.version)) return;
    if (vnum(j.version) <= vnum(APP_VERSION)) { Upd.info = null; if (manual) toast('У тебя последняя версия ' + APP_VERSION); return; }
    const fresh = !Upd.info || Upd.info.version !== j.version;
    Upd.info = j; if (fresh) { Upd.state = 'idle'; Upd.path = null; }
    if (!Native.isNative) { if (manual || !Upd.shown) { Upd.shown = true; toast('Есть новая версия ' + j.version + ' — обнови страницу'); } return; }
    if (route.name === 'home' && !sheets.length) rerender();
    if (manual || !Upd.shown) { Upd.shown = true; updateSheet(); }
  } catch (e) { if (manual) toast('Не получилось проверить — нет интернета?'); }
}
function updView() {
  const j = Upd.info; if (!j) return '';
  if (Upd.state === 'downloading') return slider(Math.max(0, Upd.pct), (Upd.pct >= 0 ? Upd.pct + '%' : '…'), 'скачиваю', true);
  if (Upd.state === 'ready') return '<p class="ivprev" style="margin:0">Файл скачан. Нажми «Установить», а потом «Установить» в окне Android. Карточки и питомцы сохранятся.</p>';
  if (Upd.state === 'perm') return '<p class="ivprev" style="margin:0">Android просит разрешить приложению «Карточки» устанавливать обновления. Нажми «Разрешить», включи переключатель и вернись — установка продолжится сама.</p>';
  if (Upd.state === 'error') return '<p class="ivprev" style="margin:0;color:#D93A2B">Не получилось скачать. Проверь интернет и попробуй ещё раз.</p>';
  return '<p class="ivprev" style="margin:0">Обновление скачается прямо в приложении и установится поверх — карточки и питомцы сохранятся.</p>';
}
function updButtons() {
  if (Upd.state === 'downloading') return '<button data-x>Свернуть</button>';
  if (Upd.state === 'ready') return '<button data-x>Позже</button><button class="pri" data-install>Установить</button>';
  if (Upd.state === 'perm') return '<button data-x>Позже</button><button class="pri" data-perm>Разрешить</button>';
  return '<button data-x>Позже</button><button class="pri" data-dl>' + (Upd.state === 'error' ? 'Ещё раз' : 'Обновить') + '</button>';
}
let updSheetEl = null;
function updateSheet() {
  const j = Upd.info; if (!j) return;
  if (updSheetEl && updSheetEl.isConnected) return;
  const notes = (j.notes || []).slice(0, 6).map(l => '<li>' + esc(l) + '</li>').join('');
  openSheet('<h2>' + (/-beta/i.test(j.version) ? 'Бета-версия ' : 'Новая версия ') + esc(j.version) + '</h2>' + (/-beta/i.test(j.version) ? '<p class="ivprev" style="margin:0 0 8px">Тестовая версия — может работать нестабильно.</p>' : '') + (notes ? '<ul style="margin:0 0 12px;padding-left:18px;font-weight:700;font-size:14px;line-height:1.5">' + notes + '</ul>' : '') +
    '<div id="updBody"></div><div class="acts" id="updActs"></div>', (s, close) => { updSheetEl = s; s._close = close; paintUpd(); });
}
function paintUpd() {
  if (route.name === 'home') { const b = $('#updBar'); if (b) b.innerHTML = updBarInner(); }
  const s = updSheetEl; if (!s || !s.isConnected) return;
  s.querySelector('#updBody').innerHTML = updView();
  const acts = s.querySelector('#updActs'); acts.innerHTML = updButtons();
  const q = k => acts.querySelector(k);
  if (q('[data-x]')) q('[data-x]').onclick = () => s._close();
  if (q('[data-dl]')) q('[data-dl]').onclick = () => downloadUpdate();
  if (q('[data-install]')) q('[data-install]').onclick = () => installUpdate();
  if (q('[data-perm]')) q('[data-perm]').onclick = async () => { Upd.pending = true; const u = updater(); if (u) await u.openInstallSettings(); };
}
async function downloadUpdate() {
  const u = updater(), j = Upd.info; if (!j) return;
  if (/-beta/i.test(j.version) && !D.settings.updBeta) { toast('Бета-версии выключены в настройках'); return; }
  if (!u) { Native.openUrl(j.apk); return; } // старая сборка без модуля обновления
  Upd.state = 'downloading'; Upd.pct = 0; paintUpd();
  let h = null;
  try {
    h = await u.addListener('progress', e => { Upd.pct = e.pct; paintUpd(); });
    const r = await u.download({ url: j.apk, name: 'kartochki-' + j.version + '.apk' });
    Upd.path = r.path; Upd.state = 'ready'; paintUpd();
    installUpdate();
  } catch (e) { Upd.state = 'error'; paintUpd(); }
  finally { if (h && h.remove) h.remove(); }
}
async function installUpdate() {
  const u = updater(); if (!u || !Upd.path) return;
  try {
    const c = await u.canInstall();
    if (!c.allowed) { Upd.state = 'perm'; Upd.pending = true; if (!updSheetEl || !updSheetEl.isConnected) updateSheet(); paintUpd(); return; }
    Upd.pending = false; Upd.state = 'ready'; paintUpd();
    await u.install({ path: Upd.path });
  } catch (e) { Upd.state = 'error'; paintUpd(); }
}
function updBarInner() {
  const j = Upd.info; if (!j) return '';
  const t = Upd.state === 'downloading' ? 'Скачиваю обновление… ' + Math.max(0, Upd.pct) + '%' : Upd.state === 'ready' ? 'Обновление готово — установить' : 'Новая версия ' + esc(j.version) + ' — обновить';
  return '<span style="flex:1">' + t + '</span><span class="go" style="width:34px;height:34px">' + ic('arrow', 3) + '</span>' +
    (Upd.state === 'downloading' ? '<i style="position:absolute;left:0;bottom:0;height:3px;background:var(--onSun);opacity:.5;width:' + Math.max(0, Upd.pct) + '%"></i>' : '');
}
function updBar() { return Upd.info && Native.isNative ? '<button class="updbar press" id="updBar">' + updBarInner() + '</button>' : ''; }
