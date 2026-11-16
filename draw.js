/* FornoLab — procedural food art + pizza renderer (Canvas 2D, unit coordinates: pizza radius = 1) */
const TAU = Math.PI * 2;
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function blob(c, rx, ry, a, ph) {
  const N = 24; c.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = i / N * TAU, k = 1 + a * Math.sin(2 * t + ph) + a * .7 * Math.sin(3 * t + ph * 2.1) + a * .4 * Math.sin(5 * t + ph * .7);
    const x = Math.cos(t) * rx * k, y = Math.sin(t) * ry * k; i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
function strip(c, len, w, wave, ph) {
  const N = 14; c.beginPath();
  for (let i = 0; i <= N; i++) { const u = i / N, x = (u - .5) * len, y = Math.sin(u * TAU * 1.3 + ph) * wave - w / 2; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const u = i / N, x = (u - .5) * len, y = Math.sin(u * TAU * 1.3 + ph) * wave + w / 2; c.lineTo(x, y); }
  c.closePath();
}
function dots(c, p, n, rad, spread, col, alpha) {
  c.fillStyle = col; c.globalAlpha = alpha == null ? 1 : alpha;
  for (let i = 0; i < n; i++) { const a = (p.r1 * 97 + i * 2.399) % TAU, d = Math.sqrt((p.r2 * 31 + i * .618) % 1) * spread; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, rad * (.6 + ((i * 7) % 5) / 6), 0, TAU); c.fill(); }
  c.globalAlpha = 1;
}
function squiggle(c, len, amp, ph) {
  c.beginPath(); const N = 16;
  for (let i = 0; i <= N; i++) { const u = i / N; const x = (u - .5) * len, y = Math.sin(u * TAU * 1.5 + ph) * amp; i ? c.lineTo(x, y) : c.moveTo(x, y); }
}

/* Each art function draws ONE piece at origin in unit coords. p carries r1..r4 in [0,1). */
const ART = {
  'Shredded Cheese': (c, p) => { c.lineCap = 'round'; c.strokeStyle = p.r3 > .5 ? '#f3d98a' : '#ecc563'; c.lineWidth = .0095; c.beginPath(); c.moveTo(-.05, 0); c.quadraticCurveTo(0, (p.r1 - .5) * .06, .05 + p.r2 * .015, (p.r4 - .5) * .03); c.stroke(); c.strokeStyle = 'rgba(255,248,210,.7)'; c.lineWidth = .003; c.stroke(); },
  'Mozzarella': (c, p) => { blob(c, .062, .05, .16, p.r1 * 6); c.fillStyle = '#fbf5e4'; c.fill(); c.strokeStyle = '#e6d9b8'; c.lineWidth = .004; c.stroke(); c.save(); c.translate(-.01, -.008); blob(c, .035, .026, .2, p.r2 * 6); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); c.restore(); if (p.r3 > .45) { c.save(); c.translate(.02, .01); blob(c, .015, .012, .2, p.r4 * 6); c.fillStyle = 'rgba(214,160,70,.4)'; c.fill(); c.restore(); } },
  'Blue Cheese': (c, p) => { blob(c, .034, .028, .25, p.r1 * 6); c.fillStyle = '#f1ecda'; c.fill(); c.strokeStyle = '#d8d0b4'; c.lineWidth = .002; c.stroke(); dots(c, p, 5, .0055, .02, '#4f7f9a', .85); dots(c, { r1: p.r2, r2: p.r3 }, 3, .004, .018, '#6fa08c', .8); },
  'Parmesan': (c, p) => { c.rotate(p.r3 * 3); c.beginPath(); c.moveTo(-.02, -.006); c.lineTo(.014, -.012); c.lineTo(.022, .008); c.lineTo(-.008, .012); c.closePath(); c.fillStyle = p.r1 > .5 ? '#f6e5ae' : '#ecd48a'; c.fill(); c.strokeStyle = 'rgba(176,140,60,.5)'; c.lineWidth = .0018; c.stroke(); },
  'Cream Cheese': (c, p) => { blob(c, .042, .038, .12, p.r1 * 6); c.fillStyle = '#fffcf3'; c.fill(); c.strokeStyle = '#ebe3cc'; c.lineWidth = .004; c.stroke(); c.beginPath(); c.arc(-.012, -.012, .014, 0, TAU); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); },

  'Marinated Chicken': (c, p) => { blob(c, .078, .06, .17, p.r1 * 6); const g = c.createLinearGradient(-.06, -.05, .06, .06); g.addColorStop(0, '#e6b777'); g.addColorStop(1, '#c98c4a'); c.fillStyle = g; c.fill(); c.strokeStyle = '#a06a30'; c.lineWidth = .004; c.stroke(); c.save(); c.clip(); c.strokeStyle = 'rgba(86,44,14,.55)'; c.lineWidth = .009; c.lineCap = 'round'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-.07 + i * .02, -.06); c.lineTo(.02 + i * .02, .07); c.stroke(); } c.restore(); dots(c, p, 5, .004, .05, 'rgba(120,60,20,.5)'); },
  'Beef Bacon': (c, p) => { strip(c, .21, .05, .012, p.r1 * 6); c.fillStyle = '#8a3427'; c.fill(); c.save(); c.clip(); c.fillStyle = 'rgba(240,196,170,.75)'; c.fillRect(-.12, -.018, .24, .011); c.fillRect(-.12, .01, .24, .008); c.fillStyle = 'rgba(60,15,10,.35)'; c.fillRect(-.12, -.004, .24, .006); c.restore(); c.strokeStyle = '#5e1f16'; c.lineWidth = .003; strip(c, .21, .05, .012, p.r1 * 6); c.stroke(); },
  'Turkey Bacon': (c, p) => { strip(c, .2, .046, .01, p.r1 * 6); c.fillStyle = '#c8856a'; c.fill(); c.save(); c.clip(); c.fillStyle = 'rgba(248,218,198,.8)'; c.fillRect(-.12, -.016, .24, .009); c.fillRect(-.12, .01, .24, .007); c.restore(); c.strokeStyle = '#8f5640'; c.lineWidth = .003; strip(c, .2, .046, .01, p.r1 * 6); c.stroke(); },
  'Chorizo': (c, p) => { c.beginPath(); c.arc(0, 0, .063, 0, TAU); c.fillStyle = '#b53420'; c.fill(); c.lineWidth = .006; c.strokeStyle = '#7e1c0e'; c.stroke(); c.beginPath(); c.arc(0, 0, .046, 0, TAU); c.strokeStyle = 'rgba(255,150,100,.3)'; c.lineWidth = .004; c.stroke(); dots(c, p, 9, .0065, .048, '#f2bd96', .9); dots(c, { r1: p.r3, r2: p.r4 }, 3, .005, .04, '#6b1408', .6); },
  'Pastrami': (c, p) => { blob(c, .1, .062, .13, p.r1 * 6); c.fillStyle = '#a24f4b'; c.fill(); c.lineWidth = .007; c.strokeStyle = '#4e1f20'; c.stroke(); c.save(); c.clip(); c.strokeStyle = 'rgba(255,200,190,.4)'; c.lineWidth = .006; c.beginPath(); c.moveTo(-.09, .01); c.quadraticCurveTo(0, -.03, .09, .02); c.stroke(); c.restore(); dots(c, p, 12, .0045, .07, '#2b1210', .8); },
  'Steak': (c, p) => { blob(c, .075, .042, .15, p.r1 * 6); c.fillStyle = '#6f3d24'; c.fill(); c.save(); c.clip(); c.scale(.7, .6); blob(c, .075, .042, .1, p.r2 * 6); c.fillStyle = '#bd6552'; c.fill(); c.restore(); c.strokeStyle = '#3f2012'; c.lineWidth = .005; blob(c, .075, .042, .15, p.r1 * 6); c.stroke(); c.save(); c.clip(); c.strokeStyle = 'rgba(30,12,6,.5)'; c.lineWidth = .006; c.beginPath(); c.moveTo(-.04, -.05); c.lineTo(-.01, .05); c.moveTo(.02, -.05); c.lineTo(.05, .05); c.stroke(); c.restore(); },
  'Fermented Salami': (c, p) => { c.beginPath(); c.arc(0, 0, .06, 0, TAU); c.fillStyle = '#9b2c2f'; c.fill(); c.lineWidth = .007; c.strokeStyle = '#5f1a1c'; c.stroke(); dots(c, p, 10, .0085, .045, '#f6e1d5', .95); },
  'Curry Sausage': (c, p) => { c.beginPath(); c.arc(0, 0, .058, 0, TAU); c.fillStyle = '#c28638'; c.fill(); c.lineWidth = .008; c.strokeStyle = '#7a4719'; c.stroke(); c.beginPath(); c.arc(0, 0, .04, 0, TAU); c.strokeStyle = 'rgba(100,55,15,.35)'; c.lineWidth = .003; c.stroke(); dots(c, p, 12, .005, .045, '#e8b743', .9); dots(c, { r1: p.r3, r2: p.r4 }, 4, .004, .04, '#9a3b12', .7); },

  'Mushroom': (c, p) => { c.beginPath(); c.ellipse(0, 0, .07, .058, 0, Math.PI, TAU); c.lineTo(.024, .008); c.lineTo(.024, .05); c.quadraticCurveTo(0, .062, -.024, .05); c.lineTo(-.024, .008); c.closePath(); c.fillStyle = '#e6d6b8'; c.fill(); c.lineWidth = .005; c.strokeStyle = '#8c6b45'; c.stroke(); c.beginPath(); c.ellipse(0, -.004, .066, .05, 0, Math.PI * 1.05, Math.PI * 1.95); c.strokeStyle = '#b08a5c'; c.lineWidth = .009; c.stroke(); c.strokeStyle = 'rgba(140,107,69,.45)'; c.lineWidth = .0025; c.beginPath(); c.moveTo(-.03, .0); c.lineTo(-.015, -.04); c.moveTo(.03, 0); c.lineTo(.015, -.04); c.stroke(); },
  'Eggplant': (c, p) => { c.beginPath(); c.arc(0, 0, .062, 0, TAU); c.fillStyle = '#3d2147'; c.fill(); c.beginPath(); c.arc(0, 0, .052, 0, TAU); c.fillStyle = '#e9deb8'; c.fill(); dots(c, p, 9, .0048, .038, '#bfae6c', .9); c.beginPath(); c.arc(0, 0, .052, 0, TAU); c.strokeStyle = 'rgba(94,60,104,.5)'; c.lineWidth = .004; c.stroke(); },
  'Spinach': (c, p) => { const L = .09 + p.r2 * .03; c.beginPath(); c.moveTo(-L, 0); c.bezierCurveTo(-L * .5, -.07, L * .3, -.07, L, 0); c.bezierCurveTo(L * .3, .06, -L * .5, .07, -L, 0); c.fillStyle = p.r1 > .5 ? '#2f7d33' : '#3c9440'; c.fill(); c.strokeStyle = '#1d5a22'; c.lineWidth = .004; c.stroke(); c.beginPath(); c.moveTo(-L, 0); c.lineTo(L * .8, 0); c.strokeStyle = 'rgba(190,230,150,.7)'; c.lineWidth = .004; c.stroke(); },
  'Olive': (c, p) => { c.beginPath(); c.arc(0, 0, .037, 0, TAU); c.arc(0, 0, .016, 0, TAU, true); c.fillStyle = '#24231f'; c.fill('evenodd'); c.beginPath(); c.arc(0, 0, .037, Math.PI * 1.1, Math.PI * 1.55); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = .005; c.stroke(); },
  'Onion': (c, p) => { const r = .055 + p.r2 * .02, a0 = p.r1 * TAU, a1 = a0 + 1.7 + p.r3 * 1.4; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, r, a0, a1); c.strokeStyle = '#a15d98'; c.lineWidth = .018; c.stroke(); c.beginPath(); c.arc(0, 0, r, a0, a1); c.strokeStyle = '#f3e8f1'; c.lineWidth = .011; c.stroke(); c.beginPath(); c.arc(0, 0, r - .015, a0 + .1, a1 - .2); c.strokeStyle = 'rgba(190,130,180,.7)'; c.lineWidth = .003; c.stroke(); },
  'Cherry Tomato': (c, p) => { c.beginPath(); c.arc(0, 0, .052, 0, TAU); c.fillStyle = '#d2362a'; c.fill(); c.beginPath(); c.arc(0, 0, .04, 0, TAU); c.fillStyle = '#ef6a4f'; c.fill(); for (let i = 0; i < 3; i++) { const a = p.r1 * TAU + i * TAU / 3; c.save(); c.translate(Math.cos(a) * .02, Math.sin(a) * .02); c.rotate(a); c.beginPath(); c.ellipse(0, 0, .012, .008, 0, 0, TAU); c.fillStyle = '#f6d98a'; c.fill(); c.restore(); } c.beginPath(); c.arc(0, 0, .052, 0, TAU); c.strokeStyle = '#8f1b14'; c.lineWidth = .004; c.stroke(); },
  'Garlic Paste': (c, p) => { blob(c, .034, .026, .25, p.r1 * 6); c.fillStyle = '#efe4b4'; c.fill(); c.strokeStyle = '#cdbd82'; c.lineWidth = .003; c.stroke(); c.beginPath(); c.arc(-.008, -.007, .008, 0, TAU); c.fillStyle = 'rgba(255,255,240,.85)'; c.fill(); },

  'Radish': (c, p) => { c.beginPath(); c.arc(0, 0, .044, 0, TAU); c.fillStyle = '#cc3b62'; c.fill(); c.beginPath(); c.arc(0, 0, .037, 0, TAU); c.fillStyle = '#fff3ee'; c.fill(); c.beginPath(); c.arc(0, 0, .024, 0, TAU); c.strokeStyle = 'rgba(214,120,140,.55)'; c.lineWidth = .003; c.stroke(); },
  'Microgreens': (c, p) => { c.rotate(-p.rot); c.strokeStyle = '#c9e29a'; c.lineWidth = .003; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, .03); c.lineTo(0, -.005); c.stroke(); for (let i = 0; i < 3; i++) { c.save(); c.translate(0, -.005); c.rotate((i - 1) * .9 + p.r1 * .3); c.beginPath(); c.ellipse(0, -.014, .009, .016, 0, 0, TAU); c.fillStyle = i === 1 ? '#7cc443' : '#4fa534'; c.fill(); c.restore(); } },
  'Potato Strips': (c, p) => { c.lineCap = 'round'; c.beginPath(); c.moveTo(-.07, 0); c.quadraticCurveTo(0, (p.r1 - .5) * .04, .07, 0); c.strokeStyle = '#d99f3f'; c.lineWidth = .014; c.stroke(); c.strokeStyle = '#f3d37b'; c.lineWidth = .007; c.stroke(); },
  'Green Onion': (c, p) => { c.beginPath(); c.arc(0, 0, .02, 0, TAU); c.arc(0, 0, .0105, 0, TAU, true); c.fillStyle = p.r1 > .5 ? '#5ea23a' : '#77b74b'; c.fill('evenodd'); },
  'Pistachio Powder': (c, p) => { dots(c, p, 6, .0045, .02, '#9bc04f', .95); dots(c, { r1: p.r3, r2: p.r4 }, 3, .0035, .022, '#c8dd86', .9); },
  'Walnut': (c, p) => { blob(c, .035, .028, .28, p.r1 * 6); c.fillStyle = '#a2713f'; c.fill(); c.strokeStyle = '#5e3b1a'; c.lineWidth = .004; c.stroke(); c.beginPath(); c.moveTo(-.02, 0); c.quadraticCurveTo(0, -.012, .02, 0); c.moveTo(-.01, .012); c.quadraticCurveTo(.004, .004, .016, .014); c.strokeStyle = 'rgba(70,40,16,.6)'; c.lineWidth = .003; c.stroke(); },
  'Cajun Sauce': (c, p) => { c.lineCap = 'round'; squiggle(c, .17, .016, p.r1 * 6); c.strokeStyle = '#a34a17'; c.lineWidth = .012; c.stroke(); c.strokeStyle = '#d6772d'; c.lineWidth = .006; c.stroke(); },
  'Pesto Drizzle': (c, p) => { c.lineCap = 'round'; squiggle(c, .17, .016, p.r1 * 6); c.strokeStyle = '#3f6b1d'; c.lineWidth = .012; c.stroke(); c.strokeStyle = '#7fb246'; c.lineWidth = .006; c.stroke(); },
  'Basil Pesto Garnish': (c, p) => { blob(c, .026, .022, .25, p.r1 * 6); c.fillStyle = '#4c8727'; c.fill(); c.strokeStyle = '#2f5d17'; c.lineWidth = .003; c.stroke(); c.beginPath(); c.arc(-.007, -.007, .007, 0, TAU); c.fillStyle = 'rgba(190,230,130,.8)'; c.fill(); }
};
const NO_SHADOW = new Set(['Shredded Cheese', 'Parmesan', 'Pistachio Powder', 'Cajun Sauce', 'Pesto Drizzle', 'Green Onion']);

/* Draw one piece. ctx must be in unit space (scaled by R); R px is needed for shadow sizing. */
function drawPiece(c, R, p, extra) {
  const fn = ART[p.ing]; if (!fn) return;
  const e = extra || {}; const sc = (p.s || 1) * (e.scale || 1);
  c.save(); c.translate(p.x + (e.dx || 0), p.y + (e.dy || 0)); c.rotate(e.rot != null ? e.rot : p.rot); c.scale(sc, sc);
  c.globalAlpha = e.alpha == null ? 1 : e.alpha;
  if (!NO_SHADOW.has(p.ing)) { c.shadowColor = 'rgba(46,22,6,.38)'; c.shadowBlur = .014 * R * sc; c.shadowOffsetY = .007 * R * sc; }
  fn(c, p); c.restore();
}

function newPiece(ing, x, y, r, g) { return { ing, x, y, rot: r() * TAU, s: .88 + r() * .26, r1: r(), r2: r(), r3: r(), r4: r(), g, born: 0 }; }

/* ---------- pizza base (dough + raised crust), cached ---------- */
const baseCache = {};
function getBase(px, baked) {
  const key = px + ':' + (baked ? 1 : 0);
  if (baseCache[key]) return baseCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = px; const c = cv.getContext('2d');
  const R = px / 2 * .9; c.translate(px / 2, px / 2); c.scale(R, R); const r = rng(baked ? 77 : 41);
  // contact shadow
  c.save(); c.shadowColor = 'rgba(60,28,8,.45)'; c.shadowBlur = .09 * R; c.shadowOffsetY = .035 * R; c.beginPath(); c.arc(0, 0, .985, 0, TAU); c.fillStyle = '#d9a257'; c.fill(); c.restore();
  const wob = t => 1 + .005 * Math.sin(7 * t + 1) + .004 * Math.sin(13 * t + 2) + .004 * Math.sin(3 * t);
  // crust
  c.beginPath(); for (let i = 0; i <= 120; i++) { const t = i / 120 * TAU, k = wob(t); i ? c.lineTo(Math.cos(t) * k, Math.sin(t) * k) : c.moveTo(Math.cos(t) * k, Math.sin(t) * k); } c.closePath();
  let g = c.createRadialGradient(0, 0, .74, 0, 0, 1.02);
  if (baked) { g.addColorStop(0, '#d98f3d'); g.addColorStop(.5, '#e5a64f'); g.addColorStop(.88, '#c47a2c'); g.addColorStop(1, '#a45f1e'); }
  else { g.addColorStop(0, '#e2b165'); g.addColorStop(.5, '#efc983'); g.addColorStop(.88, '#dfae62'); g.addColorStop(1, '#c8914a'); }
  c.fillStyle = g; c.fill();
  // crust highlight (puffy ridge)
  c.beginPath(); c.arc(0, 0, .91, 0, TAU); c.lineWidth = .05; c.strokeStyle = baked ? 'rgba(255,225,150,.35)' : 'rgba(255,240,200,.5)'; c.stroke();
  // leopard spots
  const spots = baked ? 120 : 28;
  for (let i = 0; i < spots; i++) {
    const a = r() * TAU, d = .81 + r() * .17, sz = .008 + r() * (baked ? .03 : .018);
    const sg = c.createRadialGradient(Math.cos(a) * d, Math.sin(a) * d, 0, Math.cos(a) * d, Math.sin(a) * d, sz);
    sg.addColorStop(0, baked ? 'rgba(60,26,8,.85)' : 'rgba(110,60,20,.45)'); sg.addColorStop(1, 'rgba(60,26,8,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, sz, 0, TAU); c.fill();
  }
  // dough surface
  c.save(); c.shadowColor = 'rgba(90,50,10,.5)'; c.shadowBlur = .03 * R; c.shadowOffsetY = .008 * R;
  c.beginPath(); c.arc(0, 0, .815, 0, TAU); g = c.createRadialGradient(-.15, -.2, .05, 0, 0, .82);
  g.addColorStop(0, baked ? '#f1d9a1' : '#f6e4bb'); g.addColorStop(1, baked ? '#e6c07b' : '#efd69e'); c.fillStyle = g; c.fill(); c.restore();
  c.beginPath(); c.arc(0, 0, .815, 0, TAU); c.lineWidth = .012; c.strokeStyle = 'rgba(150,100,40,.35)'; c.stroke();
  for (let i = 0; i < 160; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .8; c.fillStyle = r() > .5 ? 'rgba(255,255,255,.35)' : 'rgba(190,140,70,.25)'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, .004 + r() * .008, 0, TAU); c.fill(); }
  if (baked) for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .78; c.fillStyle = 'rgba(120,64,20,.16)'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, .01 + r() * .03, 0, TAU); c.fill(); }
  return baseCache[key] = cv;
}

function drawSauces(c, R, sauces) {
  c.save(); c.beginPath(); c.arc(0, 0, .82, 0, TAU); c.clip(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of sauces) {
    const def = FL.SAUCE[s.id]; if (!def) continue;
    for (const st of s.strokes) {
      if (!st.length) continue;
      const path = () => { c.beginPath(); c.moveTo(st[0][0], st[0][1]); if (st.length === 1) c.lineTo(st[0][0] + .001, st[0][1]); for (let i = 1; i < st.length - 1; i++) { const mx = (st[i][0] + st[i + 1][0]) / 2, my = (st[i][1] + st[i + 1][1]) / 2; c.quadraticCurveTo(st[i][0], st[i][1], mx, my); } if (st.length > 1) c.lineTo(st[st.length - 1][0], st[st.length - 1][1]); };
      c.save(); c.translate(0, .008); path(); c.strokeStyle = 'rgba(70,30,10,.22)'; c.lineWidth = .15; c.stroke(); c.restore();
      path(); c.strokeStyle = def.dark; c.lineWidth = .138; c.globalAlpha = .96; c.stroke();
      path(); c.strokeStyle = def.color; c.lineWidth = .118; c.stroke(); c.globalAlpha = 1;
      c.save(); c.translate(-.012, -.014); path(); c.strokeStyle = def.hi; c.globalAlpha = .28; c.lineWidth = .028; c.stroke(); c.restore(); c.globalAlpha = 1;
    }
  }
  c.restore();
}

/* Renders the pizza on a CSS-sized square canvas context (already DPR-scaled). */
function renderPizza(ctx, px, model, o) {
  o = o || {}; const now = o.now || performance.now();
  ctx.clearRect(0, 0, px, px);
  ctx.drawImage(getBase(Math.round(px * (o.dpr || 1)), !!o.baked), 0, 0, px, px);
  const R = px / 2 * .9; ctx.save(); ctx.translate(px / 2, px / 2); ctx.scale(R, R);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, .83, 0, TAU); ctx.clip();
  drawSauces(ctx, R, model.sauces);
  let young = false;
  const draw = layer => { for (const p of model.pieces) { if (FL.ING[p.ing].layer !== layer) continue; if (layer === 'post' && o.hidePost) continue; let ex = null; const age = (now - (p.born || 0)) / 320; if (p.born && age < 0) { young = true; continue; } if (p.born && age < 1) { young = true; const t = 1 - Math.pow(1 - age, 3); ex = { scale: 1 + (1 - t) * .55, alpha: Math.min(1, age * 3), dy: -(1 - t) * .06 }; } drawPiece(ctx, R, p, ex); } };
  draw('cheese'); draw('pre');
  if (o.baked) { const r = rng(5); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 46; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .78, s = .02 + r() * .05; const g = ctx.createRadialGradient(Math.cos(a) * d, Math.sin(a) * d, 0, Math.cos(a) * d, Math.sin(a) * d, s); g.addColorStop(0, 'rgba(176,100,30,.2)'); g.addColorStop(1, 'rgba(176,100,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, s, 0, TAU); ctx.fill(); } }
  draw('post');
  ctx.restore();
  if (o.after) o.after(ctx, R);
  ctx.restore();
  return young;
}

/* tiny helper used by thumbnails */
function modelCanvas(model, size, baked) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), cv = document.createElement('canvas'); cv.width = cv.height = Math.round(size * dpr); cv.style.width = cv.style.height = size + 'px';
  const c = cv.getContext('2d'); c.scale(dpr, dpr); renderPizza(c, size, model, { baked, dpr, now: 1e12 }); return cv;
}

/* ---------- model helpers ---------- */
function emptyModel() { return { sauces: [], pieces: [], gc: 1, name: '', recipe: null }; }
function cloneModel(m) { return JSON.parse(JSON.stringify(m)); }
function levelOf(m, ing) { return new Set(m.pieces.filter(p => p.ing === ing).map(p => p.g)).size; }
function ingList(m) { return [...new Set(m.pieces.map(p => p.ing))]; }

const PLACE_R = .75;
function gauss(r) { return Math.sqrt(-2 * Math.log(r() || 1e-6)) * Math.cos(TAU * r()); }
/* Adds one "drop" (group) of an ingredient. centre = {x,y} for a cluster, null for a full scatter. */
function addGroup(m, ing, r, centre, now) {
  const def = FL.ING[ing], g = m.gc++; const fresh = [];
  const count = centre ? Math.max(3, Math.round(def.n * .38)) : def.n;
  const same = m.pieces.filter(p => p.ing === ing);
  for (let i = 0; i < count; i++) {
    let best = null, bd = -1;
    for (let k = 0; k < (centre ? 3 : 6); k++) {
      let x, y;
      if (centre) { x = centre.x + gauss(r) * .2; y = centre.y + gauss(r) * .2; }
      else { const a = r() * TAU, d = Math.sqrt(r()) * PLACE_R; x = Math.cos(a) * d; y = Math.sin(a) * d; }
      const d0 = Math.hypot(x, y); if (d0 > PLACE_R) { const k2 = PLACE_R * (.9 + r() * .1) / d0; x *= k2; y *= k2; }
      let md = 9; for (const q of same) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < md) md = dd; } for (const q of fresh) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < md) md = dd; }
      if (md > bd) { bd = md; best = [x, y]; }
    }
    const p = newPiece(ing, best[0], best[1], r, g); p.born = now || 0; fresh.push(p);
  }
  m.pieces.push(...fresh); return g;
}
function spiralStroke(r, rot, maxR, turns) {
  const pts = [], N = 230;
  for (let i = 0; i < N; i++) { const u = i / (N - 1), a = rot + u * turns * TAU, d = .06 + (maxR - .06) * u; pts.push([Math.cos(a) * d + (r() - .5) * .01, Math.sin(a) * d + (r() - .5) * .01]); }
  return pts;
}

/* ---------- Flavor DNA ---------- */
function computeDNA(m) {
  const sum = FL.DOUGH.flavor.slice(); const f = [0, .7, 1, 1.25];
  for (const s of m.sauces) { const d = FL.SAUCE[s.id]; if (!d || !s.strokes.some(x => x.length)) continue; const w = m.sauces.length > 1 ? .75 : 1; d.flavor.forEach((v, i) => sum[i] += v * w); }
  for (const ing of ingList(m)) { const lv = Math.min(3, levelOf(m, ing)); FL.ING[ing].flavor.forEach((v, i) => sum[i] += v * f[lv]); }
  return sum.map(v => +(10 * (1 - Math.exp(-v / 9))).toFixed(2));
}
function recipeDNA(rc) { return computeDNA({ sauces: rc.sauces.map(s => ({ id: s, strokes: [[[0, 0]]] })), pieces: rc.items.map(i => ({ ing: i, g: 1 })) }); }

/* ---------- SVG: radar ---------- */
function radarSVG(vals, o) {
  o = o || {}; const S = o.size || 300, cx = S / 2, cy = S / 2 + 4, Rr = S * .34, n = 6;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * TAU / n; return [cx + Math.cos(a) * Rr * v / 10, cy + Math.sin(a) * Rr * v / 10]; };
  const poly = v => v.map((x, i) => pt(i, x).join(',')).join(' ');
  let s = `<svg viewBox="0 0 ${S} ${S}" class="radar" role="img" aria-label="Flavor DNA radar chart: ${FL.DIMS.map((d, i) => d + ' ' + vals[i].toFixed(1)).join(', ')}">`;
  [2.5, 5, 7.5, 10].forEach(l => s += `<polygon points="${poly(Array(6).fill(l))}" fill="${l === 10 ? 'rgba(255,255,255,.55)' : 'none'}" stroke="#d8cdb8" stroke-width="${l === 10 ? 1.4 : 1}"/>`);
  for (let i = 0; i < n; i++) { const p = pt(i, 10); s += `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#d8cdb8"/>`; }
  if (o.overlay) s += `<polygon points="${poly(o.overlay)}" fill="rgba(79,138,43,.14)" stroke="#4f8a2b" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<polygon points="${poly(vals)}" fill="rgba(200,38,27,.24)" stroke="#c8261b" stroke-width="2.4" stroke-linejoin="round"/>`;
  vals.forEach((v, i) => { const p = pt(i, v); s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#c8261b" stroke="#fff" stroke-width="1.5"/>`; });
  FL.DIMS.forEach((d, i) => { const p = pt(i, 12.6); s += `<text x="${p[0]}" y="${p[1] - 2}" text-anchor="middle" class="rl">${d}</text><text x="${p[0]}" y="${p[1] + 11}" text-anchor="middle" class="rv">${vals[i].toFixed(1)}</text>`; });
  return s + '</svg>';
}

/* ---------- SVG: oven ---------- */
function ovenSVG(id, big) {
  return `<svg viewBox="0 0 400 350" class="oven ${big ? 'big' : ''}" aria-hidden="true">
  <defs>
    <pattern id="${id}b" width="30" height="16" patternUnits="userSpaceOnUse"><rect width="30" height="16" fill="none"/><path d="M0 8H30M0 0H30M15 0V8M0 8V16M30 8V16" stroke="rgba(70,28,12,.45)" stroke-width="1.6" fill="none"/><rect x="2" y="2" width="11" height="5" fill="rgba(255,190,140,.08)"/><rect x="17" y="10" width="11" height="5" fill="rgba(0,0,0,.08)"/></pattern>
    <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d27a4a"/><stop offset="1" stop-color="#a64a28"/></linearGradient>
    <radialGradient id="${id}s" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="rgba(255,230,200,.45)"/><stop offset=".6" stop-color="rgba(255,230,200,0)"/><stop offset="1" stop-color="rgba(40,10,0,.4)"/></radialGradient>
    <radialGradient id="${id}i" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#ffd36a"/><stop offset=".35" stop-color="#ff8a2a"/><stop offset=".8" stop-color="#6b1d0a"/><stop offset="1" stop-color="#2a0a04"/></radialGradient>
    <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="rgba(255,150,60,.75)"/><stop offset="1" stop-color="rgba(255,150,60,0)"/></radialGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#ffa72b"/><stop offset="1" stop-color="#e5461a"/></linearGradient>
  </defs>
  <ellipse class="glow" cx="200" cy="240" rx="190" ry="110" fill="url(#${id}g)"/>
  <rect x="168" y="6" width="64" height="86" rx="4" fill="url(#${id}d)"/><rect x="168" y="6" width="64" height="86" rx="4" fill="url(#${id}b)"/>
  <rect x="160" y="0" width="80" height="14" rx="3" fill="#8f3b20"/><rect x="160" y="0" width="80" height="14" rx="3" fill="url(#${id}b)"/>
  <g class="smoke"><circle cx="200" cy="-4" r="9"/><circle cx="208" cy="-4" r="7"/><circle cx="194" cy="-4" r="8"/></g>
  <path d="M30 262C30 118 110 48 200 48S370 118 370 262Z" fill="url(#${id}d)"/>
  <path d="M30 262C30 118 110 48 200 48S370 118 370 262Z" fill="url(#${id}b)"/>
  <path d="M30 262C30 118 110 48 200 48S370 118 370 262Z" fill="url(#${id}s)"/>
  <path d="M128 262V208Q128 150 200 150T272 208V262Z" fill="#3a1a10"/>
  <path d="M136 262V210Q136 160 200 160T264 210V262Z" fill="url(#${id}i)"/>
  <g class="flames" transform="translate(0,0)"><path class="fl f1" d="M160 262Q152 232 170 214Q168 236 182 226Q176 246 190 262Z" fill="url(#${id}f)"/><path class="fl f2" d="M184 262Q180 218 204 192Q202 224 222 210Q214 240 226 262Z" fill="url(#${id}f)"/><path class="fl f3" d="M212 262Q208 238 228 222Q226 238 240 232Q236 250 246 262Z" fill="url(#${id}f)"/><path class="fl f4" d="M176 262Q186 240 198 250Q206 232 218 262Z" fill="#ffe9a0" opacity=".85"/></g>
  <path d="M120 262V208Q120 140 200 140T280 208V262" fill="none" stroke="#6a2d17" stroke-width="12"/><path d="M120 262V208Q120 140 200 140T280 208V262" fill="none" stroke="url(#${id}b)" stroke-width="12"/>
  <rect x="14" y="262" width="372" height="76" rx="8" fill="#7d5a47"/><rect x="14" y="262" width="372" height="76" rx="8" fill="url(#${id}b)" opacity=".6"/><rect x="14" y="258" width="372" height="10" rx="4" fill="#b99a84"/>
  </svg>`;
}

/* ---------- SVG: squeeze bottle ---------- */
function bottleSVG(s) {
  return `<svg viewBox="0 0 70 150" class="bottle-svg" aria-hidden="true"><defs><linearGradient id="bg-${hashStr(s.name)}" x1="0" x2="1"><stop offset="0" stop-color="${s.dark}"/><stop offset=".35" stop-color="${s.color}"/><stop offset=".65" stop-color="${s.hi}"/><stop offset="1" stop-color="${s.dark}"/></linearGradient></defs>
  <path d="M26 6h18l4 18H22z" fill="#f4eee0" stroke="#cfc4aa"/><rect x="21" y="22" width="28" height="8" rx="2" fill="#e5dcc6" stroke="#cfc4aa"/>
  <path d="M21 30h28c10 6 16 16 16 34v70c0 8-6 14-14 14H19c-8 0-14-6-14-14V64c0-18 6-28 16-34z" fill="url(#bg-${hashStr(s.name)})" stroke="rgba(0,0,0,.25)" stroke-width="1.4"/>
  <rect x="12" y="72" width="46" height="46" rx="6" fill="rgba(255,255,255,.88)"/><circle cx="35" cy="95" r="12" fill="${s.color}" stroke="${s.dark}" stroke-width="2"/><path d="M29 95q6-8 12 0" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>
  <path d="M14 70q-3 30 0 66" stroke="rgba(255,255,255,.45)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}

/* ---------- coral rubber glove ---------- */
function gloveSVG() {
  return `<svg viewBox="0 0 80 100" width="80" height="100" aria-hidden="true">
  <g class="g-fingers" stroke="#c9453a" stroke-width="2" stroke-linejoin="round">
   <rect class="gf f-a" x="14" y="14" width="11" height="40" rx="5.5" fill="#ff7a6c"/><rect class="gf f-b" x="27" y="6" width="11" height="46" rx="5.5" fill="#ff7a6c"/>
   <rect class="gf f-c" x="40" y="9" width="11" height="44" rx="5.5" fill="#ff7a6c"/><rect class="gf f-d" x="53" y="18" width="10" height="36" rx="5" fill="#ff7a6c"/>
  </g>
  <path d="M12 44h54c3 0 5 3 5 6l-3 24c-1 6-6 10-12 10H24c-6 0-11-4-12-10L9 50c0-3 1-6 3-6z" fill="#ff8b7d" stroke="#c9453a" stroke-width="2"/>
  <path class="g-thumb" d="M12 54C2 50-2 42 3 36c4-4 9-1 12 6z" fill="#ff7a6c" stroke="#c9453a" stroke-width="2" stroke-linejoin="round"/>
  <rect x="17" y="82" width="44" height="16" rx="5" fill="#f2584a" stroke="#c9453a" stroke-width="2"/>
  <path d="M22 50q4 12 2 24" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}
