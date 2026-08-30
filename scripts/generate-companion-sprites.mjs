// Генерує ТИМЧАСОВІ піксельні спрайти компаньйона й кімнати.
//
// Це заглушки в потрібному стилі й потрібних розмірах, а не фінальна графіка.
// Замінити готовим малюнком = покласти PNG із тим самим іменем у public/sprites.
// Реєстр у lib/companion/sprites.ts і компоненти при цьому не змінюються.
//
// Запуск: node scripts/generate-companion-sprites.mjs

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createCanvas, drawGrid, encodePng } from "./lib/png.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "sprites");

const SCALE = 4;

/* ---------- Палітра ---------- */

const INK = [43, 35, 56];
const CREAM = [253, 246, 238];
const PINK = [240, 166, 184];

const SPECIES_PALETTE = {
  fox: { B: [169, 123, 216], S: [138, 95, 192] },
  frog: { B: [127, 201, 160], S: [96, 168, 129] },
  cat: { B: [232, 163, 75], S: [200, 130, 48] },
};

/* ---------- Компаньйони ---------- */

// Спільне тіло: рахувати ширину рядків доводиться один раз.
const BODY = [
  "  OBBOOOOOOOOBBO  ",
  " OBBBBBBBBBBBBBBO ",
  "OBBBBBBBBBBBBBBBBO",
  "OBBBBEEBBBBEEBBBBO",
  "OBBBBEEBLLBEEBBBBO",
  "OBBBBBLLLLLLLBBBBO",
  "OBBBLLLLPPLLLLBBBO",
  "OBBLLLLLLLLLLLLBBO",
  "OBBLLLLLLLLLLLLBBO",
  " OBLLLLLLLLLLLLBO ",
  " OBBLLLLLLLLLLBBO ",
  "  OBBBBBBBBBBBBO  ",
  "   OOOOOOOOOOOO   ",
];

const HEADS = {
  fox: ["   OO        OO   ", "  OBBO      OBBO  ", "  OBPO      OBPO  "],
  cat: ["  OO          OO  ", " OBBO        OBBO ", " OBPO        OBPO "],
  frog: ["    OOO    OOO    ", "   OBEBO  OBEBO   ", "   OBBBO  OBBBO   "],
};

function companionGrid(species) {
  // У жабеняти очі на маківці, тому в тілі їх прибираємо.
  const body = species === "frog" ? BODY.map((row) => row.replaceAll("E", "B")) : BODY;
  return [...HEADS[species], ...body];
}

/**
 * Заплющені очі для сонного стану: лишаємо тільки нижній рядок кожного
 * ока — виходить тонка риска замість зіниці.
 */
function closeEyes(grid) {
  return grid.map((row, y) =>
    [...row]
      .map((char, x) => {
        if (char !== "E") return char;
        const below = grid[y + 1]?.[x];
        return below === "E" ? "B" : char;
      })
      .join(""),
  );
}

function renderCompanion(species, sleeping) {
  const palette = SPECIES_PALETTE[species];
  const grid = sleeping ? closeEyes(companionGrid(species)) : companionGrid(species);

  const width = grid[0].length * SCALE;
  const height = grid.length * SCALE;
  const canvas = createCanvas(width, height);

  drawGrid(
    canvas,
    grid,
    { O: INK, B: palette.B, S: palette.S, L: CREAM, P: PINK, E: INK },
    0,
    0,
    SCALE,
  );

  return canvas.toPng();
}

/* ---------- Предмети кімнати ---------- */

/** Малює на маленькому полотні, потім збільшує — так пікселі лишаються чіткими. */
function pixelArt(w, h, draw) {
  const small = createCanvas(w, h);
  draw(small);

  const big = createCanvas(w * SCALE, h * SCALE);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const o = (y * w + x) * 4;
      const color = [small.rgba[o], small.rgba[o + 1], small.rgba[o + 2], small.rgba[o + 3]];
      if (color[3] === 0) continue;
      big.rect(x * SCALE, y * SCALE, SCALE, SCALE, color);
    }
  }
  return encodePng(big.width, big.height, big.rgba);
}

const WOOD = [166, 116, 72];
const WOOD_DARK = [124, 84, 50];
const LILAC = [169, 123, 216];
const MINT = [127, 201, 160];
const TEAL = [96, 190, 190];
const LEAF = [86, 165, 96];
const GOLD = [240, 197, 88];

const ITEMS = {
  "bed-simple": () =>
    pixelArt(28, 14, (c) => {
      c.box(1, 5, 26, 8, LILAC, INK);
      c.box(2, 3, 9, 5, CREAM, INK);
    }),

  "bed-wooden": () =>
    pixelArt(28, 18, (c) => {
      c.box(0, 2, 5, 15, WOOD, INK);
      c.box(23, 5, 5, 12, WOOD, INK);
      c.box(3, 8, 22, 8, LILAC, INK);
      c.box(4, 6, 9, 5, CREAM, INK);
      c.rect(3, 16, 22, 1, WOOD_DARK);
    }),

  "bed-canopy": () =>
    pixelArt(28, 24, (c) => {
      c.box(1, 0, 26, 4, TEAL, INK);
      c.box(1, 3, 3, 20, WOOD, INK);
      c.box(24, 3, 3, 20, WOOD, INK);
      c.box(4, 13, 20, 9, LILAC, INK);
      c.box(5, 11, 8, 5, CREAM, INK);
    }),

  "rug-star": () =>
    pixelArt(24, 10, (c) => {
      c.ellipse(12, 5, 11, 4, TEAL);
      c.ellipse(12, 5, 9, 3, CREAM);
      c.rect(10, 3, 5, 1, GOLD);
      c.rect(9, 4, 7, 2, GOLD);
      c.rect(10, 6, 5, 1, GOLD);
    }),

  "rug-round": () =>
    pixelArt(20, 12, (c) => {
      c.ellipse(10, 6, 9, 5, LILAC);
      c.ellipse(10, 6, 6, 3, CREAM);
      c.ellipse(10, 6, 3, 1, PINK);
    }),

  "plant-pot": () =>
    pixelArt(14, 20, (c) => {
      c.box(3, 13, 8, 7, LILAC, INK);
      c.rect(6, 8, 2, 6, LEAF);
      c.ellipse(4, 8, 3, 3, LEAF);
      c.ellipse(10, 9, 3, 3, LEAF);
      c.ellipse(7, 4, 4, 4, LEAF);
    }),

  "plant-hanging": () =>
    pixelArt(14, 18, (c) => {
      c.rect(6, 0, 2, 4, WOOD_DARK);
      c.box(3, 4, 8, 5, TEAL, INK);
      c.ellipse(4, 11, 2, 4, LEAF);
      c.ellipse(7, 13, 2, 5, LEAF);
      c.ellipse(10, 11, 2, 4, LEAF);
    }),

  "toy-ball": () =>
    pixelArt(12, 12, (c) => {
      c.ellipse(6, 6, 5, 5, INK);
      c.ellipse(6, 6, 4, 4, CREAM);
      c.rect(2, 5, 9, 2, PINK);
      c.rect(5, 2, 2, 9, TEAL);
    }),

  "toy-blocks": () =>
    pixelArt(16, 12, (c) => {
      c.box(1, 6, 6, 6, PINK, INK);
      c.box(8, 6, 6, 6, TEAL, INK);
      c.box(4, 0, 6, 6, GOLD, INK);
    }),

  "picture-mountains": () =>
    pixelArt(14, 12, (c) => {
      c.box(0, 0, 14, 12, CREAM, INK);
      c.rect(2, 2, 10, 8, [180, 214, 240]);
      c.ellipse(4, 8, 4, 4, MINT);
      c.ellipse(9, 8, 4, 4, MINT);
      c.ellipse(10, 4, 1, 1, GOLD);
    }),

  "picture-stars": () =>
    pixelArt(14, 12, (c) => {
      c.box(0, 0, 14, 12, CREAM, INK);
      c.rect(2, 2, 10, 8, [58, 49, 99]);
      c.rect(4, 4, 1, 1, GOLD);
      c.rect(8, 3, 1, 1, GOLD);
      c.rect(6, 7, 1, 1, GOLD);
      c.rect(10, 6, 1, 1, GOLD);
    }),

  "shelf-books": () =>
    pixelArt(20, 12, (c) => {
      c.rect(0, 9, 20, 2, WOOD);
      c.rect(0, 11, 20, 1, WOOD_DARK);
      c.box(2, 2, 3, 7, PINK, INK);
      c.box(5, 3, 3, 6, TEAL, INK);
      c.box(8, 1, 3, 8, GOLD, INK);
      c.box(11, 4, 3, 5, LILAC, INK);
    }),

  "shelf-friend": () =>
    pixelArt(20, 14, (c) => {
      c.rect(0, 11, 20, 2, WOOD);
      c.rect(0, 13, 20, 1, WOOD_DARK);
      c.box(2, 4, 3, 7, PINK, INK);
      c.box(5, 5, 3, 6, GOLD, INK);
      c.ellipse(14, 7, 4, 4, [110, 160, 220]);
      c.ellipse(14, 9, 3, 3, CREAM);
      c.rect(12, 5, 1, 1, INK);
      c.rect(16, 5, 1, 1, INK);
    }),

  "food-bowl": () =>
    pixelArt(14, 9, (c) => {
      c.ellipse(7, 4, 6, 3, WOOD_DARK);
      c.box(1, 4, 12, 5, TEAL, INK);
      c.rect(5, 2, 2, 2, WOOD_DARK);
      c.rect(8, 3, 2, 1, WOOD_DARK);
    }),
};

/* ---------- Запис ---------- */

mkdirSync(join(OUT, "companion"), { recursive: true });
mkdirSync(join(OUT, "room"), { recursive: true });

let count = 0;

for (const species of Object.keys(SPECIES_PALETTE)) {
  writeFileSync(join(OUT, "companion", `${species}-idle.png`), renderCompanion(species, false));
  writeFileSync(join(OUT, "companion", `${species}-sleep.png`), renderCompanion(species, true));
  count += 2;
}

for (const [id, draw] of Object.entries(ITEMS)) {
  writeFileSync(join(OUT, "room", `${id}.png`), draw());
  count += 1;
}

console.log(`✓ згенеровано ${count} тимчасових спрайтів у public/sprites`);
