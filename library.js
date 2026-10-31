// Library (its own tab since 3.55, Premium): PDFs, photos and study sheets kept on this device, sorted with tags, and a reader to work on them without
// leaving the app. The list is one searchable list (PDF text included); a document opens with its notes and its flashcards: tabs on
// a phone, side by side with the timer from 900 px. Files live in IndexedDB (per account, never in S: they are far too large for
// localStorage and for the sync row), so they stay on the device they were added on.
// PDFs: pdf.js 3.11.174 (pdf.min.js and its worker ship with the app; only the artifact, which can't serve them, takes the CDN), else the browser's own viewer.
(() => {
  'use strict';
  const { S, t, esc, save, on, emit, toast, uid, $ } = ML;

  ML.addStrings({
    fr: {
      lb_add: 'Ajouter', lb_photo: 'Photo', lb_sheet: 'Fiche', lb_search: 'Chercher dans les titres, notes et PDF…', lb_all: 'Tout', lb_untagged: 'Sans étiquette', lb_any: 'Tous les types', lb_pdf: 'PDF', lb_images: 'Photos', lb_sheets: 'Fiches',
      lb_s_recent: 'Ajoutés récemment', lb_s_opened: 'Ouverts récemment', lb_s_name: 'Nom', lb_s_size: 'Taille', lb_resume: 'Reprendre', lb_page: 'page {n}', lb_pages: '{n} pages', lb_pages_one: '{n} page', lb_empty_h: 'Ta bibliothèque est vide', lb_empty: 'Ajoute un PDF, une photo de cours ou crée une fiche. Tu peux aussi déposer un fichier ici ou coller une image.',
      lb_none: 'Aucun document ne correspond.', lb_rename: 'Nom', lb_tags: 'Étiquettes', lb_tag_ph: 'Ajouter une étiquette', lb_download: 'Télécharger', lb_delete: 'Supprimer', lb_deleted: 'Document supprimé', lb_edit: 'Modifier', lb_done: 'Terminé',
      lb_added: '{n} document(s) ajouté(s)', lb_bad: 'Ce type de fichier n’est pas pris en charge : {name}', lb_cut: 'Fichier « {name} » trop long : seul le début a été gardé (environ 1000 pages).', lb_full: 'Plus assez de place sur cet appareil.', lb_err: 'La bibliothèque ne peut pas s’ouvrir ici (navigation privée ?).', lb_new_sheet: 'Nouvelle fiche', lb_used: '{used} utilisés sur cet appareil', lb_free: '{free} disponibles', lb_local: 'Les fichiers restent sur cet appareil. Garde une copie de ce qui compte : vider les données du navigateur les efface.',
      lb_hit: 'p. {n}', lb_today: 'aujourd’hui', lb_yest: 'hier', lb_worked: '{t} de travail',
      rd_close: 'Fermer', rd_doc: 'Document', rd_notes: 'Notes', rd_cards: 'Cartes', rd_sheet: 'Fiche', rd_prev: 'Page précédente', rd_next: 'Page suivante', rd_of: 'sur {n}', rd_zoom_in: 'Agrandir', rd_zoom_out: 'Réduire', rd_fit: 'Ajuster', rd_flash: 'Flashcard', rd_loading: 'Ouverture…', rd_load_err: 'Ce document ne s’ouvre pas ici.', rd_open_out: 'Ouvrir dans un onglet',
      rd_native: 'Lecteur du navigateur : la sélection, le suivi des pages et la recherche dans le PDF ne sont pas disponibles.',
      rd_notes_ph: 'Tes notes sur ce document. Elles s’enregistrent toutes seules.', rd_mark: 'Marquer la page', rd_to_nb: 'Envoyer au Carnet', rd_sent: 'Notes envoyées au Carnet', rd_sheet_ph: 'Écris ta fiche ici. Elle s’enregistre toute seule.',
      rd_card_front: 'Question', rd_card_back: 'Réponse', rd_card_add: 'Ajouter la carte', rd_card_none: 'Pas encore de carte. Sélectionne du texte puis touche Flashcard, ou écris-en une ici.', rd_review: 'Réviser', rd_due: '{n} à revoir', rd_card_added: 'Carte ajoutée à « {deck} »', rd_lockin: 'Lock in sur ce document', rd_pause: 'Pause', rd_resume: 'Reprendre', rd_resize: 'Largeur des panneaux',
    },
    en: {
      lb_add: 'Add', lb_photo: 'Photo', lb_sheet: 'Sheet', lb_search: 'Search titles, notes and PDFs…', lb_all: 'All', lb_untagged: 'No tag', lb_any: 'All types', lb_pdf: 'PDF', lb_images: 'Photos', lb_sheets: 'Sheets',
      lb_s_recent: 'Recently added', lb_s_opened: 'Recently opened', lb_s_name: 'Name', lb_s_size: 'Size', lb_resume: 'Resume', lb_page: 'page {n}', lb_pages: '{n} pages', lb_pages_one: '{n} page', lb_empty_h: 'Your library is empty', lb_empty: 'Add a PDF or a photo of your notes, or write a sheet. You can also drop a file here or paste an image.',
      lb_none: 'No document matches.', lb_rename: 'Name', lb_tags: 'Tags', lb_tag_ph: 'Add a tag', lb_download: 'Download', lb_delete: 'Delete', lb_deleted: 'Document deleted', lb_edit: 'Edit', lb_done: 'Done',
      lb_added: '{n} document(s) added', lb_bad: "This file type isn't supported: {name}", lb_cut: '"{name}" is too long: only the start was kept (about 1000 pages).', lb_full: 'Not enough space left on this device.', lb_err: "The library can't open here (private browsing?).", lb_new_sheet: 'New sheet', lb_used: '{used} used on this device', lb_free: '{free} available', lb_local: 'Files stay on this device. Keep a copy of what matters: clearing browser data erases them.',
      lb_hit: 'p. {n}', lb_today: 'today', lb_yest: 'yesterday', lb_worked: '{t} of work',
      rd_close: 'Close', rd_doc: 'Document', rd_notes: 'Notes', rd_cards: 'Cards', rd_sheet: 'Sheet', rd_prev: 'Previous page', rd_next: 'Next page', rd_of: 'of {n}', rd_zoom_in: 'Zoom in', rd_zoom_out: 'Zoom out', rd_fit: 'Fit', rd_flash: 'Flashcard', rd_loading: 'Opening…', rd_load_err: "This document can't open here.", rd_open_out: 'Open in a tab',
      rd_native: "Browser viewer: text selection, page tracking and PDF search aren't available.",
      rd_notes_ph: 'Your notes on this document. They save by themselves.', rd_mark: 'Mark the page', rd_to_nb: 'Send to Notebook', rd_sent: 'Notes sent to the Notebook', rd_sheet_ph: 'Write your sheet here. It saves by itself.',
      rd_card_front: 'Question', rd_card_back: 'Answer', rd_card_add: 'Add card', rd_card_none: 'No cards yet. Select text then tap Flashcard, or write one here.', rd_review: 'Review', rd_due: '{n} due', rd_card_added: 'Card added to "{deck}"', rd_lockin: 'Lock in on this document', rd_pause: 'Pause', rd_resume: 'Resume', rd_resize: 'Panel width',
    },
  });
  ML.defaults(() => ({ lib: { sort: 'recent', kind: '', tag: '', split: .62 } }));
  const L = () => S.lib;

  /* ---------- Storage: IndexedDB, one database per account ---------- */
  let dbP = null, dbKey = '', docs = null, texts = null, loadErr = false;
  function db() {
    const k = 'mli-library:' + ML.storageKey();
    if (dbP && dbKey === k) return dbP;
    dbKey = k; docs = null; texts = null;
    dbP = new Promise((res, rej) => {
      const r = indexedDB.open(k, 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('docs', { keyPath: 'id' }); d.createObjectStore('blobs'); d.createObjectStore('text'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    });
    dbP.catch(() => { dbP = null; });
    return dbP;
  }
  const idb = async (store, mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction(store, mode), r = fn(tx.objectStore(store));
      tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
    });
  };
  const putDoc = d => idb('docs', 'readwrite', s => s.put(d));
  const getBlob = id => idb('blobs', 'readonly', s => s.get(id));
  async function load() {
    if (docs) return docs;
    try { docs = (await idb('docs', 'readonly', s => s.getAll())) || []; loadErr = false; }
    catch (e) { docs = null; loadErr = true; }
    return docs;
  }
  let savers = {};
  const saveDocSoon = d => { clearTimeout(savers[d.id]); savers[d.id] = setTimeout(() => { delete savers[d.id]; putDoc(d).catch(() => {}); }, 400); };
  const flushDocs = () => { if (!docs) return; Object.keys(savers).forEach(id => { clearTimeout(savers[id]); delete savers[id]; const d = docs.find(x => x.id === id); if (d) putDoc(d).catch(() => {}); }); };
  addEventListener('pagehide', flushDocs);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushDocs(); });

  /* ---------- pdf.js, loaded the first time it's needed ---------- */
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  let pdfP = null;
  const addScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  function pdfLib() {
    if (pdfP) return pdfP;
    pdfP = (async () => {
      let base = '';
      try { await addScript('pdf.min.js'); } catch (e) { base = CDN; await addScript(CDN + 'pdf.min.js'); }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js';
      // Asian scripts and fonts not embedded in the file come from the CDN when online; a PDF still opens without them
      return { lib: window.pdfjsLib, opts: { cMapUrl: CDN + 'cmaps/', cMapPacked: true, standardFontDataUrl: CDN + 'standard_fonts/' } };
    })();
    pdfP.catch(() => { pdfP = null; });
    return pdfP;
  }
  // isEvalSupported off: a crafted PDF must never run code through a font program
  const openPdf = async blob => { const { lib, opts } = await pdfLib(); return lib.getDocument(Object.assign({ data: await blob.arrayBuffer(), isEvalSupported: false }, opts)).promise; };

  /* ---------- Adding documents ---------- */
  const kindOf = f => {
    const n = (f.name || '').toLowerCase(), m = f.type || '';
    if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
    if (m.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|bmp|avif)$/.test(n)) return 'image';
    if (m === 'text/plain' || m === 'text/markdown' || /\.(txt|md)$/.test(n)) return 'sheet';
    return null;
  };
  const thumbFrom = (src, w, h) => { const k = 112 / Math.max(w, h), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .72); };
  const imageThumb = blob => new Promise(res => { const u = URL.createObjectURL(blob), i = new Image(); i.onload = () => { let r = ''; try { r = thumbFrom(i, i.naturalWidth, i.naturalHeight); } catch (e) {} URL.revokeObjectURL(u); res(r); }; i.onerror = () => { URL.revokeObjectURL(u); res(''); }; i.src = u; });
  // In the background: page count, thumbnail and searchable text of a PDF, one at a time
  let enrichQ = [], enriching = false;
  function enrich(d) { enrichQ.push(d); if (!enriching) enrichNext(); }
  async function enrichNext() {
    const d = enrichQ.shift(); if (!d) { enriching = false; return; }
    enriching = true;
    try {
      const blob = await getBlob(d.id), pdf = await openPdf(blob);
      d.pages = pdf.numPages;
      const p1 = await pdf.getPage(1), vp0 = p1.getViewport({ scale: 1 }), sc = 224 / Math.max(vp0.width, vp0.height), vp = p1.getViewport({ scale: sc });
      const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      await p1.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      d.thumb = thumbFrom(c, c.width, c.height);
      const pagesText = []; let total = 0;
      for (let i = 1; i <= pdf.numPages && total < 1500000; i++) {
        const pg = await pdf.getPage(i), tc = await pg.getTextContent(), s = tc.items.map(x => x.str).join(' ').replace(/\s+/g, ' ');
        pagesText.push(s); total += s.length; pg.cleanup();
      }
      await idb('text', 'readwrite', st => st.put(pagesText, d.id));
      if (texts) texts[d.id] = pagesText;
      pdf.destroy();
    } catch (e) { d.noPdfjs = true; }
    d.enriched = true;
    await putDoc(d).catch(() => {});
    refresh();
    enrichNext();
  }
  const SHEET_MAX = 2e6; // about 1000 pages: a sheet opens in a text box, PDFs and photos have no limit but the device's space
  async function addFiles(files) {
    files = [...files]; if (!files.length) return;
    if (!(await load())) { toast(t('lb_err')); return; }
    let n = 0;
    for (const f of files) {
      const kind = kindOf(f);
      if (!kind) { toast(t('lb_bad', { name: f.name || '?' }), { ms: 5000 }); continue; }
      const d = { id: uid(), name: (f.name || t('lb_photo')).replace(/\.\w{1,5}$/, '').slice(0, 120) || t('lb_photo'), kind, mime: f.type || (kind === 'pdf' ? 'application/pdf' : ''), size: f.size, tags: L().tag && L().tag !== '-' ? [L().tag] : [], created: Date.now(), opened: 0, page: 1, zoom: 1, notes: '', deck: null, mins: 0, thumb: '', text: '' };
      try {
        if (kind === 'sheet') {
          const txt = await ML.readText(f);
          d.text = txt.slice(0, SHEET_MAX);
          if (txt.length > SHEET_MAX) toast(t('lb_cut', { name: d.name }), { ms: 6000 });
        } else { await idb('blobs', 'readwrite', s => s.put(f, d.id)); if (kind === 'image') d.thumb = await imageThumb(f); }
        await putDoc(d); docs.push(d); n++;
        if (kind === 'pdf') enrich(d);
      } catch (e) {
        if (e && e.name === 'NotText') { toast(t('lb_bad', { name: f.name || '?' }), { ms: 5000 }); continue; }
        toast(t(e && e.name === 'QuotaExceededError' ? 'lb_full' : 'lb_err'), { ms: 5000 }); break;
      }
    }
    if (n) { toast(t('lb_added', { n })); if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); }
    refresh();
  }
  async function newSheet() {
    if (!(await load())) { toast(t('lb_err')); return; }
    const d = { id: uid(), name: t('lb_new_sheet'), kind: 'sheet', mime: 'text/plain', size: 0, tags: L().tag && L().tag !== '-' ? [L().tag] : [], created: Date.now(), opened: 0, page: 1, zoom: 1, notes: '', deck: null, mins: 0, thumb: '', text: '' };
    try { await putDoc(d); docs.push(d); openReader(d.id); } catch (e) { toast(t('lb_err')); }
  }
  async function removeDoc(id) {
    clearTimeout(savers[id]); delete savers[id];
    enrichQ = enrichQ.filter(x => x.id !== id);
    try { await Promise.all([idb('docs', 'readwrite', s => s.delete(id)), idb('blobs', 'readwrite', s => s.delete(id)), idb('text', 'readwrite', s => s.delete(id))]); } catch (e) {}
    docs = docs.filter(x => x.id !== id); if (texts) delete texts[id];
    if (editing === id) editing = null;
    refresh(); toast(t('lb_deleted'));
  }
  async function downloadDoc(d) {
    let blob;
    if (d.kind === 'sheet') blob = new Blob([d.text || ''], { type: 'text/plain' }); else blob = await getBlob(d.id);
    if (!blob) return;
    const u = URL.createObjectURL(blob), a = document.createElement('a'), ext = d.kind === 'sheet' ? '.txt' : d.kind === 'pdf' ? '.pdf' : '';
    a.href = u; a.download = d.name + ext; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 30000);
  }

  /* ---------- The list ---------- */
  let host = null, query = '', editing = null, armed = null;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const fmtSize = b => { const u = S.lang === 'en' ? ['B', 'KB', 'MB', 'GB'] : ['o', 'Ko', 'Mo', 'Go']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return (i > 1 ? (+b.toFixed(1)).toLocaleString(ML.locale()) : Math.round(b)) + ' ' + u[i]; };
  const fmtDay = ms => { const d = new Date(ms), td = ML.today(), k = ML.dayKey(d); if (k === td) return t('lb_today'); if (k === ML.addDays(td, -1)) return t('lb_yest'); return d.toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }); };
  const metaOf = d => [d.kind === 'pdf' ? (d.pages ? ML.tn('lb_pages', d.pages) : t('lb_pdf')) : d.kind === 'image' ? t('lb_photo') : t('lb_sheet'), fmtDay(d.opened || d.created), d.mins ? t('lb_worked', { t: ML.fmtMins(d.mins) }) : ''].filter(Boolean).join(' · ');
  const allTags = () => { const m = new Map(); (docs || []).forEach(d => d.tags.forEach(x => m.set(x, (m.get(x) || 0) + 1))); return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); };
  async function loadTexts() {
    if (texts) return texts;
    const out = {}, keys = docs.filter(d => d.kind === 'pdf').map(d => d.id);
    for (const k of keys) { try { const v = await idb('text', 'readonly', s => s.get(k)); if (v) out[k] = v; } catch (e) {} }
    return (texts = out);
  }
  const snippet = (txt, i, len) => (i > 30 ? '…' : '') + txt.slice(Math.max(0, i - 30), i + len + 50).trim() + '…';
  // Results: the name and tags first, then what's inside (notes, sheet, PDF pages)
  function matches() {
    const q = norm(query.trim()), f = L();
    const out = [];
    (docs || []).forEach(d => {
      if (f.kind && d.kind !== f.kind) return;
      if (f.tag === '-' ? d.tags.length : f.tag && !d.tags.includes(f.tag)) return;
      if (!q) { out.push({ d }); return; }
      if (norm(d.name).includes(q) || d.tags.some(x => norm(x).includes(q))) { out.push({ d, rank: 0 }); return; }
      for (const src of [d.notes, d.text]) { const i = norm(src).indexOf(q); if (src && i >= 0) { out.push({ d, rank: 1, hit: snippet(src, i, q.length) }); return; } }
      const pages = texts && texts[d.id];
      if (pages) for (let p = 0; p < pages.length; p++) { const i = norm(pages[p]).indexOf(q); if (i >= 0) { out.push({ d, rank: 2, hit: snippet(pages[p], i, q.length), page: p + 1 }); return; } }
    });
    if (q) return out.sort((a, b) => a.rank - b.rank);
    const by = { recent: (a, b) => b.d.created - a.d.created, opened: (a, b) => (b.d.opened || 0) - (a.d.opened || 0) || b.d.created - a.d.created, name: (a, b) => a.d.name.localeCompare(b.d.name, ML.locale(), { numeric: true }), size: (a, b) => b.d.size - a.d.size };
    return out.sort(by[f.sort] || by.recent);
  }
  const tileHtml = d => (d.thumb ? `<img class="lb-thumb" src="${esc(d.thumb)}" alt="">` : `<span class="lb-thumb lb-${d.kind}" aria-hidden="true">${d.kind === 'pdf' ? 'PDF' : d.kind === 'sheet' ? 'Aa' : ''}</span>`);
  function rowHtml(m) {
    const d = m.d;
    if (editing === d.id) return `<li class="lb-row editing">${tileHtml(d)}<div class="lb-edit">
        <label><span>${esc(t('lb_rename'))}</span><input type="text" data-lb-name="${d.id}" maxlength="120" value="${esc(d.name)}"></label>
        <div class="lb-tagedit"><span class="lb-lbl">${esc(t('lb_tags'))}</span>${d.tags.map(x => `<button type="button" class="lb-tag on" data-lb-untag="${esc(x)}">${esc(x)} ×</button>`).join('')}
          ${allTags().filter(([x]) => !d.tags.includes(x)).slice(0, 8).map(([x]) => `<button type="button" class="lb-tag" data-lb-addtag="${esc(x)}">+ ${esc(x)}</button>`).join('')}
          <form class="lb-tagform" data-lb-tagform="${d.id}" autocomplete="off"><input type="text" maxlength="30" placeholder="${esc(t('lb_tag_ph'))}" aria-label="${esc(t('lb_tag_ph'))}"></form></div>
        <div class="lb-editacts"><button type="button" class="small ghost danger" data-lb-del="${d.id}">${esc(t(armed === d.id ? 'tap_again' : 'lb_delete'))}</button>
          ${ML.CAN_DOWNLOAD ? `<button type="button" class="small ghost" data-lb-dl="${d.id}">${esc(t('lb_download'))}</button>` : ''}
          <button type="button" class="small primary" data-lb-editdone>${esc(t('lb_done'))}</button></div></div></li>`;
    return `<li class="lb-row"><button type="button" class="lb-open" data-lb-open="${d.id}"${m.page ? ` data-lb-page="${m.page}"` : ''}>${tileHtml(d)}
        <span class="lb-tx"><b>${esc(d.name)}</b><small>${esc(metaOf(d))}</small>${m.hit ? `<em>${m.page ? esc(t('lb_hit', { n: m.page })) + ' · ' : ''}${esc(m.hit)}</em>` : ''}</span></button>
      ${d.tags.length ? `<span class="lb-rowtags">${d.tags.slice(0, 2).map(x => `<i class="lb-tag">${esc(x)}</i>`).join('')}${d.tags.length > 2 ? `<i class="lb-tag">+${d.tags.length - 2}</i>` : ''}</span>` : ''}
      <button type="button" class="icon-btn lb-more" data-lb-edit="${d.id}" aria-label="${esc(t('lb_edit'))} : ${esc(d.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></li>`;
  }
  function listHtml() {
    const ms = matches(), tags = allTags(), f = L(), last = !query && !f.tag && !f.kind ? (docs || []).filter(d => d.opened).sort((a, b) => b.opened - a.opened)[0] : null;
    return `${last ? `<button type="button" class="lb-resume" data-lb-open="${last.id}">${tileHtml(last)}<span><small>${esc(t('lb_resume'))}</small><b>${esc(last.name)}</b>${last.kind === 'pdf' && last.page > 1 ? `<small>${esc(t('lb_page', { n: last.page }))}</small>` : ''}</span></button>` : ''}
      ${tags.length ? `<div class="lb-chips" role="group" aria-label="${esc(t('lb_tags'))}"><button type="button" class="lb-chip" data-lb-tag="" aria-pressed="${!f.tag}">${esc(t('lb_all'))} <i>${(docs || []).length}</i></button>${tags.map(([x, n]) => `<button type="button" class="lb-chip" data-lb-tag="${esc(x)}" aria-pressed="${f.tag === x}">${esc(x)} <i>${n}</i></button>`).join('')}${(docs || []).some(d => !d.tags.length) ? `<button type="button" class="lb-chip" data-lb-tag="-" aria-pressed="${f.tag === '-'}">${esc(t('lb_untagged'))}</button>` : ''}</div>` : ''}
      ${ms.length ? `<ul class="lb-list">${ms.map(rowHtml).join('')}</ul>` : `<p class="hint">${esc(t('lb_none'))}</p>`}`;
  }
  function mainHtml() {
    if (loadErr) return `<p class="hint fi-err">${esc(t('lb_err'))}</p>`;
    if (!docs) return '<div class="sr-loading"><i></i><i></i><i></i></div>';
    const f = L();
    return `<div class="lb-bar">
        <label class="primary lb-addbtn"><input type="file" id="lb-file" multiple accept="application/pdf,.pdf,image/*,.txt,.md,text/plain,text/markdown"><span>+ ${esc(t('lb_add'))}</span></label>
        <label class="lb-addbtn lb-camera"><input type="file" id="lb-cam" accept="image/*" capture="environment"><span>${esc(t('lb_photo'))}</span></label>
        <button type="button" class="small" data-lb-sheet>${esc(t('lb_sheet'))}</button>
      </div>
      ${docs.length ? `<input type="search" id="lb-q" maxlength="80" placeholder="${esc(t('lb_search'))}" value="${esc(query)}" autocomplete="off" aria-label="${esc(t('lb_search'))}">
      <div class="lb-filters">
        <select id="lb-kind" aria-label="${esc(t('lb_any'))}">${[['', 'lb_any'], ['pdf', 'lb_pdf'], ['image', 'lb_images'], ['sheet', 'lb_sheets']].map(([v, k]) => `<option value="${v}" ${f.kind === v ? 'selected' : ''}>${esc(t(k))}</option>`).join('')}</select>
        <select id="lb-sort" aria-label="${esc(t('lb_s_recent'))}">${['recent', 'opened', 'name', 'size'].map(v => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${esc(t('lb_s_' + v))}</option>`).join('')}</select>
      </div>
      <div id="lb-results">${listHtml()}</div>
      <p class="hint lb-foot" id="lb-usage">${esc(t('lb_local'))}</p>` : `<div class="lb-empty"><h3>${esc(t('lb_empty_h'))}</h3><p class="hint">${esc(t('lb_empty'))}</p></div>`}`;
  }
  async function usage() {
    const el = $('lb-usage'); if (!el || !navigator.storage || !navigator.storage.estimate) return;
    try { const u = await navigator.storage.estimate(); if ($('lb-usage') === el) el.textContent = `${t('lb_used', { used: fmtSize(u.usage || 0) })} · ${t('lb_free', { free: fmtSize(Math.max(0, (u.quota || 0) - (u.usage || 0))) })}. ${t('lb_local')}`; } catch (e) {}
  }
  function refresh() {
    if (!host || !host.isConnected) return;
    const box = $('lb-results');
    if (box && docs && docs.length) box.innerHTML = listHtml(); else { host.innerHTML = mainHtml(); usage(); }
  }
  function bind(el) {
    host = el; el.innerHTML = mainHtml();
    load().then(() => { if (host === el && el.isConnected) { el.innerHTML = mainHtml(); usage(); } });
  }
  ML.addStrings({ fr: { tab_lib: 'Bibliothèque', nav_lib: 'Biblio' }, en: { tab_lib: 'Library', nav_lib: 'Library' } });
  const tab = $('library');
  function renderTab() {
    const lock = $('lib-lock'), ok = ML.isPremium();
    if (lock) lock.style.display = ok ? 'none' : '';
    if (ok) bind(tab); else { host = null; tab.innerHTML = ML.studyLockedHtml(); }
  }
  on('tab', name => { if (name === 'lib') renderTab(); });
  on('premium', () => { if (S.tab === 'lib') renderTab(); else { const l = $('lib-lock'); if (l) l.style.display = ML.isPremium() ? 'none' : ''; } });
  on('started', () => { const l = $('lib-lock'); if (l) l.style.display = ML.isPremium() ? 'none' : ''; if (S.tab === 'lib') renderTab(); });
  ML.Library = { bind };

  /* ---------- List events (delegated on the Library tab, which keeps its node across renders) ---------- */
  const inLib = () => host && host.isConnected;
  tab.addEventListener('click', e => {
    if (!inLib()) return;
    const b = e.target.closest('button'); if (!b) return;
    const d = id => docs.find(x => x.id === id);
    if (b.dataset.lbOpen) { openReader(b.dataset.lbOpen, +b.dataset.lbPage || 0); return; }
    if (b.hasAttribute('data-lb-sheet')) { newSheet(); return; }
    if (b.dataset.lbTag != null) { L().tag = b.dataset.lbTag; save(); refresh(); return; }
    if (b.dataset.lbEdit) { editing = editing === b.dataset.lbEdit ? null : b.dataset.lbEdit; armed = null; refresh(); return; }
    if (b.hasAttribute('data-lb-editdone')) { editing = null; refresh(); return; }
    if (b.dataset.lbDl) { const x = d(b.dataset.lbDl); if (x) downloadDoc(x); return; }
    if (b.dataset.lbDel) {
      if (armed !== b.dataset.lbDel) { armed = b.dataset.lbDel; b.textContent = t('tap_again'); setTimeout(() => { armed = null; }, 3000); return; }
      armed = null; removeDoc(b.dataset.lbDel); return;
    }
    const cur = editing && d(editing); if (!cur) return;
    if (b.dataset.lbUntag) { cur.tags = cur.tags.filter(x => x !== b.dataset.lbUntag); putDoc(cur).catch(() => {}); if (L().tag === b.dataset.lbUntag && !docs.some(x => x.tags.includes(L().tag))) { L().tag = ''; save(); } refresh(); return; }
    if (b.dataset.lbAddtag) { cur.tags.push(b.dataset.lbAddtag); putDoc(cur).catch(() => {}); refresh(); }
  });
  tab.addEventListener('submit', e => {
    const f = e.target; if (!f.dataset || !f.dataset.lbTagform) return;
    e.preventDefault(); e.stopPropagation();
    const cur = docs.find(x => x.id === f.dataset.lbTagform), v = f.querySelector('input').value.trim().slice(0, 30);
    if (cur && v && !cur.tags.some(x => norm(x) === norm(v))) { cur.tags.push(v); putDoc(cur).catch(() => {}); }
    refresh();
    const again = tab.querySelector('.lb-tagform input'); if (again) again.focus();
  }, true);
  let qT = 0;
  tab.addEventListener('input', e => {
    if (!inLib()) return;
    if (e.target.id === 'lb-q') {
      query = e.target.value; clearTimeout(qT);
      qT = setTimeout(async () => { if (query.trim().length > 1) await loadTexts(); const box = $('lb-results'); if (box) box.innerHTML = listHtml(); }, 160);
    } else if (e.target.dataset.lbName) { const d = docs.find(x => x.id === e.target.dataset.lbName); if (d) { d.name = e.target.value.trim() || d.name; saveDocSoon(d); } }
  });
  tab.addEventListener('change', e => {
    if (!inLib()) return;
    if (e.target.id === 'lb-file' || e.target.id === 'lb-cam') { addFiles(e.target.files); e.target.value = ''; }
    else if (e.target.id === 'lb-kind') { L().kind = e.target.value; save(); refresh(); }
    else if (e.target.id === 'lb-sort') { L().sort = e.target.value; save(); refresh(); }
  });
  tab.addEventListener('dragover', e => { if (inLib() && [...(e.dataTransfer.types || [])].includes('Files')) { e.preventDefault(); host.classList.add('lb-over'); } });
  tab.addEventListener('dragleave', e => { if (inLib() && !host.contains(e.relatedTarget)) host.classList.remove('lb-over'); });
  tab.addEventListener('drop', e => { if (inLib() && e.dataTransfer.files.length) { e.preventDefault(); host.classList.remove('lb-over'); addFiles(e.dataTransfer.files); } });
  addEventListener('paste', e => {
    if (!inLib() || cur || S.tab !== 'lib' || ML.isTyping(e)) return;
    const files = [...((e.clipboardData && e.clipboardData.files) || [])]; if (files.length) { e.preventDefault(); addFiles(files); }
  });

  /* ---------- The reader ---------- */
  const rd = document.createElement('div');
  rd.className = 'rd'; rd.id = 'reader'; rd.hidden = true; rd.setAttribute('role', 'dialog'); rd.setAttribute('aria-modal', 'true');
  document.body.appendChild(rd);
  const htmlEl = document.documentElement, ICO = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const wide = () => innerWidth >= 900;
  let cur = null, pane = 'doc', side = 'notes', release = null, from = null, url = null, pdfDoc = null, pdfMode = '', lastSel = '', obs = null, pageObs = null, zoomBase = 1, cardDraft = null, renderTok = 0;
  const isSheet = () => cur && cur.kind === 'sheet';

  async function openReader(id, page) {
    const d = (docs || []).find(x => x.id === id); if (!d) return;
    if (cur) closeReader(true);
    cur = d; pane = 'doc'; side = 'notes'; lastSel = ''; cardDraft = null;
    if (page) d.page = page;
    d.opened = Date.now(); saveDocSoon(d);
    from = document.activeElement;
    rd.hidden = false; htmlEl.classList.add('rd-on', 'app-covered');
    release = ML.backClose(() => { release = null; closeReader(); });
    renderReader();
    addEventListener('keydown', onKey, true);
    await mountDoc();
  }
  function closeReader(silent) {
    if (!cur) return;
    saveDocSoon(cur); flushDocs();
    teardownDoc();
    cur = null; rd.hidden = true; rd.innerHTML = ''; htmlEl.classList.remove('rd-on', 'app-covered');
    removeEventListener('keydown', onKey, true);
    if (release) release(); release = null;
    if (from && from.isConnected && !silent) from.focus({ preventScroll: true }); from = null;
    if (!silent) refresh();
  }
  function teardownDoc() {
    renderTok++;
    if (obs) obs.disconnect(); if (pageObs) pageObs.disconnect(); obs = pageObs = null;
    if (pdfDoc) { try { pdfDoc.destroy(); } catch (e) {} pdfDoc = null; }
    if (url) { URL.revokeObjectURL(url); url = null; }
    pdfMode = '';
  }
  const timerHtml = () => {
    const run = ML.running && ML.running(), rem = ML.remainingNow ? ML.remainingNow() : 0, started = run || rem < (S.total || 0) - .5;
    return `<b class="rd-clock" id="rd-clock">${esc(($('clock') || {}).textContent || '')}</b><button type="button" class="small ${run ? 'ghost' : 'primary'}" data-rd-timer>${esc(run ? t('rd_pause') : started ? t('rd_resume') : wide() ? t('rd_lockin') : t('lock_in'))}</button>`;
  };
  const refreshTimer = () => { if (!cur) return; rd.querySelectorAll('.rd-timer').forEach(x => { x.innerHTML = timerHtml(); }); };
  on('tick', refreshTimer); on('timer', refreshTimer);
  on('session', s => { if (cur && s && s.mins) { cur.mins = (cur.mins || 0) + s.mins; saveDocSoon(cur); refreshTimer(); } });

  function renderReader() {
    const d = cur, W = wide(), sheet = isSheet();
    const tabs = sheet ? [['doc', 'rd_sheet'], ['cards', 'rd_cards']] : [['doc', 'rd_doc'], ['notes', 'rd_notes'], ['cards', 'rd_cards']];
    const sides = sheet ? [['cards', 'rd_cards']] : [['notes', 'rd_notes'], ['cards', 'rd_cards']];
    if (sheet) side = 'cards';
    rd.classList.toggle('wide', W);
    rd.style.setProperty('--rd-split', (L().split || .62));
    rd.innerHTML = `<header class="rd-top">
        <button type="button" class="ghost icon-only" data-rd-close aria-label="${esc(t('rd_close'))}">${ICO('M15 5l-7 7 7 7')}</button>
        <input type="text" class="rd-title" id="rd-name" maxlength="120" value="${esc(d.name)}" aria-label="${esc(t('lb_rename'))}">
        <div class="rd-tools" id="rd-tools">${toolsHtml()}</div>
        ${W ? '' : `<div class="rd-timer rd-timer-mini">${timerHtml()}</div>`}
      </header>
      ${W ? '' : `<div class="seg-toggle rd-seg" role="group">${tabs.map(([k, l]) => `<button type="button" data-rd-pane="${k}" aria-pressed="${pane === k}">${esc(t(l))}</button>`).join('')}</div>`}
      <div class="rd-body">
        <section class="rd-doc" id="rd-doc" ${!W && pane !== 'doc' ? 'hidden' : ''}></section>
        ${W ? `<div class="rd-split" id="rd-split" role="separator" aria-orientation="vertical" aria-label="${esc(t('rd_resize'))}" tabindex="0"></div>` : ''}
        <aside class="rd-side" ${!W && pane === 'doc' ? 'hidden' : ''}>
          ${W ? `<div class="rd-timer rd-timer-big">${timerHtml()}</div>${sides.length > 1 ? `<div class="seg-toggle rd-seg" role="group">${sides.map(([k, l]) => `<button type="button" data-rd-side="${k}" aria-pressed="${side === k}">${esc(t(l))}</button>`).join('')}</div>` : ''}` : ''}
          <div class="rd-sidebody" id="rd-sidebody">${sideHtml(W ? side : pane)}</div>
        </aside>
      </div>
      <button type="button" class="primary rd-flash" id="rd-flash" data-rd-flash hidden>${esc(t('rd_flash'))}</button>`;
  }
  function toolsHtml() {
    const d = cur; if (isSheet()) return '';
    const pdf = d.kind === 'pdf' && pdfMode === 'js';
    return `${pdf ? `<button type="button" class="ghost icon-only" data-rd-go="-1" aria-label="${esc(t('rd_prev'))}">${ICO('M6 15l6-6 6 6')}</button>
        <span class="rd-pageno"><input type="text" inputmode="numeric" id="rd-page" value="${d.page || 1}" aria-label="${esc(t('rd_doc'))}"><small>${esc(t('rd_of', { n: pdfDoc ? pdfDoc.numPages : '' }))}</small></span>
        <button type="button" class="ghost icon-only" data-rd-go="1" aria-label="${esc(t('rd_next'))}">${ICO('M6 9l6 6 6-6')}</button>` : ''}
      ${pdf || d.kind === 'image' ? `<button type="button" class="ghost icon-only" data-rd-zoom="-1" aria-label="${esc(t('rd_zoom_out'))}">${ICO('M5 12h14')}</button>
        <button type="button" class="ghost rd-fit" data-rd-zoom="0">${Math.round((d.zoom || 1) * 100)} %</button>
        <button type="button" class="ghost icon-only" data-rd-zoom="1" aria-label="${esc(t('rd_zoom_in'))}">${ICO('M12 5v14M5 12h14')}</button>` : ''}`;
  }
  const refreshTools = () => { const el = $('rd-tools'); if (el) el.innerHTML = toolsHtml(); };

  /* ---------- Document pane ---------- */
  async function mountDoc() {
    const box = $('rd-doc'), d = cur; if (!box || !d) return;
    if (d.kind === 'sheet') {
      box.innerHTML = `<textarea id="rd-sheet" class="rd-sheet" spellcheck="true" placeholder="${esc(t('rd_sheet_ph'))}">${esc(d.text || '')}</textarea>`;
      return;
    }
    box.innerHTML = `<div class="rd-msg">${esc(t('rd_loading'))}</div>`;
    let blob = null;
    try { blob = await getBlob(d.id); } catch (e) {}
    if (cur !== d) return;
    if (!blob) { box.innerHTML = `<div class="rd-msg">${esc(t('rd_load_err'))}</div>`; return; }
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    if (d.kind === 'image') {
      box.innerHTML = `<div class="rd-scroll rd-imgwrap" id="rd-scroll"><img id="rd-img" src="${url}" alt="${esc(d.name)}"></div>`;
      const img = $('rd-img');
      img.onerror = () => { box.innerHTML = fallbackHtml(); };
      applyImageZoom(); refreshTools();
      return;
    }
    const tok = ++renderTok;
    try {
      const pdf = await openPdf(blob);
      if (cur !== d || tok !== renderTok) { pdf.destroy(); return; }
      pdfDoc = pdf; pdfMode = 'js';
      if (d.pages !== pdf.numPages) { d.pages = pdf.numPages; saveDocSoon(d); }
      await layoutPdf(tok);
      refreshTools();
    } catch (e) {
      if (cur !== d) return;
      pdfMode = 'native';
      box.innerHTML = `<p class="rd-note">${esc(t('rd_native'))}</p><iframe class="rd-native" title="${esc(d.name)}" src="${url}#page=${d.page || 1}"></iframe>${fallbackHtml(true)}`;
      refreshTools();
    }
  }
  const fallbackHtml = small => `<div class="${small ? 'rd-out' : 'rd-msg'}">${small ? '' : `<p>${esc(t('rd_load_err'))}</p>`}<a class="small-link" href="${url}" target="_blank" rel="noopener">${esc(t('rd_open_out'))} ↗</a></div>`;
  function applyImageZoom() { const img = $('rd-img'), z = (cur && cur.zoom) || 1; if (img) img.style.width = (z * 100) + '%'; }

  // Pages are empty frames of the right size; only those near the screen get a canvas and a text layer
  async function layoutPdf(tok) {
    const box = $('rd-doc'), d = cur, pdf = pdfDoc;
    box.innerHTML = '<div class="rd-scroll rd-pages" id="rd-scroll"></div>';
    const sc = $('rd-scroll');
    const p1 = await pdf.getPage(1); if (tok !== renderTok) return;
    const vp1 = p1.getViewport({ scale: 1 });
    zoomBase = Math.max(120, sc.clientWidth - 16) / vp1.width;
    const scale = zoomBase * (d.zoom || 1);
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= pdf.numPages; i++) {
      const f = document.createElement('div'); f.className = 'rd-pg'; f.dataset.p = i;
      f.style.width = Math.floor(vp1.width * scale) + 'px'; f.style.height = Math.floor(vp1.height * scale) + 'px';
      frag.appendChild(f);
    }
    sc.appendChild(frag);
    sc.dataset.scale = scale;
    if (obs) obs.disconnect(); if (pageObs) pageObs.disconnect();
    obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) paintPage(e.target, tok); else unpaintPage(e.target); }), { root: sc, rootMargin: '700px 0px' });
    pageObs = new IntersectionObserver(es => {
      let best = null; es.forEach(e => { if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e; });
      if (best && cur) { cur.page = +best.target.dataset.p; saveDocSoon(cur); const inp = $('rd-page'); if (inp && document.activeElement !== inp) inp.value = cur.page; }
    }, { root: sc, threshold: [.3, .6] });
    sc.querySelectorAll('.rd-pg').forEach(f => { obs.observe(f); pageObs.observe(f); });
    goPage(d.page || 1, true);
  }
  function goPage(n, instant) {
    const sc = $('rd-scroll'), max = pdfDoc ? pdfDoc.numPages : 1; if (!sc) return;
    n = Math.max(1, Math.min(max, n || 1));
    const f = sc.querySelector(`.rd-pg[data-p="${n}"]`); if (!f) return;
    sc.scrollTo({ top: f.offsetTop - sc.offsetTop - 6, behavior: instant || ML.reducedMotion() ? 'auto' : 'smooth' });
    if (cur) { cur.page = n; saveDocSoon(cur); }
    const inp = $('rd-page'); if (inp) inp.value = n;
  }
  async function paintPage(f, tok) {
    if (f.dataset.on || !pdfDoc) return;
    f.dataset.on = '1';
    try {
      const page = await pdfDoc.getPage(+f.dataset.p); if (tok !== renderTok || !f.isConnected || !f.dataset.on) return;
      const sc = $('rd-scroll'), scale = +sc.dataset.scale, vp = page.getViewport({ scale });
      f.style.width = Math.floor(vp.width) + 'px'; f.style.height = Math.floor(vp.height) + 'px';
      const dpr = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
      c.width = Math.floor(vp.width * dpr); c.height = Math.floor(vp.height * dpr);
      f.appendChild(c);
      const task = page.render({ canvasContext: c.getContext('2d'), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      f._task = task;
      await task.promise;
      if (tok !== renderTok || !f.isConnected || !f.dataset.on) return;
      const layer = document.createElement('div'); layer.className = 'textLayer'; layer.style.setProperty('--scale-factor', scale);
      f.appendChild(layer);
      const { lib } = await pdfLib();
      await lib.renderTextLayer({ textContentSource: page.streamTextContent(), container: layer, viewport: vp, textDivs: [] }).promise;
    } catch (e) { /* a cancelled paint, or a damaged page */ }
  }
  function unpaintPage(f) {
    if (!f.dataset.on) return;
    delete f.dataset.on;
    if (f._task) { try { f._task.cancel(); } catch (e) {} f._task = null; }
    f.querySelectorAll('canvas').forEach(c => { c.width = c.height = 0; });
    f.innerHTML = '';
  }
  async function zoom(dir) {
    const d = cur; if (!d) return;
    d.zoom = dir === 0 ? 1 : Math.max(.5, Math.min(4, Math.round(((d.zoom || 1) + dir * .25) * 100) / 100));
    saveDocSoon(d);
    if (d.kind === 'image') { applyImageZoom(); refreshTools(); return; }
    if (pdfMode === 'js') { const page = d.page; renderTok++; await layoutPdf(renderTok); goPage(page, true); refreshTools(); }
  }

  /* ---------- Notes and cards ---------- */
  function sideHtml(k) {
    const d = cur;
    if (k === 'notes') {
      const marks = [...new Set([...(d.notes || '').matchAll(/\[p\.\s*(\d+)\]/g)].map(m => +m[1]))].sort((a, b) => a - b);
      return `<div class="rd-notebar">${d.kind === 'pdf' ? `<button type="button" class="small" data-rd-mark>${esc(t('rd_mark'))}</button>` : ''}<button type="button" class="small ghost" data-rd-tonb ${d.notes ? '' : 'disabled'}>${esc(t('rd_to_nb'))}</button></div>
        ${marks.length ? `<div class="rd-marks" id="rd-marks">${marks.map(p => `<button type="button" class="lb-chip" data-rd-jump="${p}">${esc(t('lb_hit', { n: p }))}</button>`).join('')}</div>` : '<div class="rd-marks" id="rd-marks" hidden></div>'}
        <textarea id="rd-notes" class="rd-notes" placeholder="${esc(t('rd_notes_ph'))}">${esc(d.notes || '')}</textarea>`;
    }
    if (k === 'cards') {
      const info = d.deck ? ML.studyDeckInfo(d.deck) : null, cards = info && info.exists ? info.cards : [], dr = cardDraft || {};
      return `<form class="fc-add rd-cardform" id="rd-cardform" autocomplete="off">
          <textarea name="front" rows="2" maxlength="2000" placeholder="${esc(t('rd_card_front'))}" required>${esc(dr.front || '')}</textarea>
          <textarea name="back" rows="3" maxlength="4000" placeholder="${esc(t('rd_card_back'))}" required>${esc(dr.back || '')}</textarea>
          <button type="submit" class="primary small">${esc(t('rd_card_add'))}</button></form>
        ${cards.length ? `<button type="button" class="small ${info.due ? 'primary' : ''}" data-rd-review ${info.due ? '' : 'disabled'}>${esc(t('rd_review'))}${info.due ? ' · ' + esc(t('rd_due', { n: info.due })) : ''}</button>
          <ul class="fc-list rd-cards">${cards.slice(0, 40).map(c => `<li><div class="fc-q">${esc(c.front).replace(/\n/g, '<br>')}</div><div class="fc-a">${esc(c.back).replace(/\n/g, '<br>')}</div></li>`).join('')}</ul>` : `<p class="hint">${esc(t('rd_card_none'))}</p>`}`;
    }
    return '';
  }
  const refreshSide = () => { if (!cur) return; const el = $('rd-sidebody'); if (el) el.innerHTML = sideHtml(wide() ? side : pane); };
  function showPane(k) {
    pane = k;
    if (wide()) { if (k !== 'doc') { side = k; rd.querySelectorAll('[data-rd-side]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rdSide === k)); refreshSide(); } return; }
    rd.querySelectorAll('[data-rd-pane]').forEach(b => b.setAttribute('aria-pressed', b.dataset.rdPane === k));
    const docEl = $('rd-doc'), aside = rd.querySelector('.rd-side');
    docEl.hidden = k !== 'doc'; aside.hidden = k === 'doc';
    if (k !== 'doc') refreshSide();
  }
  // Text selected in the PDF or the sheet: a button offers to make it a card (phones lose the selection on tap, so it's kept here)
  document.addEventListener('selectionchange', () => {
    if (!cur) return;
    const s = getSelection(), el = document.activeElement;
    let txt = '';
    if (el && el.id === 'rd-sheet') txt = el.value.slice(el.selectionStart, el.selectionEnd);
    else if (s && !s.isCollapsed && s.anchorNode && rd.querySelector('.rd-doc') && rd.querySelector('.rd-doc').contains(s.anchorNode)) txt = String(s);
    txt = txt.replace(/\s+/g, ' ').trim();
    const b = $('rd-flash'); if (txt) lastSel = txt;
    if (b) b.hidden = !txt;
  });
  function makeCard() {
    const txt = lastSel; lastSel = ''; const b = $('rd-flash'); if (b) b.hidden = true;
    const src = cur.kind === 'pdf' && pdfMode === 'js' ? ` (${t('lb_hit', { n: cur.page })})` : '';
    cardDraft = { front: '', back: txt + src };
    if (wide()) { side = 'cards'; rd.querySelectorAll('[data-rd-side]').forEach(x => x.setAttribute('aria-pressed', x.dataset.rdSide === 'cards')); refreshSide(); } else showPane('cards');
    const f = rd.querySelector('#rd-cardform [name=front]'); if (f) f.focus();
    try { getSelection().removeAllRanges(); } catch (e) {}
  }
  function addCard(f) {
    const front = f.front.value.trim(), back = f.back.value.trim(); if (!front || !back) return;
    const exists = cur.deck && ML.studyDeckInfo(cur.deck).exists;
    const deck = ML.studyAddCard(exists ? cur.deck : cur.name.slice(0, 60), front, back);
    cur.deck = deck.id; saveDocSoon(cur); cardDraft = null;
    toast(t('rd_card_added', { deck: deck.name }), { key: 'rdcard' });
    refreshSide();
    const n = rd.querySelector('#rd-cardform [name=front]'); if (n && matchMedia('(pointer: fine)').matches) n.focus();
  }
  on('study:closed', () => { if (cur) refreshSide(); });

  /* ---------- Reader events ---------- */
  rd.addEventListener('click', e => {
    if (!cur) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-rd-close')) { closeReader(); return; }
    if (b.dataset.rdPane) { showPane(b.dataset.rdPane); return; }
    if (b.dataset.rdSide) { side = b.dataset.rdSide; rd.querySelectorAll('[data-rd-side]').forEach(x => x.setAttribute('aria-pressed', x.dataset.rdSide === side)); refreshSide(); return; }
    if (b.dataset.rdGo) { goPage((cur.page || 1) + +b.dataset.rdGo); return; }
    if (b.dataset.rdZoom != null) { zoom(+b.dataset.rdZoom); return; }
    if (b.hasAttribute('data-rd-flash')) { makeCard(); return; }
    if (b.hasAttribute('data-rd-timer')) {
      if (ML.running() || (ML.remainingNow() < (S.total || 0) - .5)) ML.toggleTimer();
      else ML.lockIn({ title: cur.name, mins: S.focusMins });
      refreshTimer(); return;
    }
    if (b.hasAttribute('data-rd-mark')) {
      const ta = $('rd-notes'); if (!ta) return;
      const mark = `[p. ${cur.page || 1}] `, at = ta.selectionStart ?? ta.value.length, before = ta.value.slice(0, at);
      ta.value = before + (before && !before.endsWith('\n') ? '\n' : '') + mark + ta.value.slice(at);
      ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.indexOf(mark, Math.max(0, at - 1)) + mark.length;
      ta.dispatchEvent(new Event('input', { bubbles: true })); return;
    }
    if (b.dataset.rdJump) { goPage(+b.dataset.rdJump); if (!wide()) showPane('doc'); return; }
    if (b.hasAttribute('data-rd-tonb')) {
      if (ML.notesAppend && cur.notes) { ML.notesAppend(`<h3>${esc(cur.name)}</h3>${cur.notes.split('\n').map(l => `<p>${esc(l)}</p>`).join('')}`); toast(t('rd_sent')); }
      return;
    }
    if (b.hasAttribute('data-rd-review') && cur.deck) { ML.studyReview(cur.deck); }
  });
  rd.addEventListener('input', e => {
    if (!cur) return;
    const id = e.target.id;
    if (id === 'rd-notes') {
      cur.notes = e.target.value; saveDocSoon(cur);
      const m = $('rd-marks'); if (m) { const ps = [...new Set([...cur.notes.matchAll(/\[p\.\s*(\d+)\]/g)].map(x => +x[1]))].sort((a, b) => a - b); m.hidden = !ps.length; m.innerHTML = ps.map(p => `<button type="button" class="lb-chip" data-rd-jump="${p}">${esc(t('lb_hit', { n: p }))}</button>`).join(''); }
      const tb = rd.querySelector('[data-rd-tonb]'); if (tb) tb.disabled = !cur.notes;
    }
    else if (id === 'rd-sheet') { cur.text = e.target.value; cur.size = cur.text.length; saveDocSoon(cur); }
    else if (id === 'rd-name') { cur.name = e.target.value.trim() || cur.name; saveDocSoon(cur); }
    else if (e.target.closest('#rd-cardform')) { cardDraft = { front: e.target.form.front.value, back: e.target.form.back.value }; }
  });
  rd.addEventListener('change', e => { if (e.target.id === 'rd-page') { goPage(parseInt(e.target.value, 10) || cur.page); } });
  rd.addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'rd-cardform') addCard(e.target); });
  rd.addEventListener('keydown', e => { if (e.target.id === 'rd-page' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
  // The divider between the document and the side column
  let sp = null;
  rd.addEventListener('pointerdown', e => { if (e.target.id === 'rd-split') { sp = { w: rd.querySelector('.rd-body').getBoundingClientRect() }; e.target.setPointerCapture(e.pointerId); e.preventDefault(); } });
  rd.addEventListener('pointermove', e => { if (sp) { L().split = Math.max(.35, Math.min(.8, (e.clientX - sp.w.left) / sp.w.width)); rd.style.setProperty('--rd-split', L().split); } });
  const spEnd = () => { if (!sp) return; sp = null; save(); if (cur && pdfMode === 'js') { const page = cur.page; renderTok++; layoutPdf(renderTok).then(() => goPage(page, true)); } };
  rd.addEventListener('pointerup', spEnd); rd.addEventListener('pointercancel', spEnd);
  function onKey(e) {
    if (!cur || (htmlEl.classList.contains('fc-stage-on'))) return; // a review on top has its own keys
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (ML.isTyping(e)) e.target.blur(); else closeReader(); return; }
    if (ML.isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (pdfMode === 'js' && (e.key === 'PageDown' || e.key === 'ArrowRight')) { e.preventDefault(); e.stopPropagation(); goPage((cur.page || 1) + 1); return; }
    if (pdfMode === 'js' && (e.key === 'PageUp' || e.key === 'ArrowLeft')) { e.preventDefault(); e.stopPropagation(); goPage((cur.page || 1) - 1); return; }
    if (e.key !== 'Tab') e.stopPropagation(); // nothing reaches the app's shortcuts behind
  }
  // Rotating a phone or resizing the window: phone tabs or side by side, and the pages fit again
  let rsT = 0;
  addEventListener('resize', () => {
    if (!cur) return; clearTimeout(rsT);
    rsT = setTimeout(async () => {
      if (!cur) return;
      const W = wide();
      if (W !== rd.classList.contains('wide')) { flushDocs(); const page = cur.page; teardownDoc(); renderReader(); cur.page = page; await mountDoc(); return; }
      if (pdfMode === 'js') { const page = cur.page; renderTok++; await layoutPdf(renderTok); goPage(page, true); }
    }, 220);
  });
})();
