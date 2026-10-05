/* Kezdőlap, súgó, gyűjtemény, navigáció és a zene kapcsolója. */
(function () {
  const HEV = window.HEV, U = HEV.ui, D = HEV.data;
  let pairTimer = null;

  /* ---------- Kezdőlap ---------- */
  function home() {
    HEV.scenery.setMode('home');
    const st = HEV.stats.get();
    const caps = HEV.capsule.list().length;
    const achN = Object.keys(HEV.ach.all()).length;
    const first = D.homePairs[0];
    U.render(`
      <section class="screen home">
        <div class="home-title">
          <h1><span>Hidd el,</span><span>én vagyok!</span></h1>
          <p class="home-sub">Telefonálj a régi önmagadnak, és meséld el, mi történt azóta.</p>
        </div>

        <div class="pair-show" aria-live="off">
          <div class="pair-years" id="pairYears"><span>${first.a}</span><i aria-hidden="true"></i><span>${first.b}</span></div>
          <p class="pair-cap" id="pairCap">${U.esc(first.c)}</p>
        </div>

        <nav class="modes" aria-label="Játékmód">
          <button class="mode" data-go="solo">
            <span class="mode-name">Csendes út</span>
            <span class="mode-desc">Egyedül, elmélkedve. Kártyák, bizalom, időparadoxon és egy időkapszula a végén.</span>
          </button>
          <button class="mode" data-go="party">
            <span class="mode-name">Társasjáték</span>
            <span class="mode-desc">2–6 fő, egy telefon. Két igaz és egy hamis történet — ki ismer fel?</span>
          </button>
        </nav>

        <div class="home-links">
          <button class="link" data-go="collection">Gyűjtemény${caps || achN ? ` (${caps} kapszula, ${achN} kitüntetés)` : ''}</button>
          <button class="link" data-go="howto">Hogyan működik?</button>
        </div>
        ${st.best ? `<p class="home-best">Legjobb csendes út: ${U.num(st.best)} pont</p>` : ''}
      </section>`);
    startPairs();
  }

  function startPairs() {
    clearInterval(pairTimer);
    let i = 0;
    pairTimer = setInterval(() => {
      const yEl = document.getElementById('pairYears'), cEl = document.getElementById('pairCap');
      if (!yEl) { clearInterval(pairTimer); return; }
      i = (i + 1) % D.homePairs.length;
      const p = D.homePairs[i];
      yEl.classList.add('swap'); cEl.classList.add('swap');
      setTimeout(() => {
        yEl.innerHTML = `<span>${p.a}</span><i aria-hidden="true"></i><span>${p.b}</span>`;
        cEl.textContent = p.c;
        yEl.classList.remove('swap'); cEl.classList.remove('swap');
      }, 450);
    }, 3800);
  }

  /* ---------- Súgó ---------- */
  function howto() {
    HEV.scenery.setMode('calm');
    U.render(`
      <section class="screen prose">
        <button class="back" data-go="home">Vissza</button>
        <h2 class="title-md">Hogyan működik?</h2>
        <p>Az alapötlet egyszerű: választasz két évet az életedből. A régebbi éned felveszi a telefont, és a mostani éned elmeséli neki, mi történt azóta. A játék ezt a beszélgetést teszi izgalmassá.</p>

        <h3 class="title-sm">Csendes út</h3>
        <p>Minden üzenet előtt három kártyából választasz témát. Megírod, mit mondanál, és beállítod, mennyire hihetetlen lenne ez a régi énednek. Minél hihetetlenebb, annál több pontot ér — de csak akkor, ha elhiszi.</p>
        <p>A régi éned bizalma a bizonyítékokon múlik. Ha egy részletet is hozzáírsz, amit csak te tudhatsz, akkor a nagy hírt is elhiszi. Ha bizonyíték nélkül sorolod a csodákat, egyre gyanakvóbb lesz, és a végén leteszi a kagylót.</p>
        <p>Adhatsz neki tanácsot is. Ez pontot ér, de nő tőle az időparadoxon. Ha betelik, a hívás megszakad.</p>
        <p>Közben kitöltheted az időutazó-bingót, és a történeteidet valódi világeseményekhez kötheted. Az utat mindig ugyanaz a kártya zárja: mi az, ami nem változott. A végén időkapszula-képet készíthetsz a legerősebb mondatodból.</p>
        <p>Minél nagyobb a két év közti különbség, annál nagyobb a pontszorzó, de annál kevesebb üzeneted van. Jól kell választanod, mi számít igazán.</p>

        <h3 class="title-sm">Társasjáték</h3>
        <p>A telefon körbejár. A soron következő játékos titokban beír két igaz és egy hamis állítást arról, mi történt vele a választott éve óta. Felolvassa őket, a többiek tippelnek.</p>
        <p>Aki eltalálja a hazugságot, 2 pontot kap. A mesélő minden becsapott játékosért 2 pontot kap, és ha mindenkit becsapott, még 2-t. Az eseménykártyák minden körben csavarnak egyet a szabályokon.</p>

        <h3 class="title-sm">Adatok</h3>
        <p>Minden, amit beírsz, csak ezen az eszközön, a böngésződben marad. Semmit nem küldünk el sehova.</p>
        <button class="btn ghost" id="wipe">Minden mentett adat törlése</button>
      </section>`);
    U.$('#wipe').addEventListener('click', e => {
      const btn = e.currentTarget;
      if (btn.dataset.armed) {
        try { Object.keys(localStorage).filter(k => k.startsWith('hev:')).forEach(k => localStorage.removeItem(k)); } catch (err) { /* */ }
        btn.textContent = 'Törölve'; btn.disabled = true;
      } else { btn.dataset.armed = '1'; btn.textContent = 'Biztosan? Koppints még egyszer'; }
    });
  }

  /* ---------- Gyűjtemény ---------- */
  function collection(tab) {
    HEV.scenery.setMode('calm');
    tab = tab || 'caps';
    const caps = HEV.capsule.list();
    const got = HEV.ach.all();
    const st = HEV.stats.get();
    U.render(`
      <section class="screen">
        <button class="back" data-go="home">Vissza</button>
        <h2 class="title-md">Gyűjtemény</h2>
        <div class="segmented tabs" role="tablist">
          <button class="seg${tab === 'caps' ? ' sel' : ''}" data-tab="caps" role="tab" aria-selected="${tab === 'caps'}">Időkapszulák</button>
          <button class="seg${tab === 'ach' ? ' sel' : ''}" data-tab="ach" role="tab" aria-selected="${tab === 'ach'}">Kitüntetések</button>
        </div>
        ${tab === 'caps' ? (caps.length ? `
          <div class="caps">
            ${caps.map(c => `
              <article class="cap">
                <div class="cap-years"><span>${c.old}</span><i aria-hidden="true"></i><span>${c.now}</span></div>
                <p class="cap-quote">„${U.esc(c.quote)}”</p>
                <p class="cap-meta">${new Date(c.date).toLocaleDateString('hu-HU')}${c.score != null ? `, ${U.num(c.score)} pont` : ''}</p>
                <div class="btn-row">
                  <button class="btn small" data-dl="${c.id}">Kép letöltése</button>
                  <button class="btn small ghost" data-rm="${c.id}">Törlés</button>
                </div>
              </article>`).join('')}
          </div>` : `
          <div class="mist empty">
            <p>Még nincs elmentett időkapszulád. Egy csendes út végén a legerősebb mondatodból készíthetsz egyet.</p>
            <button class="btn primary" data-go="solo">Elindulok</button>
          </div>`) : `
          <p class="help">${Object.keys(got).length} / ${D.achievements.length} megszerezve. Csendes utak: ${st.journeys}, társasjátékok: ${st.parties}.</p>
          <div class="achs">
            ${D.achievements.map(a => `
              <div class="ach${got[a.id] ? ' got' : ''}">
                <span class="ach-glyph" aria-hidden="true">${a.glyph}</span>
                <span class="ach-title">${U.esc(a.title)}</span>
                <span class="ach-desc">${got[a.id] ? U.esc(a.desc) : 'Még rejtve'}</span>
              </div>`).join('')}
          </div>`}
      </section>`);
    U.on('[data-tab]', 'click', e => collection(e.currentTarget.dataset.tab));
    U.on('[data-dl]', 'click', e => {
      const c = caps.find(x => x.id === e.currentTarget.dataset.dl);
      if (c) HEV.capsule.download(c);
    });
    U.on('[data-rm]', 'click', e => {
      const btn = e.currentTarget;
      if (!btn.dataset.armed) { btn.dataset.armed = '1'; btn.textContent = 'Biztosan?'; return; }
      HEV.capsule.remove(btn.dataset.rm);
      collection('caps');
    });
  }

  /* ---------- Navigáció ---------- */
  const routes = {
    home, howto, collection: () => collection('caps'),
    solo: () => HEV.solo.start(),
    party: () => HEV.party.start()
  };
  function go(name) {
    clearInterval(pairTimer);
    (routes[name] || home)();
  }
  HEV.app = { go };

  document.getElementById('app').addEventListener('click', e => {
    const t = e.target.closest('[data-go]');
    if (t) { e.preventDefault(); HEV.audio.tap(); go(t.dataset.go); }
  });

  /* ---------- Zene ---------- */
  const btn = document.getElementById('soundToggle');
  const musicOn = () => HEV.store.get('music', true);
  function paintBtn() {
    const on = HEV.audio.isRunning();
    btn.classList.toggle('off', !on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? 'Zene kikapcsolása' : 'Zene bekapcsolása');
    btn.title = on ? 'Zene kikapcsolása' : 'Zene bekapcsolása';
  }
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (HEV.audio.isRunning()) { HEV.audio.stop(); HEV.store.set('music', false); }
    else { HEV.audio.start(); HEV.store.set('music', true); }
    setTimeout(paintBtn, 30);
  });
  /* A böngészők csak felhasználói érintés után engednek hangot. Az első koppintás elindítja. */
  const firstTouch = e => {
    document.removeEventListener('pointerdown', firstTouch, true);
    document.removeEventListener('keydown', firstTouch, true);
    btn.classList.remove('pending');
    if (e.target && e.target.closest && e.target.closest('#soundToggle')) return; // a gomb maga dönt
    if (musicOn() && !HEV.audio.isRunning()) { HEV.audio.start(); setTimeout(paintBtn, 30); }
  };
  document.addEventListener('pointerdown', firstTouch, true);
  document.addEventListener('keydown', firstTouch, true);
  paintBtn();
  if (musicOn()) btn.classList.add('pending');

  home();
})();
