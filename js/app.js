/**
 * Petshrow — Dashboard  (light theme)
 * Module routing · all four module UIs · job ticket API.
 * All dimensions entered by user in سم (centimetres).
 */
(function () {
  const P    = window.PETSHROW;
  const root = document.getElementById('moduleRoot');

  /* ── Device label ──────────────────────────────────────────────────── */
  function deviceLabel() {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua))        return 'تابلت';
    if (/Mobi|Android|iPhone/i.test(ua)) return 'موبايل';
    return 'كمبيوتر';
  }
  document.getElementById('deviceLabel').textContent =
    `${deviceLabel()} · ${location.host}`;

  /* ── Toast ─────────────────────────────────────────────────────────── */
  function toast(msg, kind) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold show t-${kind || 'info'}`;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = 'fixed bottom-6 left-6 z-50 hidden'; }, 2800);
  }

  /* ── Shared helpers ────────────────────────────────────────────────── */
  const fmt    = n => Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
  const fmtDec = (n, d=2) => Number.isFinite(n) ? n.toFixed(d) : '—';

  function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g,
      c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* Error banner */
  function errBlock(errors) {
    if (!errors?.length) return '';
    return `<div class="alert-error">${errors.map(e => `• ${e}`).join('<br>')}</div>`;
  }

  /* KPI grid */
  function kpiGrid(kpis) {
    return `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${kpis.map(k => `
        <div class="kpi${k.highlight ? ' highlight' : ''}">
          <div class="label">${k.label}</div>
          <div class="value">${k.value}</div>
          ${k.sub ? `<div class="sub">${k.sub}</div>` : ''}
        </div>`).join('')}
    </div>`;
  }

  /* Page-title bar (used by every module) */
  function titleBar(icon, title, sub, btns='') {
    return `
      <div class="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 grid place-items-center text-2xl">${icon}</div>
          <div>
            <h1 class="page-title">${title}</h1>
            <p class="page-sub">${sub}</p>
          </div>
        </div>
        <div class="flex gap-2 items-center">${btns}</div>
      </div>`;
  }

  /* ── Job ticket save ───────────────────────────────────────────────── */
  async function saveJob(payload) {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('تم حفظ تذكرة العمل بنجاح ✓', 'ok');
    } catch (e) {
      toast('فشل الحفظ: ' + e.message, 'err');
    }
  }

  /* ── Routing ───────────────────────────────────────────────────────── */
  const state = { route: 'notebooks' };

  function showRoute(route) {
    state.route = route;
    const prev = document.getElementById('box-3d-preview');
    if (prev?._rotateTimer) clearInterval(prev._rotateTimer);

    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.route === route));

    ({ notebooks:renderNotebooks, boxes:renderBoxes,
       cards:renderCards, stickers:renderStickers, jobs:renderJobs }
    )[route]?.();

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  }

  document.querySelectorAll('.nav-btn').forEach(b =>
    b.addEventListener('click', () => showRoute(b.dataset.route)));

  document.getElementById('btnSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  });

  /* ═══════════════════════════════════════════════════════════════════
     MODULE 1 — Notebooks / Registers
     ═══════════════════════════════════════════════════════════════════ */
  function renderNotebooks() {
    root.innerHTML = `
      ${titleBar('📓','سجلات ودفاتر',
        'احسب عدد الأفرخ والملازم والهالك بدقة احترافية.',
        `<button id="nb-save"  class="btn btn-primary">💾 حفظ كتذكرة</button>
         <button id="nb-reset" class="btn btn-ghost">تفريغ</button>`)}

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <!-- ── Inputs ── -->
        <section class="panel lg:col-span-2">
          <div class="panel-h">
            <h2>المدخلات</h2>
            <span class="text-xs text-slate-400">المقاسات بالسم</span>
          </div>
          <div class="panel-b grid grid-cols-2 gap-3">
            <div class="field col-span-2">
              <label>اسم العمل</label>
              <input id="nb-title" type="text" placeholder="مثال: سجل — 70 دفتر" />
            </div>
            <div class="field">
              <label>عدد الدفاتر</label>
              <input id="nb-count" type="number" min="1" value="70" />
            </div>
            <div class="field">
              <label>صفحات / دفتر</label>
              <input id="nb-pages" type="number" min="1" value="97" />
            </div>
            <div class="field">
              <label>عرض الفرخ (سم)</label>
              <input id="nb-sheet-w" type="number" min="1" step="0.5" value="48" />
            </div>
            <div class="field">
              <label>ارتفاع الفرخ (سم)</label>
              <input id="nb-sheet-h" type="number" min="1" step="0.5" value="33" />
            </div>
            <div class="field col-span-2">
              <label class="block mb-1" style="font-size:0.72rem;color:#94a3b8;font-weight:600;letter-spacing:.02em;">مقاسات شائعة للفرخ</label>
              <div class="flex flex-wrap gap-1">
                <button class="size-chip nb-sz" data-w="35" data-h="25">35×25</button>
                <button class="size-chip nb-sz" data-w="44" data-h="33">44×33</button>
                <button class="size-chip nb-sz" data-w="48" data-h="33">48×33</button>
                <button class="size-chip nb-sz" data-w="50" data-h="35">50×35</button>
                <button class="size-chip nb-sz" data-w="60" data-h="45">60×45</button>
                <button class="size-chip nb-sz" data-w="65" data-h="50">65×50</button>
                <button class="size-chip nb-sz" data-w="60" data-h="90">60×90</button>
                <button class="size-chip nb-sz" data-w="70" data-h="100">70×100</button>
              </div>
            </div>
            <div class="field">
              <label>عرض الصفحة (سم)</label>
              <input id="nb-page-w" type="number" min="0.5" step="0.5" value="10.5" />
            </div>
            <div class="field">
              <label>ارتفاع الصفحة (سم)</label>
              <input id="nb-page-h" type="number" min="0.5" step="0.5" value="14.8" />
            </div>
            <div class="field">
              <label>الهالك %</label>
              <input id="nb-waste" type="number" min="0" step="0.5" value="5" />
            </div>
            <div class="field">
              <label>جريبر (سم)</label>
              <input id="nb-gripper" type="number" min="0" step="0.1" value="1" />
            </div>
            <div class="field">
              <label>نزف (سم)</label>
              <input id="nb-bleed" type="number" min="0" step="0.1" value="0" />
            </div>
            <div class="field">
              <label>مسافة بين الصفحات (سم)</label>
              <input id="nb-gutter" type="number" min="0" step="0.1" value="0" />
            </div>
          </div>
        </section>

        <!-- ── Results ── -->
        <section class="panel lg:col-span-3">
          <div class="panel-h">
            <h2>النتائج</h2>
            <span id="nb-orient" class="text-xs text-slate-400 font-mono"></span>
          </div>
          <div class="panel-b">
            <div id="nb-errors"></div>
            <div id="nb-kpis"></div>
            <div class="mt-5">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-navy-800">معاينة التفريد على الفرخ</h3>
                <span id="nb-meta" class="text-[11px] text-slate-400 font-mono"></span>
              </div>
              <div id="nb-impose" class="impose-wrap" style="min-height:250px"></div>
            </div>
          </div>
        </section>
      </div>`;

    const watch = ['nb-count','nb-pages','nb-sheet-w','nb-sheet-h','nb-page-w','nb-page-h','nb-waste','nb-gripper','nb-bleed','nb-gutter'];
    watch.forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input',  nbCompute);
      el.addEventListener('change', nbCompute);
    });

    // Production-size chips — fill sheet fields and recalculate
    root.querySelectorAll('.nb-sz').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('nb-sheet-w').value = btn.dataset.w;
        document.getElementById('nb-sheet-h').value = btn.dataset.h;
        root.querySelectorAll('.nb-sz').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        nbCompute();
      });
    });

    document.getElementById('nb-reset').addEventListener('click', () => {
      document.getElementById('nb-count').value   = 70;
      document.getElementById('nb-pages').value   = 97;
      document.getElementById('nb-sheet-w').value = 48;
      document.getElementById('nb-sheet-h').value = 33;
      document.getElementById('nb-page-w').value  = 10.5;
      document.getElementById('nb-page-h').value  = 14.8;
      document.getElementById('nb-waste').value   = 5;
      document.getElementById('nb-gripper').value = 1;
      document.getElementById('nb-bleed').value   = 0;
      document.getElementById('nb-gutter').value  = 0;
      nbCompute();
    });

    document.getElementById('nb-save').addEventListener('click', () => {
      if (!state.nb) return;
      const inp = state.nb.input;
      saveJob({
        module: 'notebooks',
        title:  document.getElementById('nb-title').value.trim() ||
                `سجل ${inp.page.w}×${inp.page.h}سم — ${fmt(inp.notebooks)} دفتر`,
        input:  inp,
        result: state.nb,
      });
    });

    nbCompute();
  }

  function nbCompute() {
    const sheetW = +document.getElementById('nb-sheet-w')?.value || 0;
    const sheetH = +document.getElementById('nb-sheet-h')?.value || 0;
    const pageW  = +document.getElementById('nb-page-w')?.value  || 0;
    const pageH  = +document.getElementById('nb-page-h')?.value  || 0;
    if (!sheetW || !sheetH || !pageW || !pageH) return;

    const r = P.calculateNotebookJob({
      notebooks:        +document.getElementById('nb-count').value,
      pagesPerNotebook: +document.getElementById('nb-pages').value,
      page:   { w: pageW,  h: pageH  },
      sheet:  { w: sheetW, h: sheetH },
      wastePct: +document.getElementById('nb-waste').value,
      gripper:  +document.getElementById('nb-gripper').value,
      bleed:    +document.getElementById('nb-bleed').value,
      gutter:   +document.getElementById('nb-gutter').value,
    });
    state.nb = r;

    // Waste area metrics (per side of one sheet)
    const sheetArea = sheetW * sheetH;
    const pageArea  = pageW * pageH;
    const usedArea  = r.imposition.perSide * pageArea;
    const wasteArea = Math.max(0, sheetArea - usedArea);
    const utilPct   = sheetArea > 0 ? (usedArea / sheetArea * 100).toFixed(1) : '0.0';
    const orientLabel = r.imposition.orientation === 'landscape' ? 'مقلوب 90°' : 'عمودي';

    document.getElementById('nb-errors').innerHTML = errBlock(r.errors);
    document.getElementById('nb-kpis').innerHTML = kpiGrid([
      { label:'صفحات / وجه',            value: fmt(r.imposition.perSide)  },
      { label:'صفحات / فرخ',            value: fmt(r.imposition.perSheet) },
      { label:'حجم الملزمة (ص)',         value: fmt(r.signatures.sizePages) },
      { label:'ملازم / دفتر',            value: fmt(r.signatures.perNotebook) },
      { label:'صفحات بيضاء / دفتر',     value: fmt(r.signatures.blankPages) },
      { label:'أفرخ / دفتر',            value: fmt(r.sheets.sheetsPerNotebook) },
      { label:'إجمالي الأفرخ (نظري)',   value: fmt(r.sheets.baseSheets) },
      { label:'الهالك (أفرخ)',           value: fmt(r.sheets.wasteSheets) },
      { label:'الإجمالي مع الهالك',     value: fmt(r.sheets.totalSheetsWithWaste), highlight:true },
      { label:'توجيه',                   value: orientLabel },
      { label:'استخدام الفرخ',           value: `${utilPct}%` },
      { label:'هالك مساحة (سم²)',        value: fmtDec(wasteArea) },
    ]);

    document.getElementById('nb-orient').textContent =
      `${r.imposition.cols}×${r.imposition.rows} · ${orientLabel}`;
    // FIX #1: display as H×W (height first) per production convention
    document.getElementById('nb-meta').textContent =
      `فرخ ${sheetH}×${sheetW}سم · صفحة ${pageH}×${pageW}سم · ملزمة ${r.signatures.sizePages}ص`;
    document.getElementById('nb-impose').innerHTML = P.renderImpositionSVG(r);
  }

  /* ═══════════════════════════════════════════════════════════════════
     MODULE 2 — Boxes / Packaging
     ═══════════════════════════════════════════════════════════════════ */
  function renderBoxes() {
    const styleOpts = Object.entries(P.BOX_STYLES)
      .map(([k,v]) => `<option value="${k}">${v}</option>`).join('');

    root.innerHTML = `
      ${titleBar('📦','أمبلاجات وعُلب',
        'مقاسات البلانك المسطّح، التفريد، ومعاينة 3D تفاعلية.',
        `<button id="bx-save"  class="btn btn-primary">💾 حفظ كتذكرة</button>
         <button id="bx-reset" class="btn btn-ghost">تفريغ</button>`)}

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <section class="panel lg:col-span-2">
          <div class="panel-h">
            <h2>مقاسات الصندوق</h2>
            <span class="text-xs text-slate-400">المقاسات بالسم</span>
          </div>
          <div class="panel-b grid grid-cols-2 gap-3">
            <div class="field col-span-2">
              <label>اسم العمل</label>
              <input id="bx-title" type="text" placeholder="مثال: علبة منتج — 1000 قطعة" />
            </div>
            <div class="field col-span-2">
              <label>نوع الصندوق</label>
              <select id="bx-style">${styleOpts}</select>
            </div>
            <div class="field"><label>الطول — L (سم)</label><input id="bx-L" type="number" min="0.1" step="0.5" value="15"/></div>
            <div class="field"><label>العرض — W (سم)</label><input id="bx-W" type="number" min="0.1" step="0.5" value="10"/></div>
            <div class="field"><label>الارتفاع — H (سم)</label><input id="bx-H" type="number" min="0.1" step="0.5" value="6"/></div>
            <div class="field"><label>سماكة الكرتون (سم)</label><input id="bx-t" type="number" min="0.01" step="0.01" value="0.04"/></div>
            <div class="field"><label>الكمية</label><input id="bx-qty" type="number" min="1" value="1000"/></div>
            <div class="field"><label>الهالك %</label><input id="bx-waste" type="number" min="0" step="0.5" value="5"/></div>
            <div class="field"><label>عرض الفرخ (سم)</label><input id="bx-sheet-w" type="number" min="1" step="0.5" value="70"/></div>
            <div class="field"><label>ارتفاع الفرخ (سم)</label><input id="bx-sheet-h" type="number" min="1" step="0.5" value="100"/></div>
            <div class="field col-span-2">
              <label class="block mb-1" style="font-size:0.72rem;color:#94a3b8;font-weight:600;letter-spacing:.02em;">مقاسات شائعة للفرخ</label>
              <div class="flex flex-wrap gap-1">
                <button class="size-chip bx-sz" data-w="50" data-h="70">50×70</button>
                <button class="size-chip bx-sz" data-w="60" data-h="90">60×90</button>
                <button class="size-chip bx-sz" data-w="65" data-h="90">65×90</button>
                <button class="size-chip bx-sz" data-w="70" data-h="100">70×100</button>
                <button class="size-chip bx-sz" data-w="72" data-h="102">72×102</button>
              </div>
            </div>
            <div class="field col-span-2"><label>فاصل بين القطع (سم)</label><input id="bx-bleed" type="number" min="0" step="0.1" value="0.5"/></div>
          </div>
        </section>

        <section class="panel lg:col-span-3">
          <div class="panel-h"><h2>النتائج</h2></div>
          <div class="panel-b">
            <div id="bx-errors"></div>
            <div id="bx-kpis"></div>

            <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-bold text-navy-800 mb-2">معاينة 3D (تدوير تلقائي)</h3>
                <div id="box-3d-preview" class="impose-wrap" style="min-height:240px; overflow:hidden;"></div>
              </div>
              <div>
                <h3 class="text-sm font-bold text-navy-800 mb-2">تفريد البلانك على الفرخ</h3>
                <div id="bx-impose" class="impose-wrap" style="min-height:240px"></div>
              </div>
            </div>

            <div id="bx-notes" class="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed"></div>
          </div>
        </section>
      </div>`;

    ['bx-style','bx-L','bx-W','bx-H','bx-t','bx-qty','bx-waste','bx-sheet-w','bx-sheet-h','bx-bleed'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input',  bxCompute);
      el.addEventListener('change', bxCompute);
    });

    // Production-size chips
    root.querySelectorAll('.bx-sz').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('bx-sheet-w').value = btn.dataset.w;
        document.getElementById('bx-sheet-h').value = btn.dataset.h;
        root.querySelectorAll('.bx-sz').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        bxCompute();
      });
    });

    document.getElementById('bx-reset').addEventListener('click', () => {
      document.getElementById('bx-L').value       = 15;
      document.getElementById('bx-W').value       = 10;
      document.getElementById('bx-H').value       = 6;
      document.getElementById('bx-t').value       = 0.04;
      document.getElementById('bx-qty').value     = 1000;
      document.getElementById('bx-waste').value   = 5;
      document.getElementById('bx-sheet-w').value = 70;
      document.getElementById('bx-sheet-h').value = 100;
      document.getElementById('bx-bleed').value   = 0.5;
      bxCompute();
    });

    document.getElementById('bx-save').addEventListener('click', () => {
      if (!state.bx) return;
      const i = state.bx.input;
      saveJob({
        module: 'boxes',
        title:  document.getElementById('bx-title').value.trim() ||
                `علبة ${i.L}×${i.W}×${i.H}سم — ${fmt(i.qty)} قطعة`,
        input:  i, result: state.bx,
      });
    });

    bxCompute();
  }

  function bxCompute() {
    const sheetW = +document.getElementById('bx-sheet-w')?.value || 0;
    const sheetH = +document.getElementById('bx-sheet-h')?.value || 0;
    if (!sheetW || !sheetH) return;
    const sheet = { w: sheetW, h: sheetH };
    const r = P.calculateBoxJob({
      qty:      +document.getElementById('bx-qty').value,
      L:        +document.getElementById('bx-L').value,
      W:        +document.getElementById('bx-W').value,
      H:        +document.getElementById('bx-H').value,
      thickness:+document.getElementById('bx-t').value,
      style:    document.getElementById('bx-style').value,
      bleed:    +document.getElementById('bx-bleed').value,
      wastePct: +document.getElementById('bx-waste').value,
      sheet,
    });
    state.bx = r;

    document.getElementById('bx-errors').innerHTML = errBlock(r.errors);
    document.getElementById('bx-kpis').innerHTML = kpiGrid([
      { label:'عرض البلانك (سم)',        value: fmtDec(r.flat.flatW) },
      { label:'ارتفاع البلانك (سم)',      value: fmtDec(r.flat.flatH) },
      { label:'مساحة البلانك (سم²)',      value: fmtDec(r.flat.area)  },
      { label:'قطع / فرخ',              value: fmt(r.impose.perSheet) },
      { label:'أفرخ نظرية',             value: fmt(r.sheets.baseSheets) },
      { label:'الهالك (أفرخ)',           value: fmt(r.sheets.wasteSheets) },
      { label:'الإجمالي مع الهالك',     value: fmt(r.sheets.totalSheets), highlight:true },
      { label:'توجيه البلانك',           value: r.impose.rotated ? 'مقلوب 90°' : 'عمودي' },
    ]);

    if (r.flat.notes?.length)
      document.getElementById('bx-notes').innerHTML = r.flat.notes.map(n => `• ${n}`).join('<br>');

    P.renderBox3D(r.input.L, r.input.W, r.input.H, 'box-3d-preview');
    document.getElementById('bx-impose').innerHTML = P.renderDieCutSVG(r);
  }

  /* ═══════════════════════════════════════════════════════════════════
     MODULE 3 — Cards & Flyers
     ═══════════════════════════════════════════════════════════════════ */
  function renderCards() {
    const presetOpts = P.CARD_PRESETS
      .map(p => `<option value="${p.id}" data-w="${p.w}" data-h="${p.h}">${p.name}</option>`).join('');

    root.innerHTML = `
      ${titleBar('💳','كروت وفلايرات',
        'تفريد تلقائي بنزيف وحدود القصّ — من كارت البيزنس حتى فلاير A4.',
        `<button id="ca-save"  class="btn btn-primary">💾 حفظ كتذكرة</button>
         <button id="ca-reset" class="btn btn-ghost">تفريغ</button>`)}

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <section class="panel lg:col-span-2">
          <div class="panel-h">
            <h2>المدخلات</h2>
            <span class="text-xs text-slate-400">المقاسات بالسم</span>
          </div>
          <div class="panel-b grid grid-cols-2 gap-3">
            <div class="field col-span-2">
              <label>اسم العمل</label>
              <input id="ca-title" type="text" placeholder="مثال: كارت بيزنس — 5000 قطعة" />
            </div>
            <div class="field col-span-2">
              <label>نوع الكارت</label>
              <select id="ca-preset">${presetOpts}</select>
            </div>
            <div class="field"><label>العرض (سم)</label><input id="ca-W" type="number" min="0.1" step="0.1" value="9"/></div>
            <div class="field"><label>الارتفاع (سم)</label><input id="ca-H" type="number" min="0.1" step="0.1" value="5"/></div>
            <div class="field"><label>الكمية</label><input id="ca-qty" type="number" min="1" value="5000"/></div>
            <div class="field">
              <label>الوجهان</label>
              <select id="ca-sides">
                <option value="1">وجه واحد</option>
                <option value="2" selected>وجهان</option>
              </select>
            </div>
            <div class="field"><label>نزيف / وجه (سم)</label><input id="ca-bleed" type="number" min="0" step="0.05" value="0.3"/></div>
            <div class="field"><label>فاصل قصّ (سم)</label><input id="ca-gutter" type="number" min="0" step="0.1" value="0.5"/></div>
            <div class="field"><label>عرض الفرخ (سم)</label><input id="ca-sheet-w" type="number" min="1" step="0.5" value="60"/></div>
            <div class="field"><label>ارتفاع الفرخ (سم)</label><input id="ca-sheet-h" type="number" min="1" step="0.5" value="90"/></div>
            <div class="field col-span-2">
              <label class="block mb-1" style="font-size:0.72rem;color:#94a3b8;font-weight:600;letter-spacing:.02em;">مقاسات شائعة للفرخ</label>
              <div class="flex flex-wrap gap-1">
                <button class="size-chip ca-sz" data-w="35" data-h="25">35×25</button>
                <button class="size-chip ca-sz" data-w="44" data-h="33">44×33</button>
                <button class="size-chip ca-sz" data-w="48" data-h="33">48×33</button>
                <button class="size-chip ca-sz" data-w="50" data-h="35">50×35</button>
                <button class="size-chip ca-sz" data-w="60" data-h="45">60×45</button>
                <button class="size-chip ca-sz" data-w="60" data-h="90">60×90</button>
                <button class="size-chip ca-sz" data-w="65" data-h="50">65×50</button>
                <button class="size-chip ca-sz" data-w="70" data-h="100">70×100</button>
              </div>
            </div>
            <div class="field col-span-2"><label>الهالك %</label><input id="ca-waste" type="number" min="0" step="0.5" value="5"/></div>
          </div>
        </section>

        <section class="panel lg:col-span-3">
          <div class="panel-h"><h2>النتائج</h2></div>
          <div class="panel-b">
            <div id="ca-errors"></div>
            <div id="ca-kpis"></div>
            <div class="mt-5">
              <h3 class="text-sm font-bold text-navy-800 mb-2">معاينة التفريد</h3>
              <div id="ca-impose" class="impose-wrap" style="min-height:260px"></div>
            </div>
          </div>
        </section>
      </div>`;

    document.getElementById('ca-preset').addEventListener('change', function () {
      const o = this.selectedOptions[0];
      const w = +o.dataset.w, h = +o.dataset.h;
      if (w && h) {
        document.getElementById('ca-W').value = w;
        document.getElementById('ca-H').value = h;
        caCompute();
      }
    });

    ['ca-W','ca-H','ca-qty','ca-sides','ca-bleed','ca-gutter','ca-sheet-w','ca-sheet-h','ca-waste'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('input',  caCompute);
      el.addEventListener('change', caCompute);
    });

    // Production-size chips
    root.querySelectorAll('.ca-sz').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('ca-sheet-w').value = btn.dataset.w;
        document.getElementById('ca-sheet-h').value = btn.dataset.h;
        root.querySelectorAll('.ca-sz').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        caCompute();
      });
    });

    document.getElementById('ca-reset').addEventListener('click', () => {
      document.getElementById('ca-preset').value  = 'bc-std';
      document.getElementById('ca-W').value       = 9;
      document.getElementById('ca-H').value       = 5;
      document.getElementById('ca-qty').value     = 5000;
      document.getElementById('ca-sides').value   = 2;
      document.getElementById('ca-bleed').value   = 0.3;
      document.getElementById('ca-gutter').value  = 0.5;
      document.getElementById('ca-sheet-w').value = 60;
      document.getElementById('ca-sheet-h').value = 90;
      document.getElementById('ca-waste').value   = 5;
      caCompute();
    });

    document.getElementById('ca-save').addEventListener('click', () => {
      if (!state.ca) return;
      const i = state.ca.input;
      saveJob({
        module: 'cards',
        title:  document.getElementById('ca-title').value.trim() ||
                `كارت ${i.cardW}×${i.cardH}سم — ${fmt(i.qty)} قطعة`,
        input:  i, result: state.ca,
      });
    });

    caCompute();
  }

  function caCompute() {
    const sheetW = +document.getElementById('ca-sheet-w')?.value || 0;
    const sheetH = +document.getElementById('ca-sheet-h')?.value || 0;
    if (!sheetW || !sheetH) return;
    const sheet = { w: sheetW, h: sheetH };
    const r = P.calculateCardJob({
      qty:     +document.getElementById('ca-qty').value,
      cardW:   +document.getElementById('ca-W').value,
      cardH:   +document.getElementById('ca-H').value,
      bleed:   +document.getElementById('ca-bleed').value,
      gutter:  +document.getElementById('ca-gutter').value,
      sides:   +document.getElementById('ca-sides').value,
      wastePct:+document.getElementById('ca-waste').value,
      sheet,
    });
    state.ca = r;

    const caSheetArea = sheetW * sheetH;
    const caCardArea  = r.input.cardW * r.input.cardH;
    const caUsedArea  = r.impose.perSheet * caCardArea;
    const caUtil      = caSheetArea > 0 ? (caUsedArea / caSheetArea * 100).toFixed(1) : '0.0';
    const caWaste     = Math.max(0, caSheetArea - caUsedArea);

    document.getElementById('ca-errors').innerHTML = errBlock(r.errors);
    document.getElementById('ca-kpis').innerHTML = kpiGrid([
      { label:'قطع / فرخ',            value: fmt(r.impose.perSheet) },
      { label:'أعمدة × صفوف',         value: `${r.impose.cols}×${r.impose.rows}` },
      { label:'أفرخ نظرية',           value: fmt(r.sheets.baseSheets) },
      { label:'الهالك (أفرخ)',         value: fmt(r.sheets.wasteSheets) },
      { label:'إجمالي الأفرخ',        value: fmt(r.sheets.totalSheets), highlight:true,
        sub:`× ${r.sheets.sides} وجه` },
      { label:'توجيه الكارت',          value: r.impose.rotated ? 'مقلوب 90°' : 'عمودي' },
      { label:'استخدام الفرخ',         value: `${caUtil}%` },
      { label:'هالك مساحة (سم²)',      value: fmtDec(caWaste) },
    ]);
    document.getElementById('ca-impose').innerHTML = P.renderCardsSVG(r);
  }

  /* ═══════════════════════════════════════════════════════════════════
     MODULE 4 — Stickers & Misc
     ═══════════════════════════════════════════════════════════════════ */
  function renderStickers() {
    const typeOpts = Object.entries(P.STICKER_TYPES)
      .map(([k,v]) => `<option value="${k}">${v}</option>`).join('');

    root.innerHTML = `
      ${titleBar('🏷️','استيكرات ومنوعات',
        'ملصقات أفرخ، رولات ورق، وتيكتات كتيّبات — احسب الكميات بدقة.',
        `<button id="sk-save"  class="btn btn-primary">💾 حفظ كتذكرة</button>
         <button id="sk-reset" class="btn btn-ghost">تفريغ</button>`)}

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <section class="panel lg:col-span-2">
          <div class="panel-h">
            <h2>المدخلات</h2>
            <span class="text-xs text-slate-400">المقاسات بالسم</span>
          </div>
          <div class="panel-b grid grid-cols-2 gap-3">
            <div class="field col-span-2">
              <label>اسم العمل</label>
              <input id="sk-title" type="text" placeholder="مثال: استيكر منتج — 10000 قطعة" />
            </div>
            <div class="field col-span-2">
              <label>نوع المنتج</label>
              <select id="sk-type">${typeOpts}</select>
            </div>
            <div class="field"><label>الكمية المطلوبة</label><input id="sk-qty" type="number" min="1" value="10000"/></div>
            <div class="field"><label>الهالك %</label><input id="sk-waste" type="number" min="0" step="0.5" value="5"/></div>
            <div class="field"><label>عرض الملصق (سم)</label><input id="sk-lw" type="number" min="0.1" step="0.1" value="8"/></div>
            <div class="field"><label>ارتفاع الملصق (سم)</label><input id="sk-lh" type="number" min="0.1" step="0.1" value="5"/></div>
            <div class="field"><label>فاصل (سم)</label><input id="sk-gap" type="number" min="0" step="0.05" value="0.3"/></div>
            <div class="field"><label>نزيف (سم)</label><input id="sk-bleed" type="number" min="0" step="0.05" value="0.1"/></div>
            <div class="field sk-sheet-field"><label>عرض الفرخ (سم)</label><input id="sk-sheet-w" type="number" min="1" step="0.5" value="60"/></div>
            <div class="field sk-sheet-field"><label>ارتفاع الفرخ (سم)</label><input id="sk-sheet-h" type="number" min="1" step="0.5" value="90"/></div>
            <div class="field col-span-2 sk-sheet-field">
              <label class="block mb-1" style="font-size:0.72rem;color:#94a3b8;font-weight:600;letter-spacing:.02em;">مقاسات شائعة للفرخ</label>
              <div class="flex flex-wrap gap-1">
                <button class="size-chip sk-sz" data-w="35" data-h="25">35×25</button>
                <button class="size-chip sk-sz" data-w="44" data-h="33">44×33</button>
                <button class="size-chip sk-sz" data-w="48" data-h="33">48×33</button>
                <button class="size-chip sk-sz" data-w="50" data-h="35">50×35</button>
                <button class="size-chip sk-sz" data-w="60" data-h="45">60×45</button>
                <button class="size-chip sk-sz" data-w="60" data-h="90">60×90</button>
                <button class="size-chip sk-sz" data-w="65" data-h="50">65×50</button>
                <button class="size-chip sk-sz" data-w="70" data-h="100">70×100</button>
              </div>
            </div>
            <div class="field sk-roll-field hidden"><label>عرض الرول (سم)</label><input id="sk-rollW" type="number" min="1" step="1" value="30"/></div>
            <div class="field sk-ticket-field hidden"><label>أوراق / كتيّب</label><input id="sk-padSize" type="number" min="1" value="50"/></div>
            <div class="field sk-ticket-field hidden"><label>ألوان / نسخ NCR</label><input id="sk-colors" type="number" min="1" value="2"/></div>
          </div>
        </section>

        <section class="panel lg:col-span-3">
          <div class="panel-h"><h2>النتائج</h2></div>
          <div class="panel-b">
            <div id="sk-errors"></div>
            <div id="sk-kpis"></div>
            <div id="sk-impose-wrap" class="mt-5">
              <h3 class="text-sm font-bold text-navy-800 mb-2">معاينة التفريد</h3>
              <div id="sk-impose" class="impose-wrap" style="min-height:240px"></div>
            </div>
          </div>
        </section>
      </div>`;

    function toggleFields(type) {
      document.querySelectorAll('.sk-sheet-field').forEach(el =>
        el.classList.toggle('hidden', type === 'roll-labels'));
      document.querySelectorAll('.sk-roll-field').forEach(el =>
        el.classList.toggle('hidden', type !== 'roll-labels'));
      document.querySelectorAll('.sk-ticket-field').forEach(el =>
        el.classList.toggle('hidden', type !== 'tickets'));
      const impWrap = document.getElementById('sk-impose-wrap');
      if (impWrap) impWrap.classList.toggle('hidden', type === 'roll-labels');
    }

    document.getElementById('sk-type').addEventListener('change', function () {
      toggleFields(this.value); skCompute();
    });

    ['sk-qty','sk-waste','sk-lw','sk-lh','sk-gap','sk-bleed','sk-sheet-w','sk-sheet-h','sk-rollW','sk-padSize','sk-colors']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', skCompute); el.addEventListener('change', skCompute); }
      });

    // Production-size chips
    root.querySelectorAll('.sk-sz').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('sk-sheet-w').value = btn.dataset.w;
        document.getElementById('sk-sheet-h').value = btn.dataset.h;
        root.querySelectorAll('.sk-sz').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        skCompute();
      });
    });

    document.getElementById('sk-reset').addEventListener('click', () => {
      document.getElementById('sk-qty').value     = 10000;
      document.getElementById('sk-waste').value   = 5;
      document.getElementById('sk-lw').value      = 8;
      document.getElementById('sk-lh').value      = 5;
      document.getElementById('sk-gap').value     = 0.3;
      document.getElementById('sk-bleed').value   = 0.1;
      document.getElementById('sk-sheet-w').value = 60;
      document.getElementById('sk-sheet-h').value = 90;
      skCompute();
    });

    document.getElementById('sk-save').addEventListener('click', () => {
      if (!state.sk) return;
      saveJob({
        module: 'stickers',
        title:  document.getElementById('sk-title').value.trim() ||
                `ملصقات — ${fmt(state.sk.input?.qty)} قطعة`,
        input:  state.sk.input, result: state.sk,
      });
    });

    skCompute();
  }

  function skCompute() {
    const type   = document.getElementById('sk-type')?.value;
    const sheetW = +document.getElementById('sk-sheet-w')?.value || 0;
    const sheetH = +document.getElementById('sk-sheet-h')?.value || 0;
    if (!type) return;
    const sheet = { w: sheetW, h: sheetH };

    let r;
    if (type === 'sheet-labels') {
      r = P.calculateSheetLabels({
        qty:     +document.getElementById('sk-qty').value,
        labelW:  +document.getElementById('sk-lw').value,
        labelH:  +document.getElementById('sk-lh').value,
        bleed:   +document.getElementById('sk-bleed').value,
        gap:     +document.getElementById('sk-gap').value,
        wastePct:+document.getElementById('sk-waste').value,
        sheet,
      });
    } else if (type === 'roll-labels') {
      r = P.calculateRollLabels({
        qty:       +document.getElementById('sk-qty').value,
        labelW:    +document.getElementById('sk-lw').value,
        labelH:    +document.getElementById('sk-lh').value,
        gap:       +document.getElementById('sk-gap').value,
        rollWidth: +document.getElementById('sk-rollW').value,
        wastePct:  +document.getElementById('sk-waste').value,
      });
    } else {
      r = P.calculateTickets({
        qty:     +document.getElementById('sk-qty').value,
        ticketW: +document.getElementById('sk-lw').value,
        ticketH: +document.getElementById('sk-lh').value,
        bleed:   +document.getElementById('sk-bleed').value,
        gap:     +document.getElementById('sk-gap').value,
        padSize: +document.getElementById('sk-padSize').value,
        colors:  +document.getElementById('sk-colors').value,
        wastePct:+document.getElementById('sk-waste').value,
        sheet,
      });
    }
    state.sk = r;

    document.getElementById('sk-errors').innerHTML = errBlock(r.errors);

    let kpis = [];
    if (type === 'roll-labels') {
      kpis = [
        { label:'ملصقات بالعرض',      value: fmt(r.layout.labelsAcross) },
        { label:'صفوف على الرول',      value: fmt(r.layout.labelsRows)   },
        { label:'طول نظري (م)',        value: fmtDec(r.roll.baseLenM)    },
        { label:'الهالك (م)',          value: fmtDec(r.roll.wasteLenM)   },
        { label:'إجمالي الرول (م)',    value: fmtDec(r.roll.totalLenM), highlight:true },
      ];
    } else {
      const skSheetArea = sheetW * sheetH;
      const skItemArea  = (r.input?.lw  || r.input?.labelW  || 0) *
                          (r.input?.lh  || r.input?.labelH  || 0) ||
                          (r.input?.ticketW || 0) * (r.input?.ticketH || 0);
      const skUsedArea  = r.impose?.perSheet ? r.impose.perSheet * skItemArea : 0;
      const skUtil      = skSheetArea > 0 ? (skUsedArea / skSheetArea * 100).toFixed(1) : '0.0';
      kpis = [
        { label:'قطع / فرخ',          value: fmt(r.impose.perSheet) },
        { label:'أعمدة × صفوف',       value: `${r.impose.cols}×${r.impose.rows}` },
        ...(type === 'tickets' ? [
          { label:'كتيّبات',           value: fmt(r.pads.totalPads)   },
          { label:'إجمالي الأوراق',    value: fmt(r.pads.totalLeaves) },
        ] : []),
        { label:'أفرخ نظرية',         value: fmt(r.sheets.baseSheets)   },
        { label:'الهالك (أفرخ)',       value: fmt(r.sheets.wasteSheets)  },
        { label:'الإجمالي مع الهالك', value: fmt(r.sheets.totalSheets), highlight:true },
        { label:'استخدام الفرخ',       value: `${skUtil}%` },
      ];
      const imp = document.getElementById('sk-impose');
      if (imp) imp.innerHTML = P.renderStickerSVG(r);
    }
    document.getElementById('sk-kpis').innerHTML = kpiGrid(kpis);
  }

  /* ═══════════════════════════════════════════════════════════════════
     MODULE 5 — Job Tickets
     ═══════════════════════════════════════════════════════════════════ */
  async function renderJobs() {
    root.innerHTML = `
      ${titleBar('🗂️','تذاكر الأعمال',
        'جميع أوامر العمل المحفوظة — مشتركة بين كل الأجهزة على الشبكة.',
        `<button id="jobs-refresh" class="btn btn-ghost">🔄 تحديث</button>`)}

      <div class="panel" id="jobs-container">
        <div class="panel-b text-slate-400 text-sm text-center py-8">جارٍ تحميل التذاكر…</div>
      </div>`;

    document.getElementById('jobs-refresh').addEventListener('click', renderJobs);

    const moduleLabel = m => ({
      notebooks:'سجلات ودفاتر', boxes:'أمبلاجات', cards:'كروت', stickers:'استيكرات'
    })[m] || m || '—';

    const badgeClass = m => ({
      notebooks:'badge-notebooks', boxes:'badge-boxes', cards:'badge-cards', stickers:'badge-stickers'
    })[m] || '';

    const totalFor = j =>
      j.result?.sheets?.totalSheetsWithWaste ??
      j.result?.sheets?.totalSheets ??
      (j.result?.roll?.totalLenM != null ? `${j.result.roll.totalLenM}م` : '—');

    try {
      const jobs = await fetch('/api/jobs').then(r => r.json());
      const con  = document.getElementById('jobs-container');

      if (!jobs.length) {
        con.innerHTML = `<div class="panel-b text-center py-12 text-slate-400">
          <div class="text-4xl mb-3">🗂️</div>
          <div class="font-semibold">لا توجد تذاكر محفوظة بعد</div>
          <div class="text-sm mt-1">احسب عملاً في أيٍّ من الأقسام واضغط «حفظ كتذكرة».</div>
        </div>`;
        return;
      }

      con.innerHTML = `
        <div class="panel-b overflow-x-auto">
          <table class="jobs-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>القسم</th>
                <th>الإجمالي</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${jobs.map(j => `
                <tr>
                  <td class="font-semibold text-navy-900">${escHtml(j.title || '—')}</td>
                  <td><span class="badge ${badgeClass(j.module)}">${moduleLabel(j.module)}</span></td>
                  <td class="font-mono font-bold text-navy-800">${escHtml(String(totalFor(j)))}</td>
                  <td class="text-slate-400 text-xs font-mono whitespace-nowrap">
                    ${new Date(j.createdAt).toLocaleString('en-GB')}
                  </td>
                  <td class="text-left">
                    <button class="btn btn-danger py-1 px-3 text-xs" data-del="${j.id}">حذف</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;

      con.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('حذف هذه التذكرة؟')) return;
          await fetch('/api/jobs/' + btn.dataset.del, { method:'DELETE' });
          toast('تم حذف التذكرة', 'ok');
          renderJobs();
        });
      });
    } catch (e) {
      document.getElementById('jobs-container').innerHTML =
        `<div class="panel-b text-red-500 text-sm py-6 text-center">
           فشل تحميل التذاكر: ${escHtml(e.message)}
         </div>`;
    }
  }

  /* ── Boot ──────────────────────────────────────────────────────────── */
  showRoute('notebooks');
})();
