"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Спільний годинник для всіх живих елементів на сторінці.
 *
 * Один інтервал на всі картки, а не власний таймер у кожній — так вони
 * цокають синхронно й не множать роботу при десятку квестів.
 *
 * Інтервалів може бути кілька: зворотний відлік зникнення показує секунди
 * й оновлюється щосекунди, а «лишилось 5 год» — лише хвилини, і частіше
 * ніж раз на пів хвилини оновлювати його нема сенсу.
 */

type Bucket = {
  value: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
};

const buckets = new Map<number, Bucket>();

function bucketFor(intervalMs: number): Bucket {
  let bucket = buckets.get(intervalMs);
  if (!bucket) {
    bucket = { value: 0, listeners: new Set(), timer: null };
    buckets.set(intervalMs, bucket);
  }
  return bucket;
}

/**
 * Поточний час у мілісекундах, що оновлюється сам.
 *
 * На сервері повертає 0 — там годинника немає, і компонент має показати
 * заздалегідь порахований підпис. Інакше серверна й клієнтська розмітка
 * розійшлися б при гідратації.
 */
export function useNow(intervalMs: number): number {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const bucket = bucketFor(intervalMs);
      bucket.listeners.add(onTick);

      if (!bucket.timer) {
        bucket.timer = setInterval(() => {
          bucket.value = Date.now();
          for (const listener of bucket.listeners) listener();
        }, intervalMs);
      }

      // Перше значення потрібне одразу після монтування, інакше живий
      // підпис з'явився б лише через інтервал.
      bucket.value = Date.now();
      onTick();

      return () => {
        bucket.listeners.delete(onTick);
        if (bucket.listeners.size === 0 && bucket.timer) {
          clearInterval(bucket.timer);
          bucket.timer = null;
        }
      };
    },
    [intervalMs],
  );

  const getSnapshot = useCallback(() => bucketFor(intervalMs).value, [intervalMs]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}

/** Хвилинний крок: для підписів дат і «лишилось …». */
export const SLOW_TICK = 30_000;

/** Секундний крок: для зворотного відліку з секундами. */
export const FAST_TICK = 1_000;
