"use client";

import { useState } from "react";

import { TaskForm, type TaskFormChild, type TaskFormValues } from "./TaskForm";
import { TemplateForm, type TemplateFormValues } from "./TemplateForm";

/**
 * Разове й повторюване завдання створюються з одного екрана.
 * Різниця лише в тому, коли воно з'являється: один раз до конкретної дати
 * чи щоразу у вибрані дні тижня.
 */
export function NewTaskTabs({
  childOptions,
  taskValues,
  templateValues,
}: {
  childOptions: TaskFormChild[];
  taskValues: TaskFormValues;
  templateValues: TemplateFormValues;
}) {
  const [repeating, setRepeating] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-[var(--color-slate-soft)] p-1">
        {[
          { value: false, label: "Разове" },
          { value: true, label: "Повторюване" },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setRepeating(option.value)}
            className={`rounded-[9px] px-3 py-2 text-sm font-bold transition-colors ${
              repeating === option.value
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-muted)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {repeating ? (
        <TemplateForm mode="create" childOptions={childOptions} values={templateValues} />
      ) : (
        <TaskForm mode="create" childOptions={childOptions} values={taskValues} />
      )}
    </div>
  );
}
