// ===== Открыть коробку: спиральная лента карточек редкости =====
const RIB_N = 36, RIB_STEP = 30, RIB_DY = 13, RIB_R = 250;
const RIB = Array.from({ length: RIB_N }, (_, i) => (i % 17 === 11 ? 3 : i % 9 === 4 ? 2 : i % 3 === 1 ? 1 : 0));
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;

// Что выпало, то и получаешь — без подмены на редкость ниже.
// Редкая / эпическая / легенда: неоткрытый питомец этой редкости выпадает всегда, иначе — повторка этой же редкости.
// Обычная: новый с шансом NEW_CHANCE (пока питомцев мало), иначе повторка обычного.
const NEW_CHANCE = 0.3;
function rollOutcome() {
  const r = rollRarity();
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fresh = PET_ORDER.filter(p => PETS[p].r === r && !D.pet.owned[p]);
  const ownedR = PET_ORDER.filter(p => PETS[p].r === r && D.pet.owned[p]);
  if (fresh.length && (r > 0 || !ownedR.length || Math.random() < NEW_CHANCE)) return { pid: pick(fresh), dup: false };
  if (ownedR.length) return { pid: pick(ownedR), dup: true };
  return { pid: pick(fresh.length ? fresh : PET_ORDER), dup: false };
}
function rollRarity() { let x = Math.random() * 100; for (let i = 0; i < RARITY.length; i++) { if (x < RARITY[i].p) return i; x -= RARITY[i].p; } return 0; }

SCREENS.draw = {
  render(el) {
    let ang = -12 * RIB_STEP, y = 12 * RIB_DY, k = 12, spinning = false, raf = 0, last = performance.now(), idle = true;
    el.innerHTML = '<div class="draw"><div class="halo" id="halo"></div>' +
      '<div class="row" style="position:relative;z-index:3"><button class="ibtn" data-back aria-label="Назад">' + ic('back', 2.6) + '</button><b style="font-size:24px;font-weight:900;flex:1">Открыть коробку</b><span class="tok" id="tok"><i></i>' + D.tokens + '</span></div>' +
      '<div class="stage"><div class="tilt"><div class="helix" id="helix"></div></div></div>' +
      '<div class="rar">' + RARITY.map(r => '<div><span><i style="background:' + r.c + '"></i>' + r.n + '</span><b>' + r.p + '%</b></div>').join('') + '</div>' +
      (() => { const ni = normInfo(), pc = Math.min(100, ni.have / ni.need * 100); return '<div class="slider sm normbar"><div class="track"><div class="fill" style="width:' + pc + '%"></div><div class="thumb" style="left:' + (8 + pc * .84) + '%">' + ni.have + ' / ' + ni.need + '</div></div><div class="pill" style="font-family:var(--font);font-size:12px;font-weight:800">' + (ni.k ? 'жетон ' + (ni.k + 1) + ' за день' : 'норма → жетон') + '</div></div>'; })() +
      '<button class="spin btn-sun press" id="spin"></button></div>';
    rollDay();
    const helix = el.querySelector('#helix'), spinBtn = el.querySelector('#spin'), halo = el.querySelector('#halo');
    const cards = RIB.map((r, i) => {
      const R = RARITY[r], c = document.createElement('div'); c.className = 'rc';
      c.innerHTML = '<div class="f" style="background:linear-gradient(160deg,' + R.c1 + ',' + R.c2 + ');color:' + R.fg + '"><small>' + R.n + '</small><b>?</b></div><div class="b" style="background:repeating-linear-gradient(45deg,' + R.c2 + ' 0 8px,' + R.c1 + ' 8px 16px)"></div>';
      c.style.transform = 'rotateY(' + i * RIB_STEP + 'deg) translateZ(' + RIB_R + 'px) translateY(' + i * RIB_DY + 'px)';
      helix.appendChild(c); return c;
    });
    const place = () => { helix.style.transform = 'translateY(' + (-y) + 'px) rotateY(' + ang + 'deg)'; };
    const btn = () => { spinBtn.textContent = spinning ? 'Крутится…' : D.tokens > 0 ? 'Крутить · 1 жетон' : 'Нет жетонов — сделай норму'; spinBtn.style.opacity = D.tokens > 0 || spinning ? 1 : .45; el.querySelector('#tok').innerHTML = '<i></i>' + D.tokens; };
    btn(); place();
    // медленное вращение в покое
    const tick = now => { const dt = Math.min(50, now - last); last = now; if (idle && !spinning) { ang -= dt * 0.006; place(); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    let lifted = null;
    const lift = (i, on) => { const c = cards[i]; if (!c) return; c.style.transform = 'rotateY(' + i * RIB_STEP + 'deg) translateZ(' + (RIB_R + (on ? 46 : 0)) + 'px) translateY(' + i * RIB_DY + 'px) scale(' + (on ? 1.14 : 1) + ')'; c.querySelector('.f').style.boxShadow = on ? 'inset 0 0 0 2px rgba(255,255,255,.7), 0 0 44px 12px ' + RARITY[RIB[i]].c : ''; };

    spinBtn.onclick = () => {
      if (spinning || D.tokens < 1) { if (!spinning) toast('До следующего жетона: ' + (normInfo().need - normInfo().have) + ' «помню»'); return; }
      if (lifted != null) { lift(lifted, false); lifted = null; }
      D.tokens--; save();
      const out = rollOutcome(), r = PETS[out.pid].r;
      const cand = RIB.map((v, i) => v === r ? i : -1).filter(i => i >= 0);
      const nk = cand[Math.floor(Math.random() * cand.length)];
      let A = -nk * RIB_STEP; while (A > ang - 4 * 360) A -= 360;
      const a0 = ang, y0 = y, y1 = nk * RIB_DY, wind = 10, T1 = 380, T2 = 5600;
      spinning = true; idle = false; btn(); halo.style.setProperty('--halo', 'rgba(244,196,48,.18)');
      const t0 = performance.now();
      const anim = now => {
        const t = now - t0;
        if (t < T1) { ang = a0 + wind * easeInOutSine(t / T1); }
        else { const p = Math.min(1, (t - T1) / T2), e = easeOutQuint(p); ang = (a0 + wind) + (A - a0 - wind) * e; y = y0 + (y1 - y0) * easeInOutSine(Math.min(1, p * 1.6)); }
        place();
        if (t < T1 + T2) requestAnimationFrame(anim);
        else { ang = A; y = y1; k = nk; place(); landed(nk, r, out); }
      };
      requestAnimationFrame(anim);
    };
    function landed(i, r, out) {
      lift(i, true); lifted = i; halo.style.setProperty('--halo', RARITY[r].c + '66');
      setTimeout(() => reveal(r, out), 900);
    }
    function reveal(r, out) {
      const R = RARITY[r], pid = out.pid, dup = out.dup, P = PETS[pid];
      if (dup) { const o = D.pet.owned[pid]; o.fed = (o.fed || 0) + 10; D.pet.food = Math.min(100, food() + 25); D.pet.foodTs = Date.now(); }
      else D.pet.owned[pid] = { fed: 0, got: Date.now() };
      save();
      const ov = document.createElement('div'); ov.className = 'reveal';
      let sparks = ''; for (let s = 0; s < 18; s++) { const a = s / 18 * Math.PI * 2, d = 140 + Math.random() * 60; sparks += '<i style="background:' + (s % 2 ? R.c : '#fff') + ';--dx:' + Math.cos(a) * d + 'px;--dy:' + Math.sin(a) * d + 'px;animation-delay:' + (.55 + Math.random() * .2) + 's"></i>'; }
      ov.innerHTML = '<div class="sparks">' + sparks + '</div><div class="pc" style="background:linear-gradient(160deg,' + R.c1 + ',' + R.c2 + ');box-shadow:0 0 60px 10px ' + R.c + '88"><div>' +
        '<div class="art" style="background:' + R.tint + ';--cut:' + R.tint + '"><span class="tag" style="background:' + R.c2 + ';color:' + R.fg + '">' + (dup ? 'повторка · ' : '') + R.n + '</span><span class="no">№ ' + P.no + '</span>' + petSvg(pid, P.big[0], P.big[1], 'style="--pet-ink:#1E1E1E;--pet-inv:#FFFFFF;--pet-ink2:#3A3236"') + '</div>' +
        '<div class="info"><b>' + esc(dup ? (D.pet.owned[pid].name || P.name) : P.name) + '</b><p>' + esc(dup ? 'Повторка! ' + P.name + ' уже в коллекции — он подрос (+10 к росту) и поделился едой: +25% сытости.' : P.desc) + '</p><div class="chips"><span>взрослый за ' + P.grow + ' карт.</span><span>шанс ' + R.p + '%</span></div>' +
        '<button class="btn-big press" data-take style="margin-top:6px;height:50px">' + (dup ? 'Отлично' : 'Забрать в коллекцию') + '</button>' + (dup ? '' : '<button class="link" data-use style="margin-top:4px;align-self:center">сделать моим питомцем</button>') + '</div></div></div>';
      el.querySelector('.draw').appendChild(ov);
      const done = () => { ov.style.transition = 'opacity .3s'; ov.style.opacity = 0; setTimeout(() => ov.remove(), 300); spinning = false; idle = true; btn(); lift(lifted, false); lifted = null; halo.style.setProperty('--halo', 'rgba(244,196,48,.18)'); };
      ov.querySelector('[data-take]').onclick = done;
      const u = ov.querySelector('[data-use]'); if (u) u.onclick = () => { D.pet.active = pid; save(); done(); toast('Теперь с тобой: ' + P.name); };
    }
    el.querySelector('[data-back]').onclick = () => { if (!spinning) back(); };
    return () => cancelAnimationFrame(raf);
  },
  onBack() { return false; }
};
