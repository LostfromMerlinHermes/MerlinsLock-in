// Phone and side-panel navigation (under 900px wide): a bottom bar with Timer, Plan, Day, Calendar, Library and More.
// Each item is a full screen: the Timer screen is the mood row + the dial, the others are one tab each, so nothing
// sits three screens down. While a session runs, a thin strip above the bar shows it from any screen.
// The current screen is per device (localStorage), never synced.
(() => {
  'use strict';
  const { $, S, t, esc, on, emit } = ML;

  ML.addStrings({
    fr: { nav_timer: 'Minuteur', nav_more: 'Plus', nav_shop: 'Boutique', nav_back_timer: 'Revenir au minuteur' },
    en: { nav_timer: 'Timer', nav_more: 'More', nav_shop: 'Shop', nav_back_timer: 'Back to the timer' },
  });

  const KEY = 'mli-mview';
  const mq = matchMedia('(max-width: 899px)');
  const root = document.documentElement;
  const BAR = ['timer', 'plan', 'day', 'cal', 'lib', 'more'];
  const MORE = ['notes', 'study', 'learn', 'grim'];
  const ICON = {
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    plan: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11"/><circle cx="5" cy="18" r="1.3"/>',
    day: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 12h5M8 16h8"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8" cy="14.5" r="1"/><circle cx="12" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
    more: '<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>',
    notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
    learn: '<path d="M12 6.5C10 5 7 4.5 3.5 4.5v14c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-14c-3.5 0-6.5.5-8.5 2z"/><path d="M12 6.5v14"/>',
    grim: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M10 8h5"/>',
    study: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c3 2.5 8 2.5 11 0v-5M21.5 9v5"/>',
    lib: '<path d="M4 4h4v16H4zM9.5 4h4v16h-4z"/><path d="M15.2 5l3.8-1 2.8 15-3.8 1z"/>',
    shop: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const label = k => t(k === 'timer' ? 'nav_timer' : k === 'lib' ? 'nav_lib' : k === 'more' ? 'nav_more' : k === 'shop' ? 'nav_shop' : k === 'settings' ? 'settings' : 'tab_' + k);

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
    renderBar(); renderRun();
  }

  function renderBar() {
    const el = $('mnav'); if (!el) return;
    const cur = view === 'timer' ? 'timer' : BAR.includes(S.tab) ? S.tab : 'more';
    const parked = (S.parked || []).length;
    el.innerHTML = BAR.map(k => `<button type="button" data-mnav="${k}" aria-current="${k === cur ? 'page' : 'false'}">${svg(k)}<span>${esc(label(k))}</span>${k === 'plan' && parked ? `<i class="mnav-dot">${parked}</i>` : ''}</button>`).join('');
  }

  function renderMore() {
    const parked = (S.parked || []).length, locked = !(ML.isPremium && ML.isPremium());
    $('more-grid').innerHTML = [...MORE, 'shop', 'settings'].map(k => `<button type="button" class="more-item ${S.tab === k && view === 'tab' ? 'on' : ''}" data-more="${k}">${svg(k)}<span>${esc(label(k))}</span>
      ${k === 'study' && locked ? '<small>Premium</small>' : ''}${k === 'shop' && S.econ ? `<small>◈ ${S.econ.gold.toLocaleString(ML.locale())}</small>` : ''}</button>`).join('');
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

  $('mnav').addEventListener('click', e => {
    const b = e.target.closest('[data-mnav]'); if (!b) return;
    const k = b.dataset.mnav;
    emit('gesture');
    if (k === 'more') { renderMore(); ML.openOverlay('more'); return; }
    if (S.section === 'sport') $('sec-work').click(); // the bar belongs to the Work section
    setView(k);
  });
  $('more-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-more]'); if (!b) return;
    const k = b.dataset.more;
    ML.closeOverlay('more');
    if (k === 'shop') { ML.openShop && ML.openShop(); return; }
    if (k === 'settings') { $('settings-btn').click(); return; }
    if (S.section === 'sport') $('sec-work').click();
    setView(k);
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
