/* Közös segédek: tárolás, megjelenítés, kitüntetések. */
(function () {
  const HEV = window.HEV;
  const app = document.getElementById('app');

  /* ---------- Tárolás (localStorage, hibatűrő) ---------- */
  const PREFIX = 'hev:';
  HEV.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* privát mód */ }
    }
  };

  /* ---------- Megjelenítés ---------- */
  const toastQueue = [];
  let toastBusy = false;
  function nextToast() {
    const item = toastQueue.shift();
    if (!item) { toastBusy = false; return; }
    toastBusy = true;
    const layer = document.getElementById('toast-layer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="toast-glyph" aria-hidden="true">${U.esc(item.glyph || '✦')}</span>
      <span class="toast-text"><b>${U.esc(item.title)}</b><small>${U.esc(item.desc || '')}</small></span>`;
    layer.appendChild(el);
    setTimeout(() => el.classList.add('in'), 30);
    setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); }, 2600);
    setTimeout(() => { el.remove(); nextToast(); }, 3150);
  }
  const U = HEV.ui = {
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    render(html) {
      app.innerHTML = html;
      app.scrollTop = 0;
      const first = app.querySelector('[data-autofocus]');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
      return app;
    },
    $(sel, root) { return (root || app).querySelector(sel); },
    $$(sel, root) { return Array.from((root || app).querySelectorAll(sel)); },
    on(sel, ev, fn, root) { U.$$(sel, root).forEach(el => el.addEventListener(ev, fn)); },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    fmt(str, vars) { return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)); },
    num(n, digits) {
      return Number(n).toLocaleString('hu-HU', { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
    },
    words(s) { return String(s).trim().split(/\s+/).filter(Boolean).length; },
    meter(label, value, cls) {
      const v = U.clamp(Math.round(value), 0, 100);
      return `<div class="meter ${cls || ''}" role="meter" aria-label="${U.esc(label)}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100">
        <div class="meter-top"><span>${U.esc(label)}</span><span class="meter-val">${v}</span></div>
        <div class="meter-track"><div class="meter-fill" style="width:${v}%"></div></div>
      </div>`;
    },
    /* Felugró jelzés kitüntetéshez. Egyszerre egy látszik, a többi sorban vár. */
    toast(title, desc, glyph) {
      toastQueue.push({ title, desc, glyph });
      if (!toastBusy) nextToast();
    },
    /* Lebegő pontszám a gomb fölött. */
    floatPoints(text, anchor) {
      const el = document.createElement('div');
      el.className = 'float-pts';
      el.textContent = text;
      const r = (anchor || app).getBoundingClientRect();
      el.style.left = (r.left + r.width / 2) + 'px';
      el.style.top = (r.top) + 'px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  };

  /* ---------- Kitüntetések ---------- */
  HEV.ach = {
    all() { return HEV.store.get('ach', {}); },
    has(id) { return !!HEV.ach.all()[id]; },
    unlock(id) {
      const all = HEV.ach.all();
      if (all[id]) return false;
      all[id] = Date.now();
      HEV.store.set('ach', all);
      const a = HEV.data.achievements.find(x => x.id === id);
      if (a) {
        U.toast(a.title, a.desc, a.glyph);
        if (HEV.audio) HEV.audio.chime();
      }
      return true;
    }
  };

  /* ---------- Statisztika ---------- */
  HEV.stats = {
    get() { return HEV.store.get('stats', { journeys: 0, best: 0, parties: 0 }); },
    bump(patch) {
      const s = HEV.stats.get();
      Object.keys(patch).forEach(k => { s[k] = patch[k](s[k] || 0); });
      HEV.store.set('stats', s);
      return s;
    }
  };
})();
