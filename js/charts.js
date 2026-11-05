/* Comeback: platte SVG-grafieken (geen externe library, werkt offline).
 * Kleuren komen uit CSS-variabelen, zodat light en dark mode vanzelf kloppen. */
window.Charts = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r1 = n => Math.round(n * 10) / 10;

  /* Staafgrafiek met smalle, platte staven; de geselecteerde staaf krijgt --accent */
  function bars(data, { selected = data.length - 1, height = 170, action = 'bar-select' } = {}) {
    const W = 320, H = height, top = 24, bottom = 22, chartH = H - top - bottom;
    const max = Math.max(4, ...data.map(d => d.value));
    const n = data.length, slot = W / n, bw = Math.min(14, slot * 0.4);
    let body = '';
    [0, 0.5, 1].forEach(g => { const y = r1(top + chartH * g); body += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="c-grid"/>`; });
    data.forEach((d, i) => {
      const cx = slot * i + slot / 2;
      const h = d.value ? Math.max(4, (d.value / max) * chartH) : 2;
      const y = top + chartH - h;
      const sel = i === selected;
      body += `<g class="c-bar" ${action ? `data-action="${action}" data-i="${i}"` : ''}>
        <rect x="${r1(cx - slot / 2)}" y="0" width="${r1(slot)}" height="${H}" fill="transparent"/>
        <rect x="${r1(cx - bw / 2)}" y="${r1(y)}" width="${r1(bw)}" height="${r1(h)}" rx="${r1(Math.min(bw / 2, 4))}" style="fill:${sel ? 'var(--accent)' : 'var(--bar)'}"/>
        ${sel ? `<text x="${r1(cx)}" y="${r1(y - 7)}" class="c-val" text-anchor="middle">${d.value}</text>` : ''}
        <text x="${r1(cx)}" y="${H - 5}" class="c-lbl${sel ? ' on' : ''}" text-anchor="middle">${esc(d.label)}</text>
      </g>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Staafgrafiek">${body}</svg>`;
  }

  /* Pad door punten; step = trapjes (voor scores), anders vloeiend */
  function path(pts, step) {
    if (!pts.length) return '';
    let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i], [px, py] = pts[i - 1];
      if (step) d += `H${r1((px + x) / 2)}V${r1(y)}H${r1(x)}`;
      else {
        const mx = (px + x) / 2;
        d += `C${r1(mx)},${r1(py)} ${r1(mx)},${r1(y)} ${r1(x)},${r1(y)}`;
      }
    }
    return d;
  }

  /* Lijngrafiek; values mogen null bevatten (dan wordt de lijn onderbroken).
   warnAbove: punten boven die grens (bv. de pijngrens) krijgen --warning */
  function line({ labels, series, yMin = 0, yMax = 10, ticks = [0, 5, 10], height = 170, xTicks = 4, step = false, warnAbove = null }) {
    const W = 320, H = height, L = 26, R = 8, T = 10, B = 22;
    const cw = W - L - R, ch = H - T - B, n = labels.length;
    const x = i => L + (n <= 1 ? cw / 2 : (cw * i) / (n - 1));
    const y = v => T + ch - ((v - yMin) / ((yMax - yMin) || 1)) * ch;
    let out = '';
    ticks.forEach(t => {
      const yy = r1(y(t));
      // De afgesproken grens als dunne stippellijn
      out += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="${warnAbove != null && t === warnAbove ? 'c-limit' : 'c-grid'}"/><text x="${L - 8}" y="${yy + 3.5}" class="c-axis" text-anchor="end">${esc(t)}</text>`;
    });
    const idx = new Set();
    const k = Math.min(xTicks, n);
    for (let j = 0; j < k; j++) idx.add(Math.round((j * (n - 1)) / Math.max(1, k - 1)));
    idx.forEach(i => { out += `<text x="${r1(x(i))}" y="${H - 4}" class="c-axis" text-anchor="middle">${esc(labels[i])}</text>`; });
    series.forEach(s => {
      const segs = []; let cur = [];
      s.values.forEach((v, i) => {
        if (v === null || v === undefined) { if (cur.length) segs.push(cur); cur = []; }
        else cur.push([x(i), y(v), i]);
      });
      if (cur.length) segs.push(cur);
      const last = lastIndex(s.values);
      segs.forEach(seg => {
        if (seg.length > 1) out += `<path d="${path(seg, step)}" fill="none" style="stroke:${s.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        seg.forEach(p => {
          const over = warnAbove != null && s.values[p[2]] > warnAbove;
          if (over) out += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.5" class="c-warn"/>`;
          else if (p[2] === last || seg.length === 1) out += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.5" style="fill:${s.color}"/>`;
        });
      });
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Lijngrafiek">${out}</svg>`;
  }

  /* Kleine trendlijn zonder assen */
  function spark(series, { height = 36, yMin = 0, yMax = 10, step = true } = {}) {
    const W = 120, H = height, n = Math.max(...series.map(s => s.values.length));
    const x = i => n <= 1 ? W / 2 : (W * i) / (n - 1);
    const y = v => 3 + (H - 6) - ((v - yMin) / ((yMax - yMin) || 1)) * (H - 6);
    let out = '';
    series.forEach(s => {
      const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
      if (pts.length > 1) out += `<path d="${path(pts, step)}" fill="none" style="stroke:${s.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (pts.length) out += `<circle cx="${r1(pts[pts.length - 1][0])}" cy="${r1(pts[pts.length - 1][1])}" r="2.5" style="fill:${s.color}"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" preserveAspectRatio="none" style="height:${H}px" aria-hidden="true">${out}</svg>`;
  }

  /* Halve meter (gauge) */
  function gauge(done, total) {
    const W = 240, H = 130, cx = 120, cy = 120, r = 100;
    const len = Math.PI * r;
    const frac = total ? Math.min(1, done / total) : 0;
    let ticks = '';
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI + (Math.PI * i) / 20;
      const r1o = r + 12, r1i = r + (i % 5 === 0 ? 5 : 8);
      ticks += `<line x1="${r1(cx + r1i * Math.cos(a))}" y1="${r1(cy + r1i * Math.sin(a))}" x2="${r1(cx + r1o * Math.cos(a))}" y2="${r1(cy + r1o * Math.sin(a))}" class="c-grid" stroke-width="1"/>`;
    }
    const arc = `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`;
    return `<svg viewBox="-6 -14 ${W + 12} ${H + 14}" class="chart-svg" role="img" aria-label="${done} van ${total}">
      ${ticks}
      <path d="${arc}" fill="none" class="c-track" stroke-width="10" stroke-linecap="butt"/>
      <path d="${arc}" fill="none" class="c-prog" stroke-width="10" stroke-linecap="butt" stroke-dasharray="${r1(len)}" stroke-dashoffset="${r1(len * (1 - frac))}"/>
    </svg>`;
  }

  function lastIndex(values) {
    for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null && values[i] !== undefined) return i;
    return -1;
  }

  return { bars, line, spark, gauge };
})();
