// ===== Экран повторения: колода с размытием, open/close, питомец рядом =====
SCREENS.review = {
  render(el) {
    if (!S) { setTimeout(() => go('home', null, { replace: true })); return; }
    const pet = D.pet.active, P = PETS[pet] || PETS.dog;
    el.innerHTML = '<div class="rev"><div class="glow"></div>' +
      '<div class="rev-top"><button class="ibtn" data-close aria-label="Закрыть">' + ic('close', 2.6) + '</button><div id="rvProg"></div></div>' +
      '<div class="deck" id="deck"></div>' +
      '<div class="petline"><div class="mini"><div class="pet">' + petSvg(pet, 58, 66) + '</div></div><div class="say" id="say"></div><button class="undo" data-undo hidden>' + '<span style="width:16px;height:16px;display:flex">' + ic('undo', 2.4) + '</span>отменить</button></div>' +
      '<div class="answers" id="answers"><button class="no press" data-a="0"></button><button class="yes press" data-a="1"></button></div></div>';
    const deck = el.querySelector('#deck'), ansEl = el.querySelector('#answers'), sayEl = el.querySelector('#say'), undoBtn = el.querySelector('[data-undo]');
    let busy = false, flipped = false;
    const say = t => { sayEl.textContent = t; };
    const geom = () => { const H = deck.clientHeight, qh = Math.min(260, Math.max(180, H * 0.5)); deck.style.setProperty('--qh', qh + 'px'); deck.style.setProperty('--ah', Math.max(120, H - qh - 12) + 'px'); deck.style.setProperty('--qtop', Math.max(0, (H - qh) / 2) + 'px'); };
    const cardEl = (c, cls, label) => {
      const d = document.createElement('div'); d.className = 'dcard ' + (cls || '');
      d.innerHTML = '<div class="ab"><span class="lbl">ответ</span><div class="a fade"><div class="in"></div></div></div><div class="qb"><div class="meta"><span></span><span></span></div><div class="q fade"><div class="in"></div></div><button class="tab-open">open' + ic('down', 2.6) + '</button></div>';
      if (label) { d.querySelector('.meta span').textContent = label[0]; d.querySelectorAll('.meta span')[1].textContent = label[1]; }
      renderInto(d.querySelector('.q .in'), c.front); scrollFade(d.querySelector('.q')); return d;
    };
    const fillAnswer = (d, c) => { const a = d.querySelector('.a'); if (!a._done) { renderInto(a.querySelector('.in'), c.back || '(ответ пустой)'); a._done = 1; a.scrollTop = 0; scrollFade(a); setTimeout(() => scrollFade(a), 600); } };
    function progress() {
      // справа — сколько карточек осталось в этой сессии
      const p = sessProgress();
      el.querySelector('#rvProg').outerHTML = '<div id="rvProg" style="flex:1">' + slider(p.pct, BOLT + (S ? S.stats.fed : 0), p.left ? 'осталось ' + p.left : 'готово', true) + '</div>';
      undoBtn.hidden = !(S && S.prev);
    }
    function buttons(cur) {
      const [b0, b1] = ansEl.children;
      if (!cur) { ansEl.hidden = true; return; } ansEl.hidden = false;
      const h = sessHints(cur), pick = cur.kind === 'pick';
      b0.innerHTML = (pick ? 'Уже знаю' : 'Не помню') + '<small>' + h[0] + '</small>';
      b1.innerHTML = (pick ? 'Учить' : 'Помню') + '<small>' + h[1] + '</small>';
      ansEl.classList.toggle('off', !pick && !flipped);
    }
    function draw() {
      deck.innerHTML = ''; flipped = false; deck.classList.remove('flipped'); geom();
      const cur = sessCurrent();
      progress();
      if (!cur) { finish(); return; }
      const up = sessUpcoming(2);
      if (up[1]) deck.appendChild(cardEl(up[1].c, 'back2'));
      if (up[0]) deck.appendChild(cardEl(up[0].c, 'back1'));
      const f = cardEl(cur.c, '', sessLabel(cur)); f.dataset.front = 1; deck.appendChild(f);
      f.querySelector('.tab-open').onclick = e => { e.stopPropagation(); flip(); };
      f.querySelector('.qb').onclick = () => { if (!flipped) flip(); };
      swipe(f);
      buttons(cur);
      say(cur.kind === 'pick' ? 'Новая! Знаешь её?' : 'Подумай чуть-чуть…');
    }
    function flip() {
      const f = deck.querySelector('[data-front]'); if (!f || busy) return;
      flipped = !flipped; const cur = sessCurrent(); if (flipped) fillAnswer(f, cur.c);
      f.classList.toggle('flip', flipped); deck.classList.toggle('flipped', flipped);
      f.querySelector('.tab-open').firstChild.textContent = flipped ? 'close' : 'open';
      buttons(cur);
      if (cur.kind !== 'pick') say(flipped ? 'Помнишь? Тогда корм мне!' : 'Подумай чуть-чуть…');
    }
    function answer(ok) {
      if (busy) return; const cur = sessCurrent(); if (!cur) return;
      if (cur.kind !== 'pick' && !flipped) { flip(); return; }
      busy = true;
      const f = deck.querySelector('[data-front]'), b1 = deck.querySelector('.back1'), b2 = deck.querySelector('.back2');
      const res = sessAnswer(ok) || {};
      f.style.transform = ''; f.classList.add(ok ? 'gone-r' : 'gone-l');
      if (b1) { b1.classList.remove('back1'); deck.classList.remove('flipped'); }
      if (b2) { b2.classList.remove('back2'); b2.classList.add('back1'); }
      const nx = sessUpcoming(2)[1];
      if (nx) { const n = cardEl(nx.c, 'back2'); n.style.opacity = 0; deck.insertBefore(n, deck.firstChild); requestAnimationFrame(() => requestAnimationFrame(() => n.style.opacity = '')); }
      say(cur.kind === 'pick' ? (ok ? 'Запомним вместе!' : 'Ого, ты уже знаешь!') : !ok ? 'Ничего, покажу ещё раз' : res.fed ? (cur.kind === 'learn' ? 'Заучена! Ням, +1 корм' : 'Ням! +1 корм') : 'Ещё разок — и запомнишь, тогда покормишь');
      ansEl.classList.add('off'); progress();
      setTimeout(() => { busy = false; draw(); }, 560);
    }
    function finish() {
      ansEl.hidden = true; say('Я сыт! Спасибо!');
      const st = S.stats, ids = S.deckIds && new Set(S.deckIds), more = D.cards.some(c => c.state === 'new' && (!ids || ids.has(c.deck)));
      const box = document.createElement('div'); box.className = 'donebox';
      box.innerHTML = '<span class="num">+' + st.fed + '</span><b style="font-size:22px;font-weight:900">' + (st.fed ? 'Вкусно! Сессия окончена' : 'Сессия окончена') + '</b>' +
        '<span class="lbl">' + esc(petName()) + ' сыт на ' + Math.round(food()) + '% · до жетона ' + normInfo().have + ' / ' + normInfo().need + '</span>' +
        '<div class="stats"><div><b>' + st.ok + '</b><span>вспомнил</span></div><div><b>' + st.fail + '</b><span>не вспомнил</span></div><div><b>' + st.learned + '</b><span>новых заучено</span></div><div><b>' + (st.mastered + st.known) + '</b><span>выучено / уже знал</span></div></div>' +
        '<div style="display:flex;gap:8px;width:100%"><button class="btn-ghost" style="flex:1;background:var(--bg)" data-home>На главную</button>' + (more ? '<button class="btn-ghost" style="flex:1;background:var(--ink);color:var(--bg)" data-more>Учить ещё</button>' : '') + '</div>';
      deck.appendChild(box);
      box.querySelector('[data-home]').onclick = () => { S = null; go('home'); };
      const m = box.querySelector('[data-more]'); if (m) m.onclick = () => { startReview('learn', S.deckIds); };
    }
    function swipe(f) {
      // свайп вправо — «помню», влево — «не помню». На телефоне — touch-события (не обрываются прокруткой ответа),
      // мышью — pointer-события. Тянуть можно за любое место карточки, и за вопрос, и за ответ.
      let x0 = null, y0 = 0, dx = 0, drag = false, moved = false;
      const start = (x, y, t) => { if (busy || (t.closest && t.closest('.tab-open'))) return; x0 = x; y0 = y; dx = 0; drag = false; moved = false; };
      const move = (x, y) => {
        if (x0 == null) return false; dx = x - x0; const dy = y - y0;
        if (!drag) { if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { x0 = null; return false; } if (Math.abs(dx) < 10) return false; drag = true; moved = true; }
        f.style.transition = 'none'; f.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 25 + 'deg)';
        const cur = sessCurrent(), canAns = cur && (cur.kind === 'pick' || flipped);
        f.classList.toggle('sw-yes', canAns && dx > 60); f.classList.toggle('sw-no', canAns && dx < -60);
        return true;
      };
      const end = () => {
        if (x0 == null && !drag) return; const d = dx; x0 = null; f.style.transition = ''; f.classList.remove('sw-yes', 'sw-no');
        if (!drag) return; drag = false;
        const cur = sessCurrent();
        if (Math.abs(d) > 80 && cur) { if (cur.kind !== 'pick' && !flipped) { f.style.transform = ''; flip(); } else answer(d > 0); }
        else f.style.transform = '';
      };
      f.addEventListener('touchstart', e => { const t = e.touches[0]; if (e.touches.length === 1) start(t.clientX, t.clientY, e.target); }, { passive: true });
      f.addEventListener('touchmove', e => { const t = e.touches[0]; if (move(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
      f.addEventListener('touchend', end); f.addEventListener('touchcancel', end);
      f.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; start(e.clientX, e.clientY, e.target); });
      f.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; if (move(e.clientX, e.clientY)) { try { f.setPointerCapture(e.pointerId); } catch (er) { } } });
      f.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') end(); });
      f.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    }
    ansEl.querySelectorAll('[data-a]').forEach(b => b.onclick = () => answer(b.dataset.a === '1'));
    el.querySelector('[data-close]').onclick = () => { S = null; go('home'); };
    undoBtn.onclick = () => { if (undoSession()) { draw(); toast('Отменено'); } };
    const key = e => {
      if (sheets.length) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); const cur = sessCurrent(); if (cur && !flipped) flip(); }
      else if (e.key === 'ArrowRight') answer(true); else if (e.key === 'ArrowLeft') answer(false);
      else if (e.key === 'Escape') { S = null; go('home'); }
    };
    document.addEventListener('keydown', key);
    const ro = new ResizeObserver(geom); ro.observe(deck);
    requestAnimationFrame(draw);
    return () => { document.removeEventListener('keydown', key); ro.disconnect(); };
  },
  onBack() { S = null; return false; }
};
