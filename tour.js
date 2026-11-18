// Guided tour (3.101): six short steps over the real screen, a ring around what each one talks about. Offered once,
// after the first launch is done and nothing else is open; it can be started again from Settings › General.
// Accessible: a modal dialog with its title and text, focus kept inside, Esc closes, arrows move, each step is
// announced, and the ring does not glide when motion is reduced. Colours and fonts come from the world's tokens.
(() => {
  'use strict';
  const { S, t, esc, on, save } = ML;

  ML.addStrings({
    fr: {
      vg_label: 'Visite guidée', vg_of: '{i} / {n}', vg_prev: 'Précédent', vg_next: 'Suivant', vg_done: 'Terminer', vg_later: 'Plus tard', vg_go: 'Commencer',
      vg_close: 'Fermer la visite', vg_keys: 'Flèches ← → pour naviguer · Échap pour fermer', vg_step: 'Étape {i} sur {n} : {title}',
      vg_set: 'Visite guidée', vg_set_btn: 'Refaire la visite', vg_set_d: 'Six étapes, une minute.',
      vg_0_h: 'Bienvenue', vg_0_p: 'Six étapes, une minute, pour savoir où est quoi. Tu peux la refaire plus tard dans Réglages, Général.',
      vg_1_h: 'Ton énergie du jour', vg_1_p: 'Stable, À fond ou Épuisé. Ton choix change le monde, la durée proposée et l’ordre de tes tâches. Tu peux en changer à tout moment.',
      vg_2_h: 'Lancer une séance', vg_2_p: 'Choisis une durée, puis Lock in. Pendant la séance, le reste se fait discret. À la fin : de l’XP, de l’or et une session de plus pour ton monde.',
      vg_3_h: 'Tes tâches', vg_3_p: 'Plan range tes tâches selon ton énergie. Lock in sur une tâche lance le minuteur dessus. La journée et l’agenda sont au même endroit.',
      vg_4_h: 'Réviser', vg_4_p: 'Étude regroupe les cartes à réviser, tes PDF et photos de cours, tes notes, tes matières et tes examens.',
      vg_5_h: 'Ton monde', vg_5_p: 'Ton monde grandit avec tes heures de focus. L’or gagné s’échange dans la boutique : décors, cadrans, arbres.',
      vg_6_h: 'À ta façon', vg_6_p: 'Dans Réglages : taille du texte, contraste, sons. Tu préfères une app sans jeu ni monde ? Choisis Sobre.', vg_6_b: 'Ouvrir Apparence',
    },
    en: {
      vg_label: 'Guided tour', vg_of: '{i} / {n}', vg_prev: 'Back', vg_next: 'Next', vg_done: 'Done', vg_later: 'Later', vg_go: 'Start',
      vg_close: 'Close the tour', vg_keys: 'Arrows ← → to move · Esc to close', vg_step: 'Step {i} of {n}: {title}',
      vg_set: 'Guided tour', vg_set_btn: 'Take the tour again', vg_set_d: 'Six steps, one minute.',
      vg_0_h: 'Welcome', vg_0_p: 'Six steps, one minute, to know where things are. You can take it again later in Settings, General.',
      vg_1_h: 'Your energy today', vg_1_p: 'Steady, Fired up or Drained. Your pick changes the world, the suggested length and the order of your tasks. You can change it any time.',
      vg_2_h: 'Start a session', vg_2_p: 'Pick a length, then Lock in. During the session the rest steps back. At the end: XP, gold and one more session for your world.',
      vg_3_h: 'Your tasks', vg_3_p: 'Plan sorts your tasks by your energy. Lock in on a task starts the timer on it. Your day and calendar are in the same place.',
      vg_4_h: 'Study', vg_4_p: 'Study holds your review cards, your class PDFs and photos, your notes, your subjects and your exams.',
      vg_5_h: 'Your world', vg_5_p: 'Your world grows with your focus hours. The gold you earn goes to the shop: scenery, dials, trees.',
      vg_6_h: 'Your way', vg_6_p: 'In Settings: text size, contrast, sounds. Rather have an app with no game and no world? Pick Plain.', vg_6_b: 'Open Look',
    },
  });
  ML.defaults(() => ({ tour: null })); // null = never offered, 'later', 'done'

  const phone = () => document.documentElement.classList.contains('mnav-on');
  const timerView = () => { if (phone() && ML.setMobileView) ML.setMobileView('timer'); };
  const leaveTimer = () => { if (phone() && ML.closeTimer) ML.closeTimer(); };
  // Each step: what it points at (first visible match), and what to show first
  const STEPS = [
    { k: 0 },
    { k: 1, at: ['#ep-pill', '#mood-chips', '#mood-line'], before: timerView },
    { k: 2, at: ['#start', '#c-start', '#mnav-dial'], before: timerView },
    { k: 3, at: ['[data-mnav="plan"]', '#t-plan'], before: leaveTimer },
    { k: 4, at: ['[data-mnav="study"]', '#t-study'] },
    { k: 5, at: ['#mnav [data-mnav]:last-child', '#t-world', '#gold-chip'] },
    { k: 6, at: ['#settings-btn', '#you-btn'] },
  ];
  const N = STEPS.length - 1; // the welcome card is not counted

  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden'; };
  const targetOf = st => { for (const s of st.at || []) { const el = [...document.querySelectorAll(s)].find(visible); if (el) return el; } return null; };

  let root = null, i = 0, back = null, target = null;
  function close(state) {
    if (!root) return;
    S.tour = state || S.tour || 'later'; save();
    removeEventListener('resize', place); removeEventListener('scroll', place, true); document.removeEventListener('keydown', onKey, true);
    root.remove(); root = null;
    if (back && back.isConnected) try { back.focus({ preventScroll: true }); } catch (e) {}
  }
  function start(from) {
    if (root) return;
    back = document.activeElement;
    root = document.createElement('div');
    root.className = 'tour';
    root.innerHTML = `<div class="tour-ring" aria-hidden="true"></div>
      <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-h" aria-describedby="tour-p">
        <i class="tc-c tc-tl"></i><i class="tc-c tc-tr"></i><i class="tc-c tc-bl"></i><i class="tc-c tc-br"></i>
        <div class="tour-top"><p class="tour-label"><i aria-hidden="true"></i>${esc(t('vg_label'))} <span id="tour-of"></span></p>
          <button type="button" class="ghost icon-only tour-x" aria-label="${esc(t('vg_close'))}" title="${esc(t('vg_close'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
        <h2 id="tour-h"></h2><p id="tour-p"></p><div class="tour-extra"></div>
        <div class="tour-dots" aria-hidden="true">${STEPS.slice(1).map(() => '<i></i>').join('')}</div>
        <div class="tour-btns"><button type="button" class="ghost tour-prev"></button><button type="button" class="primary tour-next"></button></div>
        <p class="tour-keys" aria-hidden="true">${esc(t('vg_keys'))}</p>
        <p class="tour-live" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(root);
    root.querySelector('.tour-x').onclick = () => close(i ? 'done' : 'later');
    root.querySelector('.tour-prev').onclick = () => { if (i === 0) close('later'); else go(i - 1); };
    root.querySelector('.tour-next').onclick = () => { if (i >= N) close('done'); else go(i + 1); };
    root.addEventListener('click', e => { if (e.target === root) e.stopPropagation(); }); // the dimmed screen does nothing
    addEventListener('resize', place); addEventListener('scroll', place, true); document.addEventListener('keydown', onKey, true);
    if (ML.closeOverlay) ['settings', 'help'].forEach(id => { const o = document.getElementById(id); if (o && !o.hidden) ML.closeOverlay(id); });
    go(from || 0);
  }
  function go(n) {
    i = n; const st = STEPS[i];
    if (st.before) st.before();
    const card = root.querySelector('.tour-card');
    card.querySelector('#tour-of').textContent = i ? t('vg_of', { i: String(i).padStart(2, '0'), n: String(N).padStart(2, '0') }) : '';
    card.querySelector('#tour-h').textContent = t('vg_' + st.k + '_h');
    card.querySelector('#tour-p').textContent = t('vg_' + st.k + '_p');
    const ex = card.querySelector('.tour-extra');
    ex.innerHTML = st.k === 6 ? `<button type="button" class="link tour-look">${esc(t('vg_6_b'))}</button>` : '';
    if (st.k === 6) ex.querySelector('.tour-look').onclick = () => { close('done'); ML.openSettings && ML.openSettings('look'); };
    card.querySelector('.tour-dots').hidden = !i;
    card.querySelectorAll('.tour-dots i').forEach((d, j) => d.classList.toggle('on', j === i - 1));
    card.querySelector('.tour-prev').textContent = i ? t('vg_prev') : t('vg_later');
    card.querySelector('.tour-next').textContent = i === 0 ? t('vg_go') : i >= N ? t('vg_done') : t('vg_next');
    card.querySelector('.tour-live').textContent = i ? t('vg_step', { i, n: N, title: t('vg_' + st.k + '_h') }) : '';
    // the screen may change (timer view on phones): measure on the next frame
    requestAnimationFrame(() => { if (!root) return; target = targetOf(st); if (target) target.scrollIntoView({ block: 'nearest', behavior: 'instant' }); place(); card.querySelector('.tour-next').focus({ preventScroll: true }); });
  }
  function place() {
    if (!root) return;
    const ring = root.querySelector('.tour-ring'), card = root.querySelector('.tour-card'), W = innerWidth, H = innerHeight, M = 12;
    const r = target && target.isConnected && visible(target) ? target.getBoundingClientRect() : null;
    root.classList.toggle('no-target', !r);
    const cw = Math.min(440, W - 2 * M); card.style.width = cw + 'px';
    const ch = card.offsetHeight;
    if (!r) { card.style.left = (W - cw) / 2 + 'px'; card.style.top = Math.max(M, (H - ch) / 2) + 'px'; return; }
    const p = 6;
    Object.assign(ring.style, { left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px' });
    const below = r.bottom + p + 14, above = r.top - p - 14 - ch;
    const top = below + ch <= H - M ? below : above >= M ? above : Math.max(M, H - ch - M);
    const left = Math.min(W - cw - M, Math.max(M, r.left + r.width / 2 - cw / 2));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
  function onKey(e) {
    if (!root) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(i ? 'done' : 'later'); return; }
    if (e.key === 'ArrowRight' && !ML.isTyping(e)) { e.preventDefault(); e.stopPropagation(); if (i < N) go(i + 1); return; }
    if (e.key === 'ArrowLeft' && !ML.isTyping(e)) { e.preventDefault(); e.stopPropagation(); if (i > 0) go(i - 1); return; }
    if (e.key === 'Tab') { // focus stays in the card
      const f = [...root.querySelectorAll('.tour-card button')].filter(b => b.offsetParent);
      if (!f.length) return;
      const at = f.indexOf(document.activeElement);
      e.preventDefault(); f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      return;
    }
    e.stopPropagation(); // single-key shortcuts of the app stay off while the tour is open
  }
  ML.tour = { start: () => start(1), open: start };

  // Offered once: after the first launch is done, when nothing runs and nothing is open
  const busy = () => !S.onboarded || S.tour || (ML.running && ML.running()) || S.endAt
    || document.querySelector('.overlay:not([hidden]), #energy:not([hidden]), .tip-card');
  let offerT = null;
  const offer = () => { clearTimeout(offerT); offerT = setTimeout(() => { if (!busy() && !root) start(0); }, 1800); };
  on('started', offer); on('tab', offer);

  ML.settingsSection({
    order: 11, cat: 'general',
    render: () => `<h3>${esc(t('vg_set'))}</h3><p class="hint">${esc(t('vg_set_d'))}</p><button type="button" class="small ghost" id="set-tour">${esc(t('vg_set_btn'))}</button>`,
    bind: r => { r.querySelector('#set-tour').onclick = () => { if (ML.closeOverlay) ML.closeOverlay('settings'); setTimeout(() => start(1), 60); }; },
  });
})();
