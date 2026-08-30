// Генерує PNG-іконки для PWA без зовнішніх залежностей:
// фіолетовий заокруглений квадрат із білою зіркою, згладжування — суперсемплінгом.
//
// Запуск: node scripts/generate-icons.mjs

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BRAND = [0x6c, 0x4c, 0xf2];
const WHITE = [0xff, 0xff, 0xff];
const SUPERSAMPLE = 4;

/* ---------- PNG ---------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBytes, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // фільтр «None»
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // біт на канал
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- Геометрія ---------- */

function insideRoundedRect(x, y, size, radius) {
  const min = radius;
  const max = size - radius;

  const cx = x < min ? min : x > max ? max : x;
  const cy = y < min ? min : y > max ? max : y;

  if (cx === x && cy === y) return true;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function starPolygon(cx, cy, outer, inner, points = 5) {
  const vertices = [];
  const step = Math.PI / points;
  let angle = -Math.PI / 2;

  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    vertices.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    angle += step;
  }
  return vertices;
}

function insidePolygon(x, y, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/* ---------- Малювання ---------- */

function renderIcon(size, { padded = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.23;

  // maskable-іконку малюємо меншою, щоб її не обрізало під час кадрування
  const starScale = padded ? 0.3 : 0.36;
  const star = starPolygon(size / 2, size / 2, size * starScale, size * starScale * 0.42);

  const step = 1 / SUPERSAMPLE;
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let bgHits = 0;
      let starHits = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const px = x + (sx + 0.5) * step;
          const py = y + (sy + 0.5) * step;

          if (insideRoundedRect(px, py, size, radius)) bgHits += 1;
          if (insidePolygon(px, py, star)) starHits += 1;
        }
      }

      const bg = bgHits / samples;
      const st = starHits / samples;
      const offset = (y * size + x) * 4;

      // зірка малюється поверх фону, обидва шари згладжені
      const alpha = Math.max(bg, 0);
      const mix = Math.min(st, alpha);

      rgba[offset] = Math.round(BRAND[0] * (1 - mix) + WHITE[0] * mix);
      rgba[offset + 1] = Math.round(BRAND[1] * (1 - mix) + WHITE[1] * mix);
      rgba[offset + 2] = Math.round(BRAND[2] * (1 - mix) + WHITE[2] * mix);
      rgba[offset + 3] = Math.round(alpha * 255);
    }
  }

  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, padded: false },
  { file: "icon-512.png", size: 512, padded: false },
  { file: "icon-maskable-512.png", size: 512, padded: true },
  { file: "apple-touch-icon.png", size: 180, padded: false },
];

for (const { file, size, padded } of targets) {
  writeFileSync(join(OUT_DIR, file), renderIcon(size, { padded }));
  console.log(`✓ ${file} (${size}×${size})`);
}
