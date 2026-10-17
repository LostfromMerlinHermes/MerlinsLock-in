// Boot: runs after every module has registered its defaults, strings and listeners.
// Accounts come first (sync.js): signing in picks the storage key before the state loads.
(async () => {
  try { if (ML.auth) await ML.auth.boot(); } catch (e) { console.error(e); }
  ML.load();
  ML.emit('loaded');
  ML.applyI18n();
  ML.applyTheme();
  ML.startApp();
  ML.emit('started');
  if (ML.auth) ML.auth.afterLoad().catch(() => {});

  // Offline support for the installed web app (not in the extension or the Claude artifact)
  if ('serviceWorker' in navigator && !ML.IS_EXT && document.querySelector('link[rel=manifest]') && location.protocol === 'https:') {
    // Look for a new version at launch and every 30 min. When a new service worker takes over,
    // reload right away (or offer a button if a timer is running) so updates show without relaunching.
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloading) return;
      reloading = true;
      if (ML.running && ML.running()) ML.toast(ML.t('update_ready'), { action: { label: ML.t('update_reload'), fn: () => location.reload() }, ms: 15000 });
      else location.reload();
    });
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.update().catch(() => {});
      setInterval(() => reg.update().catch(() => {}), 30 * 60000);
    }).catch(() => {});
  }
})();