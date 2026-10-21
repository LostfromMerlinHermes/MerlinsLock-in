// Shared foundation: state, persistence, translations, event bus, toasts and small helpers.
// Every other module reads and writes the one state object ML.S and calls ML.save().
window.ML = (() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const IS_EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
  // The Claude artifact build has no manifest link and its viewer blocks file downloads
  const CAN_DOWNLOAD = IS_EXT || !!document.querySelector('link[rel=manifest]');
  const GUEST_KEY = 'merlins-lockin-v2', OLD_KEY = 'merlins-lockin-v1';
  // Signed-in users get their own key ('merlins-lockin-v2:u:<id>'), so people sharing a browser never mix data.
  // The current key is mirrored in localStorage for the extension's mini popup.
  let KEY = GUEST_KEY;
  function setStorageKey(k) { KEY = k || GUEST_KEY; try { localStorage.setItem('mli-current-key', KEY); } catch (e) {} }

  /* ---------- Helpers ---------- */
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const today = () => dayKey(new Date());
  const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
  const hm = mins => pad2(Math.floor(mins / 60) % 24) + ':' + pad2(Math.round(mins % 60));
  const toMins = s => { const [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtMins = m => { m = Math.round(m); return m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? pad2(m % 60) : '') : m + 'min'; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const svgIcon = inner => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  // True when a key event belongs to text entry, so single-letter shortcuts must ignore it
  const isTyping = e => {
    if (e.isComposing || e.keyCode === 229) return true;
    const el = e.target, act = document.activeElement;
    return [el, act].some(n => n && n.nodeType === 1 && (n.isContentEditable || !!n.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')));
  };

  /* ---------- Translations ---------- */
  const STR = { fr: {}, en: {} };
  function addStrings(dict) { for (const l in dict) Object.assign(STR[l] || (STR[l] = {}), dict[l]); }
  function t(key, vars) {
    // Before the state loads (login screen) fall back to the browser language
    const lang = S.lang || ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');
    let s = (STR[lang] && STR[lang][key]);
    if (s == null) s = STR.en[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
    return s;
  }
  // "1 session" / "3 sessions": t('n_sessions', {n}) with keys n_sessions_one / n_sessions
  function tn(key, n, vars) { return t(n === 1 ? key + '_one' : key, Object.assign({ n }, vars)); }
  const locale = () => (S.lang === 'fr' ? 'fr-FR' : 'en-GB');
  function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', t(el.dataset.i18nTitle)); });
    document.documentElement.lang = S.lang;
  }

  /* ---------- State ---------- */
  // Modules register their default fields with ML.defaults(() => ({...})) before boot.
  const defaultFns = [];
  const S = {};
  function makeDefaults() { const d = {}; defaultFns.forEach(fn => Object.assign(d, fn())); return d; }
  let loadState = 'ok'; // 'ok' | 'corrupt' (the saved copy couldn't be read: this device starts like a new one)
  function load() {
    let data = null;
    let raw = null;
    loadState = 'ok';
    try {
      raw = localStorage.getItem(KEY);
      if (!raw && KEY !== GUEST_KEY) { replaceState({}); return; } // a new account starts fresh
      if (raw) {
        try { data = JSON.parse(raw); }
        catch (e) { // unreadable save: keep the raw text aside (never overwrite it) and start from the restore points / cloud
          try { localStorage.setItem('mli-corrupt:' + KEY + ':' + Date.now(), raw); } catch (e2) {}
          data = null; loadState = 'corrupt';
        }
      }
      else {
        const old = localStorage.getItem(OLD_KEY);
        if (old) {
          const o = JSON.parse(old);
          data = {};
          if (Array.isArray(o.tasks)) data.tasks = o.tasks;
          if (Array.isArray(o.log)) data.sessions = o.log.map(l => ({ at: l.at, mins: l.mins, title: l.title, mood: null, rating: null, full: true })).reverse();
          data.xp = (data.sessions || []).reduce((a, s) => a + s.mins, 0);
        }
      }
    } catch (e) {}
    replaceState(data || {});
  }
  function replaceState(data) {
    for (const k of Object.keys(S)) delete S[k];
    const d = makeDefaults();
    Object.assign(S, d, data);
    // nested objects added in later versions: keep their new default keys
    for (const k of Object.keys(d)) {
      if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) S[k] = Object.assign({}, d[k], S[k]);
    }
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 120);
  }
  function saveNow() {
    clearTimeout(saveT); saveT = null;
    if (S.sessions && S.sessions.length > 4000) S.sessions = S.sessions.slice(-4000);
    S._savedAt = Date.now();
    const json = JSON.stringify(S);
    if (!writeMain(json)) {
      // Storage full: free the space used by restore points and old copies, then try again. The live data comes first.
      try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && (k.startsWith('mli-snaps:') || k.startsWith('mli-corrupt:'))) localStorage.removeItem(k); } } catch (e) {}
      if (!writeMain(json)) { emit('save-failed'); return; }
    }
    emit('saved');
  }
  function writeMain(json) { try { localStorage.setItem(KEY, json); return localStorage.getItem(KEY) === json; } catch (e) { return false; } }
  // Write now if a save is waiting (used before syncing, so a change made a split second earlier is never skipped)
  function flushSave() { if (saveT) saveNow(); }
  addEventListener('pagehide', saveNow);

  /* ---------- Event bus ---------- */
  const handlers = {};
  const on = (evt, fn) => { (handlers[evt] || (handlers[evt] = [])).push(fn); };
  const emit = (evt, data) => { (handlers[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(evt, e); } }); };

  /* ---------- Toasts (queued, so messages never overwrite each other) ---------- */
  // opts.key: a status message about one thing (e.g. the day / night toggle). A newer one with the same key
  // replaces the one on screen and any waiting in the queue, so a burst of taps never shows stale labels.
  const queue = [];
  let showing = false, current = null, restart = null;
  function toast(msg, opts = {}) {
    if (opts.key) {
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].opts.key === opts.key) queue.splice(i, 1);
      if (current && current.opts.key === opts.key && restart) { current.msg = msg; restart(); return; }
    }
    if (queue.length > 4) queue.shift();
    queue.push({ msg, opts });
    if (!showing) nextToast();
  }
  function nextToast() {
    const item = queue.shift();
    const el = $('toast');
    current = null; restart = null;
    if (!item || !el) { showing = false; return; }
    showing = true; current = item;
    el.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = item.msg;
    el.appendChild(span);
    if (item.opts.action) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'small primary'; b.textContent = item.opts.action.label;
      b.onclick = () => { item.opts.action.fn(); hide(); };
      el.appendChild(b);
    }
    el.classList.toggle('has-action', !!item.opts.action);
    el.classList.add('show');
    const ms = item.opts.ms || (item.opts.action ? 7000 : 2800);
    let tm = setTimeout(hide, ms);
    restart = () => { span.textContent = item.msg; clearTimeout(tm); tm = setTimeout(hide, ms); };
    function hide() { clearTimeout(tm); restart = null; el.classList.remove('show'); setTimeout(nextToast, 260); }
  }

  // Two-tap confirm, since confirm() dialogs are blocked inside Claude artifacts.
  function armedButton(btn, labelKey, action) {
    let armed = false, tm;
    btn.addEventListener('click', () => {
      if (!armed) { armed = true; btn.textContent = t('tap_again'); tm = setTimeout(() => { armed = false; btn.textContent = t(labelKey); }, 3000); return; }
      clearTimeout(tm); armed = false; btn.textContent = t(labelKey); action();
    });
  }

  function bgSend(msg) {
    if (!IS_EXT) return;
    try { const p = chrome.runtime.sendMessage(msg); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }

  // Reduced motion, in one place: CSS animations are switched off by the @media rule at the end of app.css;
  // anything animated from JS (canvases, SVG <animate>, transitions) asks ML.reducedMotion() and listens to
  // the 'motion' event, which fires when the system setting changes while the app is open.
  const motionMq = matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionMq.matches;
  const syncMotion = () => document.documentElement.classList.toggle('reduce-motion', motionMq.matches);
  syncMotion();
  const onMotion = () => { syncMotion(); emit('motion', motionMq.matches); };
  if (motionMq.addEventListener) motionMq.addEventListener('change', onMotion); else if (motionMq.addListener) motionMq.addListener(onMotion);

  return {
    $, IS_EXT, CAN_DOWNLOAD, GUEST_KEY, reducedMotion, S, storageKey: () => KEY, setStorageKey, pad2, dayKey, today, parseDay, addDays, hm, toMins, uid, esc, fmtMins, clamp, svgIcon, isTyping,
    addStrings, t, tn, locale, applyI18n,
    defaults: fn => defaultFns.push(fn), load, loadState: () => loadState, replaceState, save, saveNow, flushSave, savePending: () => !!saveT,
    on, emit, toast, armedButton, bgSend,
  };
})();
