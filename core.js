// Shared foundation: state, persistence, translations, event bus, toasts and small helpers.
// Every other module reads and writes the one state object ML.S and calls ML.save().
window.ML = (() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const IS_EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
  // The Claude artifact build has no manifest link and its viewer blocks file downloads
  const CAN_DOWNLOAD = IS_EXT || !!document.querySelector('link[rel=manifest]');
  const KEY = 'merlins-lockin-v2', OLD_KEY = 'merlins-lockin-v1';

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

  /* ---------- Translations ---------- */
  const STR = { fr: {}, en: {} };
  function addStrings(dict) { for (const l in dict) Object.assign(STR[l] || (STR[l] = {}), dict[l]); }
  function t(key, vars) {
    let s = (STR[S.lang] && STR[S.lang][key]);
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
  function load() {
    let data = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
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
    clearTimeout(saveT);
    if (S.sessions && S.sessions.length > 4000) S.sessions = S.sessions.slice(-4000);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }
  addEventListener('pagehide', saveNow);

  /* ---------- Event bus ---------- */
  const handlers = {};
  const on = (evt, fn) => { (handlers[evt] || (handlers[evt] = [])).push(fn); };
  const emit = (evt, data) => { (handlers[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(evt, e); } }); };

  /* ---------- Toasts (queued, so messages never overwrite each other) ---------- */
  const queue = [];
  let showing = false;
  function toast(msg, opts = {}) {
    if (queue.length > 4) queue.shift();
    queue.push({ msg, opts });
    if (!showing) nextToast();
  }
  function nextToast() {
    const item = queue.shift();
    const el = $('toast');
    if (!item || !el) { showing = false; return; }
    showing = true;
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
    function hide() { clearTimeout(tm); el.classList.remove('show'); setTimeout(nextToast, 260); }
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

  return {
    $, IS_EXT, CAN_DOWNLOAD, KEY, S, pad2, dayKey, today, parseDay, addDays, hm, toMins, uid, esc, fmtMins, clamp, svgIcon,
    addStrings, t, tn, locale, applyI18n,
    defaults: fn => defaultFns.push(fn), load, replaceState, save, saveNow,
    on, emit, toast, armedButton, bgSend,
  };
})();
