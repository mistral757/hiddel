/* Társasjáték — 2–6 fő, egy telefon körbeadva.
   Mindenki elmond két igaz és egy hamis „azóta történt” állítást, a többiek tippelnek. */
(function () {
  const HEV = window.HEV, U = HEV.ui, D = HEV.data;
  const THIS_YEAR = new Date().getFullYear();
  const LETTERS = ['A', 'B', 'C'];
  let G = null;

  /* ---------- Beállítás ---------- */
  function setup() {
    HEV.scenery.setMode('party');
    const prev = HEV.store.get('partyPrefs', { names: ['', '', ''], rounds: 1, twists: true });
    let names = prev.names.length >= 2 ? prev.names.slice() : ['', '', ''];
    let rounds = prev.rounds || 1;
    let twists = prev.twists !== false;

    const draw = () => {
      U.render(`
        <section class="screen">
          <button class="back" data-go="home">Vissza</button>
          <h2 class="title-md">Ki ül a körben?</h2>
          <p class="lead">Mindenki két igaz és egy hamis dolgot mesél arról, mi történt vele azóta. A többiek kitalálják, melyik a hazugság.</p>
          <div class="mist">
            <div class="players">
              ${names.map((n, i) => `
                <div class="player-row">
                  <input class="pname" data-i="${i}" maxlength="20" value="${U.esc(n)}" placeholder="${i + 1}. játékos" aria-label="${i + 1}. játékos neve">
                  ${names.length > 2 ? `<button class="icon-btn small" data-del="${i}" aria-label="${i + 1}. játékos törlése">×</button>` : ''}
                </div>`).join('')}
            </div>
            ${names.length < 6 ? '<button class="link" id="add">Még egy játékos</button>' : ''}
            <div class="field">
              <span>Hány kör legyen?</span>
              <div class="segmented" role="radiogroup">
                ${[1, 2, 3].map(r => `<button class="seg${r === rounds ? ' sel' : ''}" data-r="${r}" role="radio" aria-checked="${r === rounds}">${r}</button>`).join('')}
              </div>
              <small class="help">Egy körben mindenki egyszer mesél.</small>
            </div>
            <label class="toggle"><input type="checkbox" id="tw" ${twists ? 'checked' : ''}>
              <span>Eseménykártyák <small>(minden körben egy csavar a szabályokon)</small></span></label>
            <p class="err" id="err" aria-live="polite"></p>
            <button class="btn primary wide" id="go">Kezdjük</button>
          </div>
        </section>`);
      const sync = () => { U.$$('.pname').forEach(el => { names[+el.dataset.i] = el.value; }); };
      U.on('.pname', 'input', sync);
      U.on('[data-del]', 'click', e => { sync(); names.splice(+e.currentTarget.dataset.del, 1); draw(); });
      const add = U.$('#add'); if (add) add.addEventListener('click', () => { sync(); names.push(''); draw(); U.$$('.pname').pop().focus(); });
      U.on('[data-r]', 'click', e => { sync(); rounds = +e.currentTarget.dataset.r; draw(); });
      U.$('#tw').addEventListener('change', e => { twists = e.target.checked; });
      U.$('#go').addEventListener('click', () => {
        sync();
        const final = names.map((n, i) => n.trim() || `${i + 1}. játékos`);
        const lower = final.map(n => n.toLowerCase());
        if (new Set(lower).size !== lower.length) { U.$('#err').textContent = 'Két játékosnak ugyanaz a neve — írj be különböző neveket.'; return; }
        HEV.store.set('partyPrefs', { names, rounds, twists });
        begin(final, rounds, twists);
      });
    };
    draw();
  }

  function begin(names, rounds, twists) {
    const yearPrefs = HEV.store.get('partyYears', {});
    G = {
      players: names.map(n => ({ name: n, score: 0, guesses: 0, hits: 0, old: yearPrefs[n] || THIS_YEAR - 7 })),
      rounds, twists, turn: 0, total: names.length * rounds, cur: null
    };
    HEV.scenery.boost(220);
    nextTurn();
  }

  /* ---------- Átadó képernyő ---------- */
  function pass(title, sub, btn, onGo) {
    U.render(`
      <section class="screen pass">
        <p class="pass-sub">${U.esc(sub)}</p>
        <h2 class="title-lg">${U.esc(title)}</h2>
        <button class="btn primary" id="ok" data-autofocus>${U.esc(btn)}</button>
      </section>`);
    U.$('#ok').addEventListener('click', () => { HEV.audio.tap(); onGo(); });
  }

  function nextTurn() {
    if (G.turn >= G.total) { final(); return; }
    const teller = G.players[G.turn % G.players.length];
    const twist = G.twists ? U.pick(D.twists) : null;
    G.cur = { teller, twist, prompt: randomPrompt(), statements: ['', '', ''], odd: null, votes: {}, clapped: false };
    pass(`Add át a telefont: ${teller.name}`,
      `${Math.floor(G.turn / G.players.length) + 1}. kör, ${G.turn % G.players.length + 1}/${G.players.length}`,
      `${teller.name} vagyok, mutasd`, write);
  }

  function randomPrompt() {
    const c = U.pick(D.categories);
    return { cat: c.name, glyph: c.glyph, text: U.pick(c.prompts) };
  }

  /* ---------- A mesélő megírja az állításait ---------- */
  function write() {
    const C = G.cur, t = C.teller, tw = C.twist;
    const inverted = tw && tw.id === 'invert';
    const whisper = tw && tw.id === 'whisper';
    const oddLabel = inverted ? 'Ez az igaz' : 'Ez a hamis';
    U.render(`
      <section class="screen">
        <h2 class="title-md">${U.esc(t.name)}, csak te nézd!</h2>
        <div class="mist">
          <div class="year-pair compact">
            <label class="year-field"><span>Régi éned</span>
              <input id="yOld" type="number" inputmode="numeric" min="1930" max="${THIS_YEAR - 1}" value="${t.old}"></label>
            <span class="year-dash" aria-hidden="true">—</span>
            <label class="year-field"><span>Most</span>
              <input id="yNew" type="number" inputmode="numeric" min="1931" max="${THIS_YEAR}" value="${THIS_YEAR}"></label>
          </div>
          ${tw ? `<div class="twist"><b>${U.esc(tw.title)}</b><span>${U.esc(tw.desc)}</span></div>` : ''}
          ${tw && tw.id === 'world' ? `<details class="extra"><summary>Világesemények ötletnek</summary><p class="help" id="evList"></p></details>` : ''}
          <div class="card single small" id="prompt">
            <span class="card-glyph" aria-hidden="true">${C.prompt.glyph}</span>
            <span class="card-cat">Ihlet: ${U.esc(C.prompt.cat)}</span>
            <span class="card-text">${U.esc(C.prompt.text)}</span>
          </div>
          <button class="link" id="newPrompt">Másik ihletet kérek</button>
          ${[0, 1, 2].map(i => `
            <div class="stmt">
              <label class="field"><span>${i + 1}. állítás${whisper ? ` <small class="wc" id="wc${i}">0/8 szó</small>` : ''}</span>
                <textarea class="st" data-i="${i}" rows="2" maxlength="220">${U.esc(C.statements[i])}</textarea></label>
              <label class="odd"><input type="radio" name="odd" value="${i}" ${C.odd === i ? 'checked' : ''}> ${oddLabel}</label>
            </div>`).join('')}
          <p class="err" id="err" aria-live="polite"></p>
          <button class="btn primary wide" id="done">Kész, jöhet a felolvasás</button>
        </div>
      </section>`);

    const evList = U.$('#evList');
    const yOld = U.$('#yOld'), yNew = U.$('#yNew');
    const fillEv = () => {
      if (!evList) return;
      const a = +yOld.value, b = +yNew.value;
      const evs = D.world.filter(e => e.y > a && e.y <= b);
      evList.textContent = evs.length ? evs.map(e => `${e.y}: ${e.t}`).join('; ') : 'Ebben az időszakban nincs esemény a listában.';
    };
    fillEv(); yOld.addEventListener('input', fillEv); yNew.addEventListener('input', fillEv);

    const wc = () => {
      if (!whisper) return;
      U.$$('.st').forEach(el => {
        const n = U.words(el.value), lbl = U.$('#wc' + el.dataset.i);
        lbl.textContent = `${n}/8 szó`; lbl.classList.toggle('over', n > 8);
      });
    };
    U.on('.st', 'input', e => { C.statements[+e.target.dataset.i] = e.target.value; wc(); });
    wc();
    U.on('input[name="odd"]', 'change', e => { C.odd = +e.target.value; });
    U.$('#newPrompt').addEventListener('click', () => {
      C.prompt = randomPrompt();
      U.$('#prompt').innerHTML = `<span class="card-glyph" aria-hidden="true">${C.prompt.glyph}</span>
        <span class="card-cat">Ihlet: ${U.esc(C.prompt.cat)}</span><span class="card-text">${U.esc(C.prompt.text)}</span>`;
    });
    U.$('#done').addEventListener('click', () => {
      const err = U.$('#err');
      const a = +yOld.value, b = +yNew.value;
      if (!a || !b || a >= b || a < 1930 || b > THIS_YEAR) { err.textContent = `Adj meg két évet 1930 és ${THIS_YEAR} között, a régi legyen a korábbi.`; return; }
      if (C.statements.some(s => s.trim().length < 2)) { err.textContent = 'Mindhárom állítást írd meg.'; return; }
      if (C.odd == null) { err.textContent = inverted ? 'Jelöld meg, melyik az igaz.' : 'Jelöld meg, melyik a hamis.'; return; }
      if (whisper && C.statements.some(s => U.words(s) > 8)) { err.textContent = 'Suttogás: minden állítás legfeljebb 8 szó.'; return; }
      C.old = a; C.now = b; t.old = a;
      const yp = HEV.store.get('partyYears', {}); yp[t.name] = a; HEV.store.set('partyYears', yp);
      C.order = U.shuffle([0, 1, 2]);
      pass('Fordítsd a többiek felé', `${t.name} felolvassa az állításait`, 'Mutasd a többieknek', vote);
    });
  }

  /* ---------- Szavazás ---------- */
  function vote() {
    const C = G.cur;
    const inverted = C.twist && C.twist.id === 'invert';
    const guessers = G.players.filter(p => p !== C.teller);
    HEV.scenery.boost(120);
    U.render(`
      <section class="screen">
        <div class="hud-years big"><span>${C.old}</span><i aria-hidden="true"></i><span>${C.now}</span></div>
        <p class="lead center">${U.esc(C.teller.name)} ${C.now - C.old} évet ugrik vissza. ${inverted ? 'Melyik az egyetlen igaz?' : 'Melyik a hazugság?'}</p>
        ${C.twist && C.twist.id !== 'calm' ? `<div class="twist"><b>${U.esc(C.twist.title)}</b><span>${U.esc(C.twist.desc)}</span></div>` : ''}
        <div class="mist">
          <ol class="statements">
            ${C.order.map((k, pos) => `<li><b class="letter">${LETTERS[pos]}</b><span>${U.esc(C.statements[k])}</span></li>`).join('')}
          </ol>
        </div>
        <div class="mist">
          <p class="step-label">Mindenki tippel</p>
          ${guessers.map((p, gi) => `
            <div class="vote-row">
              <span class="vote-name">${U.esc(p.name)}</span>
              <div class="segmented" role="radiogroup" aria-label="${U.esc(p.name)} tippje">
                ${LETTERS.map((L, pos) => `<button class="seg" data-g="${gi}" data-pos="${pos}" role="radio" aria-checked="false">${L}</button>`).join('')}
              </div>
            </div>`).join('')}
          <button class="btn primary wide" id="reveal" disabled>Leleplezés</button>
        </div>
      </section>`);
    U.on('[data-g]', 'click', e => {
      const gi = +e.currentTarget.dataset.g, pos = +e.currentTarget.dataset.pos;
      C.votes[guessers[gi].name] = pos;
      U.$$(`[data-g="${gi}"]`).forEach(b => { const on = +b.dataset.pos === pos; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
      U.$('#reveal').disabled = Object.keys(C.votes).length < guessers.length;
      HEV.audio.tap();
    });
    U.$('#reveal').addEventListener('click', () => result(guessers));
  }

  /* ---------- Eredmény ---------- */
  function result(guessers) {
    const C = G.cur;
    const inverted = C.twist && C.twist.id === 'invert';
    const m = C.twist && C.twist.id === 'double' ? 2 : 1;
    const oddPos = C.order.indexOf(C.odd);
    let fooled = 0;
    const rows = guessers.map(p => {
      const hit = C.votes[p.name] === oddPos;
      p.guesses++;
      if (hit) { p.hits++; p.score += 2 * m; } else fooled++;
      return { p, hit };
    });
    let tellerPts = fooled * 2 * m;
    const notes = [];
    if (fooled === guessers.length && guessers.length > 0) {
      tellerPts += 2 * m; notes.push('Mindenkit becsapott!');
      if (guessers.length >= 2) HEV.ach.unlock('liar');
    }
    if (C.now - C.old >= 10) { tellerPts += 1; notes.push('Nagy ugrás: +1'); }
    C.teller.score += tellerPts;
    HEV.scenery.boost(300);
    HEV.audio.chime();

    const isLast = G.turn + 1 >= G.total;
    const nextName = isLast ? null : G.players[(G.turn + 1) % G.players.length].name;
    U.render(`
      <section class="screen">
        <h2 class="title-md center">${inverted ? 'Ez volt az igaz' : 'Ez volt a hazugság'}</h2>
        <div class="mist">
          <ol class="statements">
            ${C.order.map((k, pos) => `<li class="${pos === oddPos ? 'odd-reveal' : 'dim'}"><b class="letter">${LETTERS[pos]}</b><span>${U.esc(C.statements[k])}</span></li>`).join('')}
          </ol>
        </div>
        <div class="mist">
          <ul class="points">
            ${rows.map(r => `<li><span>${U.esc(r.p.name)} ${r.hit ? 'eltalálta' : 'bedőlt'}</span><b>${r.hit ? '+' + 2 * m : '0'}</b></li>`).join('')}
            <li class="teller"><span>${U.esc(C.teller.name)}, a mesélő${notes.length ? ` <small>${U.esc(notes.join(' '))}</small>` : ''}</span><b>+${tellerPts}</b></li>
          </ul>
          <button class="btn ghost wide" id="clap">Ez nagyot szólt! (+1 a mesélőnek)</button>
        </div>
        <div class="mist">${board()}</div>
        <button class="btn primary wide" id="next">${isLast ? 'Eredményhirdetés' : `Következik: ${U.esc(nextName)}`}</button>
      </section>`);
    U.$('#clap').addEventListener('click', e => {
      if (C.clapped) return;
      C.clapped = true; C.teller.score += 1;
      e.currentTarget.disabled = true; e.currentTarget.textContent = 'Megtapsolva';
      U.floatPoints('+1', e.currentTarget);
      HEV.audio.tap();
      U.$('.board').outerHTML = board();
    });
    U.$('#next').addEventListener('click', () => { G.turn++; nextTurn(); });
  }

  function board() {
    const sorted = G.players.slice().sort((a, b) => b.score - a.score);
    return `<ol class="board">${sorted.map(p => `<li><span>${U.esc(p.name)}</span><b>${p.score}</b></li>`).join('')}</ol>`;
  }

  /* ---------- Vége ---------- */
  function final() {
    const sorted = G.players.slice().sort((a, b) => b.score - a.score);
    const top = sorted[0].score;
    const winners = sorted.filter(p => p.score === top);
    HEV.ach.unlock('party');
    if (G.players.some(p => p.guesses >= 2 && p.hits === p.guesses)) HEV.ach.unlock('oracle');
    HEV.stats.bump({ parties: n => n + 1 });
    HEV.scenery.boost(400);
    const podium = sorted.slice(0, 3);
    U.render(`
      <section class="screen">
        <p class="pass-sub center">Vége a játéknak</p>
        <h2 class="title-lg center">${winners.map(w => U.esc(w.name)).join(' és ')} ${winners.length > 1 ? 'nyertek' : 'nyert'}</h2>
        <div class="podium">
          ${podium.map((p, i) => `<div class="pod pod-${i + 1}"><span class="pod-name">${U.esc(p.name)}</span><span class="pod-score">${p.score}</span><span class="pod-bar"></span></div>`).join('')}
        </div>
        <div class="mist">
          <ul class="points">
            ${sorted.map(p => `<li><span>${U.esc(p.name)} <small>${p.hits}/${p.guesses} találat</small></span><b>${p.score}</b></li>`).join('')}
          </ul>
        </div>
        <div class="btn-row center">
          <button class="btn primary" id="again">Még egy játék</button>
          <button class="btn ghost" data-go="home">Főmenü</button>
        </div>
      </section>`);
    U.$('#again').addEventListener('click', setup);
  }

  HEV.party = { start: setup };
})();
