// Реєстр спрайтів.
//
// Єдине місце, яке знає про файли з графікою. Компоненти звертаються сюди
// за логічним ключем і нічого не знають про шляхи.
//
// Замінити тимчасовий малюнок на справжній = покласти PNG із тим самим іменем
// у public/sprites. Додати новий предмет = рядок тут плюс запис у catalog.ts.
// Змінити розмір або кількість кадрів анімації = правка одного поля.

export type Sprite = {
  src: string;
  /** Власні пропорції спрайта — щоб верстка не «стрибала» до завантаження. */
  width: number;
  height: number;
  /** Кадрів у стрічці. 1 — статична картинка. Поки всі тимчасові статичні. */
  frames?: number;
};

const COMPANION_SIZE = { width: 72, height: 64 };

export const COMPANION_SPRITES: Record<string, { idle: Sprite; sleep: Sprite }> = {
  fox: {
    idle: { src: "/sprites/companion/fox-idle.png", ...COMPANION_SIZE },
    sleep: { src: "/sprites/companion/fox-sleep.png", ...COMPANION_SIZE },
  },
  frog: {
    idle: { src: "/sprites/companion/frog-idle.png", ...COMPANION_SIZE },
    sleep: { src: "/sprites/companion/frog-sleep.png", ...COMPANION_SIZE },
  },
  cat: {
    idle: { src: "/sprites/companion/cat-idle.png", ...COMPANION_SIZE },
    sleep: { src: "/sprites/companion/cat-sleep.png", ...COMPANION_SIZE },
  },
};

export function companionSprite(species: string, sleeping: boolean): Sprite {
  const set = COMPANION_SPRITES[species] ?? COMPANION_SPRITES.fox;
  return sleeping ? set.sleep : set.idle;
}

/**
 * Предмети кімнати. Порожні слоти («…-none») спрайта не мають —
 * компонент просто нічого не малює.
 */
export const ROOM_SPRITES: Record<string, Sprite> = {
  "bed-simple": { src: "/sprites/room/bed-simple.png", width: 112, height: 56 },
  "bed-wooden": { src: "/sprites/room/bed-wooden.png", width: 112, height: 72 },
  "bed-canopy": { src: "/sprites/room/bed-canopy.png", width: 112, height: 96 },

  "rug-star": { src: "/sprites/room/rug-star.png", width: 96, height: 40 },
  "rug-round": { src: "/sprites/room/rug-round.png", width: 80, height: 48 },

  "plant-pot": { src: "/sprites/room/plant-pot.png", width: 56, height: 80 },
  "plant-hanging": { src: "/sprites/room/plant-hanging.png", width: 56, height: 72 },

  "toy-ball": { src: "/sprites/room/toy-ball.png", width: 48, height: 48 },
  "toy-blocks": { src: "/sprites/room/toy-blocks.png", width: 64, height: 48 },

  "picture-mountains": { src: "/sprites/room/picture-mountains.png", width: 56, height: 48 },
  "picture-stars": { src: "/sprites/room/picture-stars.png", width: 56, height: 48 },

  "shelf-books": { src: "/sprites/room/shelf-books.png", width: 80, height: 48 },
  "shelf-friend": { src: "/sprites/room/shelf-friend.png", width: 80, height: 56 },

  "food-bowl": { src: "/sprites/room/food-bowl.png", width: 56, height: 36 },
};

export function roomSprite(itemId: string): Sprite | null {
  return ROOM_SPRITES[itemId] ?? null;
}

/**
 * Шпалери й підлога — це кольори, а не картинки: суцільна заливка масштабується
 * без втрат і важить нуль. Спрайт знадобиться лише коли з'явиться візерунок.
 */
export const SURFACE_COLORS: Record<string, string> = {
  "wallpaper-mint": "#bfe8d8",
  "wallpaper-lilac": "#ddd0f5",
  "wallpaper-sky": "#cfe4f7",
  "floor-wood": "#b98a5c",
  "floor-tile": "#d9d3e6",
};

export function surfaceColor(itemId: string, fallback: string): string {
  return SURFACE_COLORS[itemId] ?? fallback;
}
