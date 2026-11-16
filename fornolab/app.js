/* FornoLab — application logic */
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = { model: emptyModel(), undo: [], step: 0, armed: null, drag: null, hover: null, pressing: false, stroke: null, dirty: true, young: false,
    dna: [0, 0, 0, 0, 0, 0], dnaT: [0, 0, 0, 0, 0, 0], overlay: null, overlayLock: null, tab: 'summary', restrict: new Set(), size: 500, dpr: 1, seed: 1, pointerType: 'mouse', fin: 0, pourTimer: null };
  const cv = $('#pizza'), ctx = cv.getContext('2d');
  const hasStroke = s => s.strokes.some(x => x.length);
  const sauceIds = () => S.model.sauces.filter(hasStroke).map(s => s.id);
  const proteinsIn = () => ingList(S.model).filter(i => FL.ING[i].cat === 'protein');
  const isEmpty = () => !sauceIds().length && !S.model.pieces.length;
  const mkRng = () => rng((Date.now() + (S.seed++) * 7919) >>> 0);

  /* ---------- toast / dialog ---------- */
  let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }
  function ask(title, text, buttons) {
    return new Promise(res => {
      $('#dlgTitle').textContent = title; $('#dlgText').textContent = text; const box = $('#dlgActions'); box.innerHTML = '';
      const done = v => { $('#dialog').hidden = true; document.removeEventListener('keydown', esc_); res(v); };
      const esc_ = e => { if (e.key === 'Escape') done(null); };
      buttons.forEach((b, i) => { const el = document.createElement('button'); el.className = 'btn ' + (b.cls || 'ghost'); el.textContent = b.label; el.onclick = () => done(b.value); box.appendChild(el); if (i === buttons.length - 1) setTimeout(() => el.focus(), 30); });
      document.addEventListener('keydown', esc_); $('#dialog').hidden = false;
    });
  }

  /* ---------- undo ---------- */
  function pushUndo() { S.undo.push(JSON.stringify(S.model)); if (S.undo.length > 80) S.undo.shift(); $('#undoBtn').disabled = false; }
  function undo() { if (!S.undo.length) { toast('Nothing to undo yet'); return; } stopPour(); S.model = JSON.parse(S.undo.pop()); $('#undoBtn').disabled = !S.undo.length; syncName(); refresh(); toast('Undone'); }

  /* ---------- canvas sizing & loop ---------- */
  function resize() { const w = Math.max(200, Math.round(cv.clientWidth)); S.size = w; S.dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = Math.round(w * S.dpr); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); S.dirty = true; }
  new ResizeObserver(resize).observe(cv);
  new ResizeObserver(() => document.documentElement.style.setProperty('--hh', $('.top').offsetHeight + 'px')).observe($('.top'));
  function overlayDraw(c, R) {
    const h = S.hover; if (!h) return;
    if (S.drag && S.drag.kind === 'ing' && S.drag.moved && Math.hypot(h.x, h.y) < 1.02) {
      c.save(); c.setLineDash([.05, .04]); c.lineWidth = .014; c.strokeStyle = 'rgba(200,38,27,.85)'; c.beginPath(); c.arc(h.x, h.y, .38, 0, TAU); c.stroke(); c.fillStyle = 'rgba(200,38,27,.07)'; c.fill(); c.restore();
    } else if (S.armed && Math.hypot(h.x, h.y) < 1.02 && S.pointerType === 'mouse') {
      c.save(); c.lineWidth = .012; c.strokeStyle = 'rgba(42,36,32,.6)'; c.beginPath(); c.arc(h.x, h.y, .06, 0, TAU); c.stroke(); c.restore();
    }
  }
  function frame(now) {
    let moved = false;
    for (let i = 0; i < 6; i++) { const d = S.dnaT[i] - S.dna[i]; if (Math.abs(d) > .005) { S.dna[i] += d * .16; moved = true; } else S.dna[i] = S.dnaT[i]; }
    if (moved || S.radarDirty) { $('#radar').innerHTML = radarSVG(S.dna, { overlay: S.overlayLock || S.overlay, size: 300 }); S.radarDirty = false; }
    if (S.dirty || S.young) { S.dirty = false; S.young = renderPizza(ctx, S.size, S.model, { now, dpr: S.dpr, after: overlayDraw }); }
    requestAnimationFrame(frame);
  }
  const redraw = () => { S.dirty = true; };

  /* ---------- model actions ---------- */
  function armSauce(id) {
    return new Promise(async res => {
      const have = S.model.sauces.map(s => s.id);
      if (have.includes(id) || have.length < FL.MAX_SAUCES) { S.armed = id; updateTray(); toast(`${id} ready — drag across the dough to pour`); return res(true); }
      const cur = S.model.sauces.map(s => s.id);
      const pick = await ask('Two sauces at most', `This pizza already carries ${cur.join(' and ')}. Which one should ${id} replace?`, [...cur.map(c => ({ label: 'Replace ' + c, value: c, cls: 'primary' })), { label: 'Keep both', value: null }]);
      if (!pick) return res(false);
      pushUndo(); S.model.sauces = S.model.sauces.filter(s => s.id !== pick); S.armed = id; refresh(); res(true);
    });
  }
  function ensureSauce(id) { let s = S.model.sauces.find(x => x.id === id); if (!s) { s = { id, strokes: [] }; S.model.sauces.push(s); } return s; }
  function pourAt(u) {
    if (!S.armed || Math.hypot(u.x, u.y) > 1.0) { S.stroke = null; return; }
    const s = ensureSauce(S.armed);
    if (!S.stroke) { S.stroke = []; s.strokes.push(S.stroke); S.stroke.push([u.x, u.y]); }
    else { const l = S.stroke[S.stroke.length - 1]; if (Math.hypot(l[0] - u.x, l[1] - u.y) > .018) S.stroke.push([u.x, u.y]); else return; }
    redraw(); S.refreshSoon = true;
  }
  function stopPour() { if (S.pourTimer) { clearInterval(S.pourTimer); S.pourTimer = null; } }
  function autoPour() {
    if (!S.armed) { toast('Pick a sauce bottle first'); return; }
    stopPour(); pushUndo(); const s = ensureSauce(S.armed), st = []; s.strokes.push(st); const r = mkRng();
    const pts = spiralStroke(r, r() * TAU, .7, 5.4); let i = 0;
    S.pourTimer = setInterval(() => { for (let k = 0; k < 7 && i < pts.length; k++) st.push(pts[i++]); redraw(); if (i >= pts.length) { stopPour(); refresh(); } }, 16);
  }
  async function addIngredient(id, centre) {
    const def = FL.ING[id];
    if (levelOf(S.model, id) >= FL.MAX_LEVEL) { toast(`${id} is already at the maximum level. Lower it in Summary to move it.`); shake(id); return; }
    let snap = false;
    if (def.cat === 'protein') {
      const c = FL.proteinConflict(proteinsIn(), id);
      if (c) {
        shake(id);
        const ok = await ask('Proteins don\'t mix like that', `Only one main protein fits a Neapolitan pizza — except Beef Bacon + Chorizo or Curry Sausage + Chorizo. You already have ${c.blocking.join(' + ')}. Replace it with ${id}?`, [{ label: 'Keep ' + c.blocking.join(' + '), value: false }, { label: 'Replace with ' + id, value: true, cls: 'primary' }]);
        if (!ok) return;
        pushUndo(); snap = true; S.model.pieces = S.model.pieces.filter(p => !c.blocking.includes(p.ing));
      }
    }
    if (!snap) pushUndo();
    addGroup(S.model, id, mkRng(), centre || null, performance.now());
    refresh(); S.young = true;
  }
  function lowerLevel(id) { const gs = [...new Set(S.model.pieces.filter(p => p.ing === id).map(p => p.g))]; if (!gs.length) return; pushUndo(); const last = Math.max(...gs); S.model.pieces = S.model.pieces.filter(p => !(p.ing === id && p.g === last)); refresh(); }
  function removeIng(id) { pushUndo(); S.model.pieces = S.model.pieces.filter(p => p.ing !== id); refresh(); }
  function removeSauce(id) { pushUndo(); S.model.sauces = S.model.sauces.filter(s => s.id !== id); if (S.armed === id) S.armed = null; refresh(); }
  function shake(id) { const el = document.querySelector(`.pan[data-id="${CSS.escape(id)}"]`); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }
  async function resetPizza(ask_) {
    if (ask_ && !isEmpty()) { const ok = await ask('Start over?', 'This clears your whole pizza. You can still undo it afterwards.', [{ label: 'Keep building', value: false }, { label: 'Reset pizza', value: true, cls: 'primary' }]); if (!ok) return; }
    stopPour(); pushUndo(); S.model = emptyModel(); S.armed = null; syncName(); refresh(); toast('Fresh dough, blank canvas');
  }

  /* ---------- recipes ---------- */
  const presetCache = {};
  function buildPreset(rc, animate) {
    const m = emptyModel(), r = rng(hashStr(rc.name)); m.name = rc.name; m.recipe = rc.name;
    rc.sauces.forEach((id, i) => m.sauces.push({ id, strokes: [spiralStroke(r, r() * TAU + i * 3.1, i ? .5 : .72, i ? 3.6 : 5.6)] }));
    let k = 0; const now = performance.now();
    const order = { cheese: 0, pre: 1, post: 2 };
    [...rc.items].sort((a, b) => order[FL.ING[a].layer] - order[FL.ING[b].layer]).forEach(id => { const before = m.pieces.length; addGroup(m, id, rng(hashStr(rc.name + id)), null, 0); if (animate) for (let j = before; j < m.pieces.length; j++) m.pieces[j].born = now + Math.min(900, (k++) * 3.2); });
    return m;
  }
  const sigOf = (sauces, items) => [...sauces].sort().join('|') + '#' + [...items].sort().join('|');
  const currentSig = () => sigOf(sauceIds(), ingList(S.model));
  const matchedRecipe = () => FL.RECIPES.find(r => r.verified && sigOf(r.sauces, r.items) === currentSig());
  async function useRecipe(rc) {
    if (!rc.verified) {
      const go = await ask(rc.name, 'This official recipe\'s configuration still requires verification, so FornoLab won\'t invent its ingredients. You can start a blank pizza under this name and build it yourself.', [{ label: 'Close', value: false }, { label: 'Start blank pizza', value: true, cls: 'primary' }]);
      if (go) { stopPour(); pushUndo(); S.model = emptyModel(); S.model.name = rc.name; S.armed = null; syncName(); refresh(); goStep(0); } return;
    }
    if (!isEmpty()) { const ok = await ask('Replace your pizza?', `Load ${rc.name}? Your current pizza will be replaced — you can undo it.`, [{ label: 'Keep mine', value: false }, { label: 'Load ' + rc.name, value: true, cls: 'primary' }]); if (!ok) return; }
    stopPour(); pushUndo(); S.model = buildPreset(rc, true); S.armed = null; syncName(); refresh(); S.young = true;
    toast(`${rc.name} loaded — tweak anything you like`);
    if (rc.note) setTimeout(() => toast(rc.note), 2900);
  }
  function syncName() { $('#pizzaName').value = S.model.name || ''; }

  /* ---------- thumbnails ---------- */
  const HS = { 'Pistachio Powder': 3.4, 'Parmesan': 2.3, 'Green Onion': 1.8, 'Microgreens': 1.5, 'Blue Cheese': 1.6, 'Garlic Paste': 1.7, 'Olive': 1.5, 'Radish': 1.4, 'Shredded Cheese': 1.15, 'Mozzarella': 1.1, 'Potato Strips': 1.2, 'Basil Pesto Garnish': 1.7, 'Cream Cheese': 1.3, 'Cajun Sauce': 1.1, 'Pesto Drizzle': 1.1, 'Onion': 1.2, 'Walnut': 1.5, 'Cherry Tomato': 1.2, 'Walnut ': 1 };
  function heapCanvas(id) {
    const def = FL.ING[id], w = 210, h = 128, dpr = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr);
    const k = 190 * (HS[id] || 1.25), r = rng(hashStr(id)), cnt = Math.min(def.n >= 60 ? 80 : def.n >= 30 ? 42 : 17, def.n), ps = [];
    for (let i = 0; i < cnt; i++) { let best, bd = -1; for (let t = 0; t < 8; t++) { const a = r() * TAU, d = Math.sqrt(r()), x = Math.cos(a) * d * w * .42 / k, y = Math.sin(a) * d * h * .36 / k; let md = 9; for (const q of ps) md = Math.min(md, Math.hypot(q.x - x, q.y - y)); if (md > bd) { bd = md; best = [x, y]; } } ps.push(newPiece(id, best[0], best[1], r, 0)); }
    g.translate(w / 2, h / 2); g.scale(k, k); ps.forEach(p => drawPiece(g, k, p)); return c;
  }
  function iconCanvas(id, size) {
    const c = document.createElement('canvas'); const dpr = 2; c.width = c.height = size * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr); g.translate(size / 2, size / 2);
    const k = size * 3.1 * (HS[id] ? Math.min(HS[id], 2.4) : 1); g.scale(k, k); drawPiece(g, k, newPiece(id, 0, 0, rng(hashStr(id) + 3), 0)); c.style.width = c.style.height = size + 'px'; return c;
  }

  /* ---------- tray ---------- */
  function renderSteps() {
    const done = i => { const id = FL.STEPS[i].id; if (id === 'sauce') return sauceIds().length > 0; if (id === 'bake') return false; return S.model.pieces.some(p => FL.ING[p.ing].cat === id); };
    $('#stepsNav').innerHTML = FL.STEPS.map((s, i) => `<button class="step ${i === S.step ? 'on' : ''} ${done(i) ? 'done' : ''}" data-i="${i}" aria-current="${i === S.step ? 'step' : 'false'}"><i>${done(i) && i !== S.step ? '✓' : i + 1}</i><span>${s.label}</span></button>`).join('');
  }
  function renderTray() {
    const st = FL.STEPS[S.step]; $('#trayTitle').textContent = st.title; $('#trayHint').textContent = st.hint; const body = $('#trayBody');
    if (st.id === 'sauce') {
      body.innerHTML = `<div class="bottles">${FL.SAUCES.map(s => `<button class="bottle" data-sauce="${esc(s.name)}" aria-label="${esc(s.name)} squeeze bottle">${bottleSVG(s)}<span>${esc(s.name)}</span><b class="tick" hidden>✓</b></button>`).join('')}</div>
      <div class="sauce-tools"><button class="btn" id="autoPour">Pour for me</button><button class="btn ghost" id="clearSauce">Clear sauce</button></div>
      <div class="pour-info" id="pourInfo"></div>`;
    } else if (st.id === 'bake') {
      body.innerHTML = `<div class="bake-panel"><p>Your pizza has <b id="bkCount">0</b> ingredients. The oven takes it from here: sauce and cheese bake, then your finishers land on top.</p><button class="btn primary xl" id="bakeNow">Fire the oven</button></div>`;
    } else {
      const items = FL.INGREDIENTS.filter(i => i.cat === st.id);
      body.innerHTML = `<div class="pans">${items.map(i => `<button class="pan" data-id="${esc(i.name)}" aria-label="${esc(i.name)} — drag onto the pizza or press Enter to scatter"><span class="pan-tin"><span class="pan-well"></span></span><span class="pan-name">${esc(i.name)}</span><b class="lv" hidden></b></button>`).join('')}</div>`;
      $$('#trayBody .pan').forEach(p => p.querySelector('.pan-well').appendChild(heapCanvas(p.dataset.id)));
    }
    updateTray();
  }
  function updateTray() {
    const st = FL.STEPS[S.step];
    $$('#trayBody .pan').forEach(p => { const id = p.dataset.id, lv = levelOf(S.model, id), b = p.querySelector('.lv'); b.hidden = !lv; b.textContent = '×' + lv; p.classList.toggle('conflict', FL.ING[id].cat === 'protein' && lv === 0 && !!FL.proteinConflict(proteinsIn(), id)); p.title = p.classList.contains('conflict') ? 'Doesn\'t pair with your current protein — click to swap' : id; });
    $$('#trayBody .bottle').forEach(b => { const id = b.dataset.sauce; b.classList.toggle('armed', S.armed === id); b.querySelector('.tick').hidden = !sauceIds().includes(id); });
    const pi = $('#pourInfo'); if (pi) pi.innerHTML = S.armed ? `<b>${esc(S.armed)}</b> is loaded. Drag across the dough to draw, or use “Pour for me”.` : 'Tap a bottle to load it — or press and drag it straight onto the pizza.';
    const bc = $('#bkCount'); if (bc) bc.textContent = ingList(S.model).length + sauceIds().length;
    $('.stage').classList.toggle('armed', !!S.armed && st.id === 'sauce');
    $('#stageMsg').textContent = S.armed ? `Pouring ${S.armed}…` : st.hint;
  }
  function goStep(i) { S.step = Math.max(0, Math.min(FL.STEPS.length - 1, i)); if (FL.STEPS[S.step].id !== 'sauce') S.armed = null; renderTray(); renderSteps(); $('#prevBtn').disabled = S.step === 0; const last = S.step === FL.STEPS.length - 1; $('#nextBtn').textContent = last ? 'Fire the oven' : 'Next: ' + FL.STEPS[S.step + 1].label; $('#ovenDock').classList.toggle('hot', last); }

  /* ---------- info panels ---------- */
  const GROUPS = [['Sauce', 'sauce'], ['Cheese', 'cheese'], ['Protein', 'protein'], ['Vegetables', 'vegetable'], ['Garnishes', 'garnish']];
  function renderSummary() {
    const m = S.model, rc = matchedRecipe(); let status;
    if (isEmpty()) status = 'Blank pizza — start with a sauce or load a recipe.';
    else if (rc) status = `<b>${rc.official ? 'Official FornoLab recipe' : 'Custom variation (not on the official menu)'}:</b> ${esc(rc.name)}`;
    else if (m.recipe) status = `Based on <b>${esc(m.recipe)}</b> · modified — now a custom creation`;
    else status = '<b>Custom creation</b>';
    let h = `<div class="status">${status}</div>`;
    GROUPS.forEach(([label, cat]) => {
      let rows = '';
      if (cat === 'sauce') rows = sauceIds().map(id => `<div class="row"><span class="dot" style="background:${FL.SAUCE[id].color}"></span><span class="nm">${esc(id)}</span><button class="x" data-rmsauce="${esc(id)}" aria-label="Remove ${esc(id)}">✕</button></div>`).join('');
      else rows = ingList(m).filter(i => FL.ING[i].cat === cat).map(id => { const lv = levelOf(m, id); return `<div class="row"><canvas data-icon="${esc(id)}" width="30" height="30"></canvas><span class="nm">${esc(id)}${FL.ING[id].layer === 'post' ? ' <small style="color:var(--mute)">· after oven</small>' : ''}</span><span class="lvl"><button data-less="${esc(id)}" aria-label="Less ${esc(id)}">−</button><span class="pips" title="Level ${lv} of 3">${[1, 2, 3].map(n => `<i class="${n <= lv ? 'on' : ''}"></i>`).join('')}</span><button data-more="${esc(id)}" aria-label="More ${esc(id)}">+</button></span><button class="x" data-rm="${esc(id)}" aria-label="Remove ${esc(id)}">✕</button></div>`; }).join('');
      h += `<div class="grp"><h4>${label}</h4>${rows || '<div class="none">None yet</div>'}</div>`;
    });
    $('#tab-summary').innerHTML = h;
    $$('#tab-summary canvas[data-icon]').forEach(c => { const id = c.dataset.icon; c.replaceWith(Object.assign(iconCanvas(id, 30), { })); });
    const badge = $('#recipeBadge'); badge.textContent = rc ? (rc.official ? 'Official recipe' : 'Custom variation') : (m.recipe ? 'Modified recipe' : 'Custom creation'); badge.classList.toggle('custom', !rc);
    $('#pizzaName').placeholder = rc ? rc.name : 'Name your pizza';
  }
  function renderScreen() {
    let h = `<div class="warn"><b>Screening aid only.</b> FornoLab does not verify what is inside any sauce, marinade or packaged ingredient, and cannot rule out cross-contact. Confirm ingredients and allergens with the restaurant before ordering.</div>
      <p style="margin:0 0 8px;font-weight:700">I want to avoid:</p><div class="checks">${FL.RESTRICTIONS.map(r => `<label><input type="checkbox" data-r="${r.id}" ${S.restrict.has(r.id) ? 'checked' : ''}>${r.label}</label>`).join('')}</div>`;
    const parts = [{ n: 'Pizza dough', d: FL.DOUGH }, ...sauceIds().map(id => ({ n: id, d: FL.SAUCE[id] })), ...ingList(S.model).map(id => ({ n: id, d: FL.ING[id] }))];
    if (!S.restrict.size) h += '<div class="none">Choose anything you want to avoid and FornoLab will flag possible matches in your pizza.</div>';
    else {
      let hits = 0;
      parts.forEach(p => { const tags = p.d.tags || [], m = [...S.restrict].filter(r => tags.includes(r) || (tags.includes('unknownMeat') && ['pork', 'beef', 'poultry'].includes(r))); if (m.length) { hits++; h += `<div class="hit"><b>${esc(p.n)} — possible match (unverified)</b>${m.map(x => FL.RESTRICTIONS.find(r => r.id === x).label).join(', ')}${p.d.why ? ' · ' + esc(p.d.why) : ''}</div>`; } });
      if (!hits) h += '<div class="hit ok"><b>No match found in our limited ingredient data</b>This is not a guarantee. Ingredient lists and cross-contact must be confirmed with the restaurant.</div>';
    }
    $('#tab-screen').innerHTML = h;
  }
  const rdna = {}; const recDNA = rc => rdna[rc.name] || (rdna[rc.name] = recipeDNA(rc));
  function renderRecipes() {
    const card = rc => { const cur = rc.verified && matchedRecipe() === rc;
      const pv = rc.verified ? `<div class="pvslot" data-rc="${esc(rc.name)}"></div>` : '<div class="pv">?</div>';
      return `<button class="rc ${rc.verified ? '' : 'unv'} ${cur ? 'cur' : ''}" data-rc="${esc(rc.name)}">${pv}<h5>${esc(rc.name)}</h5>
      <span class="badge ${rc.official ? (rc.verified ? '' : 'vr') : 'cu'}">${rc.official ? (rc.verified ? 'Official' : 'Needs verification') : 'Custom variation'}</span>
      <p>${rc.verified ? [...rc.sauces, ...rc.items].map(esc).join(' · ') : 'Official recipe — configuration requires verification.'}</p></button>`; };
    $('#tab-recipes').innerHTML = `<div class="rhead"><button class="btn" id="blankBtn">Start from blank pizza</button></div>
      <div class="rsec">Official menu · 18</div><div class="rgrid">${FL.RECIPES.filter(r => r.official).map(card).join('')}</div>
      <div class="rsec">Custom variation</div><div class="rgrid">${FL.RECIPES.filter(r => !r.official).map(card).join('')}</div>
      <p class="fine">Recipes marked “Needs verification” keep their official name only; FornoLab does not guess their ingredients.</p>`;
    $$('#tab-recipes .pvslot').forEach(el => { const rc = FL.RECIPES.find(r => r.name === el.dataset.rc); const m = presetCache[rc.name] || (presetCache[rc.name] = buildPreset(rc, false)); const c = modelCanvas(m, 130, false); c.style.width = '100%'; c.style.height = 'auto'; el.replaceWith(c); });
  }
  function renderMatches() {
    const mt = $('#matches'), cur = new Set([...sauceIds(), ...ingList(S.model)]);
    const dna = computeDNA(S.model);
    if (cur.size < 2) { mt.innerHTML = '<span class="fine">Add a few ingredients to see the closest official recipes.</span>'; $('#dnaLine').textContent = isEmpty() ? 'Plain dough — a blank canvas' : 'Keep going…'; return; }
    const order = dna.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(x => FL.DIMS[x[1]]);
    $('#dnaLine').textContent = `Leans ${order[0].toLowerCase()} & ${order[1].toLowerCase()}`;
    const sc = FL.RECIPES.filter(r => r.verified).map(r => { const set = new Set([...r.sauces, ...r.items]), inter = [...cur].filter(x => set.has(x)).length, jac = inter / (cur.size + set.size - inter), d = recDNA(r), dist = Math.sqrt(d.reduce((a, v, i) => a + (v - dna[i]) ** 2, 0)) / (10 * Math.sqrt(6)); return { r, s: .55 * jac + .45 * Math.max(0, 1 - dist * 1.8) }; }).sort((a, b) => b.s - a.s).slice(0, 3);
    mt.innerHTML = sc.map(x => `<button class="chip ${S.overlayLock === recDNA(x.r) ? 'on' : ''}" data-match="${esc(x.r.name)}" title="Hover to compare its Flavor DNA, click to load">${esc(x.r.name)} <b>${Math.round(x.s * 100)}%</b></button>`).join('');
  }
  function refresh() {
    S.dnaT = computeDNA(S.model); redraw(); S.radarDirty = true;
    renderSteps(); updateTray(); renderSummary(); renderMatches(); if (S.tab === 'screen') renderScreen(); recipeCurrent();
    $('#emptyHint').hidden = !isEmpty(); $('#undoBtn').disabled = !S.undo.length;
  }
  function recipeCurrent() { const rc = matchedRecipe(); $$('#tab-recipes .rc').forEach(el => el.classList.toggle('cur', !!rc && el.dataset.rc === rc.name)); }
  function setTab(t) { S.tab = t; $$('.tabs button').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); $$('.tabpane').forEach(p => p.hidden = p.id !== 'tab-' + t); if (t === 'screen') renderScreen(); }

  /* ---------- glove cursor + pointer interaction ---------- */
  const glove = $('#glove'), gi = $('#gloveItem');
  function setCarry(kind, id) {
    const g = gi.getContext('2d'); g.clearRect(0, 0, 88, 88);
    if (!kind) { glove.classList.remove('carry'); return; }
    g.save(); g.translate(44, 44);
    if (kind === 'ing') { const k = 330 * Math.min(HS[id] || 1, 2.2); g.scale(k, k); drawPiece(g, k, newPiece(id, 0, 0, rng(hashStr(id) + 3), 0)); }
    else { const s = FL.SAUCE[id]; g.rotate(-.6); g.fillStyle = s.color; g.strokeStyle = s.dark; g.lineWidth = 3; g.beginPath(); g.roundRect(-14, -8, 28, 40, 8); g.fill(); g.stroke(); g.fillStyle = '#f4eee0'; g.beginPath(); g.moveTo(-5, -8); g.lineTo(5, -8); g.lineTo(2, -28); g.lineTo(-2, -28); g.closePath(); g.fill(); g.stroke(); }
    g.restore(); glove.classList.add('carry');
  }
  const inPizza = u => Math.hypot(u.x, u.y) <= 1.0;
  function toUnit(e) { const r = cv.getBoundingClientRect(), R = r.width / 2 * .9; return { x: (e.clientX - r.left - r.width / 2) / R, y: (e.clientY - r.top - r.height / 2) / R }; }
  function endDrag() { if (S.drag) { const el = S.drag.el; el && el.classList.remove('dragging'); } S.drag = null; setCarry(null); glove.classList.remove('grab'); S.pressing = false; if (S.stroke || S.refreshSoon) { S.stroke = null; S.refreshSoon = false; refresh(); } redraw(); }

  window.addEventListener('pointermove', e => {
    S.pointerType = e.pointerType;
    if (e.pointerType === 'mouse' && document.body.classList.contains('glove-on')) { S.gx = 1; glove.classList.add('on'); glove.style.transform = `translate(${e.clientX - 28}px,${e.clientY - 12}px)`; }
    const u = toUnit(e); S.hover = u;
    if (S.drag) {
      if (!S.drag.moved && Math.hypot(e.clientX - S.drag.sx, e.clientY - S.drag.sy) > 6) S.drag.moved = true;
      if (S.drag.kind === 'sauce' && S.pressing) pourAt(u);
      redraw();
    } else if (S.pressing && S.armed) { pourAt(u); }
    else if (S.armed) redraw();
    if (S.refreshSoon && !S.rs) { S.rs = setTimeout(() => { S.rs = null; updateTray(); renderSteps(); }, 200); }
  });
  window.addEventListener('pointerdown', e => { S.pointerType = e.pointerType; if (e.pointerType === 'mouse') glove.classList.add('grab'); });
  window.addEventListener('pointerup', e => {
    glove.classList.remove('grab');
    const d = S.drag;
    if (d && d.kind === 'ing') {
      const u = toUnit(e);
      if (d.moved) { if (inPizza(u)) addIngredient(d.id, { x: u.x, y: u.y }); else toast('Drop it on the pizza to place it'); }
      else addIngredient(d.id, null);
    } else if (d && d.kind === 'sauce' && !d.moved) { /* click on bottle = already armed */ }
    endDrag();
  });
  window.addEventListener('pointercancel', endDrag); window.addEventListener('blur', endDrag);
  cv.addEventListener('pointerdown', e => { if (!S.armed || e.button) return; e.preventDefault(); pushUndo(); S.pressing = true; S.stroke = null; S.drag = null; pourAt(toUnit(e)); S.hover = toUnit(e); });
  document.addEventListener('mouseleave', () => glove.classList.remove('on')); document.addEventListener('mouseenter', () => { if (S.pointerType === 'mouse' && document.body.classList.contains('glove-on') && S.gx) glove.classList.add('on'); });

  $('#trayBody').addEventListener('pointerdown', async e => {
    if (e.pointerType !== 'mouse' || e.button) return;
    const pan = e.target.closest('.pan'), bt = e.target.closest('.bottle');
    if (pan) { S.drag = { kind: 'ing', id: pan.dataset.id, sx: e.clientX, sy: e.clientY, moved: false, el: pan }; pan.classList.add('dragging'); setCarry('ing', pan.dataset.id); e.preventDefault(); }
    else if (bt) { const id = bt.dataset.sauce; S.drag = { kind: 'sauce', id, sx: e.clientX, sy: e.clientY, moved: false, el: bt }; e.preventDefault(); const ok = await armSauce(id); if (!ok) { S.drag = null; setCarry(null); return; } if (S.drag) { setCarry('sauce', id); if (S.pressing === false) { S.pressing = true; pushUndo(); S.stroke = null; } } }
  });
  $('#trayBody').addEventListener('click', async e => {
    const mouseHandled = S.pointerType === 'mouse' && e.detail > 0;
    const pan = e.target.closest('.pan'), bt = e.target.closest('.bottle');
    if (pan && !mouseHandled) addIngredient(pan.dataset.id, null);
    if (bt && !mouseHandled) await armSauce(bt.dataset.sauce);
    if (e.target.closest('#autoPour')) autoPour();
    if (e.target.closest('#clearSauce')) { if (S.model.sauces.length) { pushUndo(); S.model.sauces = []; S.armed = null; refresh(); } else toast('No sauce on the pizza yet'); }
    if (e.target.closest('#bakeNow')) finishPizza();
  });

  /* ---------- panels events ---------- */
  $('#tab-summary').addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; const d = t.dataset; if (d.rm) removeIng(d.rm); else if (d.rmsauce) removeSauce(d.rmsauce); else if (d.less) lowerLevel(d.less); else if (d.more) addIngredient(d.more, null); });
  $('#tab-screen').addEventListener('change', e => { const r = e.target.dataset.r; if (!r) return; e.target.checked ? S.restrict.add(r) : S.restrict.delete(r); renderScreen(); });
  $('#tab-recipes').addEventListener('click', e => { if (e.target.closest('#blankBtn')) return resetPizza(true); const c = e.target.closest('.rc'); if (c) useRecipe(FL.RECIPES.find(r => r.name === c.dataset.rc)); });
  $('#tab-recipes').addEventListener('mouseover', e => { const c = e.target.closest('.rc'); if (!c) return; const rc = FL.RECIPES.find(r => r.name === c.dataset.rc); S.overlay = rc.verified ? recDNA(rc) : null; S.radarDirty = true; });
  $('#tab-recipes').addEventListener('mouseleave', () => { S.overlay = null; S.radarDirty = true; });
  $('#matches').addEventListener('mouseover', e => { const c = e.target.closest('.chip'); if (c) { S.overlay = recDNA(FL.RECIPES.find(r => r.name === c.dataset.match)); S.radarDirty = true; } });
  $('#matches').addEventListener('mouseleave', () => { S.overlay = null; S.radarDirty = true; });
  $('#matches').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) useRecipe(FL.RECIPES.find(r => r.name === c.dataset.match)); });
  $$('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $('#pizzaName').addEventListener('input', e => { S.model.name = e.target.value; });
  $('#stepsNav').addEventListener('click', e => { const b = e.target.closest('.step'); if (b) goStep(+b.dataset.i); });
  $('#prevBtn').onclick = () => goStep(S.step - 1);
  $('#nextBtn').onclick = () => S.step === FL.STEPS.length - 1 ? finishPizza() : goStep(S.step + 1);
  $('#undoBtn').onclick = undo; $('#resetBtn').onclick = () => resetPizza(true); $('#finishBtn').onclick = finishPizza;
  $('#recipesBtn').onclick = () => { setTab('recipes'); document.querySelector('.tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); undo(); } if (e.key === 'Escape') { if (!$('#finish').hidden && S.finDone) closeFinish(); else if (!$('#receipt').hidden) $('#receipt').hidden = true; } });

  /* ---------- finish: oven → bake → garnish rain ---------- */
  const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  function closeFinish() { S.fin++; $('#finish').hidden = true; document.body.style.overflow = ''; }
  async function finishPizza() {
    if (isEmpty()) { toast('Add a sauce or a few toppings before the oven'); return; }
    stopPour(); S.armed = null; updateTray();
    const token = ++S.fin, ov = $('#finish'), fc = $('#finCanvas'), fx = fc.getContext('2d'), stage = ov.querySelector('.finish-stage');
    ov.hidden = false; S.finDone = false; $('#finActions').hidden = true; $('#finOven').innerHTML = ovenSVG('fo', true); $('#finOven').style.opacity = 1; stage.classList.remove('hot'); $('#bakeBar').style.width = 0; $('#bakeBar').parentElement.classList.remove('on');
    const P = Math.round(fc.clientWidth), dpr = Math.min(2, window.devicePixelRatio || 1); fc.width = fc.height = Math.round(P * dpr); const q = P * .68;
    const stageH = stage.clientHeight, mouthDy = stageH * .1;
    const rain = S.model.pieces.filter(p => FL.ING[p.ing].layer === 'post').filter((p, i, a) => a.length <= 130 || i % Math.ceil(a.length / 130) === 0);
    const r = rng(11); const rp = rain.map(p => ({ p, delay: r() * 1000, dur: 900 + r() * 500, spin: (r() - .5) * 10, sx: (r() - .5) * .3 }));
    const title = $('#finTitle'); const T0 = performance.now(); const hasRain = rp.length > 0;
    const tA = 600, tB = 1900, tC = 4700, tD = 5700, tEnd = tD + (hasRain ? 1000 + 1500 + 300 : 500);
    const bar = $('#bakeBar'), barBox = bar.parentElement;
    const setT = s => { if (title.textContent !== s) title.textContent = s; };
    (function loop(now) {
      if (token !== S.fin) return;
      const t = now - T0; fx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.clearRect(0, 0, P, P);
      let sc = 1, oy = 0, alpha = 1, baked = false, showRain = false;
      if (t < tA) { setT('Into the oven…'); }
      else if (t < tB) { const u = ease((t - tA) / (tB - tA)); sc = 1 - u * .72; oy = mouthDy * u; alpha = 1 - ease((u - .7) / .3); }
      else if (t < tC) { alpha = 0; setT('Fired at 450 °C'); stage.classList.add('hot'); barBox.classList.add('on'); bar.style.width = ((t - tB) / (tC - tB) * 100) + '%'; }
      else { const u = ease((t - tC) / (tD - tC)); sc = .28 + .72 * u; oy = mouthDy * (1 - u); alpha = Math.min(1, u * 1.6); baked = true; barBox.classList.remove('on'); stage.classList.remove('hot'); setT(t < tD ? 'Out of the oven!' : hasRain ? 'Finishing touches' : 'Buon appetito'); if (t > tD) $('#finOven').style.opacity = Math.max(.3, 1 - (t - tD) / 700); showRain = t > tD; }
      if (alpha > 0) {
        fx.save(); fx.globalAlpha = alpha; fx.translate(P / 2, P / 2 + oy); fx.scale(sc, sc); fx.translate(-P / 2, -P / 2); fx.translate((P - q) / 2, (P - q) / 2);
        renderPizza(fx, q, S.model, { baked, hidePost: true, dpr: dpr * 1, now: 1e12, after: (c, R) => {
          if (!showRain) return; const tr = t - tD;
          rp.forEach(o => { const u = (tr - o.delay) / o.dur; if (u <= 0) return; const e = Math.min(1, u), fall = e * e; const y = o.p.y + (1 - fall) * -1.75, x = o.p.x + (1 - fall) * o.sx; drawPiece(c, R, o.p, { dx: x - o.p.x, dy: y - o.p.y, rot: o.p.rot + (1 - fall) * o.spin, alpha: Math.min(1, u * 3), scale: 1 + (1 - fall) * .35 }); });
        } });
        fx.restore();
      }
      if (t < tEnd) requestAnimationFrame(loop);
      else { setT(S.model.name || 'Your pizza is ready'); S.finDone = true; $('#finActions').hidden = false; $('#toReceipt').focus(); }
    })(performance.now());
    document.body.style.overflow = 'hidden';
  }
  $('#backFromFinish').onclick = closeFinish;
  $('#toReceipt').onclick = () => { closeFinish(); showReceipt(); };

  /* ---------- receipt ---------- */
  function showReceipt() {
    const m = S.model, rc = matchedRecipe(), dna = computeDNA(m), nm = m.name || (rc ? rc.name : 'Custom Pizza');
    const sec = (title, rows) => `<div class="rc-sec"><h4>${title}</h4>${rows.length ? rows.map(r => `<div><span>${esc(r[0])}</span><span>${esc(r[1] || '')}</span></div>`).join('') : '<div><span>—</span><span></span></div>'}</div>`;
    const by = cat => ingList(m).filter(i => FL.ING[i].cat === cat).map(i => [i, 'level ' + levelOf(m, i) + '/3' + (FL.ING[i].layer === 'post' ? ' · after oven' : '')]);
    const top = dna.map((v, i) => [v, FL.DIMS[i]]).sort((a, b) => b[0] - a[0]);
    $('#paper').innerHTML = `<div class="rc-brand"><div class="wordmark">Forno<span>Lab</span></div></div><div class="rc-sub">Neapolitan Pizza Studio</div><hr>
      <div class="rc-name">${esc(nm)}</div><div class="rc-meta">32 cm Neapolitan · ${rc ? (rc.official ? 'Official recipe' : 'Custom variation') : (m.recipe ? 'Based on ' + esc(m.recipe) + ' · modified' : 'Custom creation')}</div>
      <div class="rc-pv" id="rcPv"></div><hr>
      ${sec('Sauce', sauceIds().map(i => [i, 'poured']))}${sec('Cheese', by('cheese'))}${sec('Protein', by('protein'))}${sec('Vegetables', by('vegetable'))}${sec('Garnishes', by('garnish'))}<hr>
      <div class="rc-sec"><h4>Flavor DNA · estimated</h4></div>
      <div class="rc-dna"><div style="max-width:250px;margin:0 auto;width:100%">${radarSVG(dna, { size: 300 })}</div><div class="rc-bars">${dna.map((v, i) => `<div><span>${FL.DIMS[i]}</span><i><b style="width:${v * 10}%"></b></i><span>${v.toFixed(1)}</span></div>`).join('')}</div></div>
      <p class="rc-meta" style="margin-top:6px">Leans ${top[0][1].toLowerCase()} &amp; ${top[1][1].toLowerCase()}</p><hr>
      <p class="rc-foot">A visual summary of your creation — no prices, no payment.<br>Flavor scores are estimates. Confirm ingredients and allergen information with the restaurant.</p><p class="rc-foot">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
    const pv = modelCanvas(m, 190, true); pv.removeAttribute('style'); pv.style.width = pv.style.height = '190px'; $('#rcPv').appendChild(pv);
    $('#receipt').hidden = false; $('#receipt').scrollTop = 0;
  }
  $('#newPizza').onclick = () => { $('#receipt').hidden = true; stopPour(); S.model = emptyModel(); S.undo = []; S.armed = null; syncName(); goStep(0); refresh(); toast('New dough, new idea — go!'); };
  $('#backToBuilder').onclick = () => { $('#receipt').hidden = true; };
  $('#printBtn').onclick = () => window.print();

  /* ---------- intro ---------- */
  function initIntro() {
    const rc = FL.RECIPES.find(r => r.name === 'Peri Bacon'); const c = modelCanvas(buildPreset(rc, false), 520, true); c.removeAttribute('style'); $('#boxPizza').appendChild(c);
    $('#startBtn').onclick = () => {
      const it = $('#intro'); it.classList.add('open'); $('#startBtn').disabled = true;
      setTimeout(() => { $('#app').hidden = false; requestAnimationFrame(() => { $('#app').classList.add('show'); resize(); }); it.classList.add('leaving'); document.body.classList.add('glove-on'); }, 1250);
      setTimeout(() => { it.remove(); resize(); }, 2300);
    };
  }

  /* ---------- boot ---------- */
  glove.querySelector('.glove-in').innerHTML = gloveSVG();
  $('#ovenDock').innerHTML = ovenSVG('od', false);
  renderRecipes(); setTab('summary'); goStep(0); refresh(); initIntro(); resize(); requestAnimationFrame(frame);
  window.FornoLab = { S, addIngredient, useRecipe, computeDNA, armSauce, pourAt, undo, resetPizza, finishPizza, showReceipt, FL };
})();
