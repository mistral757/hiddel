/* Időkapszula: megosztható kép a két évszámmal és a legerősebb mondattal. */
(function () {
  const HEV = window.HEV;

  function wrap(g, text, maxW) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function draw(cap) {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    HEV.scenery.paint(g, W, H, { cycle: cap.cycle != null ? cap.cycle : 0.47, cam: (cap.old * 37) % 5000, time: 0, live: false });

    /* Sötétítés a szöveg mögé */
    const shade = g.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(20,14,36,0.55)');
    shade.addColorStop(0.55, 'rgba(20,14,36,0.25)');
    shade.addColorStop(1, 'rgba(20,14,36,0.65)');
    g.fillStyle = shade; g.fillRect(0, 0, W, H);

    g.textAlign = 'center';
    g.fillStyle = '#fffaf3';
    const serif = '"Cormorant Garamond", Garamond, Georgia, serif';
    const sans = 'Jost, "Avenir Next", "Segoe UI", sans-serif';

    g.font = `italic 300 150px ${serif}`;
    g.fillText(`${cap.old}`, W / 2 - 230, 250);
    g.fillText(`${cap.now}`, W / 2 + 230, 250);
    g.font = `300 70px ${serif}`;
    g.globalAlpha = 0.7;
    g.fillText('—', W / 2, 232);
    g.globalAlpha = 1;

    g.font = `400 34px ${sans}`;
    g.globalAlpha = 0.75;
    g.fillText(cap.name ? `${cap.name} üzenete a régi önmagának` : 'Üzenet a régi önmagamnak', W / 2, 330);
    g.globalAlpha = 1;

    g.font = `italic 400 60px ${serif}`;
    let lines = wrap(g, `„${cap.quote}”`, W - 200);
    if (lines.length > 8) { lines = lines.slice(0, 8); lines[7] = lines[7].replace(/\s*\S*$/, '') + ' …”'; }
    const lh = 76;
    const startY = 640 - (lines.length * lh) / 2;
    lines.forEach((ln, i) => g.fillText(ln, W / 2, startY + i * lh));

    g.font = `400 30px ${sans}`;
    g.globalAlpha = 0.85;
    if (cap.score != null) g.fillText(`${HEV.ui.num(cap.score)} pont`, W / 2, H - 150);
    g.globalAlpha = 0.6;
    g.fillText('Hidd el, én vagyok!', W / 2, H - 95);
    g.globalAlpha = 1;
    return c;
  }

  function fileName(cap) { return `idokapszula-${cap.old}-${cap.now}.png`; }

  HEV.capsule = {
    draw,
    dataURL(cap) { return draw(cap).toDataURL('image/png'); },
    download(cap) {
      draw(cap).toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName(cap);
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, 'image/png');
    },
    canShare() { return !!(navigator.share && navigator.canShare); },
    share(cap) {
      draw(cap).toBlob(async blob => {
        try {
          const file = new File([blob], fileName(cap), { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Időkapszula', text: `${cap.old} → ${cap.now}` });
          } else { HEV.capsule.download(cap); }
        } catch (e) { /* a felhasználó bezárta a megosztást */ }
      }, 'image/png');
    },
    list() { return HEV.store.get('capsules', []); },
    save(cap) {
      const all = HEV.capsule.list();
      all.unshift(Object.assign({ id: Date.now().toString(36), date: new Date().toISOString() }, cap));
      HEV.store.set('capsules', all.slice(0, 60));
      if (all.length >= 5) HEV.ach.unlock('collector');
      return all.length;
    },
    remove(id) {
      HEV.store.set('capsules', HEV.capsule.list().filter(c => c.id !== id));
    }
  };
})();
