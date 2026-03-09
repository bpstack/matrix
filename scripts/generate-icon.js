/**
 * Generates a simple Matrix app icon (ICO format with 16x16, 32x32, 48x48 sizes).
 * Uses raw BMP format embedded in ICO — no external dependencies.
 */

const fs = require('fs');
const path = require('path');

// Colors (BGR for BMP): dark background #111111, accent #6366f1 (indigo)
const BG = [0x11, 0x11, 0x11];
const FG = [0xf1, 0x66, 0x63]; // BGR order

function drawM(pixels, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  const s = size / 16; // scale factor

  // Draw letter M pattern (scaled)
  for (let row = 3; row < 13; row++) {
    const r = Math.round(row * s);
    const rEnd = Math.round((row + 1) * s);

    const cols = [];
    // Left stem
    for (let c = 2; c < 4; c++) cols.push(c);
    // Right stem
    for (let c = 10; c < 12; c++) cols.push(c);

    // Top diagonals
    if (row >= 3 && row <= 7) {
      const mid = Math.round(3 + (row - 3));
      cols.push(mid + 1, mid + 2);
      const mirr = 12 - (row - 3);
      cols.push(mirr - 2, mirr - 1);
    }

    for (const col of cols) {
      const cStart = Math.round(col * s);
      const cEnd = Math.round((col + 1) * s);
      for (let pr = r; pr < Math.min(rEnd, size); pr++) {
        for (let pc = cStart; pc < Math.min(cEnd, size); pc++) {
          if (pr >= 0 && pr < size && pc >= 0 && pc < size) {
            grid[pr][pc] = 1;
          }
        }
      }
    }
  }
  return grid;
}

function createBMP(size) {
  const grid = drawM(null, size);
  const rowSize = Math.ceil((size * 24) / 32) * 4; // 24-bit, padded to 4 bytes
  const pixelDataSize = rowSize * size;
  const bmpSize = 40 + pixelDataSize; // BITMAPINFOHEADER + pixels (no file header for ICO)

  const buf = Buffer.alloc(bmpSize);
  let o = 0;

  // BITMAPINFOHEADER (40 bytes) — height is 2*size for ICO (includes AND mask)
  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(size, o); o += 4;
  buf.writeInt32LE(size * 2, o); o += 4; // doubled for ICO
  buf.writeUInt16LE(1, o); o += 2;   // planes
  buf.writeUInt16LE(24, o); o += 2;  // bit count
  buf.writeUInt32LE(0, o); o += 4;   // compression
  buf.writeUInt32LE(pixelDataSize, o); o += 4;
  buf.writeInt32LE(0, o); o += 4;
  buf.writeInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;

  // Pixel data (bottom-up)
  const m = drawM(null, size);
  for (let row = size - 1; row >= 0; row--) {
    const rowBase = o;
    for (let col = 0; col < size; col++) {
      const color = m[row][col] ? FG : BG;
      buf[o++] = color[0];
      buf[o++] = color[1];
      buf[o++] = color[2];
    }
    // pad row to 4-byte boundary
    const written = size * 3;
    const pad = rowSize - written;
    o += pad;
  }

  return buf;
}

// Fix: drawM needs to return the grid directly
function drawMFixed(size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  const s = size / 16;

  for (let row = 0; row < size; row++) {
    const logicalRow = row / s;

    // Left stem columns 2-3
    if (logicalRow >= 3 && logicalRow < 13) {
      const c1 = Math.round(2 * s);
      const c2 = Math.round(4 * s);
      for (let c = c1; c < c2; c++) grid[row][c] = 1;
    }

    // Right stem columns 10-11
    if (logicalRow >= 3 && logicalRow < 13) {
      const c1 = Math.round(10 * s);
      const c2 = Math.round(12 * s);
      for (let c = c1; c < c2; c++) grid[row][c] = 1;
    }

    // Left diagonal (3,3)→(7,7)
    if (logicalRow >= 3 && logicalRow < 8) {
      const progress = (logicalRow - 3) / 4;
      const cStart = Math.round((3 + progress * 4) * s);
      const cEnd = cStart + Math.max(1, Math.round(2 * s));
      for (let c = cStart; c < Math.min(cEnd, size); c++) grid[row][c] = 1;
    }

    // Right diagonal (3,12)→(7,8)
    if (logicalRow >= 3 && logicalRow < 8) {
      const progress = (logicalRow - 3) / 4;
      const cEnd = Math.round((13 - progress * 4) * s);
      const cStart = cEnd - Math.max(1, Math.round(2 * s));
      for (let c = Math.max(0, cStart); c < Math.min(cEnd, size); c++) grid[row][c] = 1;
    }
  }

  return grid;
}

function createBMPFixed(size) {
  const rowSize = Math.ceil((size * 24) / 32) * 4;
  const pixelDataSize = rowSize * size;
  const bmpSize = 40 + pixelDataSize;

  const buf = Buffer.alloc(bmpSize, 0);
  let o = 0;

  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(size, o); o += 4;
  buf.writeInt32LE(size * 2, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(24, o); o += 2;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(pixelDataSize, o); o += 4;
  o += 16; // remaining header fields

  const grid = drawMFixed(size);

  for (let row = size - 1; row >= 0; row--) {
    for (let col = 0; col < size; col++) {
      const color = grid[row][col] ? FG : BG;
      buf[o++] = color[0];
      buf[o++] = color[1];
      buf[o++] = color[2];
    }
    const pad = rowSize - size * 3;
    o += pad;
  }

  return buf;
}

function createICO(sizes) {
  const bmps = sizes.map(s => createBMPFixed(s));

  // AND mask: all zeros (fully opaque) per image
  const andMasks = sizes.map(s => {
    const andRowSize = Math.ceil(s / 32) * 4;
    return Buffer.alloc(andRowSize * s, 0);
  });

  const headerSize = 6 + sizes.length * 16;
  let offset = headerSize;

  // Build directory
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type: ICO
  header.writeUInt16LE(sizes.length, 4);

  const chunks = [];
  sizes.forEach((s, i) => {
    const totalSize = bmps[i].length + andMasks[i].length;
    const dirOffset = 6 + i * 16;
    header.writeUInt8(s === 256 ? 0 : s, dirOffset);      // width
    header.writeUInt8(s === 256 ? 0 : s, dirOffset + 1);  // height
    header.writeUInt8(0, dirOffset + 2);  // color count
    header.writeUInt8(0, dirOffset + 3);  // reserved
    header.writeUInt16LE(1, dirOffset + 4);   // planes
    header.writeUInt16LE(24, dirOffset + 6);  // bit count
    header.writeUInt32LE(totalSize, dirOffset + 8);
    header.writeUInt32LE(offset, dirOffset + 12);
    offset += totalSize;
    chunks.push(bmps[i], andMasks[i]);
  });

  return Buffer.concat([header, ...chunks]);
}

const outPath = path.join(__dirname, '../assets/icon.ico');
const ico = createICO([16, 32, 48]);
fs.writeFileSync(outPath, ico);
console.log(`Icon written to ${outPath} (${ico.length} bytes)`);
