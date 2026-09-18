import {
  BASEBOARD,
  BLANKET_SPRITE,
  ZZZ_SPRITE,
  roomSprite,
  surface,
} from "@/lib/companion/sprites";
import type { RoomSlot } from "@/lib/companion/catalog";
import { CompanionSprite } from "./CompanionSprite";

export type RoomView = Record<RoomSlot, string>;

/**
 * Сцена кімнати. Предмети стоять у фіксованих слотах — вільного перетягування
 * навмисно немає: на телефоні воно незручне, а відчуття «моя кімната»
 * слоти дають те саме.
 *
 * Позиції у відсотках, тому сцена однаково виглядає на будь-якій ширині.
 * Компаньйон стоїть по центру й займає приблизно 38–62% ширини. Решта розставлена
 * так, щоб нічого не накладалося: рослина 3–16%, іграшка 18–28%, миска 30–40%,
 * килим 40–66%, ліжко 65–97%.
 */
const POSITIONS: Record<string, string> = {
  window: "left-[6%] top-[11%] w-[19%]",
  picture: "left-[35%] top-[12%] w-[14%]",
  shelf: "right-[7%] top-[12%] w-[23%]",
  plant: "left-[2%] bottom-[4%] w-[14%]",
  bed: "right-[2%] bottom-[6%] w-[38%]",
  rug: "left-[38%] bottom-[2%] w-[26%]",
  toy: "left-[18%] bottom-[5%] w-[10%]",
};

type Spot = { left: string; bottom: string; width: string };

/**
 * Куди лягає компаньйон, коли спить. Координати задані **у просторі ліжка**,
 * а не кімнати: у кожного ліжка своя висота матраца, і так позиція не
 * ламається, коли дитина змінює меблі.
 */
const SLEEP_SPOT: Record<string, { pet: Spot; blanket: Spot; zzz: Spot }> = {
  "bed-simple": {
    pet: { left: "16%", bottom: "34%", width: "58%" },
    blanket: { left: "22%", bottom: "18%", width: "46%" },
    zzz: { left: "18%", bottom: "76%", width: "16%" },
  },
  "bed-wooden": {
    pet: { left: "22%", bottom: "40%", width: "54%" },
    blanket: { left: "28%", bottom: "27%", width: "42%" },
    zzz: { left: "24%", bottom: "74%", width: "14%" },
  },
  "bed-canopy": {
    pet: { left: "22%", bottom: "27%", width: "54%" },
    blanket: { left: "28%", bottom: "17%", width: "42%" },
    zzz: { left: "24%", bottom: "54%", width: "14%" },
  },
};

function Item({ slot, itemId }: { slot: string; itemId: string }) {
  const sprite = roomSprite(itemId);
  if (!sprite) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- піксель-арт, без оптимізації
    <img
      src={sprite.src}
      alt=""
      aria-hidden="true"
      className={`fq-pixel absolute ${POSITIONS[slot] ?? ""}`}
      draggable={false}
    />
  );
}

/** Плитка, що повторюється. Множник цілий, щоб пікселі лишалися рівними. */
function tiled(src: string, [w, h]: [number, number], zoom: number) {
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: `${w * zoom}px ${h * zoom}px`,
    backgroundRepeat: "repeat",
  } as const;
}

export function CompanionRoom({
  room,
  species,
  name,
  sleeping,
  hungry,
}: {
  room: RoomView;
  species: string;
  name: string;
  sleeping: boolean;
  /** Миска з їжею з'являється, коли компаньйон зголоднів — підказка без тексту. */
  hungry: boolean;
}) {
  const wall = surface(room.wallpaper, "wallpaper-mint");
  const floor = surface(room.floor, "floor-wood");
  const bowl = roomSprite("food-bowl");
  const bed = roomSprite(room.bed);
  const spot = SLEEP_SPOT[room.bed] ?? SLEEP_SPOT["bed-simple"];

  return (
    <div
      className="fq-pixel relative aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-inner)] border border-[var(--color-line)]"
      style={{ backgroundColor: wall.fallback, ...tiled(wall.src, wall.tile, 3) }}
    >
      {/* Підлога */}
      <div
        className="fq-pixel absolute inset-x-0 bottom-0 h-[45%]"
        style={{ backgroundColor: floor.fallback, ...tiled(floor.src, floor.tile, 3) }}
      />

      {/* Плінтус на стику стіни й підлоги */}
      <div
        className="fq-pixel absolute inset-x-0 h-[3%]"
        style={{
          bottom: "45%",
          backgroundColor: BASEBOARD.fallback,
          ...tiled(BASEBOARD.src, BASEBOARD.tile, 3),
        }}
      />

      {/* М'яка тінь від стіни на підлогу */}
      <div
        className="pointer-events-none absolute inset-x-0 h-[7%]"
        style={{
          bottom: "38%",
          background: "linear-gradient(to bottom, rgba(20,14,34,0.18), rgba(20,14,34,0))",
        }}
      />

      {/* Предмети на стіні. Вікно є завжди — воно не залежить від рівня. */}
      <Item slot="window" itemId="window" />
      <Item slot="picture" itemId={room.picture} />
      <Item slot="shelf" itemId={room.shelf} />

      {/* Предмети на підлозі */}
      <Item slot="plant" itemId={room.plant} />
      <Item slot="rug" itemId={room.rug} />
      <Item slot="toy" itemId={room.toy} />

      {hungry && bowl && (
        /* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */
        <img
          src={bowl.src}
          alt=""
          aria-hidden="true"
          className="fq-pixel absolute bottom-[3%] left-[29%] w-[11%]"
          draggable={false}
        />
      )}

      {/* Ліжко разом зі сплячим компаньйоном — одна група координат */}
      {bed && (
        <div
          className={`absolute ${POSITIONS.bed}`}
          style={{ aspectRatio: `${bed.width} / ${bed.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */}
          <img
            src={bed.src}
            alt=""
            aria-hidden="true"
            className="fq-pixel absolute inset-0 w-full"
            draggable={false}
          />

          {sleeping && (
            <>
              <div className="absolute" style={spot.pet}>
                <CompanionSprite species={species} sleeping name={name} className="w-full" />
              </div>

              {/* Ковдра поверх — накриває нижню частину */}
              {/* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */}
              <img
                src={BLANKET_SPRITE.src}
                alt=""
                aria-hidden="true"
                className="fq-pixel absolute"
                style={spot.blanket}
                draggable={false}
              />

              {/* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */}
              <img
                src={ZZZ_SPRITE.src}
                alt=""
                aria-hidden="true"
                className="fq-pixel fq-float absolute"
                style={spot.zzz}
                draggable={false}
              />
            </>
          )}
        </div>
      )}

      {!sleeping && (
        <div className="absolute bottom-[10%] left-[45%] w-[26%] -translate-x-1/2">
          <CompanionSprite species={species} sleeping={false} name={name} className="w-full" />
        </div>
      )}
    </div>
  );
}
