"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { formatTimeLeftPhrase } from "@/lib/format";
import { SLOW_TICK, useNow } from "../clock";

// setTimeout переповнюється після ~24.8 дня і спрацьовує негайно.
const MAX_TIMEOUT = 2_147_483_647;

/**
 * Скільки лишилось до дедлайну — живцем, за годинником пристрою.
 *
 * Рахується як різниця двох абсолютних моментів: `dueAt - Date.now()`.
 * Зона тут ні до чого — саме тому значення однакове й правильне, у якому б
 * поясі не був сервер.
 *
 * Підпис показує години й хвилини, тому оновлювати його щосекунди нема
 * сенсу. А от сам момент дедлайну ловимо точно, окремим таймером, щоб
 * картка перемкнулася в «прострочено» вчасно, а не з кроком оновлення.
 */
export function TimeLeft({ dueAtIso, initial }: { dueAtIso: string; initial: string }) {
  const router = useRouter();
  const now = useNow(SLOW_TICK);
  const refreshed = useRef(false);

  const dueAt = new Date(dueAtIso).getTime();

  useEffect(() => {
    if (refreshed.current) return;

    const askServer = () => {
      refreshed.current = true;
      router.refresh();
    };

    const ms = dueAt - Date.now();

    // Дедлайн уже минув між рендером сервера й монтуванням — просимо
    // перерахувати статуси одразу.
    if (ms <= 0) {
      askServer();
      return;
    }

    if (ms > MAX_TIMEOUT) return;

    const timer = setTimeout(askServer, ms + 250);
    return () => clearTimeout(timer);
  }, [dueAt, router]);

  if (now === 0) return <>{initial}</>;

  return <>{formatTimeLeftPhrase(new Date(dueAt), new Date(now))}</>;
}
