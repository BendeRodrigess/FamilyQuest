export type ActionState = {
  error?: string | null;
  success?: string | null;
  /** Разовий показ згенерованого пароля дитини після скидання. */
  revealPassword?: string | null;
} | null;

export const ok = (success?: string): ActionState => ({ error: null, success: success ?? null });
export const fail = (error: string): ActionState => ({ error });
