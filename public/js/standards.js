/**
 * Standards Library — paper sizes (mm) and common raw printing sheets (mm).
 * All sizes are stored as { w, h } in millimetres, portrait-by-convention.
 */
window.PETSHROW = window.PETSHROW || {};

window.PETSHROW.PAGE_SIZES = [
  { id: 'A3',  name: 'A3',  w: 297, h: 420 },
  { id: 'A4',  name: 'A4',  w: 210, h: 297 },
  { id: 'A5',  name: 'A5',  w: 148, h: 210 },
  { id: 'A6',  name: 'A6',  w: 105, h: 148 },
  { id: 'B4',  name: 'B4',  w: 250, h: 353 },
  { id: 'B5',  name: 'B5',  w: 176, h: 250 },
  { id: 'LTR', name: 'Letter', w: 216, h: 279 },
];

window.PETSHROW.SHEET_SIZES = [
  { id: 'S60x90', name: '60×90', w: 600, h: 900 },
  { id: 'S70x100', name: '70×100', w: 700, h: 1000 },
  { id: 'S65x90',  name: '65×90',  w: 650, h: 900 },
  { id: 'S50x70',  name: '50×70',  w: 500, h: 700 },
  { id: 'S43x61',  name: '43×61',  w: 430, h: 610 },
  { id: 'S33x48',  name: '33×48',  w: 330, h: 480 },
];

/** Common signature sizes used in book binding (pages per signature). */
window.PETSHROW.SIGNATURE_SIZES = [4, 8, 16, 32];
