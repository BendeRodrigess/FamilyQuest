// Реєстр спрайтів.
//
// Єдине місце, яке знає про файли з графікою. Компоненти звертаються сюди
// за логічним ключем і нічого не знають про шляхи.
//
// Замінити тимчасовий малюнок на справжній = покласти PNG із тим самим іменем
// у public/sprites. Додати новий предмет = рядок тут плюс запис у catalog.ts.
//
// Розміри вказані у пікселях самого файлу: вони задають пропорції, щоб
// верстка не «стрибала» до завантаження картинки.

export type Sprite = {
  src: string;
  width: number;
  height: number;
  /** Кадрів у стрічці. 1 — статична картинка. Поки всі тимчасові статичні. */
  frames?: number;
};

const IDLE = { width: 108, height: 108 };
const SLEEP = { width: 120, height: 66 };

export const COMPANION_SPRITES: Record<string, { idle: Sprite; sleep: Sprite }> = {
  fox: {
    idle: { src: "/sprites/companion/fox-idle.png", ...IDLE },
    sleep: { src: "/sprites/companion/fox-sleep.png", ...SLEEP },
  },
  frog: {
    idle: { src: "/sprites/companion/frog-idle.png", ...IDLE },
    sleep: { src: "/sprites/companion/frog-sleep.png", ...SLEEP },
  },
  cat: {
    idle: { src: "/sprites/companion/cat-idle.png", ...IDLE },
    sleep: { src: "/sprites/companion/cat-sleep.png", ...SLEEP },
  },
};

export function companionSprite(species: string, sleeping: boolean): Sprite {
  const set = COMPANION_SPRITES[species] ?? COMPANION_SPRITES.fox;
  return sleeping ? set.sleep : set.idle;
}

export const ZZZ_SPRITE: Sprite = { src: "/sprites/companion/zzz.png", width: 54, height: 48 };

/** Ковдра, якою накривається сплячий компаньйон. Малюється поверх нього. */
export const BLANKET_SPRITE: Sprite = {
  src: "/sprites/room/blanket.png",
  width: 78,
  height: 36,
};

/**
 * Предмети кімнати. Порожні слоти («…-none») спрайта не мають —
 * компонент просто нічого не малює.
 */
export const ROOM_SPRITES: Record<string, Sprite> = {
  "bed-simple": { src: "/sprites/room/bed-simple.png", width: 120, height: 66 },
  "bed-wooden": { src: "/sprites/room/bed-wooden.png", width: 138, height: 102 },
  "bed-canopy": { src: "/sprites/room/bed-canopy.png", width: 138, height: 132 },

  "rug-star": { src: "/sprites/room/rug-star.png", width: 120, height: 48 },
  "rug-round": { src: "/sprites/room/rug-round.png", width: 90, height: 54 },

  "plant-pot": { src: "/sprites/room/plant-pot.png", width: 72, height: 96 },
  "plant-hanging": { src: "/sprites/room/plant-hanging.png", width: 72, height: 84 },

  "toy-ball": { src: "/sprites/room/toy-ball.png", width: 60, height: 60 },
  "toy-blocks": { src: "/sprites/room/toy-blocks.png", width: 78, height: 66 },

  "picture-mountains": { src: "/sprites/room/picture-mountains.png", width: 66, height: 60 },
  "picture-stars": { src: "/sprites/room/picture-stars.png", width: 66, height: 60 },

  "shelf-books": { src: "/sprites/room/shelf-books.png", width: 102, height: 66 },
  "shelf-friend": { src: "/sprites/room/shelf-friend.png", width: 102, height: 66 },

  "food-bowl": { src: "/sprites/room/food-bowl.png", width: 78, height: 54 },

  // Вікно стоїть у кімнаті завжди, тому в каталозі предметів його немає.
  window: { src: "/sprites/room/window.png", width: 102, height: 96 },
};

/**
 * Піктограми потреб для панелі догляду. Ключ збігається з id дії
 * у CARE_ACTIONS, тому нова потреба (чистота, здоров'я) підхопиться
 * автоматично: досить додати рядок сюди й PNG у public/sprites/care.
 */
export const CARE_ICONS: Record<string, Sprite> = {
  feed: { src: "/sprites/care/feed.png", width: 66, height: 60 },
  play: { src: "/sprites/care/play.png", width: 60, height: 60 },
  sleep: { src: "/sprites/care/sleep.png", width: 60, height: 60 },
};

export function careIcon(actionId: string): Sprite | null {
  return CARE_ICONS[actionId] ?? null;
}

export function roomSprite(itemId: string): Sprite | null {
  return ROOM_SPRITES[itemId] ?? null;
}

/**
 * Поверхні — безшовні плитки, які повторюються по стіні й підлозі.
 * `tile` — розмір самої плитки в пікселях; компонент множить його на ціле
 * число, щоб пікселі лишалися рівними.
 *
 * `fallback` показується, поки картинка не завантажилась, і на випадок,
 * якщо її взагалі немає.
 */
export type Surface = { src: string; tile: [number, number]; fallback: string };

export const SURFACES: Record<string, Surface> = {
  "wallpaper-mint": {
    src: "/sprites/surface/wallpaper-mint.png",
    tile: [32, 32],
    fallback: "#bfe8d8",
  },
  "wallpaper-lilac": {
    src: "/sprites/surface/wallpaper-lilac.png",
    tile: [32, 32],
    fallback: "#ddd0f5",
  },
  "wallpaper-sky": {
    src: "/sprites/surface/wallpaper-sky.png",
    tile: [32, 32],
    fallback: "#cfe4f7",
  },
  "floor-wood": {
    src: "/sprites/surface/floor-wood.png",
    tile: [48, 26],
    fallback: "#b08054",
  },
  "floor-tile": {
    src: "/sprites/surface/floor-tile.png",
    tile: [24, 24],
    fallback: "#d6d0e6",
  },
};

export const BASEBOARD: Surface = {
  src: "/sprites/surface/baseboard.png",
  tile: [16, 6],
  fallback: "#e2deee",
};

export function surface(itemId: string, fallbackKey: string): Surface {
  return SURFACES[itemId] ?? SURFACES[fallbackKey];
}
