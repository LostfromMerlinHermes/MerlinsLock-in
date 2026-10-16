// Boot: runs after every module has registered its defaults, strings and listeners.
(() => {
  ML.load();
  ML.emit('loaded');
  ML.applyI18n();
  ML.applyTheme();
  ML.startApp();
  ML.emit('started');

  // Offline support for the installed web app (not in the extension or the Claude artifact)
  if ('serviceWorker' in navigator && !ML.IS_EXT && document.querySelector('link[rel=manifest]') && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
