// One object in volume per world (3.97, proposals/objets-3d, picks P1): a small canvas in the corner of the dial.
// A tiny engine of its own (flat polygons, round segments, balls, glows; painter's sort, one light from the top right),
// no library. The object turns very slowly at rest and can be turned by hand (drag sideways); it stands still during a
// session, with reduced motion and when the tab is hidden; nothing is drawn while nothing moves. One detail counts
// today's sessions (8 at most). The Plain look has no world, so no object. Setting: S.worldObj (Settings, on by default).
(() => {
  'use strict';
  const { S, on, t, esc, save } = ML;
  ML.defaults(() => ({ worldObj: true }));
  ML.addStrings({
    fr: { wo_set: 'Objet du monde', wo_hint: 'Un petit objet en volume dans le coin du cadran. Il tourne lentement au repos et s’arrête pendant une séance.', wo_aria: 'Objet du monde, à faire tourner' },
    en: { wo_set: 'World object', wo_hint: 'A small object in volume in the corner of the dial. It turns slowly at rest and stops during a session.', wo_aria: 'World object, drag to turn' },
  });

  const TAU = Math.PI * 2, PI = Math.PI;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const id = p => p;
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return p => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
  const tr = (x, y, z) => p => [p[0] + x, p[1] + y, p[2] + z];
  const comp = (...f) => p => f.reduce((q, fn) => fn(q), p);
  const pick = (c, ...a) => (typeof c === 'function' ? c(...a) : c);

  /* ---------- Scene builder ---------- */
  function builder() {
    const it = [];
    const b = {
      it,
      poly(pts, c, o) { it.push(Object.assign({ t: 0, pts, c }, o)); },
      seg(p0, p1, r0, r1, c, o) { it.push(Object.assign({ t: 1, p0, p1, r0, r1, c }, o)); }, // the end points are p0 / p1: « a » is the alpha option
      ball(p, r, c, o) { it.push(Object.assign({ t: 2, p, r, c }, o)); },
      glow(p, r, c, a) { it.push({ t: 3, p, r, c, a: a == null ? .5 : a }); },
      tube(pts, r, c, o) { for (let i = 0; i < pts.length - 1; i++) b.seg(pts[i], pts[i + 1], pick(r, i), pick(r, i + 1), c, o); },
      lathe(prof, n, c, M = id, o = {}) {
        const ph = o.phase || 0;
        for (let i = 0; i < prof.length - 1; i++) {
          const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (!r0 && !r1) continue;
          for (let j = 0; j < n; j++) {
            const a0 = ph + j / n * TAU, a1 = ph + (j + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), pts = [];
            if (r0) pts.push([r0 * c0, y0, r0 * s0], [r0 * c1, y0, r0 * s1]); else pts.push([0, y0, 0]);
            if (r1) pts.push([r1 * c1, y1, r1 * s1], [r1 * c0, y1, r1 * s0]); else pts.push([0, y1, 0]);
            b.poly(pts.map(M), pick(c, i, j), o);
          }
        }
      },
      box(cx, cy, cz, sx, sy, sz, c, M = id, o) {
        const x = sx / 2, y = sy / 2, z = sz / 2, P = (i, j, k) => M([cx + i * x, cy + j * y, cz + k * z]);
        [[[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
          [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]]
          .forEach((f, k) => b.poly(f.map(v => P(v[0], v[1], v[2])), pick(c, k), o));
      },
      band(R, w, h, n, c, M = id, o) { // a flat ring: outer wall, top, bottom, inner wall
        const r = R - w, y = h / 2;
        for (let j = 0; j < n; j++) {
          const a0 = j / n * TAU, a1 = (j + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), col = pick(c, j);
          const q = (ra, ya, rb, yb) => b.poly([[ra * c0, ya, ra * s0], [ra * c1, ya, ra * s1], [rb * c1, yb, rb * s1], [rb * c0, yb, rb * s0]].map(M), col, o);
          q(R, -y, R, y); q(R, y, r, y); q(R, -y, r, -y); q(r, -y, r, y);
        }
      },
      octa(p, r, h, c, o, spin = 0) {
        const eq = [0, 1, 2, 3].map(k => add(p, [Math.cos(spin + k * PI / 2) * r, 0, Math.sin(spin + k * PI / 2) * r])), T = add(p, [0, h, 0]), B = add(p, [0, -h, 0]);
        for (let k = 0; k < 4; k++) { b.poly([eq[k], eq[(k + 1) % 4], T], c, o); b.poly([eq[k], eq[(k + 1) % 4], B], c, o); }
      },
      voxels(map, s, M = id) { // only the faces with no neighbour
        const D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        map.forEach((c, key) => {
          const [x, y, z] = key.split(',').map(Number);
          D.forEach(d => {
            if (map.has((x + d[0]) + ',' + (y + d[1]) + ',' + (z + d[2]))) return;
            const ax = d[0] ? 0 : d[1] ? 1 : 2, u = (ax + 1) % 3, v = (ax + 2) % 3, pts = [];
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(e => { const p = [x, y, z]; p[ax] += d[ax] * .5; p[u] += e[0] * .5; p[v] += e[1] * .5; pts.push(M(mul(p, s))); });
            b.poly(pts, c.c || c, c.em ? { em: c.em } : undefined);
          });
        });
      },
    };
    return b;
  }

  /* ---------- Painter ---------- */
  const LIGHT = norm([.5, .66, -.56]);
  function render(g, W, H, items, yaw, o) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), pitch = o.pitch == null ? .24 : o.pitch, cp = Math.cos(pitch), sp = Math.sin(pitch);
    const view = p => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy; return [x, p[1] * cp + z * sp, -p[1] * sp + z * cp]; };
    const S2 = Math.min(W, H) * (o.scale || .34), cx = W / 2, cyy = H * (o.cy || .52), CAM = 6, px = Math.max(1, W / 320);
    const pr = v => { const k = CAM / (CAM + v[2]); return [cx + v[0] * S2 * k, cyy - v[1] * S2 * k, k]; };
    const fog = o.fog || [0, 0, 0], fa = o.fogAmt || 0;
    const tone = (c, k, em, z) => {
      if (em) k = k + (1.08 - k) * em;
      if (o.palette) { const l = (c[0] * .3 + c[1] * .59 + c[2] * .11) / 255 * k, q = o.palette[Math.max(0, Math.min(3, Math.floor(l * 4.2)))]; return `rgb(${q[0]},${q[1]},${q[2]})`; }
      if (o.poster) k = Math.round(k * o.poster) / o.poster;
      const f = fa ? Math.max(0, Math.min(1, (z + .5) / 2.4)) * fa : 0;
      return `rgb(${Math.min(255, c[0] * k) * (1 - f) + fog[0] * f | 0},${Math.min(255, c[1] * k) * (1 - f) + fog[1] * f | 0},${Math.min(255, c[2] * k) * (1 - f) + fog[2] * f | 0})`;
    };
    const list = [];
    for (const it of items) {
      if (it.t === 0) {
        const vs = it.pts.map(view); let z = 0; vs.forEach(v => { z += v[2]; }); z /= vs.length;
        let n = norm(cross(sub(vs[1], vs[0]), sub(vs[2], vs[0]))); if (n[2] > 0) n = mul(n, -1);
        const d = Math.max(0, dot(n, LIGHT)), k = .36 + .74 * d + (it.spec ? it.spec * Math.pow(d, 14) : 0);
        list.push({ it, z: z - (it.bias || 0), P: vs.map(pr), k, zz: z });
      } else if (it.t === 1) { const a = view(it.p0), b = view(it.p1); list.push({ it, z: (a[2] + b[2]) / 2, A: pr(a), B: pr(b), zz: (a[2] + b[2]) / 2 }); }
      else { const v = view(it.p); list.push({ it, z: v[2] - (it.t === 3 ? .05 : 0), P: pr(v), zz: v[2] }); }
    }
    list.sort((a, b) => b.z - a.z);
    g.lineJoin = 'round';
    for (const L of list) {
      const it = L.it;
      if (it.t === 0) {
        const col = tone(it.c, L.k, it.em, L.zz);
        g.globalAlpha = it.a == null ? 1 : it.a; g.fillStyle = col;
        g.beginPath(); L.P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        if (o.edge && !it.noedge) { g.strokeStyle = o.edge; g.lineWidth = (o.edgeW || 1) * px; g.stroke(); }
        else if (it.a == null) { g.strokeStyle = col; g.lineWidth = .7 * px; g.stroke(); }
        g.globalAlpha = 1;
      } else if (it.t === 1) {
        const A = L.A, B = L.B, r0 = Math.max(.4 * px, it.r0 * S2 * A[2]), r1 = Math.max(.4 * px, it.r1 * S2 * B[2]);
        const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        g.globalAlpha = it.a == null ? 1 : it.a; g.fillStyle = tone(it.c, .7, it.em, L.zz);
        g.beginPath(); g.moveTo(A[0] + nx * r0, A[1] + ny * r0); g.lineTo(B[0] + nx * r1, B[1] + ny * r1); g.lineTo(B[0] - nx * r1, B[1] - ny * r1); g.lineTo(A[0] - nx * r0, A[1] - ny * r0); g.closePath(); g.fill();
        g.beginPath(); g.arc(B[0], B[1], r1, 0, TAU); g.fill(); g.beginPath(); g.arc(A[0], A[1], r0, 0, TAU); g.fill();
        if (r0 > 1.6 * px && !it.em && !o.palette && !o.poster) { const lit = (nx * .6 - ny * .7) > 0 ? 1 : -1; g.strokeStyle = tone(it.c, 1.12, 0, L.zz); g.lineCap = 'round'; g.lineWidth = (r0 + r1) * .32; g.beginPath(); g.moveTo(A[0] + nx * r0 * .4 * lit, A[1] + ny * r0 * .4 * lit); g.lineTo(B[0] + nx * r1 * .4 * lit, B[1] + ny * r1 * .4 * lit); g.stroke(); }
        g.globalAlpha = 1;
      } else if (it.t === 2) {
        const P = L.P, r = it.r * S2 * P[2];
        g.globalAlpha = it.a == null ? 1 : it.a;
        if (it.em || o.palette || o.poster) g.fillStyle = tone(it.c, .9, it.em, L.zz);
        else { const gr = g.createRadialGradient(P[0] + r * .35, P[1] - r * .4, r * .05, P[0], P[1], r); gr.addColorStop(0, tone(it.c, 1.25, 0, L.zz)); gr.addColorStop(1, tone(it.c, .45, 0, L.zz)); g.fillStyle = gr; }
        g.beginPath(); g.arc(P[0], P[1], r, 0, TAU); g.fill(); g.globalAlpha = 1;
      } else {
        const P = L.P, r = it.r * S2 * P[2], c = it.c, gr = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], r);
        gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${it.a})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        g.globalCompositeOperation = o.light ? 'source-over' : 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(P[0], P[1], r, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over';
      }
    }
  }

  /* ---------- The objects: build(b, sessions, time) ---------- */
  function armillary(b, n, t) { // Observatoire: brass rings on a tilted axis; one star on the ecliptic per session
    const brass = [208, 168, 94], pale = [236, 204, 132], dark = [142, 102, 54], at = tr(0, .18, 0), sp = { spec: .5 };
    b.lathe([[0, -1.24], [.5, -1.24], [.52, -1.17], [.3, -1.11], [.12, -1.03], [.07, -.92], [.12, -.86], [.07, -.8], [.05, -.72]], 14, dark, id, { spec: .35 });
    for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 14; i++) { const f = PI + i / 14 * PI; pts.push(ry(k * PI / 2 + PI / 4)([Math.cos(f) * .9, .18 + Math.sin(f) * .9, 0])); } b.tube(pts, .026, dark); }
    b.band(.95, .1, .035, 44, j => (j % 4 === 0 ? pale : brass), at, sp);
    b.band(.86, .055, .04, 40, brass, comp(rx(PI / 2), at), sp);
    const inner = comp(ry(t * .12), rz(.41), at);
    b.seg(inner([0, -.88, 0]), inner([0, .88, 0]), .012, .012, dark);
    b.band(.76, .05, .05, 36, brass, inner, sp);
    [-1, 1].forEach(s => { b.band(.7, .03, .025, 30, brass, comp(tr(0, s * .3, 0), inner), sp); b.band(.32, .03, .025, 18, brass, comp(tr(0, s * .69, 0), inner), sp); });
    b.band(.76, .035, .03, 36, dark, comp(rx(PI / 2), inner), sp); b.band(.76, .035, .03, 36, dark, comp(rx(PI / 2), ry(PI / 2), inner), sp);
    const ecl = comp(rz(.41), inner);
    b.band(.79, .028, .11, 48, j => (Math.floor(j / 4) % 2 ? pale : brass), ecl, sp);
    b.ball(at([0, 0, 0]), .095, [74, 120, 132]);
    for (let k = 0; k < n; k++) { const a = k / 8 * TAU + .3, p = ecl([Math.cos(a) * .83, 0, Math.sin(a) * .83]); b.ball(p, .045, [255, 238, 178], { em: 1 }); b.glow(p, .16, [255, 214, 130], .55); }
  }

  const ICO = (() => { const f = (1 + Math.sqrt(5)) / 2, v = []; [-1, 1].forEach(a => [-f, f].forEach(c => v.push(norm([0, a, c]), norm([a, c, 0]), norm([c, 0, a])))); const near = (i, j) => Math.hypot(...sub(v[i], v[j])) < 1.1, F = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) if (near(i, j) && near(j, k) && near(i, k)) F.push([i, j, k]); return { v, F }; })();
  function gridCore(b, n, t) { // Grid: a geodesic cage round a dark core; one of the twelve nodes turns amber per session
    const G = [80, 222, 255], dim = [26, 86, 118], M = tr(0, .05, 0), R = .92;
    ICO.F.forEach(f => {
      const [A, B, C] = f.map(i => ICO.v[i]), m = [norm(add(A, B)), norm(add(B, C)), norm(add(C, A))], e = (p, q, c, r) => b.seg(M(mul(p, R)), M(mul(q, R)), r, r, c, { em: .7 });
      e(A, m[0], G, .011); e(m[0], B, G, .011); e(B, m[1], G, .011); e(m[1], C, G, .011); e(C, m[2], G, .011); e(m[2], A, G, .011);
      e(m[0], m[1], dim, .007); e(m[1], m[2], dim, .007); e(m[2], m[0], dim, .007);
      const In = comp(ry(-t * .25), M); b.poly(f.map(i => In(mul(ICO.v[i], .5))), [14, 44, 66], { spec: .9 });
    });
    ICO.v.forEach((v, i) => {
      b.seg(M(mul(v, .5)), M(mul(v, R)), .005, .005, dim, { em: .4, a: .6 });
      const p = M(mul(v, R)), lit = i < n; b.ball(p, lit ? .06 : .035, lit ? [255, 196, 90] : [28, 70, 96], { em: lit ? 1 : .2 }); if (lit) b.glow(p, .22, [255, 180, 70], .5);
    });
    b.ball(M([0, 0, 0]), .13, G, { em: 1 }); b.glow(M([0, 0, 0]), .5, G, .35);
    b.band(1.2, .05, .014, 60, j => (j % 5 === 0 ? G : j % 2 ? dim : [14, 48, 70]), comp(ry(-t * .18), rz(.32), M), { em: .55 });
    b.band(1.08, .014, .014, 48, dim, comp(ry(t * .1), rz(-.5), rx(.3), M), { em: .5 });
  }

  function arcadeIslet(b, n) { // Arcade: the dusk lake in cubes; one lit lantern by the water per session
    const m = new Map(), put = (x, y, z, c, em) => m.set(x + ',' + y + ',' + z, em ? { c, em } : c), h = (x, z) => ((x * 73856093 ^ z * 19349663) >>> 0) % 7;
    for (let x = -7; x <= 7; x++) for (let z = -7; z <= 7; z++) {
      const d = Math.hypot(x, z); if (d > 7.3) continue;
      const lake = Math.hypot(x - 3, z - 2.5) < 3.1;
      put(x, 0, z, lake ? [236, 150 + h(x, z) * 5, 132] : [96 + h(x, z) * 3, 86, 150 + h(x, z) * 3]);
      if (d < 6.2) put(x, -1, z, [70, 44, 86]); if (d < 4.6) put(x, -2, z, [58, 36, 74]); if (d < 2.8) put(x, -3, z, [48, 30, 64]); if (d < 1.2) put(x, -4, z, [40, 26, 56]);
    }
    const pine = (px, pz, H) => { put(px, 1, pz, [92, 56, 60]); put(px, 2, pz, [92, 56, 60]); for (let y = 3; y < 3 + H; y++) { const r = y - 3 < H - 3 ? ((y - 3) % 2 ? 1 : 2) : y - 3 < H - 1 ? 1 : 0; for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) if (Math.abs(x) + Math.abs(z) <= r + (r > 1 ? 1 : 0)) put(px + x, y, pz + z, (y + x + z) % 2 ? [44, 104, 112] : [36, 88, 100]); } };
    pine(-4, -1, 7); pine(-2, -4, 5); pine(-5, 3, 5);
    for (let x = 0; x <= 3; x++) for (let z = -5; z <= -3; z++) { for (let y = 1; y <= 2; y++) put(x, y, z, [158, 96, 104]); put(x, 3, z, [232, 140, 118]); if (z === -4) put(x, 4, z, [240, 156, 128]); }
    put(1, 1, -3, [70, 40, 60]); put(2, 2, -3, [255, 220, 140], 1); put(3, 5, -4, [120, 80, 96]);
    const spots = [[0, 1], [1, 5], [5, 5], [6, 1], [-1, 3], [3, -1], [6, 3], [3, 6]], s = .145;
    spots.forEach((q, k) => { put(q[0], 1, q[1], [70, 50, 80]); if (k < n) put(q[0], 2, q[1], [255, 206, 120], 1); else put(q[0], 2, q[1], [96, 70, 100]); });
    b.voxels(m, s, tr(0, -.1, 0));
    spots.slice(0, n).forEach(q => b.glow([q[0] * s, 2 * s - .1, q[1] * s], .24, [255, 190, 110], .45));
  }

  function grimoire(b, n, t) { // Cyber sorcier: an open book afloat over a rune circle; one crystal shard in orbit per session
    const bob = Math.sin(t * .6) * .03, at = tr(0, .12 + bob, 0), leather = [84, 52, 132], page = [236, 226, 204], ink = [96, 76, 120];
    const curve = x => .03 + .12 * Math.sin(PI * Math.pow(x / .95, .6));
    [-1, 1].forEach(s => {
      const M = comp(p => [p[0] * s, p[1], p[2]], rz(s * .16), at);
      b.box(.52, -.04, 0, 1.06, .045, 1.42, leather, M, { spec: .3 });
      b.box(.52, -.005, 0, 1.0, .03, 1.34, [214, 200, 172], M);
      for (let i = 0; i < 6; i++) { const x0 = i / 6 * .95, x1 = (i + 1) / 6 * .95; [[-.64, 0], [0, .64]].forEach(z => b.poly([[x0, curve(x0), z[0]], [x1, curve(x1), z[0]], [x1, curve(x1), z[1]], [x0, curve(x0), z[1]]].map(M), page)); }
      for (let l = 0; l < 5; l++) { const z = -.48 + l * .22, pts = []; for (let i = 1; i <= (l === 4 ? 3 : 5); i++) { const x = i / 6 * .95; pts.push(M([x, curve(x) + .012, z])); } b.tube(pts, .009, ink); }
      [-.62, .62].forEach(z => b.box(.98, -.03, z, .12, .06, .12, [214, 176, 96], M, { spec: .6 }));
    });
    [.9, 1.5, 2.2 - ((t * .12) % 1) * 1.2].forEach((th, k) => { // loose leaves standing in the gutter, one turning slowly
      for (let i = 0; i < 6; i++) { const P = q => { const r = q / 6 * .9, a = th + .3 * Math.sin(PI * q / 6) * (th > PI / 2 ? -1 : 1); return [Math.cos(a) * r, .03 + Math.sin(a) * r, 0]; }, p0 = P(i), p1 = P(i + 1); b.poly([[p0[0], p0[1], -.62], [p1[0], p1[1], -.62], [p1[0], p1[1], .62], [p0[0], p0[1], .62]].map(at), [244 - k * 8, 236 - k * 8, 216 - k * 8], { em: .45 }); }
    });
    const V = [176, 128, 255], ring = comp(ry(-t * .1), tr(0, -.82, 0));
    b.band(1.08, .045, .006, 48, V, ring, { em: .9 }); b.band(.8, .025, .006, 36, [120, 86, 200], ring, { em: .8 });
    for (let k = 0; k < 12; k++) { const R = comp(tr(.94, 0, 0), ry(k * TAU / 12), ring), w = k % 2 ? .06 : .03, l = k % 3 ? .1 : .06; b.poly([[-l, 0, -w], [l, 0, -w], [l * .4, 0, w], [-l, 0, w]].map(R), V, { em: 1, bias: .01 }); }
    b.glow([0, -.82, 0], 1.0, V, .22);
    for (let k = 0; k < n; k++) { const a = k / 8 * TAU + t * .15, p = [Math.cos(a) * 1.18, -.15 + Math.sin(k * 2.1 + t * .5) * .3, Math.sin(a) * 1.18]; b.octa(p, .075, .15, [170, 210, 255], { em: .55, a: .9, spec: 1 }, t * .4 + k); b.glow(p, .2, [150, 170, 255], .4); }
  }

  function supercar(b, n) { // Ville néon: the 80s wedge on a wet roof; one tail-light segment per session
    const body = [228, 220, 236], low = [176, 166, 196], glass = [30, 22, 52], sp = { spec: .7 };
    b.poly([[-1.5, .004, -.78], [1.5, .004, -.78], [1.5, .004, .78], [-1.5, .004, .78]], [255, 70, 170], { em: 1, a: .2, bias: .2 });
    const SEC = [[-1.3, .5, .2, .21, .212], [-.95, .56, .27, .29, .292], [-.4, .58, .36, .4, .41], [.05, .58, .4, .47, .66], [.45, .58, .42, .49, .66], [.95, .6, .44, .5, .52], [1.3, .58, .44, .48, .482]];
    const ring = s => { const [x, w, yb, ys, yr] = s; return [[x, .12, w], [x, yb, w], [x, ys, w * .86], [x, yr, w * .6], [x, yr, -w * .6], [x, ys, -w * .86], [x, yb, -w], [x, .12, -w]]; };
    for (let i = 0; i < SEC.length - 1; i++) {
      const A = ring(SEC[i]), B = ring(SEC[i + 1]);
      for (let k = 0; k < 7; k++) {
        const top = k >= 2 && k <= 4, isGlass = top && (i === 2 || (i === 3 && k !== 3)), rear = top && i === 4;
        b.poly([A[k], B[k], B[k + 1], A[k + 1]], isGlass ? glass : rear ? [46, 38, 70] : k === 0 || k === 6 ? low : body, isGlass ? { spec: 1.2 } : sp);
      }
    }
    b.poly(ring(SEC[0]), low, sp); b.poly(ring(SEC[6]), [36, 28, 54]);
    for (let l = 0; l < 4; l++) { const f = (l + .5) / 4, x = .45 + f * .5, y = .66 - f * .14 + .012, w = .58 * .6 - .02; b.seg([x, y, -w], [x, y, w], .014, .014, body); }
    [-1, 1].forEach(s => { b.poly([[-1.305, .145, s * .2], [-1.305, .195, s * .2], [-1.305, .195, s * .44], [-1.305, .145, s * .44]], [255, 242, 204], { em: 1, bias: .05 }); b.poly([[-.3, .2, s * .585], [.9, .22, s * .605], [.9, .25, s * .605], [-.3, .23, s * .585]], [90, 230, 255], { em: 1, bias: .05 }); });
    for (let k = 0; k < 8; k++) { const z0 = -.5 + k * .127, lit = k < n; b.poly([[1.305, .33, z0], [1.305, .42, z0], [1.305, .42, z0 + .105], [1.305, .33, z0 + .105]], lit ? [255, 64, 156] : [96, 26, 70], { em: lit ? 1 : .15, bias: .05 }); if (lit) b.glow([1.33, .37, z0 + .05], .16, [255, 60, 150], .4); }
    [[-.82, 1], [-.82, -1], [.8, 1], [.8, -1]].forEach(w => b.lathe([[0, -.075], [.13, -.075], [.215, -.06], [.215, .06], [.13, .075], [0, .075]], 12, i => (i === 0 || i === 4 ? [196, 194, 212] : [24, 20, 30]), comp(rx(PI / 2), tr(w[0], .215, w[1] * .52))));
  }

  function mobius(b, n, t) { // Brouillard: a bronze band with one side only; one ruby per session (crimson stays rare)
    const bronze = [156, 116, 72], dark = [108, 78, 48], rim = [204, 168, 108], M = comp(rx(1.12), tr(0, .05, 0)), R = .95, w = .26, N = 72;
    const P = (u, v) => M([(R + v * Math.cos(u / 2)) * Math.cos(u), v * Math.sin(u / 2), (R + v * Math.cos(u / 2)) * Math.sin(u)]);
    for (let j = 0; j < N; j++) { const u0 = j / N * TAU, u1 = (j + 1) / N * TAU; [[-w, 0], [0, w]].forEach((s, q) => b.poly([P(u0, s[0]), P(u1, s[0]), P(u1, s[1]), P(u0, s[1])], (j + q * 2) % 4 === 0 ? dark : bronze, { spec: .6 })); }
    [-w, w].forEach(v => { const pts = []; for (let j = 0; j <= N; j++) pts.push(P(j / N * TAU, v)); b.tube(pts, .016, rim); });
    for (let k = 0; k < n; k++) { const p = P(k / 8 * TAU + .2, 0); b.ball(p, .055, [214, 58, 82], { em: .85 }); b.glow(p, .14, [220, 50, 80], .4); }
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + t * .06, p = [Math.cos(a) * 1.3, -.5 + ((k * 37) % 10) * .12, Math.sin(a) * 1.3]; b.octa(p, .08 + (k % 2) * .03, .11 + (k % 3) * .04, [128, 128, 136], null, k * 1.7 + t * .1); }
  }

  function helmet(b, n, t) { // Abysses: a copper diving helmet on the sand; one bubble rising from the valve per session
    const copper = [198, 122, 72], brass = [216, 172, 92], green = [112, 152, 132], D = tr(0, -.3, 0), dome = [];
    for (let i = 0; i <= 9; i++) { const a = i / 9 * PI * .8; dome.push([.6 * Math.sin(a), .42 + .6 * Math.cos(a)]); }
    b.lathe([[0, -.92], [1.3, -.92]], 20, (i, j) => (j % 4 === 0 ? [122, 126, 104] : [138, 138, 112]), D);
    [[.95, .5], [-.9, .3], [-.5, -.95]].forEach((s, k) => b.octa(D([s[0], -.88, s[1]]), .1, .06, [96, 104, 100], null, k));
    for (let k = 0; k < 3; k++) { const pts = []; for (let q = 0; q <= 5; q++) pts.push(D([-1 + k * .13 + Math.sin(t * .4 + k + q * .7) * .03 * q, -.92 + q * (.13 + k * .03), -.3 + k * .2])); b.tube(pts, i => .03 - i * .004, [70, 130, 96]); }
    b.lathe(dome, 16, (i, j) => ((i * 7 + j * 3) % 11 === 0 ? green : copper), D, { spec: .8 });
    b.lathe([[.36, -.07], [.47, -.14], [.47, -.2], [.86, -.52], [.92, -.66], [.82, -.72], [0, -.72]], 16, (i, j) => (i === 1 ? brass : (i * 5 + j) % 9 === 0 ? green : copper), D, { spec: .5 });
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; b.ball(D([Math.cos(a) * .49, -.17, Math.sin(a) * .49]), .035, brass); }
    const port = (M, R) => { b.band(R, R * .26, .1, 16, brass, M, { spec: .8 }); b.lathe([[0, .02], [R * .78, .02]], 12, [36, 104, 116], M, { em: .35, spec: 1.2 }); b.seg(M([-R * .7, .05, 0]), M([R * .7, .05, 0]), .016, .016, brass); b.seg(M([0, .05, -R * .7]), M([0, .05, R * .7]), .016, .016, brass); };
    port(comp(rx(-PI / 2), tr(0, .42, -.57), D), .27);
    [-1, 1].forEach(s => port(comp(rz(-s * PI / 2), tr(s * .57, .42, 0), D), .19));
    port(comp(tr(0, .98, 0), D), .15);
    b.lathe([[.06, 0], [.06, .1], [.1, .13], [.04, .17]], 8, brass, comp(tr(.3, .82, .25), D));
    b.glow(D([0, .42, -.6]), .34, [110, 230, 220], .3);
    for (let k = 0; k < n; k++) { const f = (k / 8 + t * .02) % 1, p = D([.3 + Math.sin(k * 1.9 + f * 5) * .1, 1.02 + f * .95, .25 + Math.cos(k * 2.3) * .08]); b.ball(p, .03 + (k % 3) * .012, [190, 240, 240], { em: .7, a: .8 }); }
  }

  function lantern(b, n, t) { // Sanctuaire: a stone lantern, lit; one firefly per session
    const stone = [160, 162, 154], shade = [128, 132, 126], moss = [104, 126, 96], warm = [255, 204, 124], h6 = { phase: PI / 6 };
    b.lathe([[0, -1.2], [1.15, -1.2]], 18, (i, j) => (j % 5 === 0 ? [46, 66, 54] : [54, 76, 58]));
    b.lathe([[0, -1.06], [.5, -1.06], [.56, -1.12], [.56, -1.2]], 6, stone, id, h6); b.lathe([[.3, -1.0], [.42, -1.06]], 6, shade, id, h6);
    b.lathe([[.21, -.24], [.15, -.34], [.16, -.9], [.2, -1.0]], 10, stone);
    b.lathe([[0, 0], [.5, 0], [.56, -.05], [.52, -.13], [.2, -.24]], 6, i => (i === 0 ? shade : stone), id, h6);
    b.lathe([[.27, .02], [.27, .42]], 6, warm, id, Object.assign({ em: 1 }, h6));
    for (let k = 0; k < 6; k++) { const a = PI / 6 + k * TAU / 6; b.box(.4, .21, 0, .08, .42, .08, stone, ry(-a)); const a2 = a + TAU / 6, p = [Math.cos(a) * .38, .21, Math.sin(a) * .38], q = [Math.cos(a2) * .38, .21, Math.sin(a2) * .38]; b.seg(p, q, .016, .016, shade); }
    b.lathe([[0, .92], [.1, .9], [.24, .82], [.46, .7], [.74, .56], [.84, .52], [.8, .47], [.36, .42], [0, .42]], 6, (i, j) => (i > 5 ? shade : (i + j) % 3 === 0 ? moss : stone), id, h6);
    b.lathe([[0, 1.16], [.05, 1.12], [.11, 1.02], [.07, .94], [.1, .9]], 8, stone);
    b.glow([0, .21, 0], .62, warm, .4);
    for (let k = 0; k < n; k++) { const a = k * 2.4 + t * (.12 + k * .01), p = [Math.cos(a) * (.8 + (k % 3) * .14), -.5 + ((k * 53) % 10) * .13 + Math.sin(t * .5 + k) * .05, Math.sin(a) * (.8 + (k % 3) * .14)]; b.ball(p, .03, [240, 250, 170], { em: 1 }); b.glow(p, .13, [220, 240, 140], .5); }
  }

  function airship(b, n, t) { // Codex: a small airship, its propeller turning; one pennant on the bow cable per session
    const A = comp(rz(-PI / 2), tr(0, .32, 0)), prof = [], cream = [232, 216, 182], tan = [212, 190, 150], brick = [170, 66, 48], wood = [124, 86, 54];
    for (let i = 0; i <= 12; i++) { const f = i / 12; prof.push([i === 0 || i === 12 ? 0 : .47 * Math.pow(Math.sin(PI * Math.pow(f, .82)), .62), -1.3 + 2.6 * f]); }
    b.lathe(prof, 14, (i, j) => (i === 6 ? brick : j % 2 ? cream : tan), A, { spec: .2 });
    for (let k = 0; k < 4; k++) { const F = comp(tr(0, -.32, 0), rx(k * PI / 2 + PI / 4), tr(0, .32, 0)); b.poly([[1.28, .34, 0], [1.02, .38, 0], [.68, .58, 0], [.92, .9, 0], [1.3, .9, 0]].map(F), brick); }
    b.box(-.1, -.36, 0, .78, .15, .22, wood); b.box(-.1, -.46, 0, .6, .06, .16, [98, 66, 42]);
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => b.poly([[-.4 + k * .19, -.35, s * .112], [-.28 + k * .19, -.35, s * .112], [-.28 + k * .19, -.29, s * .112], [-.4 + k * .19, -.29, s * .112]], [52, 40, 34], { bias: .03 }));
    [[-.45, .09], [.25, .09], [-.45, -.09], [.25, -.09]].forEach(c => b.seg([c[0], -.29, c[1]], [c[0] * 1.3 - .05, 0, c[1] * 2.4], .008, .008, [90, 70, 50]));
    const hub = [.36, -.38, 0]; b.seg([.29, -.38, 0], hub, .02, .014, [70, 54, 40]);
    for (let k = 0; k < 2; k++) { const a = t * 1.2 + k * PI, d = [0, Math.cos(a) * .17, Math.sin(a) * .17], e = [0, -Math.sin(a) * .035, Math.cos(a) * .035]; b.poly([hub, add(hub, add(d, e)), add(hub, sub(d, e))], [88, 62, 40]); }
    const p0 = [-1.28, .32, 0], p1 = [-.5, -.3, 0]; b.seg(p0, p1, .006, .006, [90, 70, 50]);
    for (let k = 0; k < n; k++) { const q = add(p0, mul(sub(p1, p0), (k + .7) / 9)); b.poly([add(q, [-.045, 0, 0]), add(q, [.045, 0, 0]), add(q, [0, -.13, .012])], k % 2 ? [198, 150, 60] : brick, { bias: .02 }); }
  }

  function umbrella(b, n) { // Estampe: black ink, paper and the one red; one ripple inked on the ground per session
    const red = [214, 36, 46], ink = [34, 32, 38], M = comp(rz(.24), tr(.05, 0, 0));
    b.lathe([[0, .86], [.42, .76], [.8, .55], [1.02, .28]], 8, red, M, { phase: PI / 8 });
    b.seg(M([0, .86, 0]), M([0, 1.02, 0]), .02, .008, ink);
    b.seg(M([0, .84, 0]), M([0, -.78, 0]), .022, .022, ink);
    for (let k = 0; k < 8; k++) { const a = PI / 8 + k * TAU / 8; b.seg(M([Math.cos(a) * 1.02, .28, Math.sin(a) * 1.02]), M([0, .5, 0]), .008, .008, ink); }
    const hook = []; for (let i = 0; i <= 8; i++) { const a = PI + i / 8 * PI; hook.push(M([.12 + Math.cos(a) * .12, -.78 + Math.sin(a) * .13, 0])); } b.tube(hook, .03, ink);
    const R = [[-.75, -.35], [.7, -.5], [-.3, .7], [.85, .45], [-.95, .35], [.2, -.9], [.35, .85], [-.6, -.8]];
    R.slice(0, n).forEach((q, k) => b.band(.2 - (k % 3) * .04, .03, .004, 14, ink, tr(q[0], -1.02, q[1]), { em: 0, noedge: 1 }));
    for (let k = 0; k < 18; k++) { const x = ((k * 61) % 23) / 11.5 - 1, z = ((k * 37) % 19) / 9.5 - 1, y = ((k * 29) % 17) / 8.5 - .6; if (Math.hypot(x, z) < .95 && y < .3) continue; b.seg([x, y, z], [x - .04, y - .22, z], .006, .006, ink); }
  }

  function chest(b, n) { // Cartouche: four greens, true cubes; one pile of coins per session
    const m = new Map(), put = (x, y, z, c, em) => m.set(x + ',' + y + ',' + z, em ? { c, em } : c), D = [44, 44, 44], W = [150, 150, 150], G = [210, 210, 210], C = [255, 255, 255];
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) if (Math.abs(x) + Math.abs(z) < 9) { put(x, 0, z, G); put(x, -1, z, W); }
    for (let x = -3; x <= 3; x++) for (let z = -2; z <= 2; z++) for (let y = 1; y <= 4; y++) {
      const eX = Math.abs(x) === 3, eZ = Math.abs(z) === 2; if (y > 1 && !eX && !eZ) continue;
      put(x, y, z, (eX && eZ) || y === 4 || (x === 0 && eZ) ? D : W);
    }
    put(0, 3, -3, D); put(0, 2, -3, C, 1);
    for (let x = -3; x <= 3; x++) for (let y = 5; y <= 7; y++) { if (y === 7 && Math.abs(x) === 3) continue; put(x, y, 3, Math.abs(x) === 3 || y === 7 || x === 0 ? D : W); if (y < 7) put(x, y, 4, Math.abs(x) === 3 || x === 0 ? D : W); }
    const piles = [[-2, -1], [0, 0], [2, 1], [-1, 1], [1, -1], [-2, 1], [2, -1], [0, 1]];
    piles.slice(0, n).forEach((p, k) => { put(p[0], 2, p[1], C, 1); put(p[0], 3, p[1], C, 1); if (k % 2 === 0) put(p[0], 4, p[1], C, 1); if (k % 4 === 0) put(p[0], 5, p[1], C, 1); });
    b.voxels(m, .17, tr(0, -.55, 0));
  }

  /* ---------- Which world shows which object ---------- */
  const GB = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [196, 214, 120]];
  const OBJ = {
    observatory: { f: armillary, fog: [24, 17, 10], fogAmt: .4, yaw: .5, scale: .37, cy: .5, live: 1 },
    sorcerer: { f: grimoire, fog: [16, 10, 30], fogAmt: .35, yaw: .9, pitch: .42, scale: .36, cy: .5, live: 1 },
    atelier: { f: airship, fog: [226, 216, 192], fogAmt: .25, yaw: -.7, light: 1, scale: .34, pitch: .12, cy: .54, live: 1 },
    abyss: { f: helmet, fog: [6, 24, 36], fogAmt: .3, yaw: .5, scale: .29, cy: .5, live: 1 },
    netrunner: { f: gridCore, fog: [4, 14, 14], fogAmt: .45, yaw: .3, scale: .36, live: 1 },
    neoncity: { f: supercar, fog: [40, 12, 44], fogAmt: .25, yaw: 2.3, cy: .62, scale: .33, pitch: .3 },
    tokyo: { f: umbrella, light: 1, poster: 3, edge: '#16151a', edgeW: 1, yaw: .4, pitch: .3, cy: .46, scale: .35 },
    arcade: { f: arcadeIslet, fog: [50, 28, 60], fogAmt: .2, yaw: .7, pitch: .5, scale: .3, cy: .56 },
    fog: { f: mobius, fog: [70, 70, 78], fogAmt: .5, yaw: .4, scale: .34, live: 1 },
    cartouche: { f: chest, light: 1, palette: GB, yaw: -.6, pitch: .5, scale: .3, cy: .52 },
    sanctuary: { f: lantern, fog: [14, 20, 34], fogAmt: .35, yaw: .3, scale: .34, cy: .5, live: 1 },
  };
  const LIGHT_KEY = { observatory: 'atelier', netrunner: 'tokyo', arcade: 'cartouche' }; // the Premium light skins; Washi (light sanctuary) is set aside
  function worldKey() {
    const d = document.documentElement.dataset, th = d.theme;
    if (d.light === '1') return LIGHT_KEY[th] || null;
    return OBJ[th] ? th : null;
  }

  /* ---------- The canvas in the dial's corner ---------- */
  let cv, g, key = null, yaw = 0, time = 7, drag = null, raf = 0, last = 0, lastPaint = 0, sessions = 0, dirty = true;
  const sessionsToday = () => { const td = ML.today(); return Math.min(8, (S.sessions || []).filter(s => ML.dayKey(new Date(s.at)) === td).length); };
  const still = () => ML.reducedMotion() || !!(ML.running && ML.running()) || document.hidden;
  function paint() {
    const o = OBJ[key]; if (!o || !cv.clientWidth) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    g.clearRect(0, 0, W, H);
    const b = builder(); o.f(b, sessions, time); render(g, W, H, b.it, yaw, o);
  }
  function frame(now) {
    raf = 0; if (!key || cv.hidden) return;
    const dt = Math.min(.1, (now - last) / 1000 || 0); last = now;
    const moving = !still() && !drag;
    if (moving) { yaw += dt * .09; time += dt; }
    if (dirty || (moving && now - lastPaint > 66)) { dirty = false; lastPaint = now; paint(); } // about 15 pictures a second is enough at this speed
    if (moving || drag || dirty) raf = requestAnimationFrame(frame);
  }
  const wake = () => { dirty = true; if (!raf && cv) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  function sync() {
    if (!cv) return;
    const k = S.worldObj === false ? null : worldKey();
    if (k !== key) { key = k; if (k) yaw = OBJ[k].yaw || 0; }
    cv.hidden = !key; cv.dataset.obj = key || '';
    if (key) wake();
  }
  function mount() {
    const wrap = document.querySelector('.ring-wrap'); if (!wrap || cv) return;
    cv = document.createElement('canvas'); cv.className = 'world-obj'; cv.hidden = true; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', t('wo_aria'));
    g = cv.getContext('2d'); wrap.appendChild(cv);
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} wake(); });
    cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * .02; dirty = true; });
    const up = () => { drag = null; wake(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-light'] });
    sessions = sessionsToday(); sync();
  }
  on('timer', wake); on('motion', wake); on('sober', sync);
  on('session', () => { sessions = sessionsToday(); wake(); });
  on('newday', () => { sessions = sessionsToday(); wake(); });
  on('loaded', () => { sessions = sessionsToday(); wake(); });
  document.addEventListener('visibilitychange', wake);
  addEventListener('resize', wake);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  ML.settingsSection({
    order: 17.5,
    render: () => `<h3>${esc(t('wo_set'))}</h3>${ML.ui.chk('set-wobj', t('wo_hint'), S.worldObj !== false)}`,
    bind: r => { r.querySelector('#set-wobj').onchange = e => { S.worldObj = e.target.checked; save(); sync(); }; },
  });
  ML.WorldObj = { OBJ, sync, paint: n => { if (n != null) sessions = n; if (cv) paint(); } }; // paint(n): draw now with n sessions (checks, trailer)
})();
