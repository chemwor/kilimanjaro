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
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });

  /* Times are stored 24-hour (sortable, easy to edit) and shown as am/pm. */
  const fmtTime = t => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
    if (!m) return t;
    const h24 = +m[1];
    return `${h24 % 12 || 12}:${m[2]} ${h24 < 12 ? 'am' : 'pm'}`;
  };

  const pad2 = n => String(n).padStart(2, '0');
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

      const sec = document.createElement('section');
      sec.className = 'sheet-block day' + (day.summit ? ' is-summit' : '');
      sec.id = 'day' + day.n;

      const logbook = day.points.length ? `
        <table class="logbook">
          <tr><th></th><th>Station</th><th style="text-align:right">Elev.</th></tr>
          ${day.points.map(p => {
            const cls = [p.camp && 'is-camp', p.peak && 'is-peak',
                         p.summit && 'is-summit', p.skipped && 'is-skipped']
                        .filter(Boolean).join(' ');
            return `<tr class="${cls}">
              <td class="sym">${symbolFor(p)}</td>
              <td><span class="nm">${p.name}</span><span class="nt">${p.note}</span></td>
              <td class="el" data-m="${p.m}"></td>
            </tr>`;
          }).join('')}
        </table>` : '';

      const paras = (Array.isArray(day.blurb) ? day.blurb : [day.blurb])
        .map(p => `<p>${p}</p>`).join('');

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
              <b>${m.title}</b><span>${m.text}</span></li>`).join('')}
          </ul>
        </div>` : '';

      sec.innerHTML = `
        <div class="sheet-head">
          <span class="stamp">Day ${pad2(day.n)}</span>
          <span class="head-meta">${fmtDate(day.date)}</span>
          <span class="head-zone">${day.zone}</span>
        </div>
        <div class="entry-body">
          <div class="entry-main">
            <h2>${day.label}</h2>
            <p class="leg"><b>${day.from}</b> <span class="arrow">→</span> <b>${day.to}</b></p>
            <div class="prose">${paras}</div>
            ${day.highlight ? `<p class="pull">${day.highlight}</p>` : ''}
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

      $$('.logbook .el[data-m]', sec).forEach(n => reg(n, +n.dataset.m, v => comma(toUnit(v)) + ' ' + unit));
      $$('.panel dd[data-log]', sec).forEach(n => {
        const row = log[+n.dataset.log];
        reg(n, row[2], row[3]);
      });
    });
  }

  /* ── elevation profile ──────────────────────────────────────── */
  function renderProfile() {
    const pts = [];
    TRIP.days.forEach(d => d.points.forEach(p => {
      const last = pts[pts.length - 1];
      if (last && last.km === p.km && last.m === p.m) return;   // same camp, two days
      pts.push({ ...p, day: d.n });
    }));
    if (!pts.length) return;

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

    const summitDay = TRIP.days.find(d => d.summit);
    let band = '';
    if (summitDay) {
      const kms = summitDay.points.map(p => p.km);
      const x0 = X(Math.min(...kms)), x1 = X(Math.max(...kms));
      band = `<rect class="band-summit" x="${x0}" y="${M.t}" width="${x1 - x0}" height="${ih}"/>
              <text class="band-label" x="${(x0 + x1) / 2}" y="${M.t - 32}" text-anchor="middle">summit push</text>`;
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

    // Label placement: above on peaks, below in troughs, then push apart.
    const LBL_H = 25, halfW = n => Math.max(32, n.length * 3.1);
    const floorY = M.t + ih - 4, placed = [];
    const labels = pts.map((p, i) => {
      const before = pts[i - 1] ? pts[i - 1].m : p.m, after = pts[i + 1] ? pts[i + 1].m : p.m;
      const x = X(p.km), y = Y(p.m);

      /* Try the natural side (above on peaks, below in troughs). If pushing it
         clear of its neighbours would run it off the plot, use the other side. */
      const resolve = up => {
        let ly = up ? y - 18 : y + 26;
        for (let g = 0; g < 8; g++) {
          if (!placed.some(q => Math.abs(q.x - x) < halfW(p.name) + q.hw && Math.abs(q.ly - ly) < LBL_H)) break;
          ly += up ? -LBL_H : LBL_H;
        }
        return ly;
      };
      const fits = (ly, up) => up ? ly - 12 > M.t - 26 : ly + 12 < floorY;

      let above = p.m >= (before + after) / 2;
      let ly = resolve(above);
      if (!fits(ly, above)) {
        const alt = resolve(!above);
        if (fits(alt, !above)) { above = !above; ly = alt; }
      }
      placed.push({ x, ly, hw: halfW(p.name) });
      return { x, y, ly, anchor: x > W - 120 ? 'end' : x < M.l + 46 ? 'start' : 'middle' };
    });

    const colour = p => p.summit ? '#8c3a2b' : p.peak ? '#a68a6d'
                      : p.camp ? '#3d5f73' : p.skipped ? '#efe9dc' : '#9b937f';
    const dots = pts.map((p, i) => {
      const { x, y, ly, anchor } = labels[i];
      const c = colour(p), r = p.summit ? 6 : (p.camp || p.peak) ? 5 : 3.4;
      return `<g class="pt" data-i="${i}">
        <circle cx="${x}" cy="${y}" r="${r}" fill="${c}"
          stroke="${p.skipped ? '#9b937f' : c}" stroke-width="${p.skipped ? 1.4 : 0}"
          ${p.skipped ? 'stroke-dasharray="2.5 2"' : ''}/>
        ${p.summit ? `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#8c3a2b" stroke-width="1"/>` : ''}
        <text class="pt-label" x="${x}" y="${ly}" text-anchor="${anchor}">${p.name}</text>
        <text class="pt-elev" x="${x}" y="${ly + 12}" text-anchor="${anchor}" data-m="${p.m}"></text>
      </g>`;
    }).join('');

    $('#profile-chart').innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="Elevation profile of the seven-day Lemosho route">
        <defs>
          <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#22201b" stroke-width=".7" opacity=".2"/>
          </pattern>
        </defs>
        ${band}${grid}
        <path class="track-fill" d="${area}"/>
        <path class="track" d="${line}"/>
        ${dots}${strip}${ticks}
        <line class="ax-line" x1="${M.l}" y1="${M.t + ih}" x2="${W - M.r}" y2="${M.t + ih}"
              stroke="#22201b" stroke-width="1.2"/>
      </svg>`;

    $$('#profile-chart .pt-elev').forEach(n => reg(n, +n.dataset.m, v => comma(toUnit(v))));
    $$('#profile-chart [data-gridm]').forEach(n => reg(n, +n.dataset.gridm, v => comma(toUnit(v))));

    attachTip($('#profile .chart-holder'), '#profile-chart .pt', i => {
      const p = pts[i];
      return {
        html: `<b>${p.name}</b><span class="tip-el">${elev(p.m)} · ${dist(p.km)} in · day ${p.day}</span>
               <p>${p.note}</p>`,
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

    const zones = [[90, 100, '#5f7a55', 'normal'], [80, 90, '#9a8f5f', 'hypoxemia'],
                   [60, 80, '#a68a6d', 'severe'], [lo, 60, '#8c3a2b', 'critical']];
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
          <circle cx="${x}" cy="${y}" r="5.5" fill="#efe9dc" stroke="#22201b" stroke-width="1.8"/>
          <text class="ox-val" x="${x}" y="${y - 15}" text-anchor="middle">${d.spo2}%</text></g>`;
      if (d.spo2Low) {
        const yl = Y(d.spo2Low);
        drop += `<line x1="${x}" y1="${y}" x2="${x}" y2="${yl}" stroke="#8c3a2b"
                   stroke-width="1.4" stroke-dasharray="3 3"/>
                 <g class="ox-pt" data-day="${d.n}">
                   <circle cx="${x}" cy="${yl}" r="6.5" fill="#8c3a2b"/>
                   <circle cx="${x}" cy="${yl}" r="11" fill="none" stroke="#8c3a2b" stroke-width="1"/>
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
        <path d="${line}" fill="none" stroke="#22201b" stroke-width="1.8"
              stroke-linejoin="round" stroke-linecap="round"/>
        ${drop}${dots}${ticks}
        <line class="ax-line" x1="${M.l}" y1="${M.t + ih}" x2="${M.l + iw}" y2="${M.t + ih}"
              stroke="#22201b" stroke-width="1.2"/>
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
  renderRail();
  renderDays();
  renderProfile();
  renderOxygen();
  renderLedger();
  renderGalleries();

  $('#unitToggle').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.unit === unit) return;
    unit = b.dataset.unit;
    $$('#unitToggle button').forEach(x => x.classList.toggle('on', x === b));
    repaint();
  });
})();
