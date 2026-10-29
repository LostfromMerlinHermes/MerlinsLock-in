// Mail drafts (3.50, proposals/plan-v2 E1 + F8): a task can carry an email (to, subject, text), written in the app,
// even during a session, then opened ready to send in Gmail, Outlook or the device's mail app (nothing is sent by us,
// so it costs nothing and needs no account). Coming back after opening it offers to complete the task. Templates: three
// free, three more with Premium; Premium can also add a "follow up in 3 days" task when the mail is opened.
(() => {
  'use strict';
  const { S, t, esc, on, $, today, addDays, uid } = ML;
  const save = () => ML.save();
  ML.addStrings({
    fr: {
      ml_write: 'Écrire le mail', ml_chip: 'Mail', ml_title: 'Mail', ml_to: 'À', ml_subject: 'Objet', ml_body: 'Message', ml_to_ph: 'adresse@exemple.fr',
      ml_templates: 'Modèles', ml_gmail: 'Ouvrir dans Gmail', ml_outlook: 'Outlook', ml_app: 'App Mail', ml_copy: 'Copier', ml_copied: 'Mail copié.',
      ml_hint: 'Le mail s’ouvre prêt à partir : tu cliques Envoyer. Rien n’est envoyé sans toi.', ml_sent_q: 'Mail envoyé ? Terminer « {title} »', ml_done: 'Terminer',
      ml_follow: 'Créer une relance dans 3 jours', ml_follow_task: 'Relancer : {subject}', ml_follow_ok: 'Relance prévue le {d}.', ml_premium: 'Premium', ml_clear: 'Effacer le mail',
      ml_empty_to: 'Ajoute une adresse, ou ouvre quand même sans destinataire.',
      mt_relance: 'Relance', mt_question: 'Question', mt_merci: 'Remerciement', mt_candidature: 'Candidature', mt_delai: 'Demande de délai', mt_absence: 'Absence',
      mt_relance_s: 'Relance : {sujet}', mt_relance_b: 'Bonjour,\n\nJe me permets de revenir vers vous au sujet de {sujet}. Avez-vous pu avancer de votre côté ?\n\nMerci d’avance,\n',
      mt_question_s: 'Question sur {sujet}', mt_question_b: 'Bonjour,\n\nJ’ai une question au sujet de {sujet} : \n\nMerci pour votre aide,\n',
      mt_merci_s: 'Merci', mt_merci_b: 'Bonjour,\n\nMerci beaucoup pour {sujet}. \n\nBien à vous,\n',
      mt_candidature_s: 'Candidature : {sujet}', mt_candidature_b: 'Bonjour,\n\nJe vous adresse ma candidature pour {sujet}. Vous trouverez mon CV en pièce jointe.\n\nJe reste disponible pour un échange.\n\nCordialement,\n',
      mt_delai_s: 'Demande de délai : {sujet}', mt_delai_b: 'Bonjour,\n\nJe vous écris pour demander un délai supplémentaire pour {sujet}, jusqu’au [date], car [raison].\n\nMerci de votre compréhension,\n',
      mt_absence_s: 'Absence le [date]', mt_absence_b: 'Bonjour,\n\nJe serai absent(e) le [date] pour [raison]. Je rattraperai {sujet}.\n\nCordialement,\n',
    },
    en: {
      ml_write: 'Write the email', ml_chip: 'Email', ml_title: 'Email', ml_to: 'To', ml_subject: 'Subject', ml_body: 'Message', ml_to_ph: 'name@example.com',
      ml_templates: 'Templates', ml_gmail: 'Open in Gmail', ml_outlook: 'Outlook', ml_app: 'Mail app', ml_copy: 'Copy', ml_copied: 'Email copied.',
      ml_hint: 'The email opens ready to go: you click Send. Nothing is sent without you.', ml_sent_q: 'Email sent? Complete "{title}"', ml_done: 'Complete',
      ml_follow: 'Add a follow-up in 3 days', ml_follow_task: 'Follow up: {subject}', ml_follow_ok: 'Follow-up set for {d}.', ml_premium: 'Premium', ml_clear: 'Clear the email',
      ml_empty_to: 'Add an address, or open it anyway without a recipient.',
      mt_relance: 'Follow-up', mt_question: 'Question', mt_merci: 'Thank you', mt_candidature: 'Application', mt_delai: 'Extension request', mt_absence: 'Absence',
      mt_relance_s: 'Follow-up: {sujet}', mt_relance_b: 'Hello,\n\nI am following up on {sujet}. Have you had a chance to look at it?\n\nThank you,\n',
      mt_question_s: 'Question about {sujet}', mt_question_b: 'Hello,\n\nI have a question about {sujet}: \n\nThank you for your help,\n',
      mt_merci_s: 'Thank you', mt_merci_b: 'Hello,\n\nThank you very much for {sujet}. \n\nBest regards,\n',
      mt_candidature_s: 'Application: {sujet}', mt_candidature_b: 'Hello,\n\nPlease find my application for {sujet}, with my CV attached.\n\nI am available for a call.\n\nKind regards,\n',
      mt_delai_s: 'Extension request: {sujet}', mt_delai_b: 'Hello,\n\nI am writing to ask for more time for {sujet}, until [date], because [reason].\n\nThank you for your understanding,\n',
      mt_absence_s: 'Absence on [date]', mt_absence_b: 'Hello,\n\nI will be absent on [date] because [reason]. I will catch up on {sujet}.\n\nKind regards,\n',
    },
  });
  const FREE = ['relance', 'question', 'merci'], PREM = ['candidature', 'delai', 'absence'];
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  // tasks whose title sounds like an email get a "Mail" chip even before a draft exists
  const MAILY = /\b(relancer|relance|r[ée]pondre|mail|e-?mail|courriel|[ée]crire [àa]|candidater|follow[- ]?up|reply|write to|email)\b/i;
  const ENV = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>';
  ML.MAIL_SVG = ENV;

  // the row: a "Mail" chip (app.js shows ML.taskBadges in the row's meta line)
  const prevBadges = ML.taskBadges;
  ML.taskBadges = task => {
    const r = prevBadges ? prevBadges(task) : { html: '', cls: '' };
    const has = task.mail && (task.mail.to || task.mail.subject || task.mail.body);
    if (task.done || (!has && !MAILY.test(ML.titleOf(task)))) return r;
    return { cls: r.cls, html: (r.html || '') + `<button type="button" class="chip mail-chip ${has ? 'has' : ''}" data-mail="1" title="${esc(t('ml_write'))}">${ENV}${esc(t('ml_chip'))}</button>` };
  };
  // the edit form: a button to write the email
  const prevExtras = ML.taskEditExtras;
  ML.taskEditExtras = task => (prevExtras ? prevExtras(task) : '') + `<button type="button" class="small ghost mail-edit" data-mail="1">${ENV}${esc(t('ml_write'))}</button>`;
  $('tasks').addEventListener('click', e => {
    const b = e.target.closest('[data-mail]'); if (!b) return;
    const li = b.closest('.task'); if (!li) return;
    e.stopPropagation(); e.preventDefault();
    open(li.dataset.id);
  }, true);

  /* ---------- The sheet ---------- */
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'mail-sheet'; ov.hidden = true;
  ov.innerHTML = `<div class="sheet mail-sheet" role="dialog" aria-modal="true" aria-labelledby="ml-h">
    <div class="sheet-head"><h2 id="ml-h"></h2><button type="button" class="ghost icon-only" data-close="mail-sheet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div id="ml-body"></div></div>`;
  document.body.appendChild(ov);
  let cur = null, tSave = null, follow = false;
  const task = () => S.tasks.find(x => x.id === cur);
  function open(id) {
    cur = id; const x = task(); if (!x) return;
    x.mail = x.mail || { to: '', subject: '', body: '' };
    follow = false;
    render(); ML.openOverlay('mail-sheet');
    setTimeout(() => { const f = x.mail.to ? $('ml-subject') : $('ml-to'); if (f) f.focus(); }, 40);
  }
  ML.openMail = open;
  function render() {
    const x = task(); if (!x) return;
    const m = x.mail, prem = isPrem();
    $('ml-h').textContent = t('ml_title') + ' · ' + ML.titleOf(x);
    $('ml-body').innerHTML = `
      <div class="ml-tpl"><span class="label">${esc(t('ml_templates'))}</span>
        ${FREE.map(k => `<button type="button" class="chip-btn" data-tpl="${k}">${esc(t('mt_' + k))}</button>`).join('')}
        ${PREM.map(k => `<button type="button" class="chip-btn ${prem ? '' : 'locked'}" data-tpl="${k}" ${prem ? '' : `aria-disabled="true" title="${esc(t('ml_premium'))}"`}>${esc(t('mt_' + k))}${prem ? '' : ` <small>${esc(t('ml_premium'))}</small>`}</button>`).join('')}</div>
      <label class="ml-f"><span>${esc(t('ml_to'))}</span><input type="email" id="ml-to" multiple maxlength="300" placeholder="${esc(t('ml_to_ph'))}" value="${esc(m.to || '')}" autocomplete="email"></label>
      <label class="ml-f"><span>${esc(t('ml_subject'))}</span><input type="text" id="ml-subject" maxlength="200" value="${esc(m.subject || '')}"></label>
      <label class="ml-f ml-fb"><span>${esc(t('ml_body'))}</span><textarea id="ml-text" rows="9" maxlength="8000">${esc(m.body || '')}</textarea></label>
      ${prem ? `<label class="ml-follow"><input type="checkbox" id="ml-follow" ${follow ? 'checked' : ''}> ${esc(t('ml_follow'))}</label>` : ''}
      <p class="hint">${esc(t('ml_hint'))}</p>
      <div class="ml-btns">
        <button type="button" class="primary" data-mopen="gmail">${esc(t('ml_gmail'))}</button>
        <button type="button" data-mopen="outlook">${esc(t('ml_outlook'))}</button>
        <button type="button" data-mopen="app">${esc(t('ml_app'))}</button>
        <button type="button" class="ghost" data-mopen="copy">${esc(t('ml_copy'))}</button>
        <button type="button" class="ghost small ml-clear" data-mopen="clear">${esc(t('ml_clear'))}</button>
      </div>`;
  }
  function read() {
    const x = task(); if (!x || !$('ml-to')) return;
    x.mail = { to: $('ml-to').value.trim(), subject: $('ml-subject').value, body: $('ml-text').value };
    clearTimeout(tSave); tSave = setTimeout(save, 400);
  }
  ov.addEventListener('input', e => { if (e.target.closest('.ml-f')) read(); });
  ov.addEventListener('change', e => { if (e.target.id === 'ml-follow') follow = e.target.checked; });
  // the topic: the task's title without its verb ("Relancer pour la convention" → "la convention")
  const topic = x => ML.titleOf(x).replace(/^(relancer|relance|r[ée]pondre|[ée]crire|envoyer un mail|mail|e-?mail|candidater|follow[- ]?up( on)?|reply|write|email)\s*(:|[àa]|aux?|pour|au sujet de|à propos de|concernant|sur|to|about|for|on)?\s*/i, '').trim() || ML.titleOf(x);
  const fill = (s, x) => s.replace(/\{sujet\}/g, topic(x));
  ov.addEventListener('click', e => {
    const tp = e.target.closest('[data-tpl]'), op = e.target.closest('[data-mopen]'); const x = task(); if (!x) return;
    if (tp) {
      if (tp.getAttribute('aria-disabled') === 'true') { ML.toast(t('premium_only')); return; }
      read();
      const k = tp.dataset.tpl;
      x.mail.subject = fill(t('mt_' + k + '_s'), x);
      x.mail.body = fill(t('mt_' + k + '_b'), x);
      save(); render(); $('ml-text').focus(); return;
    }
    if (!op) return;
    read();
    const k = op.dataset.mopen, m = x.mail;
    if (k === 'clear') { delete x.mail; save(); ML.closeOverlay('mail-sheet'); ML.renderAll(); return; }
    const plain = `${t('ml_to')} : ${m.to}\n${t('ml_subject')} : ${m.subject}\n\n${m.body}`;
    if (k === 'copy') { copy(plain); return; }
    const enc = encodeURIComponent;
    const url = k === 'gmail' ? `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(m.to)}&su=${enc(m.subject)}&body=${enc(m.body)}`
      : k === 'outlook' ? `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(m.to)}&subject=${enc(m.subject)}&body=${enc(m.body)}`
      : `mailto:${m.to.split(/[,;\s]+/).filter(Boolean).map(enc).join(',')}?subject=${enc(m.subject)}&body=${enc(m.body)}`;
    if (!m.to) ML.toast(t('ml_empty_to'), { ms: 2400, key: 'mlto' });
    go(url, k === 'app');
    if (follow && isPrem()) addFollowUp(x);
    pending = { id: x.id, at: Date.now() };
    ML.closeOverlay('mail-sheet'); ML.renderAll();
  });
  function go(url, sameTab) {
    if (sameTab) { location.href = url; return; }
    const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  }
  function copy(text) {
    const done = () => ML.toast(t('ml_copied'), { ms: 1800 });
    try { navigator.clipboard.writeText(text).then(done, () => fallback()); } catch (e) { fallback(); }
    function fallback() { const ta = $('ml-text'); if (ta) { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} } }
  }
  ML.copyText = copy;
  // F8: a follow-up task in 3 days, its email already pointed at the same person
  function addFollowUp(x) {
    const m = x.mail, d = addDays(today(), 3), subj = m.subject || ML.titleOf(x);
    const y = { id: uid(), title: t('ml_follow_task', { subject: subj }).slice(0, 120), mins: 15, pri: 'med', done: false, created: Date.now(), due: d,
      mail: { to: m.to, subject: (/^(re|relance|follow-up)\s*:/i.test(subj) ? '' : t('mt_relance_s').replace('{sujet}', '')) + subj, body: fill(t('mt_relance_b'), x) } };
    if (x.project) y.project = x.project;
    S.tasks.push(y); save();
    ML.toast(t('ml_follow_ok', { d: ML.planDayLabel ? ML.planDayLabel(d) : d }), { ms: 2600 });
  }

  // Back in the app after opening the mail: offer to complete the task
  let pending = null;
  function back() {
    if (!pending || document.hidden) return;
    const p = pending; if (Date.now() - p.at < 2500) return;
    pending = null;
    const x = S.tasks.find(y => y.id === p.id); if (!x || x.done) return;
    ML.toast(t('ml_sent_q', { title: ML.titleOf(x) }), { ms: 9000, key: 'mlsent', action: { label: t('ml_done'), fn: () => { ML.completeTask(x); save(); ML.renderAll(); } } });
  }
  document.addEventListener('visibilitychange', back);
  addEventListener('focus', back);
  on('task:deleted', id => { if (cur === id) { cur = null; ML.closeOverlay('mail-sheet'); } });
})();
