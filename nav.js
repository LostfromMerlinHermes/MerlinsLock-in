// Phone and side-panel navigation (under 900px wide): a bottom bar with Timer, Plan, Day, Calendar, Study and You.
// Each item is a full screen: the Timer screen is the mood row + the dial, the others are one tab each, so nothing
// sits three screens down. Study and You keep their tabs in the row of sub-tabs (Spaces, 3.58), like on a computer.
// While a session runs, a thin strip above the bar shows it from any screen.
// The current screen is per device (localStorage), never synced.
(() => {
  'use strict';
  const { $, S, t, esc, on, emit } = ML;

  ML.addStrings({
    fr: { nav_timer: 'Minuteur', nav_shop: 'Boutique', nav_back_timer: 'Revenir au minuteur' },
    en: { nav_timer: 'Timer', nav_shop: 'Shop', nav_back_timer: 'Back to the timer' },
  });

  const KEY = 'mli-mview', OPEN_KEY = 'mli-folds';
  const mq = matchMedia('(max-width: 899px)');
  const root = document.documentElement;
  const BAR = ['timer', 'plan', 'day', 'cal', 'study', 'you'];
  const ICON = {
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    plan: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11"/><circle cx="5" cy="18" r="1.3"/>',
    day: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 12h5M8 16h8"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14.5" r="1"/><circle cx="12" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
    study: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c3 2.5 8 2.5 11 0v-5M21.5 9v5"/>',
    you: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.4 3.8-6.5 7.5-6.5s6.7 2.1 7.5 6.5"/>',
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const label = k => t(k === 'timer' ? 'nav_timer' : k === 'study' ? 'sp_study' : k === 'you' ? 'sp_you' : 'tab_' + k);
  const tabName = k => t(k === 'lib' ? 'nav_lib' : k === 'study' ? 'tab_cards' : 'tab_' + k);

  let view = 'timer';
  try { view = localStorage.getItem(KEY) || 'timer'; } catch (e) {}
  const active = () => mq.matches;

  function setView(v, fromTab) {
    view = v === 'timer' ? 'timer' : 'tab';
    try { localStorage.setItem(KEY, view); } catch (e) {}
    if (view === 'tab' && !fromTab && v !== S.tab) ML.setTab(v); // setTab emits 'tab', which comes back here
    apply();
    if (active()) scrollTo({ top: 0, behavior: 'instant' });
  }

  function apply() {
    const on = active();
    root.classList.toggle('mnav-on', on);
    root.dataset.mview = on ? view : '';
    if (on && S.compact) { S.compact = false; ML.save(); ML.renderTimer && ML.renderTimer(); } // the Timer screen is always the full dial
    const title = $('m-title'); if (title) title.textContent = on && view === 'tab' && S.tab ? tabName(S.tab) : '';
    renderBar(); renderRun(); foldAll();
  }

  function renderBar() {
    const el = $('mnav'); if (!el) return;
    const cur = view === 'timer' ? 'timer' : ML.SPACE[S.tab] || S.tab;
    const parked = (S.parked || []).length;
    el.innerHTML = BAR.map(k => `<button type="button" data-mnav="${k}" aria-current="${k === cur ? 'page' : 'false'}">${svg(k)}<span>${esc(label(k))}</span>${k === 'plan' && parked ? `<i class="mnav-dot">${parked}</i>` : ''}</button>`).join('');
  }

  // Running strip: visible on every screen but the Timer one while a session is going (or paused mid-way)
  function renderRun() {
    const el = $('mnav-run'); if (!el) return;
    const rem = ML.remainingNow ? ML.remainingNow() : 0, going = ML.running && ML.running(), mid = !going && S.remaining < S.total;
    const show = active() && view !== 'timer' && S.section !== 'sport' && (going || mid);
    el.hidden = !show; root.classList.toggle('mnav-has-run', show);
    if (!show) return;
    const frac = S.total ? Math.max(0, Math.min(1, 1 - rem / S.total)) : 0;
    const what = S.mode === 'break' ? t('break') : (ML.activeTitle && ML.activeTitle()) || t('free_focus');
    el.className = 'mnav-run ' + (going ? 'going' : 'paused') + (S.mode === 'break' ? ' brk' : '');
    el.setAttribute('aria-label', t('nav_back_timer'));
    el.innerHTML = `<i class="mr-prog" style="width:${(frac * 100).toFixed(1)}%"></i><b class="mr-clock">${esc(MiniView.fmtClock(rem))}</b><span class="mr-what">${esc(what)}</span>
      <span class="mr-act" data-mr="toggle" role="button" aria-label="${esc(going ? t('pause') : t('resume'))}">${going ? '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}</span>`;
  }

  /* ---------- Long screens fold on phones (Grimoire cards, Settings sections): one tap opens a section ---------- */
  let opened = {};
  try { opened = JSON.parse(localStorage.getItem(OPEN_KEY)) || {}; } catch (e) {}
  const FOLD = [['grim', '.g-card', 'h2'], ['g-game', '.g-card', 'h2'], ['settings-body', '.set-sec', 'h3']];
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

  $('mnav').addEventListener('click', e => {
    const b = e.target.closest('[data-mnav]'); if (!b) return;
    const k = b.dataset.mnav;
    emit('gesture');
    if (S.section === 'sport') $('sec-work').click(); // the bar belongs to the Work section
    setView(k === 'study' || k === 'you' ? ML.spaceTab(k) : k);
  });
  $('mnav-run').addEventListener('click', e => {
    if (e.target.closest('[data-mr="toggle"]')) { $('start').click(); renderRun(); return; }
    setView('timer');
  });

  let ready = false; // the boot's setTab(S.tab) must not leave the Timer screen
  on('tab', () => { if (ready && active() && view !== 'tab') { view = 'tab'; try { localStorage.setItem(KEY, view); } catch (e) {} } apply(); });
  // Starting a session from a task, a block or the calendar brings you to the dial
  let wasRunning = false;
  on('timer', () => {
    const r = ML.running && ML.running();
    if (r && !wasRunning && active() && view !== 'timer') setView('timer');
    wasRunning = r; renderRun();
  });
  on('tick', renderRun);
  on('render', apply);
  on('started', () => { ready = true; wasRunning = ML.running && ML.running(); apply(); });
  mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  ML.setMobileView = setView;
})();
