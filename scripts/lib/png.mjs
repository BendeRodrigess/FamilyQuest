// Мінімальний кодувальник PNG на вбудованому zlib.
// Використовується генераторами іконок PWA і спрайтів компаньйона —
// щоб не тягнути залежність заради запису кількох картинок.

import { deflateSync } from "node:zlib";

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
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** rgba — Buffer завдовжки width * height * 4. */
export function encodePng(width, height, rgba) {
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

/** Полотно з попіксельним доступом і прозорим тлом. */
export function createCanvas(width, height) {
  const rgba = Buffer.alloc(width * height * 4);

  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (!color) return;
    const o = (y * width + x) * 4;
    rgba[o] = color[0];
    rgba[o + 1] = color[1];
    rgba[o + 2] = color[2];
    rgba[o + 3] = color.length > 3 ? color[3] : 255;
  };

  return {
    width,
    height,
    rgba,
    set,
    rect(x, y, w, h, color) {
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) set(x + dx, y + dy, color);
      }
    },
    /** Заповнений прямокутник із контуром завтовшки 1 піксель. */
    box(x, y, w, h, fill, outline) {
      this.rect(x, y, w, h, fill);
      for (let dx = 0; dx < w; dx += 1) {
        set(x + dx, y, outline);
        set(x + dx, y + h - 1, outline);
      }
      for (let dy = 0; dy < h; dy += 1) {
        set(x, y + dy, outline);
        set(x + w - 1, y + dy, outline);
      }
    },
    ellipse(cx, cy, rx, ry, color) {
      for (let y = -ry; y <= ry; y += 1) {
        for (let x = -rx; x <= rx; x += 1) {
          if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) set(cx + x, cy + y, color);
        }
      }
    },
    toPng() {
      return encodePng(width, height, rgba);
    },
  };
}

/**
 * Малює спрайт із текстової сітки: кожен символ — піксель, пробіл прозорий.
 * Так простіші форми лишаються читабельними прямо в коді.
 */
export function drawGrid(canvas, grid, palette, offsetX = 0, offsetY = 0, scale = 1) {
  grid.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const color = palette[char];
      if (!color) return;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          canvas.set(offsetX + x * scale + sx, offsetY + y * scale + sy, color);
        }
      }
    });
  });
}
