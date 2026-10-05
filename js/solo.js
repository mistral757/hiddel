/* Csendes út — egyszemélyes, elmélkedő mód. */
(function () {
  const HEV = window.HEV, U = HEV.ui, D = HEV.data, R = D.reactions;
  const SHOCK = ['Sejtette', 'Meglepő', 'Hűha', 'Elképesztő', 'Lehetetlen'];
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const THIS_YEAR = new Date().getFullYear();
  let S = null;

  const msgCount = gap => U.clamp(9 - Math.ceil(gap / 2), 3, 7);
  const multOf = gap => Math.min(6, 1 + gap * 0.15);
  const eventsBetween = (a, b) => D.world.filter(e => e.y > a && e.y <= b);

  /* ---------- Beállítás ---------- */
  function setup() {
    HEV.scenery.setMode('calm');
    const prefs = HEV.store.get('soloPrefs', {});
    const oldY = prefs.old || THIS_YEAR - 7;
    const newY = prefs.now || THIS_YEAR;
    U.render(`
      <section class="screen">
        <button class="back" data-go="home">Vissza</button>
        <h2 class="title-md">Melyik két évet köti össze a vonal?</h2>
        <p class="lead">A régebbi éved felveszi a telefont, az újabb éved beszél. Neked kell meggyőznöd, hogy tényleg te vagy az.</p>
        <div class="mist">
          <div class="year-pair">
            <label class="year-field"><span>Régi én</span>
              <input id="yOld" type="number" inputmode="numeric" min="1930" max="${THIS_YEAR}" value="${oldY}"></label>
            <span class="year-dash" aria-hidden="true">—</span>
            <label class="year-field"><span>Mostani én</span>
              <input id="yNew" type="number" inputmode="numeric" min="1931" max="${THIS_YEAR}" value="${newY}"></label>
          </div>
          <div class="chips" role="group" aria-label="Gyors választás">
            <button class="chip" data-back="5">5 éve</button>
            <button class="chip" data-back="10">10 éve</button>
            <button class="chip" data-back="20">20 éve</button>
          </div>
          <label class="field"><span>Neved az időkapszulán (nem kötelező)</span>
            <input id="pname" maxlength="40" value="${U.esc(prefs.name || '')}" autocomplete="given-name"></label>
          <p class="preview" id="preview" aria-live="polite"></p>
          <button class="btn primary wide" id="go">Felhívom a régi énemet</button>
        </div>
      </section>`);

    const oldEl = U.$('#yOld'), newEl = U.$('#yNew');
    const preview = () => {
      const a = parseInt(oldEl.value, 10), b = parseInt(newEl.value, 10);
      const p = U.$('#preview'), go = U.$('#go');
      let err = '';
      if (!a || !b) err = 'Adj meg két évszámot.';
      else if (b > THIS_YEAR) err = `A mostani éned legfeljebb ${THIS_YEAR}-ből telefonálhat.`;
      else if (a < 1930) err = 'Ennyire messzire nem ér el a vonal. Válassz 1930 utáni évet.';
      else if (a >= b) err = 'A régi énnek korábbi évben kell lennie.';
      go.disabled = !!err;
      if (err) { p.innerHTML = `<span class="err">${err}</span>`; return; }
      const gap = b - a;
      p.innerHTML = `<b>${gap} év</b> különbség. ${msgCount(gap)} üzeneted van, a pontjaid ×${U.num(multOf(gap), 2)} szorzót kapnak, és ${eventsBetween(a, b).length} világesemény köthető be.`;
    };
    oldEl.addEventListener('input', preview);
    newEl.addEventListener('input', preview);
    U.on('[data-back]', 'click', e => {
      oldEl.value = (parseInt(newEl.value, 10) || THIS_YEAR) - parseInt(e.currentTarget.dataset.back, 10);
      preview();
    });
    U.$('#go').addEventListener('click', () => {
      const a = parseInt(oldEl.value, 10), b = parseInt(newEl.value, 10);
      const name = U.$('#pname').value.trim();
      HEV.store.set('soloPrefs', { old: a, now: b, name });
      begin(a, b, name);
    });
    preview();
  }

  /* ---------- Indulás ---------- */
  function begin(a, b, name) {
    const gap = b - a;
    S = {
      old: a, now: b, gap, name,
      total: msgCount(gap), mult: multOf(gap),
      msgs: [], trust: 60, paradox: 0, base: 0,
      bingo: U.shuffle(D.bingo).slice(0, 9), marked: new Set(), lines: new Set(),
      world: eventsBetween(a, b), usedWorld: new Set(), worldCombos: 0,
      used: new Set(), rerolls: 2, hand: [], chosen: null,
      reaction: U.fmt(U.pick(R.opening), { old: a, now: b, gap }),
      ended: null, finalText: ''
    };
    S.hand = deal();
    HEV.scenery.setMode('journey');
    HEV.scenery.setProgress(0);
    HEV.scenery.boost(220);
    turn();
  }

  function deal() {
    const pool = [];
    D.categories.forEach(c => c.prompts.forEach((p, i) => {
      const key = c.id + i;
      if (!S.used.has(key)) pool.push({ key, cat: c.name, glyph: c.glyph, text: p });
    }));
    /* Három különböző kategóriából, ha lehet */
    const out = [], cats = new Set();
    U.shuffle(pool).forEach(card => {
      if (out.length < 3 && !cats.has(card.cat)) { out.push(card); cats.add(card.cat); }
    });
    return out;
  }

  const ctx = () => ({ old: S.old, now: S.now, gap: S.gap });

  function hud() {
    return `
      <header class="hud">
        <div class="hud-years"><span>${S.old}</span><i aria-hidden="true"></i><span>${S.now}</span></div>
        <div class="hud-row">
          <span>Üzenet <b>${Math.min(S.msgs.length + 1, S.total)}/${S.total}</b></span>
          <span>Pont <b>${U.num(S.base)}</b> <small>×${U.num(S.mult, 2)}</small></span>
        </div>
        <div class="hud-meters">
          ${U.meter('A régi éned bizalma', S.trust, S.trust < 25 ? 'low' : 'trust')}
          ${U.meter('Időparadoxon', S.paradox, S.paradox >= 70 ? 'danger' : 'paradox')}
        </div>
      </header>`;
  }

  function bubble(text, who) {
    return `<div class="bubble">
      <span class="bubble-who">${U.esc(who || `A régi éned, ${S.old}`)}</span>
      <p>${U.esc(text)}</p>
    </div>`;
  }

  function bingoGrid(selectable) {
    return `<div class="bingo" role="group" aria-label="Időutazó-bingó">
      ${S.bingo.map((sq, i) => {
        const done = S.marked.has(i);
        return `<button class="bingo-cell${done ? ' done' : ''}" data-sq="${i}" ${(!selectable || done) ? 'disabled' : ''} aria-pressed="false">${U.esc(sq)}</button>`;
      }).join('')}
    </div>`;
  }

  /* ---------- Egy üzenet megírása ---------- */
  function turn() {
    HEV.scenery.setProgress(S.msgs.length / (S.total + 1));
    const worldAvail = S.world.map((e, i) => ({ e, i })).filter(x => !S.usedWorld.has(x.i));
    U.render(`
      <section class="screen journey">
        ${hud()}
        ${bubble(S.reaction)}
        <div class="mist">
          <p class="step-label">Válassz egy lapot, és mesélj róla</p>
          <div class="hand" role="radiogroup" aria-label="Kártyák">
            ${S.hand.map((c, i) => `
              <button class="card${S.chosen === i ? ' sel' : ''}" data-card="${i}" role="radio" aria-checked="${S.chosen === i}">
                <span class="card-glyph" aria-hidden="true">${c.glyph}</span>
                <span class="card-cat">${U.esc(c.cat)}</span>
                <span class="card-text">${U.esc(c.text)}</span>
              </button>`).join('')}
          </div>
          <button class="link" id="reroll" ${S.rerolls ? '' : 'disabled'}>Új lapokat kérek (még ${S.rerolls})</button>

          <label class="field"><span>Mit mondasz a régi önmagadnak?</span>
            <textarea id="msg" rows="4" maxlength="500" placeholder="Írd le úgy, ahogy telefonba mondanád."></textarea></label>

          <div class="field">
            <span>Mennyire hihetetlen ez ${S.old}-ben? <b id="shockLbl">${SHOCK[2]}</b></span>
            <input id="shock" type="range" min="1" max="5" step="1" value="3" aria-describedby="shockHelp">
            <small id="shockHelp" class="help">Minél hihetetlenebb, annál több pont — ha elhiszi.</small>
          </div>

          <label class="field"><span>Bizonyíték: egy részlet, amit csak te tudhatsz (nem kötelező)</span>
            <input id="ev" maxlength="200" placeholder="Pl. hol rejtetted el a naplódat"></label>

          <label class="toggle"><input type="checkbox" id="advice">
            <span>Tanácsot is adok neki <small>(+20 pont, de nő az időparadoxon)</small></span></label>

          <details class="extra" ${worldAvail.length ? '' : 'hidden'}>
            <summary>Világkapocs <small>(+15 pont, ha a történeted egy valódi eseményhez kapcsolódik)</small></summary>
            <div class="chips scroll" role="radiogroup">
              ${worldAvail.map(x => `<button class="chip" data-ev="${x.i}" role="radio" aria-checked="false"><b>${x.e.y}</b> ${U.esc(x.e.t)}</button>`).join('')}
            </div>
          </details>

          <details class="extra">
            <summary>Időutazó-bingó <small>(jelöld meg, ha ez az üzenet kitölt egy mezőt)</small></summary>
            ${bingoGrid(true)}
          </details>

          <p class="err" id="err" aria-live="polite"></p>
          <button class="btn primary wide" id="send">Elmondom</button>
          <button class="link quiet" id="quit">Befejezem az utat</button>
        </div>
      </section>`);

    let ev = null, sq = null;
    U.on('[data-card]', 'click', e => {
      S.chosen = parseInt(e.currentTarget.dataset.card, 10);
      U.$$('[data-card]').forEach((b, i) => { b.classList.toggle('sel', i === S.chosen); b.setAttribute('aria-checked', i === S.chosen); });
      HEV.audio.tap();
      U.$('#msg').focus({ preventScroll: true });
    });
    U.$('#reroll').addEventListener('click', () => {
      if (!S.rerolls) return;
      S.rerolls--; S.chosen = null;
      const draft = U.$('#msg').value;
      S.hand = deal();
      turn();
      U.$('#msg').value = draft;
    });
    const shock = U.$('#shock');
    shock.addEventListener('input', () => { U.$('#shockLbl').textContent = SHOCK[shock.value - 1]; });
    U.on('[data-ev]', 'click', e => {
      const i = parseInt(e.currentTarget.dataset.ev, 10);
      ev = ev === i ? null : i;
      U.$$('[data-ev]').forEach(b => { const on = parseInt(b.dataset.ev, 10) === ev; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
    });
    U.on('.bingo-cell:not([disabled])', 'click', e => {
      const i = parseInt(e.currentTarget.dataset.sq, 10);
      sq = sq === i ? null : i;
      U.$$('.bingo-cell').forEach(b => { const on = parseInt(b.dataset.sq, 10) === sq; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); });
    });
    U.$('#quit').addEventListener('click', () => {
      if (S.msgs.length === 0) { HEV.app.go('home'); return; }
      finalCard();
    });
    U.$('#send').addEventListener('click', e => {
      const text = U.$('#msg').value.trim();
      const err = U.$('#err');
      if (S.chosen == null) { err.textContent = 'Előbb válassz egy lapot.'; return; }
      if (text.length < 3) { err.textContent = 'Írj legalább egy mondatot a régi énednek.'; U.$('#msg').focus(); return; }
      const res = evaluate({
        card: S.hand[S.chosen], text, shock: parseInt(shock.value, 10),
        evidence: U.$('#ev').value, advice: U.$('#advice').checked, ev, sq
      });
      U.floatPoints(`+${res.pts}`, e.currentTarget);
      HEV.scenery.boost(260);
      HEV.audio.tap();
      reaction(res);
    });
  }

  /* ---------- Kiértékelés ---------- */
  function evaluate(inp) {
    const hasEv = inp.evidence.trim().length >= 10;
    const trustBefore = S.trust;
    const believed = hasEv || inp.shock * 20 <= trustBefore + 20;
    const parts = [];
    let pts = believed ? inp.shock * 10 : inp.shock * 3;
    parts.push([believed ? 'Elhitte' : 'Nem hitte el', pts]);

    let dT = 0;
    if (hasEv) dT += 6 + (inp.shock >= 4 ? 6 : 0);
    else if (inp.shock >= 3) dT -= (inp.shock - 2) * 9;
    else dT += 3;
    if (!believed) dT -= 6;

    let eventText = null;
    if (inp.ev != null && !S.usedWorld.has(inp.ev)) {
      S.usedWorld.add(inp.ev); S.worldCombos++;
      eventText = S.world[inp.ev].t;
      pts += 15; dT += 4; parts.push(['Világkapocs', 15]);
    }
    if (inp.advice) {
      pts += 20; parts.push(['Tanács', 20]);
      S.paradox = Math.min(100, S.paradox + 22 + inp.shock * 4);
    }
    let bingoSq = null;
    if (inp.sq != null && !S.marked.has(inp.sq)) {
      S.marked.add(inp.sq); bingoSq = S.bingo[inp.sq];
      pts += 5; parts.push(['Bingómező', 5]);
      let bonus = 0;
      LINES.forEach((ln, i) => {
        if (!S.lines.has(i) && ln.every(k => S.marked.has(k))) { S.lines.add(i); bonus += 30; }
      });
      if (bonus) { pts += bonus; parts.push(['Bingósor!', bonus]); }
    }
    S.trust = U.clamp(S.trust + dT, 0, 100);

    let pool;
    if (!believed) pool = R.disbelief;
    else if (inp.shock <= 2) pool = R.low;
    else if (inp.shock === 3) pool = R.mid;
    else pool = hasEv ? R.highEv : R.highTrust;
    let line = U.fmt(U.pick(pool), ctx());
    if (eventText) line = U.fmt(U.pick(R.world), { event: eventText }) + ' ' + line;
    if (inp.advice) line += ' ' + U.pick(R.advice);

    const msg = { cat: inp.card.cat, prompt: inp.card.text, text: inp.text, shock: inp.shock, believed, hasEv, advice: inp.advice, pts, bingoSq };
    S.msgs.push(msg);
    S.used.add(inp.card.key);
    S.base += pts;
    S.reaction = line;
    S.chosen = null;
    S.hand = deal();

    if (S.trust <= 0) S.ended = 'hangup';
    else if (S.paradox >= 100) S.ended = 'paradox';

    return { pts, parts, believed, line, dT };
  }

  function reaction(res) {
    HEV.scenery.setProgress(S.msgs.length / (S.total + 1));
    const warn = [];
    if (!S.ended && S.trust < 25) warn.push(R.trustWarn);
    if (!S.ended && S.paradox >= 70) warn.push(R.paradoxWarn);
    const last = S.msgs.length >= S.total;
    let nextLabel = 'Folytatom';
    if (S.ended) nextLabel = 'Az út vége';
    else if (last) nextLabel = 'Az utolsó kérdés';
    U.render(`
      <section class="screen journey">
        ${hud()}
        ${bubble(res.line)}
        ${S.ended ? `<p class="ending">${U.esc(S.ended === 'hangup' ? R.hangup : R.paradox)}</p>` : ''}
        ${warn.map(w => `<p class="warn">${U.esc(w)}</p>`).join('')}
        <div class="mist">
          <ul class="points" aria-label="Pontok">
            ${res.parts.map(p => `<li><span>${U.esc(p[0])}</span><b>+${p[1]}</b></li>`).join('')}
          </ul>
          <p class="trust-delta">${res.dT >= 0 ? 'A bizalom nőtt' : 'A bizalom csökkent'} (${res.dT >= 0 ? '+' : ''}${res.dT}).</p>
          <button class="btn primary wide" id="next" data-autofocus>${nextLabel}</button>
        </div>
      </section>`);
    U.$('#next').addEventListener('click', () => {
      if (S.ended) summary();
      else if (last) finalCard();
      else turn();
    });
  }

  /* ---------- Kötelező zárókártya ---------- */
  function finalCard() {
    HEV.scenery.setProgress(S.total / (S.total + 1));
    U.render(`
      <section class="screen journey">
        ${hud()}
        ${bubble(R.finalAsk)}
        <div class="mist">
          <div class="card single">
            <span class="card-glyph" aria-hidden="true">◌</span>
            <span class="card-cat">Ami ugyanaz maradt</span>
            <span class="card-text">Mondj el valamit, ami ${S.gap} év alatt sem változott — és aminek örülsz.</span>
          </div>
          <label class="field"><span>A válaszod</span>
            <textarea id="same" rows="4" maxlength="500" data-autofocus></textarea></label>
          <p class="err" id="err" aria-live="polite"></p>
          <button class="btn primary wide" id="done">Lezárom a hívást</button>
        </div>
      </section>`);
    U.$('#done').addEventListener('click', () => {
      const t = U.$('#same').value.trim();
      if (t.length < 3) { U.$('#err').textContent = 'Ez a kártya kötelező — írj legalább egy mondatot.'; return; }
      S.finalText = t;
      S.ended = 'complete';
      HEV.scenery.boost(200);
      summary();
    });
  }

  /* ---------- Összegzés ---------- */
  function summary() {
    HEV.scenery.setProgress(1);
    const finalBonus = S.finalText ? 20 : 0;
    const total = Math.round((S.base + finalBonus) * S.mult);
    const believedCount = S.msgs.filter(m => m.believed).length;

    /* Kitüntetések */
    const before = HEV.ach.all();
    if (S.ended === 'complete') HEV.ach.unlock('first');
    if (S.gap >= 10 && S.ended === 'complete') HEV.ach.unlock('leap');
    if (S.msgs.filter(m => m.shock === 5 && m.believed).length >= 2) HEV.ach.unlock('unbelievable');
    if (S.msgs.some(m => m.bingoSq === D.prophetSquare)) HEV.ach.unlock('prophet');
    if (S.ended === 'complete' && S.paradox === 0 && S.msgs.length >= S.total) HEV.ach.unlock('quiet');
    if (S.ended === 'paradox') HEV.ach.unlock('paradox');
    if (S.ended === 'hangup') HEV.ach.unlock('hangup');
    if (S.lines.size >= 1) HEV.ach.unlock('bingo');
    if (S.lines.size >= 2) HEV.ach.unlock('bingo2');
    if (S.worldCombos >= 3) HEV.ach.unlock('worldly');
    const fresh = HEV.data.achievements.filter(a => HEV.ach.has(a.id) && !before[a.id]);

    const stats = HEV.stats.bump({ journeys: n => n + 1, best: b => Math.max(b, total) });

    /* Választható idézetek a kapszulára */
    const quotes = S.msgs.map((m, i) => ({ i, text: m.text, pts: m.pts }));
    if (S.finalText) quotes.push({ i: 'f', text: S.finalText, pts: -1 });
    const best = quotes.slice().sort((a, b) => b.pts - a.pts)[0];
    let quoteSel = best ? best.i : null;
    const quoteText = () => { const q = quotes.find(x => x.i === quoteSel); return q ? q.text : ''; };
    const cap = () => ({ old: S.old, now: S.now, name: S.name, quote: quoteText(), score: total, cycle: 0.47 });

    const endLine = S.ended === 'complete' ? R.finalReply : (S.ended === 'hangup' ? R.hangup : R.paradox);

    U.render(`
      <section class="screen journey summary">
        ${bubble(endLine)}
        <div class="mist">
          <div class="score-hero">
            <span class="score-num">${U.num(total)}</span>
            <span class="score-cap">pont${stats.best === total && stats.journeys > 1 ? ' — új egyéni csúcs' : ''}</span>
          </div>
          <ul class="points">
            <li><span>Üzenetek (${S.msgs.length} db, ebből ${believedCount} hihető)</span><b>${U.num(S.base)}</b></li>
            ${finalBonus ? `<li><span>Ami ugyanaz maradt</span><b>+${finalBonus}</b></li>` : ''}
            <li><span>${S.gap} év szorzója</span><b>×${U.num(S.mult, 2)}</b></li>
          </ul>
          ${fresh.length ? `<div class="fresh-ach">${fresh.map(a => `<span class="ach-pill"><i aria-hidden="true">${a.glyph}</i>${U.esc(a.title)}</span>`).join('')}</div>` : ''}
        </div>

        ${quotes.length ? `
        <div class="mist">
          <h3 class="title-sm">Időkapszula</h3>
          <p class="help">Melyik mondatod kerüljön a képre?</p>
          <div class="quote-list" role="radiogroup">
            ${quotes.map(q => `<button class="quote${q.i === quoteSel ? ' sel' : ''}" data-q="${q.i}" role="radio" aria-checked="${q.i === quoteSel}">${U.esc(q.text)}</button>`).join('')}
          </div>
          <img class="capsule-img" id="capImg" alt="Az időkapszula képe">
          <div class="btn-row">
            <button class="btn" id="saveCap">Elmentem a gyűjteménybe</button>
            <button class="btn" id="dlCap">Kép letöltése</button>
            ${HEV.capsule.canShare() ? '<button class="btn" id="shareCap">Megosztás</button>' : ''}
          </div>
        </div>` : ''}

        <div class="btn-row center">
          <button class="btn primary" id="again">Új út</button>
          <button class="btn ghost" data-go="home">Főmenü</button>
        </div>
      </section>`);

    const refresh = () => {
      const img = U.$('#capImg');
      if (!img) return;
      const go = () => { img.src = HEV.capsule.dataURL(cap()); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    };
    refresh();
    U.on('[data-q]', 'click', e => {
      const raw = e.currentTarget.dataset.q;
      quoteSel = raw === 'f' ? 'f' : parseInt(raw, 10);
      U.$$('[data-q]').forEach(b => { const on = b.dataset.q === raw; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
      refresh();
    });
    const save = U.$('#saveCap');
    if (save) save.addEventListener('click', () => {
      HEV.capsule.save(cap());
      save.disabled = true; save.textContent = 'Elmentve';
      HEV.audio.tap();
    });
    const dl = U.$('#dlCap'); if (dl) dl.addEventListener('click', () => HEV.capsule.download(cap()));
    const sh = U.$('#shareCap'); if (sh) sh.addEventListener('click', () => HEV.capsule.share(cap()));
    U.$('#again').addEventListener('click', setup);
  }

  HEV.solo = { start: setup };
})();
