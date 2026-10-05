/* Generatív, nyugodt aláfestő zene Web Audióval.
   Nincs hangfájl: a böngésző minden indításkor élőben, kicsit másként játssza. */
(function () {
  const HEV = window.HEV;
  const A = HEV.audio = {};

  let ctx = null, master = null, padBus = null, fxBus = null, delaySend = null, reverb = null;
  let running = false, timer = null, stopTimer = null;
  let nextChord = 0, chordIdx = 0, nextPluck = 0, density = 1;
  const CHORD_LEN = 9.6;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  /* D-dúr környéki, lebegő akkordok: Dadd9, Hm9, Gmaj7, Asus */
  const CHORDS = [
    [50, 57, 62, 66, 69, 76],
    [47, 54, 59, 62, 66, 73],
    [43, 50, 59, 62, 66, 69],
    [45, 52, 57, 62, 64, 71]
  ];
  const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83];

  function impulse(sec) {
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    return b;
  }

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.05; comp.release.value = 0.4;
    master.connect(comp); comp.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse(4.5);
    const rv = ctx.createGain(); rv.gain.value = 0.85;
    reverb.connect(rv); rv.connect(master);

    padBus = ctx.createGain(); padBus.gain.value = 0.5;
    padBus.connect(master); padBus.connect(reverb);

    fxBus = ctx.createGain(); fxBus.gain.value = 0.55;
    fxBus.connect(master); fxBus.connect(reverb);

    /* Visszhang a pengetett hangoknak */
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.48;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
    delaySend = ctx.createGain(); delaySend.gain.value = 0.45;
    delaySend.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay);
    const dOut = ctx.createGain(); dOut.gain.value = 0.5;
    dlp.connect(dOut); dOut.connect(master); dOut.connect(reverb);

    /* Szél: szűrt zaj, lassan hullámzó szűrővel */
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.8;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(bp.frequency);
    const wg = ctx.createGain(); wg.gain.value = 0.018;
    noise.connect(bp); bp.connect(wg); wg.connect(master);
    noise.start(); lfo.start();

    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (running) ctx.resume();
    });
    return true;
  }

  function playChord(t, notes) {
    const dur = CHORD_LEN;
    notes.forEach((m, i) => {
      const f = mtof(m);
      const g = ctx.createGain();
      const vol = (i === 0 ? 0.09 : 0.05) / (1 + i * 0.1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 2.8);
      g.gain.setValueAtTime(vol, t + dur - 0.4);
      g.gain.linearRampToValueAtTime(0, t + dur + 3.6);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(650, t);
      lp.frequency.linearRampToValueAtTime(1350, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(750, t + dur + 3);
      lp.connect(g); g.connect(padBus);
      [['sine', 0, 1], ['triangle', 7, 0.3], ['triangle', -7, 0.3]].forEach(([type, det, lvl]) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const og = ctx.createGain(); og.gain.value = lvl;
        o.connect(og); og.connect(lp);
        o.start(t); o.stop(t + dur + 4);
      });
    });
    /* Mély, puha alaphang */
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = mtof(notes[0] - 12);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(0.07, t + 3);
    sg.gain.setValueAtTime(0.07, t + dur - 0.4); sg.gain.linearRampToValueAtTime(0, t + dur + 2.5);
    sub.connect(sg); sg.connect(master);
    sub.start(t); sub.stop(t + dur + 3);
  }

  function pluck(t, m, vel, toBus) {
    const f = mtof(m);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.14;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g); o2.connect(g2); g2.connect(g);
    g.connect(toBus || fxBus); g.connect(delaySend);
    o.start(t); o2.start(t); o.stop(t + 2.8); o2.stop(t + 2.8);
  }

  function tick() {
    const now = ctx.currentTime;
    if (nextChord < now - 1) nextChord = now + 0.1;
    if (nextPluck < now - 1) nextPluck = now + 0.5;
    while (nextChord < now + 1) {
      playChord(nextChord, CHORDS[chordIdx % CHORDS.length]);
      chordIdx++;
      nextChord += CHORD_LEN;
    }
    while (nextPluck < now + 0.5) {
      if (Math.random() < 0.82) {
        pluck(nextPluck, PENTA[Math.floor(Math.random() * PENTA.length)], 0.045 + Math.random() * 0.05);
        if (Math.random() < 0.3) pluck(nextPluck + 0.24, PENTA[Math.floor(Math.random() * PENTA.length)], 0.03);
      }
      nextPluck += (1.0 + Math.random() * 2.6) / density;
    }
  }

  A.start = function () {
    if (!ctx && !init()) return;
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    ctx.resume();
    if (!running) {
      running = true;
      nextChord = ctx.currentTime + 0.1;
      nextPluck = ctx.currentTime + 2;
      tick();
      timer = setInterval(tick, 250);
    }
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.6, t + 2.5);
  };

  A.stop = function () {
    if (!ctx || !running) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 1.2);
    stopTimer = setTimeout(() => {
      clearInterval(timer); timer = null; running = false; stopTimer = null;
      ctx.suspend();
    }, 1400);
  };

  A.isRunning = () => running && !stopTimer;
  A.setDensity = d => { density = d; };

  /* Apró hangjelzések a felülethez — csak ha szól a zene. */
  A.chime = function () {
    if (!ctx || !A.isRunning()) return;
    const t = ctx.currentTime + 0.02;
    [74, 78, 81, 86].forEach((m, i) => pluck(t + i * 0.09, m, 0.08));
  };
  A.tap = function () {
    if (!ctx || !A.isRunning()) return;
    pluck(ctx.currentTime + 0.01, PENTA[5 + Math.floor(Math.random() * 4)], 0.035);
  };
})();
