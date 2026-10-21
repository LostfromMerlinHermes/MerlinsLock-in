// Timer-end notification through Web Push, so it arrives even with the phone locked or the app closed
// (an installed web app can't run code in the background on iPhone). Needs: the installed web app (https,
// service worker), a signed-in account, and the Supabase side (supabase/push.sql + Edge Function send-push).
// The device's choice is kept in localStorage['mli-push']; the pending job id in 'mli-push-job'. Never synced.
(() => {
  'use strict';
  const { $, S, t, esc, on, toast } = ML;
  const CFG = window.MLI_CONFIG || {};
  const FN = CFG.supabaseUrl ? CFG.supabaseUrl + '/functions/v1/send-push' : '';
  const SUPPORTED = !ML.IS_EXT && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && location.protocol === 'https:' && !!FN;
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  ML.addStrings({
    fr: {
      push_h: 'Notification de fin', push_on: 'Activer sur cet appareil', push_off: 'Désactiver', push_status_on: 'Activée : tu seras prévenu à la fin de chaque minuteur, même téléphone verrouillé.',
      push_status_off: 'Prévient à la fin du minuteur, même téléphone verrouillé ou app fermée.', push_need_login: 'Connecte-toi à ton compte pour l’activer.',
      push_need_install: 'Sur iPhone : ajoute d’abord l’app à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis ouvre-la depuis l’icône.',
      push_denied: 'Les notifications sont bloquées pour cette app. Autorise-les dans les réglages du téléphone.', push_unsupported: 'Pas disponible ici (extension ou navigateur sans notifications).',
      push_ok: 'Notifications de fin activées.', push_err: 'Activation impossible pour l’instant (connexion ou serveur).', push_test: 'Tester (dans 15 s)', push_test_ok: 'Verrouille ton téléphone : la notification arrive dans 15 s.',
      push_end_focus: 'Session terminée ✦', push_end_focus_b: '{task} · Viens noter ta concentration et choisir la suite.', push_end_break: 'Pause terminée', push_end_break_b: 'Prêt pour la prochaine session ?',
    },
    en: {
      push_h: 'End-of-timer notification', push_on: 'Turn on for this device', push_off: 'Turn off', push_status_on: 'On: you get a notification when each timer ends, even with the phone locked.',
      push_status_off: 'Notifies you when the timer ends, even with the phone locked or the app closed.', push_need_login: 'Sign in to your account to turn it on.',
      push_need_install: 'On iPhone: first add the app to your Home Screen (Share → Add to Home Screen), then open it from the icon.',
      push_denied: 'Notifications are blocked for this app. Allow them in the phone settings.', push_unsupported: 'Not available here (extension, or a browser without notifications).',
      push_ok: 'End-of-timer notifications on.', push_err: "Couldn't turn it on right now (connection or server).", push_test: 'Test (in 15 s)', push_test_ok: 'Lock your phone: the notification arrives in 15 s.',
      push_end_focus: 'Session complete ✦', push_end_focus_b: '{task} · Come rate your focus and pick what’s next.', push_end_break: 'Break over', push_end_break_b: 'Ready for the next session?',
    },
  });

  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} };
  const isOn = () => SUPPORTED && get('mli-push') === '1' && !!(ML.auth && ML.auth.user);
  const rest = (p, o) => ML.auth.rest(p, o);
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };

  async function enable() {
    const perm = await Notification.requestPermission(); // must come straight from the tap (iOS)
    if (perm !== 'granted') { toast(t('push_denied'), { ms: 6000 }); return renderSection(); }
    try {
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetch(FN + '?key', { headers: { apikey: CFG.supabaseKey } }).then(r => r.json());
      const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(publicKey) });
      const j = sub.toJSON();
      await rest('/rest/v1/push_subs?on_conflict=endpoint', { method: 'POST', body: { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, prefer: 'resolution=merge-duplicates' });
      set('mli-push', '1'); toast(t('push_ok'));
      if (ML.running()) schedule();
    } catch (e) { toast(t('push_err'), { ms: 6000 }); }
    renderSection();
  }
  async function disable() {
    await cancel();
    try {
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { await rest('/rest/v1/push_subs?endpoint=eq.' + encodeURIComponent(sub.endpoint), { method: 'DELETE' }).catch(() => {}); await sub.unsubscribe(); }
    } catch (e) {}
    set('mli-push', null); renderSection();
  }

  // One job per running timer, at its end time
  let busy = Promise.resolve();
  const queue = fn => (busy = busy.then(fn, fn));
  function cancel() {
    return queue(async () => {
      const id = get('mli-push-job'); if (!id) return;
      set('mli-push-job', null);
      try { await rest('/rest/v1/push_jobs?id=eq.' + id, { method: 'DELETE' }); } catch (e) {}
    });
  }
  function schedule(at = S.endAt, kind = S.mode, title) {
    return queue(async () => {
      const old = get('mli-push-job');
      if (old) { set('mli-push-job', null); try { await rest('/rest/v1/push_jobs?id=eq.' + old, { method: 'DELETE' }); } catch (e) {} }
      if (!isOn() || !at) return;
      const task = (ML.activeTitle && ML.activeTitle()) || t('free_focus');
      const body = { send_at: new Date(at).toISOString(), title: title || t(kind === 'break' ? 'push_end_break' : 'push_end_focus'),
        body: kind === 'break' ? t('push_end_break_b') : t('push_end_focus_b', { task }), tag: 'mli-timer' };
      try { const rows = await rest('/rest/v1/push_jobs', { method: 'POST', body, prefer: 'return=representation' }); if (rows && rows[0]) set('mli-push-job', rows[0].id); } catch (e) {}
    });
  }
  let lastEnd = null;
  on('timer', () => {
    if (!isOn()) return;
    const end = ML.running() ? S.endAt : null;
    if (end === lastEnd) return; lastEnd = end;
    if (end) schedule(end, S.mode); else cancel();
  });
  // Looking at the app when it ends: the in-app chime is enough, don't buzz the phone too
  on('tick', rem => { if (rem < 3 && rem > 0 && document.visibilityState === 'visible' && get('mli-push-job')) cancel(); });

  /* ---------- Settings ---------- */
  let root = null;
  function sectionHtml() {
    let status, btn = '';
    if (!SUPPORTED) status = t(iOS && !standalone ? 'push_need_install' : 'push_unsupported');
    else if (iOS && !standalone) status = t('push_need_install');
    else if (!(ML.auth && ML.auth.user)) status = t('push_need_login');
    else if (Notification.permission === 'denied') status = t('push_denied');
    else if (isOn()) { status = t('push_status_on'); btn = `<button type="button" class="small" id="push-test">${esc(t('push_test'))}</button><button type="button" class="small ghost" id="push-off">${esc(t('push_off'))}</button>`; }
    else { status = t('push_status_off'); btn = `<button type="button" class="small primary" id="push-on">${esc(t('push_on'))}</button>`; }
    return `<h3>${esc(t('push_h'))}</h3><p class="hint">${esc(status)}</p>${btn ? `<div class="chips">${btn}</div>` : ''}`;
  }
  function renderSection() { if (root && root.isConnected) { root.innerHTML = sectionHtml(); bind(root); } }
  function bind(r) {
    root = r;
    const on1 = r.querySelector('#push-on'), off = r.querySelector('#push-off'), test = r.querySelector('#push-test');
    if (on1) on1.onclick = enable;
    if (off) off.onclick = disable;
    if (test) test.onclick = () => { if (!ML.running()) { schedule(Date.now() + 15000, 'focus', t('push_end_focus')); toast(t('push_test_ok'), { ms: 6000 }); } };
  }
  // The extension already notifies through its background alarms, and the artifact can't: show it only in the web app
  if (!ML.IS_EXT && FN) ML.settingsSection({ order: 22, render: () => `<div id="push-sec">${sectionHtml()}</div>`, bind: r => { const el = r.querySelector('#push-sec'); if (el) bind(el); } });
  ML.push = { enable, disable, isOn };
})();
