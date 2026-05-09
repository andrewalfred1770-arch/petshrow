/**
 * Petshrow — Boxes / Packaging module  (light-theme)
 *
 * Styles supported: straight-tuck · reverse-tuck · snap-lock · tray
 * All sizes in mm.
 */
window.PETSHROW = window.PETSHROW || {};

(function () {

  const STYLES = {
    'straight-tuck': 'كارتون مطوي (Straight Tuck)',
    'reverse-tuck':  'كارتون مقلوب (Reverse Tuck)',
    'snap-lock':     'قاعدة أوتوماتيك (Snap-Lock)',
    'tray':          'صينية مفتوحة (Tray)',
  };

  function flatBlanks(L, W, H, t, style) {
    t = t || 0.4;
    const glueFlap = Math.round(Math.max(1.5, W * 0.25) * 10) / 10;
    const tuckH    = Math.round((W * 0.6 + t * 2) * 10) / 10;
    const lockSlot = Math.round(W * 0.5 * 10) / 10;

    let flatW, flatH, notes = [];

    if (style === 'straight-tuck' || style === 'reverse-tuck') {
      flatW = 2 * (L + W) + glueFlap;
      flatH = 2 * tuckH + H;
      notes.push(`عرض الأوجه: 2×(${L}+${W}) + لسان لصق ${glueFlap}سم`);
      notes.push(`علو الأوجه: 2×${tuckH}سم (تك) + ${H}سم (ارتفاع)`);
    } else if (style === 'snap-lock') {
      flatW = 2 * (L + W) + glueFlap;
      flatH = tuckH + H + lockSlot + t * 2;
      notes.push(`قاعدة snap-lock: فردة قفل ${lockSlot}سم`);
    } else if (style === 'tray') {
      flatW = L + 2 * H + 2 * glueFlap;
      flatH = W + 2 * H;
      notes.push(`الصينية: ${L} طول + 2×${H} جوانب + فرديتان ${glueFlap}سم`);
    }

    const area = Math.round(flatW * flatH / 100) / 100;
    return { flatW, flatH, glueFlap, tuckH, area, notes };
  }

  function imposeFlat(flatW, flatH, sheetW, sheetH, bleed) {
    bleed = bleed || 0;
    function fit(fw, fh) {
      const cols = Math.max(0, Math.floor((sheetW + bleed) / (fw + bleed)));
      const rows = Math.max(0, Math.floor((sheetH + bleed) / (fh + bleed)));
      return { cols, rows, perSheet: cols * rows };
    }
    const p = fit(flatW, flatH), r = fit(flatH, flatW);
    if (p.perSheet >= r.perSheet) return { ...p, rotated: false };
    return { ...r, rotated: true };
  }

  function calculateBoxJob(input) {
    const qty      = Math.max(0, +input.qty      || 0);
    const L        = +input.L        || 0;
    const W        = +input.W        || 0;
    const H        = +input.H        || 0;
    const t        = +input.thickness || 0.4;
    const style    = input.style     || 'straight-tuck';
    const sheet    = input.sheet     || { w:600, h:900 };
    const bleed    = +input.bleed    || 0;
    const wastePct = Number.isFinite(+input.wastePct) ? +input.wastePct : 5;

    const flat       = flatBlanks(L, W, H, t, style);
    const impose     = imposeFlat(flat.flatW, flat.flatH, sheet.w, sheet.h, bleed);
    const baseSheets  = impose.perSheet > 0 ? Math.ceil(qty / impose.perSheet) : 0;
    const wasteSheets = Math.ceil(baseSheets * wastePct / 100);
    const totalSheets = baseSheets + wasteSheets;

    const errors = [];
    if (impose.perSheet === 0) errors.push('مقاس البلانك أكبر من الفرخ — كبّر الفرخ أو صغّر الصندوق.');

    return { input:{ qty, L, W, H, t, style, sheet, bleed, wastePct }, flat, impose,
             sheets:{ baseSheets, wasteSheets, totalSheets }, errors };
  }

  /** CSS-3D rotating box — light palette */
  function renderBox3D(L, W, H, containerId) {
    const MAX   = 150;
    const scale = MAX / Math.max(L, W, H, 1);
    const l = Math.round(L * scale);
    const w = Math.round(W * scale);
    const h = Math.round(H * scale);

    const el = document.getElementById(containerId);
    if (!el) return;
    if (el._rotateTimer) clearInterval(el._rotateTimer);

    // Colours: orange faces (front/back), navy side/top
    el.innerHTML = `
      <style scoped>
        #${containerId} { perspective: 680px; }
        .ps-scene { width:${l}px; height:${h}px; position:relative;
          transform-style:preserve-3d; transition:transform .05s linear; margin:auto; }
        .ps-f { position:absolute; border:1.5px solid; display:grid;
          place-items:center; font-size:11px; font-weight:800; font-family:monospace; }
        /* front / back — orange tint */
        .ps-front, .ps-back {
          width:${l}px; height:${h}px;
          background:rgba(245,158,11,.18); border-color:rgba(217,119,6,.7); color:#92400e; }
        .ps-front  { transform:translateZ(${w/2}px); }
        .ps-back   { transform:rotateY(180deg) translateZ(${w/2}px); }
        /* sides — navy tint */
        .ps-right, .ps-left {
          width:${w}px; height:${h}px; left:${(l-w)/2}px;
          background:rgba(21,40,68,.1); border-color:rgba(21,40,68,.45); color:#152844; }
        .ps-right  { transform:rotateY( 90deg) translateZ(${l/2}px); }
        .ps-left   { transform:rotateY(-90deg) translateZ(${l/2}px); }
        /* top / bottom — navy darker */
        .ps-top, .ps-bottom {
          width:${l}px; height:${w}px; top:${(h-w)/2}px;
          background:rgba(21,40,68,.18); border-color:rgba(21,40,68,.6); color:#152844; }
        .ps-top    { transform:rotateX( 90deg) translateZ(${h/2}px); }
        .ps-bottom { transform:rotateX(-90deg) translateZ(${h/2}px); }
      </style>
      <div style="height:230px;display:grid;place-items:center;overflow:hidden;">
        <div class="ps-scene" id="${containerId}-scene">
          <div class="ps-f ps-front">${L}سم</div>
          <div class="ps-f ps-back"></div>
          <div class="ps-f ps-right">${W}</div>
          <div class="ps-f ps-left"></div>
          <div class="ps-f ps-top">${H}</div>
          <div class="ps-f ps-bottom"></div>
        </div>
      </div>`;

    let angle = 25;
    const scene = document.getElementById(`${containerId}-scene`);
    if (!scene) return;
    scene.style.transform = `rotateX(-20deg) rotateY(${angle}deg)`;
    el._rotateTimer = setInterval(() => {
      angle = (angle + 0.55) % 360;
      if (scene) scene.style.transform = `rotateX(-20deg) rotateY(${angle}deg)`;
    }, 30);
  }

  /**
   * Die-cut SVG — technical manufacturing drawing style.
   * Shows fold lines, glue flap hatch, panel labels, and dimension annotations.
   */
  function renderDieCutSVG(result) {
    const { flat, impose, input } = result;
    const sw = input.sheet.w, sh = input.sheet.h;
    const fw = impose.rotated ? flat.flatH : flat.flatW;
    const fh = impose.rotated ? flat.flatW : flat.flatH;
    const bleed = input.bleed || 0;
    const pad   = 10;

    // ── Smart scale: blanks that are small relative to sheet get scaled up ─
    const blankMin  = Math.min(fw || 1, fh || 1);
    const rawScale  = 5.0 / blankMin;
    const drawScale = Math.max(1.0, Math.min(4.0, rawScale));

    const dSW = sw * drawScale, dSH = sh * drawScale;
    const dFW = fw * drawScale, dFH = fh * drawScale;
    const dBl = bleed * drawScale;

    const infoFs = Math.max(1.0, Math.min(dSW, dSH) * 0.026);
    const cells  = [];

    const { L, W, H } = input;
    const { glueFlap, tuckH } = flat;
    const style  = input.style;
    const isTuck = style === 'straight-tuck' || style === 'reverse-tuck' || style === 'snap-lock';

    // Scaled structural dimensions
    const dGF = glueFlap * drawScale;
    const dTH = tuckH   * drawScale;
    const dL  = L       * drawScale;
    const dW  = W       * drawScale;
    const dH  = H       * drawScale;

    for (let r = 0; r < impose.rows; r++) {
      for (let c = 0; c < impose.cols; c++) {
        const x   = pad + c * (dFW + dBl);
        const y   = pad + r * (dFH + dBl);
        const idx = r * impose.cols + c + 1;
        const numFs = Math.max(0.55, Math.min(dFW, dFH) / 5);
        const lfs   = Math.max(0.45, numFs * 0.52);

        // ── Blank cut outline — light paper tint, fine border ──────────
        cells.push(
          `<rect x="${x}" y="${y}" width="${dFW}" height="${dFH}"
            fill="rgba(21,40,68,.035)" stroke="#4a6080" stroke-width="0.55" rx="0.3"/>`);

        // ── Internal structure (tuck-style only, non-rotated) ──────────
        if (isTuck && !impose.rotated && dTH > 0 && dH > 0 && dW > 0 && dL > 0) {
          const foldA = `stroke="#3a5570" stroke-width="0.32" stroke-dasharray="1.0 0.7" opacity="0.6"`;
          const foldB = `stroke="#3a5570" stroke-width="0.28" stroke-dasharray="0.45 0.45" opacity="0.42"`;

          // Horizontal fold lines (tuck zones)
          const hy1 = y + dTH;
          const hy2 = y + dTH + dH;
          cells.push(`
            <line x1="${x}" y1="${hy1}" x2="${x+dFW}" y2="${hy1}" ${foldA}/>
            <line x1="${x}" y1="${hy2}" x2="${x+dFW}" y2="${hy2}" ${foldA}/>`);

          // Vertical fold lines (panel divisions)
          const vx1 = x + dGF;
          const vx2 = x + dGF + dW;
          const vx3 = x + dGF + dW + dL;
          const vx4 = x + dGF + 2*dW + dL;
          cells.push(`
            <line x1="${vx1}" y1="${y}" x2="${vx1}" y2="${y+dFH}" ${foldA}/>
            <line x1="${vx2}" y1="${y}" x2="${vx2}" y2="${y+dFH}" ${foldA}/>
            <line x1="${vx3}" y1="${y}" x2="${vx3}" y2="${y+dFH}" ${foldA}/>
            <line x1="${vx4}" y1="${y}" x2="${vx4}" y2="${y+dFH}" ${foldB}/>`);

          // Glue flap hatch — fine diagonal lines
          const hatchSteps = 5;
          for (let d = 0; d <= hatchSteps; d++) {
            const off = (dGF / hatchSteps) * d;
            cells.push(
              `<line x1="${x}" y1="${hy1+off}" x2="${x+off}" y2="${hy1}"
                stroke="#3a5570" stroke-width="0.2" opacity="0.22"/>`);
          }

          // ── Panel labels + dimension annotations (first blank only) ───
          if (idx === 1) {
            const my = y + dTH + dH / 2;

            // Panel name labels
            cells.push(`
              <text x="${(x+vx1)/2}" y="${my}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs}" fill="#2d4a65" opacity="0.55" font-family="monospace">لصق</text>
              <text x="${(vx1+vx2)/2}" y="${my}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs}" fill="#2d4a65" opacity="0.55" font-family="monospace">W</text>
              <text x="${(vx2+vx3)/2}" y="${my}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs}" fill="#2d4a65" opacity="0.55" font-family="monospace">L</text>
              <text x="${(vx3+vx4)/2}" y="${my}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs}" fill="#2d4a65" opacity="0.55" font-family="monospace">W</text>`);

            // Dimension annotations — below the blank
            const annY = y + dFH + lfs * 1.8;
            const dimCol = `fill="#5a7a95" font-family="monospace"`;
            cells.push(`
              <text x="${(vx2+vx3)/2}" y="${annY}" text-anchor="middle"
                font-size="${lfs*0.88}" ${dimCol}>${L}سم</text>
              <text x="${(vx1+vx2)/2}" y="${annY}" text-anchor="middle"
                font-size="${lfs*0.88}" ${dimCol}>${W}سم</text>`);

            // Height annotation — right of the blank
            const annX = x + dFW + lfs * 1.6;
            cells.push(
              `<text x="${annX}" y="${y+dTH+dH/2}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs*0.88}" ${dimCol}
                transform="rotate(90,${annX},${y+dTH+dH/2})">${H}سم</text>`);

            // Tuck height annotation
            cells.push(`
              <text x="${annX}" y="${y+dTH/2}" text-anchor="middle" dominant-baseline="middle"
                font-size="${lfs*0.8}" fill="#8aa0b5" font-family="monospace"
                transform="rotate(90,${annX},${y+dTH/2})">${flat.tuckH.toFixed(1)}سم</text>`);
          }
        }

        // Index number — subtle, small
        cells.push(
          `<text x="${x+dFW/2}" y="${y+dFH/2}" text-anchor="middle"
            dominant-baseline="middle" font-size="${numFs}"
            fill="#3a5570" font-weight="400" opacity="0.3">${idx}</text>`);
      }
    }

    return `
      <svg viewBox="0 0 ${dSW+pad*2} ${dSH+pad*2}" width="100%" preserveAspectRatio="xMidYMid meet">
        <!-- Paper shadow -->
        <rect x="${pad+0.45}" y="${pad+0.45}" width="${dSW}" height="${dSH}"
              fill="rgba(0,0,0,0.028)" rx="1"/>
        <!-- Sheet — white paper -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="white" stroke="#dde3ec" stroke-width="0.38" rx="0.8"/>
        ${cells.join('')}
        <!-- Sheet border overlay -->
        <rect x="${pad}" y="${pad}" width="${dSW}" height="${dSH}"
              fill="none" stroke="#94a3b8" stroke-width="0.25" rx="0.8"/>
        <!-- Info label -->
        <text x="${pad}" y="${pad-infoFs*0.4}" font-size="${infoFs}"
              fill="#94a3b8" direction="ltr" font-family="monospace" font-weight="400">
          فرخ ${sw}×${sh}سم · بلانك ${flat.flatW}×${flat.flatH}سم · ${impose.perSheet}/فرخ
        </text>
      </svg>`;
  }

  window.PETSHROW.BOX_STYLES       = STYLES;
  window.PETSHROW.flatBlanks        = flatBlanks;
  window.PETSHROW.imposeFlat        = imposeFlat;
  window.PETSHROW.calculateBoxJob   = calculateBoxJob;
  window.PETSHROW.renderBox3D       = renderBox3D;
  window.PETSHROW.renderDieCutSVG   = renderDieCutSVG;
})();
