// Каталог компаньйонів і предметів кімнати.
//
// Чисті дані, без бази й без React: змінити баланс або додати предмет —
// це правка одного масиву. Графіка сюди не потрапляє взагалі: за неї
// відповідає реєстр спрайтів у sprites.ts, і замінити картинку можна
// не торкаючись цього файлу.

export const SPECIES = [
  {
    id: "fox",
    name: "Лисеня",
    hint: "Цікаве й трохи хитре",
  },
  {
    id: "frog",
    name: "Жабеня",
    hint: "Спокійне, любить поспати",
  },
  {
    id: "cat",
    name: "Котеня",
    hint: "Муркоче, коли все добре",
  },
] as const;

export type SpeciesId = (typeof SPECIES)[number]["id"];

export function speciesById(id: string) {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}

/* ---------- Кімната ---------- */

export const ROOM_SLOTS = [
  { id: "wallpaper", name: "Шпалери" },
  { id: "floor", name: "Підлога" },
  { id: "bed", name: "Ліжко" },
  { id: "rug", name: "Килим" },
  { id: "plant", name: "Рослина" },
  { id: "toy", name: "Іграшка" },
  { id: "picture", name: "Картина" },
  { id: "shelf", name: "Полиця" },
] as const;

export type RoomSlot = (typeof ROOM_SLOTS)[number]["id"];

export type RoomItem = {
  id: string;
  slot: RoomSlot;
  name: string;
  /** З якого рівня предмет доступний. 1 — від самого початку. */
  unlockLevel: number;
};

// Порядок усередині слоту — від найдоступнішого до найдорожчого.
export const ROOM_ITEMS: RoomItem[] = [
  { id: "wallpaper-mint", slot: "wallpaper", name: "М'ятні", unlockLevel: 1 },
  { id: "wallpaper-lilac", slot: "wallpaper", name: "Бузкові", unlockLevel: 3 },
  { id: "wallpaper-sky", slot: "wallpaper", name: "Небесні", unlockLevel: 6 },

  { id: "floor-wood", slot: "floor", name: "Дерев'яна", unlockLevel: 1 },
  { id: "floor-tile", slot: "floor", name: "Плитка", unlockLevel: 4 },

  { id: "bed-simple", slot: "bed", name: "Матрац", unlockLevel: 1 },
  { id: "bed-wooden", slot: "bed", name: "Дерев'яне ліжко", unlockLevel: 2 },
  { id: "bed-canopy", slot: "bed", name: "Ліжко з балдахіном", unlockLevel: 7 },

  { id: "rug-none", slot: "rug", name: "Без килима", unlockLevel: 1 },
  { id: "rug-star", slot: "rug", name: "Килим із зіркою", unlockLevel: 3 },
  { id: "rug-round", slot: "rug", name: "Круглий килим", unlockLevel: 5 },

  { id: "plant-none", slot: "plant", name: "Без рослини", unlockLevel: 1 },
  { id: "plant-pot", slot: "plant", name: "Рослина в горщику", unlockLevel: 2 },
  { id: "plant-hanging", slot: "plant", name: "Підвісна рослина", unlockLevel: 5 },

  { id: "toy-none", slot: "toy", name: "Без іграшки", unlockLevel: 1 },
  { id: "toy-ball", slot: "toy", name: "М'ячик", unlockLevel: 2 },
  { id: "toy-blocks", slot: "toy", name: "Кубики", unlockLevel: 4 },

  { id: "picture-none", slot: "picture", name: "Без картини", unlockLevel: 1 },
  { id: "picture-mountains", slot: "picture", name: "Гори", unlockLevel: 3 },
  { id: "picture-stars", slot: "picture", name: "Зорі", unlockLevel: 6 },

  { id: "shelf-none", slot: "shelf", name: "Без полиці", unlockLevel: 1 },
  { id: "shelf-books", slot: "shelf", name: "Полиця з книжками", unlockLevel: 4 },
  { id: "shelf-friend", slot: "shelf", name: "Пінгвінчик на полиці", unlockLevel: 8 },
];

export function itemsForSlot(slot: RoomSlot): RoomItem[] {
  return ROOM_ITEMS.filter((item) => item.slot === slot);
}

export function itemById(id: string): RoomItem | undefined {
  return ROOM_ITEMS.find((item) => item.id === id);
}

/** Що стоїть у кімнаті, поки дитина нічого не обрала. */
export const DEFAULT_ROOM: Record<RoomSlot, string> = {
  wallpaper: "wallpaper-mint",
  floor: "floor-wood",
  bed: "bed-simple",
  rug: "rug-none",
  plant: "plant-none",
  toy: "toy-none",
  picture: "picture-none",
  shelf: "shelf-none",
};

/** Найближчі предмети, які відкриються після поточного рівня. */
export function upcomingUnlocks(level: number, limit = 4): RoomItem[] {
  return ROOM_ITEMS.filter((item) => item.unlockLevel > level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)
    .slice(0, limit);
}
