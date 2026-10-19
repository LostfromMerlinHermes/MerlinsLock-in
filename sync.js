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
      acc_delete: 'Supprimer mon compte', acc_deleted: 'Compte supprimé. Toutes tes données en ligne ont été effacées.', del_missing: 'La suppression de compte n’est pas encore activée sur le serveur. Contacte l’éditeur.',
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
      acc_delete: 'Delete my account', acc_deleted: 'Account deleted. All your online data was erased.', del_missing: 'Account deletion is not enabled on the server yet. Contact the publisher.',
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
  // premium comes from app_metadata, which only the server (SQL, or a payment webhook later) can set
  const norm = d => ({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: { id: d.user.id, email: d.user.email, premium: !!(d.user.app_metadata && d.user.app_metadata.premium), owner: !!(d.user.app_metadata && d.user.app_metadata.owner) } });

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
  async function token(force) {
    if (!sess) throw new Error('signed out');
    if (force || sess.expires_at - 60 < Date.now() / 1000) {
      const d = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } });
      const was = sess.user && sess.user.premium;
      sess = norm(d); user = sess.user; writeSession(sess, remember);
      if (was !== user.premium) emit('premium', user.premium);
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

  /* ---------- Three-way merge ----------
     Each device keeps a "base": the last state it agreed on with the cloud. When both sides changed since
     then, they are merged field by field: lists of items (tasks, notes, events, blocks, sessions…) are merged
     item by item, so an edit or deletion on one device never wipes what the other one added. */
  const LOCAL_ONLY = ['tab', 'section', 'compact', 'showAll', 'audio.open', 'notes.current', 'cal.month', 'cal.sel', 'planner.date', 'sport.tab'];
  const COUNTERS = ['xp', 'econ.gold'];
  const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const keyOf = v => (isObj(v) ? (v.id != null ? 'id:' + v.id : v.at != null ? 'at:' + v.at : null) : null);
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) { const ks = p.split('.'), last = ks.pop(); const tgt = ks.reduce((a, k) => (isObj(a[k]) ? a[k] : (a[k] = {})), o); if (v === undefined) delete tgt[last]; else tgt[last] = v; }
  // localWins: tie-break for plain values changed on both sides; noBase: first merge on this device (prefer the cloud)
  function merge3(base, L, R, localWins, path) {
    if (same(L, R)) return L;
    if (base !== undefined && same(base, L)) return R;
    if (base !== undefined && same(base, R)) return L;
    if (COUNTERS.includes(path) && typeof L === 'number' && typeof R === 'number') return typeof base === 'number' ? base + (L - base) + (R - base) : Math.max(L, R);
    if (isObj(L) && isObj(R)) {
      const out = {}, b = isObj(base) ? base : {};
      new Set([...Object.keys(L), ...Object.keys(R)]).forEach(k => {
        if (k === '_savedAt') return;
        const v = !(k in L) ? (k in b && same(b[k], R[k]) ? undefined : R[k]) : !(k in R) ? (k in b && same(b[k], L[k]) ? undefined : L[k]) : merge3(b[k], L[k], R[k], localWins, path ? path + '.' + k : k);
        if (v !== undefined) out[k] = v;
      });
      return out;
    }
    if (Array.isArray(L) && Array.isArray(R)) {
      const B = Array.isArray(base) ? base : [];
      const all = [...B, ...L, ...R];
      if (all.length && all.every(x => keyOf(x))) {
        const map = a => new Map(a.map(x => [keyOf(x), x]));
        const mb = map(B), ml = map(L), mr = map(R), out = [];
        const keys = [...new Set([...L.map(keyOf), ...R.map(keyOf)])];
        keys.forEach(k => {
          const inL = ml.has(k), inR = mr.has(k), inB = mb.has(k);
          if (inL && inR) out.push(merge3(mb.get(k), ml.get(k), mr.get(k), localWins, path));
          else if (inL) { if (!inB || !same(mb.get(k), ml.get(k))) out.push(ml.get(k)); } // deleted on R: drop unless edited on L
          else if (!inB || !same(mb.get(k), mr.get(k))) out.push(mr.get(k));
        });
        if (all.every(x => x.id == null && typeof x.at === 'number')) out.sort((a, b) => a.at - b.at);
        return out;
      }
      if (all.every(x => x === null || typeof x !== 'object')) {
        const has = (a, x) => a.includes(x);
        return [...new Set([...L, ...R])].filter(x => (has(L, x) && has(R, x)) || !has(B, x));
      }
    }
    return localWins ? L : R;
  }
  const baseKey = () => 'mli-sync-base:' + user.id;
  const getBase = () => { try { return JSON.parse(localStorage.getItem(baseKey())); } catch (e) { return null; } };
  const setBase = d => { try { localStorage.setItem(baseKey(), JSON.stringify(d)); } catch (e) {} };

  /* ---------- Cloud data ---------- */
  let remoteAt = null, syncing = null; // remoteAt: _savedAt of the cloud row as last seen (null: no row yet)
  async function pull() {
    const rows = await api('/rest/v1/lockin_data?select=data,updated_at&user_id=eq.' + user.id, { token: await token() });
    return rows && rows[0] ? rows[0] : null;
  }
  // Only overwrites the cloud row if nobody else changed it since we last saw it; otherwise merge first.
  async function push(keepalive, fromSync) {
    if (!user) return;
    clearTimeout(pushT); pushT = null;
    const data = JSON.parse(JSON.stringify(S));
    const body = { data, updated_at: new Date().toISOString() };
    const ka = keepalive && JSON.stringify(body).length < 60000;
    if (remoteAt == null) {
      await api('/rest/v1/lockin_data?on_conflict=user_id', { method: 'POST', body: Object.assign({ user_id: user.id }, body), token: await token(), prefer: 'resolution=merge-duplicates,return=minimal', keepalive: ka });
    } else {
      const rows = await api('/rest/v1/lockin_data?user_id=eq.' + user.id + '&data->>_savedAt=eq.' + remoteAt + '&select=user_id', { method: 'PATCH', body, token: await token(), prefer: 'return=representation', keepalive: ka });
      if (keepalive) return; // the page is closing: the next sync settles it
      if (!rows || !rows.length) { if (!fromSync) await syncNow(false); return; } // the cloud moved on: merge, then push
    }
    if (keepalive) return;
    remoteAt = data._savedAt; setBase(data);
    lastSync = Date.now(); renderStatus();
  }
  function syncNow(initial) {
    if (!user) return Promise.resolve(false);
    if (syncing) return syncing;
    syncing = doSync(initial).finally(() => { syncing = null; });
    return syncing;
  }
  async function doSync(initial) {
    try {
      const remote = await pull();
      if (!remote) {
        remoteAt = null;
        if (initial && freshLocal && hasGuestData()) { const choice = await askImport(); if (choice) applyData(guestData()); }
        await push(false, true);
      } else {
        const rd = remote.data || {}, rAt = rd._savedAt || 0;
        remoteAt = rd._savedAt == null ? null : rAt;
        const base = getBase();
        if ((initial && freshLocal) || rAt === S._savedAt) { if (rAt !== S._savedAt) applyData(rd); setBase(rd); } // a device new to this account takes the cloud copy
        else {
          const localChanged = !base || S._savedAt !== base._savedAt, remoteChanged = !base || rAt !== base._savedAt;
          if (!remoteChanged) { if (localChanged) await push(false, true); }
          else if (!localChanged) { applyData(rd); setBase(rd); }
          else {
            const merged = merge3(base || undefined, JSON.parse(JSON.stringify(S)), rd, !!base && (S._savedAt || 0) > rAt, '');
            merged._savedAt = Date.now();
            applyData(merged);
            await push(false, true);
          }
        }
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
    data = Object.assign({}, data);
    LOCAL_ONLY.forEach(p => { const v = getPath(S, p); if (v !== undefined) { if (p.includes('.')) { const top = p.split('.')[0]; data[top] = Object.assign({}, data[top]); } setPath(data, p, v); } }); // keep what this screen shows
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
            ${mode === 'signup' ? `<label class="opt consent"><input type="checkbox" name="terms"> <span>${t('consent', { terms: `<button type="button" class="link" data-legal="terms">${esc(t('consent_terms'))}</button>`, privacy: `<button type="button" class="link" data-legal="privacy">${esc(t('consent_privacy'))}</button>` })}</span></label>` : ''}
            <p class="auth-msg ${isErr ? 'err' : ''}" role="alert">${msg ? esc(msg) : ''}</p>
            <button type="submit" class="primary">${esc(mode === 'login' ? t('auth_login') : t('auth_signup'))}</button>
            ${mode === 'login' ? `<button type="button" class="link" id="auth-forgot">${esc(t('auth_forgot'))}</button>` : ''}
          </form>
          <div class="auth-or"></div>
          <button type="button" class="ghost" id="auth-guest">${esc(t('auth_guest'))}</button>
          <small class="hint">${esc(t('auth_guest_d'))}</small>
          <p class="legal-links">${ML.legalLinks ? ML.legalLinks() : ''}</p>
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
          if (mode === 'signup' && !f.terms.checked) { draw(t('err_consent'), true); $('auth-form').email.value = email; return; }
          const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = t('auth_wait');
          try {
            const d = mode === 'login'
              ? await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: pw } })
              : await api('/auth/v1/signup', { method: 'POST', body: { email, password: pw, data: { terms_version: ML.LEGAL_VERSION, terms_accepted_at: new Date().toISOString() } } });
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
      try { await token(true); } // refreshing at launch also picks up a new Premium status
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
  ML.auth = { boot, afterLoad, get user() { return user; }, enabled: ENABLED, syncNow, merge3 };

  /* ---------- Settings: account section ---------- */
  function renderStatus() { const el = $('acc-status'); if (el) el.textContent = t('acc_last', { when: lastSync ? new Date(lastSync).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' }) : t('acc_never') }); }
  if (ENABLED) ML.settingsSection({
    order: 5,
    render: () => `<h3>${esc(t('set_account'))}</h3>${user
      ? `<p class="hint">${esc(t('acc_signed', { email: user.email }))}</p><p class="hint" id="acc-status"></p>
         <div class="backup-btns"><button type="button" class="small" id="acc-sync">${esc(t('acc_sync_now'))}</button>
         <button type="button" class="small ghost" id="acc-logout">${esc(t('acc_logout'))}</button>
         <button type="button" class="small ghost danger" id="acc-wipe">${esc(t('acc_wipe'))}</button>
         <button type="button" class="small ghost danger" id="acc-delete">${esc(t('acc_delete'))}</button></div>`
      : `<p class="hint">${esc(t('acc_guest'))}</p><button type="button" class="small primary" id="acc-login">${esc(t('acc_login'))}</button>`}`,
    bind: r => {
      renderStatus();
      if (r.querySelector('#acc-sync')) r.querySelector('#acc-sync').onclick = async () => { if (await syncNow(false)) toast(t('acc_synced')); };
      if (r.querySelector('#acc-logout')) r.querySelector('#acc-logout').onclick = logout;
      if (r.querySelector('#acc-wipe')) ML.armedButton(r.querySelector('#acc-wipe'), 'acc_wipe', async () => {
        try { await api('/rest/v1/lockin_data?user_id=eq.' + user.id, { method: 'DELETE', token: await token() }); toast(t('acc_wiped')); } catch (e) { toast(errText(e)); }
      });
      if (r.querySelector('#acc-delete')) ML.armedButton(r.querySelector('#acc-delete'), 'acc_delete', async () => {
        try {
          clearTimeout(pushT); pushT = null;
          await api('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {}, token: await token() });
          try { localStorage.removeItem(ML.storageKey()); } catch (e) {}
          writeSession(null); user = null; sess = null; ML.setStorageKey(null);
          toast(t('acc_deleted')); setTimeout(() => location.reload(), 1800);
        } catch (e) { toast(e.status === 404 ? t('del_missing') : errText(e)); }
      });
      if (r.querySelector('#acc-login')) r.querySelector('#acc-login').onclick = () => { try { localStorage.removeItem(GUEST_FLAG); } catch (e) {} location.reload(); };
    },
  });
})();
