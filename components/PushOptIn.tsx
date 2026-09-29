"use client";

import { useEffect, useState } from "react";

import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/app/actions/push";
import { IconBell } from "@/components/icons";

/**
 * Вмикання push-сповіщень на цьому пристрої.
 *
 * Дозвіл ніколи не запитується сам собою: браузери таке блокують, та й
 * питати до того, як людина зрозуміла навіщо, — вірний спосіб отримати
 * «Заборонити» назавжди. Тому запит іде тільки у відповідь на натискання.
 *
 * Підтримка визначається наявністю можливостей, а не назвою браузера.
 * Це важливо саме для iPhone: у звичайній вкладці Safari `PushManager`
 * відсутній, і кнопка там просто не з'явиться — замість неї буде
 * підказка додати застосунок на початковий екран.
 */

type State =
  | "checking"
  | "unsupported"
  | "install-required"
  | "denied"
  | "on"
  | "off"
  | "busy";

/** Публічний ключ VAPID приходить у вигляді base64url, а підписці потрібні байти. */
function decodeKey(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Застосунок відкритий як встановлена PWA, а не як вкладка. */
function installed(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Власний прапорець Safari на iOS.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Пристрій Apple. Потрібно лише щоб обрати формулювання підказки —
 * рішення «підтримується чи ні» ухвалює перевірка можливостей вище.
 */
function appleDevice(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function PushOptIn({ publicKey }: { publicKey: string | null }) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supported =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

      if (!supported) {
        if (!cancelled) setState(appleDevice() && !installed() ? "install-required" : "unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      if (!cancelled) setState(existing ? "on" : "off");
    }

    check().catch(() => {
      if (!cancelled) setState("unsupported");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (!publicKey) return;

    setState("busy");
    setError(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        // Відмову не перепитуємо: повторний запит браузер просто ігнорує.
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });

      const json = subscription.toJSON();
      await savePushSubscriptionAction(
        {
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
        navigator.userAgent,
      );

      setState("on");
    } catch {
      setError("Не вдалося увімкнути сповіщення. Спробуй ще раз.");
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setState("off");
    } catch {
      setError("Не вдалося вимкнути сповіщення.");
      setState("on");
    }
  }

  // Ключів на сервері немає — push вимкнений, показувати нема чого.
  if (!publicKey) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--color-muted)]">
        Сповіщення про нові завдання, дедлайни й новини застосунку приходитимуть на цей
        пристрій, навіть коли FamilyQuest закритий.
      </p>

      {state === "checking" && (
        <p className="text-sm text-[var(--color-muted)]">Перевіряємо…</p>
      )}

      {state === "install-required" && (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-amber-soft)] px-3 py-2.5 text-sm text-[var(--color-amber-ink)]">
          Щоб отримувати сповіщення на iPhone або iPad, додайте FamilyQuest на початковий
          екран: кнопка «Поділитися» → «На початковий екран». Далі відкрийте застосунок
          звідти — і кнопка з&apos;явиться тут.
        </p>
      )}

      {state === "unsupported" && (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-slate-soft)] px-3 py-2.5 text-sm text-[var(--color-muted)]">
          Цей браузер не підтримує push-сповіщення. Усе так само буде в центрі сповіщень
          під дзвіночком.
        </p>
      )}

      {state === "denied" && (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-rose-soft)] px-3 py-2.5 text-sm text-[var(--color-rose-ink)]">
          Сповіщення заблоковані в налаштуваннях браузера. Дозвольте їх для familyquest.site
          — і поверніться сюди.
        </p>
      )}

      {(state === "off" || state === "busy") && (
        <button
          type="button"
          onClick={enable}
          disabled={state === "busy"}
          className="fq-btn fq-btn-primary self-start"
        >
          <IconBell className="h-[1.15rem] w-[1.15rem]" />
          {state === "busy" ? "Хвилинку…" : "Увімкнути сповіщення"}
        </button>
      )}

      {state === "on" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="fq-pill fq-pill-green px-3 py-1.5">Увімкнено на цьому пристрої</span>
          <button type="button" onClick={disable} className="fq-btn fq-btn-ghost">
            Вимкнути тут
          </button>
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-rose-ink)]">{error}</p>}
    </div>
  );
}
