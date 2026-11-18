// Anonymous usage counts (3.102). What is counted: which places are opened, sessions (count, minutes, energy, world),
// tasks done, a few buttons. Never any text, title, note, card or email. The counts wait on the device
// (localStorage 'mli-usage', not synced) and go to Supabase about every 5 minutes through usage_bump
// (supabase/usage.sql), under a random id (S.usageId). Settings → About → Usage statistics turns it off.
(() => {
  const { S, on, save, esc, t } = ML;
  const CFG = window.MLI_CONFIG || {};
  const BASE = (CFG.supabaseUrl || '').replace(/\/$/, '');
  const KEY = 'mli-usage';
  const EVERY = 5 * 60 * 1000;

  ML.defaults(() => ({ usageOff: false, usageId: null }));
  ML.addStrings({
    fr: { us_h: 'Statistiques d’usage', us_opt: 'Envoyer des statistiques anonymes', us_d: 'Compte quelles pages tu ouvres et combien de sessions tu fais, sous un numéro au hasard. Jamais tes tâches, notes ni ton e-mail. Ça aide à savoir quoi améliorer.' },
    en: { us_h: 'Usage statistics', us_opt: 'Send anonymous statistics', us_d: 'Counts which pages you open and how many sessions you do, under a random number. Never your tasks, notes or email. It helps decide what to improve.' },
  });

  const pad = n => String(n).padStart(2, '0');
  const day = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const off = () => !BASE || !CFG.supabaseKey || S.usageOff;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.day && v.c) return v; } catch (e) {} return null; };
  const write = v => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) {} };
  const clean = k => String(k).toLowerCase().replace(/[^a-z0-9_:.-]/g, '').slice(0, 48);
  const plat = () => ML.IS_EXT ? 'ext' : !document.querySelector('link[rel=manifest]') ? 'artifact'
    : (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ? 'pwa' : 'web';

  function id() {
    if (!/^[a-z0-9]{12,24}$/.test(S.usageId || '')) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      S.usageId = Array.from(a, b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); save();
    }
    return S.usageId;
  }

  let sending = false;
  async function send(batch, keepalive) {
    const r = await fetch(BASE + '/rest/v1/rpc/usage_bump', {
      method: 'POST', keepalive: !!keepalive,
      headers: { apikey: CFG.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: id(), p_day: batch.day, p_counts: batch.c }),
    });
    if (!r.ok) throw new Error(String(r.status));
  }
  async function flush(keepalive) {
    const cur = read();
    if (off()) { if (cur) write(null); return; }
    if (sending || !cur || !Object.keys(cur.c).length) return;
    sending = true; write(cur.day === day() ? { day: cur.day, c: {}, seen: cur.seen } : null);
    try { await send(cur, keepalive); }
    catch (e) { // put the counts back for the next try (dropped after a week: the server refuses older days)
      const now = read();
      if (now && now.day === cur.day) { for (const [k, n] of Object.entries(cur.c)) now.c[k] = (now.c[k] || 0) + n; write(now); }
      else if (!now) write(cur);
    } finally { sending = false; }
  }

  function bump(k, n = 1) {
    if (off() || !(n > 0)) return;
    let cur = read();
    if (cur && cur.day !== day()) { flush(); cur = read(); } // yesterday's counts leave first
    if (!cur || cur.day !== day()) cur = { day: day(), c: {}, seen: false };
    if (!cur.seen) { // once a day: the person was here, and from where
      cur.seen = true;
      const daily = ['open', 'plat:' + plat(), 'lang:' + (S.lang || 'fr'), 'acct:' + (ML.auth && ML.auth.user ? 'yes' : 'no')];
      if (ML.auth && ML.auth.user && ML.auth.user.owner) daily.push('who:owner'); // so the owner's devices can be left out
      if (ML.isPremium && ML.isPremium()) daily.push('premium');
      daily.forEach(d => { cur.c[d] = (cur.c[d] || 0) + 1; });
    }
    k = clean(k); if (!k) return;
    cur.c[k] = Math.min(5000, (cur.c[k] || 0) + Math.round(n));
    write(cur);
  }
  ML.usage = bump; bump.flush = flush;

  // the id is made now, not while the page closes (a save then may never land, and the counts would go under a lost id)
  on('started', () => { if (!off()) id(); bump('start'); });
  let lastTab = null;
  on('tab', name => { if (name !== lastTab) { lastTab = name; bump('tab:' + name); } });
  on('session', s => {
    if (!s) return;
    bump('session'); bump('focus_min', s.mins || 0);
    if (s.full) bump('session_full');
    if (s.taskId) bump('session_task');
    if (s.mood) bump('mood:' + s.mood);
    if (s.world) bump('world:' + s.world + (s.light ? '_light' : ''));
    const m = s.mins || 0; bump('len:' + (m < 15 ? 'lt15' : m < 30 ? '15_29' : m < 50 ? '30_49' : m < 90 ? '50_89' : '90plus'));
  });
  on('task:done', () => bump('task_done'));
  on('rated', () => bump('rated'));
  on('block:done', () => bump('block_done'));
  on('study:session', () => bump('cards_review'));
  on('levelup', () => bump('levelup'));

  // A few buttons with no event of their own
  const BTN = { 't-shop': 'shop_open', 'gold-chip': 'shop_open', 'sound-btn': 'ui:sound', 'deep-btn': 'ui:deep', 'search-btn': 'ui:search',
    'k-btn': 'ui:search', 'quick-btn': 'ui:quick', 'float-btn': 'ui:float', 'compact-btn': 'ui:compact', 'distract-btn': 'ui:distract',
    'stuck-btn': 'ui:stuck', 'mute-btn': 'ui:mute', 'settings-btn': 'ui:settings', 't-stools': 'ui:tools', 'full-btn': 'ui:full' };
  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('[id],[data-buy]');
    if (!el) return;
    if (el.dataset.buy) bump('buy:' + el.dataset.buy.split(':')[0]);
    else if (BTN[el.id]) bump(BTN[el.id]);
  }, true);
  document.addEventListener('submit', e => { if (e.target && e.target.id === 'park-form') bump('park'); }, true);

  setInterval(() => flush(), EVERY);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(true); });

  ML.settingsSection({
    order: 97, cat: 'about',
    render: () => !BASE ? '' : `<h3>${esc(t('us_h'))}</h3>
      <label class="opt"><input type="checkbox" id="set-usage" ${S.usageOff ? '' : 'checked'}> ${esc(t('us_opt'))}</label>
      <p class="hint">${esc(t('us_d'))}</p>`,
    bind: root => {
      const c = root.querySelector('#set-usage');
      if (c) c.onchange = () => { S.usageOff = !c.checked; save(); if (S.usageOff) write(null); };
    },
  });
})();
