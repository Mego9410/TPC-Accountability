/** Inline-form state for every form in the app. Client-safe: no server imports. */
export type ActionState = {
  ok: boolean;
  message: string | null;
  errors: Record<string, string>;
  /** Optional payload for the form to react to (an id that was created, say). */
  data?: Record<string, string>;
};

export const EMPTY_STATE: ActionState = { ok: false, message: null, errors: {} };
