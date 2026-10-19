// Study rooms (Premium, Study tab): friends join a room with a 6-letter code and share one focus timer.
// The host starts focus or break for everyone; members see who is focusing. Data lives in two Supabase
// tables (study_rooms, room_members, see CLAUDE.md for the SQL); the app polls them every few seconds.
(() => {
  'use strict';
  const { $, S, t, esc, save, on, toast } = ML;

  ML.addStrings({
    fr: {
      st_room: 'Salle', rm_intro: 'Étudie avec tes amis : un minuteur partagé, et tu vois qui est concentré.', rm_signin: 'Connecte-toi à ton compte pour utiliser les salles d’étude.',
      rm_create: 'Créer une salle', rm_name_ph: 'Nom de la salle (ex. Révisions bac)', rm_join: 'Rejoindre', rm_code_ph: 'Code (6 lettres)', rm_you_ph: 'Ton pseudo dans la salle',
      rm_code: 'Code à partager', rm_copy: 'Copier le code', rm_copied: 'Code copié', rm_members: 'Présents', rm_leave: 'Quitter la salle', rm_close: 'Fermer la salle',
      rm_host: 'hôte', rm_focus: 'concentré', rm_break: 'en pause', rm_idle: 'disponible', rm_away: 'absent',
      rm_timer_idle: 'En attente de l’hôte', rm_start_focus: 'Focus {m} min', rm_start_break: 'Pause {m} min', rm_stop: 'Arrêter', rm_follow: 'Lancer mon minuteur avec la salle',
      rm_not_found: 'Aucune salle avec ce code.', rm_err: 'Salles indisponibles. Vérifie que les tables Supabase existent.', rm_started: 'La salle démarre : {m} min de focus',
      rm_focus_lbl: 'Focus en commun', rm_break_lbl: 'Pause en commun',
    },
    en: {
      st_room: 'Room', rm_intro: 'Study with friends: one shared timer, and you see who is focusing.', rm_signin: 'Sign in to your account to use study rooms.',
      rm_create: 'Create a room', rm_name_ph: 'Room name (e.g. Finals prep)', rm_join: 'Join', rm_code_ph: 'Code (6 letters)', rm_you_ph: 'Your name in the room',
      rm_code: 'Code to share', rm_copy: 'Copy code', rm_copied: 'Code copied', rm_members: 'Here now', rm_leave: 'Leave room', rm_close: 'Close room',
      rm_host: 'host', rm_focus: 'focusing', rm_break: 'on a break', rm_idle: 'available', rm_away: 'away',
      rm_timer_idle: 'Waiting for the host', rm_start_focus: 'Focus {m} min', rm_start_break: 'Break {m} min', rm_stop: 'Stop', rm_follow: 'Start my timer with the room',
      rm_not_found: 'No room with that code.', rm_err: "Rooms unavailable. Check that the Supabase tables exist.", rm_started: 'The room starts: {m} min of focus',
      rm_focus_lbl: 'Shared focus', rm_break_lbl: 'Shared break',
    },
  });
  ML.defaults(() => ({ room: { code: null, follow: true, me: '' } }));

  const R = () => S.room;
  const me = () => ML.auth && ML.auth.user;
  const rest = (p, o) => ML.auth.rest(p, o);
  let room = null, members = [], lastErr = false, pollT = null, tickT = null, lastStartAt = null;
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ALPH[b % ALPH.length]).join('');
  const myStatus = () => (ML.running() ? (S.mode === 'focus' ? 'focus' : 'break') : 'idle');
  const isHost = () => room && me() && room.host === me().id;

  /* ---------- Server ---------- */
  async function presence() {
    if (!R().code || !me()) return;
    await rest('/rest/v1/room_members?on_conflict=room_code,user_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
      body: { room_code: R().code, user_id: me().id, name: (R().me || me().email.split('@')[0]).slice(0, 24), status: myStatus(), seen_at: new Date().toISOString() } });
  }
  async function pull() {
    if (!R().code || !me()) return;
    try {
      const [rows, mem] = await Promise.all([
        rest('/rest/v1/study_rooms?select=*&code=eq.' + R().code),
        rest('/rest/v1/room_members?select=*&room_code=eq.' + R().code + '&order=seen_at.desc'),
      ]);
      if (!rows || !rows.length) { const was = R().code; R().code = null; room = null; members = []; save(); if (was) toast(t('rm_not_found')); renderIfOpen(); return; }
      room = rows[0]; members = mem || []; lastErr = false;
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
  async function setTimer(mode, mins) {
    if (!isHost()) return;
    const now = Date.now(), timer = mode ? { mode, mins, startAt: now, endAt: now + mins * 60000 } : {};
    await rest('/rest/v1/study_rooms?code=eq.' + room.code, { method: 'PATCH', prefer: 'return=minimal', body: { timer, updated_at: new Date().toISOString() } });
    room.timer = timer; if (mode === 'focus') follow(); renderIfOpen();
  }
  async function create(name) {
    const code = newCode();
    await rest('/rest/v1/study_rooms', { method: 'POST', prefer: 'return=minimal', body: { code, host: me().id, name: name.slice(0, 40), timer: {} } });
    R().code = code; save(); await pull(); schedule();
  }
  async function join(code) {
    const rows = await rest('/rest/v1/study_rooms?select=code&code=eq.' + code);
    if (!rows || !rows.length) { toast(t('rm_not_found')); return; }
    R().code = code; save(); await pull(); schedule();
  }
  async function leave() {
    const code = R().code; if (!code) return;
    try {
      if (isHost()) await rest('/rest/v1/study_rooms?code=eq.' + code, { method: 'DELETE', prefer: 'return=minimal' });
      else await rest('/rest/v1/room_members?room_code=eq.' + code + '&user_id=eq.' + me().id, { method: 'DELETE', prefer: 'return=minimal' });
    } catch (e) {}
    R().code = null; room = null; members = []; save(); renderIfOpen();
  }
  // Poll every 5 s while the room is on screen, every 20 s otherwise (presence keeps updating)
  function schedule() {
    clearTimeout(pollT);
    if (!R().code || !me()) return;
    const visible = document.visibilityState === 'visible' && S.tab === 'study' && S.study && S.study.tool === 'room';
    pollT = setTimeout(async () => { if (document.visibilityState === 'visible') await pull(); schedule(); }, visible ? 5000 : 20000);
  }

  /* ---------- UI ---------- */
  const clockOf = T => { if (!T || !T.endAt) return null; const left = Math.max(0, (T.endAt - Date.now()) / 1000); return MiniView.fmtClock(left); };
  function html() {
    if (!me()) return `<p class="hint">${esc(t('rm_signin'))}</p>`;
    if (!R().code || !room) return `<p class="hint">${esc(t('rm_intro'))}</p>
      ${lastErr ? `<p class="hint">${esc(t('rm_err'))}</p>` : ''}
      <label class="field"><span>${esc(t('rm_you_ph'))}</span><input type="text" id="rm-me" maxlength="24" value="${esc(R().me || me().email.split('@')[0])}"></label>
      <form class="sr-form" id="rm-create" autocomplete="off"><input type="text" id="rm-name" maxlength="40" placeholder="${esc(t('rm_name_ph'))}"><button type="submit" class="primary small">${esc(t('rm_create'))}</button></form>
      <form class="sr-form" id="rm-join" autocomplete="off"><input type="text" id="rm-code" maxlength="6" placeholder="${esc(t('rm_code_ph'))}" autocapitalize="characters" spellcheck="false"><button type="submit" class="small">${esc(t('rm_join'))}</button></form>`;
    const T = room.timer || {}, clock = clockOf(T), active = T.endAt && T.endAt > Date.now();
    const fresh = m => Date.now() - new Date(m.seen_at).getTime() < 60000;
    return `<div class="rm-card">
      <div class="rm-head"><div><span class="label">${esc(t('st_room'))}</span><h3>${esc(room.name || t('st_room'))}</h3></div>
        <button type="button" class="rm-code" id="rm-copy" title="${esc(t('rm_copy'))}"><small>${esc(t('rm_code'))}</small><b>${esc(room.code)}</b></button></div>
      <div class="rm-timer ${active ? 'on ' + T.mode : ''}"><span class="state">${esc(active ? t(T.mode === 'focus' ? 'rm_focus_lbl' : 'rm_break_lbl') : t('rm_timer_idle'))}</span>
        <div class="rm-clock" id="rm-clock">${active ? clock : '--:--'}</div></div>
      ${isHost() ? `<div class="chips rm-ctrl">${[25, 50, 90].map(m => `<button type="button" class="chip-btn" data-rmfocus="${m}">${esc(t('rm_start_focus', { m }))}</button>`).join('')}
        ${[5, 10].map(m => `<button type="button" class="chip-btn" data-rmbreak="${m}">${esc(t('rm_start_break', { m }))}</button>`).join('')}
        ${active ? `<button type="button" class="chip-btn" data-rmstop>${esc(t('rm_stop'))}</button>` : ''}</div>` : ''}
      <label class="opt"><input type="checkbox" id="rm-follow" ${R().follow ? 'checked' : ''}> ${esc(t('rm_follow'))}</label>
      <span class="label">${esc(t('rm_members'))} · ${members.filter(fresh).length}</span>
      <ul class="rm-members">${members.map(m => { const st = fresh(m) ? m.status : 'away'; return `<li class="st-${st}"><i></i><b>${esc(m.name)}</b>${m.user_id === room.host ? `<small>${esc(t('rm_host'))}</small>` : ''}<span>${esc(t('rm_' + st))}</span></li>`; }).join('')}</ul>
      <button type="button" class="small ghost danger" id="rm-leave">${esc(isHost() ? t('rm_close') : t('rm_leave'))}</button>
    </div>`;
  }
  let host = null;
  function renderIfOpen() { if (host && host.isConnected) { host.innerHTML = html(); } }
  function bind(el) {
    host = el; el.innerHTML = html();
    clearInterval(tickT);
    tickT = setInterval(() => { if (!host || !host.isConnected) { clearInterval(tickT); return; } const c = $('rm-clock'); if (c && room && room.timer && room.timer.endAt > Date.now()) c.textContent = clockOf(room.timer); }, 1000);
    if (R().code && !room) pull();
    schedule();
  }
  // Delegated events on the Study tab body
  const root = $('study');
  root.addEventListener('submit', async e => {
    const f = e.target; if (f.id !== 'rm-create' && f.id !== 'rm-join') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const nm = $('rm-me'); if (nm) { R().me = nm.value.trim().slice(0, 24); save(); }
    try {
      if (f.id === 'rm-create') await create(($('rm-name').value || '').trim() || t('st_room'));
      else { const code = ($('rm-code').value || '').trim().toUpperCase(); if (code.length === 6) await join(code); }
    } catch (err) { lastErr = true; renderIfOpen(); toast(t('rm_err')); }
  }, true);
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !host || !host.contains(b)) return;
    if (b.id === 'rm-copy') { try { navigator.clipboard.writeText(room.code).then(() => toast(t('rm_copied'))); } catch (err) {} return; }
    if (b.dataset.rmfocus) { setTimer('focus', +b.dataset.rmfocus).catch(() => toast(t('rm_err'))); return; }
    if (b.dataset.rmbreak) { setTimer('break', +b.dataset.rmbreak).catch(() => toast(t('rm_err'))); return; }
    if (b.hasAttribute('data-rmstop')) { setTimer(null).catch(() => toast(t('rm_err'))); return; }
    if (b.id === 'rm-leave') { leave(); return; }
  });
  root.addEventListener('change', e => { if (e.target.id === 'rm-follow') { R().follow = e.target.checked; save(); } });

  on('timer', () => { if (R().code && me()) presence().catch(() => {}); });
  on('started', () => { if (R().code && me()) { pull(); schedule(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && R().code) { pull(); schedule(); } });
  ML.Rooms = { html, bind };
})();
