// Lists and sticky notes (3.108, picks A1 B1 B3 C1 D1 E1 from proposals/listes).
// Lists: a Tasks / Lists switch on top of the Plan. A list is a title and lines with a box (S.lists); ticked lines sink
// to the bottom, "Uncheck all" resets a list for next week, "Clear checked" removes them. One reminder per list
// (tonight, tomorrow, Saturday or a chosen time, optionally every week), fed to calendar.js through ML.remSources so it
// uses the calendar's in-page check and the extension alarms. A line holding a phone number gets a Call button.
// Sticky notes (S.postits): a row on Today by default; each note can be dragged (mouse) or moved from its editor to
// the timer card, where it floats where you drop it, or hidden. Three looks (paper, tinted, tape), changeable any
// time from a note's editor or Settings > Look (S.postitLook, on <html data-pilook>).
(() => {
  'use strict';
  const { $, S, t, esc, on, uid, toast } = ML;
  const save = () => ML.save();

  ML.addStrings({
    fr: {
      ls_tasks: 'Tâches', ls_lists: 'Listes', ls_new: 'Nouvelle liste', ls_untitled: 'Liste', ls_n: '{d} sur {n}', ls_empty: 'Aucune liste. Courses, valise, choses à appeler…',
      ls_add_ph: 'Ajouter…', ls_add: 'Ajouter', ls_back: 'Toutes les listes', ls_title_ph: 'Nom de la liste', ls_uncheck: 'Tout décocher', ls_clear: 'Effacer les cochées', ls_cleared: '{n} ligne(s) effacée(s).',
      ls_del: 'Supprimer la liste', ls_deleted: 'Liste supprimée.', ls_undo: 'Annuler', ls_x: 'Retirer', ls_all_done: 'Tout est coché.',
      ls_remind: 'Rappel', ls_r_tonight: 'Ce soir 18:00', ls_r_tomorrow: 'Demain 9:00', ls_r_sat: 'Samedi 10:00', ls_r_other: 'Autre', ls_r_repeat: 'Répéter', ls_r_never: 'Jamais', ls_r_week: 'Chaque semaine',
      ls_r_off: 'Sans rappel', ls_r_tom: 'Demain {time}', ls_rem_body: '{title} · {n} restant(s)', ls_open: 'Ouvrir', ls_call: 'Appeler',
      pi_name: 'Pense-bête', pi_add: 'Pense-bête', pi_ph: 'Écris ici…', pi_where: 'Où', pi_today: 'Aujourd’hui', pi_timer: 'Minuteur', pi_hidden: 'Caché', pi_hidden_n: '{n} caché(s)', pi_hide_hidden: 'Masquer les cachés',
      pi_look: 'Style', pi_paper: 'Papier', pi_tint: 'Teinté', pi_tape: 'Scotch', pi_color: 'Couleur', pi_del: 'Décoller', pi_ok: 'OK', pi_on_timer: 'Collé sur le minuteur.',
      pi_set_h: 'Pense-bêtes', pi_set_d: 'Le style des pense-bêtes. Tu peux le changer quand tu veux.', pi_c_y: 'Jaune', pi_c_p: 'Rose', pi_c_b: 'Bleu', pi_c_g: 'Vert',
    },
    en: {
      ls_tasks: 'Tasks', ls_lists: 'Lists', ls_new: 'New list', ls_untitled: 'List', ls_n: '{d} of {n}', ls_empty: 'No lists yet. Groceries, packing, people to call…',
      ls_add_ph: 'Add…', ls_add: 'Add', ls_back: 'All lists', ls_title_ph: 'List name', ls_uncheck: 'Uncheck all', ls_clear: 'Clear checked', ls_cleared: '{n} line(s) cleared.',
      ls_del: 'Delete list', ls_deleted: 'List deleted.', ls_undo: 'Undo', ls_x: 'Remove', ls_all_done: 'All checked.',
      ls_remind: 'Reminder', ls_r_tonight: 'Tonight 18:00', ls_r_tomorrow: 'Tomorrow 9:00', ls_r_sat: 'Saturday 10:00', ls_r_other: 'Other', ls_r_repeat: 'Repeat', ls_r_never: 'Never', ls_r_week: 'Every week',
      ls_r_off: 'No reminder', ls_r_tom: 'Tomorrow {time}', ls_rem_body: '{title} · {n} left', ls_open: 'Open', ls_call: 'Call',
      pi_name: 'Sticky note', pi_add: 'Sticky note', pi_ph: 'Write here…', pi_where: 'Where', pi_today: 'Today', pi_timer: 'Timer', pi_hidden: 'Hidden', pi_hidden_n: '{n} hidden', pi_hide_hidden: 'Hide hidden ones',
      pi_look: 'Style', pi_paper: 'Paper', pi_tint: 'Tinted', pi_tape: 'Tape', pi_color: 'Colour', pi_del: 'Remove', pi_ok: 'OK', pi_on_timer: 'Stuck on the timer.',
      pi_set_h: 'Sticky notes', pi_set_d: 'How sticky notes look. You can change it any time.', pi_c_y: 'Yellow', pi_c_p: 'Pink', pi_c_b: 'Blue', pi_c_g: 'Green',
    },
  });
  ML.defaults(() => ({ lists: [], postits: [], postitLook: 'paper' }));

  const svg = (p, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const I_BELL = '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>', I_BACK = '<path d="M15 5l-7 7 7 7"/>', I_CAR = '<path d="M9 6l6 6-6 6"/>';
  const I_X = '<path d="M7 7l10 10M17 7L7 17"/>', I_PHONE = '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>';
  const DAY = 864e5, WEEK = 7 * DAY;
  const lists = () => (Array.isArray(S.lists) ? S.lists : (S.lists = []));
  const notes = () => (Array.isArray(S.postits) ? S.postits : (S.postits = []));
  const byId = id => lists().find(l => l.id === id);
  const left = l => (l.items || []).filter(i => !i.done).length;
  const devGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const devSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ---------- Times ---------- */
  const hmOf = d => d.toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' });
  const startOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  function whenTxt(ms) {
    const d = new Date(ms), days = Math.round((startOf(d) - startOf(new Date())) / DAY);
    if (days === 0) return hmOf(d);
    if (days === 1) return t('ls_r_tom', { time: hmOf(d) });
    if (days > 1 && days < 7) return d.toLocaleDateString(ML.locale(), { weekday: 'short' }) + ' ' + hmOf(d);
    return d.toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }) + ' ' + hmOf(d);
  }
  // The next time a list rings (null when it already rang and does not repeat)
  function nextAt(l) {
    const r = l.remind; if (!r || !r.at) return null;
    const now = Date.now(); let a = r.at;
    if (r.week) { while (a < now) a += WEEK; return a; }
    return a > now - 60000 ? a : null;
  }
  function presets() {
    const now = new Date(), out = [];
    const at = (d, h, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x.getTime(); };
    if (now.getHours() < 18) out.push(['ls_r_tonight', at(now, 18)]);
    out.push(['ls_r_tomorrow', at(new Date(+now + DAY), 9)]);
    const sat = new Date(now); sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
    let s = at(sat, 10); if (s <= +now) s += WEEK;
    if (s - +now > DAY * 1.5) out.push(['ls_r_sat', s]);
    return out;
  }
  const localInput = ms => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

  // A phone number in a line: "+33 6 12 34 56 78", "01 42 00 00 00", "06-12-34-56-78" (8 digits at least)
  function phoneOf(s) {
    const m = /(?:\+|\b0)\d[\d .\-]{6,}\d/.exec(s || ''); if (!m) return '';
    const n = m[0].replace(/[^\d+]/g, '');
    return n.replace(/\D/g, '').length >= 8 ? n : '';
  }

  /* ---------- Reminders, through calendar.js ---------- */
  (ML.remSources = ML.remSources || []).push(days => {
    const out = [], now = Date.now(), end = now + days * DAY;
    lists().forEach(l => {
      const r = l.remind, n = left(l); if (!r || !r.at || !n) return;
      let a = r.at;
      if (r.week) while (a < now - 12 * 36e5) a += WEEK;
      for (; a <= end; a += WEEK) {
        const title = l.title || t('ls_untitled');
        // startAt is the end of the catch-up window: an app opened later the same day still says it
        out.push({ key: 'ls:' + l.id + '@' + a, when: a, startAt: a + 12 * 36e5, title, body: t('ls_rem_body', { title, n }), open: () => openList(l.id) });
        if (!r.week) break;
      }
    });
    return out;
  });
  const reschedule = () => { if (ML.scheduleReminders) ML.scheduleReminders(); };

  /* ---------- Plan: Tasks / Lists ---------- */
  const tabPlan = $('tab-plan');
  const seg = document.createElement('div'); seg.className = 'seg-toggle ls-seg'; seg.setAttribute('role', 'group');
  const root = document.createElement('div'); root.className = 'ls-root'; root.id = 'lists-root'; root.hidden = true;
  tabPlan.prepend(seg); seg.after(root);
  let mode = devGet('mli-planseg') === 'lists' ? 'lists' : 'tasks', openId = null, bellOpen = false, armDel = 0;

  function renderSeg() {
    const h = ['tasks', 'lists'].map(k => `<button type="button" data-lsmode="${k}" aria-pressed="${mode === k}">${esc(t('ls_' + k))}</button>`).join('');
    if (seg.dataset.h !== h) { seg.innerHTML = h; seg.dataset.h = h; }
    seg.setAttribute('aria-label', t('ls_tasks') + ' / ' + t('ls_lists'));
  }
  function applyMode() {
    const lm = mode === 'lists';
    tabPlan.classList.toggle('ls-on', lm); root.hidden = !lm;
    document.documentElement.classList.toggle('ls-mode', lm && S.tab === 'plan');
    renderSeg(); if (lm) render();
    ML.emit('lists:mode', lm); // nav.js: the phone's Tasks / Lists / Calendar switch under the title
  }
  function setMode(m) { if (m === mode) return applyMode(); mode = m; devSet('mli-planseg', m); if (m === 'tasks') { openId = null; bellOpen = false; } applyMode(); }
  ML.listsOn = () => mode === 'lists';
  ML.setListsMode = setMode;
  seg.addEventListener('click', e => { const b = e.target.closest('[data-lsmode]'); if (b) { ML.emit('gesture'); setMode(b.dataset.lsmode); } });
  function openList(id) {
    openId = id; bellOpen = false; mode = 'lists'; devSet('mli-planseg', 'lists');
    if (S.tab !== 'plan') ML.setTab('plan');
    applyMode();
  }
  ML.openList = openList;

  const itemRow = (l, i) => {
    const ph = !i.done && phoneOf(i.t);
    return `<li class="ls-it${i.done ? ' done' : ''}" data-id="${i.id}"><button type="button" class="ls-box" role="checkbox" aria-checked="${!!i.done}" data-ltick aria-label="${esc(i.t)}"></button>`
      + `<input class="ls-txt" id="ls-i-${i.id}" data-ledit value="${esc(i.t)}" maxlength="120" aria-label="${esc(i.t)}" autocomplete="off">`
      + (ph ? `<a class="ls-call" href="tel:${esc(ph)}">${svg(I_PHONE)}${esc(t('ls_call'))}</a>` : '')
      + `<button type="button" class="ghost icon-only ls-x" data-lx aria-label="${esc(t('ls_x'))}" title="${esc(t('ls_x'))}">${svg(I_X)}</button></li>`;
  };
  function remindPanel(l) {
    const r = l.remind || {}, cur = nextAt(l);
    const chips = presets().map(([k, ms]) => `<button type="button" class="ls-chip" data-rset="${ms}" aria-pressed="${cur === ms}">${esc(t(k))}</button>`).join('');
    return `<div class="ls-rem">
      <div class="ls-chips">${chips}<label class="ls-chip ls-other"><span>${esc(t('ls_r_other'))}</span><input type="datetime-local" id="ls-dt" value="${cur ? localInput(cur) : ''}"></label></div>
      <div class="ls-rrow"><span class="label">${esc(t('ls_r_repeat'))}</span><div class="seg-toggle" role="group" aria-label="${esc(t('ls_r_repeat'))}"><button type="button" data-rweek="0" aria-pressed="${!r.week}">${esc(t('ls_r_never'))}</button><button type="button" data-rweek="1" aria-pressed="${!!r.week}">${esc(t('ls_r_week'))}</button></div></div>
      ${l.remind ? `<button type="button" class="link ls-roff" data-roff>${esc(t('ls_r_off'))}</button>` : ''}
    </div>`;
  }
  function overview() {
    const ls = lists();
    const cards = ls.map(l => {
      const n = (l.items || []).length, d = n - left(l), at = nextAt(l);
      return `<button type="button" class="ls-card" data-lopen="${l.id}"><span class="ls-ct"><b>${esc(l.title || t('ls_untitled'))}</b><small>${esc(t('ls_n', { d, n }))}</small></span>`
        + (at ? `<span class="ls-bell">${svg(I_BELL)}${esc(whenTxt(at))}</span>` : '') + svg(I_CAR, 'ls-car') + '</button>';
    }).join('');
    return `<div class="ls-cards">${cards}</div>${ls.length ? '' : `<p class="hint ls-hint">${esc(t('ls_empty'))}</p>`}<button type="button" class="ls-new" data-lnew>+ ${esc(t('ls_new'))}</button>`;
  }
  function detail(l) {
    const items = l.items || [], open = items.filter(i => !i.done), done = items.filter(i => i.done), at = nextAt(l);
    return `<div class="ls-top"><button type="button" class="ghost icon-only" data-lback aria-label="${esc(t('ls_back'))}" title="${esc(t('ls_back'))}">${svg(I_BACK)}</button>`
      + `<input class="ls-title" id="ls-title" value="${esc(l.title || '')}" placeholder="${esc(t('ls_title_ph'))}" maxlength="60" aria-label="${esc(t('ls_title_ph'))}" autocomplete="off">`
      + `<button type="button" class="ghost icon-only ls-bellb${l.remind ? ' on' : ''}" data-lbell aria-expanded="${bellOpen}" aria-label="${esc(t('ls_remind'))}" title="${esc(t('ls_remind'))}">${svg(I_BELL)}</button></div>`
      + (bellOpen ? remindPanel(l) : at ? `<button type="button" class="ls-rline" data-lbell>${svg(I_BELL)}<span>${esc(whenTxt(at))}${l.remind.week ? ' · ' + esc(t('ls_r_week')) : ''}</span></button>` : '')
      + `<ul class="ls-items">${open.map(i => itemRow(l, i)).join('')}</ul>`
      + `<form class="ls-add" id="ls-add" autocomplete="off"><input id="ls-add-in" name="it" maxlength="120" placeholder="${esc(t('ls_add_ph'))}" aria-label="${esc(t('ls_add_ph'))}"><button type="submit" class="small">${esc(t('ls_add'))}</button></form>`
      + (done.length ? `<div class="ls-sep"></div>${open.length ? '' : `<p class="hint">${esc(t('ls_all_done'))}</p>`}<ul class="ls-items">${done.map(i => itemRow(l, i)).join('')}</ul>`
        + `<div class="ls-acts"><button type="button" class="link" data-luncheck>${esc(t('ls_uncheck'))}</button><button type="button" class="link ls-dim" data-lclear>${esc(t('ls_clear'))}</button></div>` : '')
      + `<button type="button" class="link ls-del" data-ldel>${esc(t(armDel ? 'tap_again' : 'ls_del'))}</button>`;
  }
  function render() {
    if (mode !== 'lists') return;
    let l = openId && byId(openId); if (openId && !l) openId = null; // gone after a sync
    const h = `<div class="ls-wrap">${l ? detail(l) : overview()}</div>`;
    if (root.dataset.h !== h) ML.keepInputs(root, () => { root.innerHTML = h; root.dataset.h = h; });
  }
  const refocus = id => { const el = $(id); if (el) el.focus(); };
  const commit = () => { save(); render(); };

  root.addEventListener('click', e => {
    const b = e.target.closest('button, a'); if (!b || !root.contains(b)) return;
    const l = openId && byId(openId), it = b.closest('[data-id]'), item = l && it && (l.items || []).find(i => i.id === it.dataset.id);
    if (b.dataset.lopen) { openId = b.dataset.lopen; bellOpen = false; armDel = 0; render(); window.scrollTo({ top: 0 }); return; }
    if ('lnew' in b.dataset) { const n = { id: uid(), title: '', items: [], remind: null, at: Date.now() }; lists().push(n); openId = n.id; commit(); refocus('ls-title'); return; }
    if (!l) return;
    if ('lback' in b.dataset) { openId = null; bellOpen = false; armDel = 0; render(); return; }
    if ('lbell' in b.dataset) { bellOpen = !bellOpen; render(); return; }
    if (b.dataset.rset) { l.remind = { at: +b.dataset.rset, week: !!(l.remind && l.remind.week) }; bellOpen = false; commit(); reschedule(); toast(t('ls_remind') + ' · ' + whenTxt(+b.dataset.rset), { ms: 2200 }); return; }
    if (b.dataset.rweek != null) { const at = nextAt(l) || presets()[0][1]; l.remind = { at, week: b.dataset.rweek === '1' }; commit(); reschedule(); return; }
    if ('roff' in b.dataset) { l.remind = null; bellOpen = false; commit(); reschedule(); return; }
    if ('ltick' in b.dataset && item) { ML.emit('gesture'); item.done = !item.done; commit(); reschedule(); return; }
    if ('lx' in b.dataset && item) { l.items = l.items.filter(i => i !== item); commit(); return; }
    if ('luncheck' in b.dataset) { l.items.forEach(i => { i.done = false; }); commit(); reschedule(); return; }
    if ('lclear' in b.dataset) {
      const gone = l.items.filter(i => i.done), keep = l.items.filter(i => !i.done); l.items = keep; commit();
      toast(t('ls_cleared', { n: gone.length }), { ms: 5000, key: 'ls-undo', action: { label: t('ls_undo'), fn: () => { const x = byId(l.id); if (x) { x.items.push(...gone); commit(); } } } });
      return;
    }
    if ('ldel' in b.dataset) {
      if (!armDel) { armDel = setTimeout(() => { armDel = 0; render(); }, 6000); render(); return; }
      clearTimeout(armDel); armDel = 0;
      const idx = lists().indexOf(l); lists().splice(idx, 1); openId = null; commit(); reschedule();
      toast(t('ls_deleted'), { ms: 6000, key: 'ls-undo', action: { label: t('ls_undo'), fn: () => { lists().splice(Math.min(idx, lists().length), 0, l); openId = l.id; commit(); reschedule(); } } });
    }
  });
  root.addEventListener('submit', e => {
    if (e.target.id !== 'ls-add') return; e.preventDefault();
    const l = byId(openId), inp = $('ls-add-in'), v = inp.value.trim(); if (!l || !v) return;
    (l.items = l.items || []).push({ id: uid(), t: v.slice(0, 120), done: false });
    inp.value = ''; commit(); reschedule(); refocus('ls-add-in');
  });
  root.addEventListener('change', e => {
    const l = byId(openId); if (!l) return;
    const el = e.target;
    if (el.id === 'ls-title') { l.title = el.value.trim().slice(0, 60); save(); reschedule(); return; }
    if (el.id === 'ls-dt') { const ms = new Date(el.value).getTime(); if (!ms || ms < Date.now()) return; l.remind = { at: ms, week: !!(l.remind && l.remind.week) }; bellOpen = false; commit(); reschedule(); return; }
    if ('ledit' in el.dataset) {
      const it = el.closest('[data-id]'), item = it && (l.items || []).find(i => i.id === it.dataset.id); if (!item) return;
      const v = el.value.trim();
      if (!v) l.items = l.items.filter(i => i !== item); else item.t = v.slice(0, 120);
      commit();
    }
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.target.id === 'ls-title' || 'ledit' in e.target.dataset)) { e.preventDefault(); e.target.blur(); if (e.target.id === 'ls-title') refocus('ls-add-in'); }
  });

  /* ---------- Sticky notes ---------- */
  const COLORS = ['y', 'p', 'b', 'g'], LOOKS = ['paper', 'tint', 'tape'], PLACES = ['today', 'timer', 'hidden'];
  const look = () => (LOOKS.includes(S.postitLook) ? S.postitLook : 'paper');
  const applyLook = () => { document.documentElement.dataset.pilook = look(); };
  const zone = document.createElement('div'); zone.id = 'postits'; zone.className = 'pi-zone';
  const float = document.createElement('div'); float.id = 'pi-float'; float.className = 'pi-floats';
  const editor = document.createElement('div'); editor.id = 'pi-editor'; editor.className = 'pi-editor'; editor.hidden = true; editor.setAttribute('role', 'dialog');
  document.body.append(editor);
  let editId = null, showHidden = false;

  const noteHtml = (n, cls = '') => `<div class="pi pi-${COLORS.includes(n.c) ? n.c : 'y'}${cls}" data-pid="${n.id}" role="button" tabindex="0" aria-label="${esc(t('pi_name') + ': ' + (n.text || ''))}"><span class="pi-t">${esc(n.text || '…')}</span></div>`;
  function renderZone() {
    const all = notes(), td = all.filter(n => (n.place || 'today') === 'today'), hid = all.filter(n => n.place === 'hidden');
    const shown = td.map(n => noteHtml(n)).join('') + (showHidden ? hid.map(n => noteHtml(n, ' pi-hid')).join('') : '');
    const h = (shown ? `<div class="pi-row">${shown}</div>` : '')
      + `<div class="pi-foot"><button type="button" class="pi-new" data-pnew>+ ${esc(t('pi_add'))}</button>`
      + (hid.length ? `<button type="button" class="link pi-hidl" data-phid>${esc(showHidden ? t('pi_hide_hidden') : t('pi_hidden_n', { n: hid.length }))}</button>` : '') + '</div>';
    if (zone.dataset.h !== h) { zone.innerHTML = h; zone.dataset.h = h; }
  }
  function renderFloat() {
    const card = $('sigil-card'); if (!card) return;
    if (float.parentElement !== card) card.append(float);
    const h = notes().filter(n => n.place === 'timer').map(n => noteHtml(n, ' pi-float')).join('');
    if (float.dataset.h !== h) { float.innerHTML = h; float.dataset.h = h; }
    float.querySelectorAll('[data-pid]').forEach(el => {
      const n = notes().find(x => x.id === el.dataset.pid); if (!n) return;
      el.style.left = (ML.clamp(n.x ?? 0.02, 0, 0.9) * 100) + '%'; el.style.top = (ML.clamp(n.y ?? 0.2, 0, 0.92) * 100) + '%';
    });
  }
  function renderNotes() { applyLook(); renderZone(); renderFloat(); if (editId) renderEditor(); }
  // today.js keeps a slot for the row and calls this after drawing Today
  ML.placePostits = () => { const slot = $('today-postits'); if (slot && zone.parentElement !== slot) slot.append(zone); renderZone(); };
  ML.postitZone = zone;

  function renderEditor() {
    const n = notes().find(x => x.id === editId); if (!n) { closeEditor(); return; }
    const seg3 = (key, vals, cur, lab) => `<div class="pi-er"><span class="label">${esc(t(lab))}</span><div class="seg-toggle" role="group" aria-label="${esc(t(lab))}">${vals.map(v => `<button type="button" data-${key}="${v}" aria-pressed="${cur === v}">${esc(t('pi_' + v))}</button>`).join('')}</div></div>`;
    const ta = editor.querySelector('#pi-ta'), keepText = ta && document.activeElement === ta;
    const h = `<div class="pi-ewrap pi pi-${n.c || 'y'}"><textarea id="pi-ta" maxlength="200" rows="4" placeholder="${esc(t('pi_ph'))}" aria-label="${esc(t('pi_name'))}"></textarea></div>
      <div class="pi-er"><span class="label">${esc(t('pi_color'))}</span><div class="pi-sws">${COLORS.map(c => `<button type="button" class="pi-sw pi-${c}" data-pc="${c}" aria-pressed="${n.c === c}" aria-label="${esc(t('pi_c_' + c))}" title="${esc(t('pi_c_' + c))}"></button>`).join('')}</div></div>
      ${seg3('pplace', PLACES, n.place || 'today', 'pi_where')}
      ${seg3('plook', LOOKS, look(), 'pi_look')}
      <div class="pi-eb"><button type="button" class="link ls-dim" data-pdel>${esc(t('pi_del'))}</button><button type="button" class="primary small" data-pok>${esc(t('pi_ok'))}</button></div>`;
    if (editor.dataset.h !== h) {
      const val = ta ? ta.value : n.text || '';
      editor.innerHTML = h; editor.dataset.h = h;
      const nta = editor.querySelector('#pi-ta'); nta.value = val;
      if (keepText) nta.focus();
    }
    editor.setAttribute('aria-label', t('pi_name'));
  }
  function openEditor(id) {
    editId = id; editor.dataset.h = ''; editor.hidden = false; renderEditor();
    const ta = editor.querySelector('#pi-ta'); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }
  function closeEditor() {
    const n = editId && notes().find(x => x.id === editId);
    if (n) { const ta = editor.querySelector('#pi-ta'); if (ta) n.text = ta.value.trim().slice(0, 200); if (!n.text) S.postits = notes().filter(x => x !== n); save(); }
    editId = null; editor.hidden = true; editor.innerHTML = ''; editor.dataset.h = '';
    renderZone(); renderFloat();
  }
  editor.addEventListener('input', e => { const n = notes().find(x => x.id === editId); if (n && e.target.id === 'pi-ta') { n.text = e.target.value.slice(0, 200); save(); renderZone(); renderFloat(); } });
  editor.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const n = notes().find(x => x.id === editId); if (!n) return;
    if (b.dataset.pc) { n.c = b.dataset.pc; save(); renderNotes(); }
    else if (b.dataset.pplace) { moveTo(n, b.dataset.pplace); renderNotes(); }
    else if (b.dataset.plook) { S.postitLook = b.dataset.plook; save(); renderNotes(); }
    else if ('pdel' in b.dataset) {
      const idx = notes().indexOf(n); S.postits = notes().filter(x => x !== n); editId = null; editor.hidden = true; editor.innerHTML = ''; save(); renderNotes();
      if (n.text) toast(t('pi_del'), { ms: 5000, key: 'pi-undo', action: { label: t('ls_undo'), fn: () => { notes().splice(idx, 0, n); save(); renderNotes(); } } });
    } else if ('pok' in b.dataset) closeEditor();
  });
  editor.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeEditor(); } });
  document.addEventListener('pointerdown', e => { if (editId && !editor.contains(e.target) && !e.target.closest('[data-pid]')) closeEditor(); }, true);

  function moveTo(n, place, x, y) {
    if (place === 'timer' && !(x == null && n.place === 'timer')) {
      // beside the dial: left, then right, then lower down
      if (x == null) { const k = notes().filter(o => o.place === 'timer' && o !== n).length; x = k % 2 ? 0.7 : 0.02; y = 0.2 + Math.floor(k / 2) * 0.13; }
      n.x = x; n.y = y;
    }
    n.place = place; save();
  }

  // Taps open the editor; a mouse drag moves a note onto the timer card (where it stays where dropped) or back to Today.
  // On touch screens a note on the timer card can be dragged around it; notes on Today move from the editor.
  let drag = null;
  function onDown(e) {
    const el = e.target.closest('[data-pid]'); if (!el || e.button > 0) return;
    if (el.closest('#pi-editor')) return;
    const onTimer = el.classList.contains('pi-float');
    if (e.pointerType === 'touch' && !onTimer) { drag = { el, id: el.dataset.pid, x0: e.clientX, y0: e.clientY, tap: true, noDrag: true }; return; }
    drag = { el, id: el.dataset.pid, x0: e.clientX, y0: e.clientY, tap: true, onTimer };
    if (onTimer) e.preventDefault();
  }
  function onMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (drag.tap && Math.hypot(dx, dy) < 6) return;
    if (drag.noDrag) { drag = null; return; }
    if (drag.tap) {
      drag.tap = false;
      const r = drag.el.getBoundingClientRect();
      drag.ox = drag.x0 - r.left; drag.oy = drag.y0 - r.top;
      const g = drag.el.cloneNode(true); g.classList.add('pi-ghost'); g.classList.remove('pi-float'); g.style.width = r.width + 'px'; g.style.left = g.style.top = '';
      document.body.append(g); drag.g = g; drag.el.classList.add('pi-lifted');
      document.documentElement.classList.add('pi-dragging');
    }
    drag.g.style.transform = `translate(${e.clientX - drag.ox}px, ${e.clientY - drag.oy}px)`;
    const card = $('sigil-card'), cr = card && card.getBoundingClientRect(), zr = zone.isConnected && zone.getBoundingClientRect();
    const inside = (r) => r && r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (card) card.classList.toggle('pi-drop', inside(cr));
    zone.classList.toggle('pi-drop', inside(zr));
  }
  function onUp(e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.tap) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) openEditor(d.id); return; }
    if (d.noDrag) return;
    document.documentElement.classList.remove('pi-dragging');
    const card = $('sigil-card'); if (card) card.classList.remove('pi-drop'); zone.classList.remove('pi-drop');
    if (d.g) d.g.remove(); d.el.classList.remove('pi-lifted');
    const n = notes().find(x => x.id === d.id); if (!n) return;
    const cr = card && card.getBoundingClientRect(), zr = zone.isConnected && zone.getBoundingClientRect();
    const inside = (r) => r && r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside(cr)) {
      const w = d.el.getBoundingClientRect().width;
      const x = ML.clamp((e.clientX - d.ox - cr.left) / cr.width, 0, 1 - w / cr.width), y = ML.clamp((e.clientY - d.oy - cr.top) / cr.height, 0, 0.92);
      const was = n.place; moveTo(n, 'timer', x, y);
      if (was !== 'timer') toast(t('pi_on_timer'), { ms: 1800 });
    } else if (inside(zr)) {
      // dropped on the Today row: there, before the note under the pointer
      const over = [...zone.querySelectorAll('[data-pid]')].find(x => { const r = x.getBoundingClientRect(); return x.dataset.pid !== n.id && e.clientX < r.left + r.width / 2 && e.clientY < r.bottom; });
      const arr = notes(); arr.splice(arr.indexOf(n), 1);
      const at = over ? arr.findIndex(x => x.id === over.dataset.pid) : arr.length;
      arr.splice(at < 0 ? arr.length : at, 0, n); n.place = 'today'; save();
    }
    renderNotes();
  }
  document.addEventListener('pointerdown', onDown);
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', () => { if (!drag) return; if (drag.g) drag.g.remove(); if (drag.el) drag.el.classList.remove('pi-lifted'); document.documentElement.classList.remove('pi-dragging'); drag = null; });
  document.addEventListener('keydown', e => { const el = e.target.closest && e.target.closest('[data-pid]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEditor(el.dataset.pid); } });
  zone.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('pnew' in b.dataset) { ML.emit('gesture'); const n = { id: uid(), text: '', c: COLORS[notes().length % 4], place: 'today', at: Date.now() }; notes().push(n); save(); renderZone(); openEditor(n.id); }
    else if ('phid' in b.dataset) { showHidden = !showHidden; renderZone(); }
  });

  /* ---------- Settings > Look ---------- */
  ML.settingsSection({
    order: 3, cat: 'look',
    render: () => `<h3>${esc(t('pi_set_h'))}</h3><div class="seg-toggle look-seg" role="group" aria-label="${esc(t('pi_set_h'))}">${LOOKS.map(v => `<button type="button" data-pilook-set="${v}" aria-pressed="${look() === v}">${esc(t('pi_' + v))}</button>`).join('')}</div><p class="hint">${esc(t('pi_set_d'))}</p>`,
    bind: r => r.querySelectorAll('[data-pilook-set]').forEach(b => { b.onclick = () => { S.postitLook = b.dataset.pilookSet; save(); renderNotes(); ML.renderSettings(); }; }),
  });

  /* ---------- Wiring ---------- */
  const all = () => { renderSeg(); applyMode(); renderNotes(); };
  on('started', all);
  on('render', () => { render(); renderNotes(); });
  on('lang', all);
  on('tab', () => document.documentElement.classList.toggle('ls-mode', mode === 'lists' && S.tab === 'plan'));
  on('minute', () => { if (mode === 'lists' && !root.contains(document.activeElement)) render(); });
  applyLook();
})();
