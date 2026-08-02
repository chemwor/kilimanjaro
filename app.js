/* Kilimanjaro — Lemosho in seven days
 * Renders the day sections, the elevation profile and the galleries from
 * data/trip.js + data/photos.json. No build step, no dependencies.
 */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ── units ──────────────────────────────────────────────────── */
  let unit = 'm';
  const M_TO_FT = 3.28084;
  const toUnit  = m => unit === 'm' ? Math.round(m) : Math.round(m * M_TO_FT);
  const comma   = n => n.toLocaleString('en-US');
  const elev    = m => comma(toUnit(m)) + ' ' + unit;

  /* Elements whose text is an elevation get re-rendered on unit switch. */
  const elevNodes = [];
  const regElev = (node, metres, fmt = elev) => {
    elevNodes.push({ node, metres, fmt });
    node.textContent = fmt(metres);
  };
  const repaintElev = () => elevNodes.forEach(e => { e.node.textContent = e.fmt(e.metres); });

  /* ── day sections ───────────────────────────────────────────── */
  const fmtDate = iso => new Date(iso + 'T12:00:00')
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  /* Gain/loss for a day, measured across its own points and carried on
     from where the previous day finished. */
  function dayVertical(day, prevElev) {
    let gain = 0, loss = 0, last = prevElev;
    for (const p of day.points) {
      if (p.skipped) continue;              // walked through, but keep the profile honest
      if (last != null) {
        const d = p.m - last;
        if (d > 0) gain += d; else loss -= d;
      }
      last = p.m;
    }
    return { gain, loss, end: last };
  }

  function renderDays() {
    const host = $('#days');
    let prevElev = null;

    TRIP.days.forEach(day => {
      const { gain, loss, end } = dayVertical(day, prevElev);
      prevElev = end;

      const sec = document.createElement('section');
      sec.className = 'day reveal' + (day.summit ? ' is-summit' : '');
      sec.id = 'day' + day.n;

      const pointsHTML = day.points.map(p => {
        const cls = [
          p.camp && 'is-camp', p.peak && 'is-peak',
          p.summit && 'is-summit', p.skipped && 'is-skipped',
        ].filter(Boolean).join(' ');
        return `<li class="${cls}">
            <span class="p-name">${p.name}</span><span class="p-el" data-m="${p.m}"></span>
            <span class="p-note">${p.note}</span>
          </li>`;
      }).join('');

      // A null metre value means "print the literal text, don't track units".
      const stats = [
        ['up',   'ascent',   gain ? '+' + gain : '—', gain || null],
        ['down', 'descent',  loss ? '−' + loss : '—', loss || null],
        ['',     'distance', day.distanceKm ? day.distanceKm + ' km' : '—', null],
        day.sleepAt
          ? ['', 'slept at', null, day.sleepAt]
          : ['', 'on trail', day.hours === '—' ? '—' : day.hours + ' h', null],
      ];

      sec.innerHTML = `
        <div class="wrap">
          <div class="day-head">
            <span class="day-num">Day ${day.n}</span>
            <span class="day-date">${fmtDate(day.date)}</span>
            <span class="day-zone">${day.zone}</span>
          </div>
          <h2>${day.label}</h2>
          <p class="leg"><b>${day.from}</b> <span class="arrow">→</span> <b>${day.to}</b>
             ${day.firstFrame ? `<span>· on the move ${day.firstFrame}–${day.lastFrame}</span>` : ''}</p>

          <div class="day-body">
            <div>
              <p class="blurb">${day.blurb}</p>
              ${day.highlight ? `<span class="tag">${day.highlight}</span>` : ''}
              ${day.points.length ? `<ul class="points">${pointsHTML}</ul>` : ''}
            </div>
            <div>
              <div class="day-stats">
                ${stats.map(([k, lbl, txt, m]) => `
                  <div class="${k}"><b ${m != null ? `data-m="${m}"` : ''}>${txt ?? ''}</b>
                  <span>${lbl}</span></div>`).join('')}
              </div>
            </div>
          </div>
          <div class="gallery" data-date="${day.date}"></div>
        </div>`;

      host.appendChild(sec);

      // Wire every [data-m] up to the unit toggle.
      $$('.p-el[data-m]', sec).forEach(n => regElev(n, +n.dataset.m));
      $$('.day-stats b[data-m]', sec).forEach(n => {
        const m = +n.dataset.m, sign = n.textContent.trim()[0];
        regElev(n, m, mm => (sign === '+' || sign === '−' ? sign : '') + comma(toUnit(mm)) + ' ' + unit);
      });
    });
  }

  /* ── elevation profile ──────────────────────────────────────── */
  function renderProfile() {
    // Flatten every point into one walked sequence. Where a day ends and the
    // next begins at the same camp (Barafu, day 4 → 5) we'd otherwise plot the
    // same dot twice, so drop the repeat.
    const pts = [];
    TRIP.days.forEach(d => d.points.forEach(p => {
      const last = pts[pts.length - 1];
      if (last && last.km === p.km && last.m === p.m) return;
      pts.push({ ...p, day: d.n, dayLabel: d.label });
    }));
    if (!pts.length) return;

    const W = 1200, H = 450;
    const M = { t: 62, r: 34, b: 56, l: 62 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    const kmMax = Math.max(...pts.map(p => p.km));
    const elMin = 1400, elMax = 6300;
    const X = km => M.l + (km / kmMax) * iw;
    const Y = m  => M.t + (1 - (m - elMin) / (elMax - elMin)) * ih;

    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.km).toFixed(1)},${Y(p.m).toFixed(1)}`).join(' ');
    const area = `${line} L${X(kmMax).toFixed(1)},${M.t + ih} L${X(pts[0].km).toFixed(1)},${M.t + ih} Z`;

    // Horizontal gridlines every 1000 m.
    let grid = '';
    for (let m = 2000; m <= 6000; m += 1000) {
      grid += `<line class="ax-line" x1="${M.l}" y1="${Y(m)}" x2="${W - M.r}" y2="${Y(m)}"/>
               <text class="ax-label" x="${M.l - 12}" y="${Y(m) + 4}" text-anchor="end"
                     data-gridm="${m}">${m}</text>`;
    }

    // Shade the summit push (day 5, Barafu out and back).
    const summitDay = TRIP.days.find(d => d.summit);
    let band = '';
    if (summitDay) {
      const kms = summitDay.points.map(p => p.km);
      const x0 = X(Math.min(...kms)), x1 = X(Math.max(...kms));
      band = `<rect class="band-summit" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih}" rx="4"/>
              <text class="band-label" x="${(x0 + x1) / 2}" y="${M.t - 34}" text-anchor="middle">summit push</text>`;
    }

    // Day markers along the bottom axis.
    let ticks = '';
    TRIP.days.forEach(d => {
      if (!d.points.length) return;
      const kms = d.points.map(p => p.km);
      const mid = X((Math.min(...kms) + Math.max(...kms)) / 2);
      ticks += `<text class="daytick" x="${mid}" y="${M.t + ih + 34}" text-anchor="middle">DAY ${d.n}</text>`;
    });

    // Points. Labels alternate above/below to keep them from colliding.
    const dot = p =>
      p.summit  ? { r: 7, fill: 'var(--sun)',   stroke: 'rgba(242,166,90,.3)', sw: 6 } :
      p.skipped ? { r: 5, fill: 'var(--ink-2)', stroke: '#7c8798', sw: 1.5, dash: '3 2' } :
      p.peak    ? { r: 6, fill: 'var(--scree)', stroke: 'rgba(162,145,125,.25)', sw: 4 } :
      p.camp    ? { r: 6, fill: 'var(--ice)',   stroke: 'rgba(143,211,232,.22)', sw: 4 } :
                  { r: 4.5, fill: '#59677b', stroke: 'transparent', sw: 0 };

    /* Label placement. A label sits above its point on peaks and on the way up,
       below it in the troughs — then we walk left-to-right and push any label
       that still overlaps an already-placed one further out. */
    const LBL_H = 26;
    const halfW = name => Math.max(34, name.length * 3.2);   // ~6.4px per char, halved
    const floorY = M.t + ih - 4;                             // labels must clear the axis
    const placed = [];
    const labels = pts.map((p, i) => {
      const prev = pts[i - 1], next = pts[i + 1];
      const before = prev ? prev.m : p.m, after = next ? next.m : p.m;
      let above = p.m >= (before + after) / 2;        // peak-ish → label above
      const x = X(p.km), y = Y(p.m);
      if (!above && y + 41 > floorY) above = true;    // no room underneath

      let ly = above ? y - 20 : y + 28;
      for (let guard = 0; guard < 8; guard++) {
        const clash = placed.some(q =>
          Math.abs(q.x - x) < halfW(p.name) + q.halfW && Math.abs(q.ly - ly) < LBL_H);
        if (!clash) break;
        ly += above ? -LBL_H : LBL_H;
      }
      placed.push({ x, ly, halfW: halfW(p.name) });
      return { x, y, ly, anchor: x > W - 130 ? 'end' : x < M.l + 50 ? 'start' : 'middle' };
    });

    let dots = '';
    pts.forEach((p, i) => {
      const s = dot(p), { x, y, ly, anchor } = labels[i];
      dots += `<g class="pt" data-i="${i}">
          <circle cx="${x}" cy="${y}" r="${s.r}" fill="${s.fill}"
                  stroke="${s.stroke}" stroke-width="${s.sw}"
                  ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>
          <text class="pt-label" x="${x}" y="${ly}" text-anchor="${anchor}">${p.name}</text>
          <text class="pt-elev" x="${x}" y="${ly + 13}" text-anchor="${anchor}" data-m="${p.m}"></text>
        </g>`;
    });

    $('#profile-chart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Elevation profile of the seven-day Lemosho route">
        <defs>
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#6f9e6b"/>
            <stop offset="45%"  stop-color="#8fd3e8"/>
            <stop offset="70%"  stop-color="#f2a65a"/>
            <stop offset="100%" stop-color="#6f9e6b"/>
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="rgba(143,211,232,.22)"/>
            <stop offset="100%" stop-color="rgba(143,211,232,0)"/>
          </linearGradient>
        </defs>
        ${band}${grid}
        <path class="track-fill" d="${area}"/>
        <path class="track" d="${line}"/>
        ${dots}${ticks}
        <line class="ax-line" x1="${M.l}" y1="${M.t + ih}" x2="${W - M.r}" y2="${M.t + ih}"/>
      </svg>`;

    // Elevation text inside the SVG follows the unit toggle too.
    $$('#profile-chart .pt-elev').forEach(n => regElev(n, +n.dataset.m, m => comma(toUnit(m))));
    $$('#profile-chart [data-gridm]').forEach(n =>
      regElev(n, +n.dataset.gridm, m => comma(toUnit(m))));

    /* Tooltip */
    const holder = $('.profile-holder');
    holder.style.position = 'relative';
    const tip = document.createElement('div');
    tip.className = 'profile-tip';
    holder.appendChild(tip);

    const show = (e, p) => {
      tip.innerHTML = `<b>${p.name}</b>
        <span class="tip-el">${elev(p.m)} · km ${p.km} · day ${p.day}</span>
        <p>${p.note}</p>`;
      const box = holder.getBoundingClientRect();
      tip.style.left = (e.clientX - box.left + holder.scrollLeft) + 'px';
      tip.style.top  = (e.clientY - box.top) + 'px';
      tip.classList.add('on');
    };
    $$('#profile-chart .pt').forEach(g => {
      const p = pts[+g.dataset.i];
      g.addEventListener('mouseenter', e => show(e, p));
      g.addEventListener('mousemove',  e => show(e, p));
      g.addEventListener('mouseleave', () => tip.classList.remove('on'));
      g.addEventListener('click', () => {
        const sec = $('#day' + p.day);
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── ledger ─────────────────────────────────────────────────── */
  function renderLedger() {
    // Total vertical, walked in order, across the whole trek.
    const all = TRIP.days.flatMap(d => d.points).filter(p => !p.skipped);
    let gain = 0, loss = 0;
    for (let i = 1; i < all.length; i++) {
      const d = all[i].m - all[i - 1].m;
      if (d > 0) gain += d; else loss -= d;
    }

    const rows = [
      [comma(toUnit(TRIP.facts.summitElevation)), 'highest point', TRIP.facts.summitElevation],
      ['+' + comma(toUnit(gain)), 'total ascent', gain],
      ['−' + comma(toUnit(loss)), 'total descent', loss],
      [TRIP.facts.distanceKm + ' km', 'distance walked', null],
      [comma(toUnit(TRIP.facts.highestSleep)), 'highest camp', TRIP.facts.highestSleep],
      [TRIP.facts.nightsOnMountain, 'nights on the mountain', null],
      ['5', 'climate zones crossed', null],
      ['~49%', 'of sea-level oxygen at the top', null],
    ];

    $('#ledgerGrid').innerHTML = rows.map(([v, l, m]) =>
      `<div><b ${m != null ? `data-m="${m}"` : ''}>${v}</b><span>${l}</span></div>`).join('');

    $$('#ledgerGrid b[data-m]').forEach(n => {
      const sign = n.textContent.trim()[0];
      regElev(n, +n.dataset.m,
        m => (sign === '+' || sign === '−' ? sign : '') + comma(toUnit(m)));
    });
  }

  /* ── galleries ──────────────────────────────────────────────── */
  const FULL = 'assets/photos/full/', THUMB = 'assets/photos/thumb/';
  let lightboxSet = [], lightboxIdx = 0;

  async function renderGalleries() {
    let photos = [];
    try {
      const res = await fetch('data/photos.json');
      photos = await res.json();
    } catch { return; }               // opened via file:// — galleries stay empty

    const byDate = photos.reduce((acc, p) => ((acc[p.date] ??= []).push(p), acc), {});

    $$('.gallery').forEach(host => {
      const list = byDate[host.dataset.date];
      if (!list || !list.length) return;

      const FIRST = 8;
      host.innerHTML = `<h3>${list.length} frame${list.length > 1 ? 's' : ''} from this day</h3>
                        <div class="grid"></div>
                        ${list.length > FIRST ? `<button class="more">Show all ${list.length}</button>` : ''}`;
      const grid = $('.grid', host);

      const tile = (p, i) => {
        const b = document.createElement('button');
        b.className = 'shot';
        b.innerHTML = `<img loading="lazy" src="${THUMB + p.file}" alt="Day photo at ${p.time}">
                       <time>${p.time}</time>`;
        const img = $('img', b);
        img.addEventListener('load', () => img.classList.add('loaded'));
        if (img.complete) img.classList.add('loaded');
        b.addEventListener('click', () => openLightbox(list, i));
        return b;
      };

      list.slice(0, FIRST).forEach((p, i) => grid.appendChild(tile(p, i)));
      const btn = $('.more', host);
      if (btn) btn.addEventListener('click', () => {
        list.slice(FIRST).forEach((p, i) => grid.appendChild(tile(p, i + FIRST)));
        btn.remove();
      });
    });
  }

  /* ── lightbox ───────────────────────────────────────────────── */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');

  function openLightbox(set, i) {
    lightboxSet = set;
    lightboxIdx = i;
    paintLightbox();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function paintLightbox() {
    const p = lightboxSet[lightboxIdx];
    lbImg.src = FULL + p.file;
    lbImg.alt = `Photo taken at ${p.time} on ${p.date}`;
    lbCap.textContent = `${fmtDate(p.date)} · ${p.time} · ${lightboxIdx + 1}/${lightboxSet.length}`;
  }
  const step = d => {
    lightboxIdx = (lightboxIdx + d + lightboxSet.length) % lightboxSet.length;
    paintLightbox();
  };
  const closeLightbox = () => {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  };

  $('.lb-close').addEventListener('click', closeLightbox);
  $('.lb-prev').addEventListener('click', () => step(-1));
  $('.lb-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  /* ── hero counters + scroll reveal ──────────────────────────── */
  function heroCounters() {
    $$('.hero-stats b[data-count]').forEach(el => {
      const target = +el.dataset.count;
      const isElev = el.hasAttribute('data-elev');
      const paint = v => el.textContent = comma(Math.round(v));
      if (isElev) regElev(el, target, m => comma(toUnit(m)));

      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        paint((isElev ? toUnit(target) : target) * eased);
        if (k < 1) requestAnimationFrame(tick);
      };
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(tick);
      else paint(isElev ? toUnit(target) : target);
    });
  }

  function reveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ── boot ───────────────────────────────────────────────────── */
  renderDays();
  renderProfile();
  renderLedger();
  renderGalleries();
  heroCounters();
  reveals();

  $('#unitToggle').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.unit === unit) return;
    unit = b.dataset.unit;
    $$('#unitToggle button').forEach(x => x.classList.toggle('on', x === b));
    repaintElev();
  });
})();
