// Notebook study helpers (Premium), all free and on-device:
// - Summary: Chrome's built-in AI (Summarizer API) when the browser has it, otherwise the key sentences
//   picked by word frequency (a simple extractive summary, works everywhere, nothing leaves the device).
// - Fill-in-the-blank quiz: the words you put in bold or highlighted become the blanks; without any,
//   the most important word of each key sentence is used. Blanks can be saved as flashcards.
(() => {
  'use strict';
  const { $, S, t, esc, toast } = ML;

  ML.addStrings({
    fr: {
      nh_sum: 'Résumer', nh_quiz: 'Quiz de la page', nh_sum_h: 'Résumé de la page', nh_src_ai: 'IA de Chrome, sur ton appareil', nh_src_ks: 'Phrases clés de ta page',
      nh_insert: 'Insérer en haut de la page', nh_copy: 'Copier', nh_short: 'Écris un peu plus (quelques phrases) pour pouvoir résumer.', nh_wait: 'Résumé en cours…',
      nh_quiz_h: 'Quiz à trous', nh_quiz_none: 'Pas assez de texte. Mets des mots importants en gras ou surlignés : ils deviendront les trous.', nh_check: 'Valider', nh_next: 'Suivante', nh_score: 'Score : {s}/{n}',
      nh_cards_btn: 'Cartes', nh_q: 'Question', nh_a: 'Réponse', nh_cards_h: 'Cartes proposées', nh_kept: '{n} sur {m} gardées', nh_keep: 'Garder cette carte', nh_cards_add: 'Ajouter {n} carte(s)', nh_cards_wait: 'Lecture de ta page…', nh_cards_none: 'Rien trouvé à mettre en carte. Écris des lignes « terme : définition », ou mets les mots importants en gras.', nh_src_lm: 'Écrites sur cet appareil par le modèle de Chrome. Rien n’est envoyé. Relis-les avant d’ajouter.', nh_src_rules: 'Tirées de ta page sur cet appareil. Décoche ou corrige avant d’ajouter.', nh_dl: 'Chrome peut écrire de vraies questions. Il télécharge son modèle une fois (plusieurs Go, en Wi-Fi).', nh_dl_go: 'Télécharger', nh_dl_wait: 'Téléchargement du modèle : {p} %', nh_dl_fail: 'Le modèle n’a pas pu être utilisé sur cet appareil.',
      nh_cards: 'Créer {n} flashcard(s)', nh_cards_ok: '{n} flashcard(s) ajoutée(s) au paquet « {deck} »', nh_close: 'Fermer', nh_hint_bold: 'Astuce : les mots en gras ou surlignés deviennent les trous.',
    },
    en: {
      nh_sum: 'Summarize', nh_quiz: 'Page quiz', nh_sum_h: 'Page summary', nh_src_ai: "Chrome's AI, on your device", nh_src_ks: 'Key sentences from your page',
      nh_insert: 'Insert at the top', nh_copy: 'Copy', nh_short: 'Write a bit more (a few sentences) to summarize.', nh_wait: 'Summarizing…',
      nh_quiz_h: 'Fill-in-the-blank quiz', nh_quiz_none: 'Not enough text. Put important words in bold or highlight them: they become the blanks.', nh_check: 'Check', nh_next: 'Next', nh_score: 'Score: {s}/{n}',
      nh_cards_btn: 'Cards', nh_q: 'Question', nh_a: 'Answer', nh_cards_h: 'Suggested cards', nh_kept: '{n} of {m} kept', nh_keep: 'Keep this card', nh_cards_add: 'Add {n} card(s)', nh_cards_wait: 'Reading your page…', nh_cards_none: 'Nothing to turn into cards. Write lines like "term: definition", or put the important words in bold.', nh_src_lm: "Written on this device by Chrome's model. Nothing is sent. Read them before adding.", nh_src_rules: 'Taken from your page on this device. Untick or correct before adding.', nh_dl: 'Chrome can write real questions. It downloads its model once (several GB, on Wi-Fi).', nh_dl_go: 'Download', nh_dl_wait: 'Downloading the model: {p}%', nh_dl_fail: 'The model could not be used on this device.',
      nh_cards: 'Create {n} flashcard(s)', nh_cards_ok: '{n} flashcard(s) added to the "{deck}" deck', nh_close: 'Close', nh_hint_bold: 'Tip: words in bold or highlighted become the blanks.',
    },
  });

  const STOP = new Set(('le la les un une des de du d l et ou en a à au aux ce cet cette ces qui que quoi dont où ou pour par sur dans avec sans sous entre est sont été être était ont avoir il elle ils elles on nous vous je tu se sa son ses leur leurs mais donc or ni car ne pas plus moins très tout tous toute toutes comme aussi si y lui eux même mes tes nos vos notre votre ' +
    'the a an and or of to in on for with is are was were be been being it its this that these those as at by from not but if then so than which who whom what when where how also into about over such can may will would there their them they he she his her we you i').split(' '));
  const words = s => (s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[\p{L}\p{N}]+/gu) || []);
  const sentencesOf = text => text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[\p{Lu}0-9«"(])/u).map(s => s.trim()).filter(s => s.length >= 25 && s.length <= 450);
  function keySentences(text, max = 7) {
    const sents = sentencesOf(text); if (sents.length < 2) return sents;
    const freq = {};
    sents.forEach(s => words(s).forEach(w => { if (w.length > 2 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1; }));
    const scored = sents.map((s, i) => {
      const ws = [...new Set(words(s).filter(w => w.length > 2 && !STOP.has(w)))];
      const score = ws.reduce((a, w) => a + freq[w], 0) / Math.sqrt(Math.max(4, words(s).length)) + (i === 0 ? 1.5 : 0);
      return { s, i, score };
    });
    const k = Math.max(1, Math.min(max, Math.round(sents.length * 0.3)));
    return scored.sort((a, b) => b.score - a.score).slice(0, k).sort((a, b) => a.i - b.i).map(x => x.s);
  }
  const langOf = text => { const ws = words(text).slice(0, 300), fr = ws.filter(w => /^(le|la|les|des|est|une|et|du|que|qui|dans|pour)$/.test(w)).length, en = ws.filter(w => /^(the|is|and|of|to|that|in|for|are|with)$/.test(w)).length; return fr >= en ? 'fr' : 'en'; };
  async function chromeSummary(text) {
    try {
      if (!('Summarizer' in self)) return null;
      const lang = langOf(text), av = await self.Summarizer.availability({ expectedInputLanguages: [lang], outputLanguage: lang });
      if (av === 'unavailable') return null;
      const sm = await self.Summarizer.create({ type: 'key-points', format: 'plain-text', length: 'medium', expectedInputLanguages: [lang], outputLanguage: lang });
      const out = await sm.summarize(text.slice(0, 12000));
      try { sm.destroy(); } catch (e) {}
      const pts = String(out || '').split(/\n+/).map(x => x.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
      return pts.length ? pts : null;
    } catch (e) { return null; }
  }

  /* ---------- Summary panel ---------- */
  async function summary(p, body, slot) {
    const text = body.innerText.trim();
    if (sentencesOf(text).length < 2) { toast(t('nh_short')); return; }
    slot.innerHTML = `<div class="nb-fc nh-panel"><b>${esc(t('nh_sum_h'))}</b><p class="hint">${esc(t('nh_wait'))}</p></div>`;
    const ai = await chromeSummary(text), pts = ai || keySentences(text);
    slot.innerHTML = `<div class="nb-fc nh-panel"><div class="nh-head"><b>${esc(t('nh_sum_h'))}</b><small class="hint">${esc(ai ? t('nh_src_ai') : t('nh_src_ks'))}</small></div>
      <ul class="nh-points">${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="t-edit-btns"><button type="button" class="small ghost" data-nh="close">${esc(t('nh_close'))}</button><span class="grow"></span><button type="button" class="small" data-nh="copy">${esc(t('nh_copy'))}</button><button type="button" class="small primary" data-nh="insert">${esc(t('nh_insert'))}</button></div></div>`;
    slot.onclick = e => {
      const b = e.target.closest('[data-nh]'); if (!b) return;
      if (b.dataset.nh === 'close') slot.innerHTML = '';
      if (b.dataset.nh === 'copy') { try { navigator.clipboard.writeText(pts.map(x => '• ' + x).join('\n')).then(() => toast(t('tr_copied'))); } catch (err) {} }
      if (b.dataset.nh === 'insert') { body.insertAdjacentHTML('afterbegin', `<h3>${esc(t('nh_sum_h'))}</h3><ul>${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p><br></p>`); body.dispatchEvent(new Event('input')); slot.innerHTML = ''; }
    };
  }

  /* ---------- Fill-in-the-blank quiz ---------- */
  function blanks(body) {
    const text = body.innerText, sents = sentencesOf(text), out = [], seen = new Set();
    // 1) Words the user emphasized (bold, highlight, underline)
    body.querySelectorAll('b, strong, mark, u').forEach(el => {
      const ans = el.textContent.trim(); if (ans.length < 2 || ans.length > 60 || seen.has(ans.toLowerCase())) return;
      const s = sents.find(x => x.includes(ans)); if (!s) return;
      seen.add(ans.toLowerCase()); out.push({ q: s.replace(ans, '_____'), a: ans });
    });
    // 2) Otherwise the most frequent important word of each key sentence
    if (out.length < 3) {
      const freq = {}; sents.forEach(s => words(s).forEach(w => { if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1; }));
      keySentences(text, 8).forEach(s => {
        const cands = (s.match(/[\p{L}][\p{L}'-]{3,}/gu) || []).filter(w => !STOP.has(words(w)[0] || '') && !seen.has(w.toLowerCase()));
        const best = cands.sort((a, b) => (freq[words(b)[0]] || 0) - (freq[words(a)[0]] || 0) || b.length - a.length)[0];
        if (best) { seen.add(best.toLowerCase()); out.push({ q: s.replace(best, '_____'), a: best }); }
      });
    }
    return out.slice(0, 10);
  }
  function quiz(p, body, slot) {
    const qs = blanks(body);
    if (!qs.length) { slot.innerHTML = `<div class="nb-fc nh-panel"><p class="hint">${esc(t('nh_quiz_none'))}</p><button type="button" class="small ghost" data-nhq="close">${esc(t('nh_close'))}</button></div>`; slot.onclick = e => { if (e.target.closest('[data-nhq="close"]')) slot.innerHTML = ''; }; return; }
    let pos = 0, score = 0, answered = null;
    const draw = () => {
      const q = qs[pos];
      slot.innerHTML = !q ? `<div class="nb-fc nh-panel"><b>${esc(t('nh_quiz_h'))}</b><p class="qz-score"><b>${score}</b> / ${qs.length}</p>
          <div class="t-edit-btns"><button type="button" class="small ghost" data-nhq="close">${esc(t('nh_close'))}</button><span class="grow"></span><button type="button" class="small primary" data-nhq="cards">${esc(t('nh_cards', { n: qs.length }))}</button></div></div>`
        : `<form class="nb-fc nh-panel" id="nhq-form" autocomplete="off"><div class="nh-head"><b>${esc(t('nh_quiz_h'))}</b><small class="hint">${pos + 1}/${qs.length} · ${esc(t('nh_score', { s: score, n: qs.length }))}</small></div>
          <p class="nh-cloze">${esc(q.q).replace('_____', '<span class="nh-blank">_____</span>')}</p>
          <input type="text" id="nhq-in" maxlength="80" ${answered ? 'disabled' : ''} value="${answered ? esc(answered.given) : ''}">
          ${answered ? `<p class="qz-verdict ${answered.ok ? 'ok' : 'ko'}">${esc(answered.ok ? t('qz_right') : t('qz_wrong'))} · ${esc(q.a)}</p>` : ''}
          <div class="t-edit-btns"><button type="button" class="small ghost" data-nhq="close">${esc(t('nh_close'))}</button><span class="grow"></span>
          ${answered ? `<button type="button" class="small primary" data-nhq="next">${esc(t('nh_next'))}</button>` : `<button type="submit" class="small primary">${esc(t('nh_check'))}</button>`}</div>
          ${pos === 0 && !answered ? `<small class="hint">${esc(t('nh_hint_bold'))}</small>` : ''}</form>`;
      const i = $('nhq-in'); if (i && !answered) i.focus(); else { const n = slot.querySelector('[data-nhq="next"]'); if (n) n.focus(); }
      const f = $('nhq-form');
      if (f) f.onsubmit = e => {
        e.preventDefault(); const given = $('nhq-in').value; if (!given.trim()) return;
        const ok = ML.answerMatches ? ML.answerMatches(given, q.a) : given.trim().toLowerCase() === q.a.toLowerCase();
        if (ok) score++; answered = { ok, given }; if (ML.sfx) ML.sfx(ok ? 'sub' : 'abandon'); draw();
      };
    };
    slot.onclick = e => {
      const b = e.target.closest('[data-nhq]'); if (!b) return;
      if (b.dataset.nhq === 'close') { slot.innerHTML = ''; return; }
      if (b.dataset.nhq === 'next') { pos++; answered = null; if (pos >= qs.length) { const xp = Math.min(15, score * 2); if (xp) ML.addXp(xp); } draw(); return; }
      if (b.dataset.nhq === 'cards' && ML.studyAddCard) { let deck; qs.forEach(q => { deck = ML.studyAddCard((p.title || t('fc_nb_deck')).slice(0, 60), q.q, q.a); }); toast(t('nh_cards_ok', { n: qs.length, deck: deck.name })); slot.innerHTML = ''; }
    };
    draw();
  }

  /* ---------- Cards from the page (3.96) ----------
     Chrome's own model (Prompt API, computers only) writes question / answer pairs when it is already on the device; anywhere else,
     simple rules read the page: « term : definition », a heading over a list, « X is … », then the bold words as blanks.
     Nothing enters a deck before the user has read the list: untick, correct, then add. The model is never downloaded unasked. */
  const within = (p, ms, fallback) => Promise.race([p, new Promise(r => setTimeout(() => r(fallback), ms))]);
  const lmOpts = lang => ({ expectedInputs: [{ type: 'text', languages: [lang] }], expectedOutputs: [{ type: 'text', languages: [lang] }] });
  async function lmState(lang) {
    try {
      if (!('LanguageModel' in self)) return 'no';
      const a = await within(self.LanguageModel.availability(lmOpts(lang)), 3000, 'no'); // can hang where the browser has no model service
      return a === 'available' ? 'available' : a === 'downloadable' || a === 'downloading' ? 'downloadable' : 'no';
    } catch (e) { return 'no'; }
  }
  async function lmCards(text, lang, onProgress) {
    const s = await self.LanguageModel.create(Object.assign({ monitor(m) { m.addEventListener('downloadprogress', e => { if (onProgress) onProgress(e.loaded); }); } }, lmOpts(lang)));
    try {
      const schema = { type: 'array', maxItems: 8, items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'], additionalProperties: false } };
      const ask = lang === 'fr'
        ? 'Voici des notes de cours. Écris de 4 à 8 cartes de révision en français. Chaque carte a une question précise (q) et une réponse courte (a) tirée uniquement du texte. N’invente rien. Réponds en JSON.'
        : 'Here are course notes. Write 4 to 8 revision cards in English. Each card has a precise question (q) and a short answer (a) taken only from the text. Invent nothing. Answer in JSON.';
      const raw = await s.prompt(ask + '\n\n' + text.slice(0, 6000), { responseConstraint: schema });
      const arr = JSON.parse(String(raw).replace(/^```(?:json)?|```$/g, '').trim());
      return (Array.isArray(arr) ? arr : []).map(x => ({ q: String(x.q || '').trim().slice(0, 200), a: String(x.a || '').trim().slice(0, 400) })).filter(x => x.q.length > 3 && x.a);
    } finally { try { s.destroy(); } catch (e) {} }
  }
  function ruleCards(body) {
    const out = [], seen = new Set();
    const add = (q, a) => { q = q.trim().replace(/\s*:\s*$/, ''); a = a.trim(); const k = q.toLowerCase(); if (q.length < 2 || q.length > 140 || a.length < 2 || a.length > 400 || seen.has(k)) return; seen.add(k); out.push({ q, a }); };
    const text = body.innerText;
    text.split(/\n+/).map(s => s.trim()).forEach(l => { const m = /^([^:–—]{2,60}?)\s*(?::|–|—| - )\s+(.{8,})$/.exec(l); if (m && !/[.!?]$/.test(m[1]) && words(m[1]).length <= 8) add(m[1], m[2]); });
    body.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const n = h.nextElementSibling; if (!n || !/^(UL|OL)$/.test(n.tagName)) return;
      const items = [...n.children].map(li => li.innerText.trim()).filter(Boolean);
      if (items.length >= 2 && items.length <= 8) add(h.innerText, items.map(x => '• ' + x).join('\n'));
    });
    sentencesOf(text).forEach(s => { const m = /^([^,;:()]{2,50}?)\s+(?:est|sont|désigne|désignent|signifie|is|are|means|refers to)\s+.{12,}$/iu.exec(s); if (m && words(m[1]).length <= 6) add(m[1], s); });
    const lines = text.split(/\n+/).map(s => s.trim()); // the bold words, each as a blank in its own line (headings stay out of it)
    body.querySelectorAll('b, strong, mark, u').forEach(el => { const ans = el.textContent.trim(); if (ans.length < 2 || ans.length > 60) return; const l = lines.find(x => x.includes(ans) && x.length > ans.length + 10); if (l) add(l.replace(ans, '_____'), ans); });
    return out.slice(0, 12);
  }
  async function cards(p, body, slot) {
    const text = body.innerText.trim();
    if (text.length < 60) { toast(t('nh_short')); return; }
    const lang = langOf(text), token = {}; slot._nhc = token;
    const alive = () => slot._nhc === token;
    const wait = msg => { slot.innerHTML = `<div class="nb-fc nh-panel"><b>${esc(t('nh_cards_h'))}</b><p class="hint">${esc(msg)}</p><button type="button" class="small ghost" data-nhc="close">${esc(t('nh_close'))}</button></div>`; };
    let list = [], byModel = false, state = 'no';
    const draw = () => {
      const n = list.filter(x => x.on).length;
      slot.innerHTML = `<div class="nb-fc nh-panel"><div class="nh-head"><b>${esc(t('nh_cards_h'))}</b><small class="hint">${esc(t('nh_kept', { n, m: list.length }))}</small></div>
        <p class="hint">${esc(t(byModel ? 'nh_src_lm' : 'nh_src_rules'))}</p>
        ${list.length ? `<ul class="nh-cards">${list.map((c, i) => `<li><input type="checkbox" data-nhc-on="${i}" id="nhc-on-${i}" ${c.on ? 'checked' : ''} aria-label="${esc(t('nh_keep'))}"><div><input type="text" data-nhc-q="${i}" id="nhc-q-${i}" maxlength="200" value="${esc(c.q)}" aria-label="${esc(t('nh_q'))}"><textarea data-nhc-a="${i}" id="nhc-a-${i}" rows="2" maxlength="400" aria-label="${esc(t('nh_a'))}">${esc(c.a)}</textarea></div></li>`).join('')}</ul>` : `<p class="hint">${esc(t('nh_cards_none'))}</p>`}
        ${state === 'downloadable' && !byModel ? `<p class="hint nh-dl">${esc(t('nh_dl'))} <button type="button" class="link" data-nhc="dl">${esc(t('nh_dl_go'))}</button></p>` : ''}
        <div class="t-edit-btns"><button type="button" class="small ghost" data-nhc="close">${esc(t('nh_close'))}</button><span class="grow"></span><button type="button" class="small primary" data-nhc="add" ${n ? '' : 'disabled'}>${esc(t('nh_cards_add', { n }))}</button></div></div>`;
    };
    const fromModel = async onProgress => {
      const got = await within(lmCards(text, lang, onProgress), 180000, null);
      if (got && got.length) { list = got.map(x => Object.assign(x, { on: true })); byModel = true; return true; }
      return false;
    };
    slot.oninput = e => { const d = e.target.dataset; if (d.nhcQ) list[+d.nhcQ].q = e.target.value; if (d.nhcA) list[+d.nhcA].a = e.target.value; };
    slot.onchange = e => { const d = e.target.dataset; if (d.nhcOn) { list[+d.nhcOn].on = e.target.checked; ML.keepInputs(slot, draw); } };
    slot.onclick = async e => {
      const b = e.target.closest('[data-nhc]'); if (!b) return;
      if (b.dataset.nhc === 'close') { slot._nhc = null; slot.innerHTML = ''; return; }
      if (b.dataset.nhc === 'dl') { // the user asked: Chrome fetches its model once, then writes the cards
        wait(t('nh_dl_wait', { p: 0 }));
        let ok = false; try { ok = await fromModel(f => { if (alive()) wait(f < 1 ? t('nh_dl_wait', { p: Math.round(f * 100) }) : t('nh_cards_wait')); }); } catch (err) {}
        if (!alive()) return; if (!ok) { state = 'no'; toast(t('nh_dl_fail')); } draw(); return;
      }
      if (b.dataset.nhc === 'add' && ML.studyAddCard) {
        const keep = list.filter(x => x.on && x.q.trim() && x.a.trim()); if (!keep.length) return;
        let deck; keep.forEach(c => { deck = ML.studyAddCard((p.title || t('fc_nb_deck')).slice(0, 60), c.q.trim(), c.a.trim()); });
        toast(t('nh_cards_ok', { n: keep.length, deck: deck.name })); slot._nhc = null; slot.innerHTML = '';
      }
    };
    wait(t('nh_cards_wait'));
    state = await lmState(lang); if (!alive()) return;
    if (state === 'available') { try { await fromModel(); } catch (e) {} if (!alive()) return; }
    if (!byModel) list = ruleCards(body).map(x => Object.assign(x, { on: true }));
    draw();
  }
  ML.NoteHelp = { summary, quiz, cards, keySentences };
})();
