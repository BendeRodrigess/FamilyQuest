"use client";

import { useActionState, useState } from "react";

import { deleteTaskAction } from "@/app/actions/tasks";
import { IconTrash } from "@/components/icons";

export function DeleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const [state, formAction, isPending] = useActionState(deleteTaskAction, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="fq-btn fq-btn-ghost !px-2 !py-1.5"
        title="Видалити завдання"
        aria-label={`Видалити завдання «${title}»`}
      >
        <IconTrash className="h-[1.15rem] w-[1.15rem]" />
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="taskId" value={taskId} />
      <span className="text-xs text-[var(--color-muted)]">Видалити?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="fq-btn fq-btn-ghost !px-2 !py-1.5 text-xs"
        disabled={isPending}
      >
        Ні
      </button>
      <button
        type="submit"
        className="fq-btn fq-btn-outline !px-2.5 !py-1.5 text-xs"
        disabled={isPending}
      >
        {isPending ? "…" : "Так"}
      </button>
      {state?.error && <span className="text-xs text-[var(--color-rose-ink)]">{state.error}</span>}
    </form>
  );
}
