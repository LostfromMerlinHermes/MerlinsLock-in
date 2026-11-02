// Health (3.62): a short daily check, off until asked for, kept on this device (ML.priv, out of the sync). It compares your
// own days and says what goes with better focus, and offers support when mood stays low. No calories, no weight, no food
// score, and no XP or streak on any of it: an answer that earns something stops being worth anything.
(() => {
  'use strict';
  const { $, S, t, esc, on, today, dayKey, fmtMins } = ML;

  ML.addStrings({
    fr: {
      hl_intro: 'Un check de 20 secondes après le choix d’énergie. Il relie ton corps à ton travail, à partir de tes propres journées. Reste sur cet appareil, jamais synchronisé. Ce n’est pas un avis médical.', hl_on: 'Activer', hl_off: 'Désactiver', hl_clear: 'Tout effacer',
      hl_today: 'Aujourd’hui', hl_lines: 'Lignes affichées', hl_links: 'Ce qui marche pour toi', hl_wait: 'Il faut au moins {n} jours de chaque côté pour comparer. Reviens dans quelques semaines.', hl_better: '{what} : ta note de focus passe de {a} à {b}, sur {n} jours.', hl_longer: '{what} : {a} de travail contre {b}, sur {n} jours.', hl_note: 'Ce sont des tendances chez toi, pas des causes.',
      q_sleep: 'Sommeil', q_water: 'Eau', q_move: 'Bougé', q_mood: 'Le moral', q_caffeine: 'Café, boissons énergisantes', q_alcohol: 'Alcool', q_meals: 'Repas pris',
      a_short: '< 6 h', a_mid: '7 h', a_long: '8 h +', a_low: 'Peu', a_ok: 'Bien', a_no: 'Non', a_yes: 'Oui', a_bad: 'Bas', a_med: 'Moyen', a_good: 'Bon', a_none: 'Aucun', a_some: 'Un peu', a_lots: 'Beaucoup',
      f_sleep: 'Après 7 h de sommeil ou plus', f_water: 'Les jours où tu as bien bu', f_move: 'Les jours où tu as bougé', f_mood: 'Les jours où le moral est bon', f_caffeine: 'Les jours avec peu de café', f_alcohol: 'Les jours sans alcool', f_meals: 'Les jours où tu as pris tes repas',
      sp_low: 'Le moral est bas depuis quelques jours.', sp_body: 'Parler à quelqu’un peut aider : un médecin, le service de santé de ta fac, une personne de confiance.', sp_h: 'Besoin de parler', sp_fr: 'En cas de pensées suicidaires, le 3114 répond jour et nuit, gratuitement.', sp_other: 'Hors de France, findahelpline.com liste les lignes d’écoute de ton pays.', sp_urg: 'En cas de danger immédiat, appelle le 112.',
    },
    en: {
      hl_intro: 'A 20-second check after you pick your energy. It links your body to your work, from your own days. It stays on this device and is never synced. This is not medical advice.', hl_on: 'Turn on', hl_off: 'Turn off', hl_clear: 'Clear everything',
      hl_today: 'Today', hl_lines: 'Lines shown', hl_links: 'What works for you', hl_wait: 'It takes at least {n} days on each side to compare. Come back in a few weeks.', hl_better: '{what}: your focus rating goes from {a} to {b}, over {n} days.', hl_longer: '{what}: {a} of work against {b}, over {n} days.', hl_note: 'These are trends in your days, not causes.',
      q_sleep: 'Sleep', q_water: 'Water', q_move: 'Moved', q_mood: 'Mood', q_caffeine: 'Coffee, energy drinks', q_alcohol: 'Alcohol', q_meals: 'Meals eaten',
      a_short: '< 6 h', a_mid: '7 h', a_long: '8 h +', a_low: 'Little', a_ok: 'Enough', a_no: 'No', a_yes: 'Yes', a_bad: 'Low', a_med: 'Medium', a_good: 'Good', a_none: 'None', a_some: 'Some', a_lots: 'A lot',
      f_sleep: 'After 7 h of sleep or more', f_water: 'Days you drank enough', f_move: 'Days you moved', f_mood: 'Days your mood is good', f_caffeine: 'Days with little coffee', f_alcohol: 'Days without alcohol', f_meals: 'Days you ate your meals',
      sp_low: 'Your mood has been low for a few days.', sp_body: 'Talking to someone can help: a doctor, your university health service, someone you trust.', sp_h: 'Need to talk', sp_fr: 'In France, if you have suicidal thoughts, 3114 answers day and night, free of charge.', sp_other: 'Elsewhere, findahelpline.com lists helplines in your country.', sp_urg: 'If you are in immediate danger, call your local emergency number.',
    },
  });

  // [key, answers, the answers that count as the "good" side of a comparison]
  const LINES = [['sleep', ['short', 'mid', 'long'], ['mid', 'long']], ['water', ['low', 'ok'], ['ok']], ['move', ['no', 'yes'], ['yes']], ['mood', ['bad', 'med', 'good'], ['good']], ['caffeine', ['none', 'some', 'lots'], ['none', 'some']], ['alcohol', ['no', 'yes'], ['no']], ['meals', ['no', 'yes'], ['yes']]];
  const DEFAULT_LINES = ['sleep', 'water', 'move', 'mood'], MIN_DAYS = 5;
  const P = ML.priv;
  const cfg = () => P.get('healthCfg', { on: false, lines: DEFAULT_LINES });
  const log = () => P.get('health', {});

  const form = id => { const c = cfg(), d = log()[today()] || {}; return LINES.filter(l => c.lines.includes(l[0])).map(([k, ans]) => `<div class="y-q" id="${id}-${k}"><span>${esc(t('q_' + k))}</span><div class="y-seg" role="group" aria-label="${esc(t('q_' + k))}">${ans.map(a => `<button type="button" data-hq="${k}" data-ha="${a}" aria-pressed="${d[k] === a}">${esc(t('a_' + a))}</button>`).join('')}</div></div>`).join(''); };
  function answer(k, a) {
    const l = log(), d = l[today()] = l[today()] || {};
    if (d[k] === a) delete d[k]; else d[k] = a;
    P.set('health', l);
    render();
    if ($('hcheck') && !$('hcheck').hidden) { $('hcheck').querySelector('.y-qs').innerHTML = form('hc'); }
  }

  /* ---------- Comparing your own days ---------- */
  function dayStats() {
    const m = {};
    S.sessions.forEach(s => { const k = dayKey(new Date(s.at)), o = m[k] = m[k] || { mins: 0, r: 0, n: 0 }; o.mins += s.mins; if (s.rating) { o.r += s.rating; o.n++; } });
    return m;
  }
  function links() {
    const l = log(), days = dayStats(), out = [];
    LINES.forEach(([k, , good]) => {
      const yes = [], no = [];
      Object.entries(l).forEach(([day, d]) => { if (d[k] == null || !days[day]) return; (good.includes(d[k]) ? yes : no).push(days[day]); });
      if (yes.length < MIN_DAYS || no.length < MIN_DAYS) return;
      const avg = (a, f) => { const v = a.filter(x => f(x) != null).map(f); return v.length ? v.reduce((p, c) => p + c, 0) / v.length : null; };
      const ra = avg(no, x => (x.n ? x.r / x.n : null)), rb = avg(yes, x => (x.n ? x.r / x.n : null)), ma = avg(no, x => x.mins), mb = avg(yes, x => x.mins), n = yes.length + no.length;
      if (ra != null && rb != null && rb - ra >= 0.3) out.push(t('hl_better', { what: t('f_' + k), a: ra.toFixed(1), b: rb.toFixed(1), n }));
      else if (mb - ma >= 20) out.push(t('hl_longer', { what: t('f_' + k), a: fmtMins(Math.round(mb)), b: fmtMins(Math.round(ma)), n }));
    });
    return out;
  }
  // Low on at least 3 of the last 4 days answered in the last week
  function moodLow() {
    const l = log(), cut = dayKey(new Date(Date.now() - 7 * 864e5)), last = Object.keys(l).filter(k => k >= cut && l[k].mood).sort().slice(-4);
    return last.filter(k => l[k].mood === 'bad').length >= 3;
  }
  const support = low => `<div class="g-card y-support"><h2>${esc(low ? t('sp_low') : t('sp_h'))}</h2><p class="insight">${esc(t('sp_body'))}</p><p class="insight">${esc(t('sp_fr'))}</p><p class="insight">${esc(t('sp_other'))} ${esc(t('sp_urg'))}</p></div>`;

  /* ---------- The page ---------- */
  function render() {
    const el = $('health'); if (!el || S.tab !== 'health') return;
    const c = cfg();
    let html;
    if (!c.on) html = `<div class="y-page"><div class="g-card"><h2>${esc(t('tab_health'))}</h2><p class="insight">${esc(t('hl_intro'))}</p><button type="button" class="small primary" data-hon>${esc(t('hl_on'))}</button></div>${support(false)}</div>`;
    else {
      const low = moodLow(), found = links();
      html = `<div class="y-page">${low ? support(true) : ''}<div class="g-card"><h2>${esc(t('hl_today'))}</h2><div class="y-qs">${form('hl')}</div></div>
        <div class="g-card"><h2>${esc(t('hl_links'))}</h2>${found.length ? found.map(x => `<p class="insight">${esc(x)}</p>`).join('') + `<p class="insight"><small>${esc(t('hl_note'))}</small></p>` : `<p class="insight">${esc(t('hl_wait', { n: MIN_DAYS }))}</p>`}</div>
        <details class="g-card y-det"><summary>${esc(t('hl_lines'))}</summary><div class="y-lines">${LINES.map(([k]) => `<label class="opt"><input type="checkbox" data-hline="${k}" ${c.lines.includes(k) ? 'checked' : ''}> ${esc(t('q_' + k))}</label>`).join('')}</div></details>
        ${low ? '' : support(false)}
        <div class="y-btns"><button type="button" class="small ghost" data-hoff>${esc(t('hl_off'))}</button><button type="button" class="small ghost" id="hl-clear"></button></div></div>`;
    }
    if (el.dataset.h === html) return;
    const open = el.querySelector('details[open]') ? 1 : 0;
    el.innerHTML = html; el.dataset.h = html;
    if (open && el.querySelector('details')) el.querySelector('details').open = true;
    const b = el.querySelector('#hl-clear');
    if (b) ML.armedButton(b, 'hl_clear', () => { P.del('health'); render(); });
  }
  const box = $('health');
  box.addEventListener('click', e => {
    const a = e.target.closest('[data-hq]');
    if (a) return answer(a.dataset.hq, a.dataset.ha);
    if (e.target.closest('[data-hon]')) { P.set('healthCfg', Object.assign(cfg(), { on: true })); return render(); }
    if (e.target.closest('[data-hoff]')) { P.set('healthCfg', Object.assign(cfg(), { on: false })); return render(); }
  });
  box.addEventListener('change', e => {
    const k = e.target.dataset.hline; if (!k) return;
    const c = cfg(); c.lines = e.target.checked ? [...new Set([...c.lines, k])] : c.lines.filter(x => x !== k);
    P.set('healthCfg', c); render();
  });

  /* ---------- The check, once a day, right after the energy ---------- */
  function offerCheck() {
    const c = cfg(); if (!c.on || !c.lines.length || P.get('healthAsked') === today() || log()[today()]) return;
    if ((ML.energyOpen && ML.energyOpen()) || ML.running()) return;
    P.set('healthAsked', today());
    ML.ySheet('hcheck', `<h2>${esc(t('hl_today'))}</h2><div class="y-qs">${form('hc')}</div><button type="button" class="primary" data-close="hcheck">${esc(t('tip_ok'))}</button>`, r => {
      r.querySelector('.y-qs').onclick = e => { const a = e.target.closest('[data-hq]'); if (a) answer(a.dataset.hq, a.dataset.ha); };
    });
  }
  on('mood', () => setTimeout(offerCheck, 500));
  on('tab', render); on('render', render); on('lang', render); on('rated', render);
})();
