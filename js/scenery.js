/* Táj: rétegzett hegyek, párás levegő, napszakváltás.
   Minden procedurálisan készül, külső kép nélkül.
   HEV.scenery.paint() tiszta függvény, a kapszulakép is ezt használja. */
(function () {
  const HEV = window.HEV;
  const canvas = document.getElementById('scenery');
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (a, alpha) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${alpha == null ? (a[3] == null ? 1 : a[3]) : alpha})`;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  /* Napszakok: hajnal, nappal, alkony, éjszaka. A rétegek a távolitól a közeliig. */
  const RAW = [
    { sky: ['#2d3561', '#a35a7f', '#ef8a72', '#ffc27a'], sun: '#fff2d6', glow: [255, 196, 150, 0.55],
      layers: ['#d99aa6', '#b47993', '#86597f', '#583f68', '#2f2546'], fog: [255, 205, 185, 0.22], star: 0.12 },
    { sky: ['#3a7fb3', '#64a8cf', '#9fcbe0', '#cfe5ea'], sun: '#fffbea', glow: [255, 252, 225, 0.5],
      layers: ['#b9d6e0', '#93b9cb', '#6c97ae', '#48728e', '#2b4b63'], fog: [255, 255, 255, 0.26], star: 0 },
    { sky: ['#33285a', '#844677', '#dc6f69', '#f6bd78'], sun: '#ffe1a6', glow: [255, 170, 110, 0.6],
      layers: ['#c97f88', '#9e5d79', '#704269', '#492d52', '#27182f'], fog: [255, 172, 142, 0.2], star: 0.3 },
    { sky: ['#060a1c', '#0e1736', '#1c2b57', '#33437a'], sun: '#eef1ff', glow: [175, 195, 255, 0.32],
      layers: ['#2c3c68', '#213056', '#182444', '#111a31', '#080e1e'], fog: [120, 140, 205, 0.14], star: 1 }
  ];
  const P = RAW.map(p => ({
    sky: p.sky.map(hex), sun: hex(p.sun), glow: p.glow, layers: p.layers.map(hex), fog: p.fog, star: p.star
  }));

  function paletteAt(c) {
    c = ((c % 1) + 1) % 1;
    const x = c * 4, i = Math.floor(x) % 4, j = (i + 1) % 4;
    let f = x - Math.floor(x);
    f = Math.min(1, Math.max(0, (f - 0.35) / 0.65)); // kicsit kitart minden napszak
    f = f * f * (3 - 2 * f);
    const A = P[i], B = P[j];
    return {
      sky: A.sky.map((s, k) => mix(s, B.sky[k], f)),
      sun: mix(A.sun, B.sun, f),
      glow: mix(A.glow, B.glow, f),
      layers: A.layers.map((s, k) => mix(s, B.layers[k], f)),
      fog: mix(A.fog, B.fog, f),
      star: A.star + (B.star - A.star) * f
    };
  }

  /* Determinisztikus véletlen, hogy a hegyek mindig ugyanolyanok legyenek. */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  const R = rng(1987);
  const LAYERS = [0, 1, 2, 3, 4].map(i => {
    const d = i / 4;
    return {
      depth: d,
      amp: 0.21 - d * 0.115,
      speed: 0.06 + d * d * 0.95,
      ridged: i < 2,
      trees: i >= 3,
      oct: [
        { f: 1.1 + R() * 0.6, p: R() * 6.283, a: 1 },
        { f: 2.6 + R() * 1.2, p: R() * 6.283, a: 0.48 },
        { f: 6.1 + R() * 2.0, p: R() * 6.283, a: 0.16 },
        { f: 13 + R() * 4.0, p: R() * 6.283, a: 0.05 + (1 - d) * 0.04 }
      ]
    };
  });

  function heightAt(L, u) {
    let y = 0;
    for (const o of L.oct) {
      let s = Math.sin(u * o.f + o.p);
      if (L.ridged && o.a > 0.4) s = 1 - 2 * Math.abs(s);
      y += o.a * s;
    }
    return y / 1.7;
  }

  /* Csillagok és részecskék előre generálva. */
  const SR = rng(42);
  const STARS = Array.from({ length: 150 }, () => ({ x: SR(), y: SR() * 0.62, r: 0.4 + SR() * 1.1, p: SR() * 6.283 }));
  let flakes = [];
  let birds = [];
  let shooting = null;

  function paint(g, w, h, o) {
    const pal = paletteAt(o.cycle);
    const c = ((o.cycle % 1) + 1) % 1;
    const t = o.time || 0;

    /* Égbolt */
    const sky = g.createLinearGradient(0, 0, 0, h * 0.82);
    sky.addColorStop(0, rgba(pal.sky[0]));
    sky.addColorStop(0.45, rgba(pal.sky[1]));
    sky.addColorStop(0.75, rgba(pal.sky[2]));
    sky.addColorStop(1, rgba(pal.sky[3]));
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    /* Csillagok */
    if (pal.star > 0.02) {
      for (const s of STARS) {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + s.p);
        g.fillStyle = `rgba(255,255,255,${(pal.star * tw * 0.9).toFixed(3)})`;
        g.beginPath(); g.arc(s.x * w, s.y * h, s.r, 0, 6.283); g.fill();
      }
    }

    /* Nap és hold: a nap a ciklus első felében jár, a hold a másodikban. */
    const elev = Math.sin(c * 2 * Math.PI);
    const bodyR = Math.min(w, h) * 0.05;
    const drawBody = (x, e, col, glow, isMoon) => {
      const y = h * (0.62 - 0.42 * e);
      const gr = g.createRadialGradient(x, y, 0, x, y, h * 0.55);
      gr.addColorStop(0, rgba(glow, glow[3]));
      gr.addColorStop(1, rgba(glow, 0));
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.fillStyle = rgba(col, isMoon ? 0.92 : 0.96);
      g.beginPath(); g.arc(x, y, isMoon ? bodyR * 0.62 : bodyR, 0, 6.283); g.fill();
    };
    if (c < 0.52) drawBody(w * (0.12 + 0.76 * (c / 0.52)), Math.max(-0.2, elev), pal.sun, pal.glow, false);
    else drawBody(w * (0.12 + 0.76 * ((c - 0.5) / 0.5)), Math.max(-0.2, -elev), pal.sun, pal.glow, true);

    /* Hullócsillag éjjel */
    if (o.live && pal.star > 0.6) {
      if (!shooting && Math.random() < 0.004) shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, life: 0 };
      if (shooting) {
        shooting.life += o.dt || 0.016;
        const L = shooting.life / 0.9;
        const x = shooting.x + L * w * 0.25, y = shooting.y + L * h * 0.12;
        const tail = g.createLinearGradient(x, y, x - 70, y - 34);
        tail.addColorStop(0, `rgba(255,255,255,${(1 - L).toFixed(2)})`);
        tail.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = tail; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - 70, y - 34); g.stroke();
        if (L >= 1) shooting = null;
      }
    }

    /* Madarak a távoli hegyek előtt */
    if (o.live) drawBirds(g, w, h, pal, o.dt || 0.016, t);

    /* Hegyrétegek, köztük pára */
    const cam = o.cam || 0;
    const step = Math.max(3, Math.round(w / 260));
    /* Álló képernyőn a hegyek magasabbra érnek és jobban szétterülnek. */
    const k = Math.max(0, Math.min(1, h / w - 1));
    const b0 = 0.5 - 0.05 * k, span = 0.2 + 0.1 * k;
    const ampBase = 0.55 * h + 0.45 * w;
    const unitBase = (0.7 * w + 0.3 * h) * 0.18;
    const bases = LAYERS.map(L => b0 + L.depth * span);
    LAYERS.forEach((L, idx) => {
      const col = pal.layers[idx];
      const off = cam * L.speed;
      const unit = unitBase * (1.3 - L.depth * 0.5);
      const baseY = h * bases[idx];
      const yAt = x => baseY - heightAt(L, (x + off) / unit) * ampBase * L.amp;

      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w + step; x += step) g.lineTo(x, yAt(x));
      g.lineTo(w, h);
      g.closePath();
      g.fillStyle = rgba(col);
      g.fill();

      if (L.trees) {
        const sp = 9 + (1 - L.depth) * 6;
        const k0 = Math.floor(off / sp) - 2, k1 = Math.ceil((off + w) / sp) + 2;
        g.fillStyle = rgba(col);
        for (let k = k0; k <= k1; k++) {
          const hv = hash(k + idx * 1000);
          if (hv < 0.58) continue;
          const x = k * sp - off + hash(k * 3.1) * sp * 0.6;
          const th = (6 + hash(k * 7.7) * 16) * (h / 760) * (0.7 + L.depth * 0.7);
          const by = yAt(x) + 2;
          const tw = th * 0.38;
          g.beginPath();
          g.moveTo(x, by - th);
          g.lineTo(x + tw, by);
          g.lineTo(x - tw, by);
          g.closePath();
          g.fill();
        }
      }

      if (idx < LAYERS.length - 1) {
        const top = baseY - ampBase * L.amp * 0.3;
        const bottom = h * Math.min(1, bases[idx + 1] + 0.02);
        const fog = g.createLinearGradient(0, top, 0, bottom);
        fog.addColorStop(0, rgba(pal.fog, 0));
        fog.addColorStop(1, rgba(pal.fog, pal.fog[3]));
        g.fillStyle = fog;
        g.fillRect(0, top, w, h - top);
      }
    });

    /* Hópelyhek, porszemek */
    if (o.live) drawFlakes(g, w, h, pal, o.dt || 0.016, o.flakeWind || 0);
  }

  function drawBirds(g, w, h, pal, dt, t) {
    if (birds.length === 0 && pal.star < 0.5 && Math.random() < (mode === 'home' ? 0.006 : 0.002)) {
      const n = 3 + Math.floor(Math.random() * 4);
      const y0 = h * (0.18 + Math.random() * 0.22);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const x0 = dir > 0 ? -40 : w + 40;
      for (let i = 0; i < n; i++) {
        birds.push({ x: x0 - dir * i * (14 + Math.random() * 10), y: y0 + (i % 2 ? 1 : -1) * i * 5 + Math.random() * 6,
          v: dir * (34 + Math.random() * 10), p: Math.random() * 6, s: 4 + Math.random() * 2.5 });
      }
    }
    g.strokeStyle = rgba(mix(pal.layers[4], [0, 0, 0], 0.2), 0.7);
    g.lineWidth = 1.3;
    g.lineCap = 'round';
    birds.forEach(b => {
      b.x += b.v * dt; b.p += dt * 7;
      const f = Math.sin(b.p) * 0.7;
      g.beginPath();
      g.moveTo(b.x - b.s, b.y - b.s * f);
      g.quadraticCurveTo(b.x - b.s * 0.45, b.y - b.s * 0.15, b.x, b.y);
      g.quadraticCurveTo(b.x + b.s * 0.45, b.y - b.s * 0.15, b.x + b.s, b.y - b.s * f);
      g.stroke();
    });
    birds = birds.filter(b => b.x > -80 && b.x < w + 80);
  }

  function drawFlakes(g, w, h, pal, dt, wind) {
    const target = reduce ? 18 : Math.round(Math.min(90, w * h / 16000));
    while (flakes.length < target) flakes.push(newFlake(w, h, true));
    if (flakes.length > target) flakes.length = target;
    const night = pal.star;
    flakes.forEach((f, i) => {
      f.y += f.vy * dt;
      f.x += (f.vx + wind + Math.sin(f.y * 0.01 + f.p) * 8) * dt;
      if (f.y > h + 5 || f.x < -10 || f.x > w + 10) flakes[i] = newFlake(w, h, false);
      g.fillStyle = `rgba(255,255,255,${(f.a * (0.55 + night * 0.45)).toFixed(3)})`;
      g.beginPath(); g.arc(f.x, f.y, f.r, 0, 6.283); g.fill();
    });
  }
  function newFlake(w, h, anywhere) {
    return { x: Math.random() * w, y: anywhere ? Math.random() * h : -6, r: 0.6 + Math.random() * 1.6,
      vy: 10 + Math.random() * 24, vx: -6 + Math.random() * 4, p: Math.random() * 6, a: 0.25 + Math.random() * 0.5 };
  }

  /* ---------- Élő vászon ---------- */
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  let mode = 'home';
  let cycle = 0.04, target = 0.04, auto = true, autoSpeed = 1 / 80;
  let cam = 0, camSpeed = 28, boost = 0, pointer = 0, pointerS = 0, last = performance.now();

  window.addEventListener('pointermove', e => { pointer = (e.clientX / Math.max(1, W)) - 0.5; }, { passive: true });

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (auto) cycle += dt * autoSpeed;
    else {
      const d = (((target - cycle) % 1) + 1.5) % 1 - 0.5;
      cycle += d * Math.min(1, dt * 0.9);
    }
    cycle = ((cycle % 1) + 1) % 1;
    boost *= Math.pow(0.25, dt);
    cam += dt * (camSpeed + boost) * (reduce ? 0.15 : 1);
    pointerS += (pointer - pointerS) * Math.min(1, dt * 2.5);
    paint(ctx, W, H, { cycle, cam: cam + (reduce ? 0 : pointerS * 60), time: now / 1000, live: true, dt, flakeWind: -boost * 0.4 });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  HEV.scenery = {
    paint,
    paletteAt,
    setMode(m) {
      mode = m;
      if (m === 'home') { auto = true; autoSpeed = 1 / 80; camSpeed = 28; }
      else if (m === 'party') { auto = true; autoSpeed = 1 / 260; camSpeed = 14; }
      else if (m === 'calm') { auto = true; autoSpeed = 1 / 200; camSpeed = 10; }
      else if (m === 'journey') { auto = false; camSpeed = 9; }
    },
    /* Csendes úton a napszak a haladást követi: hajnaltól alkonyig. */
    setProgress(p) { target = 0.03 + U_clamp(p) * 0.5; },
    boost(amount) { boost += amount || 160; },
    get cycle() { return cycle; }
  };
  function U_clamp(p) { return Math.max(0, Math.min(1, p)); }
})();
