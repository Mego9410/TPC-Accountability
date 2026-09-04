"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Notice, cn } from "@/components/ui";
import { EMPTY_STATE, type ActionState } from "@/lib/actions/state";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * The one form. Wires useActionState, shows the outcome once, resets on
 * success when asked, and hands `state` to children that need field errors.
 */
export function Form({
  action,
  children,
  className,
  resetOnSuccess,
  refreshOnSuccess = true,
  successNotice = true,
  inline,
  id,
}: {
  id?: string;
  action: ServerAction;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  refreshOnSuccess?: boolean;
  successNotice?: boolean;
  /** Inline forms (a single button) render no notices; failures show as a title. */
  inline?: boolean;
}) {
  const [state, formAction] = useActionState(action, EMPTY_STATE);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
    if (state.ok && refreshOnSuccess) router.refresh();
  }, [state, resetOnSuccess, refreshOnSuccess, router]);

  return (
    <form id={id} ref={ref} action={formAction} className={cn(inline ? "form-inline" : "form", className)} title={inline && !state.ok && state.message ? state.message : undefined}>
      {!inline && state.message && (state.ok ? successNotice : true) && (
        <Notice tone={state.ok ? "ok" : "err"}>{state.message}</Notice>
      )}
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingText = "One moment…",
  variant,
  size,
  block,
  onDark,
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "quiet";
  size?: "sm";
  block?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} block={block} onDark={onDark} className={className} aria-busy={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** A tiny one-button form: `<QuickAction action={markDone} fields={{ id }}>Kept</QuickAction>` */
export function QuickAction({
  action,
  fields,
  children,
  variant = "quiet",
  size = "sm",
  pendingText = "…",
  confirm,
  className,
}: {
  action: ServerAction;
  fields: Record<string, string | number>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "quiet";
  size?: "sm";
  pendingText?: string;
  confirm?: string;
  className?: string;
}) {
  return (
    <Form action={action} inline className={className}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      <ConfirmSubmit confirm={confirm} variant={variant} size={size} pendingText={pendingText}>
        {children}
      </ConfirmSubmit>
    </Form>
  );
}

function ConfirmSubmit({ confirm, children, ...rest }: { confirm?: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "quiet"; size?: "sm"; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={rest.variant}
      size={rest.size}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? rest.pendingText : children}
    </Button>
  );
}
