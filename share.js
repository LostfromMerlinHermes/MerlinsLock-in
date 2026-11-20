// Shared subjects (3.111, P1 + P2 of proposals/matieres-today; server: supabase/shared-subjects.sql). A subject can be
// shared with a group through a 6-letter code. What a member shares in it (a link, one of the subject's decks or Notebook
// pages) is listed for everybody; a member copies a deck or a page in one tap, and the copy then follows the author's
// changes (the author's app re-sends an item when its content changes, rev + 1). Review progress stays on each device.
// The group also splits an exam's chapters: each member takes some, says where they stand, and the list shows who does what.
// S.sjShare: { subjectId: code }  S.sjPushed: { itemId: { kind, src, h } }  S.sjCopies: { itemId: { kind, local, rev } }
(() => {
  'use strict';
  const { S, t, esc, save, on, uid, toast, today } = ML;

  ML.addStrings({
    fr: {
      sg_title: 'Groupe', sg_create: 'Créer le groupe', sg_share: 'Partager avec un groupe', sg_share_d: 'Tes amis rejoignent avec un code et voient ce que chacun partage ici. Les paquets et les notes copiés restent à jour.', sg_login: 'Connecte-toi pour partager (Compte).',
      sg_code: 'Code {c}', sg_members: '{n} membres', sg_members_one: '1 membre', sg_copy_code: 'Copier le code', sg_copied: 'Code copié', sg_leave: 'Quitter le groupe', sg_left: 'Tu as quitté le groupe.',
      sg_items: 'Partagé dans le groupe', sg_none: 'Rien de partagé pour l’instant.', sg_add: '+ Partager', sg_by: 'par {n}', sg_mine: 'toi', sg_updated: 'mis à jour {d}', sg_copy: 'Copier', sg_copied_it: 'Copié dans {s}', sg_follow: 'Suivi', sg_open: 'Ouvrir', sg_remove: 'Retirer',
      sg_pick: 'Partager dans le groupe', sg_link: 'Lien', sg_link_title: 'Titre', sg_link_url: 'Adresse (https://…)', sg_link_bad: 'Il faut une adresse en https://.', sg_send: 'Partager', sg_sent: 'Partagé avec le groupe', sg_nothing: 'Pas de paquet ni de note dans cette matière. Ajoute-en d’abord.',
      sg_ch: 'Chapitres', sg_ch_d: 'Chacun prend des chapitres et fait la fiche et les cartes. Tout le groupe les reçoit en les copiant ici.', sg_ch_ph: 'Chapitre (ex. Ch. 3 · Intégrales)', sg_ch_add: 'Ajouter', sg_take: 'Je prends', sg_taken: 'Pris : tâche ajoutée dans la matière', sg_free: 'Lâcher', sg_doing: 'En cours', sg_done: 'Fait', sg_ch_task: 'Fiche et cartes : {c}',
      sg_join: 'Rejoindre un groupe', sg_join_ph: 'Code à 6 lettres', sg_join_go: 'Rejoindre', sg_joined: 'Groupe rejoint : {n}', sg_err_nf: 'Code inconnu.', sg_err_full: 'Ce groupe est complet (30).', sg_err_slow: 'Trop d’essais, réessaie dans 10 minutes.', sg_err_srv: 'Le partage n’est pas encore activé sur le serveur.', sg_err: 'Le groupe ne répond pas. Réessaie.',
    },
    en: {
      sg_title: 'Group', sg_create: 'Create the group', sg_share: 'Share with a group', sg_share_d: 'Friends join with a code and see what each one shares here. Copied decks and notes stay up to date.', sg_login: 'Sign in to share (Account).',
      sg_code: 'Code {c}', sg_members: '{n} members', sg_members_one: '1 member', sg_copy_code: 'Copy the code', sg_copied: 'Code copied', sg_leave: 'Leave the group', sg_left: 'You left the group.',
      sg_items: 'Shared in the group', sg_none: 'Nothing shared yet.', sg_add: '+ Share', sg_by: 'by {n}', sg_mine: 'you', sg_updated: 'updated {d}', sg_copy: 'Copy', sg_copied_it: 'Copied into {s}', sg_follow: 'Following', sg_open: 'Open', sg_remove: 'Remove',
      sg_pick: 'Share in the group', sg_link: 'Link', sg_link_title: 'Title', sg_link_url: 'Address (https://…)', sg_link_bad: 'The address must start with https://.', sg_send: 'Share', sg_sent: 'Shared with the group', sg_nothing: 'No deck or note in this subject. Add some first.',
      sg_ch: 'Chapters', sg_ch_d: 'Each one takes chapters and makes the sheet and the cards. The whole group gets them by copying them here.', sg_ch_ph: 'Chapter (e.g. Ch. 3 · Integrals)', sg_ch_add: 'Add', sg_take: 'I’ll take it', sg_taken: 'Taken: task added to the subject', sg_free: 'Let go', sg_doing: 'Doing', sg_done: 'Done', sg_ch_task: 'Sheet and cards: {c}',
      sg_join: 'Join a group', sg_join_ph: '6-letter code', sg_join_go: 'Join', sg_joined: 'Group joined: {n}', sg_err_nf: 'Unknown code.', sg_err_full: 'This group is full (30).', sg_err_slow: 'Too many tries, try again in 10 minutes.', sg_err_srv: 'Sharing is not switched on on the server yet.', sg_err: 'The group is not answering. Try again.',
    },
  });
  ML.defaults(() => ({ sjShare: {}, sjPushed: {}, sjCopies: {} }));

  const me = () => ML.auth && ML.auth.user;
  const rest = (p, o) => ML.auth.rest(p, o);
  const myName = () => ((S.room && S.room.me) || (me() && me().email ? me().email.split('@')[0] : '')).slice(0, 24);
  const subjOf = id => (S.subjects || []).find(x => x.id === id);
  const codeOf = sid => (S.sjShare || {})[sid] || null;
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } };
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
  const ago = iso => { const d = new Date(iso); return d.toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }); };
  const errOf = e => (e && (e.status === 404 || /relation|function .* does not exist|schema cache/i.test(e.message || '')) ? t('sg_err_srv') : t('sg_err'));
  const cache = {}; // code -> { group, members, items, chapters, at, err }
  let busy = false, pollT = null;

  /* ---------- Server ---------- */
  async function load(code) {
    try {
      const q = c => '?code=eq.' + encodeURIComponent(c);
      const [g, m, it, ch] = await Promise.all([
        rest('/rest/v1/sj_groups' + q(code) + '&select=code,name,color,owner'),
        rest('/rest/v1/sj_members' + q(code) + '&select=user_id,name'),
        rest('/rest/v1/sj_items' + q(code) + '&select=id,user_id,name,kind,title,url,rev,updated_at&order=updated_at.desc'),
        rest('/rest/v1/sj_chapters' + q(code) + '&select=id,exam,pos,title,taker,taker_name,progress&order=pos.asc'),
      ]);
      if (!g || !g.length) { cache[code] = { gone: true, at: Date.now() }; return cache[code]; }
      cache[code] = { group: g[0], members: m || [], items: it || [], chapters: ch || [], at: Date.now() };
      await follow(code);
    } catch (e) { cache[code] = Object.assign(cache[code] || {}, { err: errOf(e), at: Date.now() }); }
    return cache[code];
  }
  const refresh = code => load(code).then(() => { if (ML.renderSubjects) ML.renderSubjects(); });

  // Copies follow their item: a newer rev fetches the content and updates the deck or the page here
  async function follow(code) {
    const c = cache[code]; if (!c || !c.items) return;
    const stale = c.items.filter(i => S.sjCopies[i.id] && i.rev > S.sjCopies[i.id].rev && i.user_id !== (me() || {}).id);
    for (const i of stale) {
      try {
        const r = await rest('/rest/v1/sj_items?id=eq.' + encodeURIComponent(i.id) + '&select=payload,rev,title');
        const p = r && r[0] && r[0].payload; if (!p) continue;
        const cp = S.sjCopies[i.id];
        if (i.kind === 'deck' && Array.isArray(p.cards) && ML.studySyncDeck) ML.studySyncDeck(cp.local, p.name || i.title, p.cards);
        if (i.kind === 'note' && ML.notesSetPage) ML.notesSetPage(cp.local, p.title || i.title, String(p.html || ''));
        cp.rev = r[0].rev; save();
      } catch (e) {}
    }
  }
  // What I shared follows my own changes: a changed deck or page is sent again
  async function pushMine() {
    if (!me() || busy) return;
    const P = S.sjPushed || {};
    for (const id of Object.keys(P)) {
      const x = P[id], data = x.kind === 'deck' ? ML.studyDeckExport && ML.studyDeckExport(x.src) : x.kind === 'note' ? ML.notesExport && ML.notesExport(x.src) : null;
      if (!data) continue;
      const h = hash(JSON.stringify(data)); if (h === x.h) continue;
      try { await rest('/rest/v1/sj_items?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { payload: data, title: String(data.name || data.title || '').slice(0, 120) || '…' }, prefer: 'return=minimal' }); x.h = h; save(); }
      catch (e) { if (e.status === 404 || e.status === 406) delete P[id]; }
    }
  }
  setInterval(pushMine, 120000);
  on('started', () => setTimeout(pushMine, 8000));

  async function create(sid) {
    const x = subjOf(sid); if (!x) return;
    if (!me()) return toast(t('sg_login'));
    busy = true;
    try { const code = await rest('/rest/v1/rpc/create_sj', { method: 'POST', body: { p_name: x.name, p_color: x.color || null, p_me: myName() } }); S.sjShare[sid] = code; save(); await refresh(code); }
    catch (e) { toast(errOf(e)); }
    busy = false;
  }
  async function join(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) return toast(t('sg_err_nf'));
    if (!me()) return toast(t('sg_login'));
    try {
      const r = await rest('/rest/v1/rpc/join_sj', { method: 'POST', body: { p_code: code, p_me: myName() } });
      if (!r || !r.ok) return toast(t(r && r.why === 'full' ? 'sg_err_full' : r && r.why === 'slow' ? 'sg_err_slow' : 'sg_err_nf'));
      // the group's subject: the one already linked, else one with the same name, else a new one
      let sid = Object.keys(S.sjShare).find(k => S.sjShare[k] === r.code);
      if (!sid) { const same = (S.subjects || []).find(s => s.name.trim().toLowerCase() === String(r.name).trim().toLowerCase() && !codeOf(s.id)); sid = same ? same.id : null; }
      if (!sid) { const s = { id: uid(), name: String(r.name).slice(0, 40), color: r.color || '#5d8aa8', coef: 1, target: null, nextCoef: null, grades: [] }; (S.subjects || (S.subjects = [])).push(s); sid = s.id; }
      S.sjShare[sid] = r.code; save(); toast(t('sg_joined', { n: r.name }));
      ML.openSubject(sid); refresh(r.code);
    } catch (e) { toast(errOf(e)); }
  }
  async function leave(sid) {
    const code = codeOf(sid); if (!code) return;
    try { await rest('/rest/v1/sj_members?code=eq.' + encodeURIComponent(code) + '&user_id=eq.' + me().id, { method: 'DELETE', prefer: 'return=minimal' }); } catch (e) {}
    delete S.sjShare[sid]; delete cache[code]; save(); toast(t('sg_left')); if (ML.renderSubjects) ML.renderSubjects();
  }
  async function shareItem(sid, kind, src, link) {
    const code = codeOf(sid); if (!code) return;
    let body = { id: uid(), code, kind };
    if (kind === 'link') { const u = safeUrl(link.url); if (!u) return toast(t('sg_link_bad')); body.url = u; body.title = (link.title || u).slice(0, 120); }
    else {
      const data = kind === 'deck' ? ML.studyDeckExport(src) : ML.notesExport(src); if (!data) return;
      body.payload = data; body.title = String(data.name || data.title || '…').slice(0, 120);
    }
    try {
      await rest('/rest/v1/sj_items', { method: 'POST', body, prefer: 'return=minimal' });
      if (kind !== 'link') { S.sjPushed[body.id] = { kind, src, h: hash(JSON.stringify(body.payload)) }; save(); }
      toast(t('sg_sent')); refresh(code);
    } catch (e) { toast(errOf(e)); }
  }
  async function copyItem(sid, item) {
    try {
      const r = await rest('/rest/v1/sj_items?id=eq.' + encodeURIComponent(item.id) + '&select=payload,rev,title');
      const p = r && r[0] && r[0].payload; if (!p) return;
      let local = null;
      if (item.kind === 'deck' && ML.studyImportDeck) { const d = ML.studyImportDeck(p.name || item.title, Array.isArray(p.cards) ? p.cards : []); if (d) { d.subject = sid; local = d.id; } }
      if (item.kind === 'note' && ML.notesAddPage) { const pg = ML.notesAddPage(p.title || item.title, String(p.html || '')); if (pg) { pg.subject = sid; local = pg.id; } }
      if (!local) return;
      S.sjCopies[item.id] = { kind: item.kind, local, rev: r[0].rev }; save();
      toast(t('sg_copied_it', { s: (subjOf(sid) || {}).name || '' })); if (ML.renderSubjects) ML.renderSubjects();
    } catch (e) { toast(errOf(e)); }
  }
  const chPatch = (id, body) => rest('/rest/v1/sj_chapters?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body, prefer: 'return=minimal' });

  /* ---------- On the subject's page ---------- */
  let picking = null; // the subject whose « + Partager » chooser is open
  ML.sharedHtml = x => {
    const code = codeOf(x.id);
    if (!code) return `<section class="sjp-sec sh"><div class="sh-off"><b>${esc(t('sg_share'))}</b><small>${esc(t('sg_share_d'))}</small><button type="button" class="ghost small" data-sh="create">${esc(t('sg_create'))}</button></div></section>`;
    const c = cache[code];
    if (!c || (!c.group && !c.err && !c.gone)) { if (!c || !c.loading) { cache[code] = Object.assign(c || {}, { loading: true }); refresh(code); } return `<section class="sjp-sec sh"><div class="sjp-sh"><h3>${esc(t('sg_title'))}</h3></div><p class="hint">…</p></section>`; }
    if (c.gone) return `<section class="sjp-sec sh"><p class="hint">${esc(t('sg_err_nf'))}</p><button type="button" class="ghost small" data-sh="forget">${esc(t('sg_leave'))}</button></section>`;
    if (c.err && !c.group) return `<section class="sjp-sec sh"><div class="sjp-sh"><h3>${esc(t('sg_title'))}</h3></div><p class="hint">${esc(c.err)}</p></section>`;
    const my = (me() || {}).id, mine = i => i.user_id === my;
    const items = c.items.map(i => {
      const cp = S.sjCopies[i.id], tag = i.kind === 'deck' ? t('tab_cards') : i.kind === 'note' ? t('sj_k_note') : t('sg_link');
      const act = i.kind === 'link' ? `<a class="chip" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(t('sg_open'))}</a>`
        : mine(i) ? '' : cp ? `<small class="sh-follow">${esc(t('sg_follow'))}</small>` : `<button type="button" class="chip" data-shcopy="${esc(i.id)}">${esc(t('sg_copy'))}</button>`;
      return `<div class="sjp-row sh-row"><span class="sjp-tag k-${i.kind === 'link' ? 'link' : i.kind}">${esc(tag)}</span><span class="sh-it"><b>${esc(i.title)}</b><small>${esc(t('sg_by', { n: mine(i) ? t('sg_mine') : i.name || '?' }))} · ${esc(t('sg_updated', { d: ago(i.updated_at) }))}</small></span><span class="sh-act">${act}${mine(i) ? `<button type="button" class="icon-btn" data-shdel="${esc(i.id)}" aria-label="${esc(t('sg_remove'))}">✕</button>` : ''}</span></div>`;
    });
    const chs = c.chapters.map(h => {
      const meTaker = h.taker && h.taker === my;
      const right = !h.taker ? `<button type="button" class="chip" data-shtake="${esc(h.id)}">${esc(t('sg_take'))}</button>`
        : meTaker ? `<span class="sh-chb"><button type="button" class="chip ${h.progress === 50 ? 'on' : ''}" data-shprog="${esc(h.id)}" data-v="50">${esc(t('sg_doing'))}</button><button type="button" class="chip ${h.progress === 100 ? 'on' : ''}" data-shprog="${esc(h.id)}" data-v="100">${esc(t('sg_done'))}</button><button type="button" class="icon-btn" data-shfree="${esc(h.id)}" aria-label="${esc(t('sg_free'))}" title="${esc(t('sg_free'))}">✕</button></span>`
        : `<small>${esc(h.taker_name || '?')}</small>`;
      return `<div class="sjp-row sh-ch"><span class="sh-who" aria-hidden="true">${h.taker ? esc((h.taker_name || '?').charAt(0).toUpperCase()) : ''}</span><span class="sh-it"><b>${esc(h.title)}</b><i class="sh-bar"><em style="width:${h.progress}%"></em></i></span>${right}</div>`;
    });
    const subj = x, decks = ((S.study && S.study.decks) || []).filter(d => d.subject === subj.id), pages = ((S.notes && S.notes.pages) || []).filter(p => p.subject === subj.id);
    const shared = new Set(Object.values(S.sjPushed || {}).map(p => p.src));
    const chooser = picking === x.id ? `<div class="sh-pick"><b>${esc(t('sg_pick'))}</b>
        ${decks.length || pages.length ? `<div class="sh-pick-l">${decks.filter(d => !shared.has(d.id)).map(d => `<button type="button" class="chip" data-shput="deck:${d.id}">${esc(t('tab_cards'))} · ${esc(d.name)}</button>`).join('')}${pages.filter(p => !shared.has(p.id)).map(p => `<button type="button" class="chip" data-shput="note:${p.id}">${esc(t('sj_k_note'))} · ${esc(p.title || t('rm_untitled'))}</button>`).join('')}</div>` : `<p class="hint">${esc(t('sg_nothing'))}</p>`}
        <form class="sh-link" data-shlink="${x.id}" autocomplete="off"><input type="text" name="title" maxlength="120" placeholder="${esc(t('sg_link_title'))}" aria-label="${esc(t('sg_link_title'))}"><input type="url" name="url" maxlength="600" placeholder="${esc(t('sg_link_url'))}" aria-label="${esc(t('sg_link_url'))}" required><button type="submit" class="small">${esc(t('sg_send'))}</button></form></div>` : '';
    return `<section class="sjp-sec sh">
      <div class="sjp-sh"><h3>${esc(t('sg_title'))} <small>${esc(t('sg_code', { c: code }))} · ${esc(ML.tn('sg_members', c.members.length))}</small></h3><button type="button" class="ghost small" data-sh="copycode">${esc(t('sg_copy_code'))}</button></div>
      <div class="sjp-sh"><h3>${esc(t('sg_items'))}</h3><button type="button" class="ghost small" data-sh="pick" aria-expanded="${picking === x.id}">${esc(t('sg_add'))}</button></div>
      ${chooser}
      ${items.length ? `<div class="sjp-list">${items.join('')}</div>` : `<p class="hint sjp-hint">${esc(t('sg_none'))}</p>`}
      <div class="sjp-sh"><h3>${esc(t('sg_ch'))}</h3></div>
      ${chs.length ? `<div class="sjp-list">${chs.join('')}</div>` : `<p class="hint sjp-hint">${esc(t('sg_ch_d'))}</p>`}
      <form class="sjp-add" data-shch="${x.id}" autocomplete="off"><input type="text" maxlength="80" placeholder="${esc(t('sg_ch_ph'))}" aria-label="${esc(t('sg_ch_ph'))}"><button type="submit" class="small">${esc(t('sg_ch_add'))}</button></form>
      <button type="button" class="ghost small sh-leave" id="sh-leave-${x.id}">${esc(t('sg_leave'))}</button>
    </section>`;
  };
  ML.sharedJoinHtml = () => `<form class="g-card sh-join" id="sh-join" autocomplete="off"><label for="sh-join-in">${esc(t('sg_join'))}</label><div><input type="text" id="sh-join-in" maxlength="8" placeholder="${esc(t('sg_join_ph'))}" autocapitalize="characters"><button type="submit" class="small">${esc(t('sg_join_go'))}</button></div></form>`;

  const root = document.getElementById('subjects');
  const pageSid = () => { const b = root.querySelector('[data-sjtask]'); return b ? b.dataset.sjtask : null; };
  root.addEventListener('click', async e => {
    const b = e.target.closest('[data-sh], [data-shcopy], [data-shdel], [data-shtake], [data-shprog], [data-shfree], [data-shput]'); if (!b) return;
    const sid = pageSid(), code = sid && codeOf(sid), c = code && cache[code], d = b.dataset; if (!sid) return;
    if (d.sh === 'create') return create(sid);
    if (d.sh === 'forget') { delete S.sjShare[sid]; save(); return ML.renderSubjects(); }
    if (d.sh === 'copycode') { try { await navigator.clipboard.writeText(code); toast(t('sg_copied')); } catch (err) { toast(t('sg_code', { c: code })); } return; }
    if (d.sh === 'pick') { picking = picking === sid ? null : sid; return ML.renderSubjects(); }
    if (d.shput) { const [k, id] = d.shput.split(':'); picking = null; return shareItem(sid, k, id); }
    if (!c) return;
    if (d.shcopy) { const it = c.items.find(i => i.id === d.shcopy); if (it) copyItem(sid, it); return; }
    if (d.shdel) { try { await rest('/rest/v1/sj_items?id=eq.' + encodeURIComponent(d.shdel), { method: 'DELETE', prefer: 'return=minimal' }); delete S.sjPushed[d.shdel]; save(); } catch (err) { toast(errOf(err)); } return refresh(code); }
    if (d.shtake) {
      const h = c.chapters.find(x => x.id === d.shtake); if (!h) return;
      try { await chPatch(h.id, { taker: me().id, progress: 0 }); } catch (err) { toast(errOf(err)); return refresh(code); }
      S.tasks.push({ id: uid(), title: t('sg_ch_task', { c: h.title }), mins: 60, pri: 'med', done: false, created: Date.now(), subject: sid }); save(); ML.renderAll();
      toast(t('sg_taken')); return refresh(code);
    }
    if (d.shprog) { try { await chPatch(d.shprog, { progress: +d.v }); } catch (err) { toast(errOf(err)); } return refresh(code); }
    if (d.shfree) { try { await chPatch(d.shfree, { taker: null, progress: 0 }); } catch (err) { toast(errOf(err)); } return refresh(code); }
  });
  root.addEventListener('submit', async e => {
    const f = e.target;
    if (f.id === 'sh-join') { e.preventDefault(); e.stopImmediatePropagation(); join(f.querySelector('input').value); return; }
    if (f.dataset.shlink) { e.preventDefault(); e.stopImmediatePropagation(); picking = null; shareItem(f.dataset.shlink, 'link', null, { title: f.elements.title.value.trim(), url: f.elements.url.value.trim() }); return; }
    if (f.dataset.shch) {
      e.preventDefault(); e.stopImmediatePropagation();
      const sid = f.dataset.shch, code = codeOf(sid), inp = f.querySelector('input'), title = inp.value.trim(); if (!code || !title) return;
      const n = ((cache[code] || {}).chapters || []).length;
      try { await rest('/rest/v1/sj_chapters', { method: 'POST', body: { id: uid(), code, title: title.slice(0, 80), pos: n }, prefer: 'return=minimal' }); inp.value = ''; } catch (err) { toast(errOf(err)); }
      refresh(code);
    }
  }, true);
  // the armed Leave button (two taps) is bound after each render of the page
  new MutationObserver(() => {
    const sid = pageSid(), b = sid && document.getElementById('sh-leave-' + sid);
    if (b && !b.dataset.armedBound) { b.dataset.armedBound = '1'; ML.armedButton(b, 'sg_leave', () => leave(sid)); }
  }).observe(root, { childList: true, subtree: true });

  // While a shared subject's page is open, the group is read again every 30 s
  function poll() {
    clearInterval(pollT); pollT = null;
    const sid = S.tab === 'subjects' && pageSid(), code = sid && codeOf(sid);
    if (code && me()) pollT = setInterval(() => { if (document.hidden) return; const s2 = S.tab === 'subjects' && pageSid(); if (s2 && codeOf(s2) === code) refresh(code); else poll(); }, 30000);
  }
  on('tab', () => setTimeout(poll, 0)); on('render', () => { if (!pollT) setTimeout(poll, 0); });
  // a subject removed here leaves its group link behind: forget it
  on('started', () => { Object.keys(S.sjShare || {}).forEach(k => { if (!subjOf(k)) delete S.sjShare[k]; }); });
})();
