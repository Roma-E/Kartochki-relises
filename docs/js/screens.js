// ===== Главная, Карточки, Питомцы, Настройки =====

SCREENS.home = {
  render(el) {
    rollDay();
    const fc = focusCards(), due = dueCount(fc), nw = newCount(fc), f = food(), h = hoursLeft(), fd = focusDecks(), ni = normInfo();
    const d = new Date(); const dn = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const pet = D.pet.active, P = PETS[pet] || PETS.dog;
    const st = streak();
    const sideTxt = due ? plural(due, 'карточка ждёт', 'карточки ждут', 'карточек ждут') + '<br>повтора' : (nw ? 'всё повторено!<br>учим новое?' : fc.length ? 'всё повторено!<br>добавь карточки' : D.cards.length ? 'здесь пусто —<br>выбери другой набор' : 'пока нет карточек<br>создай первую');
    const hl = h >= 1 ? Math.floor(h) + ' ч' : Math.round(h * 60) + ' мин';
    el.innerHTML = '<div class="screen"><div class="home">' +
      '<div class="topline"><span>' + esc(dn) + '</span><span class="streak">' + FLAME + st + ' ' + plural(st, 'день', 'дня', 'дней') + '</span></div>' +
      updBar() +
      '<div class="bigdue"><button class="n press" data-go="due" aria-label="Повторить">' + due + '</button><div class="side"><b>' + sideTxt + '</b><button class="go press" data-go="due" aria-label="Начать">' + ic('arrow', 3) + '</button></div></div>' +
      '<div class="petzone"><button class="sun-circle press" data-go="pets" aria-label="' + esc(P.name) + '"><div class="pet" style="width:' + P.w + '%">' + petSvg(pet, P.big[0], P.big[1]) + '</div></button><div class="bubble">' + esc(hungerLine()) + '</div></div>' +
      '<div><div class="satlbl lbl"><span>' + esc(petName()) + ' · сытость</span>' + (nw ? '<button class="link" data-go="learn">учить новое · ' + nw + '</button>' : '<span>' + (ni.k ? 'жетон ' + (ni.k + 1) + ': ' : 'до жетона ') + ni.have + ' / ' + ni.need + '</span>') + '</div>' +
      slider(f, BONE + Math.round(f) + '%', ic('clock') + (f <= 0 ? 'голоден' : hl)) + '</div>' +
      '</div></div>';
    const ub = el.querySelector('#updBar'); if (ub) ub.onclick = () => { if (Upd.state === 'ready') installUpdate(); else updateSheet(); };
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      const g = b.dataset.go;
      if (g === 'pets') go('pets');
      else if (g === 'learn') startReview('learn', fd);
      else if (due) startReview('review', fd);
      else if (nw) startReview('learn', fd);
      else openEditor(null);
    });
  }
};
// выбор: что учить и повторять с главной — все наборы, предмет или один набор
function focusSheet() {
  const f = D.settings.focus, cur = !f ? 'all' : f.t + ':' + f.id;
  const cnt = cs => { const n = dueCount(cs); return n ? n + ' к повтору' : newCount(cs) ? newCount(cs) + ' новых' : ''; };
  let h = '<button data-f="all" class="' + (cur === 'all' ? 'on' : '') + '">Все наборы<span>' + cnt(D.cards) + '</span></button>';
  D.subjects.forEach(sj => {
    const ds = D.decks.filter(d => d.subject === sj.id); if (!ds.length) return;
    const ids = new Set(ds.map(d => d.id));
    h += '<button data-f="subj:' + sj.id + '" class="' + (cur === 'subj:' + sj.id ? 'on' : '') + '">' + esc(sj.name) + '<span>' + cnt(D.cards.filter(c => ids.has(c.deck))) + '</span></button>';
    ds.forEach(d => { h += '<button data-f="deck:' + d.id + '" class="sub' + (cur === 'deck:' + d.id ? ' on' : '') + '">' + esc(d.name) + '<span>' + cnt(deckCards(d.id)) + '</span></button>'; });
  });
  openSheet('<h2>Что учим</h2><p class="ivprev" style="margin:0 0 10px">Кнопка на главной будет повторять и учить только это.</p><div class="flist">' + h + '</div>', (s, close) => {
    s.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { const v = b.dataset.f; D.settings.focus = v === 'all' ? null : { t: v.split(':')[0], id: v.slice(v.indexOf(':') + 1) }; save(); close(); rerender(); });
  });
}
function petName() { const o = D.pet.owned[D.pet.active]; return (o && o.name) || (PETS[D.pet.active] || PETS.dog).name; }
function startReview(mode, decks) {
  startSession(mode, decks);
  if (S.phase === 'done' && !S.total && !S.pickList.length) { S = null; toast(mode === 'learn' ? 'Новых карточек нет — добавь их через «+»' : 'Пока нечего повторять'); return; }
  go('review');
}

SCREENS.cards = {
  open: {},
  render(el) {
    const due = dueCount(), total = D.cards.length, pct = learnedPct();
    const days = lastDays(14), mx = Math.max(1, ...days);
    let html = '<div class="screen"><div class="cards-head"><div style="display:flex;flex-direction:column"><span class="lbl">Карточки</span><span class="big">' + due + '</span><span style="font-size:13px;font-weight:800">к повтору сегодня</span></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding-top:4px"><div class="bars" title="Повторения за 14 дней">' + days.map(v => '<i class="' + (v ? 'on' : '') + '" style="height:' + Math.max(8, Math.round(v / mx * 54)) + 'px"></i>').join('') + '</div><span class="lbl" style="font-size:12px">' + pct + '% выучено · ' + total + '</span></div></div>';
    if (D.decks.length) html += '<div class="focuswrap"><button class="focusbtn press" data-focus>учу: <b>' + esc(focusName()) + '</b>' + ic('down', 2.6) + '</button></div>';
    if (!D.subjects.length) html += '<div class="empty">Пока пусто.<br>Нажми «+» внизу, чтобы создать набор,<br>или добавь набор от друга.</div>';
    html += '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn-ghost press" data-newsubj style="flex:1">＋ Предмет</button><button class="btn-ghost press" data-import style="flex:1">⇣ Набор от друга</button></div>';
    D.subjects.forEach((s, i) => {
      const [bg, fg] = T.bands[i % 3], dk = darkText(fg);
      const decks = D.decks.filter(d => d.subject === s.id);
      const cs = D.cards.filter(c => decks.some(d => d.id === c.deck));
      const open = this.open[s.id] ?? (i === 0);
      html += '<div class="subj" style="background:' + bg + ';color:' + fg + ';--rowline:' + (dk ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.16)') + ';--cubebg:' + (dk ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.16)') + '">' +
        '<button class="subj-h" data-subj="' + s.id + '"><span class="t"><small>' + decks.length + ' ' + plural(decks.length, 'набор', 'набора', 'наборов') + ' · ' + cs.length + ' карт.</small><b>' + esc(s.name) + '</b></span><span class="n">' + dueCount(cs) + '</span></button>';
      if (open) {
        html += '<div class="subj-body">';
        decks.forEach(d => {
          const dc = deckCards(d.id), du = dueCount(dc), nx = nextDueTime(dc), nn = newCount(dc);
          const lbl = du ? du : nn ? 'новых ' + nn : nx < Infinity ? 'через ' + fmtDur((nx - Date.now()) / MIN) : dc.length ? 'выучен' : 'пусто';
          html += '<button class="setrow press" data-deck="' + d.id + '"><span class="cube"><i style="height:' + learnedPct(dc) + '%"></i></span><b>' + esc(d.name) + '</b><span class="due' + (du ? '' : ' calm') + '">' + lbl + '</span></button>';
        });
        html += '<div class="subj-tools"><button data-newset="' + s.id + '">+ набор</button><button data-rensubj="' + s.id + '">переименовать</button><button data-delsubj="' + s.id + '">удалить</button></div></div>';
      }
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-subj]').forEach(b => b.onclick = () => { const id = b.dataset.subj, i = D.subjects.findIndex(s => s.id === id); this.open[id] = !(this.open[id] ?? (i === 0)); const y = el.firstChild.scrollTop; rerender(); $('#screen .screen').scrollTop = y; });
    el.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => go('browse', { deck: b.dataset.deck }));
    el.querySelector('[data-import]').onclick = () => importSetSheet();
    el.querySelector('[data-newsubj]').onclick = () => addAction('subj');
    const fb = el.querySelector('[data-focus]'); if (fb) fb.onclick = focusSheet;
    el.querySelectorAll('[data-newset]').forEach(b => b.onclick = () => newSetSheet(b.dataset.newset));
    el.querySelectorAll('[data-rensubj]').forEach(b => b.onclick = () => { const s = getSubject(b.dataset.rensubj); askText('Название предмета', s.name, 'Сохранить', v => { s.name = v; save(); rerender(); }); });
    el.querySelectorAll('[data-delsubj]').forEach(b => b.onclick = () => {
      const s = getSubject(b.dataset.delsubj), ds = D.decks.filter(d => d.subject === s.id).map(d => d.id), n = D.cards.filter(c => ds.includes(c.deck)).length;
      confirmSheet('Удалить «' + s.name + '»?', 'Вместе с ним удалятся ' + ds.length + ' ' + plural(ds.length, 'набор', 'набора', 'наборов') + ' и ' + n + ' ' + plural(n, 'карточка', 'карточки', 'карточек') + '. Это нельзя отменить.', 'Удалить', () => {
        D.cards = D.cards.filter(c => !ds.includes(c.deck)); D.decks = D.decks.filter(d => d.subject !== s.id); D.subjects = D.subjects.filter(x => x !== s); save(); rerender(); toast('Предмет удалён');
      }, true);
    });
  }
};

SCREENS.pets = {
  render(el) {
    const id = D.pet.active, P = PETS[id] || PETS.dog, o = D.pet.owned[id] || { fed: 0 }, stg = petStage(id, o.fed || 0);
    const owned = PET_ORDER.filter(k => D.pet.owned[k]);
    const slots = Math.max(8, owned.length + 3);
    let coll = '';
    owned.forEach(k => { const R = RARITY[PETS[k].r]; coll += '<button class="slot own' + (k === id ? ' act' : '') + ' press" data-pet="' + k + '" aria-label="' + esc(PETS[k].name) + '">' + petSvg(k, 60, 66) + '<span class="rdot" style="background:' + R.c + '"></span></button>'; });
    for (let i = owned.length; i < slots; i++) coll += '<div class="slot lock">?</div>';
    el.innerHTML = '<div class="screen"><div style="display:flex;justify-content:space-between;align-items:flex-end;padding:0 6px">' +
      '<div style="display:flex;flex-direction:column"><span class="lbl">Питомцы</span><span class="h1">' + esc(petName()) + '</span><span class="lbl">' + esc(P.name.toLowerCase()) + ' · ' + stg.n + '</span></div>' +
      '<button class="lbl" data-rename style="text-decoration:underline">имя</button></div>' +
      '<div class="pets-hero"><div class="sun-circle"><div class="pet" style="width:' + P.w + '%">' + petSvg(id, P.big[0], P.big[1]) + '</div></div></div>' +
      slider(stg.pct, '<span style="font-family:var(--font);font-weight:900;font-size:13px">' + stg.n + '</span>', stg.next ? stg.next + ' · ещё ' + stg.left : 'вырос!', true) +
      '<button class="btn-big press" data-draw style="margin-top:14px;display:flex;align-items:center;gap:10px;padding:0 8px 0 20px;text-align:left;font-size:15px"><span style="flex:1">Открыть коробку</span><span class="tok" style="padding:8px 12px;font-size:14px"><i></i>' + D.tokens + ' ' + plural(D.tokens, 'жетон', 'жетона', 'жетонов') + '</span></button>' +
      '<div class="lbl" style="padding:14px 6px 0">Коллекция · жетон за дневную норму (' + normGoal() + ' «помню»), следующие за день — дороже</div><div class="coll">' + coll + '</div></div>';
    el.querySelector('[data-draw]').onclick = () => go('draw');
    el.querySelector('[data-rename]').onclick = () => askText('Как зовут питомца?', petName(), 'Сохранить', v => { (D.pet.owned[id] = D.pet.owned[id] || { fed: 0 }).name = v; save(); rerender(); });
    el.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => { D.pet.active = b.dataset.pet; save(); rerender(); toast('Теперь с тобой: ' + petName()); });
  }
};

SCREENS.settings = {
  render(el) {
    const s = D.settings;
    const seg = (key, opts) => '<div class="seg">' + opts.map(([v, l]) => '<button data-set="' + key + '" data-v="' + v + '" class="' + (String(s[key]) === String(v) ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
    const step = (key, min, max, label, sub) => '<div class="line"><b>' + label + (sub ? '<br><span>' + sub + '</span>' : '') + '</b><div class="stepper"><button data-step="' + key + '" data-d="-1" data-min="' + min + '" data-max="' + max + '" aria-label="меньше">−</button><output>' + s[key] + '</output><button data-step="' + key + '" data-d="1" data-min="' + min + '" data-max="' + max + '" aria-label="больше">+</button></div></div>';
    el.innerHTML = '<div class="screen"><div style="padding:0 6px"><span class="lbl">Настройки</span><h1 class="h1">Как тебе удобно</h1></div>' +
      '<div class="set-sec"><span class="cap">Тема</span>' + seg('theme', [['light', 'Светлая'], ['dark', 'Тёмная'], ['auto', 'Как в системе']]) + '</div>' +
      '<div class="set-sec"><span class="cap">Палитра</span><div class="pals">' + Object.entries(PAL_THEMES).map(([k, p]) => { const q = p[isDark() ? 'dark' : 'light']; return '<button data-pal="' + k + '" class="' + (s.pal === k ? 'on' : '') + '"><span><i style="background:' + q.sun + '"></i><i style="background:' + q.bands[1][0] + '"></i></span>' + p.name + '</button>'; }).join('') + '</div></div>' +
      '<div class="set-sec"><span class="cap">Интервалы для новых наборов</span>' + seg('speed', [['short', 'Короткие'], ['mid', 'Средние'], ['long', 'Длинные']]) + '<div class="ivprev">' + PRESETS[s.speed].iv.map(fmtDur).join(' → ') + ' → выучено. У каждого набора скорость можно поменять в его меню «⋯».</div></div>' +
      '<div class="lines">' + step('perSession', 1, 30, 'Новых за сессию') + step('need', 1, 5, 'Вспомнить подряд', 'чтобы новая стала заученной') +
      '<button class="line" data-notify><b>Напоминания<br><span>когда пора повторять и вечером, если норма не сделана</span></b><span class="toggle' + (s.notify ? ' on' : '') + '"></span></button>' +
      (s.notify ? (() => { const ne = +s.notifyEvery || 0, opts = [[0, 'сразу'], [5, '5 мин'], [15, '15 мин'], [60, '1 ч']], own = !opts.some(o => o[0] === ne);
        return '<div class="line" style="flex-direction:column;align-items:stretch;gap:8px"><b>Как часто напоминать<br><span>' + (ne ? 'каждые ' + fmtDur(ne) + ', пока есть что повторить (ночью с 23 до 8 — тихо)' : 'один раз, когда карточки станут «пора повторить»') + '</span></b><div class="seg" style="margin:0">' +
          opts.map(([v, l]) => '<button data-nev="' + v + '" class="' + (ne === v ? 'on' : '') + '">' + l + '</button>').join('') + '<button data-nev="own" class="' + (own ? 'on' : '') + '">' + (own ? fmtDur(ne) : 'своё') + '</button></div></div>'; })() + step('notifyHour', 6, 23, 'Вечернее напоминание', 'час') : '') +
      '<button class="line" data-server><b>Сервер и синхронизация</b><span>' + (Sync.on ? esc(SYNC.server.replace(/^https?:\/\//, '')) + (Sync.status === 'offline' ? ' · нет связи' : ' · вкл') : 'не подключён') + '</span></button>' +
      '<button class="line" data-export><b>Сохранить копию</b><span>файл .json</span></button>' +
      '<button class="line" data-import><b>Загрузить из файла</b><span>карточки сайта тоже</span></button>' +
      '<button class="line" data-update><b>Обновления</b><span>версия ' + APP_VERSION + ' · проверить</span></button>' +
      '<div class="line" style="flex-direction:column;align-items:stretch;gap:8px"><b>Проверять обновления</b><div class="seg" style="margin:0">' + [[5, '5 мин'], [15, '15 мин'], [60, '1 ч'], [0, 'при запуске']].map(([v, l]) => '<button data-every="' + v + '" class="' + (+s.updEvery === v ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div>' +
      '<button class="line" data-tg="updStable"><b>Уведомлять о новых версиях</b><span class="toggle' + (s.updStable ? ' on' : '') + '"></span></button>' +
      '<button class="line" data-tg="updBeta"><b>Бета-версии<br><span>тестовые сборки для проверки; пока выключено — бету нельзя установить</span></b><span class="toggle' + (s.updBeta ? ' on' : '') + '"></span></button>' +
      (window.Native && Native.isNative ? '' : '<button class="line" data-apk><b>Приложение для Android</b><span>скачать APK</span></button>') +
      '</div><input type="file" id="impFile" hidden></div>';
    el.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { s[b.dataset.set] = b.dataset.v; save(); applyTheme(); rerender(); });
    el.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => { s.pal = b.dataset.pal; save(); applyTheme(); rerender(); });
    el.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const k = b.dataset.step; s[k] = Math.max(+b.dataset.min, Math.min(+b.dataset.max, (+s[k] || 0) + +b.dataset.d)); save(); rerender(); });
    el.querySelector('[data-notify]').onclick = async () => { s.notify = !s.notify; save(); if (s.notify && window.Native) await Native.askNotify(); rerender(); };
    el.querySelectorAll('[data-nev]').forEach(b => b.onclick = () => {
      if (b.dataset.nev !== 'own') { s.notifyEvery = +b.dataset.nev; save(); rerender(); return; }
      openSheet('<h2>Напоминать каждые…</h2><div class="field">Минут (от 1 до 1440)<input type="number" id="neM" min="1" max="1440" inputmode="numeric"></div><div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>Сохранить</button></div>', (sh, close) => {
        const i = sh.querySelector('#neM'); i.value = +s.notifyEvery || 30; setTimeout(() => i.focus(), 50);
        sh.querySelector('[data-x]').onclick = close;
        sh.querySelector('[data-ok]').onclick = () => { const v = Math.round(+i.value); if (!(v >= 1 && v <= 1440)) { toast('От 1 до 1440 минут'); return; } s.notifyEvery = v; save(); close(); rerender(); };
      });
    });
    el.querySelector('[data-export]').onclick = () => exportData();
    el.querySelector('[data-server]').onclick = () => serverSheet();
    const fi = el.querySelector('#impFile');
    el.querySelector('[data-import]').onclick = () => fi.click();
    fi.onchange = async () => { const f = fi.files[0]; fi.value = ''; if (f) importAnyText(await f.text().catch(() => '')); };
    el.querySelector('[data-update]').onclick = () => checkUpdate(true);
    el.querySelectorAll('[data-every]').forEach(b => b.onclick = () => { s.updEvery = +b.dataset.every; save(); rerender(); });
    el.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { const k = b.dataset.tg; s[k] = !s[k]; save(); if (k === 'updBeta' && !s.updBeta && Upd.info && /-beta/i.test(Upd.info.version)) { Upd.info = null; Upd.state = 'idle'; } rerender(); if (s[k]) checkUpdate(false); });
    const apk = el.querySelector('[data-apk]'); if (apk) apk.onclick = () => window.open(DOWNLOAD_PAGE, '_blank');
  }
};

async function exportData() {
  const json = JSON.stringify({ ...D, app: 'kartochki-pet' }, null, 1), name = 'kartochki-' + dayKey() + '.json';
  if (window.Native && Native.isNative) { if (await Native.shareFile(name, json)) return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('Файл сохранён');
}
