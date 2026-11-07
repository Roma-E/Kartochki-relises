// ===== Обмен наборами с друзьями =====
// Без общего хранилища, куда может писать кто угодно: набор уходит файлом или кодом через любой мессенджер,
// либо коротким кодом через свой сервер. Чужие наборы проверяются и добавляются как новые карточки.
const SET_MAX_CARDS = 5000, SET_MAX_FIELD = 20000, SET_MAX_BYTES = 5 * 1024 * 1024;

const b64u = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = str => { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; };
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

function setPayload(d) {
  const sj = getSubject(d.subject);
  return { app: 'kartochki-set', v: 1, subject: sj ? sj.name : '', name: d.name, speed: d.speed, iv: d.iv || null, from: (typeof SYNC !== 'undefined' && SYNC.name) || petName(),
    cards: deckCards(d.id).sort((a, b) => a.created - b.created).map(c => [c.front, c.back || '']) };
}
async function encodeSet(p) {
  const raw = new TextEncoder().encode(JSON.stringify(p));
  if (window.CompressionStream) { try { return 'KRT1.' + b64u(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) { } }
  return 'KRT0.' + b64u(raw);
}
async function decodeSet(code) {
  code = code.trim().replace(/\s+/g, '');
  const m = /^KRT([01])\.([A-Za-z0-9_-]+)$/.exec(code); if (!m) throw new Error('format');
  let bytes = unb64u(m[2]);
  if (m[1] === '1') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  if (bytes.length > SET_MAX_BYTES) throw new Error('big');
  return JSON.parse(new TextDecoder().decode(bytes));
}
// проверка чужого набора: только ожидаемые поля и разумные размеры
function validSet(p) {
  if (!p || p.app !== 'kartochki-set' || !Array.isArray(p.cards)) return null;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const cards = p.cards.slice(0, SET_MAX_CARDS).map(c => Array.isArray(c) ? c : [c && c.front, c && c.back])
    .map(([f, b]) => [str(f, SET_MAX_FIELD).trim(), str(b, SET_MAX_FIELD)]).filter(c => c[0]);
  const iv = Array.isArray(p.iv) ? p.iv.map(Number).filter(n => n > 0 && n < 10 ** 7).slice(0, 30) : null;
  return { subject: str(p.subject, 120).trim(), name: str(p.name, 120).trim() || 'Набор от друга', speed: PRESETS[p.speed] ? p.speed : 'mid', iv: iv && iv.length ? iv : null, from: str(p.from, 60).trim(), cards };
}

function shareSetSheet(d) {
  const n = deckCards(d.id).length;
  if (!n) { toast('В наборе пока нет карточек'); return; }
  openSheet('<h2>Поделиться «' + esc(d.name) + '»</h2><p class="ivprev" style="margin-top:0">' + n + ' ' + plural(n, 'карточка', 'карточки', 'карточек') + '. Друг получит копию набора с нуля — без твоего прогресса.</p><div class="menu">' +
    '<button data-s="file">' + ic('down') + 'Отправить файлом</button>' +
    '<button data-s="code">' + ic('cards') + 'Скопировать код (для мессенджера)</button>' +
    (Sync.on ? '<button data-s="server">' + ic('arrow') + 'Короткий код через мой сервер</button>' : '') +
    '</div>', (s, close) => {
    s.querySelectorAll('.menu svg').forEach(v => { v.style.width = '20px'; v.style.height = '20px'; });
    const p = setPayload(d), fname = 'nabor-' + d.name.replace(/[^\wа-яё -]+/gi, '').trim().replace(/\s+/g, '-').slice(0, 40) + '.json';
    s.querySelector('[data-s=file]').onclick = async () => {
      close(); const text = JSON.stringify(p);
      if (Native.isNative && await Native.shareFile(fname, text)) return;
      try { const f = new File([text], fname, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: d.name }); return; } } catch (e) { if (e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Файл сохранён — отправь его другу');
    };
    s.querySelector('[data-s=code]').onclick = async () => {
      const code = await encodeSet(p); close();
      try { await navigator.clipboard.writeText(code); } catch (e) { }
      const sh = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share;
      if (code.length > 4000) toast('Набор большой (' + Math.round(code.length / 1000) + ' тыс. знаков) — лучше отправить файлом');
      if (Native.isNative && sh) { try { await sh.share({ text: code, dialogTitle: 'Отправить код набора' }); return; } catch (e) { } }
      else if (navigator.share) { try { await navigator.share({ text: code }); return; } catch (e) { if (e.name === 'AbortError') return; } }
      toast('Код скопирован — вставь его в сообщение другу');
    };
    const sv = s.querySelector('[data-s=server]');
    if (sv) sv.onclick = async () => {
      try {
        const r = await api('/api/shares', { method: 'POST', body: p, timeout: 15000 }); close();
        openSheet('<h2>Код набора</h2><p class="ivprev" style="margin-top:0">Друг вводит его в «Добавить набор от друга». Работает, пока он подключён к тому же серверу. Код действует 7 дней.</p><div class="num" style="font-size:56px;text-align:center;letter-spacing:6px;margin:10px 0">' + esc(r.code) + '</div><div class="acts"><button class="pri" data-c>Скопировать</button></div>', (s2, c2) => {
          s2.querySelector('[data-c]').onclick = () => { try { navigator.clipboard.writeText(r.code); } catch (e) { } c2(); toast('Код скопирован'); };
        });
      } catch (e) { toast('Сервер недоступен — отправь файлом или кодом'); }
    };
  });
}

function importSetSheet() {
  openSheet('<h2>Набор от друга</h2><p class="ivprev" style="margin-top:0">Вставь код, который прислал друг, или выбери файл набора.</p>' +
    '<textarea id="impCode" rows="4" placeholder="KRT1.… или короткий код" style="width:100%;border:0;outline:0;resize:none;border-radius:16px;padding:12px 14px;background:var(--card);color:var(--ink);font-family:ui-monospace,monospace;font-size:13px"></textarea>' +
    '<input type="file" id="impSetFile" hidden>' +
    '<div class="acts"><button data-file>Выбрать файл</button><button class="pri" data-go>Дальше</button></div>', (s, close) => {
    const ta = s.querySelector('#impCode'), fi = s.querySelector('#impSetFile');
    const proceed = p => { const v = validSet(p); if (!v || !v.cards.length) { toast('Это не набор карточек или он пустой'); return; } close(); confirmImport(v); };
    s.querySelector('[data-file]').onclick = () => fi.click();
    fi.onchange = async () => { const f = fi.files[0]; fi.value = ''; if (!f) return; if (f.size > SET_MAX_BYTES) { toast('Файл слишком большой'); return; } close(); importAnyText(await f.text().catch(() => '')); };
    s.querySelector('[data-go]').onclick = async () => {
      const t = ta.value.trim(); if (!t) { ta.focus(); return; }
      try {
        if (/^KRT[01]\./.test(t)) proceed(await decodeSet(t));
        else if (/^[A-Za-z0-9]{6}$/.test(t)) { if (!Sync.on) { toast('Короткий код работает через сервер — подключи его в настройках'); return; } proceed(await api('/api/shares/' + t.toUpperCase())); }
        else { close(); importAnyText(t); }
      } catch (e) { toast(e.status === 404 ? 'Код не найден или устарел' : 'Код не подошёл — проверь, что скопирован целиком'); }
    };
  });
}
function confirmImport(v) {
  const subjects = D.subjects.slice();
  const same = subjects.find(x => x.name.toLowerCase() === v.subject.toLowerCase());
  let target = same ? same.id : (v.subject ? 'new' : (subjects[0] ? subjects[0].id : 'new'));
  const ex = v.cards.slice(0, 3).map(c => '<li>' + esc(plainText(c[0]).slice(0, 70)) + '</li>').join('');
  openSheet('<h2>«' + esc(v.name) + '»</h2><p class="ivprev" style="margin-top:0">' + v.cards.length + ' ' + plural(v.cards.length, 'карточка', 'карточки', 'карточек') + (v.from ? ' · от ' + esc(v.from) : '') + '</p>' +
    '<ul style="margin:0 0 6px;padding-left:18px;font-size:14px;font-weight:700;line-height:1.5">' + ex + (v.cards.length > 3 ? '<li class="muted">…</li>' : '') + '</ul>' +
    '<div class="field">В какой предмет<div class="setchips" style="margin:0;padding:0;flex-wrap:wrap">' +
    subjects.map(x => '<button class="chip" data-t="' + x.id + '">' + esc(x.name) + '</button>').join('') +
    '<button class="chip" data-t="new">+ ' + esc(same || !v.subject ? 'новый предмет' : v.subject) + '</button></div></div>' +
    '<div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>Добавить</button></div>', (s, close) => {
    const mark = () => s.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === target));
    s.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { target = b.dataset.t; mark(); }); mark();
    s.querySelector('[data-x]').onclick = close;
    s.querySelector('[data-ok]').onclick = () => {
      let sid = target;
      if (sid === 'new') { const sj = { id: uid('s'), name: (!same && v.subject) || 'От друзей' }; D.subjects.push(sj); sid = sj.id; }
      let name = v.name; while (D.decks.some(d => d.subject === sid && d.name === name)) name += ' (2)';
      const d = { id: uid('d'), subject: sid, name, speed: v.speed, iv: v.iv }; D.decks.push(d);
      const now = Date.now();
      v.cards.forEach((c, i) => D.cards.push({ id: uid('c'), deck: d.id, front: c[0], back: c[1], state: 'new', level: 0, due: 0, lapses: 0, created: now + i }));
      save(); close(); toast('Набор добавлен: ' + v.cards.length + ' ' + plural(v.cards.length, 'карточка', 'карточки', 'карточек'));
      go('browse', { deck: d.id });
    };
  });
}

// Любой файл/текст: набор от друга, набор или резервная копия старого сайта, копия этого приложения
function importAnyText(text) {
  text = (text || '').replace(/^\uFEFF/, '').trim();
  if (/^KRT[01]\./.test(text)) { decodeSet(text).then(p => { const v = validSet(p); if (v && v.cards.length) confirmImport(v); else toast('Код не подошёл'); }).catch(() => toast('Код не подошёл — проверь, что скопирован целиком')); return; }
  let j; try { j = JSON.parse(text); } catch (e) { toast('Это не файл карточек (нужен .json с сайта или из приложения)'); return; }
  if (j && j.app === 'kartochki-set') { const v = validSet(j); if (v && v.cards.length) confirmImport(v); else toast('Набор пустой'); return; }
  if (j && (j.app === 'kartochki' || Array.isArray(j.cards))) {
    const name = j.set ? '«' + (j.set.name || 'набор') + '»' : 'все карточки';
    const cnt = Array.isArray(j.cards) ? j.cards.length : 0;
    confirmSheet('Загрузить ' + name + '?', cnt + ' ' + plural(cnt, 'карточка', 'карточки', 'карточек') + (j.subject ? ' · предмет «' + j.subject + '»' : '') + '. Прогресс (ступени и даты повторов) сохранится.', 'Загрузить', () => {
      try { const n = importData(j); save(); toast(n ? 'Загружено карточек: ' + n : 'Эти карточки уже есть в приложении'); go('cards'); }
      catch (e) { toast('Не получилось прочитать файл'); }
    });
    return;
  }
  toast('Не узнал формат файла');
}
