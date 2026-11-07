// ===== Просмотр набора: лента карточек с поиском =====
SCREENS.browse = {
  focus: {}, filter: {},
  render(el, args) {
    const d = getDeck(args.deck); if (!d) { setTimeout(() => go('cards', null, { replace: true })); return; }
    const sj = getSubject(d.subject);
    let q = args.q || '', focus = this.focus[d.id] || 0, open = false, items = [], list = [], flt = this.filter[d.id] || 'all';
    el.innerHTML = '<div class="screen full" style="display:flex;flex-direction:column;overflow:hidden">' +
      '<div class="browse-top"><button class="ibtn" data-back aria-label="Назад">' + ic('back', 2.6) + '</button><div class="t"><b>' + esc(d.name) + '</b><span class="lbl" id="bInfo"></span></div><button class="ibtn" data-menu aria-label="Меню набора">' + ic('more', 2.6) + '</button></div>' +
      '<label class="search">' + ic('search', 2.4) + '<input type="search" id="bq" placeholder="Поиск по карточкам" autocomplete="off"></label>' +
      '<div class="bfilter" id="bFlt"></div>' +
      '<div class="strip" id="strip"></div>' +
      '<button class="fab-add press" data-add><i>+</i>Добавить карточку</button></div>';
    const strip = el.querySelector('#strip'), info = el.querySelector('#bInfo'), qi = el.querySelector('#bq');
    qi.value = q;
    // фильтр: новые / учу (заучиваю + на повторении) / знаю (выучена + уже знал) / все
    const FLT = [['new', 'новые', c => c.state === 'new'], ['learn', 'учу', c => c.state === 'learning' || c.state === 'review'], ['done', 'знаю', isDone], ['all', 'все', () => true]];
    const fltEl = el.querySelector('#bFlt');
    const paintFlt = () => { const all = deckCards(d.id); fltEl.innerHTML = FLT.map(f => '<button class="chip' + (f[0] === flt ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<span>' + all.filter(f[2]).length + '</span></button>').join(''); fltEl.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { flt = b.dataset.f; SCREENS.browse.filter[d.id] = flt; focus = 0; open = false; paintFlt(); build(); }); };
    const ql = () => q.toLowerCase();
    const inBack = c => !!q && plainText(c.back).toLowerCase().includes(ql());
    const cardsOf = () => { const f = (FLT.find(x => x[0] === flt) || FLT[3])[2]; return deckCards(d.id).sort((a, b) => a.created - b.created).filter(f).filter(c => !q || (plainText(c.front + ' ' + c.back).toLowerCase().includes(ql()) || (c.front + ' ' + c.back).toLowerCase().includes(ql()))); };
    const status = c => {
      const iv = ivOf(c);
      if (c.state === 'new') return esc('новая');
      if (c.state === 'learning') return esc('заучиваю ' + Math.min(c.lok || 0, D.settings.need) + '/' + D.settings.need);
      if (c.state === 'review') return esc((isDue(c) ? 'пора повторить' : 'через ' + fmtDur((c.due - Date.now()) / MIN)) + ' · ступень ' + Math.min(c.level, iv.length) + '/' + iv.length);
      return '<span class="okmark"><i>' + ic('check', 3.4) + '</i>' + (c.state === 'known' ? 'уже знал' : 'выучена') + '</span>';
    };
    const openAns = (it, c) => { const a = it.querySelector('.ans'); if (!a._done) { renderInto(a, c.back || '(ответ пустой)'); a._done = 1; } scrollFade(a); };
    // поиск нашёл текст в ответе — карточка раскрывается сама
    const autoOpen = () => { const c = list[focus]; open = !!(c && !c.notice && inBack(c)); if (open) openAns(items[focus], c); };
    // ничего не нашлось → первая «карточка» говорит об этом, ниже (свайп вниз) — похожие по смыслу опечатки
    const NOTICE = { notice: true, id: '_none', front: '', back: '' };
    function build() {
      list = cardsOf(); let similar = 0;
      if (!list.length && q) { const f = (FLT.find(x => x[0] === flt) || FLT[3])[2]; const sim = fuzzyCards(q, deckCards(d.id).filter(f)); similar = sim.length; list = [NOTICE, ...sim]; }
      strip.innerHTML = ''; items = [];
      focus = Math.max(0, Math.min(focus, list.length - 1));
      info.textContent = (sj ? sj.name + ' · ' : '') + (list[0] === NOTICE ? 'ничего не нашлось' + (similar ? ' · похожих ' + similar : '') : list.length + ' ' + plural(list.length, 'карточка', 'карточки', 'карточек') + (q ? ' найдено' : ''));
      if (!list.length) { strip.innerHTML = '<div class="empty">' + (q ? 'Ничего не нашлось' : flt !== 'all' && deckCards(d.id).length ? 'Таких карточек здесь нет' : 'В наборе пока нет карточек.<br>Нажми «Добавить карточку».') + '</div>'; return; }
      list.forEach((c, i) => {
        const [bg, fg] = T.bands[i % 3];
        if (c === NOTICE) {
          const it = document.createElement('div'); it.className = 'sitem notice'; it.style.background = 'var(--card)'; it.style.color = 'var(--ink)';
          it.innerHTML = '<div class="pillt"><div></div></div><b></b><span></span>';
          it.querySelector('.pillt div').textContent = 'ничего не нашлось';
          it.querySelector('b').textContent = 'По запросу «' + q + '» ничего нет';
          it.querySelector('span').textContent = similar ? 'Ниже похожее ↓ — свайпни вниз' : 'И ничего похожего. Проверь, как написано';
          it.onclick = () => { if (items.indexOf(it) !== focus) { focus = items.indexOf(it); open = false; layout(); } };
          strip.appendChild(it); items.push(it); return;
        }
        const it = document.createElement('div'); it.className = 'sitem'; it.style.background = bg; it.style.color = fg;
        it.innerHTML = '<div class="pillt"><div></div></div><div class="bigc"><div class="meta"><span>' + (list[0] === NOTICE ? 'похожее · ' : '') + status(c) + '</span><span>#' + (i + 1) + '</span></div><div class="q"></div><div class="ans fade"></div></div>' +
          '<button class="tab-open">open' + ic('down', 2.6) + '</button><button class="tab-edit" aria-label="Изменить">' + ic('edit') + '</button>';
        it.querySelector('.pillt div').textContent = plainText(c.front).replace(/\s+/g, ' ').trim() || '…';
        renderInto(it.querySelector('.q'), c.front);
        it.onclick = e => { if (items.indexOf(it) !== focus) { focus = items.indexOf(it); autoOpen(); layout(); } };
        it.querySelector('.tab-open').onclick = e => { e.stopPropagation(); if (items.indexOf(it) !== focus) return; open = !open; if (open) openAns(it, c); layout(); };
        it.querySelector('.tab-edit').onclick = e => { e.stopPropagation(); if (items.indexOf(it) !== focus) return; openEditor(c); };
        strip.appendChild(it); items.push(it);
      });
      autoOpen(); layout();
    }
    function layout() {
      const H = strip.clientHeight, big = Math.min(380, Math.max(240, H - 2 * (64 + 48 + 20))), mid = (H - big) / 2;
      const G = { '-2': [mid - 10 - 64 - 8 - 48, 48, 16], '-1': [mid - 10 - 64, 64, 8], '0': [mid, big, 0], '1': [mid + big + 10, 64, 8], '2': [mid + big + 10 + 64 + 8, 48, 16] };
      items.forEach((it, i) => {
        const r = i - focus, g = G[r];
        it.classList.toggle('c', r === 0); it.classList.toggle('open', r === 0 && open);
        const to = it.querySelector('.tab-open');
        if (to) { to.firstChild.textContent = r === 0 && open ? 'close' : 'open'; to.querySelector('svg').style.transform = r === 0 && open ? 'rotate(180deg)' : ''; }
        it.style.top = (g ? g[0] : r < 0 ? -80 : H + 30) + 'px'; it.style.height = (g ? g[1] : 40) + 'px';
        it.style.left = it.style.right = (g ? g[2] : 22) + '%';
        it.style.opacity = g ? (Math.abs(r) === 2 ? .75 : 1) : 0; it.style.filter = Math.abs(r) === 2 ? 'blur(1.5px)' : 'none';
        it.style.zIndex = 10 - Math.abs(r); it.style.borderRadius = r === 0 ? '30px' : '22px';
        it.style.boxShadow = r === 0 ? '0 16px 40px rgba(0,0,0,.14)' : 'none';
        if (it.classList.contains('notice') && r === 0) it.style.height = Math.min(g[1], 180) + 'px', it.style.top = (g[0] + (g[1] - Math.min(g[1], 180)) / 2) + 'px';
        it.style.pointerEvents = g ? 'auto' : 'none';
        [...it.querySelectorAll('.tab-open,.tab-edit')].forEach(b => { b.style.opacity = r === 0 ? 1 : 0; b.style.pointerEvents = r === 0 ? 'auto' : 'none'; });
      });
      SCREENS.browse.focus[d.id] = focus;
    }
    const step = k => { const nf = Math.max(0, Math.min(items.length - 1, focus + k)); if (nf !== focus) { focus = nf; autoOpen(); layout(); } };
    let wt = 0; strip.addEventListener('wheel', e => { e.preventDefault(); const n = Date.now(); if (n - wt < 300 || Math.abs(e.deltaY) < 4) return; wt = n; step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
    let y0 = null; strip.addEventListener('pointerdown', e => { y0 = e.clientY; });
    strip.addEventListener('pointerup', e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; if (Math.abs(dy) > 30) step(dy < 0 ? 1 : -1); });
    strip.addEventListener('touchmove', e => { if (!(open && e.target.closest('.ans'))) e.preventDefault(); }, { passive: false });
    let qt; qi.oninput = () => { clearTimeout(qt); qt = setTimeout(() => { q = qi.value.trim(); args.q = q; focus = 0; open = false; build(); }, 150); };
    el.querySelector('[data-back]').onclick = () => back();
    el.querySelector('[data-add]').onclick = () => openEditor(null, d.id);
    el.querySelector('[data-menu]').onclick = () => deckMenu(d);
    const ro = new ResizeObserver(() => layout()); ro.observe(strip);
    paintFlt(); requestAnimationFrame(build);
    const key = e => { if (sheets.length || document.activeElement === qi) return; if (e.key === 'ArrowDown') step(1); else if (e.key === 'ArrowUp') step(-1); };
    document.addEventListener('keydown', key);
    return () => { ro.disconnect(); document.removeEventListener('keydown', key); };
  }
};

function deckMenu(d) {
  const cs = deckCards(d.id), nn = newCount(cs), du = dueCount(cs);
  openSheet('<h2>' + esc(d.name) + '</h2><div class="menu">' +
    '<button data-m="learn">' + ic('play') + 'Учить новые' + (nn ? ' · ' + nn : '') + '</button>' +
    '<button data-m="rev">' + ic('arrow') + 'Повторить набор' + (du ? ' · ' + du : '') + '</button>' +
    '<button data-m="share">' + ic('arrow') + 'Поделиться набором</button>' +
    '<button data-m="settings">' + ic('settings') + 'Название и скорость</button>' +
    '<button data-m="reset">' + ic('undo') + 'Сбросить прогресс набора</button>' +
    '<button data-m="del" class="danger">' + ic('close') + 'Удалить набор</button></div>', (s, close) => {
    s.querySelectorAll('.menu svg').forEach(v => { v.style.width = '20px'; v.style.height = '20px'; });
    s.querySelector('[data-m=learn]').onclick = () => { close(); startReview('learn', [d.id]); };
    s.querySelector('[data-m=rev]').onclick = () => { close(); startReview('review', [d.id]); };
    s.querySelector('[data-m=settings]').onclick = () => { close(); deckSettings(d); };
    s.querySelector('[data-m=share]').onclick = () => { close(); shareSetSheet(d); };
    s.querySelector('[data-m=reset]').onclick = () => { close(); confirmSheet('Сбросить прогресс?', 'Все карточки набора снова станут новыми.', 'Сбросить', () => { cs.forEach(c => Object.assign(c, { state: 'new', level: 0, due: 0, lapses: 0 })); save(); rerender(); toast('Прогресс сброшен'); }); };
    s.querySelector('[data-m=del]').onclick = () => { close(); confirmSheet('Удалить «' + d.name + '»?', 'Удалятся и ' + cs.length + ' ' + plural(cs.length, 'карточка', 'карточки', 'карточек') + '. Это нельзя отменить.', 'Удалить', () => { D.cards = D.cards.filter(c => c.deck !== d.id); D.decks = D.decks.filter(x => x !== d); save(); go('cards'); toast('Набор удалён'); }, true); };
  });
}
function deckSettings(d) {
  openSheet('<h2>Набор</h2><div class="field">Название<input type="text" id="dsN" maxlength="60"></div><div class="field">Скорость заучивания<div class="seg" id="dsSp">' +
    Object.keys(PRESETS).map(k => '<button data-k="' + k + '">' + PRESETS[k].name + '</button>').join('') + '</div></div>' +
    '<div class="field" id="dsCustom">Свои интервалы (м, ч, д, нед, мес)<input type="text" id="dsIv"></div><div class="ivprev" id="dsPv"></div>' +
    '<div class="acts"><button data-x>Отмена</button><button class="pri" data-ok>Сохранить</button></div>', (s, close) => {
    let sp = d.speed || 'mid';
    const n = s.querySelector('#dsN'), iv = s.querySelector('#dsIv'), pv = s.querySelector('#dsPv');
    n.value = d.name; iv.value = ivStr(d.iv || ivOfDeck(d));
    const show = () => { $$('#dsSp button', s).forEach(b => b.classList.toggle('on', b.dataset.k === sp)); s.querySelector('#dsCustom').hidden = sp !== 'custom'; const a = sp === 'custom' ? parseIv(iv.value) : PRESETS[sp].iv; pv.textContent = a.length ? a.map(fmtDur).join(' → ') + ' → выучено' : 'Не понял интервалы'; };
    $$('#dsSp button', s).forEach(b => b.onclick = () => { sp = b.dataset.k; show(); }); iv.oninput = show; show();
    s.querySelector('[data-x]').onclick = close;
    s.querySelector('[data-ok]').onclick = () => {
      if (sp === 'custom') { const a = parseIv(iv.value); if (!a.length) { toast('Не понял интервалы'); return; } d.iv = a; }
      d.speed = sp; d.name = n.value.trim() || d.name; const L = ivOfDeck(d).length;
      D.cards.forEach(c => { if (c.deck === d.id && c.state === 'review' && c.level > L) c.level = L; });
      save(); close(); rerender(); toast('Сохранено');
    };
  });
}

// ---- нечёткий поиск: опечатки и неполные слова (расстояние Левенштейна по словам) ----
function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m || !n) return m || n;
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
}
function fuzzyCards(q, cards) {
  const W = s => plainText(s).toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я0-9]+/i).filter(w => w.length > 1);
  const qw = W(q); if (!qw.length) return [];
  const sim = (a, b) => { const full = 1 - lev(a, b) / Math.max(a.length, b.length); const pre = b.length > a.length ? 1 - lev(a, b.slice(0, a.length)) / a.length : 0; return Math.max(full, pre * 0.95); };
  return cards.map(c => {
    const cw = W(c.front + ' ' + c.back); if (!cw.length) return null;
    const sc = qw.reduce((s, w) => s + Math.max(...cw.map(x => sim(w, x))), 0) / qw.length;
    return sc >= 0.6 ? { c, sc } : null;
  }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 12).map(x => x.c);
}
