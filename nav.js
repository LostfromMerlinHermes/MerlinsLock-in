// Phone and side-panel navigation (under 900px wide): a bottom bar with Today, Plan, the dial, Study and You (3.60).
// The dial in the middle shows the time on every screen and opens the Timer screen; closing it brings you back where you
// were, at the same scroll. Study and You open a home page (today.js), and their sections get a back arrow in the header.
// The current screen is per device (localStorage), never synced.
(() => {
  'use strict';
  const { $, S, t, esc, on, emit } = ML;

  ML.addStrings({
    fr: { nav_timer: 'Minuteur', nav_shop: 'Boutique', nav_today: 'Aujourd’hui', nav_back: 'Retour', nav_back_screen: 'Fermer le minuteur', nav_back_timer: 'Revenir au minuteur', nav_list: 'Liste', nav_month: 'Mois', grp_tasks: 'Tâches', grp_sched: 'Planning', rail_hide: 'Masquer la colonne', rail_show: 'Afficher la colonne', full_on: 'Plein écran', full_off: 'Quitter le plein écran (Échap)' },
    en: { nav_timer: 'Timer', nav_shop: 'Shop', nav_today: 'Today', nav_back: 'Back', nav_back_screen: 'Close the timer', nav_back_timer: 'Back to the timer', nav_list: 'List', nav_month: 'Month', grp_tasks: 'Tasks', grp_sched: 'Schedule', rail_hide: 'Hide the column', rail_show: 'Show the column', full_on: 'Full screen', full_off: 'Leave full screen (Esc)' },
  });

  const KEY = 'mli-mview', OPEN_KEY = 'mli-folds', GROUP_KEY = 'mli-subgroups', RAIL_KEY = 'mli-rail-off';
  const mq = matchMedia('(max-width: 899px)');
  const root = document.documentElement;
  const BAR = ['today', 'plan', 'timer', 'study', 'you'];
  const ORDER = ['today', 'plan', 'study', 'you']; // the screens a swipe from the edge goes through (gestures.js)
  const HOME = { today: 'today', study: 'shome', you: 'yhome' };
  const ICON = {
    today: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    plan: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11"/><circle cx="5" cy="18" r="1.3"/>',
    study: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c3 2.5 8 2.5 11 0v-5M21.5 9v5"/>',
    you: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.4 3.8-6.5 7.5-6.5s6.7 2.1 7.5 6.5"/>',
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const label = k => t(k === 'today' ? 'nav_today' : k === 'timer' ? 'nav_timer' : k === 'study' ? 'sp_study' : k === 'you' ? 'sp_you' : 'tab_' + k);
  const tabName = k => t(k === 'today' ? 'nav_today' : k === 'shome' ? 'sp_study' : k === 'yhome' ? 'sp_you' : k === 'lib' ? 'nav_lib' : k === 'study' ? 'tab_cards' : 'tab_' + k);

  let view = null;
  try { view = localStorage.getItem(KEY); } catch (e) {}
  if (!view) view = 'tab'; // first visit: Today, not an empty dial
  const active = () => mq.matches;
  const curSpace = () => (view === 'timer' ? 'timer' : ML.SPACE[S.tab] || S.tab);
  // Scroll kept per screen, so closing the Timer screen brings you back to the same place
  let tabScroll = 0;

  function setView(v, fromTab) {
    const was = view;
    if (was === 'tab' && v === 'timer') tabScroll = scrollY;
    view = v === 'timer' ? 'timer' : 'tab';
    try { localStorage.setItem(KEY, view); } catch (e) {}
    if (view === 'tab' && !fromTab && v !== S.tab && v !== 'back') ML.setTab(v); // setTab emits 'tab', which comes back here
    apply();
    if (active()) scrollTo({ top: v === 'back' ? tabScroll : 0, behavior: 'instant' });
  }
  // Back from the Timer screen, to the screen and the scroll you left
  const closeTimer = () => setView('back');
  ML.closeTimer = closeTimer;

  function apply() {
    const onx = active();
    root.classList.toggle('mnav-on', onx);
    root.dataset.mview = onx ? view : '';
    if (!onx && ['today', 'shome', 'yhome'].includes(S.tab)) ML.setTab(S.tab); // a home page on a computer goes to its space's section
    if (onx && S.compact) { S.compact = false; ML.save(); ML.renderTimer && ML.renderTimer(); } // the Timer screen is always the full dial
    renderHead(onx); renderBar(); renderDial(); foldAll();
    $('m-fab').hidden = !(onx && view === 'tab' && S.tab === 'plan' && !(S.plan && S.plan.pview === 'inbox'));
  }

  function renderHead(onx) {
    const title = $('m-title'), back = $('m-back'), seg = $('m-seg');
    const sp = ML.SPACE[S.tab], inPlan = onx && view === 'tab' && sp === 'plan';
    if (title) {
      const M = ML.MOODS[S.mood], single = M && M.single && !S.showAll && (S.plan && S.plan.pview) !== 'inbox'; // Scattered shows one card: the next task
      const pv = S.plan && S.plan.pview, name = !onx || view !== 'tab' || !S.tab ? '' : S.tab === 'plan' && pv ? t(single ? 'pl_v_next' : 'pl_v_' + pv) : tabName(S.tab);
      title.textContent = name; // the project filter shows on its own line under the title (plan.js, 3.70)
      title.classList.toggle('has-menu', inPlan);
      title.disabled = !inPlan;
    }
    if (back) back.hidden = !(onx && view === 'tab' && (sp === 'study' || sp === 'you') && S.tab !== 'shome' && S.tab !== 'yhome');
    if (seg) {
      seg.hidden = !inPlan;
      if (inPlan) {
        const html = [['plan', 'nav_list'], ['day', 'tab_day'], ['cal', 'nav_month']].map(([k, s]) => `<button type="button" data-seg="${k}" aria-pressed="${S.tab === k}">${esc(t(s))}</button>`).join('');
        if (seg.dataset.h !== html) { seg.innerHTML = html; seg.dataset.h = html; }
      }
    }
  }

  function renderBar() {
    const el = $('mnav'); if (!el) return;
    const cur = curSpace(), parked = (S.parked || []).length;
    const sig = BAR.join() + cur + parked + S.lang;
    if (el.dataset.h === sig) return;
    el.dataset.h = sig;
    el.innerHTML = BAR.map(k => k === 'timer'
      ? `<button type="button" class="mnav-dial" id="mnav-dial" data-mnav="timer" aria-current="${cur === 'timer' ? 'page' : 'false'}"><i class="md-ring"></i><b id="md-clock"></b></button>`
      : `<button type="button" data-mnav="${k}" aria-current="${k === cur ? 'page' : 'false'}">${svg(k)}<span>${esc(label(k))}</span>${k === 'plan' && parked ? `<i class="mnav-dot">${parked}</i>` : ''}</button>`).join('');
  }

  // The dial in the bar: the time and a ring that fills as the session goes
  function renderDial() {
    const b = $('mnav-dial'); if (!b) return;
    const rem = ML.remainingNow ? ML.remainingNow() : 0, going = ML.running && ML.running(), mid = !going && S.remaining < S.total;
    const frac = S.total ? Math.max(0, Math.min(1, 1 - rem / S.total)) : 0, clock = MiniView.fmtClock(rem);
    const c = $('md-clock'); if (c.textContent !== clock) { c.textContent = clock; b.classList.toggle('long', clock.length > 5); }
    b.style.setProperty('--md', (frac * 100).toFixed(1) + '%');
    b.className = 'mnav-dial' + (clock.length > 5 ? ' long' : '') + (going ? ' going' : mid ? ' paused' : '') + (S.mode === 'break' ? ' brk' : '');
    const what = S.mode === 'break' ? t('break') : (ML.activeTitle && ML.activeTitle()) || t('free_focus');
    b.setAttribute('aria-label', `${t('nav_timer')} · ${clock} · ${what}`);
  }

  /* ---------- Long screens fold on phones (Grimoire cards): one tap opens a section ---------- */
  let opened = {};
  try { opened = JSON.parse(localStorage.getItem(OPEN_KEY)) || {}; } catch (e) {}
  const FOLD = [['grim', '.g-card', 'h2'], ['g-game', '.g-card', 'h2']];
  function fold(hostId, cardSel, headSel) {
    const host = $(hostId); if (!host) return;
    let first = hostId !== 'g-game'; // the first titled section of a screen starts open
    host.querySelectorAll(cardSel).forEach(c => {
      const h = c.querySelector(':scope > ' + headSel); if (!h) return;
      const key = h.textContent.trim(), isOpen = !active() || (key in opened ? opened[key] : first);
      first = false;
      c.classList.add('foldable'); c.classList.toggle('folded', !isOpen);
      if (active()) { h.setAttribute('role', 'button'); h.tabIndex = 0; h.setAttribute('aria-expanded', isOpen); } else { h.removeAttribute('role'); h.removeAttribute('tabindex'); h.removeAttribute('aria-expanded'); }
    });
  }
  function foldAll() { FOLD.forEach(a => fold(...a)); }
  FOLD.forEach(([id, cardSel, headSel]) => {
    const host = $(id); if (!host) return;
    new MutationObserver(() => fold(id, cardSel, headSel)).observe(host, { childList: true });
    const toggle = e => {
      if (!active()) return;
      const h = e.target.closest(headSel); if (!h || !h.parentElement.matches(cardSel + '.foldable')) return;
      if (e.type === 'keydown') { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); }
      const c = h.parentElement, isOpen = c.classList.toggle('folded') === false;
      h.setAttribute('aria-expanded', isOpen); opened[h.textContent.trim()] = isOpen;
      try { localStorage.setItem(OPEN_KEY, JSON.stringify(opened)); } catch (err) {}
    };
    host.addEventListener('click', toggle); host.addEventListener('keydown', toggle);
  });

  // A tap on a space: its home page, or its last section for Plan
  const goSpace = k => setView(k === 'plan' ? ML.spaceTab('plan') : HOME[k]);
  $('mnav').addEventListener('click', e => {
    const b = e.target.closest('[data-mnav]'); if (!b) return;
    const k = b.dataset.mnav;
    emit('gesture');
    if (S.section === 'sport') $('sec-work').click(); // the bar belongs to the Work section
    if (k === 'timer') { view === 'timer' ? closeTimer() : setView('timer'); return; }
    goSpace(k);
  });
  $('m-close').onclick = closeTimer;
  $('m-back').onclick = () => setView(ML.SPACE[S.tab] === 'you' ? 'yhome' : 'shome');
  $('m-seg').addEventListener('click', e => { const b = e.target.closest('[data-seg]'); if (b) setView(b.dataset.seg); });
  $('m-title').onclick = () => { if (ML.planMenu) ML.planMenu($('m-title')); };
  $('m-fab').onclick = () => { emit('gesture'); if (ML.planSheet) ML.planSheet(true); };
  // gestures.js: a swipe from the edge of the screen goes to the next or previous space
  ML.swipeSpace = dir => {
    if (view === 'timer') return;
    const i = ORDER.indexOf(curSpace()), k = ORDER[i + dir];
    if (i >= 0 && k) goSpace(k);
  };

  let ready = false; // the boot's setTab(S.tab) must not leave the Timer screen
  on('tab', () => { if (ready && active() && view !== 'tab') { view = 'tab'; try { localStorage.setItem(KEY, view); } catch (e) {} } apply(); });
  // Starting a session from a task, a block or the calendar brings you to the dial
  let wasRunning = false;
  on('timer', () => {
    const r = ML.running && ML.running();
    if (r && !wasRunning && active() && view !== 'timer') setView('timer');
    wasRunning = r; renderDial();
  });
  on('tick', renderDial);
  on('render', apply);
  on('lang', apply);
  on('tasks:render', () => { if (active()) renderHead(true); $('m-fab').hidden = !(active() && view === 'tab' && S.tab === 'plan' && !(S.plan && S.plan.pview === 'inbox')); });
  on('started', () => {
    ready = true; wasRunning = ML.running && ML.running();
    try { if (!localStorage.getItem(KEY) && active()) ML.setTab('today'); } catch (e) {}
    apply();
  });
  mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  ML.setMobileView = setView;

  /* ---------- Computer: the section column (3.61) ---------- */
  // The Plan's sections fold into groups; a closed group names the section you are on
  let groups = { tasks: true, progress: true, well: true, more: true };
  try { groups = Object.assign(groups, JSON.parse(localStorage.getItem(GROUP_KEY))); } catch (e) {}
  function renderGroups() {
    document.querySelectorAll('#subtabs .sub-grp').forEach(b => {
      const k = b.dataset.grp, fold = document.querySelector(`#subtabs [data-fold="${k}"]`), isOpen = !!groups[k];
      fold.classList.toggle('closed', !isOpen);
      b.setAttribute('aria-expanded', isOpen);
      const cur = fold.querySelector('[aria-selected="true"]:not([hidden]), .pl-sit.on:not([data-pproj=""]) span:not(.pl-dot)');
      b.querySelector('small').textContent = !isOpen && cur ? cur.textContent.trim() : '';
    });
  }
  $('subtabs').addEventListener('click', e => {
    const b = e.target.closest('.sub-grp'); if (!b) return;
    groups[b.dataset.grp] = !groups[b.dataset.grp];
    try { localStorage.setItem(GROUP_KEY, JSON.stringify(groups)); } catch (err) {}
    renderGroups();
  });
  on('tab', renderGroups); on('tasks:render', renderGroups); on('render', renderGroups); on('lang', renderGroups); on('started', renderGroups);

  // Two ways to give the section more room: hide the column (a tap on Plan, Study or You brings it back), or full screen
  let railOff = false, fullOn = false, railBefore = false;
  try { railOff = localStorage.getItem(RAIL_KEY) === '1'; } catch (e) {}
  function renderRoom() {
    root.classList.toggle('rail-off', railOff);
    root.classList.toggle('panel-full', fullOn);
    const r = $('rail-btn'), f = $('full-btn');
    r.setAttribute('aria-pressed', railOff); r.title = t(railOff ? 'rail_show' : 'rail_hide'); r.setAttribute('aria-label', r.title);
    f.setAttribute('aria-pressed', fullOn); f.title = t(fullOn ? 'full_off' : 'full_on'); f.setAttribute('aria-label', f.title);
    renderTabClock();
  }
  function setRail(off) {
    railOff = off;
    if (fullOn) railBefore = off;
    else try { localStorage.setItem(RAIL_KEY, off ? '1' : '0'); } catch (e) {}
    renderRoom();
  }
  function setFull(want) {
    if (want === fullOn) return;
    fullOn = want;
    if (want) { railBefore = railOff; railOff = true; }
    else railOff = railBefore;
    try {
      if (want && root.requestFullscreen) root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      if (!want && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {}
    renderRoom();
  }
  // The timer zone is gone in full screen, so a running session keeps its time in the tab row
  function renderTabClock() {
    const c = $('tab-clock'), show = fullOn && S.mode === 'focus' && ML.running && ML.running();
    c.hidden = !show;
    if (show) { const v = MiniView.fmtClock(ML.remainingNow()); if (c.textContent !== v) c.textContent = v; }
  }
  $('rail-btn').onclick = () => setRail(!railOff);
  $('full-btn').onclick = () => setFull(!fullOn);
  ['t-plan', 'sp-study', 'sp-you'].forEach(id => $(id).addEventListener('click', () => { if (railOff) setRail(false); }));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && fullOn) setFull(false); }); // Esc leaves the browser's full screen
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fullOn && !document.fullscreenElement && !e.defaultPrevented) setFull(false); }); // where the browser refuses it
  on('tick', renderTabClock); on('timer', renderTabClock); on('lang', renderRoom); on('started', renderRoom);
  mq.addEventListener ? mq.addEventListener('change', () => { if (mq.matches) setFull(false); }) : 0;
})();
