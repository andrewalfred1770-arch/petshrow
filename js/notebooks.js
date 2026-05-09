/**
 * Petshrow — Notebooks / Registers calculation engine  (light-theme SVG)
 *
 * Pipeline:
 *   1. bestImposition — cols×rows of page on sheet (both orientations tried).
 *      Accounts for bleed, gutter, and gripper zone in fit calculation.
 *   2. Signatures — auto-select best valid signature size [4,8,16,32].
 *   3. Sheet count — sheets/sig × sigs/notebook × N + waste %.
 *
 * All dimensions in سم (centimetres).
 */
window.PETSHROW = window.PETSHROW || {};

(function () {

  function bestImposition(pw, ph, sw, sh, opts) {
    opts = opts || {};
    const gripper = Number(opts.gripper) || 0;
    const bleed   = Number(opts.bleed)   || 0;
    const gutter  = Number(opts.gutter)  || 0;
    const usableW = sw;
    const usableH = Math.max(0, sh - gripper);

    function tryOrient(w, h, label) {
      if (!w || !h) return { cols:0, rows:0, perSide:0, orientation:label, usedW:0, usedH:0 };
      // Cell size = page + 2×bleed + gutter gap
      const cellW = w + 2 * bleed + gutter;
      const cellH = h + 2 * bleed + gutter;
      // +gutter in numerator: n cells need (n-1) gutters → floor((total+gap)/cellSize)
      const cols  = Math.max(0, Math.floor((usableW + gutter) / cellW));
      const rows  = Math.max(0, Math.floor((usableH + gutter) / cellH));
      return {
        cols, rows, perSide: cols * rows, orientation: label,
        usedW: cols > 0 ? cols * (w + 2*bleed) + (cols - 1) * gutter : 0,
        usedH: rows > 0 ? rows * (h + 2*bleed) + (rows - 1) * gutter : 0,
      };
    }

    const portrait  = tryOrient(pw, ph, 'portrait');
    const landscape = tryOrient(ph, pw, 'landscape');
    return portrait.perSide >= landscape.perSide ? portrait : landscape;
  }

  function calculateNotebookJob(input) {
    const notebooks        = Math.max(0, Math.floor(Number(input.notebooks)        || 0));
    const pagesPerNotebook = Math.max(0, Math.floor(Number(input.pagesPerNotebook) || 0));
    const page             = input.page  || { w:21, h:29.7 };
    const sheet            = input.sheet || { w:60,  h:90   };
    const wastePctRaw      = Number(input.wastePct);
    const wastePct         = Number.isFinite(wastePctRaw) ? wastePctRaw : 5;
    const gripper          = Number(input.gripper) || 0;
    const bleed            = Number(input.bleed)   || 0;
    const gutter           = Number(input.gutter)  || 0;

    const impose        = bestImposition(page.w, page.h, sheet.w, sheet.h, { gripper, bleed, gutter });
    const pagesPerSide  = impose.perSide;
    const pagesPerSheet = pagesPerSide * 2;

    // Auto-select best standard signature: largest of [4,8,16,32] that fits on one sheet
    const validSigs   = [4, 8, 16, 32];
    const fittingSigs = validSigs.filter(s => s <= pagesPerSheet);
    const signaturePages = fittingSigs.length > 0
      ? fittingSigs[fittingSigs.length - 1]
      : validSigs[0];

    const errors = [];
    if (pagesPerSide === 0)
      errors.push('الصفحة لا تدخل في الفرخ — غيّر المقاس أو الفرخ.');

    const signaturesPerNotebook     = signaturePages > 0 ? Math.ceil(pagesPerNotebook / signaturePages) : 0;
    const paddedPagesPerNotebook    = signaturesPerNotebook * signaturePages;
    const blankPages                = paddedPagesPerNotebook - pagesPerNotebook;
    const sheetsPerSignaturePerCopy = pagesPerSheet > 0 ? Math.ceil(signaturePages / pagesPerSheet) : 0;
    const sheetsPerNotebook         = signaturesPerNotebook * sheetsPerSignaturePerCopy;
    const baseSheets                = sheetsPerNotebook * notebooks;
    const wasteSheets               = Math.ceil(baseSheets * (wastePct / 100));
    const totalSheetsWithWaste      = baseSheets + wasteSheets;

    return {
      input: { notebooks, pagesPerNotebook, page, sheet, wastePct, gripper, bleed, gutter },
      imposition: { cols:impose.cols, rows:impose.rows, perSide:pagesPerSide, perSheet:pagesPerSheet,
                    orientation:impose.orientation, usedW:impose.usedW, usedH:impose.usedH },
      signatures: { sizePages:signaturePages, perNotebook:signaturesPerNotebook,
                    paddedPagesPerNotebook, blankPages },
      sheets: { sheetsPerSignaturePerCopy, sheetsPerNotebook, baseSheets, wasteSheets, totalSheetsWithWaste },
      errors,
    };
  }

  /**
   * Imposition SVG — light professional style, smart auto-scaling for dense grids.
   * Dimensions displayed as H×W (height first) per production convention.
   */
  function renderImpositionSVG(result) {
    const { imposition:imp, input } = result;
    const sw = input.sheet.w, sh = input.sheet.h;
    const pad = 9;

    let pageW = input.page.w, pageH = input.page.h;
    if (imp.orientation === 'landscape') { [pageW, pageH] = [pageH, pageW]; }

    const bleed   = input.bleed   || 0;
    const gutter  = input.gutter  || 0;
    const gripper = input.gripper || 0;
    const cellW   = pageW + 2 * bleed + gutter;
    const cellH   = pageH + 2 * bleed + gutter;

    // ── Smart scale: ensure cells stay readable on dense grids ─────────
    // Target minimum cell dimension = 3.5 SVG units.
    // A larger drawScale expands the viewBox, making the preview taller
    // so each cell gets more pixels in the browser.
    const cellMin   = Math.min(cellW || 1, cellH || 1);
    const rawScale  = 3.5 / cellMin;
    const drawScale = Math.max(1.0, Math.min(6.0, rawScale));

    const dSW  = sw      * drawScale;
    const dSH  = sh      * drawScale;
    const dCW  = cellW   * drawScale;
    const dCH  = cellH   * drawScale;
    const dBl  = bleed   * drawScale;
    const dGut = gutter  * drawScale;
    const dGrp = gripper * drawScale;
    const dPW  = pageW   * drawScale;
    const dPH  = pageH   * drawScale;

    const vbW    = dSW + pad * 2;
    const vbH    = dSH + pad * 2;
    const startY = pad + dGrp;

    const headerFs = Math.max(0.85, Math.min(dSW, dSH) * 0.022);
    const pageFs   = Math.max(0.4,  Math.min(dPW, dPH) / 5.5);
    const tinyFs   = headerFs * 0.7;

    // ── Gripper zone ───────────────────────────────────────────────────
    const gripperEl = gripper > 0
      ? `<rect x="${pad}" y="${pad}" width="${dSW}" height="${dGrp}"
               fill="rgba(239,68,68,.05)" stroke="rgba(239,68,68,.28)"
               stroke-dasharray="${tinyFs*0.6} ${tinyFs*0.4}" stroke-width="0.26" rx="0.2"/>
         <text x="${pad+0.8}" y="${pad+dGrp*0.56}"
               font-size="${tinyFs}" fill="#ef4444" opacity="0.65">جريبر ${gripper}سم</text>`
      : '';

    // ── Gutter bands ───────────────────────────────────────────────────
    const gutterEls = [];
    if (dGut > 0 && imp.cols > 0 && imp.rows > 0) {
      const tW = imp.cols * dCW - dGut;
      const tH = imp.rows * dCH - dGut;
      for (let c = 1; c < imp.cols; c++) {
        const gx = pad + c * dCW - dGut;
        gutterEls.push(
          `<rect x="${gx}" y="${startY}" width="${dGut}" height="${tH}" fill="rgba(148,163,184,.1)"/>`);
      }
      for (let r = 1; r < imp.rows; r++) {
        const gy = startY + r * dCH - dGut;
        gutterEls.push(
          `<rect x="${pad}" y="${gy}" width="${tW}" height="${dGut}" fill="rgba(148,163,184,.1)"/>`);
      }
    }

    // ── Page cells ─────────────────────────────────────────────────────
    const cells = [];
    for (let r = 0; r < imp.rows; r++) {
      for (let c = 0; c < imp.cols; c++) {
        const bx  = pad + c * dCW;
        const by  = startY + r * dCH;
        const idx = r * imp.cols + c + 1;
        const px1 = bx + dBl, py1 = by + dBl;
        const px2 = px1 + dPW, py2 = py1 + dPH;

        // Bleed zone — faint dashed outline
        if (bleed > 0) {
          cells.push(
            `<rect x="${bx}" y="${by}" width="${dPW+2*dBl}" height="${dPH+2*dBl}"
              fill="rgba(239,68,68,.03)" stroke="rgba(220,38,38,.22)"
              stroke-dasharray="${pageFs*0.7} ${pageFs*0.45}" stroke-width="0.2" rx="0.2"/>`);
        }

        // Page trim — light warm fill, thin border
        cells.push(
          `<rect x="${px1}" y="${py1}" width="${dPW}" height="${dPH}"
            fill="rgba(245,158,11,.08)" stroke="#dfa030" stroke-width="0.28" rx="0.22"/>`);

        // Spine fold guide — faint dashed centre line
        const ccx = px1 + dPW / 2;
        cells.push(
          `<line x1="${ccx}" y1="${py1}" x2="${ccx}" y2="${py2}"
            stroke="#c08028" stroke-width="0.18"
            stroke-dasharray="${pageFs*0.7} ${pageFs*0.55}" opacity="0.28"/>`);

        // Page number — small, light weight
        cells.push(
          `<text x="${ccx}" y="${py1+dPH/2}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="${pageFs}" fill="#92400e" font-weight="400" opacity="0.45">${idx}</text>`);

        // Crop ticks at bleed corners
        if (bleed > 0) {
          const tk = dBl * 0.55;
          const ck = `stroke="rgba(220,38,38,.3)" stroke-width="0.18"`;
          cells.push(`
            <line x1="${px1}" y1="${by}" x2="${px1}" y2="${py1-tk}" ${ck}/>
            <line x1="${bx}" y1="${py1}" x2="${px1-tk}" y2="${py1}" ${ck}/>
            <line x1="${px2}" y1="${by}" x2="${px2}" y2="${py1-tk}" ${ck}/>
            <line x1="${bx+dPW+2*dBl}" y1="${py1}" x2="${px2+tk}" y2="${py1}" ${ck}/>
            <line x1="${px1}" y1="${py2+(dBl-tk)}" x2="${px1}" y2="${by+dPH+2*dBl}" ${ck}/>
            <line x1="${bx}" y1="${py2}" x2="${px1-tk}" y2="${py2}" ${ck}/>
            <line x1="${px2}" y1="${py2+(dBl-tk)}" x2="${px2}" y2="${by+dPH+2*dBl}" ${ck}/>
            <line x1="${bx+dPW+2*dBl}" y1="${py2}" x2="${px2+tk}" y2="${py2}" ${ck}/>`);
        }
      }
    }

    const orientLabel = imp.orientation === 'landscape' ? 'مقلوب 90°' : 'عمودي';

    return `
      <svg viewBox="0 0 ${vbW} ${vbH}" width="100%" preserveAspectRatio="xMidYMid meet">
        <!-- Paper shadow -->
        <rect x="${pad+0.5}" y="${pad+0.5}" width="${dSW}" height="${dSH}"
              fill="rgba(0,0,0,0.03)" rx="1"/>
        <!-- Sheet — white paper -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="white" stroke="#dde3ec" stroke-width="0.38" rx="0.8"/>
        ${gripperEl}
        ${gutterEls.join('')}
        ${cells.join('')}
        <!-- Sheet border overlay -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="none" stroke="#94a3b8" stroke-width="0.26" rx="0.8"/>
        <!-- Info label — H×W order per production convention -->
        <text x="${pad}" y="${pad-headerFs*0.4}" font-size="${headerFs}"
              fill="#94a3b8" direction="ltr" font-family="monospace" font-weight="400">
          ${imp.cols}×${imp.rows} = ${imp.perSide}/وجه · ${orientLabel} · فرخ ${sh}×${sw}سم
        </text>
      </svg>`;
  }

  window.PETSHROW.bestImposition       = bestImposition;
  window.PETSHROW.calculateNotebookJob = calculateNotebookJob;
  window.PETSHROW.renderImpositionSVG  = renderImpositionSVG;
})();
