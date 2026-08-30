"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { deleteTemplateAction, toggleTemplatePauseAction } from "@/app/actions/templates";
import { Avatar, Pill } from "@/components/ui";
import { IconEdit, IconTrash } from "@/components/icons";

export type TemplateSummary = {
  id: string;
  title: string;
  childName: string;
  childColor: string;
  scheduleLabel: string;
  dueTime: string;
  xp: number;
  coins: number;
  autoApprove: boolean;
  isPaused: boolean;
};

export function TemplateCard({ template }: { template: TemplateSummary }) {
  const [pauseState, togglePause, isToggling] = useActionState(toggleTemplatePauseAction, null);
  const [deleteState, remove, isDeleting] = useActionState(deleteTemplateAction, null);
  const [confirming, setConfirming] = useState(false);

  const busy = isToggling || isDeleting;
  const error = pauseState?.error ?? deleteState?.error;

  return (
    <article className={`fq-card-flat p-4 ${template.isPaused ? "opacity-65" : ""}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-bold leading-snug">{template.title}</h3>
        {template.isPaused ? (
          <Pill tone="grey">На паузі</Pill>
        ) : (
          <Pill tone="sky">{template.scheduleLabel}</Pill>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-muted)]">
        <Avatar name={template.childName} color={template.childColor} size="sm" />
        <span>{template.childName}</span>
        <span aria-hidden="true">·</span>
        <span>щоразу до {template.dueTime}</span>
        {template.isPaused && (
          <>
            <span aria-hidden="true">·</span>
            <span>{template.scheduleLabel}</span>
          </>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Pill tone="lilac">+{template.xp} XP</Pill>
        {template.coins > 0 && <Pill tone="mint">+{template.coins} коінів</Pill>}
        {template.autoApprove && <Pill tone="green">Без перевірки</Pill>}
      </div>

      {error && <p className="mb-2 text-sm text-[var(--color-rose-ink)]">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <form action={togglePause}>
          <input type="hidden" name="templateId" value={template.id} />
          <button type="submit" className="fq-btn fq-btn-outline text-sm" disabled={busy}>
            {template.isPaused ? "Відновити" : "Призупинити"}
          </button>
        </form>

        <div className="flex items-center gap-1">
          <Link
            href={`/parent/templates/${template.id}/edit`}
            className="fq-btn fq-btn-ghost !px-2 !py-1.5"
            title="Редагувати"
            aria-label={`Редагувати «${template.title}»`}
          >
            <IconEdit className="h-[1.15rem] w-[1.15rem]" />
          </Link>

          {confirming ? (
            <form action={remove} className="flex items-center gap-1.5">
              <input type="hidden" name="templateId" value={template.id} />
              <span className="text-xs text-[var(--color-muted)]">Видалити?</span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="fq-btn fq-btn-ghost !px-2 !py-1.5 text-xs"
                disabled={busy}
              >
                Ні
              </button>
              <button
                type="submit"
                className="fq-btn fq-btn-outline !px-2.5 !py-1.5 text-xs"
                disabled={busy}
              >
                Так
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="fq-btn fq-btn-ghost !px-2 !py-1.5"
              title="Видалити"
              aria-label={`Видалити «${template.title}»`}
            >
              <IconTrash className="h-[1.15rem] w-[1.15rem]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
