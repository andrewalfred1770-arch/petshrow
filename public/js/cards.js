/**
 * Petshrow — Cards & Flyers module  (light-theme SVG)
 * Auto-grid imposition with bleed zones and gutter crop-mark lanes.
 * All dimensions in millimetres.
 */
window.PETSHROW = window.PETSHROW || {};

(function () {

  const CARD_PRESETS = [
    { id:'bc-std',    name:'كارت عمل قياسي', w:9,    h:5    },
    { id:'bc-eu',     name:'كارت EU',         w:8.5,  h:5.5  },
    { id:'bc-square', name:'كارت مربع',       w:5.5,  h:5.5  },
    { id:'postcard',  name:'بوستكارد A6',     w:14.8, h:10.5 },
    { id:'dl',        name:'DL (تليفون)',     w:9.9,  h:21   },
    { id:'a5-fly',    name:'فلاير A5',        w:14.8, h:21   },
    { id:'a4-fly',    name:'فلاير A4',        w:21,   h:29.7 },
    { id:'custom',    name:'مقاس مخصص',       w:0,    h:0    },
  ];

  function imposeCards(cardW, cardH, bleed, gutter, sheetW, sheetH) {
    function fit(cw, ch) {
      const cellW = cw + 2 * bleed + gutter;
      const cellH = ch + 2 * bleed + gutter;
      const cols = Math.max(0, Math.floor((sheetW + gutter) / cellW));
      const rows = Math.max(0, Math.floor((sheetH + gutter) / cellH));
      return { cols, rows, perSheet: cols * rows };
    }
    const p = fit(cardW, cardH), r = fit(cardH, cardW);
    if (p.perSheet >= r.perSheet) return { ...p, rotated: false };
    return { ...r, rotated: true };
  }

  function calculateCardJob(input) {
    const qty      = Math.max(0, +input.qty    || 0);
    const cardW    = +input.cardW  || 90;
    const cardH    = +input.cardH  || 50;
    const bleed    = +input.bleed  || 3;
    const gutter   = +input.gutter || 5;
    const sheet    = input.sheet   || { w:600, h:900 };
    const wastePct = Number.isFinite(+input.wastePct) ? +input.wastePct : 5;
    const sides    = +input.sides  || 2;

    const impose      = imposeCards(cardW, cardH, bleed, gutter, sheet.w, sheet.h);
    const baseSheets  = impose.perSheet > 0 ? Math.ceil(qty / impose.perSheet) : 0;
    const wasteSheets = Math.ceil(baseSheets * wastePct / 100);
    const totalSheets = (baseSheets + wasteSheets) * sides;

    const errors = [];
    if (impose.perSheet === 0) errors.push('مقاس الكارت لا يدخل على الفرخ — راجع المقاسات.');

    return { input:{ qty, cardW, cardH, bleed, gutter, sheet, wastePct, sides },
             impose, sheets:{ baseSheets, wasteSheets, totalSheets, sides }, errors };
  }

  /**
   * Imposition SVG — technical print-layout style.
   * Auto-scales for dense card grids; realistic crop marks on all corners.
   */
  function renderCardsSVG(result) {
    const { impose, input } = result;
    const { cardW, cardH, bleed, gutter, sheet } = input;
    const sw = sheet.w, sh = sheet.h;
    const rotated = impose.rotated;
    const cw = rotated ? cardH : cardW;
    const ch = rotated ? cardW : cardH;
    const cellW = cw + 2 * bleed + gutter;
    const cellH = ch + 2 * bleed + gutter;
    const pad = 10;

    // ── Smart scale for dense grids ────────────────────────────────────
    const cellMin   = Math.min(cellW || 1, cellH || 1);
    const rawScale  = 3.0 / cellMin;
    const drawScale = Math.max(1.0, Math.min(6.0, rawScale));

    const dSW    = sw    * drawScale;
    const dSH    = sh    * drawScale;
    const dCellW = cellW * drawScale;
    const dCellH = cellH * drawScale;
    const dBl    = bleed * drawScale;
    const dCW    = cw    * drawScale;
    const dCH    = ch    * drawScale;

    const headerFs = Math.max(0.75, Math.min(dSW, dSH) * 0.022);
    const numFs    = Math.max(0.3,  Math.min(dCW, dCH) / 5.5);
    const tickLen  = bleed > 0 ? dBl * 0.6 : 0;

    const cells = [];
    for (let r = 0; r < impose.rows; r++) {
      for (let c = 0; c < impose.cols; c++) {
        const bx  = pad + c * dCellW;
        const by  = pad + r * dCellH;
        const idx = r * impose.cols + c + 1;
        const px1 = bx + dBl, py1 = by + dBl;
        const px2 = px1 + dCW, py2 = py1 + dCH;

        // Bleed zone — very faint dashed
        if (bleed > 0) {
          cells.push(
            `<rect x="${bx}" y="${by}" width="${dCW+2*dBl}" height="${dCH+2*dBl}"
              fill="rgba(239,68,68,.02)" stroke="rgba(220,38,38,.16)"
              stroke-dasharray="0.7 0.55" stroke-width="0.17" rx="0.17"/>`);
        }

        // Card trim — crisp white, hairline border
        cells.push(
          `<rect x="${px1}" y="${py1}" width="${dCW}" height="${dCH}"
            fill="white" stroke="#c8d4e0" stroke-width="0.2" rx="0.14"/>`);

        // Crop marks at all four trim corners
        if (tickLen > 0) {
          const tk = `stroke="#e04040" stroke-width="0.15" opacity="0.36"`;
          cells.push(`
            <line x1="${bx}" y1="${py1}" x2="${bx+tickLen}" y2="${py1}" ${tk}/>
            <line x1="${px1}" y1="${by}" x2="${px1}" y2="${by+tickLen}" ${tk}/>
            <line x1="${px2+dBl-tickLen}" y1="${py1}" x2="${px2+dBl}" y2="${py1}" ${tk}/>
            <line x1="${px2}" y1="${by}" x2="${px2}" y2="${by+tickLen}" ${tk}/>
            <line x1="${bx}" y1="${py2}" x2="${bx+tickLen}" y2="${py2}" ${tk}/>
            <line x1="${px1}" y1="${py2+dBl-tickLen}" x2="${px1}" y2="${py2+dBl}" ${tk}/>
            <line x1="${px2+dBl-tickLen}" y1="${py2}" x2="${px2+dBl}" y2="${py2}" ${tk}/>
            <line x1="${px2}" y1="${py2+dBl-tickLen}" x2="${px2}" y2="${py2+dBl}" ${tk}/>`);
        }

        // Centre registration cross — barely visible
        const ccx = px1 + dCW / 2, ccy = py1 + dCH / 2;
        const arm = Math.min(dCW, dCH) * 0.05;
        if (arm > 0.1) {
          cells.push(`
            <line x1="${ccx-arm}" y1="${ccy}" x2="${ccx+arm}" y2="${ccy}"
              stroke="#e2e8f0" stroke-width="0.13"/>
            <line x1="${ccx}" y1="${ccy-arm}" x2="${ccx}" y2="${ccy+arm}"
              stroke="#e2e8f0" stroke-width="0.13"/>`);
        }

        // Index number — very small, very light
        cells.push(
          `<text x="${ccx}" y="${ccy}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="${numFs}" fill="#b8c8d8" font-weight="300"
            font-family="monospace">${idx}</text>`);
      }
    }

    const rotLabel = rotated ? ' · مقلوب' : '';
    return `
      <svg viewBox="0 0 ${dSW+pad*2} ${dSH+pad*2}" width="100%" preserveAspectRatio="xMidYMid meet">
        <!-- Paper shadow -->
        <rect x="${pad+0.45}" y="${pad+0.45}" width="${dSW}" height="${dSH}"
              fill="rgba(0,0,0,0.028)" rx="1"/>
        <!-- Sheet — white paper -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="white" stroke="#dde3ec" stroke-width="0.32" rx="0.8"/>
        ${cells.join('')}
        <!-- Sheet border overlay -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="none" stroke="#94a3b8" stroke-width="0.24" rx="0.8"/>
        <!-- Info label -->
        <text x="${pad}" y="${pad-headerFs*0.45}" font-size="${headerFs}"
              fill="#94a3b8" direction="ltr" font-family="monospace" font-weight="400">
          ${impose.cols}×${impose.rows} = ${impose.perSheet}/فرخ · ${cardW}×${cardH}سم${rotLabel}${bleed > 0 ? ` · ${bleed}سم نزيف` : ''}
        </text>
      </svg>`;
  }

  window.PETSHROW.CARD_PRESETS         = CARD_PRESETS;
  window.PETSHROW.imposeCards          = imposeCards;
  window.PETSHROW.calculateCardJob     = calculateCardJob;
  window.PETSHROW.renderCardsSVG       = renderCardsSVG;
})();
