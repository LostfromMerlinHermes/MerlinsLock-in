// Study rooms (You space, free with an account since 3.58): friends join with a 6-letter code and share one focus timer
// and a list of shared tasks; a call link (Meet, Zoom...) can be pinned. The host's Premium opens a bigger room (25 instead
// of 6), its history and planned sessions, and the room quiz: a deck everybody answers during the break.
// 3.64 (supabase/room-chat.sql): only members can read a room and the code is checked by a server function; chat (Quiet chat follows
// the timer, the host's choice), Documents (pinned links, decks and notes copied in one tap), a one-tap Jitsi call, one shared note
// (one writer at a time), host controls and reports, a recap at the end of a session. Everything still works without that SQL, minus these.
// Data lives in Supabase (supabase/study-rooms.sql, then supabase/room-tasks.sql); the app polls every few seconds.
(() => {
  'use strict';
  const { $, S, t, tn, esc, save, on, toast } = ML;

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
      rm_untitled: 'Sans titre', rm_gone: 'Tu n’es plus dans cette salle.', rm_join_slow: 'Trop de codes essayés. Réessaie dans 10 minutes.', rm_sql: 'Cette partie demande la mise à jour de la base (room-chat.sql).',
      rm_v_session: 'Session', rm_v_chat: 'Chat', rm_v_docs: 'Documents', rm_v_note: 'Note',
      rm_chat_ph: 'Écrire un message', rm_chat_send: 'Envoyer', rm_chat_none: 'Aucun message pour l’instant.', rm_chat_slow: 'Trop de messages d’un coup. Attends une minute.', rm_quiet: 'Quiet chat : pendant le Focus, les messages attendent la pause', rm_quiet_on: 'Quiet chat activé par l’hôte : les messages attendent la pause.',
      rm_quiet_new_one: '1 nouveau message', rm_quiet_new: '{n} nouveaux messages', rm_quiet_none: 'Rien de nouveau', rm_quiet_h: 'Ils s’ouvrent à la pause.', rm_quiet_ph: 'Écrire, envoyé à la pause', rm_quiet_keep: 'Garder', rm_held: 'Part à la pause',
      rm_remove: 'Retirer', rm_removed_msg: 'Message retiré', rm_report: 'Signaler', rm_reported: 'Signalé', rm_report_sent: 'Signalement envoyé.',
      rm_docs_none: 'Rien de partagé pour l’instant.', rm_link_title: 'Titre (facultatif)', rm_link_ph: 'Coller un lien', rm_link_pin: 'Épingler', rm_kind_link: 'Lien', rm_kind_deck: 'Paquet', rm_kind_note: 'Note', rm_open: 'Ouvrir', rm_cards_one: '1 carte', rm_cards: '{n} cartes', rm_too_many: 'Cette salle a trop de documents. Retires-en d’abord.', rm_too_big: 'C’est trop long pour une salle.',
      rm_share_deck: 'Partager un paquet', rm_share_note: 'Partager une note', rm_share: 'Partager', rm_shared: 'Partagé dans la salle', rm_share_in: 'Partager dans la salle', rm_copy_deck: 'Copier dans mes paquets', rm_copy_note: 'Copier dans mon Carnet', rm_copied_deck: 'Copié dans tes paquets', rm_copied_deck_lock: 'Copié dans tes paquets. La révision fait partie de Premium.', rm_copied_note: 'Copié dans ton Carnet', rm_copied_done: 'Copié', rm_copy_bad: 'Ce document ne peut pas être copié.',
      rm_call_start: 'Lancer un appel', rm_call_h: 'Ouvre un appel Jitsi dans un nouvel onglet et prévient la salle. Une personne doit se connecter à Jitsi pour l’ouvrir.', rm_call_by: '{n} a lancé un appel', rm_call_end: 'Terminer',
      rm_note_none: 'La note est vide. Écris le plan de révision, qui fait quoi.', rm_note_edit: 'Écrire', rm_note_done: 'Terminer', rm_note_ph: 'Une seule personne écrit à la fois.', rm_note_by: '{n} écrit en ce moment', rm_note_saved: 'Modifié par {n}', rm_note_lost: 'Quelqu’un d’autre a pris la main. Copie ton texte avant de fermer.', rm_note_drop: 'Fermer sans enregistrer',
      rm_recap: 'Récap de la session', rm_recap_sum: '{t} ensemble · {p} · {d}', rm_recap_people_one: '1 personne', rm_recap_people: '{n} personnes', rm_recap_tasks_one: '1 tâche finie', rm_recap_tasks: '{n} tâches finies', rm_recap_ok: 'Fermer',
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
      rm_untitled: 'Untitled', rm_gone: 'You are no longer in this room.', rm_join_slow: 'Too many codes tried. Try again in 10 minutes.', rm_sql: 'This part needs the database update (room-chat.sql).',
      rm_v_session: 'Session', rm_v_chat: 'Chat', rm_v_docs: 'Documents', rm_v_note: 'Note',
      rm_chat_ph: 'Write a message', rm_chat_send: 'Send', rm_chat_none: 'No messages yet.', rm_chat_slow: 'Too many messages at once. Wait a minute.', rm_quiet: 'Quiet chat: during Focus, messages wait for the break', rm_quiet_on: 'Quiet chat is on, set by the host: messages wait for the break.',
      rm_quiet_new_one: '1 new message', rm_quiet_new: '{n} new messages', rm_quiet_none: 'Nothing new', rm_quiet_h: 'They open at the break.', rm_quiet_ph: 'Write, sent at the break', rm_quiet_keep: 'Keep', rm_held: 'Goes at the break',
      rm_remove: 'Remove', rm_removed_msg: 'Message removed', rm_report: 'Report', rm_reported: 'Reported', rm_report_sent: 'Report sent.',
      rm_docs_none: 'Nothing shared yet.', rm_link_title: 'Title (optional)', rm_link_ph: 'Paste a link', rm_link_pin: 'Pin', rm_kind_link: 'Link', rm_kind_deck: 'Deck', rm_kind_note: 'Note', rm_open: 'Open', rm_cards_one: '1 card', rm_cards: '{n} cards', rm_too_many: 'This room has too many documents. Remove some first.', rm_too_big: 'This is too long for a room.',
      rm_share_deck: 'Share a deck', rm_share_note: 'Share a note', rm_share: 'Share', rm_shared: 'Shared in the room', rm_share_in: 'Share in the room', rm_copy_deck: 'Copy to my decks', rm_copy_note: 'Copy to my Notebook', rm_copied_deck: 'Copied to your decks', rm_copied_deck_lock: 'Copied to your decks. Reviewing is part of Premium.', rm_copied_note: 'Copied to your Notebook', rm_copied_done: 'Copied', rm_copy_bad: 'This document can’t be copied.',
      rm_call_start: 'Start a call', rm_call_h: 'Opens a Jitsi call in a new tab and tells the room. Someone has to sign in to Jitsi to open it.', rm_call_by: '{n} started a call', rm_call_end: 'End',
      rm_note_none: 'The note is empty. Write the revision plan, who does what.', rm_note_edit: 'Write', rm_note_done: 'Done', rm_note_ph: 'One person writes at a time.', rm_note_by: '{n} is writing', rm_note_saved: 'Changed by {n}', rm_note_lost: 'Someone else took over. Copy your text before closing.', rm_note_drop: 'Close without saving',
      rm_recap: 'Session recap', rm_recap_sum: '{t} together · {p} · {d}', rm_recap_people_one: '1 person', rm_recap_people: '{n} people', rm_recap_tasks_one: '1 task finished', rm_recap_tasks: '{n} tasks finished', rm_recap_ok: 'Close',
    },
  });
  ML.defaults(() => ({ room: { code: null, follow: true, me: '', held: [], sess: null, seen: null, recapSeen: null } }));

  const FREE_CAP = 6, PREMIUM_CAP = 25, QUIZ_LEN = 10;
  const R = () => S.room;
  const me = () => ML.auth && ML.auth.user;
  const rest = (p, o) => ML.auth.rest(p, o);
  const isPrem = () => !!(ML.isPremium && ML.isPremium());
  let room = null, members = [], tasks = [], tasksOk = true, lastErr = false, pollT = null, tickT = null, lastStartAt = null;
  let trees = [], treesOk = true, treeSent = null; // the shared grove (tree.js); its table is separate, so a server without it changes nothing else
  let quizSt = { id: null, i: 0, score: 0, shown: false }; // my progress in the room's quiz
  let view = 'session', extraOk = true, pollN = 0, msgs = [], msgAt = null, items = [], note = null, noteBody = '', noteEdit = null, recap = [], lastCall = null, lastQuiet = false;
  const reported = new Set(), copied = new Set(); // this session only: the server has the real list
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
      if (!rows || !rows.length) { const was = R().code; forget(); if (was) toast(t('rm_gone')); renderIfOpen(); return; }
      room = rows[0]; members = mem || []; lastErr = false;
      try { tasks = await rest('/rest/v1/room_tasks?select=*&room_code=eq.' + R().code + '&order=created_at.asc') || []; tasksOk = true; } catch (e) { tasksOk = false; } // the update SQL may not have run yet
      const slow = pollN++ % 3 === 0; // what rarely changes is asked for less often, to keep the traffic low
      if (slow) await syncTree();
      follow();
      await presence();
      await pullExtras(slow);
      trackSess();
      await flushHeld();
    } catch (e) { lastErr = true; }
    renderIfOpen();
  }
  // Leaving, closing or being removed: nothing of this room stays on screen or waits to be sent
  function forget() {
    R().code = null; R().held = []; R().sess = null; R().seen = null;
    room = null; members = []; tasks = []; trees = []; treeSent = null;
    msgs = []; msgAt = null; items = []; note = null; noteBody = ''; noteEdit = null; recap = []; lastCall = null; view = 'session'; extraOk = true; pollN = 0;
    save();
  }
  // A missing table or function answers 404 (400 on older servers): that means room-chat.sql has not run. Anything else is a passing failure.
  const notThere = e => e && (e.status === 404 || e.status === 400);
  async function pullChat() {
    const q = '/rest/v1/room_messages?select=id,user_id,name,body,removed,reports,created_at,updated_at&room_code=eq.' + R().code + (msgAt ? '&updated_at=gte.' + encodeURIComponent(msgAt) : '') + '&order=created_at.desc&limit=200';
    const rows = await rest(q) || [], first = !msgAt;
    rows.forEach(m => { const i = msgs.findIndex(x => x.id === m.id); if (i >= 0) msgs[i] = m; else msgs.push(m); if (!msgAt || m.updated_at > msgAt) msgAt = m.updated_at; });
    msgs.sort((a, b) => a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0);
    if (msgs.length > 200) msgs = msgs.slice(-200);
    if (first && !R().seen && msgs.length) R().seen = msgs[msgs.length - 1].created_at; // joining: the past is not "new"
    if (view === 'chat' && !quietNow() && S.tab === 'room' && msgs.length) R().seen = msgs[msgs.length - 1].created_at;
  }
  async function pullItems() {
    items = await rest('/rest/v1/room_items?select=id,user_id,name,kind,title,url,size,reports,created_at&room_code=eq.' + R().code + '&order=created_at.asc') || [];
    const c = currentCall();
    if (c && lastCall !== null && c.id !== lastCall && c.user_id !== me().id && !quietNow()) toast(t('rm_call_by', { n: c.name }));
    lastCall = c ? c.id : '';
  }
  async function pullNote() {
    const rows = await rest('/rest/v1/room_notes?select=editor,editor_name,lock_until,saved_by,updated_at&room_code=eq.' + R().code) || [], n = rows[0] || null;
    if (n && (!note || note.updated_at !== n.updated_at)) { const b = await rest('/rest/v1/room_notes?select=body&room_code=eq.' + R().code); noteBody = (b && b[0] && b[0].body) || ''; }
    note = n;
  }
  async function pullExtras(slow) {
    if (!extraOk && !slow) return;
    try {
      await pullChat();
      if (slow || view === 'docs') await pullItems();
      if (slow || view === 'note') await pullNote();
      if (slow && !focusOn()) recap = await rest('/rest/v1/room_recaps?select=session_id,user_id,name,mins,done&room_code=eq.' + R().code) || [];
      extraOk = true;
    } catch (e) { if (notThere(e)) extraOk = false; }
  }
  const focusOn = () => { const T = room && room.timer; return !!(T && T.mode === 'focus' && T.endAt > Date.now()); };
  // Quiet chat is on unless the host turned it off: it only applies while the room's Focus runs
  const quietOpt = () => statsOf().quiet !== false;
  const quietNow = () => quietOpt() && focusOn();
  const currentCall = () => items.filter(x => x.kind === 'call' && safeUrl(x.url) && Date.now() - new Date(x.created_at).getTime() < 4 * 3600000).pop() || null;
  const canDrop = x => isHost() || x.user_id === me().id;

  /* ---------- Chat ---------- */
  const postMsg = (id, body) => rest('/rest/v1/room_messages?on_conflict=id', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { id, room_code: R().code, user_id: me().id, name: myName(), body } });
  const msgErr = e => toast(/too many/.test(e && e.message || '') ? t('rm_chat_slow') : t('rm_err'));
  async function sendMsg(body) {
    body = body.slice(0, 500);
    if (quietNow()) { R().held = (R().held || []).concat({ id: ML.uid(), body }).slice(-10); save(); renderIfOpen(); return; }
    await postMsg(ML.uid(), body);
    await pullChat(); renderIfOpen();
  }
  // What was held during Focus leaves at the break. The id makes a second device's attempt harmless.
  async function flushHeld() {
    if (quietNow() || !extraOk || !(R().held && R().held.length)) return;
    const list = R().held.slice();
    for (const m of list) { await postMsg(m.id, m.body); R().held = R().held.filter(x => x.id !== m.id); }
    save();
    await pullChat();
  }
  async function rpc(fn, body) { return rest('/rest/v1/rpc/' + fn, { method: 'POST', body }); }
  async function dropMsg(id) {
    const m = msgs.find(x => x.id === id); if (m) { m.removed = true; m.body = ''; renderIfOpen(); }
    await rpc('room_message_remove', { p_id: id });
  }
  async function report(kind, id) {
    reported.add(id); renderIfOpen();
    await rpc('room_report', { p_kind: kind, p_id: id });
    toast(t('rm_report_sent'));
  }

  /* ---------- Documents ---------- */
  const postItem = async o => {
    try { await rest('/rest/v1/room_items', { method: 'POST', prefer: 'return=minimal', body: Object.assign({ id: ML.uid(), room_code: R().code, user_id: me().id, name: myName() }, o) }); }
    catch (e) { const m = (e && e.message) || ''; if (/too large/.test(m)) { toast(t('rm_too_big')); return false; } if (/room full/.test(m)) { toast(t('rm_too_many')); return false; } throw e; }
    await pullItems(); renderIfOpen(); return true;
  };
  async function dropItem(id) { items = items.filter(x => x.id !== id); renderIfOpen(); await rest('/rest/v1/room_items?id=eq.' + encodeURIComponent(id), { method: 'DELETE', prefer: 'return=minimal' }); if (lastCall === id) lastCall = ''; }
  async function shareDeck(id) {
    const x = ML.studyDeckExport && ML.studyDeckExport(id); if (!x || !x.cards.length) { toast(t('rm_quiz_nocards')); return; }
    if (await postItem({ kind: 'deck', title: x.name.slice(0, 120), size: x.cards.length, payload: x })) toast(t('rm_shared'));
  }
  async function shareNote(id) {
    const x = ML.notesExport && ML.notesExport(id); if (!x) return;
    if (await postItem({ kind: 'note', title: x.title.slice(0, 120), payload: x })) toast(t('rm_shared'));
  }
  // The payload was written by another member: only plain strings go on, and the Notebook cleans the HTML itself
  async function copyItem(id) {
    const rows = await rest('/rest/v1/room_items?select=kind,title,payload&id=eq.' + encodeURIComponent(id)), x = rows && rows[0], p = x && x.payload;
    if (!p) { toast(t('rm_copy_bad')); return; }
    if (x.kind === 'deck' && Array.isArray(p.cards)) {
      const cards = p.cards.filter(c => c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() && c.back.trim());
      if (!cards.length || !ML.studyImportDeck(String(p.name || x.title), cards)) { if (!cards.length) toast(t('rm_copy_bad')); return; }
      toast(t(isPrem() ? 'rm_copied_deck' : 'rm_copied_deck_lock'));
    } else if (x.kind === 'note' && typeof p.html === 'string') {
      ML.notesAddPage(String(p.title || x.title), p.html); toast(t('rm_copied_note'));
    } else { toast(t('rm_copy_bad')); return; }
    copied.add(id); renderIfOpen();
  }
  // Opened right in the click, or the browser blocks the new tab; the room hears about it just after
  function startCall() {
    const name = 'MerlinsLockIN-' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => ALPH[b % ALPH.length]).join(''), url = 'https://meet.jit.si/' + name;
    window.open(url, '_blank', 'noopener,noreferrer');
    return postItem({ kind: 'call', url }).then(() => { lastCall = (currentCall() || {}).id || ''; });
  }

  /* ---------- Shared note: one writer at a time, on a lease the server renews while they write ---------- */
  let noteSaveT = null, noteBeat = null;
  async function noteStart() {
    const r = await rpc('room_note_lock', { p_code: R().code, p_name: myName() });
    if (!r || !r.ok) { toast(t('rm_note_by', { n: (r && r.editor_name) || '' })); await pullNote(); renderIfOpen(); return; }
    noteEdit = { text: r.body || '', lost: false }; renderIfOpen();
    const ta = $('rm-note-in'); if (ta) ta.focus();
    clearInterval(noteBeat); noteBeat = setInterval(() => { if (noteEdit && !noteEdit.lost) noteSave(false).catch(() => {}); }, 20000);
  }
  async function noteSave(release) {
    clearTimeout(noteSaveT); noteSaveT = null;
    if (!noteEdit) return;
    const code = R().code, text = noteEdit.text.slice(0, 20000);
    let ok = await rpc('room_note_save', { p_code: code, p_body: text, p_release: !!release });
    if (!ok) { // the lease ran out: take it back if nobody else did
      const r = await rpc('room_note_lock', { p_code: code, p_name: myName() });
      if (r && r.ok) ok = await rpc('room_note_save', { p_code: code, p_body: text, p_release: !!release });
    }
    if (!noteEdit) return;
    if (!ok) { noteEdit.lost = true; clearInterval(noteBeat); renderIfOpen(); return; }
    noteBody = text;
    if (release) { noteEdit = null; clearInterval(noteBeat); await pullNote(); renderIfOpen(); }
  }
  // Leaving the note page ends the turn, so the next person does not wait for the lease
  function noteRelease() { if (noteEdit && !noteEdit.lost) noteSave(true).catch(() => {}); }

  /* ---------- Recap: each member writes their own line; the room reads them all ---------- */
  function trackSess() {
    const T = room && room.timer, on = focusOn(), code = R().code;
    let s = R().sess;
    if (s && (s.room !== code || !on || T.startAt !== s.id)) { closeSess(s); s = R().sess = null; }
    if (on && !s) s = R().sess = { id: T.startAt, room: code, mins: T.mins, from: null, to: null, done: [] };
    if (s && myStatus() === 'focus') { if (!s.from) s.from = Date.now(); s.to = Date.now(); }
  }
  function closeSess(s) {
    const mins = s.from ? Math.min(s.mins || 600, Math.round((s.to - s.from) / 60000)) : 0;
    if ((mins < 1 && !(s.done || []).length) || s.room !== R().code) return;
    rest('/rest/v1/room_recaps?on_conflict=room_code,session_id,user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { room_code: s.room, session_id: s.id, user_id: me().id, name: myName(), mins, done: (s.done || []).slice(0, 20) } })
      .then(() => rest('/rest/v1/room_recaps?select=session_id,user_id,name,mins,done&room_code=eq.' + s.room)).then(r => { recap = r || []; renderIfOpen(); }).catch(() => {});
  }
  const treeOpt = k => !(S.tree && S.tree[k] === false);
  async function syncTree() {
    try {
      if (treeOpt('grove')) trees = await rest('/rest/v1/room_trees?select=user_id,data&room_code=eq.' + R().code) || [];
      const data = treeOpt('share') && ML.treeShareData ? JSON.stringify(ML.treeShareData()) : '', sentKey = R().code + data;
      if (sentKey !== treeSent) {
        if (data) await rest('/rest/v1/room_trees?on_conflict=room_code,user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { room_code: R().code, user_id: me().id, data: JSON.parse(data), updated_at: new Date().toISOString() } });
        else await rest('/rest/v1/room_trees?room_code=eq.' + R().code + '&user_id=eq.' + me().id, { method: 'DELETE', prefer: 'return=minimal' });
        treeSent = sentKey;
      }
      treesOk = true;
    } catch (e) { treesOk = false; } // room-trees.sql may not have run yet
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
    let res;
    try { res = await rpc('join_room', { p_code: code, p_name: myName() }); }
    catch (e) { if (e.status === 404) return joinOld(code); throw e; } // room-chat.sql has not run yet
    if (!res || !res.ok) { const why = res && res.why; toast(why === 'full' ? t('rm_full', { n: res.cap }) : why === 'slow' ? t('rm_join_slow') : t('rm_not_found')); return; }
    R().code = res.code; save(); await pull(); schedule();
  }
  async function joinOld(code) {
    const rows = await rest('/rest/v1/study_rooms?select=code,cap&code=eq.' + code);
    if (!rows || !rows.length) { toast(t('rm_not_found')); return; }
    const mem = await rest('/rest/v1/room_members?select=user_id,seen_at&room_code=eq.' + code), cap = capOf(rows[0]);
    if ((mem || []).filter(m => fresh(m) && m.user_id !== me().id).length >= cap) { toast(t('rm_full', { n: cap })); return; }
    R().code = code; save(); await pull(); schedule();
  }
  async function leave() {
    const code = R().code; if (!code) return;
    noteRelease();
    try {
      if (isHost()) await rest('/rest/v1/study_rooms?code=eq.' + code, { method: 'DELETE', prefer: 'return=minimal' });
      else await rest('/rest/v1/room_members?room_code=eq.' + code + '&user_id=eq.' + me().id, { method: 'DELETE', prefer: 'return=minimal' });
    } catch (e) {}
    forget(); renderIfOpen();
  }
  async function removeMember(id) {
    members = members.filter(m => m.user_id !== id); renderIfOpen();
    await rpc('room_remove_member', { p_code: R().code, p_user: id });
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
    const s = R().sess; if (s) s.done = done ? (s.done || []).concat(x.title) : (s.done || []).filter(y => y !== x.title);
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
    const url = safeUrl(statsOf().call || ''), jitsi = extraOk && !currentCall();
    return `<div class="rm-sec"><span class="label">${esc(t('rm_call'))}</span>
      ${url ? `<div class="rm-row"><a class="rm-call" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('rm_call_join'))}</a>${isHost() ? `<button type="button" class="small ghost" data-rmcall-clear>${esc(t('rm_call_clear'))}</button>` : ''}</div>` : ''}
      ${jitsi ? `<button type="button" class="small rm-startcall" data-rmcall-start>${esc(t('rm_call_start'))}</button><p class="hint">${esc(t('rm_call_h'))}</p>` : ''}
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
  function groveHtml() {
    return `<div class="rm-sec"><span class="label">${esc(t('gr_title'))}</span>
      ${treeOpt('grove') ? '<div id="rm-grove"></div>' : ''}
      ${!treesOk && treeOpt('grove') ? `<p class="hint">${esc(t('gr_sql'))}</p>` : ''}
      <label class="opt"><input type="checkbox" id="rm-grove-show" ${treeOpt('grove') ? 'checked' : ''}> ${esc(t('gr_show'))}</label>
      <label class="opt"><input type="checkbox" id="rm-grove-share" ${treeOpt('share') ? 'checked' : ''}> ${esc(t('gr_share'))}</label>
      <p class="hint">${esc(t('gr_share_h'))}</p></div>`;
  }
  // My own tree comes from here, never from the server, so it shows even before the SQL has run
  let groveSig = '';
  function mountGrove() {
    const slot = $('rm-grove'); if (!slot || !ML.treeGrove) return;
    const mine = me() && me().id, rows = {}; trees.forEach(x => { rows[x.user_id] = x.data; });
    if (treeOpt('share') && ML.treeShareData) rows[mine] = ML.treeShareData(); else delete rows[mine];
    const list = members.filter(m => rows[m.user_id]).map(m => ({ id: m.user_id, name: m.user_id === mine ? t('gr_you') : m.name, status: fresh(m) ? m.status : 'away', data: rows[m.user_id] }));
    const sig = JSON.stringify(list); if (sig === groveSig) return; groveSig = sig;
    ML.treeGrove.mount(slot, list);
  }
  const clockAt = iso => new Date(iso).toLocaleTimeString(ML.locale(), { hour: '2-digit', minute: '2-digit' });
  const unread = () => { const seen = R().seen || ''; return msgs.filter(m => !m.removed && m.user_id !== me().id && m.created_at > seen).length; };
  // Two taps for whatever cannot be undone (handled in the click listener)
  const armed = (attr, id, label) => `<button type="button" class="rm-act" data-arm="${esc(label)}" ${attr}="${esc(id)}">${esc(t(label))}</button>`;
  function msgActions(m) {
    const mine = m.user_id === me().id;
    return `<span class="rm-acts">${m.reports && isHost() ? `<em>${esc(t('rm_reported'))}</em>` : ''}
      ${!mine ? (reported.has(m.id) ? `<em>${esc(t('rm_reported'))}</em>` : armed('data-rmmsg-report', m.id, 'rm_report')) : ''}
      ${canDrop(m) ? armed('data-rmmsg-del', m.id, 'rm_remove') : ''}</span>`;
  }
  function chatHtml() {
    if (!extraOk) return `<p class="hint">${esc(t('rm_sql'))}</p>`;
    const quiet = quietNow(), n = unread(), held = R().held || [];
    return `<div class="rm-sec rm-chat">
      ${isHost() ? `<label class="opt"><input type="checkbox" id="rm-quiet" ${quietOpt() ? 'checked' : ''}> ${esc(t('rm_quiet'))}</label>` : quietOpt() ? `<p class="hint">${esc(t('rm_quiet_on'))}</p>` : ''}
      ${quiet ? `<div class="rm-lock"><b>${esc(n ? tn('rm_quiet_new', n) : t('rm_quiet_none'))}</b><span>${esc(t('rm_quiet_h'))}</span></div>`
        : msgs.length ? `<ul class="rm-msgs" id="rm-chat-list">${msgs.map(m => m.removed ? `<li class="off"><small>${esc(t('rm_removed_msg'))}</small></li>`
          : `<li class="${m.user_id === me().id ? 'mine' : ''}"><div class="rm-mh"><b>${esc(m.name)}</b><small>${esc(clockAt(m.created_at))}</small>${msgActions(m)}</div><p>${esc(m.body)}</p></li>`).join('')}</ul>`
        : `<p class="hint">${esc(t('rm_chat_none'))}</p>`}
      ${held.length ? `<ul class="rm-msgs rm-held">${held.map(m => `<li class="mine"><div class="rm-mh"><small>${esc(t('rm_held'))}</small><button type="button" class="icon-btn" data-rmheld-del="${esc(m.id)}" aria-label="${esc(t('delete'))}">✕</button></div><p>${esc(m.body)}</p></li>`).join('')}</ul>` : ''}
      <form class="sr-form" id="rm-chat" autocomplete="off"><input type="text" id="rm-chat-in" name="msg" maxlength="500" placeholder="${esc(t(quiet ? 'rm_quiet_ph' : 'rm_chat_ph'))}" aria-label="${esc(t('rm_chat_ph'))}"><button type="submit" class="small">${esc(t(quiet ? 'rm_quiet_keep' : 'rm_chat_send'))}</button></form></div>`;
  }
  function itemHtml(x) {
    const url = x.kind === 'link' ? safeUrl(x.url) : null, mine = x.user_id === me().id;
    if (x.kind === 'link' && !url) return '';
    const host = url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })() : '';
    const sub = [x.kind === 'deck' ? tn('rm_cards', x.size) : x.title ? host : '', x.name].filter(Boolean).join(' · ');
    return `<li><em class="rm-kind">${esc(t('rm_kind_' + x.kind))}</em><div class="rm-it"><b>${esc(x.title || host)}</b><small>${esc(sub)}</small></div>
      <div class="rm-acts">${url ? `<a class="rm-newcall" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('rm_open'))}</a>`
        : copied.has(x.id) ? `<small>${esc(t('rm_copied_done'))}</small>` :`<button type="button" class="small" data-rmitem-copy="${esc(x.id)}">${esc(t(x.kind === 'deck' ? 'rm_copy_deck' : 'rm_copy_note'))}</button>`}
        ${x.reports && isHost() ? `<em>${esc(t('rm_reported'))}</em>` : ''}
        ${!mine ? (reported.has(x.id) ? `<em>${esc(t('rm_reported'))}</em>` : armed('data-rmitem-report', x.id, 'rm_report')) : ''}
        ${canDrop(x) ? armed('data-rmitem-del', x.id, 'rm_remove') : ''}</div></li>`;
  }
  function docsHtml() {
    if (!extraOk) return `<p class="hint">${esc(t('rm_sql'))}</p>`;
    const list = items.filter(x => x.kind !== 'call'), decks = ML.studyDecks ? ML.studyDecks() : [], pages = ML.notesList ? ML.notesList() : [];
    return `<div class="rm-sec">
      ${list.length ? `<ul class="rm-items">${list.map(itemHtml).join('')}</ul>` : `<p class="hint">${esc(t('rm_docs_none'))}</p>`}
      <form class="rm-link" id="rm-link" autocomplete="off"><input type="text" id="rm-link-t" name="title" maxlength="120" placeholder="${esc(t('rm_link_title'))}" aria-label="${esc(t('rm_link_title'))}"><div class="sr-form"><input type="url" id="rm-link-u" name="url" placeholder="${esc(t('rm_link_ph'))}" aria-label="${esc(t('rm_link_ph'))}"><button type="submit" class="small">${esc(t('rm_link_pin'))}</button></div></form>
      ${decks.length ? `<form class="sr-form" id="rm-sharedeck" autocomplete="off"><select id="rm-sd" name="deck" aria-label="${esc(t('rm_share_deck'))}">${decks.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select><button type="submit" class="small">${esc(t('rm_share'))}</button></form>` : ''}
      ${pages.length ? `<form class="sr-form" id="rm-sharenote" autocomplete="off"><select id="rm-sn" name="page" aria-label="${esc(t('rm_share_note'))}">${pages.map(p => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('')}</select><button type="submit" class="small">${esc(t('rm_share'))}</button></form>` : ''}
    </div>`;
  }
  function noteHtml() {
    if (!extraOk) return `<p class="hint">${esc(t('rm_sql'))}</p>`;
    if (noteEdit) return `<div class="rm-sec"><form class="rm-noteform" id="rm-note-f" autocomplete="off"><textarea id="rm-note-in" name="note" rows="12" maxlength="20000" placeholder="${esc(t('rm_note_ph'))}"></textarea></form>
      ${noteEdit.lost ? `<p class="hint rm-warn">${esc(t('rm_note_lost'))}</p>` : ''}
      <div class="rm-row">${noteEdit.lost ? `<button type="button" class="small" data-rmnote-drop>${esc(t('rm_note_drop'))}</button>` : ''}<button type="button" class="small primary" data-rmnote-done>${esc(t('rm_note_done'))}</button></div></div>`;
    const busy = note && note.editor && note.editor !== me().id && new Date(note.lock_until).getTime() > Date.now();
    return `<div class="rm-sec">
      ${noteBody ? `<div class="rm-notebody">${esc(noteBody)}</div>` : `<p class="hint">${esc(t('rm_note_none'))}</p>`}
      ${busy ? `<p class="hint">${esc(t('rm_note_by', { n: note.editor_name }))}</p>` : `<div class="rm-row"><button type="button" class="small" data-rmnote-edit>${esc(t('rm_note_edit'))}</button>${note && note.saved_by && noteBody ? `<small class="hint">${esc(t('rm_note_saved', { n: note.saved_by }))}</small>` : ''}</div>`}
    </div>`;
  }
  function recapHtml() {
    if (!recap.length || focusOn()) return '';
    const sid = recap[0].session_id; if (R().recapSeen === sid) return '';
    const mins = Math.max(...recap.map(r => r.mins || 0)), tasksN = recap.reduce((a, r) => a + (r.done || []).length, 0);
    return `<div class="rm-recap"><span class="label">${esc(t('rm_recap'))}</span>
      <b>${esc(t('rm_recap_sum', { t: ML.fmtMins(mins), p: tn('rm_recap_people', recap.length), d: tn('rm_recap_tasks', tasksN) }))}</b>
      <ul>${recap.slice().sort((a, b) => (b.mins || 0) - (a.mins || 0)).map(r => `<li><b>${esc(r.name)}</b><small>${esc(ML.fmtMins(r.mins || 0))}</small>${(r.done || []).length ? `<span>${r.done.map(x => esc(String(x))).join(', ')}</span>` : ''}</li>`).join('')}</ul>
      <button type="button" class="small ghost" data-rmrecap-ok="${esc(String(sid))}">${esc(t('rm_recap_ok'))}</button></div>`;
  }
  function membersHtml() {
    return `<span class="label">${esc(t('rm_members'))} · ${esc(t('rm_cap', { n: members.filter(fresh).length, m: capOf(room) }))}</span>
      <ul class="rm-members">${members.map(m => { const st = fresh(m) ? m.status : 'away'; return `<li class="st-${st}"><i></i><b>${esc(m.name)}</b>${m.user_id === room.host ? `<small>${esc(t('rm_host'))}</small>` : ''}<span>${esc(t('rm_' + st))}</span>${isHost() && extraOk && m.user_id !== room.host ? armed('data-rmmember-del', m.user_id, 'rm_remove') : ''}</li>`; }).join('')}</ul>`;
  }
  function html() {
    if (!me()) return `<p class="hint">${esc(t('rm_intro'))}</p><p class="hint">${esc(t('rm_signin'))}</p><button type="button" class="small primary" id="rm-signin">${esc(t('rm_signin_btn'))}</button>`;
    if (!R().code || !room) return `<p class="hint">${esc(t('rm_intro'))}</p>
      ${lastErr ? `<p class="hint">${esc(t('rm_err'))}</p>` : ''}
      <label class="field"><span>${esc(t('rm_you_ph'))}</span><input type="text" id="rm-me" maxlength="24" value="${esc(R().me || me().email.split('@')[0])}"></label>
      <form class="sr-form" id="rm-create" autocomplete="off"><input type="text" id="rm-name" maxlength="40" placeholder="${esc(t('rm_name_ph'))}"><button type="submit" class="primary small">${esc(t('rm_create'))}</button></form>
      <form class="sr-form" id="rm-join" autocomplete="off"><input type="text" id="rm-code" maxlength="6" placeholder="${esc(t('rm_code_ph'))}" autocapitalize="characters" spellcheck="false"><button type="submit" class="small">${esc(t('rm_join'))}</button></form>`;
    const T = room.timer || {}, clock = clockOf(T), active = T.endAt && T.endAt > Date.now();
    const call = currentCall(), n = unread(), docsN = items.filter(x => x.kind !== 'call').length;
    const views = [['session', t('rm_v_session')], ['chat', t('rm_v_chat') + (n && view !== 'chat' ? ' · ' + n : '')], ['docs', t('rm_v_docs') + (docsN ? ' · ' + docsN : '')], ['note', t('rm_v_note')]];
    return `<div class="rm-card">
      <div class="rm-head"><div><span class="label">${esc(t('st_room'))}</span><h3>${esc(room.name || t('st_room'))}</h3></div>
        <button type="button" class="rm-code" id="rm-copy" title="${esc(t('rm_copy'))}"><small>${esc(t('rm_code'))}</small><b>${esc(room.code)}</b></button></div>
      <div class="rm-timer ${active ? 'on ' + T.mode : ''}"><span class="state">${esc(active ? t(T.mode === 'focus' ? 'rm_focus_lbl' : 'rm_break_lbl') : t('rm_timer_idle'))}</span>
        <div class="rm-clock" id="rm-clock">${active ? clock : '--:--'}</div></div>
      ${isHost() ? `<div class="chips rm-ctrl">${[25, 50, 90].map(m => `<button type="button" class="chip-btn" data-rmfocus="${m}">${esc(t('rm_start_focus', { m }))}</button>`).join('')}
        ${[5, 10].map(m => `<button type="button" class="chip-btn" data-rmbreak="${m}">${esc(t('rm_start_break', { m }))}</button>`).join('')}
        ${active ? `<button type="button" class="chip-btn" data-rmstop>${esc(t('rm_stop'))}</button>` : ''}</div>` : ''}
      <label class="opt"><input type="checkbox" id="rm-follow" ${R().follow ? 'checked' : ''}> ${esc(t('rm_follow'))}</label>
      ${call ? `<div class="rm-callbar"><span>${esc(t('rm_call_by', { n: call.name }))}</span><a class="rm-call" href="${esc(safeUrl(call.url))}" target="_blank" rel="noopener noreferrer">${esc(t('rm_call_join'))}</a>${canDrop(call) ? `<button type="button" class="small ghost" data-rmitem-del="${esc(call.id)}">${esc(t('rm_call_end'))}</button>` : ''}</div>` : ''}
      ${recapHtml()}
      <div class="seg-toggle rm-seg" role="group">${views.map(([k, l]) => `<button type="button" data-rmview="${k}" aria-pressed="${view === k}">${esc(l)}</button>`).join('')}</div>
      ${view === 'chat' ? chatHtml() : view === 'docs' ? docsHtml() : view === 'note' ? noteHtml() : `${tasksHtml()}${quizHtml()}${callHtml()}${membersHtml()}${groveHtml()}${historyHtml()}`}
      <button type="button" class="small ghost danger" id="rm-leave">${esc(isHost() ? t('rm_close') : t('rm_leave'))}</button>
    </div>`;
  }
  const host = $('room-root');
  // A poll that changes nothing leaves the page alone: no lost scroll, open menu or half-tapped button. The clock ticks by itself.
  let lastSig = null;
  function paint(force) {
    const s = html(), sig = s.replace(/id="rm-clock">[^<]*/, '');
    if (force || sig !== lastSig) {
      const was = $('rm-chat-list'), stick = !was || was.scrollHeight - was.scrollTop - was.clientHeight < 40, top = was ? was.scrollTop : 0;
      ML.keepInputs(host, () => { host.innerHTML = s; });
      lastSig = sig; groveSig = '';
      const list = $('rm-chat-list'); if (list) list.scrollTop = stick ? list.scrollHeight : top;
      const ta = $('rm-note-in'); if (ta && noteEdit && document.activeElement !== ta && !ta.value) ta.value = noteEdit.text;
    }
    mountGrove();
  }
  function renderIfOpen() { if (S.tab === 'room') paint(); }
  function tick() {
    if (S.tab !== 'room') { clearInterval(tickT); return; }
    const c = $('rm-clock'); if (c && room && room.timer && room.timer.endAt > Date.now()) c.textContent = clockOf(room.timer);
    const q = quietNow(); // the end of the shared Focus opens the chat at once, not at the next poll
    if (q !== lastQuiet) { lastQuiet = q; trackSess(); flushHeld().then(renderIfOpen).catch(() => {}); renderIfOpen(); }
  }
  function bind() {
    paint(true);
    clearInterval(tickT); lastQuiet = quietNow();
    tickT = setInterval(tick, 1000);
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
      else if (f.id === 'rm-chat') { const i = $('rm-chat-in'), v = i.value.trim(); if (v) { i.value = ''; i.defaultValue = ''; await sendMsg(v).catch(err => { i.value = v; throw err; }); const again = $('rm-chat-in'); if (again) again.focus(); } }
      else if (f.id === 'rm-link') {
        const u = safeUrl($('rm-link-u').value.trim()); if (!u) { toast(t('rm_call_bad')); return; }
        const ti = $('rm-link-t').value.trim(); if (await postItem({ kind: 'link', title: ti.slice(0, 120), url: u })) { $('rm-link-u').value = ''; $('rm-link-t').value = ''; }
      }
      else if (f.id === 'rm-sharedeck') await shareDeck($('rm-sd').value);
      else if (f.id === 'rm-sharenote') await shareNote($('rm-sn').value);
    } catch (err) {
      if (f.id === 'rm-chat') { msgErr(err); return; }
      lastErr = true; renderIfOpen(); fail();
    }
  });
  host.addEventListener('input', e => {
    if (e.target.id !== 'rm-note-in' || !noteEdit) return;
    noteEdit.text = e.target.value;
    if (!noteEdit.lost) { clearTimeout(noteSaveT); noteSaveT = setTimeout(() => noteSave(false).catch(() => {}), 1500); }
  });
  host.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.arm && !b.dataset.armed) { // first tap: asks again, on its own after 3 s it goes back
      b.dataset.armed = '1'; b.textContent = t('tap_again');
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = t(b.dataset.arm); } }, 3000);
      return;
    }
    if (b.dataset.rmview) {
      if (view === 'note' && b.dataset.rmview !== 'note') noteRelease();
      view = b.dataset.rmview; if (view === 'chat' && !quietNow() && msgs.length) { R().seen = msgs[msgs.length - 1].created_at; save(); }
      paint(true); if (view === 'docs' || view === 'note') pullExtras(true).then(renderIfOpen);
      return;
    }
    if (b.dataset.rmmsgDel) { dropMsg(b.dataset.rmmsgDel).catch(fail); return; }
    if (b.dataset.rmmsgReport) { report('message', b.dataset.rmmsgReport).catch(fail); return; }
    if (b.dataset.rmitemDel) { dropItem(b.dataset.rmitemDel).catch(fail); return; }
    if (b.dataset.rmitemReport) { report('item', b.dataset.rmitemReport).catch(fail); return; }
    if (b.dataset.rmitemCopy) { copyItem(b.dataset.rmitemCopy).catch(fail); return; }
    if (b.dataset.rmmemberDel) { removeMember(b.dataset.rmmemberDel).catch(fail); return; }
    if (b.dataset.rmheldDel) { R().held = (R().held || []).filter(x => x.id !== b.dataset.rmheldDel); save(); renderIfOpen(); return; }
    if (b.dataset.rmrecapOk) { R().recapSeen = +b.dataset.rmrecapOk; save(); renderIfOpen(); return; }
    if (b.hasAttribute('data-rmcall-start')) { startCall().catch(fail); return; }
    if (b.hasAttribute('data-rmnote-edit')) { noteStart().catch(fail); return; }
    if (b.hasAttribute('data-rmnote-done')) { noteSave(true).catch(fail); return; }
    if (b.hasAttribute('data-rmnote-drop')) { noteEdit = null; clearTimeout(noteSaveT); pullNote().then(renderIfOpen).catch(fail); return; }
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
    if (e.target.id === 'rm-quiet') setStats({ quiet: e.target.checked }).catch(fail);
    if (e.target.id === 'rm-grove-show' || e.target.id === 'rm-grove-share') {
      S.tree = S.tree || {}; S.tree[e.target.id === 'rm-grove-show' ? 'grove' : 'share'] = e.target.checked; save();
      renderIfOpen(); syncTree().then(renderIfOpen);
    }
    if (e.target.dataset.rmtask) toggleTask(e.target.dataset.rmtask).catch(fail);
  });

  // The Share in the room buttons of a deck and of a notebook page
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-room-deck], [data-room-note]'); if (!b) return;
    (b.dataset.roomDeck ? shareDeck(b.dataset.roomDeck) : shareNote(b.dataset.roomNote)).catch(fail);
  });

  on('tab', n => { if (n === 'room') bind(); else noteRelease(); });
  on('timer', () => { if (R().code && me()) { if (room) trackSess(); presence().catch(() => {}); } });
  on('session', () => { const s = R() && R().sess; if (s && s.from) s.to = Date.now(); if (R().code && me()) { pull(); schedule(); } });
  on('started', () => { if (S.tab === 'room') bind(); if (R().code && me()) { pull(); schedule(); } });
  // (S.room is only there once the state has loaded: the login screen comes before)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && R() && R().code) { pull(); schedule(); } else if (R() && R().code) noteRelease(); });
  ML.Rooms = { pull, mountGrove, active: () => !!(R() && R().code && me() && extraOk) };
})();
