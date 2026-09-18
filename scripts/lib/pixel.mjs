// Маленький піксельний рушій для генерації спрайтів.
//
// Ідея: предмет описується кількома примітивами з «матеріалом», а об'єм,
// контур і тіні рушій рахує сам. Завдяки цьому всі предмети сцени мають
// однакове освітлення й однакову товщину контуру, а додати новий предмет —
// це 5–10 рядків опису, а не ручне малювання кожного пікселя.
//
// Освітлення завжди з верхнього лівого кута.

import { encodePng } from "./png.mjs";

const EMPTY = -1;
const SHADOW = -2;

/**
 * Матеріал — це рампа з чотирьох відтінків одного кольору:
 * [відблиск, світлий, основний, темний].
 */
export function material(hi, light, base, dark) {
  return { ramp: [hi, light, base, dark] };
}

export function createLayer(width, height) {
  const mat = new Int16Array(width * height).fill(EMPTY);
  const idx = (x, y) => y * width + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < width && y < height;

  const layer = {
    width,
    height,
    mat,

    at(x, y) {
      return inside(x, y) ? mat[idx(x, y)] : EMPTY;
    },

    set(x, y, m) {
      if (inside(x, y)) mat[idx(x, y)] = m;
    },

    rect(x, y, w, h, m) {
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) layer.set(x + dx, y + dy, m);
      }
    },

    /** Прямокутник із піксельно заокругленими кутами. */
    roundRect(x, y, w, h, r, m) {
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          const cx = dx < r ? r - dx : dx >= w - r ? dx - (w - r - 1) : 0;
          const cy = dy < r ? r - dy : dy >= h - r ? dy - (h - r - 1) : 0;
          if (cx * cx + cy * cy > r * r + r) continue;
          layer.set(x + dx, y + dy, m);
        }
      }
    },

    ellipse(cx, cy, rx, ry, m) {
      for (let dy = -ry; dy <= ry; dy += 1) {
        for (let dx = -rx; dx <= rx; dx += 1) {
          if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.02) {
            layer.set(cx + dx, cy + dy, m);
          }
        }
      }
    },

    /** Многокутник за вершинами — для вух, листя, дахів тощо. */
    poly(points, m) {
      const ys = points.map((p) => p[1]);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1) {
        for (let x = 0; x < width; x += 1) {
          let inPoly = false;
          for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
            const [xi, yi] = points[i];
            const [xj, yj] = points[j];
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
              inPoly = !inPoly;
            }
          }
          if (inPoly) layer.set(x, y, m);
        }
      }
    },

    /** М'яка тінь на підлозі під предметом. Малюється під усім іншим. */
    shadow(cx, cy, rx, ry) {
      for (let dy = -ry; dy <= ry; dy += 1) {
        for (let dx = -rx; dx <= rx; dx += 1) {
          if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) > 1) continue;
          if (layer.at(cx + dx, cy + dy) === EMPTY) layer.set(cx + dx, cy + dy, SHADOW);
        }
      }
    },
  };

  return layer;
}

/** Скільки підряд пікселів того самого матеріалу в заданому напрямку (максимум 3). */
function run(layer, x, y, dx, dy, m) {
  let n = 0;
  while (n < 3 && layer.at(x + dx * (n + 1), y + dy * (n + 1)) === m) n += 1;
  return n;
}

/**
 * Перетворює шар на PNG: рахує фаску за освітленням, обводить контуром
 * і дозволяє домалювати дрібні деталі поверх.
 */
export function renderLayer(layer, { outline, scale = 1, details } = {}) {
  const { width, height } = layer;
  const rgba = Buffer.alloc(width * height * 4);

  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= width || y >= height || !color) return;
    const o = (y * width + x) * 4;
    rgba[o] = color[0];
    rgba[o + 1] = color[1];
    rgba[o + 2] = color[2];
    rgba[o + 3] = color.length > 3 ? color[3] : 255;
  };

  // 1. Заливка з фаскою
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const m = layer.at(x, y);
      if (m === EMPTY) continue;
      if (m === SHADOW) {
        put(x, y, [20, 14, 34, 46]);
        continue;
      }

      const mat = renderLayer.materials[m];
      if (!mat) continue;

      const lit = Math.min(run(layer, x, y, 0, -1, m), run(layer, x, y, -1, 0, m));
      const shd = Math.min(run(layer, x, y, 0, 1, m), run(layer, x, y, 1, 0, m));

      let tone = 2;
      if (lit === 0) tone = 0;
      else if (lit === 1) tone = 1;
      else if (shd === 0) tone = 3;

      put(x, y, mat.ramp[tone]);
    }
  }

  // 2. Контур зовні: кожен порожній піксель, що торкається фігури
  const isSolid = (x, y) => {
    const m = layer.at(x, y);
    return m !== EMPTY && m !== SHADOW;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (isSolid(x, y)) continue;
      if (layer.at(x, y) === SHADOW) continue;
      if (isSolid(x - 1, y) || isSolid(x + 1, y) || isSolid(x, y - 1) || isSolid(x, y + 1)) {
        put(x, y, outline);
      }
    }
  }

  // 3. Дрібні деталі поверх: очі, складки, шви, відблиски
  if (details) details({ px: put, layer });

  if (scale === 1) return encodePng(width, height, rgba);

  const bw = width * scale;
  const bh = height * scale;
  const big = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const b = ((y * scale + sy) * bw + x * scale + sx) * 4;
          big[b] = rgba[o];
          big[b + 1] = rgba[o + 1];
          big[b + 2] = rgba[o + 2];
          big[b + 3] = rgba[o + 3];
        }
      }
    }
  }
  return encodePng(bw, bh, big);
}

/** Реєстр матеріалів заповнюється перед рендером. */
renderLayer.materials = [];

export function useMaterials(list) {
  renderLayer.materials = list;
  return list.map((_, i) => i);
}
