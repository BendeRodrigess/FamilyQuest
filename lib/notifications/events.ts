import "server-only";

import { prisma } from "../prisma";
import { formatCoins } from "../format";
import { notify } from "./emit";

/**
 * Сповіщення про події життєвого циклу завдання й магазину.
 *
 * Викликаються із серверних дій **після** того, як основна операція
 * успішно завершилась, і навмисно не всередині lib/tasks.ts чи lib/shop.ts.
 *
 * Причина — транзакційність. Зарахування завдання, обмін коінів і
 * повернення коінів загорнуті в `prisma.$transaction`. Сповіщення не має
 * ні бути частиною такої транзакції (тоді помилка запису сповіщення
 * відкотила б нарахування XP), ні тримати її відкритою довше потрібного.
 * Тому бізнес-модулі лишаються незмінними, а сповіщення живуть окремо.
 *
 * З тієї ж причини жодна функція тут не кидає помилок назовні: коіни вже
 * списані, завдання вже зараховане — зламати відповідь користувачу через
 * другорядний механізм не можна.
 */
async function safely(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    // У продакшені потрапляє в journald разом із рештою логів.
    console.error("notifications:", error);
  }
}

/**
 * Кому з батьків писати.
 *
 * У FamilyQuest немає призначеного перевіряльника: `approveTask` і
 * `rejectTask` приймають `familyId`, тобто перевірити може будь-який
 * батьківський акаунт родини. Тому пишемо всім — інакше мама могла б
 * не дізнатися про завдання, яке видав тато.
 */
async function parentsOf(familyId: string): Promise<string[]> {
  const parents = await prisma.user.findMany({
    where: { familyId, role: "PARENT" },
    select: { id: true },
  });

  return parents.map((parent) => parent.id);
}

/** Коментар буває до 500 символів — у списку сповіщень це задовго. */
function short(text: string, max = 120): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Текст фактичної винагороди.
 *
 * Числа приходять із результату зарахування, а не з полів завдання:
 * джерело правди — `creditTask`, який і нарахував. Якщо коінів немає,
 * про них не згадуємо взагалі.
 */
function rewardText(xp: number, coins: number): string {
  const parts: string[] = [];
  if (xp > 0) parts.push(`+${xp} XP`);
  if (coins > 0) parts.push(`+${formatCoins(coins)}`);
  return parts.join(" і ");
}

/* ============================================================
   Завдання
   ============================================================ */

/** Батьки створили разове завдання → дитині. */
export async function notifyTaskAssigned(taskId: string): Promise<void> {
  await safely(async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, childId: true, xpReward: true, coinReward: true },
    });
    if (!task) return;

    const reward = rewardText(task.xpReward, task.coinReward);

    await notify({
      userId: task.childId,
      type: "TASK_ASSIGNED",
      title: "Нове завдання",
      body: reward
        ? `Вам додано «${task.title}». Нагорода: ${reward}.`
        : `Вам додано «${task.title}».`,
      href: `/child/tasks?task=${task.id}`,
      taskId: task.id,
    });
  });
}

/** Дитина подала завдання на перевірку → усім батькам родини. */
export async function notifyTaskSubmitted(taskId: string): Promise<void> {
  await safely(async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        familyId: true,
        child: { select: { displayName: true } },
      },
    });
    if (!task) return;

    // Фільтр «На перевірці» — саме те місце, де є кнопки підтвердження.
    const href = `/parent/tasks?filter=review&task=${task.id}`;

    for (const userId of await parentsOf(task.familyId)) {
      await notify({
        userId,
        type: "TASK_SUBMITTED",
        title: "Завдання виконано",
        // «подає» без роду: у родині може бути і син, і донька.
        body: `${task.child.displayName} подає «${task.title}» на перевірку.`,
        href,
        taskId: task.id,
      });
    }
  });
}

/** Батьки підтвердили виконання → дитині, з фактичною винагородою. */
export async function notifyTaskApproved(
  taskId: string,
  awarded: { xp: number; coins: number },
): Promise<void> {
  await safely(async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, childId: true },
    });
    if (!task) return;

    const reward = rewardText(awarded.xp, awarded.coins);

    await notify({
      userId: task.childId,
      type: "TASK_APPROVED",
      title: "Завдання підтверджено",
      body: reward
        ? `«${task.title}» виконано. Отримано ${reward}.`
        : `«${task.title}» виконано.`,
      href: `/child/tasks?filter=done&task=${task.id}`,
      taskId: task.id,
    });
  });
}

/** Батьки повернули на доопрацювання → дитині, разом із причиною. */
export async function notifyTaskRejected(taskId: string): Promise<void> {
  await safely(async () => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, childId: true, parentComment: true },
    });
    if (!task) return;

    // Коментар при відхиленні обов'язковий (мінімум 3 символи), і саме він
    // пояснює, що переробити. Нової системи коментарів не з'являється —
    // беремо той, що вже зберігається в завданні.
    const why = task.parentComment ? ` Батьки написали: «${short(task.parentComment)}»` : "";

    await notify({
      userId: task.childId,
      type: "TASK_REJECTED",
      title: "Завдання повернуто",
      // Фільтр «Активні» у дитини включає і відхилені — там його видно.
      body: `«${task.title}» повернуто на доопрацювання.${why}`,
      href: `/child/tasks?filter=open&task=${task.id}`,
      taskId: task.id,
    });
  });
}

/* ============================================================
   Магазин винагород
   ============================================================ */

/** Дитина замовила нагороду → усім батькам родини. */
export async function notifyRewardRequested(redemptionId: string): Promise<void> {
  await safely(async () => {
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      select: {
        familyId: true,
        titleSnapshot: true,
        costSnapshot: true,
        child: { select: { displayName: true } },
      },
    });
    if (!redemption) return;

    for (const userId of await parentsOf(redemption.familyId)) {
      await notify({
        userId,
        type: "REWARD_REQUESTED",
        title: "Запит на винагороду",
        body: `${redemption.child.displayName} хоче «${redemption.titleSnapshot}» за ${formatCoins(
          redemption.costSnapshot,
        )}.`,
        href: "/parent/rewards",
      });
    }
  });
}

/** Батьки позначили нагороду виданою → дитині. */
export async function notifyRewardFulfilled(redemptionId: string): Promise<void> {
  await safely(async () => {
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      select: { childId: true, titleSnapshot: true },
    });
    if (!redemption) return;

    await notify({
      userId: redemption.childId,
      type: "REWARD_FULFILLED",
      title: "Винагороду підтверджено",
      body: `«${redemption.titleSnapshot}» — можна забирати.`,
      href: "/child/rewards",
    });
  });
}

/** Батьки відмовили → дитині. Головне тут — що коіни повернулись. */
export async function notifyRewardDeclined(redemptionId: string): Promise<void> {
  await safely(async () => {
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
      select: { childId: true, titleSnapshot: true, costSnapshot: true, parentComment: true },
    });
    if (!redemption) return;

    const why = redemption.parentComment
      ? ` Батьки написали: «${short(redemption.parentComment)}»`
      : "";

    await notify({
      userId: redemption.childId,
      type: "REWARD_DECLINED",
      title: "У винагороді відмовлено",
      body: `«${redemption.titleSnapshot}» — ${formatCoins(
        redemption.costSnapshot,
      )} повернулись на баланс.${why}`,
      href: "/child/rewards",
    });
  });
}
