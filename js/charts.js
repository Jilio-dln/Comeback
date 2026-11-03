/* Comeback: lichte SVG-grafieken (geen externe library nodig, werkt offline).
 * Kleuren komen uit CSS-variabelen, zodat light en dark mode vanzelf kloppen. */
window.Charts = (() => {
  let uid = 0;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const r1 = n => Math.round(n * 10) / 10;

  /* Staafgrafiek met afgeronde "pil"-staven; de geselecteerde staaf krijgt de accentkleur */
  function bars(data, { selected = data.length - 1, height = 190, unit = '', action = 'bar-select', bubble = true } = {}) {
    const W = 320, H = height, top = bubble ? 36 : 8, bottom = 24, chartH = H - top - bottom;
    const max = Math.max(4, ...data.map(d => d.value));
    const n = data.length, slot = W / n, bw = Math.min(30, slot * 0.6);
    const g1 = 'bg' + (++uid), g2 = 'bs' + uid;
    let body = '';
    for (let g = 0; g <= 2; g++) {
      const y = r1(top + chartH * (g / 2));
      body += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="c-grid"/>`;
    }
    data.forEach((d, i) => {
      const cx = slot * i + slot / 2;
      const h = d.value ? Math.max(bw, (d.value / max) * chartH) : 7;
      const y = top + chartH - h;
      const sel = i === selected;
      let bub = '';
      if (sel && bubble) {
        const label = `${d.value}${unit ? ' ' + unit : ''}`;
        const bwid = Math.max(34, label.length * 7 + 16);
        const bx = Math.min(W - bwid, Math.max(0, cx - bwid / 2));
        bub = `<g class="c-bubble"><rect x="${r1(bx)}" y="${r1(y - 30)}" width="${bwid}" height="22" rx="11"/><text x="${r1(bx + bwid / 2)}" y="${r1(y - 15)}" text-anchor="middle">${esc(label)}</text></g>`;
      }
      body += `<g class="c-bar${sel ? ' sel' : ''}" ${action ? `data-action="${action}" data-i="${i}"` : ''}>
        <rect x="${r1(cx - slot / 2)}" y="0" width="${r1(slot)}" height="${H}" fill="transparent"/>
        <rect class="b" x="${r1(cx - bw / 2)}" y="${r1(y)}" width="${r1(bw)}" height="${r1(h)}" rx="${r1(Math.min(bw / 2, h / 2))}" fill="url(#${sel ? g2 : g1})"/>
        ${bub}
        <text x="${r1(cx)}" y="${H - 6}" class="c-lbl${sel ? ' on' : ''}" text-anchor="middle">${esc(d.label)}</text>
      </g>`;
    });
    const defs = `<defs>
      <linearGradient id="${g1}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--bar-1)"/><stop offset="1" style="stop-color:var(--bar-2)"/></linearGradient>
      <linearGradient id="${g2}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--bar-sel-1)"/><stop offset="1" style="stop-color:var(--bar-sel-2)"/></linearGradient>
    </defs>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Staafgrafiek">${defs}${body}</svg>`;
  }

  function smoothPath(pts, yLo, yHi) {
    if (pts.length === 1) return '';
    if (pts.length === 2) return `M${r1(pts[0][0])},${r1(pts[0][1])}L${r1(pts[1][0])},${r1(pts[1][1])}`;
    const cl = v => Math.min(yHi, Math.max(yLo, v));
    let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = cl(p1[1] + (p2[1] - p0[1]) / 6);
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = cl(p2[1] - (p3[1] - p1[1]) / 6);
      d += `C${r1(c1x)},${r1(c1y)} ${r1(c2x)},${r1(c2y)} ${r1(p2[0])},${r1(p2[1])}`;
    }
    return d;
  }

  /* Lijngrafiek; values mogen null bevatten (dan wordt de lijn onderbroken).
   * series[].color is een CSS-kleur of variabele, bv. 'var(--line-1)'. */
  function line({ labels, series, yMin = 0, yMax = 10, ticks = [0, 5, 10], height = 180, xTicks = 4, unit = '' }) {
    const W = 320, H = height, L = 28, R = 10, T = 14, B = 24;
    const cw = W - L - R, ch = H - T - B, n = labels.length;
    const x = i => L + (n <= 1 ? cw / 2 : (cw * i) / (n - 1));
    const y = v => T + ch - ((v - yMin) / ((yMax - yMin) || 1)) * ch;
    let out = '';
    ticks.forEach(t => {
      const yy = r1(y(t));
      out += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="c-grid"/><text x="${L - 8}" y="${yy + 4}" class="c-axis" text-anchor="end">${esc(t)}${unit}</text>`;
    });
    const idx = new Set();
    const k = Math.min(xTicks, n);
    for (let j = 0; j < k; j++) idx.add(Math.round((j * (n - 1)) / Math.max(1, k - 1)));
    idx.forEach(i => { out += `<text x="${r1(x(i))}" y="${H - 6}" class="c-axis" text-anchor="middle">${esc(labels[i])}</text>`; });

    series.forEach((s, si) => {
      const segs = []; let cur = [];
      s.values.forEach((v, i) => {
        if (v === null || v === undefined) { if (cur.length) segs.push(cur); cur = []; }
        else cur.push([x(i), y(v), i]);
      });
      if (cur.length) segs.push(cur);
      const gid = 'lg' + (++uid);
      if (si === 0) out += `<defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:.28"/><stop offset="1" style="stop-color:${s.color};stop-opacity:0"/></linearGradient></defs>`;
      const last = lastIndex(s.values);
      segs.forEach(seg => {
        const d = smoothPath(seg, T, T + ch);
        if (d && si === 0) out += `<path d="${d}L${r1(seg[seg.length - 1][0])},${T + ch}L${r1(seg[0][0])},${T + ch}Z" fill="url(#${gid})"/>`;
        if (d) out += `<path d="${d}" fill="none" style="stroke:${s.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
        seg.forEach(p => {
          const isLast = p[2] === last;
          if (n <= 16 || isLast || seg.length === 1) {
            out += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${isLast ? 4.5 : 3}" style="fill:${isLast ? s.color : 'var(--card-solid)'};stroke:${s.color}" stroke-width="2"/>`;
          }
        });
      });
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="Lijngrafiek">${out}</svg>`;
  }

  function lastIndex(values) {
    for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null && values[i] !== undefined) return i;
    return -1;
  }

  return { bars, line };
})();
