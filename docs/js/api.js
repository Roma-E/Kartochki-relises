// ===== Синхронизация с сервером (FastAPI) =====
// Приложение работает и без сервера: всё хранится на устройстве. Если сервер подключён,
// данные отправляются на него после каждого изменения и подтягиваются при запуске —
// так одинаковые карточки и питомец будут на телефоне и на компьютере.
const SK = 'kartochki-sync';
let SYNC = (() => { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch (e) { return {}; } })();
const saveSync = () => { try { localStorage.setItem(SK, JSON.stringify(SYNC)); } catch (e) { } };
const normServer = s => { s = (s || '').trim().replace(/\/+$/, ''); if (s && !/^https?:\/\//i.test(s)) s = 'http://' + s; return s; };

async function api(path, opts = {}, server = SYNC.server, token = SYNC.token) {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), opts.timeout || 8000);
  try {
    const r = await fetch(server + path, {
      method: opts.method || 'GET', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; try { e.detail = (await r.json()).detail; } catch (x) { } throw e; }
    return r.status === 204 ? null : await r.json();
  } finally { clearTimeout(tm); }
}

// снимок данных в том виде, в каком его принимает PUT /api/state
function snapshot() {
  return { subjects: D.subjects, decks: D.decks.map(d => ({ ...d, iv: d.iv || null })), cards: D.cards, settings: D.settings,
    pet: D.pet, tokens: D.tokens, today: D.today, days: D.days, saved: D.saved || Date.now() };
}
let syncBusy = false, syncTimer = null;
const Sync = {
  get on() { return !!(SYNC.server && SYNC.token); },
  status: '',
  async push() {
    if (!this.on || syncBusy) return; syncBusy = true;
    try { await api('/api/state', { method: 'PUT', body: snapshot(), timeout: 15000 }); SYNC.last = Date.now(); saveSync(); this.status = 'ok'; }
    catch (e) { this.status = e.status === 401 ? 'auth' : 'offline'; }
    finally { syncBusy = false; }
  },
  // при запуске: у кого свежее — тот и прав (сервер или телефон)
  async pull() {
    if (!this.on) return false;
    try {
      const r = await api('/api/state', { timeout: 10000 });
      if (r && r.saved && r.saved > (D.saved || 0) && (r.cards.length || r.subjects.length)) {
        D = normalize(r); D.saved = r.saved;
        try { localStorage.setItem(K, JSON.stringify(D)); } catch (e) { }
        this.status = 'ok'; SYNC.last = Date.now(); saveSync(); return true;
      }
      await this.push(); return false;
    } catch (e) { this.status = e.status === 401 ? 'auth' : 'offline'; return false; }
  },
  schedule() { if (!this.on) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => this.push(), 2500); },
  async connect(server, name, code) {
    server = normServer(server);
    await api('/api/health', { timeout: 5000 }, server, null);
    let user;
    if (code) user = { ...(await api('/api/users/me', {}, server, code.trim())), token: code.trim() };
    else user = await api('/api/users', { method: 'POST', body: { name } }, server, null);
    SYNC = { server, token: user.token, name: user.name, id: user.id, last: 0 }; saveSync();
    return user;
  },
  disconnect() { SYNC = {}; saveSync(); this.status = ''; }
};

// если приложение открыто с самого сервера (docker, http://IP:порт) — предложим адрес автоматически
function sameOriginServer() { return /^https?:$/.test(location.protocol) && !(window.Native && Native.isNative) && !/github\.io$/.test(location.hostname) ? location.origin : ''; }

function serverSheet() {
  const on = Sync.on;
  const st = { ok: 'синхронизировано', offline: 'сервер недоступен — данные сохранятся на устройстве и уйдут позже', auth: 'профиль не найден на сервере' }[Sync.status] || '';
  const last = SYNC.last ? new Date(SYNC.last).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'ещё не было';
  if (on) {
    openSheet('<h2>Сервер</h2><div class="lines" style="margin-top:0">' +
      '<div class="line"><b>Адрес</b><span>' + esc(SYNC.server) + '</span></div>' +
      '<div class="line"><b>Профиль</b><span>' + esc(SYNC.name || '') + '</span></div>' +
      '<div class="line"><b>Последняя синхронизация</b><span>' + esc(last) + '</span></div></div>' +
      (st ? '<p class="ivprev">' + esc(st) + '</p>' : '') +
      '<div class="field">Код профиля — введи его на другом устройстве, чтобы там были те же карточки<input type="text" readonly value="' + esc(SYNC.token) + '" id="tok"></div>' +
      '<div class="acts"><button data-off>Отключить</button><button class="pri" data-now>Синхронизировать</button></div>', (s, close) => {
      s.querySelector('#tok').onclick = e => { e.target.select(); try { navigator.clipboard.writeText(SYNC.token); toast('Код скопирован'); } catch (x) { } };
      s.querySelector('[data-now]').onclick = async () => { const ch = await Sync.pull(); close(); toast(Sync.status === 'ok' ? (ch ? 'Данные загружены с сервера' : 'Синхронизировано') : 'Сервер недоступен'); applyTheme(); rerender(); };
      s.querySelector('[data-off]').onclick = () => { Sync.disconnect(); close(); rerender(); toast('Сервер отключён, данные остались на устройстве'); };
    });
    return;
  }
  openSheet('<h2>Подключить сервер</h2><p class="ivprev" style="margin-top:0">Сервер запускается на компьютере через Docker. Адрес — IP компьютера в Wi-Fi и порт, например <b>192.168.1.5:8080</b>.</p>' +
    '<div class="field">Адрес сервера<input type="text" id="srv" placeholder="192.168.1.5:8080" inputmode="url" autocapitalize="off"></div>' +
    '<div class="seg" id="mode"><button class="on" data-m="new">Новый профиль</button><button data-m="code">У меня есть код</button></div>' +
    '<div class="field" id="fName">Твоё имя<input type="text" id="nm" maxlength="40" placeholder="Рома"></div>' +
    '<div class="field" id="fCode" hidden>Код профиля с другого устройства<input type="text" id="cd" autocapitalize="off"></div>' +
    '<div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>Подключить</button></div>', (s, close) => {
    let mode = 'new';
    s.querySelector('#srv').value = SYNC.server || sameOriginServer();
    s.querySelectorAll('#mode button').forEach(b => b.onclick = () => { mode = b.dataset.m; s.querySelectorAll('#mode button').forEach(x => x.classList.toggle('on', x === b)); s.querySelector('#fName').hidden = mode !== 'new'; s.querySelector('#fCode').hidden = mode !== 'code'; });
    s.querySelector('[data-x]').onclick = close;
    s.querySelector('[data-ok]').onclick = async e => {
      const srv = s.querySelector('#srv').value, nm = s.querySelector('#nm').value.trim() || 'Я', cd = s.querySelector('#cd').value.trim();
      if (!srv) { s.querySelector('#srv').focus(); return; }
      if (mode === 'code' && !cd) { s.querySelector('#cd').focus(); return; }
      e.target.textContent = 'Подключаю…';
      try {
        await Sync.connect(srv, nm, mode === 'code' ? cd : null);
        if (mode === 'code') { D.saved = 0; await Sync.pull(); } else await Sync.push();
        close(); applyTheme(); rerender(); toast(mode === 'code' ? 'Готово! Данные загружены' : 'Сервер подключён');
      } catch (err) {
        e.target.textContent = 'Подключить';
        toast(err.status === 401 ? 'Код не подошёл' : 'Не получилось подключиться. Проверь адрес и что телефон в той же Wi-Fi сети');
      }
    };
  });
}
