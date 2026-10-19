// A small LaTeX → MathML converter for formulas in the Notebook. Browsers render MathML natively,
// so no library or font is needed (the extension can't load remote scripts anyway).
// Supports: fractions, roots, powers/indices, sums/integrals/limits, Greek letters, common symbols,
// functions (sin, log…), \text{}, \left( \right), matrices are out of scope.
(() => {
  'use strict';
  const NS = 'http://www.w3.org/1998/Math/MathML';
  const GREEK = 'alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho sigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split(' ');
  const GREEK_CH = 'α β γ δ ϵ ε ζ η θ ϑ ι κ λ μ ν ξ π ϖ ρ σ τ υ ϕ φ χ ψ ω Γ Δ Θ Λ Ξ Π Σ Υ Φ Ψ Ω'.split(' ');
  const SYM = {
    times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝',
    infty: '∞', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔', mapsto: '↦',
    partial: '∂', nabla: '∇', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', supset: '⊃', cup: '∪', cap: '∩', emptyset: '∅', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
    ldots: '…', cdots: '⋯', dots: '…', circ: '∘', degree: '°', prime: '′', angle: '∠', perp: '⊥', parallel: '∥', mid: '|',
    sum: '∑', prod: '∏', int: '∫', iint: '∬', oint: '∮', lim: 'lim', max: 'max', min: 'min',
    langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', ',': ' ', ';': ' ', quad: ' ', qquad: '  ', '{': '{', '}': '}', '%': '%', '$': '$', '#': '#', '&': '&',
  };
  const BIG = new Set(['sum', 'prod', 'int', 'iint', 'oint', 'lim', 'max', 'min']);
  const FUN = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp', 'det', 'gcd', 'dim', 'ker']);

  function tokenize(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        out.push({ k: 'cmd', v: m[1] }); i += m[0].length;
      } else if (/\s/.test(c)) i++;
      else if (/[0-9.]/.test(c)) { const m = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(s.slice(i)); out.push({ k: 'num', v: m[0] }); i += m[0].length; }
      else { out.push({ k: 'ch', v: c }); i++; }
    }
    return out;
  }
  // Parser: builds a tiny tree [tag, attrs, ...children] that becomes MathML elements
  function parse(src) {
    const tk = tokenize(src); let p = 0;
    const peek = () => tk[p], next = () => tk[p++];
    function group() { // {…} or a single atom
      const t = peek(); if (!t) return ['mrow', {}];
      if (t.k === 'ch' && t.v === '{') { next(); const kids = seq('}'); return ['mrow', {}, ...kids]; }
      return atom();
    }
    function optArg() { if (peek() && peek().k === 'ch' && peek().v === '[') { next(); const kids = seq(']'); return ['mrow', {}, ...kids]; } return null; }
    function textArg() { // \text{…}: raw characters up to the closing brace
      if (!(peek() && peek().v === '{')) return '';
      next(); let s = '', depth = 1;
      while (p < tk.length) { const t = next(); if (t.v === '{') depth++; if (t.v === '}' && --depth === 0) break; s += t.k === 'cmd' ? (SYM[t.v] || t.v) : t.v; }
      return s;
    }
    function atom() {
      const t = next(); if (!t) return ['mrow', {}];
      if (t.k === 'num') return ['mn', {}, t.v];
      if (t.k === 'ch') {
        if (/[a-zA-Z]/.test(t.v)) return ['mi', {}, t.v];
        if (t.v === '{') { const kids = seq('}'); return ['mrow', {}, ...kids]; }
        return ['mo', {}, { '*': '·', '-': '−', "'": '′' }[t.v] || t.v];
      }
      const c = t.v;
      if (c === 'frac' || c === 'dfrac' || c === 'tfrac') { const a = group(), b = group(); return ['mfrac', {}, a, b]; }
      if (c === 'sqrt') { const n = optArg(), a = group(); return n ? ['mroot', {}, a, n] : ['msqrt', {}, a]; }
      if (c === 'text' || c === 'mathrm' || c === 'textrm') return ['mtext', {}, textArg()];
      if (c === 'mathbb') { const s = textArg(); return ['mi', { mathvariant: 'double-struck' }, s]; }
      if (c === 'vec') { const a = group(); return ['mover', { accent: 'true' }, a, ['mo', {}, '→']]; }
      if (c === 'bar' || c === 'overline') { const a = group(); return ['mover', { accent: 'true' }, a, ['mo', {}, '¯']]; }
      if (c === 'hat') { const a = group(); return ['mover', { accent: 'true' }, a, ['mo', {}, '^']]; }
      if (c === 'left' || c === 'right') { const d = next(); return ['mo', { stretchy: 'true' }, d ? (d.k === 'cmd' ? (SYM[d.v] || d.v) : d.v === '.' ? '' : d.v) : '']; }
      const gi = GREEK.indexOf(c); if (gi >= 0) return ['mi', {}, GREEK_CH[gi]];
      if (FUN.has(c)) return ['mi', {}, c];
      if (BIG.has(c)) return ['mo', { largeop: 'true', movablelimits: 'false', big: c }, SYM[c]];
      if (SYM[c] != null) return ['mo', {}, SYM[c]];
      return ['mi', {}, '\\' + c];
    }
    function withScripts(base) {
      let sub = null, sup = null;
      for (;;) {
        const t = peek(); if (!t || t.k !== 'ch' || (t.v !== '_' && t.v !== '^')) break;
        next(); const g = group();
        if (t.v === '_') sub = g; else sup = g;
      }
      if (!sub && !sup) return base;
      const big = base[0] === 'mo' && base[1].big;
      if (big) { delete base[1].big; return sub && sup ? ['munderover', {}, base, sub, sup] : sub ? ['munder', {}, base, sub] : ['mover', {}, base, sup]; }
      return sub && sup ? ['msubsup', {}, base, sub, sup] : sub ? ['msub', {}, base, sub] : ['msup', {}, base, sup];
    }
    function seq(end) {
      const kids = [];
      while (p < tk.length) {
        const t = peek();
        if (end && t.k === 'ch' && t.v === end) { next(); break; }
        kids.push(withScripts(atom()));
      }
      return kids;
    }
    return ['math', {}, ['mrow', {}, ...seq(null)]];
  }
  function build(node) {
    if (typeof node === 'string') return document.createTextNode(node);
    const [tag, attrs, ...kids] = node, el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (k !== 'big') el.setAttribute(k, v);
    kids.forEach(k => el.appendChild(build(k)));
    return el;
  }
  // Returns a <span class="math" data-tex="…"> holding the rendered formula
  ML.texToMath = (tex, display) => {
    const span = document.createElement('span');
    span.className = 'math'; span.dataset.tex = tex;
    try { const m = build(parse(tex)); if (display) m.setAttribute('display', 'block'); span.appendChild(m); }
    catch (e) { span.textContent = tex; }
    return span;
  };
  ML.MATHML_TAGS = new Set(['MATH', 'MROW', 'MI', 'MN', 'MO', 'MFRAC', 'MSQRT', 'MROOT', 'MSUP', 'MSUB', 'MSUBSUP', 'MUNDER', 'MOVER', 'MUNDEROVER', 'MTEXT', 'MSPACE']);
  ML.MATHML_NS = NS;
})();
