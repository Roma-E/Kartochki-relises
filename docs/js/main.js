// ===== Снимок прогресса на одно обновление назад =====
// При первом запуске новой версии сохраняем данные, какими они были в прошлой версии (kartochki-snap).
// Если в версии X нашли баг (например, слишком быстрый рост), в следующей версии ставим в version.js
// ROLLBACK = { ver: 'X', keys: ['pet', 'tokens'] } — у тех, кто обновляется с X, эти поля вернутся к снимку.
function versionSnapshot() {
  try {
    const prev = localStorage.getItem('kartochki-ver');
    if (prev === APP_VERSION) return;
    const snap = JSON.parse(localStorage.getItem('kartochki-snap') || 'null');
    const rb = typeof ROLLBACK !== 'undefined' && ROLLBACK;
    if (rb && prev && snap && snap.data && [].concat(rb.ver).includes(prev)) {
      (rb.keys || ['pet', 'tokens']).forEach(k => { if (snap.data[k] !== undefined) D[k] = JSON.parse(JSON.stringify(snap.data[k])); });
      D = normalize(D); save();
      setTimeout(() => toast('Прогресс питомцев вернули к версии ' + (snap.ver || 'до ' + prev) + ' — в ' + prev + ' была ошибка'), 1200);
    } else if (D.cards.length || Object.keys(D.pet.owned).length > 1) {
      localStorage.setItem('kartochki-snap', JSON.stringify({ ver: prev || 'old', at: Date.now(), data: D }));
    }
    localStorage.setItem('kartochki-ver', APP_VERSION);
  } catch (e) { }
}
// ===== Запуск =====
(async function main() {
  if (Native.isNative && !localStorage.getItem(K)) { const b = await Native.restore(); if (b) { D = normalize(b); try { localStorage.setItem(K, JSON.stringify(D)); } catch (e) { } } }
  rollDay();
  versionSnapshot();
  applyTheme(); buildNav(); Native.init();
  onNorm = k => setTimeout(() => toast(k > 1 ? 'Ещё один жетон за сегодня! Следующий — за ' + (normAt(k + 1) - normAt(k)) + ' «помню»' : 'Норма выполнена! +1 жетон на коробку'), 400);
  let st; saveHooks.push(() => { clearTimeout(st); st = setTimeout(() => { Native.schedule(); Native.backup(); }, 800); });
  render(true);
  Native.schedule();
  setTimeout(() => Native.ensureNotify(), 1500);
  saveHooks.push(() => Sync.schedule());
  if (Sync.on && await Sync.pull()) { applyTheme(); rerender(); }
  document.addEventListener('visibilitychange', async () => { if (!document.hidden && Sync.on && route.name !== 'review' && route.name !== 'edit' && await Sync.pull()) { applyTheme(); rerender(); } });
  // в браузере: уведомление, пока вкладка открыта
  if (!Native.isNative) setInterval(() => {
    if (!D.settings.notify || !('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
    const n = dueCount(); if (n && n !== main.lastN) { main.lastN = n; try { new Notification(petName() + ' проголодался', { body: 'Пора повторить: ' + n + ' ' + plural(n, 'карточка', 'карточки', 'карточек'), icon: 'icons/icon-192.png' }); } catch (e) { } }
  }, 60000);
  setInterval(() => { if (['home', 'cards'].includes(route.name) && !sheets.length && !nav.open && !document.hidden) { const sc = $('#screen .screen'), y = sc ? sc.scrollTop : 0; rerender(); const n = $('#screen .screen'); if (n) n.scrollTop = y; } }, 60000);
  setTimeout(() => checkUpdate(false), 2500);
  // повторная проверка обновлений раз в N минут (Настройки → «Проверять обновления»), пока приложение открыто
  setInterval(() => { const m = +D.settings.updEvery || 0; if (!m || document.hidden) return; if (Date.now() - (main.lastUpd || 0) >= m * 60000 - 1000) { main.lastUpd = Date.now(); checkUpdate(false); } }, 30000);
  main.lastUpd = Date.now();
  if ('serviceWorker' in navigator && !Native.isNative && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && (sheets.length || nav.open)) back(); });
})();
