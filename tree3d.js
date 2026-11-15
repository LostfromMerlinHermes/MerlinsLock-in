// Premium trees in volume (3.91, proposals/suite-3d picks V1 A1 A2 A3): bonsai, cherry and ginkgo. Each tree is grown
// once in 3D from a fixed seed, then projected and painted on a 2D canvas (painter's sort, one warm light from the top
// right, depth haze). No library. The year's weeks decide what shows: bonsai pads, cherry blossoms, ginkgo leaves.
// They plug into ML.TreeArt.paint like the other skins (thumbnails, phone home, end screen keep working), and
// ML.Tree3D.live(canvas, …) adds turning: drag sideways (vertical swipes still scroll), a slow turn at rest, still during
// a session, with reduced motion and in the Plain look.
(() => {
  'use strict';
  const A = ML.TreeArt; if (!A) return;
  const { S, on } = ML;
  const TAU = Math.PI * 2;
  const rng = seed => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function turn(dir, ang, phi) {
    const v = Math.abs(dir[1]) < .9 ? [0, 1, 0] : [1, 0, 0], p1 = norm(cross(dir, v)), p2 = cross(dir, p1);
    const s = Math.sin(ang), c = Math.cos(ang), cp = Math.cos(phi), sp = Math.sin(phi);
    return norm([dir[0] * c + (p1[0] * cp + p2[0] * sp) * s, dir[1] * c + (p1[1] * cp + p2[1] * sp) * s, dir[2] * c + (p1[2] * cp + p2[2] * sp) * s]);
  }
  const randDir = r => norm([r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]);
  const hexRgb = h => (/^#[0-9a-f]{6}$/i.test(h || '') ? [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)) : null);
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  /* ---------- Shapes, grown once ---------- */
  const SLOTS = { bonsai: 12, ginkgo: 20 };
  function growBonsai() { // an S-shaped trunk in a glazed bowl, twelve branches, each ending in a flat pad of needles
    const r = rng(11), segs = [], pads = [];
    const curve = t => [.2 * Math.sin(t * Math.PI * 1.25) - .06 * t, t * .82, .07 * Math.sin(t * Math.PI * 2)];
    const nodes = [], N = 9;
    segs.push({ a: [-.05, 0, 0], b: [.08, .09, 0], r0: .11, r1: .08, d: 0, slot: -1 });
    for (let i = 0; i < N; i++) {
      const a = curve(i / N), b = curve((i + 1) / N);
      segs.push({ a, b, r0: .085 * Math.pow(.88, i) + .008, r1: .085 * Math.pow(.88, i + 1) + .008, d: i * .38, slot: -1 });
      nodes.push(b);
    }
    [2, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8].forEach((ni, k) => { // slot k = the k-th twelfth of the year (one week each while the year is short)
      const phi = k * 2.399 + (k % 2 ? Math.PI : 0) * .5;
      let d = norm([Math.cos(phi), .12 - (ni < 5 ? .12 : 0), Math.sin(phi) * .8]), p = nodes[ni], rr = .045 - ni * .003;
      const L = (.5 - ni * .035) * (k > 9 ? .6 : 1);
      for (let s = 0; s < 3; s++) {
        const nd = norm(add(turn(d, .22, r() * TAU), [0, s === 2 ? .3 : -.04, 0])), e = add(p, mul(nd, L / 3));
        segs.push({ a: p, b: e, r0: rr, r1: rr * .72, d: 3.4 + s * .25, slot: k }); p = e; d = nd; rr *= .72;
      }
      const rx = .2 + r() * .07, needles = [];
      for (let j = 0; j < 150; j++) {
        const a = r() * TAU, rd = Math.sqrt(r()), h = (1 - rd * rd) * .07 + r() * .02;
        needles.push({ o: [Math.cos(a) * rd * rx, h * 1.3, Math.sin(a) * rd * rx * .9], n: norm([r() - .5, 1.4, r() - .5]), s: 2.4 + r() * 1.8, sh: r(), rot: r() * Math.PI });
      }
      pads.push({ c: add(p, [0, .04, 0]), slot: k, needles });
    });
    return { segs, pads, maxD: 5, bark: [118, 92, 70], pot: true, crown: [0, .8, 0], zoom: 1.45 };
  }
  function growCherry() { // wide and spreading; every branch tip holds a cluster of blossoms and a few leaves
    const r = rng(5), segs = [], tips = [];
    function br(p, dir, len, rad, d) {
      const mid = add(p, add(mul(dir, len * .5), mul(randDir(r), len * .07))), end = add(mid, mul(norm(add(dir, mul(randDir(r), .12))), len * .5));
      segs.push({ a: p, b: mid, r0: rad, r1: rad * .9, d }); segs.push({ a: mid, b: end, r0: rad * .9, r1: rad * .78, d: d + .5 });
      if (d >= 5) { tips.push(end); return; }
      const n = d < 1 ? 3 : 2 + (r() < .4 ? 1 : 0), phi0 = r() * TAU;
      for (let i = 0; i < n; i++) {
        let nd = turn(dir, (d === 0 ? .62 : .42) + r() * .32, phi0 + i * TAU / n + r() * .5);
        nd = norm(add(nd, [0, .06 - d * .03, 0]));
        br(end, nd, len * (.74 + r() * .12), rad * .74, d + 1);
      }
    }
    br([0, 0, 0], [0, 1, 0], .62, .12, 0);
    const clusters = tips.map((t, k) => {
      const bits = [];
      for (let j = 0; j < 34; j++) {
        const o = mul(randDir(r), .06 + r() * .2), pink = r();
        bits.push({ p: add(t, [o[0], o[1] * .7 + .04, o[2]]), n: randDir(r), s: 3 + r() * 2.2, leaf: pink >= .82, tone: r() });
      }
      return { t, k, bits, h: r() };
    });
    return { segs, clusters, maxD: 6, bark: [70, 48, 44], pot: false, crown: [0, 1.35, 0] };
  }
  function growGinkgo() { // upright and conical; side branches in tiers, short shoots with fans of leaves
    const r = rng(3), segs = [], branches = [];
    let p = [0, 0, 0], dir = [0, 1, 0], rad = .085;
    const H = 12;
    for (let i = 0; i < H; i++) {
      const nd = norm(add(dir, [(r() - .5) * .1, 0, (r() - .5) * .1])), e = add(p, mul(nd, .19));
      segs.push({ a: p, b: e, r0: rad, r1: rad * .92, d: i * .45, slot: i < 3 ? -1 : (i - 3) * 2 }); // the trunk rises with its tiers
      if (i > 1) {
        const phi0 = i * 2.399;
        for (let j = 0; j < 2; j++) {
          let bd = turn([0, 1, 0], 1.05 + r() * .25, phi0 + j * Math.PI + r() * .4);
          const L = (1 - i / H) * .75 + .12, slot = branches.length, leaves = [];
          let q = e, rr = rad * .45;
          for (let s = 0; s < 3; s++) {
            const nd2 = norm(add(bd, [0, .12, 0])), e2 = add(q, mul(nd2, L / 3));
            segs.push({ a: q, b: e2, r0: rr, r1: rr * .75, d: i * .45 + .5 + s * .3, slot });
            for (let f = 0; f < 15; f++) {
              const o = add(mul(randDir(r), .05 + r() * .06), [0, .03, 0]);
              leaves.push({ p: add(add(q, mul(nd2, (L / 3) * r())), o), n: randDir(r), s: 3.2 + r() * 1.8, rot: r() * TAU, tone: r(), keep: r() });
            }
            q = e2; bd = nd2; rr *= .75;
          }
          branches.push({ slot, tip: q, leaves, d: i * .45 + 1 });
        }
      }
      p = e; dir = nd; rad *= .92;
    }
    return { segs, branches, maxD: H * .45 + 1.6, bark: [96, 86, 74], pot: false, crown: [0, 1.2, 0] };
  }
  const GROW = { bonsai: growBonsai, cherry: growCherry, ginkgo: growGinkgo };
  const GEO = {};
  const geo = k => GEO[k] || (GEO[k] = GROW[k]());

  /* ---------- What the year says ---------- */
  const minsOf = w => (w.mins != null ? w.mins : (w.s || 0) * 40); // the shop's sample year has sessions only
  function slotsOf(weeks, n) { // slot k = a run of weeks: one week each for the first n weeks, then several
    const L = Math.max(n, weeks.length), out = [];
    for (let k = 0; k < n; k++) {
      const a = Math.floor(k * L / n), b = Math.floor((k + 1) * L / n), ws = weeks.slice(a, b), worked = ws.filter(w => !w.empty && (w.s || 0) > 0);
      const top = worked.slice().sort((x, y) => minsOf(y) - minsOf(x))[0];
      out.push({ open: a < weeks.length, worked: worked.length > 0, mins: worked.reduce((s, w) => s + minsOf(w), 0), pal: top && top.pal, weeks: ws.map(w => w.i) });
    }
    return out;
  }
  const todayCount = () => { const k = ML.today(); return (S.sessions || []).filter(s => ML.dayKey(new Date(s.at)) === k).length; };
  const monthDays = () => { const d = new Date(), from = new Date(d.getFullYear(), d.getMonth(), 1).getTime(); return new Set((S.sessions || []).filter(s => s.at >= from).map(s => ML.dayKey(new Date(s.at)))).size; };
  const seasonNow = () => [1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1][new Date().getMonth()]; // 0 autumn, 1 winter, 2 spring, 3 summer

  /* ---------- Painting ---------- */
  const LIGHT = norm([.55, .62, -.55]), PITCH = .2, CAMD = 5.5, BG = [20, 15, 10];
  const col = (c, k, fog) => `rgb(${(c[0] * k * (1 - fog) + BG[0] * fog) | 0},${(c[1] * k * (1 - fog) + BG[1] * fog) | 0},${(c[2] * k * (1 - fog) + BG[2] * fog) | 0})`;
  function view(p, cy, sy) {
    const x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy, cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    return [x1, p[1] * cp + z1 * sp, -p[1] * sp + z1 * cp];
  }
  function paint3d(g, skin, weeks, o, yaw, live) {
    const T = geo(skin), W = g.canvas.width, H = g.canvas.height;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    let gr = g.createRadialGradient(W * .78, H * .1, 10, W * .6, H * .4, Math.max(W, H) * .9);
    gr.addColorStop(0, '#3a2a1a'); gr.addColorStop(1, '#120d08'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const hours = weeks.reduce((a, w) => a + minsOf(w), 0) / 60;
    const grow = Math.min(1, .3 + hours / 250 * .7), D = T.pot ? 99 : grow * (T.maxD + .8), sz = (.55 + .45 * grow) * (T.zoom || 1);
    const scale = Math.min(H * .34, W * .42), cx = W * .5, base = H * (T.pot ? .78 : .86), cy = Math.cos(yaw), sy = Math.sin(yaw), lk = scale / 150;
    const proj = p => { const v = view(mul(p, sz), cy, sy), k = CAMD / (CAMD + v[2]); return [cx + v[0] * scale * k, base - v[1] * scale * k, v[2], k]; };
    const crownV = view(mul(T.crown, sz), cy, sy);
    const shadeAt = (p, n) => { const pv = view(mul(p, sz), cy, sy), out = norm([pv[0] - crownV[0], pv[1] - crownV[1], pv[2] - crownV[2]]); return .42 + .38 * (dot(out, LIGHT) * .5 + .5) + .22 * Math.abs(dot(view(n, cy, sy), LIGHT)); };
    // ground and shadow
    const gw = scale * (T.pot ? .9 : 1.25);
    gr = g.createRadialGradient(cx, base, 2, cx, base, gw); gr.addColorStop(0, 'rgba(60,44,28,.9)'); gr.addColorStop(1, 'rgba(60,44,28,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, base, gw, gw * .2, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx - scale * .18, base + 2, scale * .55 * sz, scale * .08, 0, 0, TAU); g.fill();
    if (T.pot) pot(g, cx, base, scale);
    const items = [], hits = [], season = seasonNow(), today = todayCount();
    const slots = SLOTS[skin] ? slotsOf(weeks, SLOTS[skin]) : null;
    for (const s of T.segs) {
      if (s.d >= D) continue;
      if (slots && s.slot >= 0 && !slots[s.slot].open) continue; // a branch for weeks still to come
      const f = Math.min(1, D - s.d), b = f < 1 ? add(s.a, mul(add(s.b, mul(s.a, -1)), f)) : s.b, P = proj(s.a), Q = proj(b);
      items.push({ z: (P[2] + Q[2]) / 2, t: 0, P, Q, r0: s.r0 * sz * scale * P[3], r1: s.r1 * sz * scale * Q[3] });
    }
    const leaf = (p, n, s, c, kind, extra) => { const P = proj(p); items.push(Object.assign({ z: P[2], t: 1, P, c, kind, s: s * P[3] * lk, sh: shadeAt(p, n) }, extra)); };
    if (skin === 'bonsai') {
      T.pads.forEach(pd => {
        const sl = slots[pd.slot]; if (!sl.open || !sl.worked) return; // the bonsai is shaped from the start: its pads say the weeks, its size the hours
        const k = Math.max(.6, Math.min(1.15, .55 + Math.sqrt(sl.mins / 60) * .14)), pal = hexRgb(sl.pal && sl.pal[2]);
        const n = Math.round(pd.needles.length * Math.min(1, .45 + sl.mins / 600));
        for (let j = 0; j < n; j++) { const q = pd.needles[j], base3 = pal ? mix3([76, 120, 60], pal, .35) : [70 + q.sh * 22, 112 + q.sh * 28, 56 + q.sh * 14]; leaf(add(pd.c, mul(q.o, k)), q.n, q.s, base3, 'needle', { rot: q.rot }); }
        const C = proj(add(pd.c, [0, .06, 0])); sl.weeks.forEach(i => hits.push({ i, x: C[0], y: C[1] }));
      });
      // buds: one pale bud per session today (8 at most) on the newest pad
      const last = T.pads.filter(pd => slots[pd.slot].open && slots[pd.slot].worked).pop();
      if (last) for (let j = 0; j < Math.min(8, today); j++) { const q = last.needles[(j * 17) % last.needles.length]; leaf(add(last.c, add(q.o, [0, .025, 0])), [0, 1, 0], 3.4, [214, 228, 168], 'bud'); }
    } else if (skin === 'cherry') {
      const worked = weeks.filter(w => !w.empty && w.s > 0), bloom = Math.min(1, .15 + hours / 150), len = Math.max(1, weeks.length);
      T.clusters.forEach(cl => {
        if (cl.h > bloom || D < 5) return;
        const w = weeks[cl.k % len], pal = hexRgb(w && w.pal && w.pal[2]), bright = cl.k < T.clusters.length && cl.rank < Math.min(8, today);
        cl.bits.forEach(b => {
          const c = b.leaf ? (pal ? mix3([120, 150, 90], pal, .4) : [120, 150, 90]) : [242, 190 + b.tone * 25, 205 + b.tone * 20];
          leaf(b.p, b.n, b.s * (bright && !b.leaf ? 1.15 : 1), c, b.leaf ? 'leaf' : 'blossom', { glow: bright && !b.leaf });
        });
        if (w && worked.length) { const C = proj(cl.t); hits.push({ i: w.i, x: C[0], y: C[1] }); }
      });
      // petals on the ground: a handful per session today, until tomorrow
      const R = rng(ML.today().split('-').join('') | 0);
      for (let j = 0; j < Math.min(8, today) * 12; j++) { const a = R() * TAU, d = .2 + Math.sqrt(R()) * .9; items.push({ z: proj([Math.cos(a) * d, 0, Math.sin(a) * d])[2], t: 2, p: [Math.cos(a) * d, 0, Math.sin(a) * d], c: [236, 196, 208], rot: R() * 3, s: .8 }); }
    } else {
      const green = season === 2 ? [150, 180, 80] : [110, 150, 66], gold = [226, 178, 52];
      T.branches.forEach(bh => {
        const sl = slots[bh.slot]; if (!sl.open || !sl.worked || bh.d > D + .2) return;
        const pal = hexRgb(sl.pal && sl.pal[2]), n = Math.round(bh.leaves.length * Math.min(1, .4 + sl.mins / 400));
        for (let j = 0; j < n; j++) {
          const q = bh.leaves[j];
          if (season === 1 && q.keep > .3) continue; // winter: most leaves have fallen
          let c = season === 0 || season === 1 ? (q.tone < .85 ? [gold[0], gold[1] + q.tone * 30, gold[2]] : [170, 160, 70]) : (q.tone < .9 ? [green[0] + q.tone * 30, green[1], green[2]] : [190, 170, 70]);
          if (pal) c = mix3(c, pal, .3);
          leaf(q.p, q.n, q.s, c, 'fan', { rot: q.rot });
        }
        const C = proj(bh.tip); sl.weeks.forEach(i => hits.push({ i, x: C[0], y: C[1] }));
      });
      // the carpet: a handful of fallen leaves per day worked this month
      const R = rng(7), n = Math.min(31, monthDays()) * 12, fall = season === 0 || season === 1 ? [214, 168, 58] : [150, 150, 72];
      for (let j = 0; j < n; j++) { const a = R() * TAU, d = .15 + Math.sqrt(R()) * .95, p = [Math.cos(a) * d, 0, Math.sin(a) * d]; items.push({ z: proj(p)[2], t: 2, p, c: fall, rot: R() * 3, s: 1.1 }); }
    }
    if (live && live.parts) live.parts.forEach(q => items.push({ z: proj(q.p)[2], t: 2, p: q.p, c: q.c, rot: q.rot, s: q.s, fly: 1 }));
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      const fog = Math.max(0, Math.min(.5, (it.z + .6) / 2.4 * .5));
      if (it.t === 0) seg(g, it, T.bark, fog);
      else if (it.t === 1) drawLeaf(g, it, fog, yaw);
      else { const P = proj(it.p); g.fillStyle = col(it.c, it.fly ? .9 : .75, fog); g.beginPath(); g.ellipse(P[0], P[1], 3.2 * P[3] * it.s * lk, (it.fly ? 2.2 : 1.2) * P[3] * it.s * lk, it.rot, 0, TAU); g.fill(); }
    }
    g.restore();
    return hits;
  }
  function seg(g, it, bark, fog) {
    const { P: A2, Q: B, r0, r1 } = it, dx = B[0] - A2[0], dy = B[1] - A2[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, lit = (nx * .7 - ny * .7) > 0 ? 1 : -1;
    g.fillStyle = col(bark, .62, fog);
    g.beginPath(); g.moveTo(A2[0] + nx * r0, A2[1] + ny * r0); g.lineTo(B[0] + nx * r1, B[1] + ny * r1); g.lineTo(B[0] - nx * r1, B[1] - ny * r1); g.lineTo(A2[0] - nx * r0, A2[1] - ny * r0); g.closePath(); g.fill();
    g.beginPath(); g.arc(B[0], B[1], r1, 0, TAU); g.fill(); // the joint: the next piece starts inside this cap
    if (r0 > 1.4) {
      g.strokeStyle = col(bark, 1.12, fog); g.lineCap = 'round'; g.lineWidth = (r0 + r1) / 2 * .75;
      g.beginPath(); g.moveTo(A2[0] + nx * r0 * .42 * lit, A2[1] + ny * r0 * .42 * lit); g.lineTo(B[0] + nx * r1 * .42 * lit, B[1] + ny * r1 * .42 * lit); g.stroke();
    }
  }
  function drawLeaf(g, it, fog, yaw) {
    const { P, s } = it;
    g.fillStyle = col(it.c, it.kind === 'bud' ? 1 : it.sh * (it.glow ? 1.12 : 1), fog);
    g.beginPath();
    if (it.kind === 'fan') { const a = it.rot + yaw * .6; g.moveTo(P[0], P[1]); g.arc(P[0], P[1], s * 1.3, a - .7, a + .7); g.closePath(); }
    else if (it.kind === 'needle') g.ellipse(P[0], P[1], s * 1.25, s * .55, (it.rot + yaw * .3) % Math.PI, 0, TAU);
    else g.arc(P[0], P[1], s, 0, TAU);
    g.fill();
    if (it.glow || it.kind === 'bud') { g.fillStyle = 'rgba(255,244,236,.55)'; g.beginPath(); g.arc(P[0], P[1], s * .45, 0, TAU); g.fill(); }
  }
  function pot(g, cx, base, scale) {
    const w = scale * .62, h = scale * .26, top = base - h * .05;
    const gr = g.createLinearGradient(cx - w, 0, cx + w, 0);
    gr.addColorStop(0, '#1c2a33'); gr.addColorStop(.62, '#3d5866'); gr.addColorStop(.78, '#5d7d8a'); gr.addColorStop(1, '#22323b');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(cx - w, top); g.lineTo(cx - w * .86, top + h); g.ellipse(cx, top + h, w * .86, w * .1, 0, Math.PI, 0, true); g.lineTo(cx + w, top); g.closePath(); g.fill();
    g.fillStyle = '#4a6774'; g.beginPath(); g.ellipse(cx, top, w, w * .12, 0, 0, TAU); g.fill();
    g.fillStyle = '#2b1f15'; g.beginPath(); g.ellipse(cx, top + 1, w * .9, w * .095, 0, 0, TAU); g.fill();
    g.fillStyle = '#1a262e'; [-.6, .6].forEach(f => g.fillRect(cx + w * f - scale * .03, top + h + w * .06, scale * .06, scale * .035));
  }
  // cherry: which clusters get today's brighter blossoms (the ones nearest the viewer at rest)
  { const c = geo('cherry').clusters; c.slice().sort((a, b) => a.t[2] - b.t[2]).forEach((cl, i) => { cl.rank = i; }); }

  /* ---------- Plugged into the tree art ---------- */
  const K3 = { bonsai: 1, cherry: 1, ginkgo: 1 }, YAW0 = .6;
  const basePaint = A.paint;
  A.paint = (g, skin, weeks, o = {}) => (K3[skin] ? paint3d(g, skin, weeks, o, YAW0, null) : basePaint(g, skin, weeks, o));
  Object.keys(K3).forEach(k => { if (!A.SKINS.includes(k)) A.SKINS.push(k); });

  /* ---------- Turning ---------- */
  const LIVE = new Map();
  const still = () => ML.reducedMotion() || !!(ML.running && ML.running()) || !!(ML.sober && ML.sober());
  function bind(cv, s) {
    cv.style.touchAction = 'pan-y';
    cv.addEventListener('pointerdown', e => { s.drag = { x: e.clientX, x0: e.clientX, t: performance.now() }; s.moved = false; s.vel = 0; });
    cv.addEventListener('pointermove', e => {
      const d = s.drag; if (!d) return;
      if (!s.moved && Math.abs(e.clientX - d.x0) > 6) { s.moved = true; try { cv.setPointerCapture(e.pointerId); } catch (err) {} }
      if (!s.moved) { d.x = e.clientX; return; }
      const now = performance.now(), k = 3.4 / Math.max(200, cv.clientWidth), dyaw = (e.clientX - d.x) * k;
      s.yaw += dyaw; s.vel = dyaw / Math.max(8, now - d.t) * 16; d.x = e.clientX; d.t = now; s.dirty = true; start(cv, s);
    });
    const up = () => { s.drag = null; start(cv, s); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    // a drag is not a tap: the week picker and the You home button ignore it
    cv.addEventListener('click', e => { if (s.moved) { e.stopImmediatePropagation(); e.preventDefault(); s.moved = false; } }, true);
  }
  function start(cv, s) { if (!s.raf) s.raf = requestAnimationFrame(now => frame(cv, s, now)); }
  function frame(cv, s, now) {
    s.raf = 0;
    if (!cv.isConnected || !cv.offsetParent || document.hidden || !s.args) { s.last = 0; return; } // resumes on the next live() or touch
    const dt = s.last ? Math.min(50, now - s.last) : 16; s.last = now;
    const coast = !s.drag && Math.abs(s.vel) > .0004, auto = !s.drag && !coast && !still();
    if (coast) { s.yaw += s.vel; s.vel *= .93; s.dirty = true; }
    else if (auto && now - (s.painted || 0) > 40) { s.yaw += Math.min(120, now - (s.painted || now)) * .00008; s.dirty = true; } // about a turn every 80 s, 25 frames a second
    if (s.parts.length) {
      s.parts.forEach(q => { q.ph += .05; q.p[0] += q.v[0] + Math.sin(q.ph) * .002; q.p[1] += q.v[1] * dt / 16; q.p[2] += q.v[2] + Math.cos(q.ph) * .002; q.rot += .04; });
      s.parts = s.parts.filter(q => q.p[1] > 0); s.dirty = true;
    }
    if (s.dirty) { const h = paint3d(cv.getContext('2d'), s.args[0], s.args[1], s.args[2], s.yaw, s); s.dirty = false; s.painted = now; if (s.onHits) s.onHits(h); }
    if (s.drag || coast || auto || s.parts.length) start(cv, s);
  }
  // A session ended since this tree was last seen: blossoms or leaves come down once (not for the bonsai: it buds)
  function fall(s, skin) {
    if (ML.reducedMotion() || skin === 'bonsai') return;
    const T = geo(skin), src = skin === 'cherry' ? T.clusters.flatMap(c => c.bits.filter(b => !b.leaf)) : T.branches.flatMap(b => b.leaves);
    const sz = 1, c = skin === 'cherry' ? [240, 200, 212] : seasonNow() < 2 ? [226, 180, 60] : [140, 160, 70], r = Math.random;
    for (let i = 0; i < (skin === 'cherry' ? 60 : 30); i++) { const b = src[(r() * src.length) | 0]; s.parts.push({ p: mul(b.p, sz), v: [(r() - .5) * .004, -.004 - r() * .004, (r() - .5) * .004], rot: r() * 3, s: skin === 'cherry' ? .8 : 1.1, c, ph: r() * TAU }); }
  }
  ML.Tree3D = {
    is: k => !!K3[k],
    // Paint `skin` on `cv` and keep it turning; onHits(h) gets the week positions after every repaint
    live(cv, skin, weeks, o, onHits) {
      let s = LIVE.get(cv);
      if (!s) { s = { yaw: YAW0, vel: 0, parts: [], seen: todayCount() }; LIVE.set(cv, s); bind(cv, s); }
      const n = todayCount(); if (n > s.seen && s.args && s.args[0] === skin) fall(s, skin); s.seen = n;
      s.args = [skin, weeks, o]; s.onHits = onHits; s.dirty = true; start(cv, s);
    },
    stop(cv) { const s = LIVE.get(cv); if (s) s.args = null; },
  };
  const wake = () => LIVE.forEach((s, cv) => { if (s.args) start(cv, s); });
  on('timer', wake); on('motion', wake); on('tab', wake);
  document.addEventListener('visibilitychange', wake);
})();
