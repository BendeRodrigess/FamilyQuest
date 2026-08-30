import { roomSprite, surfaceColor } from "@/lib/companion/sprites";
import type { RoomSlot } from "@/lib/companion/catalog";
import { CompanionSprite } from "./CompanionSprite";

export type RoomView = Record<RoomSlot, string>;

/**
 * Сцена кімнати. Предмети стоять у фіксованих слотах — вільного перетягування
 * навмисно немає: на телефоні воно незручне, а відчуття «моя кімната»
 * слоти дають те саме.
 *
 * Позиції у відсотках, тому сцена однаково виглядає на будь-якій ширині.
 * Компаньйон стоїть по центру й займає приблизно 38–62% ширини —
 * предмети розставлені так, щоб його не перекривати.
 */
const POSITIONS: Record<string, string> = {
  picture: "left-[16%] top-[10%] w-[13%]",
  shelf: "right-[8%] top-[12%] w-[22%]",
  plant: "left-[3%] bottom-[6%] w-[13%]",
  bed: "right-[3%] bottom-[10%] w-[32%]",
  rug: "left-[40%] bottom-[3%] w-[26%]",
  toy: "left-[23%] bottom-[6%] w-[11%]",
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
  const wall = surfaceColor(room.wallpaper, "#bfe8d8");
  const floor = surfaceColor(room.floor, "#b98a5c");
  const bowl = roomSprite("food-bowl");

  return (
    <div
      className="relative aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-inner)] border border-[var(--color-line)]"
      style={{ background: wall }}
    >
      {/* Підлога */}
      <div className="absolute inset-x-0 bottom-0 h-[38%]" style={{ background: floor }} />
      <div className="absolute inset-x-0 bottom-[38%] h-[2px] bg-black/15" />

      {/* Предмети на стіні */}
      <Item slot="picture" itemId={room.picture} />
      <Item slot="shelf" itemId={room.shelf} />

      {/* Предмети на підлозі */}
      <Item slot="plant" itemId={room.plant} />
      <Item slot="bed" itemId={room.bed} />
      <Item slot="rug" itemId={room.rug} />
      <Item slot="toy" itemId={room.toy} />

      {hungry && bowl && (
        /* eslint-disable-next-line @next/next/no-img-element -- піксель-арт */
        <img
          src={bowl.src}
          alt=""
          aria-hidden="true"
          className="fq-pixel absolute bottom-[5%] left-[22%] w-[13%]"
          draggable={false}
        />
      )}

      {/* Компаньйон — завжди по центру й поверх усього */}
      <div className="absolute bottom-[14%] left-1/2 w-[24%] -translate-x-1/2">
        <CompanionSprite species={species} sleeping={sleeping} name={name} className="w-full" />
      </div>

      {sleeping && (
        <span
          aria-hidden="true"
          className="absolute bottom-[34%] left-[60%] text-lg font-extrabold text-black/35"
        >
          z z z
        </span>
      )}
    </div>
  );
}
