"use client";

import { useActionState, useRef, useState } from "react";

import { careAction } from "@/app/actions/companion";
import { CARE_ACTIONS, CARE_COST, NEED_MAX, NEED_LABEL, type Needs } from "@/lib/companion/state";
import { CompanionRoom, type RoomView } from "./CompanionRoom";
import { PetNeedButton } from "./PetNeedButton";

/**
 * Кімната, репліка компаньйона й панель догляду в одному клієнтському
 * компоненті.
 *
 * Разом вони тут не випадково: після дії кімната має реагувати, а для цього
 * їй потрібно знати, що саме натиснули. Логіка догляду не дублюється —
 * викликається та сама серверна дія `careAction`, що й раніше.
 */
export function CompanionStage({
  room,
  species,
  name,
  sleeping,
  needs,
  careStars,
  moodLine,
}: {
  room: RoomView;
  species: string;
  name: string;
  sleeping: boolean;
  needs: Needs;
  careStars: number;
  moodLine: string;
}) {
  const [state, formAction, isPending] = useActionState(careAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);

  // Яку дію щойно натиснули — потрібно, щоб показати реакцію улюбленця.
  // Стан ставиться в обробнику кліку, а не в ефекті.
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  const affordable = careStars >= CARE_COST;

  function press(actionId: string) {
    if (!actionRef.current || !formRef.current) return;
    setLastPressed(actionId);
    actionRef.current.value = actionId;
    formRef.current.requestSubmit();
  }

  // Реакція показується, коли дія вже завершилась.
  const reaction = lastPressed && !isPending ? (state?.error ? "sad" : "happy") : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <CompanionRoom
          room={room}
          species={species}
          name={name}
          sleeping={sleeping}
          hungry={needs.fullness < 50}
        />

        {/* Реакція улюбленця після дії. Поки це коротка емоція;
            сюди ж додаватимуться анімації самого персонажа. */}
        {reaction && (
          <span
            key={`${lastPressed}-${state?.success ?? state?.error ?? ""}`}
            onAnimationEnd={() => setLastPressed(null)}
            className="fq-pop pointer-events-none absolute bottom-[42%] left-1/2 -translate-x-1/2 text-3xl"
            aria-hidden="true"
          >
            {reaction === "sad" ? "💧" : lastPressed === "feed" ? "🍖" : lastPressed === "play" ? "✨" : "💤"}
          </span>
        )}
      </div>

      <p className="rounded-[var(--radius-inner)] bg-[var(--color-brand-soft)] px-4 py-3 text-center font-semibold text-[var(--color-brand-ink)]">
        {state?.error ?? state?.success ?? moodLine}
      </p>

      {/* Ігрова панель потреб: показник і дія — один елемент */}
      <form ref={formRef} action={formAction}>
        <input ref={actionRef} type="hidden" name="action" defaultValue="feed" />

        <div className="fq-card flex items-start justify-center gap-4 px-3 py-4 sm:gap-8 sm:px-6">
          {CARE_ACTIONS.map((action) => (
            <PetNeedButton
              key={action.id}
              actionId={action.id}
              label={NEED_LABEL[action.need]}
              value={needs[action.need]}
              cost={CARE_COST}
              affordable={affordable}
              full={needs[action.need] >= NEED_MAX}
              busy={isPending}
              onPress={() => press(action.id)}
            />
          ))}
        </div>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        {affordable ? (
          <>
            У тебе <span className="font-bold text-[var(--color-ink)]">⭐ {careStars}</span> —
            натисни на потребу, щоб подбати
          </>
        ) : (
          <>Зірочки закінчились. Виконай квест — і зможеш подбати про улюбленця</>
        )}
      </p>
    </div>
  );
}
