/* Kilimanjaro: Lemosho in seven days
 * Renders the day sheets, the elevation profile, the pulse oximetry chart and
 * the photo plates from data/trip.js + data/photos.json. No build, no deps.
 */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ── units ──────────────────────────────────────────────────── */
  let unit = 'ft';
  const M_TO_FT = 3.28084, KM_TO_MI = 0.621371;
  const toUnit = m => unit === 'm' ? Math.round(m) : Math.round(m * M_TO_FT);
  const comma  = n => n.toLocaleString('en-US');
  const elev   = m => comma(toUnit(m)) + ' ' + unit;
  const dist   = km => unit === 'm' ? `${km} km` : `${(km * KM_TO_MI).toFixed(1)} mi`;

  /* Nodes whose text is a measurement get repainted on unit switch. */
  const liveNodes = [];
  const reg = (node, value, fmt) => {
    liveNodes.push({ node, value, fmt });
    node.textContent = fmt(value);
  };
  const repaint = () => liveNodes.forEach(e => { e.node.textContent = e.fmt(e.value); });

  /* ── formatting ─────────────────────────────────────────────── */
  const fmtDate = iso => new Date(iso + 'T12:00:00')
    .toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });

  /* Times are stored 24-hour (sortable, easy to edit) and shown as am/pm. */
  const fmtTime = t => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
    if (!m) return t;
    const h24 = +m[1];
    return `${h24 % 12 || 12}:${m[2]} ${h24 < 12 ? 'am' : 'pm'}`;
  };

  const pad2 = n => String(n).padStart(2, '0');

  /* Chart colors come from the stylesheet, so the palette has one home. */
  const cssVar = n => getComputedStyle(document.documentElement)
    .getPropertyValue(n).trim() || '#000';
  const PALETTE = {};
  const paint = n => (PALETTE[n] ??= cssVar(n));

  /* Prose carries {{4673}} for an elevation and {{65km}} for a distance, so a
     sentence never hard-codes a unit. These become spans that the ft/m toggle
     repaints along with everything else. */
  const interp = text => String(text ?? '')
    .replace(/\{\{(\d+(?:\.\d+)?)\s*km\}\}/gi, (_, v) => `<span data-udist="${v}"></span>`)
    .replace(/\{\{(\d+)\}\}/g, (_, v) => `<span data-uelev="${v}"></span>`);

  const wireUnits = root => {
    $$('[data-uelev]', root).forEach(n => reg(n, +n.dataset.uelev, elev));
    $$('[data-udist]', root).forEach(n => reg(n, +n.dataset.udist, dist));
  };
  const HERO = 'assets/photos/hero/';

  /* Climate zones, in the order they must be tested: "Heather & moorland" is
     heather, and "Moorland -> alpine desert" is moorland, so the earlier and
     more specific names have to win. Each key has a palette in styles.css. */
  const ZONES = [
    [/rainforest/i, 'rainforest', '#3f5c37'],
    [/heather/i,    'heather',    '#5f7a55'],
    [/moorland/i,   'moorland',   '#9a8f5f'],
    [/alpine|desert/i, 'desert',  '#a68a6d'],
    [/arctic|summit/i, 'arctic',  '#5b7f96'],
  ];
  const zoneOf    = z => ZONES.find(([re]) => re.test(z || '')) || [, 'moorland', '#9a8f5f'];
  const zoneKey   = z => zoneOf(z)[1];
  const zoneColor = z => zoneOf(z)[2];

  /* Fade a full-bleed photograph in once it has actually decoded. */
  const fadeIn = img => {
    if (img.complete) img.classList.add('in');
    else img.addEventListener('load', () => img.classList.add('in'), { once: true });
  };
  const symbolFor = p => p.summit ? '◆' : p.peak ? '▲' : (p.camp || p.skipped) ? '△' : '·';

  /* ── vertical accounting ────────────────────────────────────── */
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

  function totals() {
    const all = TRIP.days.flatMap(d => d.points).filter(p => !p.skipped);
    let gain = 0, loss = 0;
    for (let i = 1; i < all.length; i++) {
      const d = all[i].m - all[i - 1].m;
      if (d > 0) gain += d; else loss -= d;
    }
    return { gain, loss };
  }

  /* ── cover ──────────────────────────────────────────────────── */
  function renderCover() {
    const img = $('#coverImg');
    if (!img || !TRIP.cover) return;
    img.src = HERO + TRIP.cover + '.jpg';
    fadeIn(img);
  }

  /* ── masthead figures ───────────────────────────────────────── */
  function renderRail() {
    const f = TRIP.facts;
    const rows = [
      ['summit',        f.summitElevation, v => comma(toUnit(v)), false],
      ['on foot',       f.distanceKm,      dist,                  false],
      ['days',          f.days,            String,                false],
      ['on the summit', f.summitTime,      String,                false],
      ['lowest SpO₂',   f.summitSpo2,      v => v + '%',          true],
    ];
    $('#heroRail').innerHTML = rows.map(([lbl, , , hot]) =>
      `<div class="${hot ? 'hot' : ''}"><b></b><span>${lbl}</span></div>`).join('');
    $$('#heroRail b').forEach((b, i) => reg(b, rows[i][1], rows[i][2]));
  }

  /* ── day sheets ─────────────────────────────────────────────── */
  function renderDays() {
    const host = $('#days');
    let prevElev = null;

    TRIP.days.forEach(day => {
      const { gain, loss, end } = dayVertical(day, prevElev);
      prevElev = end;

      /* Headline the day's high point when it beats the camp; that is the
         story on Lava Tower day and on summit day. */
      const high = day.points.reduce((a, p) => (p.m > a ? p.m : a), 0);
      const peak = day.summit ? { m: high, label: 'summit' }
                 : high > (day.sleepAt || 0) ? { m: high, label: 'high point' }
                 : day.sleepAt ? { m: day.sleepAt, label: 'slept here' }
                 : { m: high, label: 'end of day' };

      /* Full-bleed opener: the photograph you arrive on before the record. */
      const opener = document.createElement('section');
      opener.className = 'opener';
      opener.id = 'day' + day.n;
      opener.dataset.zone = zoneKey(day.zone);
      opener.innerHTML = `
        <div class="opener-img">
          <img alt="${day.label}" loading="${day.n > 2 ? 'lazy' : 'eager'}"
               src="${HERO + (day.hero || TRIP.cover) + '.jpg'}">
        </div>
        <p class="opener-alt"><b data-alt="${peak.m}"></b>${peak.label}</p>
        <div class="opener-type">
          <p class="opener-day">
            <span class="n">Day ${pad2(day.n)}</span>
            <span>${fmtDate(day.date)}</span>
            <span class="z">${day.zone}</span>
          </p>
          <h2>${day.label}</h2>
          ${day.heroCaption ? `<p class="opener-cap">${interp(day.heroCaption)}</p>` : ''}
        </div>`;
      host.appendChild(opener);
      wireUnits(opener);
      fadeIn($('img', opener));
      $$('.opener-alt b[data-alt]', opener).forEach(n => reg(n, +n.dataset.alt, elev));

      const sec = document.createElement('section');
      sec.className = 'sheet-block day' + (day.summit ? ' is-summit' : '');
      sec.dataset.zone = zoneKey(day.zone);

      const logbook = day.points.length ? `
        <table class="logbook">
          <tr><th></th><th>Station</th><th style="text-align:right">Elev.</th></tr>
          ${day.points.map(p => {
            const cls = [p.camp && 'is-camp', p.peak && 'is-peak',
                         p.summit && 'is-summit', p.skipped && 'is-skipped']
                        .filter(Boolean).join(' ');
            return `<tr class="${cls}">
              <td class="sym">${symbolFor(p)}</td>
              <td><span class="nm">${p.name}</span><span class="nt">${interp(p.note)}</span></td>
              <td class="el" data-m="${p.m}"></td>
            </tr>`;
          }).join('')}
        </table>` : '';

      const paras = (Array.isArray(day.blurb) ? day.blurb : [day.blurb])
        .map(p => `<p>${interp(p)}</p>`).join('');

      /* [label, literal text, measurement, formatter, isHot] */
      const log = [
        ['On the move', day.firstFrame ? `${fmtTime(day.firstFrame)}–${fmtTime(day.lastFrame)}` : '·'],
        ['Ascent',   null, gain,           v => (v ? '+' : '') + elev(v)],
        ['Descent',  null, loss,           v => (v ? '−' : '') + elev(v)],
        ['Distance', null, day.distanceKm, dist],
        ['On trail', /h|→/.test(day.hours) ? day.hours : day.hours + ' h'],
        day.sleepAt ? ['Slept at', null, day.sleepAt, elev]
                    : ['Ended at', 'Mweka Gate'],
      ];
      if (day.spo2) log.push(['Blood O₂', day.spo2 + '%', null, null, true]);

      const moments = (day.moments || []).length ? `
        <div class="panel">
          <h3>What happened</h3>
          <ul class="moments">
            ${day.moments.map(m => `<li class="${m.critical ? 'is-critical' : ''}">
              <b>${interp(m.title)}</b><span>${interp(m.text)}</span></li>`).join('')}
          </ul>
        </div>` : '';

      sec.innerHTML = `
        <div class="sheet-head">
          <span class="stamp">Day ${pad2(day.n)}</span>
          <span class="head-meta"><b>${day.from}</b> <span class="arrow">→</span> <b>${day.to}</b></span>
          <span class="head-zone">${day.distanceKm ? dist(day.distanceKm) : ''}</span>
        </div>
        <div class="entry-body">
          <div class="entry-main">
            <div class="prose">${paras}</div>
            ${day.highlight ? `<p class="pull">${interp(day.highlight)}</p>` : ''}
            ${logbook}
          </div>
          <aside class="entry-side">
            <div class="panel">
              <h3>Day log</h3>
              <dl>
                ${log.map(([k, txt, v, , hot], i) =>
                  `<dt>${k}</dt><dd class="${hot ? 'hot' : ''}"${v != null ? ` data-log="${i}"` : ''}>${txt ?? ''}</dd>`
                ).join('')}
              </dl>
            </div>
            ${moments}
          </aside>
        </div>
        <div class="gallery" data-date="${day.date}"></div>`;

      host.appendChild(sec);
      wireUnits(sec);
      addInterstitial(host, day.n);

      $$('.logbook .el[data-m]', sec).forEach(n => reg(n, +n.dataset.m, v => comma(toUnit(v)) + ' ' + unit));
      $$('.panel dd[data-log]', sec).forEach(n => {
        const row = log[+n.dataset.log];
        reg(n, row[2], row[3]);
      });
    });
  }

  /* How a station is drawn. The legend below the chart calls this too, so the
     key can never drift from the plot. */
  const STATION = {
    summit:  { r: 6,   fill: paint('--alert'), ring: true },
    peak:    { r: 5,   fill: paint('--z-scree') },
    camp:    { r: 5,   fill: paint('--blue') },
    skipped: { r: 5,   fill: paint('--sheet'), stroke: paint('--ink-faint') },
    plain:   { r: 3.4, fill: paint('--ink-faint') },
  };
  const stationKind = p => p.summit ? 'summit' : p.peak ? 'peak'
                         : p.camp ? 'camp' : p.skipped ? 'skipped' : 'plain';
  const stationDot = (p, x, y) => {
    const s = STATION[stationKind(p)];
    return `<circle cx="${x}" cy="${y}" r="${s.r}" fill="${s.fill}"
              stroke="${s.stroke || s.fill}" stroke-width="${s.stroke ? 1.4 : 0}"
              ${s.stroke ? 'stroke-dasharray="2.5 2"' : ''}/>` +
      (s.ring ? `<circle cx="${x}" cy="${y}" r="10" fill="none"
                   stroke="${s.fill}" stroke-width="1"/>` : '');
  };

  /* ── elevation profile ──────────────────────────────────────── */
  function renderProfile() {
    const pts = [];
    TRIP.days.forEach(d => d.points.forEach(p => {
      const last = pts[pts.length - 1];
      if (last && last.km === p.km && last.m === p.m) return;   // same camp, two days
      pts.push({ ...p, day: d.n });
    }));
    if (!pts.length) return;

    /* Barafu is passed twice, going up and coming back. Label it once. */
    const seen = new Set();
    pts.forEach(p => { p.labelled = !seen.has(p.name); seen.add(p.name); });

    const W = 1160, H = 440;
    const M = { t: 60, r: 40, b: 58, l: 64 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const kmMax = Math.max(...pts.map(p => p.km));
    const elMin = 1400, elMax = 6300;
    const X = km => M.l + (km / kmMax) * iw;
    const Y = m => M.t + (1 - (m - elMin) / (elMax - elMin)) * ih;

    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.km).toFixed(1)},${Y(p.m).toFixed(1)}`).join(' ');
    const area = `${line} L${X(kmMax).toFixed(1)},${M.t + ih} L${X(pts[0].km).toFixed(1)},${M.t + ih} Z`;

    let grid = '';
    for (let m = 2000; m <= 6000; m += 1000) {
      grid += `<line class="ax-line" x1="${M.l}" y1="${Y(m)}" x2="${W - M.r}" y2="${Y(m)}"/>
               <text class="ax-label" x="${M.l - 12}" y="${Y(m) + 4}" text-anchor="end" data-gridm="${m}"></text>`;
    }

    /* The push is the climb only: from the camp you left (Barafu, which belongs
       to the previous day's points) up to Uhuru. Not the descent afterwards. */
    const summitDay = TRIP.days.find(d => d.summit);
    let band = '';
    if (summitDay) {
      const si = summitDay.points.findIndex(p => p.summit);
      if (si >= 0) {
        const before = TRIP.days.slice(0, TRIP.days.indexOf(summitDay)).flatMap(d => d.points);
        const startKm = before.length ? Math.max(...before.map(p => p.km)) : summitDay.points[0].km;
        const x0 = X(startKm), x1 = X(summitDay.points[si].km);
        band = `<rect class="band-summit" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih}"/>
                <text class="band-label" x="${(x0 + x1) / 2}" y="${M.t - 32}" text-anchor="middle">summit push</text>`;
      }
    }

    // Climate-zone strip along the axis, keyed to the collar legend.
    const zones = [[0, 8, '#3f5c37'], [8, 14, '#5f7a55'], [14, 24, '#9a8f5f'],
                   [24, 43, '#a68a6d'], [43, 52, '#5b7f96'], [52, kmMax, '#5f7a55']];
    const strip = zones.map(([a, b, c]) =>
      `<rect x="${X(a)}" y="${M.t + ih + 6}" width="${X(b) - X(a)}" height="5" fill="${c}" opacity=".8"/>`).join('');

    let ticks = '';
    TRIP.days.forEach(d => {
      if (!d.points.length) return;
      const kms = d.points.map(p => p.km);
      ticks += `<text class="daytick" x="${X((Math.min(...kms) + Math.max(...kms)) / 2)}"
                y="${M.t + ih + 32}" text-anchor="middle">DAY ${d.n}</text>`;
    });

    /* Label placement. The stations that matter claim their spot first, so the
       summit label always sits directly on the summit dot and neighbours move
       around it rather than the other way round. */
    const LBL_H = 25, halfW = n => Math.max(32, n.length * 3.1);
    const floorY = M.t + ih - 4, ceilY = M.t - 26;
    const placed = [], labels = new Array(pts.length);

    const rank = p => p.summit ? 0 : (p.peak || p.camp) ? 1 : 2;
    const order = pts.map((_, i) => i).sort((a, b) => rank(pts[a]) - rank(pts[b]) || a - b);

    for (const i of order) {
      const p = pts[i], x = X(p.km), y = Y(p.m), hw = halfW(p.name);
      if (!p.labelled) { labels[i] = { x, y, tx: x, ly: 0, anchor: 'middle' }; continue; }
      const before = pts[i - 1] ? pts[i - 1].m : p.m;
      const after = pts[i + 1] ? pts[i + 1].m : p.m;

      const hits = (tx, ly) => placed.some(q =>
        Math.abs(q.tx - tx) < hw + q.hw && Math.abs(q.ly - ly) < LBL_H);
      const inBounds = ly => ly > ceilY && ly + 12 < floorY;

      const stack = up => {
        let ly = up ? y - 18 : y + 26;
        for (let g = 0; g < 6; g++) {
          if (!hits(x, ly)) return inBounds(ly) ? ly : null;
          ly += up ? -LBL_H : LBL_H;
        }
        return null;
      };

      const natural = p.m >= (before + after) / 2;
      let ly = stack(natural);
      if (ly === null) ly = stack(!natural);

      if (ly === null) {
        /* Nowhere to stack: sit beside the dot rather than drift off it. */
        const toLeft = x > M.l + iw / 2;
        const tx = x + (toLeft ? -13 : 13);
        labels[i] = { x, y, tx, ly: y - 1, anchor: toLeft ? 'end' : 'start' };
        placed.push({ tx, ly: y - 1, hw });
        continue;
      }

      const anchor = x > W - 120 ? 'end' : x < M.l + 46 ? 'start' : 'middle';
      labels[i] = { x, y, tx: x, ly, anchor };
      placed.push({ tx: x, ly, hw });
    }

    const dots = pts.map((p, i) => {
      const { x, y, tx, ly, anchor } = labels[i];
      return `<g class="pt" data-i="${i}">
        ${stationDot(p, x, y)}
        ${p.labelled ? `
        <text class="pt-label" x="${tx}" y="${ly}" text-anchor="${anchor}">${p.name}</text>
        <text class="pt-elev" x="${tx}" y="${ly + 12}" text-anchor="${anchor}" data-m="${p.m}"></text>` : ''}
      </g>`;
    }).join('');

    $('#profile-chart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Elevation profile of the seven-day Lemosho route">
        <defs>
          <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="${paint('--ink')}" stroke-width=".7" opacity=".2"/>
          </pattern>
        </defs>
        ${band}${grid}
        <path class="track-fill" d="${area}"/>
        <path class="track" d="${line}"/>
        ${dots}${strip}${ticks}
        <line class="ax-line" x1="${M.l}" y1="${M.t + ih}" x2="${W - M.r}" y2="${M.t + ih}"
              stroke="${paint('--ink')}" stroke-width="1.2"/>
      </svg>`;

    $$('#profile-chart .pt-elev').forEach(n => reg(n, +n.dataset.m, v => comma(toUnit(v))));
    $$('#profile-chart [data-gridm]').forEach(n => reg(n, +n.dataset.gridm, v => comma(toUnit(v))));

    const legend = $('#profileLegend');
    if (legend) {
      const keys = [
        ['camp', { camp: true }], ['high point', { peak: true }],
        ['camp we skipped', { skipped: true }], ['summit', { summit: true }],
      ];
      legend.innerHTML = keys.map(([label, p]) => `<span>
        <svg class="key-dot" viewBox="0 0 24 24" aria-hidden="true">${stationDot(p, 12, 12)}</svg>
        ${label}</span>`).join('');
    }

    attachTip($('#profile .chart-holder'), '#profile-chart .pt', i => {
      const p = pts[i];
      return {
        html: `<b>${p.name}</b><span class="tip-el">${elev(p.m)} · ${dist(p.km)} in · day ${p.day}</span>
               <p>${interp(p.note)}</p>`,
        day: p.day,
      };
    });
  }

  /* ── pulse oximetry ─────────────────────────────────────────── */
  function renderOxygen() {
    const host = $('#oxygen-chart');
    const read = TRIP.days.filter(d => d.spo2);
    if (!host || read.length < 2) return;

    const W = 1000, H = 350;
    const M = { t: 30, r: 108, b: 58, l: 54 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;
    const lo = 25, hi = 100;
    const X = i => M.l + (i / (read.length - 1)) * iw;
    const Y = v => M.t + (1 - (v - lo) / (hi - lo)) * ih;

    /* The oximetry bands reuse the climate-zone colors: green where the body
       is fine, then the same browns the mountain turns, then the alert red. */
    const zones = [[90, 100, paint('--z-heather'), 'normal'],
                   [80, 90,  paint('--z-moor'),   'hypoxemia'],
                   [60, 80,  paint('--z-scree'),  'severe'],
                   [lo, 60,  paint('--alert'),    'critical']];
    const bands = zones.map(([a, b, c, label]) => `
      <rect x="${M.l}" y="${Y(b)}" width="${iw}" height="${Y(a) - Y(b)}" fill="${c}" opacity=".16"/>
      <text class="zone-label" x="${M.l + iw + 12}" y="${(Y(a) + Y(b)) / 2 + 4}">${label}</text>`).join('');

    let grid = '';
    for (let v = 30; v <= 100; v += 10) {
      grid += `<line class="ax-line" x1="${M.l}" y1="${Y(v)}" x2="${M.l + iw}" y2="${Y(v)}"/>
               <text class="ax-label" x="${M.l - 11}" y="${Y(v) + 4}" text-anchor="end">${v}%</text>`;
    }

    const line = read.map((d, i) => `${i ? 'L' : 'M'}${X(i)},${Y(d.spo2)}`).join(' ');
    let dots = '', drop = '';
    read.forEach((d, i) => {
      const x = X(i), y = Y(d.spo2);
      dots += `<g class="ox-pt" data-day="${d.n}">
          <circle cx="${x}" cy="${y}" r="5.5" fill="${paint('--sheet')}" stroke="${paint('--ink')}" stroke-width="1.8"/>
          <text class="ox-val" x="${x}" y="${y - 15}" text-anchor="middle">${d.spo2}%</text></g>`;
      if (d.spo2Low) {
        const yl = Y(d.spo2Low);
        drop += `<line x1="${x}" y1="${y}" x2="${x}" y2="${yl}" stroke="${paint('--alert')}"
                   stroke-width="1.4" stroke-dasharray="3 3"/>
                 <g class="ox-pt" data-day="${d.n}">
                   <circle cx="${x}" cy="${yl}" r="6.5" fill="${paint('--alert')}"/>
                   <circle cx="${x}" cy="${yl}" r="11" fill="none" stroke="${paint('--alert')}" stroke-width="1"/>
                   <text class="ox-crit" x="${x - 20}" y="${yl + 4}" text-anchor="end">${d.spo2Low}% · passed out</text>
                 </g>`;
      }
    });

    const ticks = read.map((d, i) =>
      `<text class="daytick" x="${X(i)}" y="${M.t + ih + 28}" text-anchor="middle">DAY ${d.n}</text>`).join('');

    host.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Blood oxygen falling from 89% on day one to the 30s at the summit">
        ${bands}${grid}
        <path d="${line}" fill="none" stroke="${paint('--ink')}" stroke-width="1.8"
              stroke-linejoin="round" stroke-linecap="round"/>
        ${drop}${dots}${ticks}
        <line class="ax-line" x1="${M.l}" y1="${M.t + ih}" x2="${M.l + iw}" y2="${M.t + ih}"
              stroke="${paint('--ink')}" stroke-width="1.2"/>
      </svg>`;

    $$('#oxygen-chart .ox-pt').forEach(g => g.addEventListener('click', () => jumpToDay(g.dataset.day)));
  }

  /* ── shared chart tooltip ───────────────────────────────────── */
  function attachTip(holder, selector, build) {
    if (!holder) return;
    const tip = document.createElement('div');
    tip.className = 'chart-tip';
    holder.appendChild(tip);
    $$(selector).forEach(g => {
      const { html, day } = build(+g.dataset.i);
      const show = e => {
        tip.innerHTML = html;
        const box = holder.getBoundingClientRect();
        tip.style.left = (e.clientX - box.left + holder.scrollLeft) + 'px';
        tip.style.top  = (e.clientY - box.top) + 'px';
        tip.classList.add('on');
      };
      g.addEventListener('mouseenter', show);
      g.addEventListener('mousemove', show);
      g.addEventListener('mouseleave', () => tip.classList.remove('on'));
      g.addEventListener('click', () => jumpToDay(day));
    });
  }
  const jumpToDay = n => {
    const sec = $('#day' + n);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── interstitials ──────────────────────────────────────────── */
  function addInterstitial(host, afterDay) {
    (TRIP.interstitials || []).filter(i => i.after === afterDay).forEach(i => {
      const el = document.createElement('section');
      el.className = 'interstitial';
      el.innerHTML = `
        <img loading="lazy" alt="${i.caption}" src="${HERO + i.image + '.jpg'}">
        <div class="inter-type">
          <p class="inter-quote">${interp(i.quote)}</p>
          <p class="inter-cap">${interp(i.caption)}</p>
        </div>`;
      host.appendChild(el);
      wireUnits(el);
      fadeIn($('img', el));
    });
  }

  /* ── page tint ──────────────────────────────────────────────────
     The zone palettes live in styles.css. Rather than duplicate the hex
     values here, put an off-screen probe into a zone and read back what the
     stylesheet computed, then hand those to :root as the live values the
     body, contours and HUD follow. */
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0';
  document.body.appendChild(probe);
  const paletteCache = {};
  const paletteFor = key => {
    if (paletteCache[key]) return paletteCache[key];
    probe.dataset.zone = key || '';
    const cs = getComputedStyle(probe);
    const pal = ['--paper', '--sheet', '--rule'].map(v => cs.getPropertyValue(v).trim());
    return (paletteCache[key] = pal);
  };
  let paintedZone;
  const paintPage = key => {
    if (key === paintedZone) return;
    paintedZone = key;
    const [paper, sheet, rule] = paletteFor(key);
    const root = document.documentElement.style;
    root.setProperty('--live-paper', paper);
    root.setProperty('--live-sheet', sheet);
    root.setProperty('--live-rule', rule);
  };

  /* ── altitude HUD ───────────────────────────────────────────── */
  function renderHud() {
    const hud = $('#hud');
    if (!hud) return;

    /* One walked polyline, and the km span each day covers. */
    const pts = [];
    TRIP.days.forEach(d => d.points.forEach(p => {
      const last = pts[pts.length - 1];
      if (last && last.km === p.km && last.m === p.m) return;
      pts.push({ ...p, day: d.n });
    }));
    if (pts.length < 2) return;

    let prevKm = 0;
    const spans = TRIP.days.map(d => {
      const kms = d.points.map(p => p.km);
      const end = kms.length ? Math.max(...kms) : prevKm;
      const span = { day: d, from: prevKm, to: end, zone: d.zone };
      prevKm = end;
      return span;
    });

    const kmMax = Math.max(...pts.map(p => p.km));
    const elAt = km => {
      if (km <= pts[0].km) return pts[0].m;
      for (let i = 1; i < pts.length; i++) {
        if (km <= pts[i].km) {
          const a = pts[i - 1], b = pts[i];
          const t = b.km === a.km ? 1 : (km - a.km) / (b.km - a.km);
          return a.m + (b.m - a.m) * t;
        }
      }
      return pts.at(-1).m;
    };
    const nearest = km => pts.reduce((best, p) =>
      Math.abs(p.km - km) < Math.abs(best.km - km) ? p : best, pts[0]);

    /* Mini profile in the bar. */
    const W = 900, H = 38, pad = 3;
    const X = km => (km / kmMax) * W;
    const elMin = 1400, elMax = 6000;
    const Y = m => pad + (1 - (m - elMin) / (elMax - elMin)) * (H - pad * 2);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.km).toFixed(1)},${Y(p.m).toFixed(1)}`).join(' ');
    $('#hudChart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <path class="hud-fill" d="${line} L${W},${H} L0,${H} Z"/>
        <path class="hud-line" d="${line}" vector-effect="non-scaling-stroke"/>
        <g id="hudMark"><circle class="hud-mark" cx="0" cy="0" r="4"/></g>
      </svg>`;
    const mark = $('#hudMark');

    const elevOut = $('#hudElev'), whereOut = $('#hudWhere');
    const zoneOut = $('#hudZone'), swatch = $('#hudSwatch');
    let lastKm = -1;

    const update = () => {
      const mid = scrollY + innerHeight / 2;
      const collar = $('#collar');
      hud.classList.toggle('on', scrollY > innerHeight * 0.75);

      /* Which day are we inside? Openers carry the day ids. */
      let km = 0, span = spans[0];
      for (const sp of spans) {
        const opener = $('#day' + sp.day.n);
        if (!opener) continue;
        const top = opener.offsetTop;
        const next = $('#day' + (sp.day.n + 1));
        const bottom = next ? next.offsetTop : document.body.scrollHeight;
        if (mid >= top && mid < bottom) {
          const t = Math.min(1, Math.max(0, (mid - top) / (bottom - top)));
          km = sp.from + (sp.to - sp.from) * t;
          span = sp;
          break;
        }
        if (mid >= bottom) { km = sp.to; span = sp; }
      }
      const firstOpener = $('#day1'), ledger = $('#ledger');
      const inDays = firstOpener && mid >= firstOpener.offsetTop &&
                     (!ledger || mid < ledger.offsetTop);
      if (collar && mid < collar.offsetTop) { km = 0; span = spans[0]; }

      if (Math.abs(km - lastKm) < 0.05) return;
      lastKm = km;

      const m = elAt(km), near = nearest(km);
      elevOut.textContent = elev(m);
      whereOut.textContent = `${near.name} · day ${span.day.n}`;
      zoneOut.textContent = span.zone;
      swatch.style.background = zoneColor(span.zone);
      paintPage(inDays ? zoneKey(span.zone) : null);
      mark.setAttribute('transform',
        `translate(${X(km).toFixed(1)},${Y(m).toFixed(1)})`);
    };

    /* One frame in flight at a time. requestAnimationFrame is suspended while
       the tab is hidden, so re-sync on the way back in. */
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
    update();
  }

  /* ── ledger ─────────────────────────────────────────────────── */
  function renderLedger() {
    const { gain, loss } = totals(), f = TRIP.facts;
    const rows = [
      [f.summitElevation,     'highest point',                v => comma(toUnit(v))],
      [gain,                  'total ascent',                 v => '+' + comma(toUnit(v))],
      [loss,                  'total descent',                v => '−' + comma(toUnit(v))],
      [f.distanceKm,          'distance walked',              dist],
      [f.highestSleep,        'highest camp',                 v => comma(toUnit(v))],
      [f.nightsOnMountain,    'nights on the mountain',       String],
      [11,                    'hours from 3 am to the summit', String],
      [19,                    'hours in the longest day',     String],
      [f.summitSpo2,          'lowest blood oxygen',          v => v + '%'],
      [1,                     'camp skipped',                 String],
      [5,                     'climate zones crossed',        String],
      ['~49%',                'of sea-level oxygen up there', String],
    ];
    $('#ledgerGrid').innerHTML = rows.map(([, lbl]) => `<div><b></b><span>${lbl}</span></div>`).join('');
    $$('#ledgerGrid b').forEach((b, i) => reg(b, rows[i][0], rows[i][2]));
  }

  /* ── photo plates ───────────────────────────────────────────── */
  const FULL = 'assets/photos/full/', THUMB = 'assets/photos/thumb/';
  let lbSet = [], lbIdx = 0;

  const roman = n => {
    const map = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let out = '';
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  };

  async function renderGalleries() {
    let photos = [];
    try { photos = await (await fetch('data/photos.json')).json(); }
    catch { return; }                       // opened via file://, plates stay empty

    const byDate = photos.reduce((a, p) => ((a[p.date] ??= []).push(p), a), {});

    $$('.gallery').forEach(host => {
      const list = byDate[host.dataset.date];
      if (!list || !list.length) return;

      const FIRST = 6;
      host.innerHTML = `<h3>Plates · ${list.length} frame${list.length > 1 ? 's' : ''} from this day</h3>
        <div class="plates"></div>
        ${list.length > FIRST ? `<button class="more">Show all ${list.length}</button>` : ''}`;
      const grid = $('.plates', host);

      const tile = (p, i) => {
        const fig = document.createElement('button');
        fig.className = 'plate';
        fig.innerHTML = `<img loading="lazy" src="${THUMB + p.file}" alt="Photograph taken at ${fmtTime(p.time)}">
          <figcaption>Pl. ${roman(i + 1)} · ${fmtTime(p.time)}</figcaption>`;
        const img = $('img', fig);
        img.addEventListener('load', () => img.classList.add('loaded'));
        if (img.complete) img.classList.add('loaded');
        fig.addEventListener('click', () => openLightbox(list, i));
        return fig;
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
    lbSet = set; lbIdx = i; paintLightbox();
    lb.hidden = false; document.body.style.overflow = 'hidden';
  }
  function paintLightbox() {
    const p = lbSet[lbIdx];
    lbImg.src = FULL + p.file;
    lbImg.alt = `Photograph taken at ${fmtTime(p.time)} on ${p.date}`;
    lbCap.textContent = `${fmtDate(p.date)} · ${fmtTime(p.time)} · ${lbIdx + 1} of ${lbSet.length}`;
  }
  const step = d => { lbIdx = (lbIdx + d + lbSet.length) % lbSet.length; paintLightbox(); };
  const closeLightbox = () => { lb.hidden = true; lbImg.src = ''; document.body.style.overflow = ''; };

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

  /* ── boot ───────────────────────────────────────────────────── */
  wireUnits(document);
  renderCover();
  renderRail();
  renderDays();
  renderProfile();
  renderOxygen();
  renderLedger();
  renderGalleries();
  renderHud();

  $('#unitToggle').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.unit === unit) return;
    unit = b.dataset.unit;
    $$('#unitToggle button').forEach(x => x.classList.toggle('on', x === b));
    repaint();
  });
})();
