"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createTemplateAction, updateTemplateAction } from "@/app/actions/templates";
import { WEEKDAYS, parseWeekdays } from "@/lib/domain";
import { FormError } from "@/components/ui";
import type { TaskFormChild } from "./TaskForm";

export type TemplateFormValues = {
  templateId?: string;
  childId: string;
  title: string;
  description: string;
  dueTime: string;
  weekdays: string;
  xpReward: number;
  coinReward: number;
  autoApprove: boolean;
};

const XP_PRESETS = [5, 10, 15, 20, 30];

const DAY_PRESETS = [
  { label: "Щодня", days: [1, 2, 3, 4, 5, 6, 0] },
  { label: "У будні", days: [1, 2, 3, 4, 5] },
  { label: "На вихідних", days: [6, 0] },
];

function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}

export function TemplateForm({
  childOptions,
  values,
  mode,
}: {
  childOptions: TaskFormChild[];
  values: TemplateFormValues;
  mode: "create" | "edit";
}) {
  const action = mode === "create" ? createTemplateAction : updateTemplateAction;
  const [state, formAction, isPending] = useActionState(action, null);

  const [days, setDays] = useState<number[]>(parseWeekdays(values.weekdays));
  const [xp, setXp] = useState(values.xpReward);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {values.templateId && <input type="hidden" name="templateId" value={values.templateId} />}
      {days.map((day) => (
        <input key={day} type="hidden" name="weekdays" value={day} />
      ))}

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
          placeholder="Почистити зуби"
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
          rows={2}
          maxLength={1000}
          className="fq-input resize-none"
          placeholder="Що саме треба зробити"
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
          <label className="fq-label" htmlFor="dueTime">
            До якої години
          </label>
          <input
            id="dueTime"
            name="dueTime"
            type="time"
            defaultValue={values.dueTime}
            required
            className="fq-input"
          />
        </div>
      </div>

      <div>
        <span className="fq-label">У які дні</span>

        <div className="mb-2.5 flex flex-wrap gap-2">
          {DAY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setDays(preset.days)}
              className={`fq-pill cursor-pointer px-3 py-1.5 ${
                sameDays(days, preset.days) ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => {
            const active = days.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                aria-pressed={active}
                aria-label={day.full}
                className={`h-10 w-11 rounded-[var(--radius-control)] border text-sm font-bold transition-colors ${
                  active
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-ink)]"
                    : "border-[var(--color-line-strong)] text-[var(--color-muted)] hover:bg-[var(--color-slate-soft)]"
                }`}
              >
                {day.short}
              </button>
            );
          })}
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
              className={`fq-pill cursor-pointer px-3 py-1.5 ${
                xp === preset ? "fq-pill-lilac" : "fq-pill-grey"
              }`}
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
      </div>

      <label className="fq-card-flat flex cursor-pointer items-start gap-3 p-4">
        <input
          type="checkbox"
          name="autoApprove"
          defaultChecked={values.autoApprove}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]"
        />
        <span>
          <span className="block font-bold">Зараховувати без перевірки</span>
          <span className="block text-sm text-[var(--color-muted)]">
            Дитина натискає «Виконано» — і XP нараховуються одразу. Зручно для дрібних
            щоденних звичок: інакше за місяць набереться три десятки підтверджень на одне
            лише чищення зубів.
          </span>
        </span>
      </label>

      <FormError message={state?.error} />

      <div className="flex gap-2">
        <Link href="/parent/tasks?filter=repeating" className="fq-btn fq-btn-ghost">
          Скасувати
        </Link>
        <button
          type="submit"
          className="fq-btn fq-btn-primary flex-1"
          disabled={isPending || days.length === 0}
        >
          {isPending
            ? "Зберігаємо…"
            : mode === "create"
              ? "Створити повторюване"
              : "Зберегти зміни"}
        </button>
      </div>
    </form>
  );
}
