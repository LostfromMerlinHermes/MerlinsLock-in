// Premium purchase (3.100): Lemon Squeezy checkout through the `premium` Edge Function (supabase/functions/premium).
// - ML.premiumCta(): the buy block for locked pages (month / year, the 14-day waiver box, sign-in first).
// - Settings › Account › Premium: status, renewal or end date, « Manage subscription » (Lemon Squeezy portal).
// - After a checkout: re-reads the session while the app is visible until app_metadata.premium turns on.
// Off unless config.js premium.sale is true ('local' = localhost only, for the test mode).
(() => {
  'use strict';
  const { $, t, esc, on, emit, toast } = ML;
  const CFG = () => (window.MLI_CONFIG || {}).premium || {};
  const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const saleOn = () => { const s = CFG().sale; return s === true || (s === 'local' && LOCAL); };
  ML.premiumSale = saleOn;
  const A = () => ML.auth;
  const signedIn = () => !!(A() && A().enabled && A().user);

  ML.addStrings({
    fr: {
      pm_h: 'Premium', pm_month: '{p} par mois', pm_year: '{p} par an', pm_year_save: '{n} mois offerts',
      pm_waiver: 'Je veux accéder à Premium tout de suite. Je reconnais perdre mon droit de rétractation de 14 jours une fois l’accès commencé.',
      pm_waiver_need: 'Coche la case pour continuer.',
      pm_fine: 'Paiement par Lemon Squeezy, qui gère la TVA et les factures. Résiliable à tout moment, Premium reste actif jusqu’à la fin de la période payée.',
      pm_sign: 'Connecte-toi ou crée un compte : Premium est lié à ton compte et te suit sur tous tes appareils.',
      pm_sign_btn: 'Se connecter', pm_opening: 'Ouverture du paiement…', pm_wait: 'Paiement en cours. Premium s’active ici dès qu’il est confirmé.',
      pm_ok: 'Premium est activé. Merci !', pm_err: 'Le paiement n’a pas pu s’ouvrir : {msg}', pm_blocked: 'Ouvre le paiement ici :',
      pm_on: 'Premium actif.', pm_renews: 'Se renouvelle le {d}.', pm_ends: 'Se termine le {d}. Tu peux le reprendre depuis la gestion de l’abonnement.',
      pm_past_due: 'Le dernier paiement a échoué. Mets à jour ta carte pour garder Premium.',
      pm_owner: 'Premium offert à ce compte.', pm_manage: 'Gérer l’abonnement', pm_check: 'Vérifier mon Premium', pm_none: 'Pas encore Premium sur ce compte.',
      pm_before_delete: 'Avant de supprimer ton compte, résilie ton abonnement dans « Gérer l’abonnement » : supprimer le compte n’arrête pas les paiements.',
      pm_test: 'Mode test : aucune vraie carte n’est débitée.',
    },
    en: {
      pm_h: 'Premium', pm_month: '{p} a month', pm_year: '{p} a year', pm_year_save: '{n} months free',
      pm_waiver: 'I want Premium right away. I understand I lose my 14-day right of withdrawal once access starts.',
      pm_waiver_need: 'Tick the box to continue.',
      pm_fine: 'Payment by Lemon Squeezy, which handles VAT and invoices. Cancel anytime, Premium stays on until the end of the paid period.',
      pm_sign: 'Sign in or create an account: Premium is tied to your account and follows you on all your devices.',
      pm_sign_btn: 'Sign in', pm_opening: 'Opening the payment…', pm_wait: 'Payment in progress. Premium turns on here as soon as it is confirmed.',
      pm_ok: 'Premium is on. Thank you!', pm_err: 'The payment could not open: {msg}', pm_blocked: 'Open the payment here:',
      pm_on: 'Premium is on.', pm_renews: 'Renews on {d}.', pm_ends: 'Ends on {d}. You can resume it from Manage subscription.',
      pm_past_due: 'The last payment failed. Update your card to keep Premium.',
      pm_owner: 'Premium given to this account.', pm_manage: 'Manage subscription', pm_check: 'Check my Premium', pm_none: 'No Premium on this account yet.',
      pm_before_delete: 'Before deleting your account, cancel your subscription in Manage subscription: deleting the account does not stop the payments.',
      pm_test: 'Test mode: no real card is charged.',
    },
  });

  // Months the yearly plan saves, from the two prices in config.js (« 2,99 € » → 2.99)
  const num = s => parseFloat(String(s || '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
  const free = () => { const m = num(CFG().month), y = num(CFG().year); return m && y ? Math.floor(12 - y / m) : 0; };
  const day = iso => new Date(iso).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long', year: 'numeric' });

  /* ---------- Buy block ---------- */
  ML.premiumCta = () => {
    if (!saleOn() || (ML.isPremium && ML.isPremium())) return '';
    const c = CFG();
    if (!signedIn()) return `<div class="pm-box"><p class="hint">${esc(t('pm_sign'))}</p>
      <button type="button" class="small primary" data-pm="login">${esc(t('pm_sign_btn'))}</button></div>`;
    return `<div class="pm-box">
      <label class="opt pm-waiver"><input type="checkbox" data-pm="waiver"> <span>${esc(t('pm_waiver'))}</span></label>
      <div class="pm-plans">
        <button type="button" class="primary" data-pm="buy" data-plan="year">${esc(t('pm_year', { p: c.year || '' }))}${free() > 0 ? `<small>${esc(t('pm_year_save', { n: free() }))}</small>` : ''}</button>
        <button type="button" data-pm="buy" data-plan="month">${esc(t('pm_month', { p: c.month || '' }))}</button>
      </div>
      <p class="hint pm-fine">${esc(t('pm_fine'))}${CFG().sale === 'local' ? ' ' + esc(t('pm_test')) : ''}</p>
      <p class="hint pm-msg" role="status"></p>
    </div>`;
  };

  let polling = null;
  function waitForPremium() {
    // Re-reads the session every 4 s while the app is visible, for 10 min at most
    clearInterval(polling);
    const until = Date.now() + 600000;
    const tick = async () => {
      if (Date.now() > until || !signedIn()) { clearInterval(polling); polling = null; return; }
      if (document.hidden) return;
      try { const u = await A().refresh(); if (u && u.premium) { clearInterval(polling); polling = null; toast(t('pm_ok')); emit('render'); } } catch (e) {}
    };
    polling = setInterval(tick, 4000); tick();
  }
  // Coming back to the app after paying in another tab: check at once
  document.addEventListener('visibilitychange', () => { if (!document.hidden && polling && signedIn()) A().refresh().catch(() => {}); });
  on('premium', p => { if (p) { clearInterval(polling); polling = null; } });

  async function buy(btn) {
    const box = btn.closest('.pm-box'), msg = box && box.querySelector('.pm-msg'), w = box && box.querySelector('[data-pm="waiver"]');
    const say = s => { if (msg) msg.textContent = s; };
    if (w && !w.checked) { say(t('pm_waiver_need')); w.focus(); return; }
    // Open the tab now, inside the tap, or the browser blocks it as a pop-up; the address comes a moment later
    const tab = window.open('', '_blank');
    box.querySelectorAll('[data-pm="buy"]').forEach(b => { b.disabled = true; });
    say(t('pm_opening'));
    try {
      const r = await A().fn('premium', { action: 'checkout', plan: btn.dataset.plan });
      if (tab && !tab.closed) tab.location.href = r.url;
      else { msg.innerHTML = `${esc(t('pm_blocked'))} <a href="${esc(r.url)}" target="_blank" rel="noopener">Lemon Squeezy</a>`; }
      if (tab && !tab.closed) say(t('pm_wait'));
      waitForPremium();
    } catch (e) {
      if (tab && !tab.closed) tab.close();
      say(t('pm_err', { msg: A().errText ? A().errText(e) : e.message }));
    } finally { box.querySelectorAll('[data-pm="buy"]').forEach(b => { b.disabled = false; }); }
  }
  async function portal(btn) {
    const tab = window.open('', '_blank'); btn.disabled = true;
    try { const r = await A().fn('premium', { action: 'portal' }); if (tab && !tab.closed) tab.location.href = r.url; else window.open(r.url, '_blank'); waitForPremium(); }
    catch (e) { if (tab && !tab.closed) tab.close(); toast(A().errText ? A().errText(e) : e.message); }
    finally { btn.disabled = false; }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pm]'); if (!b || b.dataset.pm === 'waiver') return;
    if (b.dataset.pm === 'buy') buy(b);
    else if (b.dataset.pm === 'manage') portal(b);
    else if (b.dataset.pm === 'login') ML.openSettings('account');
    else if (b.dataset.pm === 'check') { b.disabled = true; A().refresh().then(() => { emit('render'); fillStatus(); }).catch(e => toast(A().errText(e))).finally(() => { b.disabled = false; }); }
  });

  // Lemon Squeezy sends people back to the site with #premium-ok
  if (location.hash === '#premium-ok') {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    on('started', () => { if (signedIn()) waitForPremium(); });
  }

  /* ---------- Settings › Account ---------- */
  async function fillStatus() {
    const el = $('pm-status'); if (!el || !signedIn()) return;
    const u = A().user;
    if (u.owner && !u.premium) { el.textContent = t('pm_owner'); return; }
    try {
      const r = await A().fn('premium', { action: 'status' }), s = r.sub;
      const el2 = $('pm-status'); if (!el2) return;
      if (!s) { el2.textContent = r.premium ? t('pm_on') : t('pm_none'); return; }
      const lines = [];
      if (r.premium) lines.push(t('pm_on'));
      if (s.status === 'past_due') lines.push(t('pm_past_due'));
      else if (s.status === 'cancelled' && s.ends_at) lines.push(t('pm_ends', { d: day(s.ends_at) }));
      else if (r.premium && s.renews_at) lines.push(t('pm_renews', { d: day(s.renews_at) }));
      el2.textContent = lines.join(' ') || t('pm_none');
      const m = $('pm-manage'); if (m) m.hidden = false;
    } catch (e) { el.textContent = ''; }
  }
  ML.settingsSection({
    order: 6, cat: 'account',
    render: () => {
      if (!saleOn() || !signedIn()) return '';
      const prem = ML.isPremium && ML.isPremium();
      return `<h3>${esc(t('pm_h'))}</h3>
        <p class="hint" id="pm-status">${esc(prem ? t('pm_on') : '')}</p>
        ${prem ? '' : ML.premiumCta()}
        <div class="backup-btns">
          <button type="button" class="small" id="pm-manage" data-pm="manage" hidden>${esc(t('pm_manage'))}</button>
          <button type="button" class="small ghost" data-pm="check">${esc(t('pm_check'))}</button>
        </div>
        <p class="hint">${esc(t('pm_before_delete'))}</p>`;
    },
    bind: () => { fillStatus(); },
  });
})();
