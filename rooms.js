// Study rooms (You space, free with an account since 3.58): friends join with a 6-letter code and share one focus timer
// and a list of shared tasks; a call link (Meet, Zoom...) can be pinned. The host's Premium opens a bigger room (25 instead
// of 6), its history and planned sessions, and the room quiz: a deck everybody answers during the break.
// Data lives in Supabase (supabase/study-rooms.sql, then supabase/room-tasks.sql); the app polls every few seconds.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, toast } = ML;

  ML.addStrings({
    fr: {
      tab_room: 'Salle', st_room: 'Salle', rm_intro: 'Étudie avec tes amis : un minuteur partagé, des tâches communes, et tu vois qui est concentré.', rm_signin: 'Connecte-toi à ton compte pour utiliser les salles d’étude : elles passent par le serveur.', rm_signin_btn: 'Se connecter',
      rm_create: 'Créer une salle', rm_name_ph: 'Nom de la salle (ex. Révisions bac)', rm_join: 'Rejoindre', rm_code_ph: 'Code (6 lettres)', rm_you_ph: 'Ton pseudo dans la salle',
      rm_code: 'Code à partager', rm_copy: 'Copier le code', rm_copied: 'Code copié', rm_members: 'Présents', rm_leave: 'Quitter la salle', rm_close: 'Fermer la salle',
      rm_host: 'hôte', rm_focus: 'concentré', rm_break: 'en pause', rm_idle: 'disponible', rm_away: 'absent',
      rm_timer_idle: 'En attente de l’hôte', rm_start_focus: 'Focus {m} min', rm_start_break: 'Pause {m} min', rm_stop: 'Arrêter', rm_follow: 'Lancer mon minuteur avec la salle',
      rm_not_found: 'Aucune salle avec ce code.', rm_full: 'Cette salle est complète ({n} personnes).', rm_err: 'Salles indisponibles. Vérifie que les tables Supabase existent.', rm_started: 'La salle démarre : {m} min de focus',
      rm_focus_lbl: 'Focus en commun', rm_break_lbl: 'Pause en commun', rm_cap: '{n} sur {m}',
      rm_tasks: 'Tâches communes', rm_task_ph: 'Ajouter une tâche pour la salle', rm_task_add: 'Ajouter', rm_tasks_none: 'Aucune tâche commune. Ajoute la première.', rm_task_by: 'fait par {n}', rm_tasks_sql: 'Les tâches communes demandent la mise à jour de la base (room-tasks.sql).',
      rm_call: 'Appel', rm_call_join: 'Rejoindre l’appel', rm_call_ph: 'Coller le lien de l’appel', rm_call_set: 'Épingler', rm_call_meet: 'Créer un Meet', rm_call_zoom: 'Créer un Zoom', rm_call_clear: 'Retirer', rm_call_bad: 'Colle un lien complet, qui commence par https://',
      rm_quiz: 'Quiz de salle', rm_quiz_deck: 'Paquet', rm_quiz_go: 'Lancer le quiz', rm_quiz_prem: 'Avec Premium, l’hôte lance un quiz sur un paquet pendant la pause. Tout le monde peut y répondre.', rm_quiz_q: 'Question {i} sur {n}', rm_quiz_show: 'Voir la réponse', rm_quiz_knew: 'Je savais', rm_quiz_not: 'Je ne savais pas', rm_quiz_done: 'Tu as fini : {s} sur {n}', rm_quiz_end: 'Terminer le quiz', rm_quiz_nocards: 'Ce paquet n’a pas de carte.',
      rm_history: 'Historique', rm_history_v: '{h} de focus lancées, {n} sessions', rm_history_prem: 'Avec Premium : jusqu’à 25 personnes, l’historique et les sessions planifiées.', rm_next: 'Prochaine session', rm_next_set: 'Planifier', rm_next_at: 'Prochaine session : {d}', rm_next_clear: 'Annuler',
    },
    en: {
      tab_room: 'Room', st_room: 'Room', rm_intro: 'Study with friends: one shared timer, shared tasks, and you see who is focusing.', rm_signin: 'Sign in to your account to use study rooms: they go through the server.', rm_signin_btn: 'Sign in',
      rm_create: 'Create a room', rm_name_ph: 'Room name (e.g. Finals prep)', rm_join: 'Join', rm_code_ph: 'Code (6 letters)', rm_you_ph: 'Your name in the room',
      rm_code: 'Code to share', rm_copy: 'Copy code', rm_copied: 'Code copied', rm_members: 'Here now', rm_leave: 'Leave room', rm_close: 'Close room',
      rm_host: 'host', rm_focus: 'focusing', rm_break: 'on a break', rm_idle: 'available', rm_away: 'away',
      rm_timer_idle: 'Waiting for the host', rm_start_focus: 'Focus {m} min', rm_start_break: 'Break {m} min', rm_stop: 'Stop', rm_follow: 'Start my timer with the room',
      rm_not_found: 'No room with that code.', rm_full: 'This room is full ({n} people).', rm_err: 'Rooms unavailable. Check that the Supabase tables exist.', rm_started: 'The room starts: {m} min of focus',
      rm_focus_lbl: 'Shared focus', rm_break_lbl: 'Shared break', rm_cap: '{n} of {m}',
      rm_tasks: 'Shared tasks', rm_task_ph: 'Add a task for the room', rm_task_add: 'Add', rm_tasks_none: 'No shared task yet. Add the first one.', rm_task_by: 'done by {n}', rm_tasks_sql: 'Shared tasks need the database update (room-tasks.sql).',
      rm_call: 'Call', rm_call_join: 'Join the call', rm_call_ph: 'Paste the call link', rm_call_set: 'Pin', rm_call_meet: 'New Meet', rm_call_zoom: 'New Zoom', rm_call_clear: 'Remove', rm_call_bad: 'Paste a full link starting with https://',
      rm_quiz: 'Room quiz', rm_quiz_deck: 'Deck', rm_quiz_go: 'Start the quiz', rm_quiz_prem: 'With Premium, the host starts a quiz on a deck during the break. Anyone can answer.', rm_quiz_q: 'Question {i} of {n}', rm_quiz_show: 'Show the answer', rm_quiz_knew: 'I knew it', rm_quiz_not: 'I didn’t know', rm_quiz_done: 'You finished: {s} of {n}', rm_quiz_end: 'End the quiz', rm_quiz_nocards: 'This deck has no cards.',
      rm_history: 'History', rm_history_v: '{h} of focus started, {n} sessions', rm_history_prem: 'With Premium: up to 25 people, history and planned sessions.', rm_next: 'Next session', rm_next_set: 'Plan', rm_next_at: 'Next session: {d}', rm_next_clear: 'Cancel',
    },
  });
  ML.defaults(() => ({ room: { code: null, follow: true, me: '' } }));

  const FREE_CAP = 6, PREMIUM_CAP = 25, QUIZ_LEN = 10;
  const R = () => S.room;
  const me = () => ML.auth && ML.auth.user;
  const rest = (p, o) => ML.auth.rest(p, o);
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  let room = null, members = [], tasks = [], tasksOk = true, lastErr = false, pollT = null, tickT = null, lastStartAt = null;
  let quizSt = { id: null, i: 0, score: 0, shown: false }; // my progress in the room's quiz
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ALPH[b % ALPH.length]).join('');
  const myStatus = () => (ML.running() ? (S.mode === 'focus' ? 'focus' : 'break') : 'idle');
  const isHost = () => room && me() && room.host === me().id;
  const fresh = m => Date.now() - new Date(m.seen_at).getTime() < 60000;
  const myName = () => (R().me || me().email.split('@')[0]).slice(0, 24);
  const capOf = r => (r && r.cap) || FREE_CAP;
  const statsOf = () => (room && room.stats) || {};
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } };

  /* ---------- Server ---------- */
  async function presence(extra) {
    if (!R().code || !me()) return;
    await rest('/rest/v1/room_members?on_conflict=room_code,user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
      body: Object.assign({ room_code: R().code, user_id: me().id, name: myName(), status: myStatus(), seen_at: new Date().toISOString() }, extra) });
  }
  async function pull() {
    if (!R().code || !me()) return;
    try {
      const [rows, mem] = await Promise.all([
        rest('/rest/v1/study_rooms?select=*&code=eq.' + R().code),
        rest('/rest/v1/room_members?select=*&room_code=eq.' + R().code + '&order=seen_at.desc'),
      ]);
      if (!rows || !rows.length) { const was = R().code; R().code = null; room = null; members = []; tasks = []; save(); if (was) toast(t('rm_not_found')); renderIfOpen(); return; }
      room = rows[0]; members = mem || []; lastErr = false;
      try { tasks = await rest('/rest/v1/room_tasks?select=*&room_code=eq.' + R().code + '&order=created_at.asc') || []; tasksOk = true; } catch (e) { tasksOk = false; } // the update SQL may not have run yet
      follow();
      await presence();
    } catch (e) { lastErr = true; }
    renderIfOpen();
  }
  // Follow mode: when the host starts a focus round, start the local timer for the time left
  function follow() {
    const T = room && room.timer; if (!T || !T.endAt || T.mode !== 'focus' || !R().follow) return;
    if (lastStartAt === T.startAt || T.endAt <= Date.now() || ML.running()) { lastStartAt = T.startAt; return; }
    lastStartAt = T.startAt;
    const mins = Math.max(1, Math.round((T.endAt - Date.now()) / 60000));
    if (ML.lockIn({ title: room.name || t('st_room'), mins })) toast(t('rm_started', { m: mins }));
  }
  const patchRoom = body => rest('/rest/v1/study_rooms?code=eq.' + room.code, { method: 'PATCH', prefer: 'return=minimal', body: Object.assign(body, { updated_at: new Date().toISOString() }) });
  async function setTimer(mode, mins) {
    if (!isHost()) return;
    const now = Date.now(), timer = mode ? { mode, mins, startAt: now, endAt: now + mins * 60000 } : {}, body = { timer };
    if (mode === 'focus') { const st = statsOf(); room.stats = body.stats = Object.assign({}, st, { mins: (st.mins || 0) + mins, sessions: (st.sessions || 0) + 1 }); }
    await patchRoom(body);
    room.timer = timer; if (mode === 'focus') follow(); renderIfOpen();
  }
  const setStats = async patch => { if (!isHost()) return; room.stats = Object.assign({}, statsOf(), patch); await patchRoom({ stats: room.stats }); renderIfOpen(); };
  async function create(name) {
    const code = newCode(), cap = isPrem() ? PREMIUM_CAP : FREE_CAP;
    await rest('/rest/v1/study_rooms', { method: 'POST', prefer: 'return=minimal', body: { code, host: me().id, name: name.slice(0, 40), timer: {}, cap, stats: {} } });
    R().code = code; save(); await pull(); schedule();
  }
  async function join(code) {
    const rows = await rest('/rest/v1/study_rooms?select=code,cap&code=eq.' + code);
    if (!rows || !rows.length) { toast(t('rm_not_found')); return; }
    const mem = await rest('/rest/v1/room_members?select=user_id,seen_at&room_code=eq.' + code), cap = capOf(rows[0]);
    if ((mem || []).filter(m => fresh(m) && m.user_id !== me().id).length >= cap) { toast(t('rm_full', { n: cap })); return; }
    R().code = code; save(); await pull(); schedule();
  }
  async function leave() {
    const code = R().code; if (!code) return;
    try {
      if (isHost()) await rest('/rest/v1/study_rooms?code=eq.' + code, { method: 'DELETE', prefer: 'return=minimal' });
      else await rest('/rest/v1/room_members?room_code=eq.' + code + '&user_id=eq.' + me().id, { method: 'DELETE', prefer: 'return=minimal' });
    } catch (e) {}
    R().code = null; room = null; members = []; tasks = []; save(); renderIfOpen();
  }
  // Shared tasks: anyone in the room adds, checks and removes
  async function addTask(title) {
    await rest('/rest/v1/room_tasks', { method: 'POST', prefer: 'return=minimal', body: { id: ML.uid(), room_code: R().code, title: title.slice(0, 120), done: false, created_by: me().id, created_at: new Date().toISOString() } });
    await pull();
  }
  async function toggleTask(id) {
    const x = tasks.find(y => y.id === id); if (!x) return;
    const done = !x.done, patch = { done, done_by: done ? myName() : null };
    Object.assign(x, patch); renderIfOpen();
    await rest('/rest/v1/room_tasks?id=eq.' + encodeURIComponent(id), { method: 'PATCH', prefer: 'return=minimal', body: patch });
  }
  async function delTask(id) {
    tasks = tasks.filter(x => x.id !== id); renderIfOpen();
    await rest('/rest/v1/room_tasks?id=eq.' + encodeURIComponent(id), { method: 'DELETE', prefer: 'return=minimal' });
  }
  // The room quiz: the host copies up to 10 cards of a deck into the room, each member answers at their own pace
  async function startQuiz(deckId) {
    if (!isHost() || !isPrem()) return;
    const cards = S.study.cards.filter(c => c.deck === deckId), deck = S.study.decks.find(d => d.id === deckId);
    if (!cards.length) { toast(t('rm_quiz_nocards')); return; }
    const items = cards.slice().sort(() => Math.random() - .5).slice(0, QUIZ_LEN).map(c => ({ q: String(c.front).slice(0, 500), a: String(c.back).slice(0, 500) }));
    await setStats({ quiz: { id: ML.uid(), deck: deck ? deck.name : '', items } });
  }
  async function quizAnswer(knew) {
    const Q = statsOf().quiz; if (!Q) return;
    if (knew) quizSt.score++;
    quizSt.i++; quizSt.shown = false; renderIfOpen();
    await presence({ score: quizSt.score, quiz_id: Q.id, quiz_n: quizSt.i });
  }
  // Poll every 5 s while the room is on screen, every 20 s otherwise (presence keeps updating)
  function schedule() {
    clearTimeout(pollT);
    if (!R().code || !me()) return;
    const visible = document.visibilityState === 'visible' && S.tab === 'room';
    pollT = setTimeout(async () => { if (document.visibilityState === 'visible') await pull(); schedule(); }, visible ? 5000 : 20000);
  }

  /* ---------- UI ---------- */
  const clockOf = T => { if (!T || !T.endAt) return null; const left = Math.max(0, (T.endAt - Date.now()) / 1000); return MiniView.fmtClock(left); };
  const when = ms => new Date(ms).toLocaleString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function callHtml() {
    const url = safeUrl(statsOf().call || '');
    return `<div class="rm-sec"><span class="label">${esc(t('rm_call'))}</span>
      ${url ? `<div class="rm-row"><a class="rm-call" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('rm_call_join'))}</a>${isHost() ? `<button type="button" class="small ghost" data-rmcall-clear>${esc(t('rm_call_clear'))}</button>` : ''}</div>` : ''}
      ${isHost() && !url ? `<div class="rm-row"><a class="small rm-newcall" href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer">${esc(t('rm_call_meet'))}</a><a class="small rm-newcall" href="https://zoom.us/start/videomeeting" target="_blank" rel="noopener noreferrer">${esc(t('rm_call_zoom'))}</a></div>
        <form class="sr-form" id="rm-call" autocomplete="off"><input type="url" id="rm-call-in" placeholder="${esc(t('rm_call_ph'))}" aria-label="${esc(t('rm_call_ph'))}"><button type="submit" class="small">${esc(t('rm_call_set'))}</button></form>` : ''}
    </div>`;
  }
  function tasksHtml() {
    if (!tasksOk) return `<div class="rm-sec"><span class="label">${esc(t('rm_tasks'))}</span><p class="hint">${esc(t('rm_tasks_sql'))}</p></div>`;
    return `<div class="rm-sec"><span class="label">${esc(t('rm_tasks'))} · ${tasks.filter(x => x.done).length}/${tasks.length}</span>
      ${tasks.length ? `<ul class="rm-tasks">${tasks.map(x => `<li class="${x.done ? 'done' : ''}"><label><input type="checkbox" data-rmtask="${esc(x.id)}" ${x.done ? 'checked' : ''}><span>${esc(x.title)}</span></label>${x.done && x.done_by ? `<small>${esc(t('rm_task_by', { n: x.done_by }))}</small>` : ''}<button type="button" class="icon-btn" data-rmtaskdel="${esc(x.id)}" aria-label="${esc(t('delete'))}">✕</button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('rm_tasks_none'))}</p>`}
      <form class="sr-form" id="rm-task" autocomplete="off"><input type="text" id="rm-task-in" maxlength="120" placeholder="${esc(t('rm_task_ph'))}" aria-label="${esc(t('rm_task_ph'))}"><button type="submit" class="small">${esc(t('rm_task_add'))}</button></form></div>`;
  }
  function quizHtml() {
    const Q = statsOf().quiz, decks = (S.study && S.study.decks) || [];
    if (!Q) {
      if (!isHost()) return '';
      return `<div class="rm-sec"><span class="label">${esc(t('rm_quiz'))}</span>${isPrem() && decks.length ? `<form class="sr-form" id="rm-quiz" autocomplete="off"><select id="rm-quiz-deck" aria-label="${esc(t('rm_quiz_deck'))}">${decks.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><button type="submit" class="small">${esc(t('rm_quiz_go'))}</button></form>` : `<p class="hint">${esc(t('rm_quiz_prem'))}</p>`}</div>`;
    }
    if (quizSt.id !== Q.id) quizSt = { id: Q.id, i: 0, score: 0, shown: false };
    const n = Q.items.length, cur = Q.items[quizSt.i];
    const board = members.filter(m => m.quiz_id === Q.id).sort((a, b) => (b.score || 0) - (a.score || 0));
    return `<div class="rm-sec rm-quizbox"><span class="label">${esc(t('rm_quiz'))}${Q.deck ? ' · ' + esc(Q.deck) : ''}</span>
      ${cur ? `<small class="hint">${esc(t('rm_quiz_q', { i: quizSt.i + 1, n }))}</small><p class="rm-q">${esc(cur.q)}</p>
        ${quizSt.shown ? `<p class="rm-a">${esc(cur.a)}</p><div class="rm-row"><button type="button" class="small primary" data-rmq="1">${esc(t('rm_quiz_knew'))}</button><button type="button" class="small" data-rmq="0">${esc(t('rm_quiz_not'))}</button></div>` : `<button type="button" class="small" data-rmq-show>${esc(t('rm_quiz_show'))}</button>`}`
        : `<p class="rm-q">${esc(t('rm_quiz_done', { s: quizSt.score, n }))}</p>`}
      ${board.length ? `<ul class="rm-board">${board.map(m => `<li><b>${esc(m.name)}</b><span>${m.score || 0} · ${m.quiz_n || 0}/${n}</span></li>`).join('')}</ul>` : ''}
      ${isHost() ? `<button type="button" class="small ghost" data-rmq-end>${esc(t('rm_quiz_end'))}</button>` : ''}</div>`;
  }
  function historyHtml() {
    const st = statsOf(), big = capOf(room) > FREE_CAP;
    if (!big) return isHost() && !isPrem() ? `<p class="hint">${esc(t('rm_history_prem'))}</p>` : '';
    return `<div class="rm-sec"><span class="label">${esc(t('rm_history'))}</span><p class="hint">${esc(t('rm_history_v', { h: ML.fmtMins(st.mins || 0), n: st.sessions || 0 }))}</p>
      ${st.next && st.next > Date.now() ? `<div class="rm-row"><b>${esc(t('rm_next_at', { d: when(st.next) }))}</b>${isHost() ? `<button type="button" class="small ghost" data-rmnext-clear>${esc(t('rm_next_clear'))}</button>` : ''}</div>`
        : isHost() ? `<form class="sr-form" id="rm-next" autocomplete="off"><input type="datetime-local" id="rm-next-in" aria-label="${esc(t('rm_next'))}"><button type="submit" class="small">${esc(t('rm_next_set'))}</button></form>` : ''}</div>`;
  }
  function html() {
    if (!me()) return `<p class="hint">${esc(t('rm_intro'))}</p><p class="hint">${esc(t('rm_signin'))}</p><button type="button" class="small primary" id="rm-signin">${esc(t('rm_signin_btn'))}</button>`;
    if (!R().code || !room) return `<p class="hint">${esc(t('rm_intro'))}</p>
      ${lastErr ? `<p class="hint">${esc(t('rm_err'))}</p>` : ''}
      <label class="field"><span>${esc(t('rm_you_ph'))}</span><input type="text" id="rm-me" maxlength="24" value="${esc(R().me || me().email.split('@')[0])}"></label>
      <form class="sr-form" id="rm-create" autocomplete="off"><input type="text" id="rm-name" maxlength="40" placeholder="${esc(t('rm_name_ph'))}"><button type="submit" class="primary small">${esc(t('rm_create'))}</button></form>
      <form class="sr-form" id="rm-join" autocomplete="off"><input type="text" id="rm-code" maxlength="6" placeholder="${esc(t('rm_code_ph'))}" autocapitalize="characters" spellcheck="false"><button type="submit" class="small">${esc(t('rm_join'))}</button></form>`;
    const T = room.timer || {}, clock = clockOf(T), active = T.endAt && T.endAt > Date.now();
    return `<div class="rm-card">
      <div class="rm-head"><div><span class="label">${esc(t('st_room'))}</span><h3>${esc(room.name || t('st_room'))}</h3></div>
        <button type="button" class="rm-code" id="rm-copy" title="${esc(t('rm_copy'))}"><small>${esc(t('rm_code'))}</small><b>${esc(room.code)}</b></button></div>
      <div class="rm-timer ${active ? 'on ' + T.mode : ''}"><span class="state">${esc(active ? t(T.mode === 'focus' ? 'rm_focus_lbl' : 'rm_break_lbl') : t('rm_timer_idle'))}</span>
        <div class="rm-clock" id="rm-clock">${active ? clock : '--:--'}</div></div>
      ${isHost() ? `<div class="chips rm-ctrl">${[25, 50, 90].map(m => `<button type="button" class="chip-btn" data-rmfocus="${m}">${esc(t('rm_start_focus', { m }))}</button>`).join('')}
        ${[5, 10].map(m => `<button type="button" class="chip-btn" data-rmbreak="${m}">${esc(t('rm_start_break', { m }))}</button>`).join('')}
        ${active ? `<button type="button" class="chip-btn" data-rmstop>${esc(t('rm_stop'))}</button>` : ''}</div>` : ''}
      <label class="opt"><input type="checkbox" id="rm-follow" ${R().follow ? 'checked' : ''}> ${esc(t('rm_follow'))}</label>
      ${tasksHtml()}${quizHtml()}${callHtml()}
      <span class="label">${esc(t('rm_members'))} · ${esc(t('rm_cap', { n: members.filter(fresh).length, m: capOf(room) }))}</span>
      <ul class="rm-members">${members.map(m => { const st = fresh(m) ? m.status : 'away'; return `<li class="st-${st}"><i></i><b>${esc(m.name)}</b>${m.user_id === room.host ? `<small>${esc(t('rm_host'))}</small>` : ''}<span>${esc(t('rm_' + st))}</span></li>`; }).join('')}</ul>
      ${historyHtml()}
      <button type="button" class="small ghost danger" id="rm-leave">${esc(isHost() ? t('rm_close') : t('rm_leave'))}</button>
    </div>`;
  }
  const host = $('room-root');
  function renderIfOpen() { if (S.tab === 'room') ML.keepInputs(host, () => { host.innerHTML = html(); }); }
  function bind() {
    host.innerHTML = html();
    clearInterval(tickT);
    tickT = setInterval(() => { if (S.tab !== 'room') { clearInterval(tickT); return; } const c = $('rm-clock'); if (c && room && room.timer && room.timer.endAt > Date.now()) c.textContent = clockOf(room.timer); }, 1000);
    if (R().code && !room) pull();
    schedule();
  }
  const fail = () => toast(t('rm_err'));
  host.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, nm = $('rm-me'); if (nm) { R().me = nm.value.trim().slice(0, 24); save(); }
    try {
      if (f.id === 'rm-create') await create(($('rm-name').value || '').trim() || t('st_room'));
      else if (f.id === 'rm-join') { const code = ($('rm-code').value || '').trim().toUpperCase(); if (code.length === 6) await join(code); }
      else if (f.id === 'rm-task') { const i = $('rm-task-in'), v = i.value.trim(); if (v) { i.value = ''; await addTask(v); } }
      else if (f.id === 'rm-call') { const u = safeUrl($('rm-call-in').value.trim()); if (u) await setStats({ call: u }); else toast(t('rm_call_bad')); }
      else if (f.id === 'rm-quiz') await startQuiz($('rm-quiz-deck').value);
      else if (f.id === 'rm-next') { const v = $('rm-next-in').value; if (v) await setStats({ next: new Date(v).getTime() }); }
    } catch (err) { lastErr = true; renderIfOpen(); fail(); }
  });
  host.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'rm-signin') { if (ML.openAuth) ML.openAuth(); else $('settings-btn').click(); return; }
    if (b.id === 'rm-copy') { try { navigator.clipboard.writeText(room.code).then(() => toast(t('rm_copied'))); } catch (err) {} return; }
    if (b.dataset.rmfocus) { setTimer('focus', +b.dataset.rmfocus).catch(fail); return; }
    if (b.dataset.rmbreak) { setTimer('break', +b.dataset.rmbreak).catch(fail); return; }
    if (b.hasAttribute('data-rmstop')) { setTimer(null).catch(fail); return; }
    if (b.dataset.rmtaskdel) { delTask(b.dataset.rmtaskdel).catch(fail); return; }
    if (b.hasAttribute('data-rmcall-clear')) { setStats({ call: null }).catch(fail); return; }
    if (b.hasAttribute('data-rmnext-clear')) { setStats({ next: null }).catch(fail); return; }
    if (b.hasAttribute('data-rmq-show')) { quizSt.shown = true; renderIfOpen(); return; }
    if (b.dataset.rmq) { quizAnswer(b.dataset.rmq === '1').catch(fail); return; }
    if (b.hasAttribute('data-rmq-end')) { setStats({ quiz: null }).catch(fail); return; }
    if (b.id === 'rm-leave') { leave(); return; }
  });
  host.addEventListener('change', e => {
    if (e.target.id === 'rm-follow') { R().follow = e.target.checked; save(); }
    if (e.target.dataset.rmtask) toggleTask(e.target.dataset.rmtask).catch(fail);
  });

  on('tab', n => { if (n === 'room') bind(); });
  on('timer', () => { if (R().code && me()) presence().catch(() => {}); });
  on('started', () => { if (S.tab === 'room') bind(); if (R().code && me()) { pull(); schedule(); } });
  // (S.room is only there once the state has loaded: the login screen comes before)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && R() && R().code) { pull(); schedule(); } });
  ML.Rooms = { pull };
})();
