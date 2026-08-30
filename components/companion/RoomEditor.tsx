"use client";

import { useActionState } from "react";

import { placeItemAction } from "@/app/actions/companion";
import { ROOM_SLOTS, itemsForSlot, type RoomSlot } from "@/lib/companion/catalog";
import { FormError } from "@/components/ui";

export type RoomEditorProps = {
  room: Record<RoomSlot, string>;
  level: number;
};

/**
 * Вибір предметів по слотах. Заблоковані показуються з рівнем, на якому
 * відкриються — це і є видима користь від XP, який ніколи не витрачається.
 */
export function RoomEditor({ room, level }: RoomEditorProps) {
  const [state, formAction, isPending] = useActionState(placeItemAction, null);

  return (
    <div className="flex flex-col gap-5">
      <FormError message={state?.error} />

      {ROOM_SLOTS.map((slot) => (
        <div key={slot.id}>
          <p className="fq-label">{slot.name}</p>

          <div className="flex flex-wrap gap-2">
            {itemsForSlot(slot.id).map((item) => {
              const chosen = room[slot.id] === item.id;
              const locked = level < item.unlockLevel;

              if (locked) {
                return (
                  <span
                    key={item.id}
                    className="fq-pill fq-pill-grey px-3 py-2 opacity-70"
                    title={`Відкриється на ${item.unlockLevel} рівні`}
                  >
                    🔒 {item.name}
                    <span className="opacity-75">рів. {item.unlockLevel}</span>
                  </span>
                );
              }

              return (
                <form key={item.id} action={formAction}>
                  <input type="hidden" name="slot" value={slot.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    disabled={isPending || chosen}
                    className={`fq-pill px-3 py-2 ${
                      chosen ? "fq-pill-lilac" : "fq-pill-grey cursor-pointer"
                    } disabled:cursor-default`}
                  >
                    {chosen && <span aria-hidden="true">✓</span>}
                    {item.name}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
