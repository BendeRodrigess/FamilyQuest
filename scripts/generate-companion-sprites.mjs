// Генерує спрайти компаньйона й кімнати.
//
// Предмети описані примітивами з матеріалів; об'єм, контур і тіні рахує
// рушій у scripts/lib/pixel.mjs. Тому додати новий предмет — це кілька
// рядків опису, а не ручне малювання кожного пікселя.
//
// Це все ще тимчасова графіка: замінити готовим малюнком = покласти PNG
// із тим самим іменем у public/sprites. Реєстр і компоненти не змінюються.
//
// Запуск: npm run sprites

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createCanvas, encodePng } from "./lib/png.mjs";
import { createLayer, material, renderLayer } from "./lib/pixel.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "sprites");

const SCALE = 3;
const INK = [36, 29, 51];

/* ============================================================
   Палітра. Кожен матеріал — чотири відтінки:
   [відблиск, світлий, основний, темний].
   ============================================================ */

const PALETTE = {
  wood: material([214, 166, 116], [188, 139, 92], [158, 112, 71], [118, 80, 50]),
  woodDark: material([160, 116, 76], [134, 95, 60], [108, 74, 46], [78, 52, 32]),
  mattress: material([255, 252, 246], [246, 236, 219], [226, 210, 187], [188, 170, 145]),
  pillow: material([255, 255, 255], [246, 247, 253], [226, 228, 241], [186, 189, 210]),
  blanket: material([214, 188, 246], [184, 146, 232], [152, 110, 210], [112, 76, 162]),
  canopy: material([176, 232, 226], [126, 203, 197], [88, 165, 160], [58, 118, 114]),
  bowl: material([176, 234, 229], [120, 200, 194], [78, 163, 158], [46, 112, 108]),
  food: material([204, 150, 92], [172, 118, 66], [136, 90, 48], [96, 62, 32]),
  pot: material([236, 168, 124], [210, 136, 92], [174, 104, 68], [128, 72, 46]),
  leaf: material([172, 224, 142], [126, 194, 106], [88, 150, 76], [58, 106, 52]),
  leafDark: material([132, 194, 110], [98, 160, 84], [68, 120, 60], [44, 84, 40]),
  pink: material([255, 200, 214], [248, 166, 188], [216, 128, 152], [162, 88, 110]),
  teal: material([168, 228, 224], [116, 194, 190], [76, 156, 152], [48, 106, 102]),
  gold: material([255, 226, 148], [244, 200, 96], [210, 162, 58], [156, 116, 36]),
  cream: material([255, 250, 242], [248, 236, 218], [228, 210, 186], [190, 170, 146]),
  paper: material([255, 253, 248], [246, 240, 228], [224, 216, 200], [184, 175, 158]),
  sky: material([206, 232, 250], [172, 210, 240], [132, 178, 218], [92, 134, 174]),
  night: material([92, 82, 146], [70, 62, 118], [52, 45, 92], [34, 29, 64]),
  penguin: material([150, 190, 240], [112, 156, 214], [78, 120, 178], [50, 84, 132]),

  // Шерсть компаньйонів
  furFox: material([214, 182, 244], [186, 146, 226], [154, 110, 200], [112, 76, 154]),
  furCat: material([250, 206, 146], [240, 178, 104], [208, 142, 70], [154, 100, 46]),
  furFrog: material([180, 230, 186], [136, 202, 152], [98, 166, 118], [64, 120, 82]),
};

const ID = {};
renderLayer.materials = Object.keys(PALETTE).map((key, i) => {
  ID[key] = i;
  return PALETTE[key];
});

const png = (layer, details) => renderLayer(layer, { outline: INK, scale: SCALE, details });

/* ============================================================
   Компаньйон
   ============================================================ */

const SPECIES = {
  fox: { fur: "furFox", ears: "pointy" },
  cat: { fur: "furCat", ears: "triangle" },
  frog: { fur: "furFrog", ears: "round" },
};

function drawEars(L, fur, style) {
  if (style === "pointy") {
    L.poly(
      [
        [9, 11],
        [7, 1],
        [15, 8],
      ],
      fur,
    );
    L.poly(
      [
        [27, 11],
        [29, 1],
        [21, 8],
      ],
      fur,
    );
  } else if (style === "triangle") {
    L.poly(
      [
        [9, 11],
        [8, 3],
        [16, 9],
      ],
      fur,
    );
    L.poly(
      [
        [27, 11],
        [28, 3],
        [20, 9],
      ],
      fur,
    );
  } else {
    L.ellipse(9, 7, 4, 4, fur);
    L.ellipse(27, 7, 4, 4, fur);
  }
}

function drawInnerEars(L, style) {
  if (style === "round") {
    L.ellipse(9, 7, 2, 2, ID.pink);
    L.ellipse(27, 7, 2, 2, ID.pink);
  } else {
    L.poly(
      [
        [10, 10],
        [9, 4],
        [14, 8],
      ],
      ID.pink,
    );
    L.poly(
      [
        [26, 10],
        [27, 4],
        [22, 8],
      ],
      ID.pink,
    );
  }
}

/** Компаньйон сидить: вигляд спереду. */
function companionIdle(speciesId) {
  const { fur: furName, ears } = SPECIES[speciesId];
  const fur = ID[furName];
  const L = createLayer(36, 36);

  L.shadow(18, 32, 12, 3);

  // хвіст із-за спини
  L.ellipse(30, 27, 5, 4, fur);

  // тулуб і світле черевце
  L.ellipse(18, 25, 11, 9, fur);
  L.ellipse(18, 27, 7, 6, ID.cream);

  // задні лапки
  L.ellipse(10, 32, 4, 2, ID.cream);
  L.ellipse(26, 32, 4, 2, ID.cream);

  // передні лапки
  L.ellipse(13, 30, 3, 2, ID.cream);
  L.ellipse(23, 30, 3, 2, ID.cream);

  drawEars(L, fur, ears);
  L.ellipse(18, 14, 11, 9, fur);
  drawInnerEars(L, ears);

  // мордочка
  L.ellipse(18, 18, 6, 4, ID.cream);

  return png(L, ({ px }) => {
    const eye = INK;
    const white = [255, 255, 255];

    // очі з відблиском
    for (const cx of [13, 23]) {
      px(cx, 13, eye);
      px(cx + 1, 13, eye);
      px(cx - 1, 14, eye);
      px(cx, 14, eye);
      px(cx + 1, 14, eye);
      px(cx + 2, 14, eye);
      px(cx, 15, eye);
      px(cx + 1, 15, eye);
      px(cx, 13, white);
      px(cx + 1, 16, [90, 74, 120]);
    }

    // щічки
    for (const cx of [9, 26]) {
      px(cx, 17, [246, 166, 188]);
      px(cx + 1, 17, [246, 166, 188]);
      px(cx, 18, [232, 146, 170]);
    }

    // носик і усмішка
    px(18, 17, [214, 126, 150]);
    px(17, 17, [214, 126, 150]);
    px(18, 18, [138, 74, 92]);
    px(17, 19, [138, 74, 92]);
    px(16, 19, [138, 74, 92]);
    px(19, 19, [138, 74, 92]);
    px(20, 19, [138, 74, 92]);

    // пальчики на лапках
    for (const cx of [13, 23]) {
      px(cx - 1, 31, [198, 178, 152]);
      px(cx + 1, 31, [198, 178, 152]);
    }
  });
}

/** Компаньйон лежить — поза для сну на ліжку. */
function companionSleep(speciesId) {
  const { fur: furName, ears } = SPECIES[speciesId];
  const fur = ID[furName];
  const L = createLayer(40, 22);

  // хвіст калачиком
  L.ellipse(33, 15, 6, 4, fur);
  // тулуб
  L.ellipse(21, 14, 13, 6, fur);
  L.ellipse(21, 16, 9, 4, ID.cream);
  // голова
  if (ears === "round") {
    L.ellipse(8, 8, 4, 3, fur);
    L.ellipse(16, 8, 4, 3, fur);
  } else {
    L.poly(
      [
        [7, 11],
        [5, 3],
        [12, 9],
      ],
      fur,
    );
    L.poly(
      [
        [17, 11],
        [19, 3],
        [13, 9],
      ],
      fur,
    );
  }
  L.ellipse(12, 11, 8, 7, fur);
  L.ellipse(12, 14, 5, 3, ID.cream);

  return png(L, ({ px }) => {
    // заплющені очі — дві дужки
    for (const cx of [8, 16]) {
      px(cx - 1, 11, INK);
      px(cx, 12, INK);
      px(cx + 1, 12, INK);
      px(cx + 2, 11, INK);
    }
    px(12, 14, [214, 126, 150]);
    px(11, 14, [214, 126, 150]);
    // щічки
    px(6, 13, [246, 166, 188]);
    px(18, 13, [246, 166, 188]);
  });
}

/** «Zzz» піксельним шрифтом. */
function zzz() {
  const L = createLayer(18, 16);
  const draw = (x, y, size, m) => {
    for (let i = 0; i < size; i += 1) {
      L.set(x + i, y, m);
      L.set(x + i, y + size - 1, m);
      L.set(x + size - 1 - i, y + i, m);
    }
  };
  draw(1, 9, 5, ID.teal);
  draw(7, 5, 4, ID.teal);
  draw(12, 1, 4, ID.teal);
  return png(L);
}

/* ============================================================
   Меблі та предмети
   ============================================================ */

function bedWooden() {
  const L = createLayer(46, 34);

  L.shadow(23, 31, 21, 3);

  // ніжки
  L.rect(5, 26, 4, 5, ID.woodDark);
  L.rect(37, 26, 4, 5, ID.woodDark);

  // узголів'я з фігурним верхом і стійками
  L.roundRect(2, 5, 9, 23, 3, ID.wood);
  L.ellipse(6, 5, 4, 3, ID.wood);
  // спинка в ногах
  L.roundRect(35, 14, 8, 14, 3, ID.wood);
  L.ellipse(39, 14, 3, 2, ID.wood);

  // царга
  L.rect(9, 23, 28, 5, ID.woodDark);

  // матрац
  L.roundRect(9, 16, 28, 8, 2, ID.mattress);
  // ковдра
  L.roundRect(17, 15, 21, 9, 2, ID.blanket);
  // подушка
  L.roundRect(10, 12, 11, 7, 3, ID.pillow);

  return png(L, ({ px }) => {
    const woodGrain = [104, 70, 44];
    const fold = [124, 84, 178];
    const foldLight = [198, 166, 240];
    const crease = [206, 208, 226];

    // текстура дерева на узголів'ї
    for (const y of [9, 14, 19, 24]) {
      for (let x = 4; x < 9; x += 1) px(x, y, woodGrain);
    }
    for (const y of [18, 23]) {
      for (let x = 37; x < 41; x += 1) px(x, y, woodGrain);
    }

    // складки ковдри
    for (const x of [22, 27, 32]) {
      for (let y = 17; y < 23; y += 1) px(x, y, fold);
      for (let y = 17; y < 23; y += 1) px(x + 1, y, foldLight);
    }
    // край ковдри
    for (let x = 18; x < 37; x += 1) px(x, 15, foldLight);

    // згин подушки
    for (let x = 13; x < 19; x += 1) px(x, 16, crease);
    px(12, 15, crease);
    px(19, 15, crease);

    // шов матраца
    for (let x = 10; x < 17; x += 1) px(x, 21, [206, 190, 166]);
  });
}

function bedSimple() {
  const L = createLayer(40, 22);
  L.shadow(20, 19, 18, 2);
  L.roundRect(3, 8, 34, 10, 3, ID.mattress);
  L.roundRect(19, 7, 18, 11, 3, ID.blanket);
  L.roundRect(5, 5, 11, 7, 3, ID.pillow);

  return png(L, ({ px }) => {
    for (const x of [24, 29, 34]) {
      for (let y = 9; y < 17; y += 1) px(x, y, [124, 84, 178]);
    }
    for (let x = 20; x < 37; x += 1) px(x, 7, [198, 166, 240]);
    for (let x = 8; x < 14; x += 1) px(x, 9, [206, 208, 226]);
    for (let x = 4; x < 18; x += 1) px(x, 15, [206, 190, 166]);
  });
}

function bedCanopy() {
  const L = createLayer(46, 44);
  L.shadow(23, 41, 21, 3);

  // стійки балдахіна
  L.rect(3, 2, 4, 36, ID.woodDark);
  L.rect(39, 2, 4, 36, ID.woodDark);
  // дах
  L.roundRect(2, 0, 42, 6, 2, ID.canopy);
  // драпірування
  L.poly(
    [
      [3, 6],
      [11, 6],
      [8, 20],
      [5, 20],
    ],
    ID.canopy,
  );
  L.poly(
    [
      [35, 6],
      [43, 6],
      [41, 20],
      [38, 20],
    ],
    ID.canopy,
  );

  L.rect(8, 32, 30, 5, ID.woodDark);
  L.roundRect(8, 25, 30, 8, 2, ID.mattress);
  L.roundRect(17, 24, 21, 9, 2, ID.blanket);
  L.roundRect(9, 21, 11, 7, 3, ID.pillow);

  return png(L, ({ px }) => {
    for (const x of [22, 27, 32]) {
      for (let y = 26; y < 32; y += 1) px(x, y, [124, 84, 178]);
    }
    for (let x = 18; x < 37; x += 1) px(x, 24, [198, 166, 240]);
    for (let x = 12; x < 18; x += 1) px(x, 25, [206, 208, 226]);
    for (let x = 6; x < 40; x += 1) if (x % 3 === 0) px(x, 4, [70, 140, 136]);
  });
}

/** Ковдра, якою накривається сплячий компаньйон. Малюється поверх нього. */
function blanket() {
  const L = createLayer(26, 12);
  L.roundRect(0, 2, 26, 9, 3, ID.blanket);
  return png(L, ({ px }) => {
    for (const x of [5, 11, 17, 22]) {
      for (let y = 4; y < 10; y += 1) px(x, y, [124, 84, 178]);
      for (let y = 4; y < 10; y += 1) px(x + 1, y, [198, 166, 240]);
    }
    for (let x = 1; x < 25; x += 1) px(x, 2, [206, 180, 246]);
  });
}

function foodBowl() {
  const L = createLayer(26, 18);
  L.shadow(13, 15, 11, 2);

  // корпус миски
  L.poly(
    [
      [3, 8],
      [23, 8],
      [19, 15],
      [7, 15],
    ],
    ID.bowl,
  );
  // бортик
  L.ellipse(13, 8, 10, 4, ID.bowl);
  // заглиблення
  L.ellipse(13, 8, 8, 3, ID.teal);
  // корм гіркою
  L.ellipse(13, 7, 6, 2, ID.food);
  L.ellipse(10, 6, 2, 1, ID.food);
  L.ellipse(16, 6, 2, 1, ID.food);

  return png(L, ({ px }) => {
    // окремі гранули
    const dark = [104, 68, 36];
    for (const [x, y] of [
      [9, 7],
      [12, 6],
      [15, 7],
      [11, 8],
      [17, 7],
      [13, 8],
    ]) {
      px(x, y, dark);
    }
    // відблиск на бортику
    px(6, 7, [214, 248, 246]);
    px(7, 6, [214, 248, 246]);
    px(8, 6, [214, 248, 246]);
    // лапка на боці миски
    px(19, 11, [198, 240, 238]);
    px(20, 12, [198, 240, 238]);
    px(18, 12, [198, 240, 238]);
    px(19, 13, [198, 240, 238]);
  });
}

function rugStar() {
  const L = createLayer(40, 16);
  L.ellipse(20, 9, 19, 6, ID.teal);
  L.ellipse(20, 9, 15, 4, ID.cream);
  return png(L, ({ px }) => {
    const gold = [244, 200, 96];
    const goldDark = [200, 154, 52];
    const star = [
      [20, 4],
      [19, 5],
      [20, 5],
      [21, 5],
      [17, 6],
      [18, 6],
      [19, 6],
      [20, 6],
      [21, 6],
      [22, 6],
      [23, 6],
      [18, 7],
      [19, 7],
      [20, 7],
      [21, 7],
      [22, 7],
      [18, 8],
      [19, 8],
      [21, 8],
      [22, 8],
      [17, 9],
      [23, 9],
    ];
    for (const [x, y] of star) px(x, y, gold);
    for (const [x, y] of [
      [19, 8],
      [21, 8],
      [17, 9],
      [23, 9],
    ]) {
      px(x, y, goldDark);
    }
    // торочки по краях
    for (let x = 3; x < 38; x += 3) {
      px(x, 14, [96, 176, 172]);
      px(x, 3, [96, 176, 172]);
    }
  });
}

function rugRound() {
  const L = createLayer(30, 18);
  L.ellipse(15, 9, 14, 8, ID.blanket);
  L.ellipse(15, 9, 10, 5, ID.cream);
  L.ellipse(15, 9, 5, 3, ID.pink);
  return png(L, ({ px }) => {
    for (let a = 0; a < 360; a += 30) {
      const x = Math.round(15 + Math.cos((a * Math.PI) / 180) * 12);
      const y = Math.round(9 + Math.sin((a * Math.PI) / 180) * 7);
      px(x, y, [152, 110, 210]);
    }
  });
}

function plantPot() {
  const L = createLayer(24, 32);
  L.shadow(12, 29, 9, 2);
  // горщик із обідком
  L.poly(
    [
      [5, 18],
      [19, 18],
      [17, 29],
      [7, 29],
    ],
    ID.pot,
    );
  L.rect(4, 16, 16, 3, ID.pot);
  // стебло й листя
  L.rect(11, 9, 2, 9, ID.leafDark);
  L.ellipse(6, 11, 4, 3, ID.leaf);
  L.ellipse(18, 13, 4, 3, ID.leaf);
  L.ellipse(12, 5, 5, 4, ID.leaf);
  L.ellipse(8, 7, 3, 2, ID.leafDark);
  L.ellipse(16, 8, 3, 2, ID.leafDark);

  return png(L, ({ px }) => {
    // прожилки на листі
    for (const [x, y] of [
      [6, 11],
      [7, 11],
      [18, 13],
      [17, 13],
      [12, 5],
      [12, 6],
    ]) {
      px(x, y, [60, 110, 56]);
    }
    // смужки на горщику
    for (let x = 7; x < 18; x += 1) px(x, 22, [150, 88, 58]);
  });
}

function plantHanging() {
  const L = createLayer(24, 28);
  L.rect(11, 0, 2, 5, ID.woodDark);
  L.poly(
    [
      [5, 5],
      [19, 5],
      [17, 13],
      [7, 13],
    ],
    ID.teal,
  );
  L.ellipse(6, 18, 3, 6, ID.leaf);
  L.ellipse(12, 21, 3, 7, ID.leafDark);
  L.ellipse(18, 18, 3, 6, ID.leaf);
  return png(L, ({ px }) => {
    for (const x of [6, 12, 18]) {
      for (let y = 14; y < 24; y += 3) px(x, y, [60, 110, 56]);
    }
    for (let x = 6; x < 18; x += 1) px(x, 7, [150, 220, 216]);
  });
}

function toyBall() {
  const L = createLayer(20, 20);
  L.shadow(10, 17, 7, 2);
  L.ellipse(9, 9, 8, 8, ID.cream);
  return png(L, ({ px }) => {
    // кольорові сегменти
    for (let y = 2; y < 17; y += 1) {
      for (let x = 1; x < 18; x += 1) {
        const dx = x - 9;
        const dy = y - 9;
        if (dx * dx + dy * dy > 64) continue;
        if (dy > 2 && dy < 6) px(x, y, [248, 166, 188]);
        if (dx > 2 && dx < 6 && dy < 3) px(x, y, [116, 194, 190]);
      }
    }
    px(6, 5, [255, 255, 255]);
    px(7, 4, [255, 255, 255]);
    px(5, 6, [255, 255, 255]);
  });
}

function toyBlocks() {
  const L = createLayer(26, 22);
  L.shadow(13, 19, 10, 2);
  L.roundRect(1, 11, 9, 9, 1, ID.pink);
  L.roundRect(11, 11, 9, 9, 1, ID.teal);
  L.roundRect(6, 2, 9, 9, 1, ID.gold);
  return png(L, ({ px }) => {
    const mark = [70, 56, 40];
    // літери на кубиках
    for (let x = 3; x < 8; x += 1) px(x, 15, mark);
    for (let y = 13; y < 18; y += 1) px(15, y, mark);
    for (let x = 8; x < 13; x += 1) px(x, 6, mark);
    for (let y = 4; y < 9; y += 1) px(10, y, mark);
  });
}

function picture(sceneId) {
  const L = createLayer(22, 20);
  L.roundRect(0, 0, 22, 20, 1, ID.wood);
  L.rect(2, 2, 18, 16, sceneId === "stars" ? ID.night : ID.sky);

  return png(L, ({ px }) => {
    if (sceneId === "stars") {
      const gold = [244, 200, 96];
      for (const [x, y] of [
        [5, 5],
        [11, 4],
        [16, 7],
        [8, 9],
        [14, 12],
        [6, 13],
        [17, 14],
      ]) {
        px(x, y, gold);
        px(x - 1, y, [190, 150, 70]);
        px(x + 1, y, [190, 150, 70]);
        px(x, y - 1, [190, 150, 70]);
        px(x, y + 1, [190, 150, 70]);
      }
      // місяць
      for (let i = 0; i < 5; i += 1) px(15 - i, 4 + i, [248, 226, 150]);
    } else {
      // гори
      const dark = [88, 150, 76];
      const light = [126, 194, 106];
      for (let i = 0; i < 6; i += 1) {
        for (let x = 4 + i; x <= 10 - i; x += 1) px(x, 16 - i, i < 2 ? [240, 248, 250] : light);
      }
      for (let i = 0; i < 5; i += 1) {
        for (let x = 12 + i; x <= 17 - i; x += 1) px(x, 16 - i, i < 2 ? [240, 248, 250] : dark);
      }
      px(16, 5, [244, 200, 96]);
      px(15, 5, [244, 200, 96]);
      px(16, 4, [244, 200, 96]);
      px(15, 4, [244, 200, 96]);
    }
  });
}

function shelf(variant) {
  const L = createLayer(34, 22);
  L.rect(0, 16, 34, 4, ID.wood);

  if (variant === "books") {
    L.roundRect(3, 6, 4, 10, 1, ID.pink);
    L.roundRect(8, 4, 4, 12, 1, ID.teal);
    L.roundRect(13, 7, 4, 9, 1, ID.gold);
    L.roundRect(18, 5, 4, 11, 1, ID.blanket);
    L.roundRect(23, 8, 4, 8, 1, ID.leaf);
  } else {
    L.roundRect(3, 6, 4, 10, 1, ID.pink);
    L.roundRect(8, 8, 4, 8, 1, ID.gold);
    L.ellipse(23, 11, 6, 5, ID.penguin);
    L.ellipse(23, 13, 4, 3, ID.cream);
  }

  return png(L, ({ px }) => {
    // корінці книжок
    for (const x of [4, 9, 14, 19, 24]) {
      for (let y = 9; y < 14; y += 2) px(x, y, [60, 50, 80]);
    }
    if (variant !== "books") {
      px(21, 9, INK);
      px(25, 9, INK);
      px(23, 11, [244, 170, 80]);
      px(22, 11, [244, 170, 80]);
      px(24, 11, [244, 170, 80]);
    }
    // тінь під полицею
    for (let x = 0; x < 34; x += 1) px(x, 20, [96, 66, 42]);
  });
}


/** Вікно — постійна частина кімнати, не потребує розблокування рівнем. */
function window_() {
  const L = createLayer(34, 32);
  // рама
  L.roundRect(0, 0, 34, 27, 2, ID.wood);
  // скло
  L.rect(3, 3, 28, 21, ID.sky);
  // підвіконня
  L.rect(1, 26, 32, 4, ID.wood);

  return png(L, ({ px }) => {
    const frame = [122, 84, 52];
    const cloud = [248, 252, 255];
    const hill = [126, 194, 106];

    // пагорби за вікном
    for (let i = 0; i < 5; i += 1) {
      for (let x = 4 + i; x <= 14 - i; x += 1) px(x, 22 - i, hill);
    }
    for (let i = 0; i < 4; i += 1) {
      for (let x = 17 + i; x <= 27 - i; x += 1) px(x, 22 - i, [96, 164, 84]);
    }
    // хмаринки
    for (const [cx, cy] of [[9, 8], [22, 12]]) {
      for (const [dx, dy] of [[0,0],[1,0],[2,0],[-1,1],[0,1],[1,1],[2,1],[3,1]]) {
        px(cx + dx, cy + dy, cloud);
      }
    }
    // сонце
    for (const [dx, dy] of [[0,0],[1,0],[0,1],[1,1],[-1,0],[2,0],[0,-1],[1,-1]]) {
      px(26 + dx, 6 + dy, [250, 226, 148]);
    }
    // перехрестя рами
    for (let y = 3; y < 24; y += 1) { px(16, y, frame); px(17, y, frame); }
    for (let x = 3; x < 31; x += 1) { px(x, 13, frame); px(x, 14, frame); }
  });
}

/* ============================================================
   Безшовні текстури стіни й підлоги
   ============================================================ */

function tile(w, h, draw) {
  const c = createCanvas(w, h);
  draw(c);
  return encodePng(w, h, c.rgba);
}

function floorWood() {
  // Високі дошки з м'якими швами. Якщо смуги часті або контрастні,
  // підлога починає читатися як цегляна кладка.
  return tile(48, 26, (c) => {
    c.rect(0, 0, 48, 13, [187, 140, 94]);
    c.rect(0, 13, 48, 13, [178, 131, 87]);
    c.rect(0, 12, 48, 1, [170, 124, 81]);
    c.rect(0, 25, 48, 1, [170, 124, 81]);
    // поперечні стики — ледь темніші за саму дошку
    c.rect(19, 2, 1, 10, [176, 129, 85]);
    c.rect(40, 15, 1, 10, [168, 122, 80]);
    // волокна
    for (const [x, y] of [[4, 3], [5, 3], [6, 3], [26, 6], [27, 6], [34, 2], [11, 17], [12, 17], [30, 21], [44, 16], [15, 8], [38, 9]]) {
      c.set(x, y, [174, 128, 84]);
    }
    for (const [x, y] of [[14, 5], [31, 3], [8, 20], [23, 18], [42, 22], [20, 9]]) {
      c.set(x, y, [199, 154, 110]);
    }
  });
}

function floorTile() {
  return tile(24, 24, (c) => {
    c.rect(0, 0, 24, 24, [218, 212, 233]);
    c.rect(0, 0, 12, 12, [226, 221, 240]);
    c.rect(12, 12, 12, 12, [226, 221, 240]);
    c.rect(0, 11, 24, 1, [198, 191, 216]);
    c.rect(11, 0, 1, 24, [198, 191, 216]);
    c.set(3, 3, [238, 234, 248]);
    c.set(15, 15, [238, 234, 248]);
  });
}

function wallpaper(base, accent) {
  // Без вертикальних смуг: на великій площі вони починають рябіти.
  // Лишається розріджений візерунок, який читається лише зблизька.
  return tile(32, 32, (c) => {
    c.rect(0, 0, 32, 32, base);
    for (const [x, y] of [[7, 6], [23, 14], [15, 24], [31, 30]]) {
      c.set(x, y, accent);
      c.set(x + 1, y + 1, accent);
      c.set(x + 1, y - 1, accent);
      c.set(x - 1, y + 1, accent);
    }
  });
}

function baseboard() {
  return tile(16, 6, (c) => {
    c.rect(0, 0, 16, 1, [252, 251, 255]);
    c.rect(0, 1, 16, 3, [232, 228, 242]);
    c.rect(0, 4, 16, 2, [186, 180, 206]);
  });
}

/* ============================================================
   Запис
   ============================================================ */

mkdirSync(join(OUT, "companion"), { recursive: true });
mkdirSync(join(OUT, "room"), { recursive: true });

let count = 0;
const write = (dir, name, buffer) => {
  writeFileSync(join(OUT, dir, `${name}.png`), buffer);
  count += 1;
};

for (const id of Object.keys(SPECIES)) {
  write("companion", `${id}-idle`, companionIdle(id));
  write("companion", `${id}-sleep`, companionSleep(id));
}
write("companion", "zzz", zzz());

write("room", "bed-simple", bedSimple());
write("room", "bed-wooden", bedWooden());
write("room", "bed-canopy", bedCanopy());
write("room", "blanket", blanket());
write("room", "food-bowl", foodBowl());
write("room", "rug-star", rugStar());
write("room", "rug-round", rugRound());
write("room", "plant-pot", plantPot());
write("room", "plant-hanging", plantHanging());
write("room", "toy-ball", toyBall());
write("room", "toy-blocks", toyBlocks());
write("room", "picture-mountains", picture("mountains"));
write("room", "picture-stars", picture("stars"));
write("room", "shelf-books", shelf("books"));
write("room", "shelf-friend", shelf("friend"));
write("room", "window", window_());

mkdirSync(join(OUT, "surface"), { recursive: true });
const writeSurface = (name, buffer) => {
  writeFileSync(join(OUT, "surface", `${name}.png`), buffer);
  count += 1;
};

writeSurface("floor-wood", floorWood());
writeSurface("floor-tile", floorTile());
writeSurface("wallpaper-mint", wallpaper([191, 232, 216], [168, 216, 198]));
writeSurface("wallpaper-lilac", wallpaper([221, 208, 245], [201, 184, 234]));
writeSurface("wallpaper-sky", wallpaper([207, 228, 247], [184, 210, 236]));
writeSurface("baseboard", baseboard());

console.log(`✓ згенеровано ${count} спрайтів у public/sprites`);
