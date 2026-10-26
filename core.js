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
  // True when a key event belongs to text entry, so single-letter shortcuts must ignore it.
  // Also true for 1.5 s after typing if the field lost focus (a re-render took it away): those keys were meant for the text.
  const FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
  let typedAt = 0;
  document.addEventListener('input', e => { if (e.target && e.target.closest && e.target.closest(FIELD)) typedAt = Date.now(); }, true);
  const isTyping = e => {
    if (e.isComposing || e.keyCode === 229) return true;
    const el = e.target, act = document.activeElement;
    if ([el, act].some(n => n && n.nodeType === 1 && (n.isContentEditable || !!n.closest(FIELD)))) return true;
    return Date.now() - typedAt < 1500 && (!act || act === document.body);
  };
  // Re-rendering a container with innerHTML wipes what the user is typing in it. keepInputs runs the re-render,
  // then puts back form fields the user changed (only those: values that come from the state are left alone),
  // the focus and the caret. Use it for background re-renders (the 'render' event, minute ticks), not after an action.
  const keepInputs = (root, fn) => {
    if (!root) return fn();
    const forms = r => [...r.querySelectorAll('form')];
    const keyOf = (el, r) => {
      const name = el.name || el.id; if (!name) return null;
      const f = el.form; if (!f || !r.contains(f)) return el.id ? '#' + el.id : null;
      const owner = f.closest('[data-id]');
      const fk = f.id || f.className + ':' + (f.dataset.id || (owner && owner.dataset.id) || forms(r).indexOf(f));
      return fk + '|' + name + (el.type === 'radio' ? '=' + el.value : '');
    };
    const dirty = el => el.type === 'checkbox' || el.type === 'radio' ? el.checked !== el.defaultChecked
      : el.tagName === 'SELECT' ? [...el.options].some(o => o.selected !== o.defaultSelected)
      : el.value !== el.defaultValue;
    const saved = [];
    forms(root).forEach(f => [...f.elements].forEach(el => {
      if (!el.name || /^(submit|button|file|hidden)$/.test(el.type) || !dirty(el)) return;
      const k = keyOf(el, root); if (k) saved.push([k, el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value]);
    }));
    const act = document.activeElement, hasFocus = act && act !== document.body && root.contains(act) && act.matches(FIELD);
    const focus = hasFocus && { k: keyOf(act, root), s: act.selectionStart, e: act.selectionEnd, top: act.scrollTop };
    const out = fn();
    const find = k => [...root.querySelectorAll('input, textarea, select')].find(el => keyOf(el, root) === k);
    saved.forEach(([k, v]) => { const el = find(k); if (!el) return; if (typeof v === 'boolean') el.checked = v; else el.value = v; });
    if (focus && focus.k && document.activeElement !== act) {
      const el = find(focus.k);
      if (el) {
        el.focus({ preventScroll: true });
        try { if (focus.s != null) el.setSelectionRange(focus.s, focus.e); } catch (err) {} // not every input type has a caret
        el.scrollTop = focus.top;
      }
    }
    return out;
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
  // iOS often kills an installed web app in the background without a pagehide: write a pending save on the way out
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });

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
    // a thin bar that empties over the toast's lifetime (CSS animation, so reduced motion stops it)
    const bar = document.createElement('i'); bar.className = 'toast-bar'; bar.setAttribute('aria-hidden', 'true'); bar.style.animationDuration = ms + 'ms';
    el.appendChild(bar);
    let tm = setTimeout(hide, ms);
    restart = () => { span.textContent = item.msg; clearTimeout(tm); tm = setTimeout(hide, ms); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; bar.style.animationDuration = ms + 'ms'; };
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
  // The app has its own "reduced animations" switch too (per device, localStorage 'mli-motion'), on top of the
  // system setting; html.reduce-motion carries either one to the CSS (rule at the end of app.css).
  const motionMq = matchMedia('(prefers-reduced-motion: reduce)');
  const motionPref = () => { try { return localStorage.getItem('mli-motion') === 'reduce'; } catch (e) { return false; } };
  const reducedMotion = () => motionMq.matches || motionPref();
  const syncMotion = () => document.documentElement.classList.toggle('reduce-motion', reducedMotion());
  syncMotion();
  const onMotion = () => { syncMotion(); emit('motion', reducedMotion()); };
  if (motionMq.addEventListener) motionMq.addEventListener('change', onMotion); else if (motionMq.addListener) motionMq.addListener(onMotion);
  const setReducedMotion = on => { try { if (on) localStorage.setItem('mli-motion', 'reduce'); else localStorage.removeItem('mli-motion'); } catch (e) {} onMotion(); };

  return {
    $, IS_EXT, CAN_DOWNLOAD, GUEST_KEY, reducedMotion, setReducedMotion, motionPref, S, storageKey: () => KEY, setStorageKey, pad2, dayKey, today, parseDay, addDays, hm, toMins, uid, esc, fmtMins, clamp, svgIcon, isTyping, keepInputs,
    addStrings, t, tn, locale, applyI18n,
    defaults: fn => defaultFns.push(fn), load, loadState: () => loadState, replaceState, save, saveNow, flushSave, savePending: () => !!saveT,
    on, emit, toast, armedButton, bgSend,
  };
})();
