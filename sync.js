// Accounts and cloud sync through Supabase (plain fetch to its Auth and REST APIs, no library).
// Boot asks ML.auth.boot() first: it signs the user in (or shows the login screen) and picks the
// per-user storage key before state loads. Then the whole state object is synced as one JSON row.
(() => {
  'use strict';
  const { $, S, t, esc, on, emit, toast } = ML;

  ML.addStrings({
    fr: {
      auth_login: 'Se connecter', auth_signup: 'Créer un compte', auth_email: 'Adresse e-mail', auth_pw: 'Mot de passe', auth_pw_new: 'Nouveau mot de passe',
      auth_remember: 'Se souvenir de moi', auth_show: 'Afficher', auth_forgot: 'Mot de passe oublié ?', auth_guest: 'Continuer sans compte',
      auth_guest_d: 'Tes données restent seulement sur cet appareil.', auth_tagline: 'Connecte-toi pour retrouver ta progression sur tous tes appareils.',
      auth_sent: 'E-mail envoyé. Ouvre le lien reçu pour choisir un nouveau mot de passe.', auth_confirm: 'Compte créé. Ouvre l’e-mail de confirmation, puis connecte-toi.',
      auth_reset_h: 'Choisis un nouveau mot de passe', auth_reset_ok: 'Mot de passe changé. Tu es connecté.', auth_wait: 'Un instant…',
      err_creds: 'E-mail ou mot de passe incorrect.', err_exists: 'Un compte existe déjà avec cet e-mail. Connecte-toi.', err_pw: 'Le mot de passe doit faire au moins 6 caractères.',
      err_net: 'Connexion impossible. Vérifie ta connexion internet.', err_rate: 'Trop de tentatives. Réessaie dans quelques minutes.', err_confirm: 'Confirme d’abord ton adresse avec l’e-mail reçu.',
      err_email: 'Entre une adresse e-mail valide.', err_generic: 'Erreur : {msg}',
      set_account: 'Compte', acc_signed: 'Connecté : {email}', acc_guest: 'Tu utilises l’app sans compte : tes données restent sur cet appareil.',
      acc_sync_now: 'Synchroniser maintenant', acc_logout: 'Se déconnecter', acc_login: 'Se connecter / créer un compte', acc_last: 'Dernière synchro : {when}', acc_never: 'jamais',
      acc_synced: 'Synchronisé', acc_sync_err: 'Synchro impossible pour l’instant. On réessaie bientôt.', acc_wipe: 'Effacer mes données du cloud', acc_wiped: 'Données du cloud effacées.',
      import_h: 'Importer la progression de cet appareil ?', import_p: 'Cet appareil a déjà des tâches, de l’XP et des sessions sans compte. Tu peux les mettre dans ton compte.',
      import_yes: 'Importer dans mon compte', import_no: 'Commencer à zéro',
    },
    en: {
      auth_login: 'Sign in', auth_signup: 'Create account', auth_email: 'Email address', auth_pw: 'Password', auth_pw_new: 'New password',
      auth_remember: 'Remember me', auth_show: 'Show', auth_forgot: 'Forgot password?', auth_guest: 'Continue without an account',
      auth_guest_d: 'Your data stays on this device only.', auth_tagline: 'Sign in to find your progress on all your devices.',
      auth_sent: 'Email sent. Open the link to choose a new password.', auth_confirm: 'Account created. Open the confirmation email, then sign in.',
      auth_reset_h: 'Choose a new password', auth_reset_ok: 'Password changed. You are signed in.', auth_wait: 'One moment…',
      err_creds: 'Wrong email or password.', err_exists: 'An account already exists with this email. Sign in instead.', err_pw: 'The password needs at least 6 characters.',
      err_net: "Can't connect. Check your internet connection.", err_rate: 'Too many attempts. Try again in a few minutes.', err_confirm: 'Confirm your address first with the email you received.',
      err_email: 'Enter a valid email address.', err_generic: 'Error: {msg}',
      set_account: 'Account', acc_signed: 'Signed in: {email}', acc_guest: "You're using the app without an account: your data stays on this device.",
      acc_sync_now: 'Sync now', acc_logout: 'Sign out', acc_login: 'Sign in / create account', acc_last: 'Last sync: {when}', acc_never: 'never',
      acc_synced: 'Synced', acc_sync_err: "Can't sync right now. Retrying soon.", acc_wipe: 'Delete my cloud data', acc_wiped: 'Cloud data deleted.',
      import_h: "Import this device's progress?", import_p: 'This device already has tasks, XP and sessions without an account. You can move them into your account.',
      import_yes: 'Import into my account', import_no: 'Start fresh',
    },
  });

  const CFG = window.MLI_CONFIG || {};
  const ENABLED = !!(CFG.supabaseUrl && CFG.supabaseKey) && ML.CAN_DOWNLOAD && 'fetch' in window;
  const BASE = (CFG.supabaseUrl || '').replace(/\/$/, '');
  const SESS = 'mli-auth', GUEST_FLAG = 'mli-guest';
  let user = null, lastSync = null, pushT = null, applying = 0, freshLocal = false; // freshLocal: this device had no data for this account yet

  /* ---------- Session storage: localStorage with "Remember me", sessionStorage without ---------- */
  function readSession() {
    try {
      const l = localStorage.getItem(SESS); if (l) return { s: JSON.parse(l), remember: true };
      const s = sessionStorage.getItem(SESS); if (s) return { s: JSON.parse(s), remember: false };
    } catch (e) {}
    return null;
  }
  function writeSession(s, remember) {
    try { localStorage.removeItem(SESS); sessionStorage.removeItem(SESS); if (s) (remember ? localStorage : sessionStorage).setItem(SESS, JSON.stringify(s)); } catch (e) {}
  }
  const norm = d => ({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: { id: d.user.id, email: d.user.email } });

  /* ---------- API ---------- */
  async function api(path, { method = 'GET', body, token, prefer, keepalive } = {}) {
    let r;
    try {
      r = await fetch(BASE + path, {
        method, keepalive: !!keepalive,
        headers: Object.assign({ apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, prefer ? { Prefer: prefer } : {}),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) { const err = new Error('network'); err.net = true; throw err; }
    let data = null;
    try { const txt = await r.text(); data = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) { const err = new Error((data && (data.msg || data.error_description || data.message || data.error)) || String(r.status)); err.status = r.status; throw err; }
    return data;
  }
  function errText(e) {
    const m = String(e.message || '').toLowerCase();
    if (e.net) return t('err_net');
    if (e.status === 429 || m.includes('rate')) return t('err_rate');
    if (m.includes('invalid login')) return t('err_creds');
    if (m.includes('already registered') || m.includes('already been registered')) return t('err_exists');
    if (m.includes('at least 6') || m.includes('password should')) return t('err_pw');
    if (m.includes('not confirmed')) return t('err_confirm');
    if (m.includes('email') && m.includes('invalid')) return t('err_email');
    return t('err_generic', { msg: e.message });
  }
  let sess = null, remember = true;
  async function token() {
    if (!sess) throw new Error('signed out');
    if (sess.expires_at - 60 < Date.now() / 1000) {
      const d = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } });
      sess = norm(d); writeSession(sess, remember);
    }
    return sess.access_token;
  }
  function useSession(s, rem) {
    sess = s; remember = rem; user = s.user;
    writeSession(s, rem);
    try { localStorage.removeItem(GUEST_FLAG); } catch (e) {}
    const key = 'merlins-lockin-v2:u:' + user.id;
    try { freshLocal = !localStorage.getItem(key); } catch (e) {}
    ML.setStorageKey(key);
  }

  /* ---------- Cloud data ---------- */
  async function pull() {
    const rows = await api('/rest/v1/lockin_data?select=data,updated_at&user_id=eq.' + user.id, { token: await token() });
    return rows && rows[0] ? rows[0] : null;
  }
  async function push(keepalive) {
    if (!user) return;
    clearTimeout(pushT); pushT = null;
    const body = { user_id: user.id, data: Object.assign({}, S), updated_at: new Date().toISOString() };
    await api('/rest/v1/lockin_data?on_conflict=user_id', { method: 'POST', body, token: await token(), prefer: 'resolution=merge-duplicates,return=minimal', keepalive: keepalive && JSON.stringify(body).length < 60000 });
    lastSync = Date.now(); renderStatus();
  }
  // Last write wins, by the _savedAt stamp core.js puts on every save
  async function syncNow(initial) {
    if (!user) return;
    try {
      const remote = await pull();
      if (!remote) {
        if (initial && freshLocal && hasGuestData()) { const choice = await askImport(); if (choice) applyData(guestData()); }
        await push();
      } else {
        const rAt = (remote.data && remote.data._savedAt) || 0, lAt = S._savedAt || 0;
        // On a device that never had this account's data, the cloud always wins (the local copy is just the empty start)
        if ((initial && freshLocal) || rAt > lAt) applyData(remote.data);
        else if (lAt > rAt) await push();
        lastSync = Date.now();
      }
      freshLocal = false;
      renderStatus();
      return true;
    } catch (e) {
      if (!initial && !e.net) toast(t('acc_sync_err'));
      return false;
    }
  }
  function applyData(data) {
    applying++;
    ML.applyRemote(data);
    try { localStorage.setItem(ML.storageKey(), JSON.stringify(S)); } catch (e) {}
    setTimeout(() => { applying--; }, 3000); // saves triggered by re-rendering right after don't bounce back
  }
  const guestData = () => { try { return JSON.parse(localStorage.getItem(ML.GUEST_KEY)); } catch (e) { return null; } };
  const hasGuestData = () => { const g = guestData(); return !!(g && ((g.sessions && g.sessions.length) || g.xp > 0 || (g.tasks && g.tasks.some(x => !x.sample)))); };

  on('saved', () => {
    if (!user || applying) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => push().catch(() => {}), 4000);
  });
  addEventListener('pagehide', () => { if (user && pushT) push(true).catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (!user) return;
    if (document.visibilityState === 'hidden' && pushT) push(true).catch(() => {});
    if (document.visibilityState === 'visible') syncNow(false);
  });
  setInterval(() => { if (user && document.visibilityState === 'visible' && !pushT) syncNow(false); }, 90000);

  /* ---------- Login screen ---------- */
  function overlay() {
    let el = $('auth');
    if (!el) { el = document.createElement('div'); el.id = 'auth'; el.className = 'auth-screen'; document.body.appendChild(el); }
    el.hidden = false;
    return el;
  }
  const logoHtml = () => document.querySelector('.logo') ? document.querySelector('.logo').outerHTML : '';
  function showAuth() {
    return new Promise(resolve => {
      const el = overlay();
      let mode = 'login';
      const draw = (msg, isErr) => {
        el.innerHTML = `<div class="auth-box" role="dialog" aria-modal="true" aria-labelledby="auth-h">
          <div class="auth-logo">${logoHtml()}</div>
          <h1 id="auth-h">Merlins<span>LockIN</span></h1>
          <p class="hint">${esc(t('auth_tagline'))}</p>
          <div class="seg-toggle" role="tablist">
            <button type="button" data-am="login" aria-pressed="${mode === 'login'}">${esc(t('auth_login'))}</button>
            <button type="button" data-am="signup" aria-pressed="${mode === 'signup'}">${esc(t('auth_signup'))}</button>
          </div>
          <form id="auth-form" novalidate>
            <label><span class="label">${esc(t('auth_email'))}</span><input type="email" name="email" autocomplete="email" required></label>
            <label><span class="label">${esc(t('auth_pw'))}</span><span class="pw-row"><input type="password" name="pw" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="6" required><button type="button" class="small ghost" id="auth-show">${esc(t('auth_show'))}</button></span></label>
            <label class="opt"><input type="checkbox" name="remember" checked> ${esc(t('auth_remember'))}</label>
            <p class="auth-msg ${isErr ? 'err' : ''}" role="alert">${msg ? esc(msg) : ''}</p>
            <button type="submit" class="primary">${esc(mode === 'login' ? t('auth_login') : t('auth_signup'))}</button>
            ${mode === 'login' ? `<button type="button" class="link" id="auth-forgot">${esc(t('auth_forgot'))}</button>` : ''}
          </form>
          <div class="auth-or"></div>
          <button type="button" class="ghost" id="auth-guest">${esc(t('auth_guest'))}</button>
          <small class="hint">${esc(t('auth_guest_d'))}</small>
        </div>`;
        const f = $('auth-form');
        setTimeout(() => f.email.focus(), 30);
        el.querySelectorAll('[data-am]').forEach(b => b.onclick = () => { mode = b.dataset.am; draw(); });
        $('auth-show').onclick = () => { f.pw.type = f.pw.type === 'password' ? 'text' : 'password'; };
        $('auth-guest').onclick = () => { try { localStorage.setItem(GUEST_FLAG, '1'); } catch (e) {} el.hidden = true; resolve('guest'); };
        if ($('auth-forgot')) $('auth-forgot').onclick = async () => {
          const email = f.email.value.trim();
          if (!/^\S+@\S+\.\S+$/.test(email)) { draw(t('err_email'), true); return; }
          try { await api('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.href.split('#')[0]), { method: 'POST', body: { email } }); draw(t('auth_sent')); }
          catch (e) { draw(errText(e), true); }
        };
        f.onsubmit = async e => {
          e.preventDefault();
          const email = f.email.value.trim(), pw = f.pw.value, rem = f.remember.checked;
          if (!/^\S+@\S+\.\S+$/.test(email)) { draw(t('err_email'), true); return; }
          if (pw.length < 6) { draw(t('err_pw'), true); $('auth-form').email.value = email; return; }
          const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = t('auth_wait');
          try {
            const d = mode === 'login'
              ? await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: pw } })
              : await api('/auth/v1/signup', { method: 'POST', body: { email, password: pw } });
            if (!d || !d.access_token) { mode = 'login'; draw(t('auth_confirm')); $('auth-form').email.value = email; return; }
            useSession(norm(d), rem);
            el.hidden = true; resolve('user');
          } catch (err) {
            draw(errText(err), true); $('auth-form').email.value = email;
          }
        };
      };
      draw();
    });
  }
  // Password reset link from the email lands here with a recovery session in the URL hash
  function showReset(d) {
    return new Promise(resolve => {
      const el = overlay();
      const draw = (msg, isErr) => {
        el.innerHTML = `<div class="auth-box"><div class="auth-logo">${logoHtml()}</div><h2>${esc(t('auth_reset_h'))}</h2>
          <form id="reset-form"><label><span class="label">${esc(t('auth_pw_new'))}</span><input type="password" name="pw" minlength="6" autocomplete="new-password" required></label>
          <p class="auth-msg ${isErr ? 'err' : ''}">${msg ? esc(msg) : ''}</p><button type="submit" class="primary">${esc(t('save'))}</button></form></div>`;
        $('reset-form').onsubmit = async e => {
          e.preventDefault();
          const pw = e.target.pw.value; if (pw.length < 6) { draw(t('err_pw'), true); return; }
          try { await api('/auth/v1/user', { method: 'PUT', body: { password: pw }, token: d.access_token }); useSession(norm(d), true); el.hidden = true; toast(t('auth_reset_ok')); resolve('user'); }
          catch (err) { draw(errText(err), true); }
        };
      };
      draw();
    });
  }
  function askImport() {
    return new Promise(resolve => {
      const el = overlay();
      el.innerHTML = `<div class="auth-box"><h2>${esc(t('import_h'))}</h2><p class="hint">${esc(t('import_p'))}</p>
        <button type="button" class="primary" id="imp-yes">${esc(t('import_yes'))}</button><button type="button" class="ghost" id="imp-no">${esc(t('import_no'))}</button></div>`;
      $('imp-yes').onclick = () => { el.hidden = true; resolve(true); };
      $('imp-no').onclick = () => { el.hidden = true; resolve(false); };
    });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    if (!ENABLED) return 'guest';
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.get('access_token')) {
      const d = { access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token'), expires_in: +hash.get('expires_in') || 3600 };
      history.replaceState(null, '', location.pathname + location.search);
      try {
        const u = await api('/auth/v1/user', { token: d.access_token });
        d.user = u;
        if (hash.get('type') === 'recovery') return await showReset(d);
        useSession(norm(d), true); return 'user'; // email confirmation link
      } catch (e) {}
    }
    const found = readSession();
    if (found) {
      sess = found.s; remember = found.remember; user = sess.user;
      try { await token(); }
      catch (e) { if (!e.net) { writeSession(null); sess = null; user = null; } } // offline: keep the cached session
      if (user) { useSession(sess, remember); return 'user'; }
    }
    try { if (localStorage.getItem(GUEST_FLAG) === '1') return 'guest'; } catch (e) {}
    return await showAuth();
  }
  async function afterLoad() { if (user) { await syncNow(true); } }
  async function logout() {
    try { if (pushT) await push(); } catch (e) {}
    try { await api('/auth/v1/logout', { method: 'POST', token: sess && sess.access_token }); } catch (e) {}
    writeSession(null); user = null; sess = null;
    ML.setStorageKey(null);
    location.reload();
  }
  ML.auth = { boot, afterLoad, get user() { return user; }, enabled: ENABLED, syncNow };

  /* ---------- Settings: account section ---------- */
  function renderStatus() { const el = $('acc-status'); if (el) el.textContent = t('acc_last', { when: lastSync ? new Date(lastSync).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' }) : t('acc_never') }); }
  if (ENABLED) ML.settingsSection({
    order: 5,
    render: () => `<h3>${esc(t('set_account'))}</h3>${user
      ? `<p class="hint">${esc(t('acc_signed', { email: user.email }))}</p><p class="hint" id="acc-status"></p>
         <div class="backup-btns"><button type="button" class="small" id="acc-sync">${esc(t('acc_sync_now'))}</button>
         <button type="button" class="small ghost" id="acc-logout">${esc(t('acc_logout'))}</button>
         <button type="button" class="small ghost danger" id="acc-wipe">${esc(t('acc_wipe'))}</button></div>`
      : `<p class="hint">${esc(t('acc_guest'))}</p><button type="button" class="small primary" id="acc-login">${esc(t('acc_login'))}</button>`}`,
    bind: r => {
      renderStatus();
      if (r.querySelector('#acc-sync')) r.querySelector('#acc-sync').onclick = async () => { if (await syncNow(false)) toast(t('acc_synced')); };
      if (r.querySelector('#acc-logout')) r.querySelector('#acc-logout').onclick = logout;
      if (r.querySelector('#acc-wipe')) ML.armedButton(r.querySelector('#acc-wipe'), 'acc_wipe', async () => {
        try { await api('/rest/v1/lockin_data?user_id=eq.' + user.id, { method: 'DELETE', token: await token() }); toast(t('acc_wiped')); } catch (e) { toast(errText(e)); }
      });
      if (r.querySelector('#acc-login')) r.querySelector('#acc-login').onclick = () => { try { localStorage.removeItem(GUEST_FLAG); } catch (e) {} location.reload(); };
    },
  });
})();
