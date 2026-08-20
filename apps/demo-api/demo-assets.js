/**
 * Génération des fichiers de DÉMONSTRATION (images PNG + PDF).
 * Aucun rendu réaliste d’un document officiel : maquette neutre marquée
 * « DOCUMENT DEMO / NON VALABLE », uniquement destinée à tester
 * l’aperçu, l’ouverture et la validation côté administration.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

/* ------------------------------------------------------------------ */
/* Police bitmap 5x7 (majuscules ASCII) — évite toute dépendance      */
/* ------------------------------------------------------------------ */

const FONT = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.###.",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "#####|..#..|..#..|..#..|..#..|..#..|#####",
  J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#...#|#...#|#...#|#...#",
  N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
  R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.",
  T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#",
  X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  1: "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  2: ".###.|#...#|....#|...#.|..#..|.#...|#####",
  3: "#####|...#.|..#..|...#.|....#|#...#|.###.",
  4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  5: "#####|#....|####.|....#|....#|#...#|.###.",
  6: "..##.|.#...|#....|####.|#...#|#...#|.###.",
  7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
  8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  9: ".###.|#...#|#...#|.####|....#|...#.|.##..",
  "-": ".....|.....|.....|#####|.....|.....|.....",
  ".": ".....|.....|.....|.....|.....|.##..|.##..",
  ",": ".....|.....|.....|.....|.##..|.##..|.#...",
  ":": ".....|.##..|.##..|.....|.##..|.##..|.....",
  "/": "....#|...#.|...#.|..#..|.#...|.#...|#....",
  "(": "..##.|.#...|#....|#....|#....|.#...|..##.",
  ")": ".##..|...#.|....#|....#|....#|...#.|.##..",
  "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "#": ".#.#.|#####|.#.#.|.#.#.|#####|.#.#.|.....",
  "*": ".....|#.#.#|.###.|#####|.###.|#.#.#|.....",
  "?": ".###.|#...#|....#|..##.|..#..|.....|..#..",
  "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
  " ": ".....|.....|.....|.....|.....|.....|.....",
};

const GLYPH_W = 5;
const GLYPH_H = 7;

function asciiUpper(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[«»"]/g, " ")
    .replace(/—|–/g, "-")
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Bitmap RGB + encodage PNG                                          */
/* ------------------------------------------------------------------ */

function createBitmap(width, height, color) {
  const data = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 3] = color[0];
    data[i * 3 + 1] = color[1];
    data[i * 3 + 2] = color[2];
  }
  return { width, height, data };
}

function setPixel(bmp, x, y, color) {
  if (x < 0 || y < 0 || x >= bmp.width || y >= bmp.height) return;
  const idx = (y * bmp.width + x) * 3;
  bmp.data[idx] = color[0];
  bmp.data[idx + 1] = color[1];
  bmp.data[idx + 2] = color[2];
}

function fillRect(bmp, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      setPixel(bmp, x + dx, y + dy, color);
    }
  }
}

function strokeRect(bmp, x, y, w, h, thickness, color) {
  fillRect(bmp, x, y, w, thickness, color);
  fillRect(bmp, x, y + h - thickness, w, thickness, color);
  fillRect(bmp, x, y, thickness, h, color);
  fillRect(bmp, x + w - thickness, y, thickness, h, color);
}

function textWidth(text, scale, spacing = 1) {
  const chars = asciiUpper(text).length;
  if (chars === 0) return 0;
  return chars * (GLYPH_W + spacing) * scale - spacing * scale;
}

function drawText(bmp, x, y, text, scale, color, spacing = 1) {
  let cursor = x;
  for (const char of asciiUpper(text)) {
    const glyph = FONT[char] || FONT[" "];
    const rows = glyph.split("|");
    for (let ry = 0; ry < GLYPH_H; ry += 1) {
      for (let rx = 0; rx < GLYPH_W; rx += 1) {
        if (rows[ry][rx] !== "#") continue;
        fillRect(bmp, cursor + rx * scale, y + ry * scale, scale, scale, color);
      }
    }
    cursor += (GLYPH_W + spacing) * scale;
  }
  return cursor;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePng(bmp) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(bmp.width, 0);
  ihdr.writeUInt32BE(bmp.height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(bmp.height * (bmp.width * 3 + 1));
  for (let y = 0; y < bmp.height; y += 1) {
    const rowStart = y * (bmp.width * 3 + 1);
    raw[rowStart] = 0; // filtre None
    bmp.data.copy(
      raw,
      rowStart + 1,
      y * bmp.width * 3,
      (y + 1) * bmp.width * 3,
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Maquettes                                                          */
/* ------------------------------------------------------------------ */

const PALETTE = {
  paper: [246, 247, 249],
  ink: [31, 41, 55],
  muted: [107, 114, 128],
  accent: [15, 118, 110],
  warn: [180, 83, 9],
  watermark: [222, 226, 232],
  border: [148, 163, 184],
};

function drawWatermark(bmp) {
  for (let y = 0; y < bmp.height; y += 1) {
    for (let x = 0; x < bmp.width; x += 1) {
      if ((x + y) % 34 < 3) setPixel(bmp, x, y, PALETTE.watermark);
    }
  }
}

/**
 * Image de démonstration : bandeau, libellés, mention NON VALABLE.
 * @param {{title:string, subtitle?:string, lines?:string[], tone?:"accent"|"warn", note?:string}} spec
 */
function buildDemoImage(spec) {
  const width = 1000;
  const height = 640;
  const bmp = createBitmap(width, height, PALETTE.paper);
  drawWatermark(bmp);

  // Zone document
  fillRect(bmp, 40, 40, width - 80, height - 80, [255, 255, 255]);
  strokeRect(bmp, 40, 40, width - 80, height - 80, 3, PALETTE.border);

  const tone = spec.tone === "warn" ? PALETTE.warn : PALETTE.accent;
  fillRect(bmp, 40, 40, width - 80, 78, tone);
  drawText(bmp, 70, 66, "DEMEURE GUINEE - DOCUMENT DEMO", 4, [255, 255, 255]);

  let y = 160;
  drawText(bmp, 70, y, spec.title, 5, PALETTE.ink);
  y += 60;
  if (spec.subtitle) {
    drawText(bmp, 70, y, spec.subtitle, 3, PALETTE.muted);
    y += 44;
  }

  fillRect(bmp, 70, y, width - 140, 2, PALETTE.border);
  y += 26;

  for (const line of spec.lines || []) {
    drawText(bmp, 70, y, line, 3, PALETTE.ink);
    y += 34;
  }

  const banner = "NON VALABLE - DONNEE FICTIVE";
  const bannerScale = 4;
  const bannerW = textWidth(banner, bannerScale);
  fillRect(bmp, 60, height - 168, width - 120, 62, [254, 243, 199]);
  strokeRect(bmp, 60, height - 168, width - 120, 62, 2, PALETTE.warn);
  drawText(
    bmp,
    Math.max(70, Math.floor((width - bannerW) / 2)),
    height - 150,
    banner,
    bannerScale,
    PALETTE.warn,
  );

  drawText(
    bmp,
    70,
    height - 86,
    spec.note || "MAQUETTE DE TEST - VERIFICATION INTERNE DEMEURE GUINEE",
    2,
    PALETTE.muted,
  );

  return encodePng(bmp);
}

/* ------------------------------------------------------------------ */
/* PDF minimal (Helvetica, sans dépendance)                           */
/* ------------------------------------------------------------------ */

function pdfEscape(text) {
  return asciiUpper(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * PDF de démonstration d’une page.
 * @param {{title:string, subtitle?:string, lines?:string[], note?:string}} spec
 */
function buildDemoPdf(spec) {
  const commands = [];
  commands.push("0.06 0.46 0.43 rg");
  commands.push("40 742 515 60 re f");
  commands.push("1 1 1 rg");
  commands.push(`BT /F1 18 Tf 60 762 Td (${pdfEscape("DEMEURE GUINEE - DOCUMENT DEMO")}) Tj ET`);
  commands.push("0.12 0.16 0.22 rg");
  commands.push(`BT /F1 22 Tf 60 690 Td (${pdfEscape(spec.title)}) Tj ET`);

  let y = 655;
  if (spec.subtitle) {
    commands.push("0.42 0.45 0.5 rg");
    commands.push(`BT /F1 13 Tf 60 ${y} Td (${pdfEscape(spec.subtitle)}) Tj ET`);
    y -= 30;
  }
  commands.push("0.58 0.64 0.71 RG 1 w");
  commands.push(`60 ${y} m 555 ${y} l S`);
  y -= 32;

  commands.push("0.12 0.16 0.22 rg");
  for (const line of spec.lines || []) {
    commands.push(`BT /F1 12 Tf 60 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= 24;
  }

  commands.push("1 0.95 0.78 rg");
  commands.push("60 180 495 54 re f");
  commands.push("0.71 0.33 0.04 rg");
  commands.push(`BT /F1 18 Tf 90 200 Td (${pdfEscape("NON VALABLE - DONNEE FICTIVE")}) Tj ET`);
  commands.push("0.42 0.45 0.5 rg");
  commands.push(
    `BT /F1 10 Tf 60 140 Td (${pdfEscape(
      spec.note || "Maquette de test - verification interne Demeure Guinee",
    )}) Tj ET`,
  );

  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

/* ------------------------------------------------------------------ */
/* Écriture idempotente                                               */
/* ------------------------------------------------------------------ */

/**
 * Crée le fichier s’il est absent (ou vide) et renvoie ses métadonnées.
 * Un fichier déjà présent n’est jamais réécrit : les vérifications admin
 * restent stables entre deux redémarrages.
 */
function ensureDemoFile(dir, fileName, spec) {
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, fileName);
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  let stat = fs.existsSync(target) ? fs.statSync(target) : null;
  if (!stat || stat.size === 0) {
    const buffer = isPdf ? buildDemoPdf(spec) : buildDemoImage(spec);
    fs.writeFileSync(target, buffer);
    stat = fs.statSync(target);
  }
  return {
    fileName,
    filePath: target,
    mimeType: isPdf ? "application/pdf" : "image/png",
    fileSize: stat.size,
  };
}

module.exports = {
  buildDemoImage,
  buildDemoPdf,
  ensureDemoFile,
};
