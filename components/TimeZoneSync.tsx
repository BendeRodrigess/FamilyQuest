"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { saveTimeZone } from "@/app/actions/profile";
import { deviceTimeZone } from "@/lib/time";

/**
 * Надсилає зону пристрою на сервер, якщо вона змінилася.
 *
 * Показ і введення часу працюють у браузері й без цього. Зона потрібна
 * серверу для того, що рахується без браузера: «щодня до 20:00» і межі
 * доби для серії.
 *
 * Переведення годинника на літній час зону не змінює — `Europe/Kyiv`
 * лишається `Europe/Kyiv`, а зсув Intl рахує на кожен момент окремо.
 * Тож дія спрацьовує лише при першому вході й після реального переїзду.
 */
export function TimeZoneSync({ current }: { current: string }) {
  const router = useRouter();

  useEffect(() => {
    const zone = deviceTimeZone();
    if (zone === current) return;

    let cancelled = false;

    saveTimeZone(zone).then(() => {
      // Підписи, пораховані сервером за старою зоною, треба перемалювати.
      if (!cancelled) router.refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [current, router]);

  return null;
}
