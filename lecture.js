// Lecture capture (3.59, Study space, Premium): record a class while typing notes; each note keeps its moment, so tapping
// it plays what was being said. The audio stays on this device (IndexedDB, written every 10 s so a crash loses little);
// the titles and notes are in S.lectures and sync like the rest. Picked in proposals/rentree/rentree2.html (I1).
(() => {
  'use strict';
  const { $, S, t, esc, on, save, uid, toast } = ML;

  ML.addStrings({
    fr: {
      tab_lectures: 'Cours', lc_intro: 'Enregistre ton cours et prends tes notes ici : chaque note garde son moment. Touche-la plus tard pour réentendre ce qui se disait.', lc_consent: 'Demande son accord à la personne qui parle avant d’enregistrer.', lc_local: 'L’audio reste sur cet appareil, tes notes te suivent sur les autres.',
      lc_title_ph: 'Nom du cours (ex. Droit civil, cours 4)', lc_start: 'Enregistrer', lc_pause: 'Pause', lc_resume: 'Reprendre', lc_stop: 'Terminer', lc_note_ph: 'Écris une note, Entrée pour la garder', lc_add: 'Garder', lc_live: 'Enregistrement', lc_paused: 'En pause', lc_none: 'Aucun cours enregistré.', lc_back: 'Tous les cours', lc_notes_n: 'Notes : {n}', lc_no_notes: 'Pas encore de note.', lc_no_audio: 'L’audio de ce cours est sur un autre appareil.', lc_send: 'Envoyer au Carnet', lc_sent: 'Notes envoyées au Carnet.', lc_delete: 'Supprimer ce cours', lc_used: '{used} utilisés sur cet appareil', lc_premium: 'Lecture capture fait partie de Premium.',
      lc_mic: 'Le micro n’est pas disponible. Autorise-le dans ton navigateur, puis réessaie.', lc_mic_ext: 'Le panneau latéral ne peut pas demander le micro. Ouvre l’app dans un onglet et enregistre depuis cet onglet.', lc_open_tab: 'Ouvrir dans un onglet', lc_unsupported: 'Ce navigateur ne sait pas enregistrer.', lc_full: 'Plus assez de place : l’enregistrement s’est arrêté.', lc_bg: 'Sur téléphone, garde l’app ouverte : certains appareils coupent le micro en arrière-plan.', lc_leave: 'Un enregistrement est en cours.',
    },
    en: {
      tab_lectures: 'Lectures', lc_intro: 'Record your class and take your notes here: each note keeps its moment. Tap it later to hear what was being said.', lc_consent: 'Ask the speaker for permission before you record.', lc_local: 'The audio stays on this device, your notes follow you on the others.',
      lc_title_ph: 'Class name (e.g. Civil law, lecture 4)', lc_start: 'Record', lc_pause: 'Pause', lc_resume: 'Resume', lc_stop: 'Finish', lc_note_ph: 'Type a note, Enter to keep it', lc_add: 'Keep', lc_live: 'Recording', lc_paused: 'Paused', lc_none: 'No lecture recorded yet.', lc_back: 'All lectures', lc_notes_n: 'Notes: {n}', lc_no_notes: 'No notes yet.', lc_no_audio: 'The audio of this lecture is on another device.', lc_send: 'Send to Notes', lc_sent: 'Notes sent to Notes.', lc_delete: 'Delete this lecture', lc_used: '{used} used on this device', lc_premium: 'Lecture capture is part of Premium.',
      lc_mic: 'The microphone isn’t available. Allow it in your browser, then try again.', lc_mic_ext: 'The side panel can’t ask for the microphone. Open the app in a tab and record from that tab.', lc_open_tab: 'Open in a tab', lc_unsupported: 'This browser can’t record.', lc_full: 'Not enough space left: the recording stopped.', lc_bg: 'On a phone, keep the app open: some devices cut the microphone in the background.', lc_leave: 'A recording is in progress.',
    },
  });
  ML.defaults(() => ({ lectures: [] }));

  /* ---------- Storage: one store of audio chunks per account, keys "id:000123" ---------- */
  let dbP = null, dbKey = '';
  function db() {
    const k = 'mli-lectures:' + ML.storageKey();
    if (dbP && dbKey === k) return dbP;
    dbKey = k;
    dbP = new Promise((res, rej) => { const r = indexedDB.open(k, 1); r.onupgradeneeded = () => r.result.createObjectStore('chunks'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    dbP.catch(() => { dbP = null; });
    return dbP;
  }
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const x = d.transaction('chunks', mode), r = fn(x.objectStore('chunks')); x.oncomplete = () => res(r && r.result); x.onerror = () => rej(x.error); x.onabort = () => rej(x.error); }); };
  const rangeOf = id => IDBKeyRange.bound(id + ':', id + ':￿');
  const putChunk = (id, n, blob) => tx('readwrite', s => s.put(blob, id + ':' + String(n).padStart(6, '0')));
  const getChunks = id => tx('readonly', s => s.getAll(rangeOf(id)));
  const delChunks = id => tx('readwrite', s => s.delete(rangeOf(id)));

  /* ---------- Recording ---------- */
  const list = () => S.lectures || (S.lectures = []);
  const byId = id => list().find(x => x.id === id);
  const clock = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + ML.pad2(m) : m) + ':' + ML.pad2(s % 60); };
  let rec = null; // { id, mr, stream, n, startedAt, before, paused, wake }
  let openId = null, micErr = '', audio = null, audioUrl = null;
  const MIME = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
  const elapsed = () => (rec ? rec.before + (rec.paused ? 0 : (Date.now() - rec.startedAt) / 1000) : 0);

  async function start(title) {
    micErr = '';
    if (!window.MediaRecorder || !navigator.mediaDevices) { micErr = 'lc_unsupported'; return render(); }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } }); }
    catch (e) { micErr = ML.IS_EXT ? 'lc_mic_ext' : 'lc_mic'; return render(); }
    const mime = MIME.find(m => MediaRecorder.isTypeSupported(m)) || '';
    const mr = new MediaRecorder(stream, Object.assign({ audioBitsPerSecond: 32000 }, mime ? { mimeType: mime } : {}));
    const lec = { id: uid(), title: title || new Date().toLocaleDateString(ML.locale(), { day: 'numeric', month: 'long' }), at: Date.now(), secs: 0, mime: mr.mimeType || mime, device: true, live: true, notes: [] };
    list().unshift(lec); save();
    rec = { id: lec.id, mr, stream, n: 0, startedAt: Date.now(), before: 0, paused: false, wake: null };
    mr.ondataavailable = e => { if (!e.data || !e.data.size) return; const n = rec ? rec.n++ : 0; putChunk(lec.id, n, e.data).catch(() => { toast(t('lc_full'), { ms: 8000 }); stop(); }); lec.secs = Math.floor(elapsed()); save(); };
    mr.start(10000);
    try { rec.wake = await navigator.wakeLock.request('screen'); } catch (e) {}
    openId = null; render(); tickOn();
  }
  function togglePause() {
    if (!rec) return;
    if (rec.paused) { rec.mr.resume(); rec.startedAt = Date.now(); rec.paused = false; }
    else { rec.before = elapsed(); rec.mr.pause(); rec.paused = true; }
    render(); renderPill();
  }
  function stop() {
    if (!rec) return;
    const r = rec, lec = byId(r.id), secs = elapsed();
    r.mr.onstop = () => { r.stream.getTracks().forEach(x => x.stop()); if (lec) { lec.secs = Math.floor(secs); lec.live = false; save(); } rec = null; openId = r.id; render(); renderPill(); };
    try { r.mr.state !== 'inactive' ? r.mr.stop() : r.mr.onstop(); } catch (e) { r.mr.onstop(); }
    if (r.wake) r.wake.release().catch(() => {});
  }
  function addNote(text, at) {
    const lec = byId(rec ? rec.id : openId); if (!lec || !text) return;
    lec.notes.push({ id: uid(), t: Math.floor(at), text: text.slice(0, 1000) }); lec.notes.sort((a, b) => a.t - b.t); save();
  }
  addEventListener('beforeunload', e => { if (rec) { e.preventDefault(); e.returnValue = t('lc_leave'); } });

  /* ---------- A small strip when the recording goes on behind another tab ---------- */
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'lc-pill'; pill.id = 'lc-pill'; pill.hidden = true;
  document.body.append(pill);
  pill.onclick = () => ML.setMobileView('lectures');
  function renderPill() {
    const show = !!rec && S.tab !== 'lectures'; pill.hidden = !show; if (!show) return;
    pill.innerHTML = `<i class="${rec.paused ? 'off' : ''}"></i>${esc(t(rec.paused ? 'lc_paused' : 'lc_live'))} ${esc(clock(elapsed()))}`;
  }
  let tickT = 0;
  function tickOn() {
    clearInterval(tickT);
    tickT = setInterval(() => { if (!rec) { clearInterval(tickT); return; } const c = $('lc-clock'); if (c) c.textContent = clock(elapsed()); renderPill(); }, 1000);
  }

  /* ---------- Screens ---------- */
  const fmtDate = ms => new Date(ms).toLocaleDateString(ML.locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const notesHtml = (lec, seek) => lec.notes.length ? `<ul class="lc-notes">${lec.notes.map(n => `<li data-t="${n.t}">${seek ? `<button type="button" class="lc-time" data-lc-seek="${n.t}">${esc(clock(n.t))}</button>` : `<span class="lc-time">${esc(clock(n.t))}</span>`}<span class="lc-text">${esc(n.text)}</span><button type="button" class="icon-btn" data-lc-ndel="${n.id}" aria-label="${esc(t('delete'))}">✕</button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('lc_no_notes'))}</p>`;
  const noteForm = () => `<form class="lc-noteform" id="lc-noteform" autocomplete="off"><input type="text" id="lc-note" maxlength="1000" placeholder="${esc(t('lc_note_ph'))}" aria-label="${esc(t('lc_note_ph'))}"><button type="submit" class="small">${esc(t('lc_add'))}</button></form>`;
  function liveHtml() {
    const lec = byId(rec.id);
    return `<div class="lc-live ${rec.paused ? 'paused' : ''}"><h3>${esc(lec.title)}</h3>
      <div class="lc-meter"><i></i><b id="lc-clock" role="timer">${esc(clock(elapsed()))}</b><span>${esc(t(rec.paused ? 'lc_paused' : 'lc_live'))}</span></div>
      <div class="lc-btns"><button type="button" class="small" data-lc="pause">${esc(t(rec.paused ? 'lc_resume' : 'lc_pause'))}</button><button type="button" class="small primary" data-lc="stop">${esc(t('lc_stop'))}</button></div>
      ${noteForm()}${notesHtml(lec, false)}<p class="hint">${esc(t('lc_bg'))}</p></div>`;
  }
  function detailHtml(lec) {
    return `<div class="lc-detail"><button type="button" class="link" data-lc="back">${esc(t('lc_back'))}</button>
      <input type="text" class="lc-rename" id="lc-rename" maxlength="80" value="${esc(lec.title)}" aria-label="${esc(t('lc_title_ph'))}"><small class="hint">${esc(fmtDate(lec.at))} · ${esc(clock(lec.secs))}</small>
      <div id="lc-player"></div>${noteForm()}${notesHtml(lec, true)}
      <div class="lc-btns"><button type="button" class="small" data-lc="send" ${lec.notes.length ? '' : 'disabled'}>${esc(t('lc_send'))}</button><button type="button" class="small ghost danger" id="lc-del">${esc(t('lc_delete'))}</button></div></div>`;
  }
  function homeHtml() {
    return `<p class="hint">${esc(t('lc_intro'))}</p>
      <form class="lc-new" id="lc-new" autocomplete="off"><input type="text" id="lc-title" maxlength="80" placeholder="${esc(t('lc_title_ph'))}" aria-label="${esc(t('lc_title_ph'))}"><button type="submit" class="primary small">${esc(t('lc_start'))}</button></form>
      ${micErr ? `<p class="lc-err" role="alert">${esc(t(micErr))}${micErr === 'lc_mic_ext' ? ` <button type="button" class="link" data-lc="tab">${esc(t('lc_open_tab'))}</button>` : ''}</p>` : ''}
      <p class="hint">${esc(t('lc_consent'))} ${esc(t('lc_local'))}</p>
      ${list().length ? `<ul class="lc-list">${list().map(x => `<li><button type="button" data-lc-open="${x.id}"><b>${esc(x.title)}</b><small>${esc(fmtDate(x.at))} · ${esc(clock(x.secs))} · ${esc(t('lc_notes_n', { n: x.notes.length }))}</small></button></li>`).join('')}</ul>` : `<p class="hint">${esc(t('lc_none'))}</p>`}
      <p class="hint" id="lc-used"></p>`;
  }
  const root = $('lectures');
  function render() {
    if (!root) return;
    if (!(ML.isPremium && ML.isPremium()) && !rec) { root.innerHTML = `<div class="lc"><p class="hint">${esc(t('lc_intro'))}</p><p class="hint">${esc(t('lc_premium'))}</p></div>`; return; }
    const lec = openId && byId(openId);
    if (audio) { audio.pause(); audio = null; }
    root.innerHTML = `<div class="lc">${rec ? liveHtml() : lec ? detailHtml(lec) : homeHtml()}</div>`;
    if (lec && !rec) mountPlayer(lec);
    const u = $('lc-used');
    if (u && navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { if (u.isConnected && e.usage) u.textContent = t('lc_used', { used: (e.usage / 1048576).toFixed(0) + ' Mo' }); }).catch(() => {});
    if (lec) { const b = $('lc-del'); if (b) ML.armedButton(b, 'lc_delete', () => remove(lec.id)); }
  }
  // MediaRecorder's webm files don't state their length: asking for a far-away time makes the browser work it out, and seeking then works
  async function mountPlayer(lec) {
    const box = $('lc-player'); if (!box) return;
    let chunks = [];
    try { chunks = (await getChunks(lec.id)) || []; } catch (e) {}
    if (!box.isConnected) return;
    if (!chunks.length) { box.innerHTML = `<p class="hint">${esc(t('lc_no_audio'))}</p>`; return; }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(new Blob(chunks, { type: lec.mime || 'audio/webm' }));
    const a = document.createElement('audio'); a.controls = true; a.preload = 'metadata'; a.src = audioUrl; a.className = 'lc-audio';
    a.addEventListener('loadedmetadata', () => { if (a.duration === Infinity) { a.currentTime = 1e7; a.addEventListener('durationchange', function f() { if (a.duration !== Infinity) { a.removeEventListener('durationchange', f); a.currentTime = 0; } }); } });
    a.addEventListener('timeupdate', markCurrent);
    box.append(a); audio = a;
  }
  function markCurrent() {
    if (!audio) return;
    const now = audio.currentTime, rows = [...root.querySelectorAll('.lc-notes li')]; let cur = null;
    rows.forEach(r => { if (+r.dataset.t <= now) cur = r; });
    rows.forEach(r => r.classList.toggle('now', r === cur));
  }
  function remove(id) {
    delChunks(id).catch(() => {});
    S.lectures = list().filter(x => x.id !== id); openId = null; save(); render();
  }

  root.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'lc-new') { start(($('lc-title').value || '').trim()); return; }
    if (e.target.id === 'lc-noteform') {
      const i = $('lc-note'), v = i.value.trim(); if (!v) return;
      addNote(v, rec ? elapsed() : audio ? audio.currentTime : 0);
      const keep = i === document.activeElement; render(); if (keep) { const n = $('lc-note'); if (n) n.focus(); }
    }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.lc;
    if (a === 'pause') togglePause();
    else if (a === 'stop') stop();
    else if (a === 'back') { openId = null; render(); }
    else if (a === 'tab') { try { chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }); } catch (err) {} }
    else if (a === 'send') { const lec = byId(openId); if (lec) { ML.notesAppend(`<h3>${esc(lec.title)}</h3>` + lec.notes.map(n => `<p><b>${esc(clock(n.t))}</b> ${esc(n.text)}</p>`).join('')); toast(t('lc_sent')); } }
    else if (b.dataset.lcOpen) { openId = b.dataset.lcOpen; render(); }
    else if (b.dataset.lcSeek !== undefined && audio) { audio.currentTime = +b.dataset.lcSeek; audio.play().catch(() => {}); }
    else if (b.dataset.lcNdel) { const lec = byId(rec ? rec.id : openId); if (lec) { lec.notes = lec.notes.filter(n => n.id !== b.dataset.lcNdel); save(); render(); } }
  });
  root.addEventListener('change', e => { if (e.target.id === 'lc-rename') { const lec = byId(openId); if (lec && e.target.value.trim()) { lec.title = e.target.value.trim(); save(); } } });

  on('tab', n => { renderPill(); if (n === 'lectures') render(); });
  on('premium', () => { if (S.tab === 'lectures') render(); });
  on('lang', () => { if (S.tab === 'lectures') render(); });
  // A recording cut off by a crash or a closed tab: what was written is still there
  on('started', () => { let ch = false; list().forEach(x => { if (x.live) { x.live = false; ch = true; } }); if (ch) save(); if (S.tab === 'lectures') render(); });
})();
