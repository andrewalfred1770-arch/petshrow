/**
 * Petshrow — Stickers, Labels & Misc module  (light-theme SVG)
 * Types: sheet-labels · roll-labels · tickets
 * All dimensions in millimetres.
 */
window.PETSHROW = window.PETSHROW || {};

(function () {

  const STICKER_TYPES = {
    'sheet-labels': 'استيكرات على أفرخ',
    'roll-labels':  'استيكرات رول',
    'tickets':      'تيكتات (كتيّبات)',
  };

  // ── Sheet labels ──────────────────────────────────────────────────────────
  function calculateSheetLabels(input) {
    const qty      = Math.max(0, +input.qty    || 0);
    const lw       = +input.labelW || 0;
    const lh       = +input.labelH || 0;
    const bleed    = +input.bleed  || 1;
    const gap      = +input.gap    || 3;
    const sheet    = input.sheet   || { w:600, h:900 };
    const wastePct = Number.isFinite(+input.wastePct) ? +input.wastePct : 5;

    const cellW    = lw + 2*bleed + gap;
    const cellH    = lh + 2*bleed + gap;
    const cols     = Math.max(0, Math.floor((sheet.w + gap) / cellW));
    const rows     = Math.max(0, Math.floor((sheet.h + gap) / cellH));
    const perSheet = cols * rows;

    const baseSheets  = perSheet > 0 ? Math.ceil(qty / perSheet) : 0;
    const wasteSheets = Math.ceil(baseSheets * wastePct / 100);
    const totalSheets = baseSheets + wasteSheets;

    const errors = [];
    if (perSheet === 0) errors.push('الملصق أكبر من الفرخ — غيّر المقاسات.');

    return { type:'sheet-labels', input:{ qty, lw, lh, bleed, gap, sheet, wastePct },
             impose:{ cols, rows, perSheet }, sheets:{ baseSheets, wasteSheets, totalSheets }, errors };
  }

  // ── Roll labels ────────────────────────────────────────────────────────────
  function calculateRollLabels(input) {
    const qty      = Math.max(0, +input.qty     || 0);
    const lw       = +input.labelW || 0;
    const lh       = +input.labelH || 0;
    const gap      = +input.gap    || 3;
    const rollW    = +input.rollWidth || 0;
    const wastePct = Number.isFinite(+input.wastePct) ? +input.wastePct : 5;

    const labelsAcross = rollW > 0 && lh > 0 ? Math.max(0, Math.floor((rollW+gap)/(lh+gap))) : 0;
    const labelsRows   = labelsAcross > 0 ? Math.ceil(qty / labelsAcross) : 0;
    const lengthMm     = labelsRows * (lw + gap);
    const baseLenM     = lengthMm / 1000;
    const wasteLenM    = baseLenM * wastePct / 100;
    const totalLenM    = Math.ceil((baseLenM + wasteLenM) * 10) / 10;

    const errors = [];
    if (labelsAcross === 0) errors.push('تأكد من إدخال عرض الرول وارتفاع الملصق.');

    return { type:'roll-labels', input:{ qty, lw, lh, gap, rollWidth:rollW, wastePct },
             layout:{ labelsAcross, labelsRows },
             roll:{ baseLenM:+baseLenM.toFixed(2), wasteLenM:+wasteLenM.toFixed(2), totalLenM }, errors };
  }

  // ── Tickets / Pads ─────────────────────────────────────────────────────────
  function calculateTickets(input) {
    const totalQty     = Math.max(0, +input.qty       || 0);
    const leavesPerPad = Math.max(1, +input.padSize   || 50);
    const ticketW      = +input.ticketW || 100;
    const ticketH      = +input.ticketH || 50;
    const colors       = +input.colors  || 2;
    const sheet        = input.sheet    || { w:600, h:900 };
    const bleed        = +input.bleed   || 0;
    const gap          = +input.gap     || 3;
    const wastePct     = Number.isFinite(+input.wastePct) ? +input.wastePct : 10;

    const cellW    = ticketW + 2*bleed + gap;
    const cellH    = ticketH + 2*bleed + gap;
    const cols     = Math.max(0, Math.floor((sheet.w + gap) / cellW));
    const rows     = Math.max(0, Math.floor((sheet.h + gap) / cellH));
    const perSheet = cols * rows;

    const totalPads    = Math.ceil(totalQty / leavesPerPad);
    const totalLeaves  = totalPads * leavesPerPad * colors;
    const baseSheets   = perSheet > 0 ? Math.ceil(totalLeaves / perSheet) : 0;
    const wasteSheets  = Math.ceil(baseSheets * wastePct / 100);
    const totalSheets  = baseSheets + wasteSheets;

    const errors = [];
    if (perSheet === 0) errors.push('مقاس التيكت لا يدخل على الفرخ.');

    return { type:'tickets', input:{ qty:totalQty, leavesPerPad, ticketW, ticketH, colors, sheet, bleed, gap, wastePct },
             impose:{ cols, rows, perSheet }, pads:{ totalPads, totalLeaves },
             sheets:{ baseSheets, wasteSheets, totalSheets }, errors };
  }

  /**
   * Imposition SVG for sheet labels and tickets — technical flat style.
   * Auto-scales for dense grids; realistic gutter/bleed visualization.
   */
  function renderStickerSVG(result) {
    const sheet  = result.input.sheet || { w:600, h:900 };
    const impose = result.impose;
    if (!impose) return '';

    const lw    = result.input.lw    || result.input.ticketW || 90;
    const lh    = result.input.lh    || result.input.ticketH || 50;
    const bleed = result.input.bleed || 0;
    const gap   = result.input.gap   || 3;
    const pad   = 9;
    const cellW = lw + 2*bleed + gap;
    const cellH = lh + 2*bleed + gap;

    // ── Smart scale for dense grids ────────────────────────────────────
    const cellMin   = Math.min(cellW || 1, cellH || 1);
    const rawScale  = 3.0 / cellMin;
    const drawScale = Math.max(1.0, Math.min(6.0, rawScale));

    const dSW    = sheet.w * drawScale;
    const dSH    = sheet.h * drawScale;
    const dCellW = cellW   * drawScale;
    const dCellH = cellH   * drawScale;
    const dLW    = lw      * drawScale;
    const dLH    = lh      * drawScale;
    const dBl    = bleed   * drawScale;

    const headerFs = Math.max(0.75, Math.min(dSW, dSH) * 0.022);
    const numFs    = Math.max(0.3,  Math.min(dLW, dLH) / 5.5);

    const cells = [];
    for (let r = 0; r < impose.rows; r++) {
      for (let c = 0; c < impose.cols; c++) {
        const bx  = pad + c * dCellW;
        const by  = pad + r * dCellH;
        const px1 = bx + dBl, py1 = by + dBl;
        const idx = r * impose.cols + c + 1;

        // Bleed zone — very faint
        if (bleed > 0) {
          cells.push(
            `<rect x="${bx}" y="${by}" width="${dLW+2*dBl}" height="${dLH+2*dBl}"
              fill="rgba(239,68,68,.025)" stroke="rgba(220,38,38,.18)"
              stroke-dasharray="0.7 0.55" stroke-width="0.18" rx="0.18"/>`);
        }

        // Label trim — light purple tint, thin border
        cells.push(
          `<rect x="${px1}" y="${py1}" width="${dLW}" height="${dLH}"
            fill="rgba(124,58,237,.06)" stroke="#8b5cf6" stroke-width="0.28" rx="0.4"/>`);

        // Index number — small, light
        cells.push(
          `<text x="${px1+dLW/2}" y="${py1+dLH/2}" text-anchor="middle"
            dominant-baseline="middle" font-size="${numFs}"
            fill="#7c3aed" font-weight="400" opacity="0.5">${idx}</text>`);
      }
    }

    return `
      <svg viewBox="0 0 ${dSW+pad*2} ${dSH+pad*2}" width="100%" preserveAspectRatio="xMidYMid meet">
        <!-- Paper shadow -->
        <rect x="${pad+0.45}" y="${pad+0.45}" width="${dSW}" height="${dSH}"
              fill="rgba(0,0,0,0.028)" rx="1"/>
        <!-- Sheet — white paper -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="white" stroke="#dde3ec" stroke-width="0.35" rx="0.8"/>
        ${cells.join('')}
        <!-- Sheet border overlay -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="none" stroke="#94a3b8" stroke-width="0.24" rx="0.8"/>
        <!-- Info label -->
        <text x="${pad}" y="${pad-headerFs*0.45}" font-size="${headerFs}"
              fill="#94a3b8" direction="ltr" font-family="monospace" font-weight="400">
          ${impose.cols}×${impose.rows} = ${impose.perSheet}/فرخ · ${lw}×${lh}سم
        </text>
      </svg>`;
  }

  window.PETSHROW.STICKER_TYPES        = STICKER_TYPES;
  window.PETSHROW.calculateSheetLabels = calculateSheetLabels;
  window.PETSHROW.calculateRollLabels  = calculateRollLabels;
  window.PETSHROW.calculateTickets     = calculateTickets;
  window.PETSHROW.renderStickerSVG     = renderStickerSVG;
})();
