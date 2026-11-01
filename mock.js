// Mock exam (3.59, a card in the Subjects tab, Premium): a timed full-screen test drawn from your decks and from fill-in-the-blank
// sentences taken out of your Library documents (no AI: the rarest words of a sentence are the ones blanked, so some blanks will
// be less sharp than a teacher's). At the end: the score per source, and the mistakes can become cards. Picked in rentree2.html (I2).
(() => {
  'use strict';
  const { $, S, t, esc, on, save, uid, today, toast } = ML;

  ML.addStrings({
    fr: {
      mk_h: 'Examen blanc', mk_intro: 'Un examen chronométré tiré de tes cartes et de phrases à trous extraites de tes documents.', mk_prem: 'L’examen blanc fait partie de Premium.', mk_decks: 'Paquets', mk_docs: 'Documents de la Bibliothèque', mk_none: 'Ajoute un paquet ou un document pour commencer.', mk_n: 'Questions', mk_mins: 'Minutes', mk_start: 'Commencer', mk_pick: 'Choisis au moins une source.', mk_empty: 'Pas assez de contenu dans ces sources.', mk_past: 'Derniers résultats',
      mk_q: 'Question {i} sur {n}', mk_ans_ph: 'Ta réponse', mk_prev: 'Précédente', mk_next: 'Suivante', mk_finish: 'Rendre ma copie', mk_blank: 'Complète le mot manquant', mk_card: 'Réponds sans regarder',
      mk_res: 'Résultat', mk_score: '{s} sur {n}', mk_by: 'Par source', mk_check: 'Corrige tes réponses', mk_check_hint: 'Les mots à trous sont corrigés seuls. Pour les cartes, c’est toi qui décides.', mk_right: 'Juste', mk_wrong: 'Faux', mk_yours: 'Ta réponse : {a}', mk_noans: 'Pas de réponse', mk_expected: 'Attendu : {a}', mk_cards: 'Faire des cartes de mes erreurs', mk_cards_ok: '{n} cartes ajoutées au paquet « {d} ».', mk_deck: 'Erreurs d’examen blanc', mk_close: 'Fermer', mk_time: 'Temps écoulé : copie rendue.',
    },
    en: {
      mk_h: 'Mock exam', mk_intro: 'A timed exam drawn from your cards and from fill-in-the-blank sentences taken out of your documents.', mk_prem: 'Mock exams are part of Premium.', mk_decks: 'Decks', mk_docs: 'Library documents', mk_none: 'Add a deck or a document to start.', mk_n: 'Questions', mk_mins: 'Minutes', mk_start: 'Start', mk_pick: 'Pick at least one source.', mk_empty: 'Not enough content in these sources.', mk_past: 'Last results',
      mk_q: 'Question {i} of {n}', mk_ans_ph: 'Your answer', mk_prev: 'Previous', mk_next: 'Next', mk_finish: 'Hand it in', mk_blank: 'Fill in the missing word', mk_card: 'Answer without looking',
      mk_res: 'Result', mk_score: '{s} of {n}', mk_by: 'By source', mk_check: 'Correct your answers', mk_check_hint: 'Blanks are corrected for you. For cards, you decide.', mk_right: 'Right', mk_wrong: 'Wrong', mk_yours: 'Your answer: {a}', mk_noans: 'No answer', mk_expected: 'Expected: {a}', mk_cards: 'Make cards from my mistakes', mk_cards_ok: '{n} cards added to the deck "{d}".', mk_deck: 'Mock exam mistakes', mk_close: 'Close', mk_time: 'Time is up: handed in.',
    },
  });
  ML.defaults(() => ({ mocks: [] }));

  /* ---------- Fill-in-the-blank from a text ---------- */
  const STOP = new Set('alors aussi autre autres avant avec avoir cette cela celle celles celui ceux comme comment dans depuis donc elle elles encore entre étaient était être faire leur leurs lorsque mais même moins notre nous parce pendant plus plusieurs pour pourquoi quand quelle quelles quelque quels sans selon sera seront sont sous tous tout toute toutes très vers votre vous about above after again against among because been before being between both could does doing down during each from further have having here into itself more most much once only other over same should some such than that their them then there these they this those through under until very were what when where which while whom will with would your'.split(' '));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const lev = (a, b) => { if (Math.abs(a.length - b.length) > 1) return 2; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  // A blank is right when it matches once case and accents are gone; one typo is forgiven on words of 6 letters or more
  ML.mockCheck = (given, expected) => { const a = norm(given), b = norm(expected); return !!a && (a === b || (b.length >= 6 && lev(a, b) <= 1)); };
  ML.mockCloze = (pages, count, src) => {
    const freq = new Map(), words = s => s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
    pages.forEach(p => words(p || '').forEach(w => { const k = w.toLowerCase(); freq.set(k, (freq.get(k) || 0) + 1); }));
    const seen = new Set(), found = [];
    pages.forEach((p, pi) => {
      (String(p || '').match(/[^.!?\n]+[.!?]/g) || []).forEach(raw => {
        const s = raw.replace(/\s+/g, ' ').trim(); if (s.length < 50 || s.length > 240) return;
        const ws = words(s); if (ws.length < 8 || ws.join('').length / s.length < .7) return; // tables and page furniture have little running text
        let best = null, score = 0;
        ws.forEach((w, i) => {
          const k = w.toLowerCase(), isNum = /^\d{2,4}$/.test(w); if (STOP.has(k) || (!isNum && (w.length < 5 || !/^\p{L}/u.test(w)))) return;
          const n = freq.get(k), v = (n === 1 ? 2 : n <= 4 ? 3 : n <= 12 ? 1.5 : .3) + (i > 0 && /^\p{Lu}/u.test(w) ? 2 : 0) + (isNum ? 1.5 : 0) + Math.min(w.length, 12) / 12;
          if (v > score) { score = v; best = w; }
        });
        if (!best || seen.has(best.toLowerCase())) return;
        seen.add(best.toLowerCase());
        found.push({ kind: 'cloze', prompt: s.replace(best, '_____'), answer: best, src, where: pi, score });
      });
    });
    // the best ones, spread across the document rather than all from its first pages
    found.sort((a, b) => b.score - a.score);
    const buckets = new Map(); found.forEach(q => { const b = Math.floor(q.where / Math.max(1, Math.ceil(pages.length / Math.max(1, count)))); if (!buckets.has(b)) buckets.set(b, []); buckets.get(b).push(q); });
    const out = [], lists = [...buckets.values()];
    while (out.length < count && lists.some(l => l.length)) lists.forEach(l => { if (l.length && out.length < count) out.push(l.shift()); });
    return out;
  };

  /* ---------- The setup card in Subjects ---------- */
  let sources = [], run = null, result = null, cardEl = null;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  async function renderCard() {
    const host = $('subjects'); if (!host) return;
    const box = host.querySelector('.sj'); if (!box) return;
    if (cardEl && cardEl.isConnected) cardEl.remove();
    cardEl = document.createElement('div'); cardEl.className = 'g-card mk-card'; cardEl.id = 'mk-card';
    if (!(ML.isPremium && ML.isPremium())) { cardEl.innerHTML = `<h2>${esc(t('mk_h'))}</h2><p class="hint">${esc(t('mk_intro'))} ${esc(t('mk_prem'))}</p>`; box.append(cardEl); return; }
    box.append(cardEl);
    try { sources = ML.Library ? await ML.Library.sources() : []; } catch (e) { sources = []; }
    if (!cardEl.isConnected) return;
    const decks = (S.study.decks || []).filter(d => S.study.cards.some(c => c.deck === d.id));
    const past = (S.mocks || []).slice(0, 3);
    const chk = (kind, id, name) => `<label class="opt"><input type="checkbox" data-mk-${kind}="${id}"> ${esc(name)}</label>`;
    cardEl.innerHTML = `<h2>${esc(t('mk_h'))}</h2><p class="hint">${esc(t('mk_intro'))}</p>
      ${decks.length || sources.length ? `<form class="mk-form" id="mk-form" autocomplete="off">
        ${decks.length ? `<fieldset><legend class="label">${esc(t('mk_decks'))}</legend>${decks.map(d => chk('deck', d.id, d.name)).join('')}</fieldset>` : ''}
        ${sources.length ? `<fieldset><legend class="label">${esc(t('mk_docs'))}</legend>${sources.map(d => chk('doc', d.id, d.name)).join('')}</fieldset>` : ''}
        <div class="mk-row"><label><span>${esc(t('mk_n'))}</span><select id="mk-n"><option>10</option><option selected>20</option><option>30</option></select></label>
          <label><span>${esc(t('mk_mins'))}</span><input type="number" id="mk-mins" min="1" max="240" value="30" inputmode="numeric"></label>
          <button type="submit" class="primary small">${esc(t('mk_start'))}</button></div></form>` : `<p class="hint">${esc(t('mk_none'))}</p>`}
      ${past.length ? `<span class="label">${esc(t('mk_past'))}</span><ul class="mk-past">${past.map(m => `<li><span>${esc(new Date(m.at).toLocaleDateString(ML.locale(), { day: 'numeric', month: 'short' }))}</span><b>${esc(t('mk_score', { s: m.score, n: m.n }))}</b><small>${esc((m.names || []).join(', '))}</small></li>`).join('')}</ul>` : ''}`;
  }
  function build(deckIds, docIds, n) {
    const cards = shuffle(S.study.cards.filter(c => deckIds.includes(c.deck))).map(c => ({ kind: 'card', prompt: c.front, answer: c.back, src: (S.study.decks.find(d => d.id === c.deck) || {}).name || '', cardId: c.id }));
    const docs = sources.filter(d => docIds.includes(d.id));
    const perDoc = docs.length ? Math.ceil((cards.length ? n / 2 : n) / docs.length) : 0;
    const blanks = docs.flatMap(d => ML.mockCloze(d.pages, perDoc, d.name));
    const part = cards.slice(0, blanks.length ? Math.max(n - blanks.length, Math.floor(n / 2)) : n);
    return shuffle([...part, ...blanks]).slice(0, n);
  }

  /* ---------- Taking the exam ---------- */
  const ov = document.createElement('div');
  ov.className = 'overlay mk-ov'; ov.id = 'mock'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'mk-title');
  document.body.append(ov);
  let tickT = 0;
  const left = () => Math.max(0, (run.endAt - Date.now()) / 1000);
  function renderRun() {
    const q = run.items[run.i], n = run.items.length;
    ov.innerHTML = `<div class="mk-in"><header class="mk-top"><h2 id="mk-title">${esc(t('mk_h'))}</h2><b class="mk-clock" id="mk-clock" role="timer">${esc(MiniView.fmtClock(left()))}</b></header>
      <div class="mk-prog"><i style="width:${((run.i + 1) / n * 100).toFixed(1)}%"></i></div>
      <span class="label">${esc(t('mk_q', { i: run.i + 1, n }))} · ${esc(q.src)}</span>
      <p class="mk-kind">${esc(t(q.kind === 'cloze' ? 'mk_blank' : 'mk_card'))}</p>
      <p class="mk-prompt">${esc(q.prompt)}</p>
      ${q.kind === 'cloze' ? `<input type="text" id="mk-a" class="mk-a" autocomplete="off" spellcheck="false" value="${esc(q.given || '')}" aria-label="${esc(t('mk_ans_ph'))}" placeholder="${esc(t('mk_ans_ph'))}">` : `<textarea id="mk-a" class="mk-a" rows="4" aria-label="${esc(t('mk_ans_ph'))}" placeholder="${esc(t('mk_ans_ph'))}">${esc(q.given || '')}</textarea>`}
      <div class="mk-nav"><button type="button" data-mk="prev" ${run.i ? '' : 'disabled'}>${esc(t('mk_prev'))}</button>${run.i < n - 1 ? `<button type="button" class="primary" data-mk="next">${esc(t('mk_next'))}</button>` : ''}<button type="button" id="mk-end" class="${run.i === n - 1 ? 'primary' : 'ghost'}">${esc(t('mk_finish'))}</button></div></div>`;
    ML.armedButton($('mk-end'), 'mk_finish', () => finish());
    const a = $('mk-a'); if (a && !matchMedia('(pointer: coarse)').matches) a.focus();
  }
  const keep = () => { const a = $('mk-a'); if (a && run) run.items[run.i].given = a.value; };
  function open(items, mins, names) {
    run = { items, i: 0, endAt: Date.now() + mins * 60000, mins, startedAt: Date.now(), names };
    result = null; ov.hidden = false; document.documentElement.classList.add('mk-on'); renderRun();
    clearInterval(tickT);
    tickT = setInterval(() => { if (!run) return clearInterval(tickT); const c = $('mk-clock'); if (c) c.textContent = MiniView.fmtClock(left()); if (left() <= 0) { toast(t('mk_time'), { ms: 5000 }); finish(); } }, 1000);
  }
  function finish() {
    keep(); clearInterval(tickT);
    const r = run; run = null;
    r.items.forEach(q => { q.right = q.kind === 'cloze' ? ML.mockCheck(q.given, q.answer) : false; });
    result = { items: r.items, names: r.names, at: Date.now(), mins: Math.max(1, Math.round((Date.now() - r.startedAt) / 60000)) };
    ML.addXp(Math.min(120, result.mins)); // 1 XP a minute, like a session
    renderResult();
  }
  const scoreOf = () => result.items.filter(q => q.right).length;
  function renderResult() {
    const items = result.items, by = {};
    items.forEach(q => { (by[q.src] = by[q.src] || [0, 0])[1]++; if (q.right) by[q.src][0]++; });
    const wrong = items.filter(q => !q.right).length;
    ov.innerHTML = `<div class="mk-in mk-res"><header class="mk-top"><h2 id="mk-title">${esc(t('mk_res'))}</h2><b class="mk-clock">${esc(t('mk_score', { s: scoreOf(), n: items.length }))}</b></header>
      <span class="label">${esc(t('mk_by'))}</span>
      <ul class="mk-by">${Object.entries(by).map(([k, [a, b]]) => `<li><span>${esc(k)}</span><i class="mk-bar"><em style="width:${(a / b * 100).toFixed(0)}%"></em></i><b>${a}/${b}</b></li>`).join('')}</ul>
      <span class="label">${esc(t('mk_check'))}</span><p class="hint">${esc(t('mk_check_hint'))}</p>
      <ol class="mk-list">${items.map((q, i) => `<li class="${q.right ? 'ok' : 'ko'}"><p class="mk-q">${esc(q.prompt)}</p><small>${q.given ? esc(t('mk_yours', { a: q.given })) : esc(t('mk_noans'))}</small><small>${esc(t('mk_expected', { a: q.answer }))}</small>
        <div class="seg-toggle" role="group"><button type="button" data-mk-mark="${i}" data-v="1" aria-pressed="${!!q.right}">${esc(t('mk_right'))}</button><button type="button" data-mk-mark="${i}" data-v="0" aria-pressed="${!q.right}">${esc(t('mk_wrong'))}</button></div></li>`).join('')}</ol>
      <div class="mk-nav">${wrong ? `<button type="button" data-mk="cards">${esc(t('mk_cards'))}</button>` : ''}<button type="button" class="primary" data-mk="close">${esc(t('mk_close'))}</button></div></div>`;
  }
  function closeAll() {
    if (result) {
      const by = {}; result.items.forEach(q => { (by[q.src] = by[q.src] || [0, 0])[1]++; if (q.right) by[q.src][0]++; });
      S.mocks = [{ id: uid(), at: result.at, score: scoreOf(), n: result.items.length, mins: result.mins, names: result.names, by }, ...(S.mocks || [])].slice(0, 20); save();
    }
    run = null; result = null; clearInterval(tickT); ov.hidden = true; ov.innerHTML = ''; document.documentElement.classList.remove('mk-on');
    if (S.tab === 'subjects') renderCard();
  }
  function mistakesToCards() {
    const D = S.study, name = t('mk_deck'); let deck = D.decks.find(d => d.name === name);
    const miss = result.items.filter(q => !q.right); if (!miss.length) return;
    if (!deck) { deck = { id: uid(), name, created: Date.now() }; D.decks.push(deck); }
    let n = 0;
    miss.forEach(q => {
      if (q.cardId) { const c = D.cards.find(x => x.id === q.cardId); if (c) { c.due = today(); n++; } return; } // an existing card just comes back for review
      D.cards.push({ id: uid(), deck: deck.id, front: q.prompt.slice(0, 500), back: q.answer.slice(0, 500), due: today(), ivl: 0, ease: 2.5, reps: 0, lapses: 0, created: Date.now() }); n++;
    });
    save(); toast(t('mk_cards_ok', { n, d: name }), { ms: 6000 });
  }
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mkMark !== undefined) { result.items[+b.dataset.mkMark].right = b.dataset.v === '1'; renderResult(); return; }
    const a = b.dataset.mk;
    if (a === 'prev' || a === 'next') { keep(); run.i += a === 'next' ? 1 : -1; renderRun(); }
    else if (a === 'cards') { mistakesToCards(); b.disabled = true; }
    else if (a === 'close') closeAll();
  });
  ov.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'mk-a' && e.target.tagName === 'INPUT' && run && run.i < run.items.length - 1) { e.preventDefault(); keep(); run.i++; renderRun(); }
    e.stopPropagation(); // the app's single-key shortcuts stay out of an exam
  });
  $('subjects').addEventListener('submit', e => {
    if (e.target.id !== 'mk-form') return;
    e.preventDefault(); e.stopPropagation();
    const pick = k => [...e.target.querySelectorAll(`[data-mk-${k}]:checked`)].map(x => x.getAttribute('data-mk-' + k));
    const deckIds = pick('deck'), docIds = pick('doc');
    if (!deckIds.length && !docIds.length) { toast(t('mk_pick')); return; }
    const items = build(deckIds, docIds, +$('mk-n').value); if (items.length < 3) { toast(t('mk_empty')); return; }
    const names = [...new Set(items.map(q => q.src))];
    open(items, Math.max(1, Math.min(240, +$('mk-mins').value || 30)), names);
  }, true);
  ML.mockCard = renderCard;
})();
