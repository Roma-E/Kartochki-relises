// ===== Новая / редактирование карточки =====
function openEditor(card, deckId) { go('edit', { id: card ? card.id : null, deck: deckId || (card ? card.deck : null) }); }
let palTab = 0;
SCREENS.edit = {
  render(el, args) {
    if (!D.decks.length) { setTimeout(() => { back(); newSetSheet(null, d => openEditor(null, d.id)); }); return; }
    const card = args.id ? D.cards.find(c => c.id === args.id) : null;
    let deckId = args.deck && getDeck(args.deck) ? args.deck : (card ? card.deck : (SCREENS.edit.lastDeck && getDeck(SCREENS.edit.lastDeck) ? SCREENS.edit.lastDeck : D.decks[0].id));
    const decks = [...D.decks].sort((a, b) => (a.id === deckId ? -1 : b.id === deckId ? 1 : 0));
    el.innerHTML = '<div class="ed">' +
      '<div class="row"><button class="ibtn" data-x aria-label="Закрыть">' + ic('close', 2.6) + '</button><b style="font-size:24px;font-weight:900;flex:1">' + (card ? 'Карточка' : 'Новая карточка') + '</b>' + (card ? '<button class="ibtn" data-menu aria-label="Ещё">' + ic('more', 2.6) + '</button>' : '') + '</div>' +
      '<div class="setchips" id="edSets">' + decks.map(d => { const s = getSubject(d.subject); return '<button class="chip' + (d.id === deckId ? ' on' : '') + '" data-deck="' + d.id + '">' + esc(d.name) + (D.subjects.length > 1 && s ? ' <span style="opacity:.55">· ' + esc(s.name) + '</span>' : '') + '</button>'; }).join('') + '<button class="chip" data-newdeck>+ набор</button></div>' +
      '<div class="ed-scroll">' +
      '<div class="qbox"><div class="hd"><span>вопрос · выдели текст, чтобы оформить</span></div><textarea id="edF" rows="2" data-sel="1" placeholder="Например: Первый замечательный предел"></textarea><div class="pv" id="pvF"></div></div>' +
      '<div id="simw"></div>' +
      '<div class="abox"><div class="hd"><span>ответ</span><span>формулы — между $ … $</span></div><div class="pv" id="pvB"></div><textarea id="edB" rows="3" data-sel="1" spellcheck="false" placeholder="$$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$$"></textarea></div>' +
      '<div class="ed-help">Кнопки снизу вставляют символ туда, где стоит курсор (знаки $ добавятся сами). Выдели кусок текста — появится панель как в Телеграме: жирный, курсив, подчёркнутый, маркер, формула, дробь, степень.</div>' +
      (card ? '<div class="ed-help">' + esc(cardStatus(card)) + '</div>' : '') +
      '</div>' +
      '<div class="kbd" id="kbd"><div class="tabs" id="kTabs"></div><div class="grid" id="kGrid"></div><div class="acts">' + (card ? '' : '<button class="more press" data-more>Сохранить и ещё</button>') + '<button class="save press" data-save>' + (card ? 'Сохранить' : 'Сохранить карточку') + '</button></div></div>' +
      '</div>';
    const tf = el.querySelector('#edF'), tb = el.querySelector('#edB'), pf = el.querySelector('#pvF'), pb = el.querySelector('#pvB'), simw = el.querySelector('#simw');
    let lastTa = tb;
    tf.value = card ? card.front : ''; tb.value = card ? card.back : '';
    const auto = t => { t.style.height = 'auto'; t.style.height = Math.min(220, t.scrollHeight + 2) + 'px'; };
    const upd = () => {
      const f = tf.value; pf.innerHTML = '';
      if (/[$*_~=`]/.test(f)) renderInto(pf, f);
      renderInto(pb, tb.value);
      const sim = f.trim().length > 4 ? findSimilar(f, card && card.id) : null;
      if (sim) { const sd = getDeck(sim.deck); simw.innerHTML = '<div class="simw"><i>!</i><span>Похожая уже есть: <b>«' + esc(plainText(sim.front).trim().slice(0, 60)) + '»</b>' + (sd ? ' · ' + esc(sd.name) : '') + '</span><button data-open>открыть</button></div>'; simw.querySelector('[data-open]').onclick = () => openEditor(sim); }
      else simw.innerHTML = '';
      el.querySelector('[data-save]').textContent = sim && !card ? 'Всё равно сохранить' : (card ? 'Сохранить' : 'Сохранить карточку');
    };
    let tm; [tf, tb].forEach(t => { t.addEventListener('input', () => { auto(t); clearTimeout(tm); tm = setTimeout(upd, 160); }); t.addEventListener('focus', () => lastTa = t); hookSel(t); t.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(false); } }); });
    upd(); requestAnimationFrame(() => { auto(tf); auto(tb); if (!card) tf.focus(); });
    const tabs = el.querySelector('#kTabs'), grid = el.querySelector('#kGrid');
    const drawPal = () => {
      tabs.innerHTML = PAL.map((g, i) => '<button class="' + (i === palTab ? 'on' : '') + '" data-t="' + i + '">' + g[0] + '</button>').join('');
      grid.innerHTML = PAL[palTab][1].map((it, i) => '<button data-i="' + i + '" class="' + (it[0].length > 3 ? 'sm' : '') + '" title="' + esc(it[2] || it[1].replace(/§/g, '□')) + '">' + esc(it[0]) + '</button>').join('');
      tabs.querySelectorAll('button').forEach(b => { b.onpointerdown = e => e.preventDefault(); b.onclick = () => { palTab = +b.dataset.t; drawPal(); }; });
      grid.querySelectorAll('button').forEach(b => { b.onpointerdown = e => e.preventDefault(); b.onclick = () => insertTpl(lastTa, PAL[palTab][1][+b.dataset.i][1], true); });
    };
    drawPal();
    el.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => { deckId = b.dataset.deck; SCREENS.edit.lastDeck = deckId; el.querySelectorAll('[data-deck]').forEach(x => x.classList.toggle('on', x === b)); });
    el.querySelector('[data-newdeck]').onclick = () => newSetSheet(null, d => { args.deck = d.id; args._f = tf.value; args._b = tb.value; rerender(); });
    if (args._f != null) { tf.value = args._f; tb.value = args._b; args._f = null; upd(); }
    const dirty = () => (tf.value.trim() !== (card ? card.front : '').trim()) || (tb.value.trim() !== (card ? card.back : '').trim());
    const leave = () => { if (dirty()) confirmSheet('Выйти без сохранения?', 'Изменения пропадут.', 'Выйти', () => { SCREENS.edit.force = true; back(); }); else { SCREENS.edit.force = true; back(); } };
    el.querySelector('[data-x]').onclick = leave;
    SCREENS.edit.leave = leave;
    function doSave(more) {
      const f = tf.value.trim(), b = tb.value.trim();
      if (!f) { toast('Напиши вопрос'); tf.focus(); return; }
      if (card) { card.front = f; card.back = b; card.deck = deckId; }
      else D.cards.push({ id: uid('c'), deck: deckId, front: f, back: b, state: 'new', level: 0, due: 0, lapses: 0, created: Date.now() });
      SCREENS.edit.lastDeck = deckId; save();
      if (more) { tf.value = ''; tb.value = ''; auto(tf); auto(tb); upd(); tf.focus(); toast('Сохранено. Пиши следующую'); }
      else { toast(card ? 'Изменения сохранены' : 'Карточка добавлена'); SCREENS.edit.force = true; back(); }
    }
    el.querySelector('[data-save]').onclick = () => doSave(false);
    const m = el.querySelector('[data-more]'); if (m) m.onclick = () => doSave(true);
    const mn = el.querySelector('[data-menu]');
    if (mn) mn.onclick = () => openSheet('<h2>Карточка</h2><div class="menu"><button data-r>Сбросить прогресс</button><button data-d class="danger">Удалить карточку</button></div>', (s, close) => {
      s.querySelector('[data-r]').onclick = () => { close(); Object.assign(card, { state: 'new', level: 0, due: 0, lapses: 0 }); save(); toast('Карточка снова новая'); rerender(); };
      s.querySelector('[data-d]').onclick = () => { close(); confirmSheet('Удалить карточку?', 'Это нельзя отменить.', 'Удалить', () => { D.cards = D.cards.filter(c => c !== card); save(); SCREENS.edit.force = true; back(); toast('Карточка удалена'); }, true); };
    });
    return () => hideSel();
  },
  onBack() { if (SCREENS.edit.force) { SCREENS.edit.force = false; return false; } if (SCREENS.edit.leave) { SCREENS.edit.leave(); return true; } return false; }
};
function cardStatus(c) {
  const iv = ivOf(c);
  const s = { new: 'Новая', learning: 'Заучивается', review: 'Повторение · ступень ' + Math.min(c.level, iv.length) + ' из ' + iv.length, mastered: 'Выучена полностью', known: 'Уже знал' }[c.state] || '';
  return s + (c.state === 'review' ? ' · следующий повтор ' + (c.due <= Date.now() ? 'сейчас' : 'через ' + fmtDur((c.due - Date.now()) / MIN)) : '') + (c.lapses ? ' · забывал ' + c.lapses + ' раз' : '');
}
