"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createTaskAction, updateTaskAction } from "@/app/actions/tasks";
import { FormError } from "@/components/ui";

export type TaskFormChild = { id: string; displayName: string };

export type TaskFormValues = {
  taskId?: string;
  childId: string;
  title: string;
  description: string;
  dueAtLocal: string;
  xpReward: number;
  coinReward: number;
};

const XP_PRESETS = [10, 15, 20, 30, 50];

export function TaskForm({
  childOptions,
  values,
  mode,
}: {
  childOptions: TaskFormChild[];
  values: TaskFormValues;
  mode: "create" | "edit";
}) {
  const action = mode === "create" ? createTaskAction : updateTaskAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const [xp, setXp] = useState(values.xpReward);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.taskId && <input type="hidden" name="taskId" value={values.taskId} />}

      <div>
        <label className="fq-label" htmlFor="title">
          Назва завдання
        </label>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          required
          maxLength={120}
          className="fq-input"
          placeholder="Прибрати свою кімнату"
        />
      </div>

      <div>
        <label className="fq-label" htmlFor="description">
          Опис <span className="font-normal text-[var(--color-muted)]">— необов&apos;язково</span>
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          rows={3}
          maxLength={1000}
          className="fq-input resize-none"
          placeholder="Що саме треба зробити, щоб завдання вважалось виконаним"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="fq-label" htmlFor="childId">
            Кому
          </label>
          <select
            id="childId"
            name="childId"
            defaultValue={values.childId}
            required
            className="fq-input"
          >
            {childOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="fq-label" htmlFor="dueAt">
            Термін виконання
          </label>
          <input
            id="dueAt"
            name="dueAt"
            type="datetime-local"
            defaultValue={values.dueAtLocal}
            required
            className="fq-input"
          />
        </div>
      </div>

      <div>
        <label className="fq-label" htmlFor="xpReward">
          Скільки XP
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="xpReward"
            name="xpReward"
            type="number"
            min={1}
            max={500}
            value={xp}
            onChange={(event) => setXp(Number(event.target.value))}
            required
            className="fq-input w-28"
          />
          {XP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setXp(preset)}
              className={`fq-pill ${
                xp === preset ? "fq-pill-lilac" : "fq-pill-grey"
              } cursor-pointer px-3 py-1.5`}
            >
              {preset} XP
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="fq-label" htmlFor="coinReward">
          Коіни <span className="font-normal text-[var(--color-muted)]">— необов&apos;язково</span>
        </label>
        <input
          id="coinReward"
          name="coinReward"
          type="number"
          min={0}
          max={10000}
          defaultValue={values.coinReward}
          className="fq-input w-40"
        />
        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
          Внутрішня валюта сім&apos;ї. Скільки коштує коін у реальних грошах — вирішуєте ви самі.
        </p>
      </div>

      <FormError message={state?.error} />

      <div className="flex gap-2">
        <Link href="/parent/tasks" className="fq-btn fq-btn-ghost">
          Скасувати
        </Link>
        <button type="submit" className="fq-btn fq-btn-primary flex-1" disabled={isPending}>
          {isPending
            ? "Зберігаємо…"
            : mode === "create"
              ? "Створити завдання"
              : "Зберегти зміни"}
        </button>
      </div>
    </form>
  );
}
