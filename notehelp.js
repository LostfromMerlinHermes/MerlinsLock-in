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
      nh_cards: 'Créer {n} flashcard(s)', nh_cards_ok: '{n} flashcard(s) ajoutée(s) au paquet « {deck} »', nh_close: 'Fermer', nh_hint_bold: 'Astuce : les mots en gras ou surlignés deviennent les trous.',
    },
    en: {
      nh_sum: 'Summarize', nh_quiz: 'Page quiz', nh_sum_h: 'Page summary', nh_src_ai: "Chrome's AI, on your device", nh_src_ks: 'Key sentences from your page',
      nh_insert: 'Insert at the top', nh_copy: 'Copy', nh_short: 'Write a bit more (a few sentences) to summarize.', nh_wait: 'Summarizing…',
      nh_quiz_h: 'Fill-in-the-blank quiz', nh_quiz_none: 'Not enough text. Put important words in bold or highlight them: they become the blanks.', nh_check: 'Check', nh_next: 'Next', nh_score: 'Score: {s}/{n}',
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
  ML.NoteHelp = { summary, quiz, keySentences };
})();
