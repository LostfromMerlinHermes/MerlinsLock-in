// Quick tools (3.58): a thin drawer on the right edge for what you need during a session without changing tab: Inbox,
// quick note, translate, calculator. On phones and the side panel it is a sheet opened from the header, and the sound
// player moves into it (on a computer the player stays in the timer card). Translate and the calculator stay Premium.
(() => {
  'use strict';
  const { $, S, t, esc, on, today } = ML;

  ML.addStrings({
    fr: { qt_title: 'Outils rapides', qt_inbox: 'Inbox', qt_inbox_ph: 'Une pensée à garder pour plus tard', qt_add: 'Garder', qt_note: 'Note rapide', qt_note_ph: 'Va dans la page du jour du Carnet', qt_note_ok: 'Ajouté à la page du jour.', qt_translate: 'Traduction', qt_translate_ph: 'Texte à traduire', qt_go: 'Traduire', qt_calc: 'Calculatrice', qt_calc_ph: '2 * (3 + 4)', qt_calc_err: 'Calcul impossible', qt_premium: 'Avec Premium', qt_sound: 'Son', qt_busy: 'Traduction…' },
    en: { qt_title: 'Quick tools', qt_inbox: 'Inbox', qt_inbox_ph: 'A thought to keep for later', qt_add: 'Keep', qt_note: 'Quick note', qt_note_ph: 'Goes to today’s Notes page', qt_note_ok: 'Added to today’s page.', qt_translate: 'Translate', qt_translate_ph: 'Text to translate', qt_go: 'Translate', qt_calc: 'Calculator', qt_calc_ph: '2 * (3 + 4)', qt_calc_err: 'Can’t calculate that', qt_premium: 'With Premium', qt_sound: 'Sound', qt_busy: 'Translating…' },
  });

  const root = document.documentElement, mq = matchMedia('(max-width: 899px)');
  const el = document.createElement('aside');
  el.className = 'qt'; el.id = 'quick'; el.hidden = true; el.setAttribute('aria-label', 'Quick tools');
  const handle = document.createElement('button');
  handle.type = 'button'; handle.className = 'qt-handle'; handle.id = 'qt-handle';
  document.body.append(el, handle);
  const shade = document.createElement('div');
  shade.className = 'qt-shade'; shade.hidden = true;
  document.body.append(shade);

  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  const lock = name => `<p class="hint qt-lock">${esc(t('qt_premium'))} · ${esc(name)}</p>`;
  let calcOut = '', trOut = '', trBusy = false, ans = 0, draft = {};
  const LANGS = ['fr', 'en', 'es', 'de', 'it', 'pt'];

  function html() {
    const tr = (S.study && S.study.tr) || { from: 'fr', to: 'en' };
    const langSel = (id, cur) => `<select id="${id}" aria-label="${esc(t('qt_translate'))}">${LANGS.map(l => `<option value="${l}" ${l === cur ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')}</select>`;
    return `<header class="qt-head"><h2>${esc(t('qt_title'))}</h2><button type="button" class="ghost icon-only qt-mute" data-qt="mute" aria-label="${esc(t('mute_all'))}" aria-pressed="${$('mute-btn').getAttribute('aria-pressed')}">${$('mute-btn').innerHTML}</button><button type="button" class="ghost icon-only" data-qt="close" aria-label="${esc(t('close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
      <div class="qt-sound" id="qt-sound"></div>
      <form class="qt-sec" id="qt-inbox" autocomplete="off"><label for="qt-inbox-in" class="label">${esc(t('qt_inbox'))}</label><div class="qt-row"><input type="text" id="qt-inbox-in" maxlength="140" placeholder="${esc(t('qt_inbox_ph'))}"><button type="submit" class="small">${esc(t('qt_add'))}</button></div></form>
      <form class="qt-sec" id="qt-note" autocomplete="off"><label for="qt-note-in" class="label">${esc(t('qt_note'))}</label><textarea id="qt-note-in" rows="3" maxlength="2000" placeholder="${esc(t('qt_note_ph'))}">${esc(draft.note || '')}</textarea><button type="submit" class="small">${esc(t('qt_add'))}</button></form>
      <form class="qt-sec" id="qt-tr" autocomplete="off"><label for="qt-tr-in" class="label">${esc(t('qt_translate'))}</label>
        ${isPrem() ? `<div class="qt-row">${langSel('qt-from', tr.from)}<span aria-hidden="true">→</span>${langSel('qt-to', tr.to)}</div><textarea id="qt-tr-in" rows="2" maxlength="900" placeholder="${esc(t('qt_translate_ph'))}">${esc(draft.tr || '')}</textarea><button type="submit" class="small" ${trBusy ? 'disabled' : ''}>${esc(trBusy ? t('qt_busy') : t('qt_go'))}</button>${trOut ? `<p class="qt-out" aria-live="polite">${esc(trOut)}</p>` : ''}` : lock(t('qt_translate'))}</form>
      <form class="qt-sec" id="qt-calc" autocomplete="off"><label for="qt-calc-in" class="label">${esc(t('qt_calc'))}</label>
        ${isPrem() ? `<div class="qt-row"><input type="text" id="qt-calc-in" inputmode="text" spellcheck="false" placeholder="${esc(t('qt_calc_ph'))}" value="${esc(draft.calc || '')}"><button type="submit" class="small">=</button></div>${calcOut ? `<p class="qt-out" aria-live="polite"><b>${esc(calcOut)}</b></p>` : ''}` : lock(t('qt_calc'))}</form>`;
  }
  // The sound player lives in the timer card on a computer, in this sheet on phones (same element, it keeps its state)
  function placeDeck() {
    const deck = $('sound-deck'), slot = $('qt-sound'), card = $('sigil-card'); if (!deck || !card) return;
    if (mq.matches && slot) { if (deck.parentElement !== slot) slot.append(deck); }
    else if (!mq.matches && deck.parentElement !== card) card.append(deck);
  }
  // Keeps the player out of the sheet's redraw: it goes back to the timer card for the time innerHTML runs
  function render() {
    const deck = $('sound-deck'), card = $('sigil-card'); if (deck && card && deck.parentElement !== card) card.append(deck);
    el.innerHTML = html(); placeDeck();
    handle.setAttribute('aria-label', t('qt_title')); handle.title = t('qt_title');
  }
  const isOpen = () => !el.hidden;
  function open() { render(); el.hidden = false; shade.hidden = false; handle.setAttribute('aria-expanded', 'true'); root.classList.add('qt-on'); ML.emit('gesture'); }
  function close() { el.hidden = true; shade.hidden = true; handle.setAttribute('aria-expanded', 'false'); root.classList.remove('qt-on'); }
  ML.quickTools = { open, close };
  handle.onclick = () => (isOpen() ? close() : open());
  $('quick-btn').onclick = open;
  shade.onclick = close;
  el.addEventListener('click', e => {
    if (e.target.closest('[data-qt="close"]')) close();
    const m = e.target.closest('[data-qt="mute"]'); if (m) { $('mute-btn').click(); m.setAttribute('aria-pressed', $('mute-btn').getAttribute('aria-pressed')); }
  });
  el.addEventListener('input', e => {
    if (e.target.id === 'qt-note-in') draft.note = e.target.value;
    if (e.target.id === 'qt-tr-in') draft.tr = e.target.value;
    if (e.target.id === 'qt-calc-in') draft.calc = e.target.value;
  });
  el.addEventListener('change', e => {
    if ((e.target.id === 'qt-from' || e.target.id === 'qt-to') && S.study) { S.study.tr = { from: $('qt-from').value, to: $('qt-to').value }; ML.save(); }
  });
  el.addEventListener('submit', async e => {
    e.preventDefault();
    const id = e.target.id;
    if (id === 'qt-inbox') {
      const i = $('qt-inbox-in'), v = i.value.trim(); if (!v) return;
      $('park-input').value = v; $('park-form').requestSubmit(); i.value = '';
    } else if (id === 'qt-note') {
      const v = $('qt-note-in').value.trim(); if (!v) return;
      ML.notesAppend(`<p>${esc(v)}</p>`); draft.note = ''; $('qt-note-in').value = ''; ML.toast(t('qt_note_ok'));
    } else if (id === 'qt-calc' && $('qt-calc-in')) {
      const v = $('qt-calc-in').value.trim(); if (!v) return;
      try { const r = ML.calc(v, S.study && S.study.calcDeg, ans); if (typeof r !== 'number' || !isFinite(r)) throw new Error('calc'); ans = r; calcOut = String(+r.toPrecision(12)); } catch (err) { calcOut = t('qt_calc_err'); }
      render(); const i = $('qt-calc-in'); if (i) i.focus();
    } else if (id === 'qt-tr' && $('qt-tr-in')) {
      const v = $('qt-tr-in').value.trim(); if (!v || trBusy) return;
      trBusy = true; trOut = ''; render();
      try { trOut = await ML.translateText(v, S.study.tr.from, S.study.tr.to); } catch (err) { trOut = t('tr_err'); }
      trBusy = false; if (isOpen()) render();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); close(); } }, true);
  on('started', () => { render(); });
  on('premium', () => { if (isOpen()) render(); });
  on('lang', () => { if (isOpen()) render(); });
  mq.addEventListener ? mq.addEventListener('change', () => { close(); render(); }) : mq.addListener(() => { close(); render(); });
})();
