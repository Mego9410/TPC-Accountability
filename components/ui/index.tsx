import Link from "next/link";
import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from "react";
import {
  GOAL_STATUS_LABEL,
  PARTNERSHIP_STATUS_LABEL,
  VISIT_STATUS_LABEL,
  initials as toInitials,
  type GoalStatus,
  type PartnershipStatus,
  type VisitStatus,
} from "@/lib/domain";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type TypeProps = { children: ReactNode; className?: string; style?: CSSProperties; id?: string };

/* =========================================================================
   Type
   ------------------------------------------------------------------------- */
export const Eyebrow = ({ children, onDark, className, style }: TypeProps & { onDark?: boolean }) => (
  <div className={cn("eyebrow", onDark && "on-dark", className)} style={style}>{children}</div>
);
export const Display = ({ children, className, style }: TypeProps) => (
  <div className={cn("display", className)} style={style}>{children}</div>
);
export const H1 = ({ children, className, style, id }: TypeProps) => (
  <h1 id={id} className={cn("h1", className)} style={style}>{children}</h1>
);
export const H2 = ({ children, className, style, id }: TypeProps) => (
  <h2 id={id} className={cn("h2", className)} style={style}>{children}</h2>
);
export const H3 = ({ children, className, style, id }: TypeProps) => (
  <h3 id={id} className={cn("h3", className)} style={style}>{children}</h3>
);
export const Body = ({ children, lg, className, style }: TypeProps & { lg?: boolean }) => (
  <p className={cn(lg ? "body-lg" : "body", className)} style={style}>{children}</p>
);
export const Caption = ({ children, className, style }: TypeProps) => (
  <p className={cn("caption", className)} style={style}>{children}</p>
);
export const Mono = ({ children, className, style }: TypeProps) => (
  <span className={cn("mono-sm", className)} style={style}>{children}</span>
);

/** Small gold uppercase link: "The ledger →". */
export const TextLink = ({ href, children, className, back }: { href: string; children: ReactNode; className?: string; back?: boolean }) => (
  <Link href={href} className={cn("textlink", back && "back", className)}>
    {back && <span aria-hidden="true">←</span>}
    {children}
  </Link>
);

/* =========================================================================
   Page furniture
   ------------------------------------------------------------------------- */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  display,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  display?: boolean;
}) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {display ? <Display>{title}</Display> : <H1>{title}</H1>}
        {lede && <Body lg className="muted maxw-prose">{lede}</Body>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}

export function Section({ title, aside, children, className, id }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("block", className)}>
      {(title || aside) && (
        <div className="block-head">
          {title && <Eyebrow>{title}</Eyebrow>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <H3>{title}</H3>
      {children && <Caption>{children}</Caption>}
      {action && <div className="row" style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

/* =========================================================================
   Button
   ------------------------------------------------------------------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";
type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm";
  onDark?: boolean;
  block?: boolean;
  href?: string;
  external?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, variant = "primary", size, onDark, block, href, external, className, disabled, ...rest }: ButtonProps) {
  const classes = cn("btn", variant, onDark && "on-dark", size === "sm" && "sm", block && "block", className);
  if (href) {
    if (external) {
      return <a href={href} className={classes} target="_blank" rel="noreferrer">{children}</a>;
    }
    return <Link href={href} className={classes} aria-disabled={disabled || undefined}>{children}</Link>;
  }
  return (
    <button type={rest.type ?? "button"} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

/* =========================================================================
   Fields — every control gets an id, a real label, and a described-by
   ------------------------------------------------------------------------- */
type FieldBase = { label: string; help?: string; error?: string; onDark?: boolean; hideLabel?: boolean; className?: string };


export function Field({ label, help, error, onDark, hideLabel, className, id, name, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const rid = useId();
  const fid = id ?? `f${rid}${name ?? ""}`;
  const describedBy = error ? `${fid}-err` : help ? `${fid}-help` : undefined;
  return (
    <div className={cn("field", onDark && "on-dark", error && "has-error", className)}>
      <label htmlFor={fid} className={cn(hideLabel && "sr-only")}>{label}</label>
      <input id={fid} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      {error ? <div id={`${fid}-err`} className="help err" role="alert">{error}</div> : help ? <div id={`${fid}-help`} className="help">{help}</div> : null}
    </div>
  );
}

export function TextArea({ label, help, error, onDark, hideLabel, className, id, name, ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const rid = useId();
  const fid = id ?? `f${rid}${name ?? ""}`;
  const describedBy = error ? `${fid}-err` : help ? `${fid}-help` : undefined;
  return (
    <div className={cn("field", onDark && "on-dark", error && "has-error", className)}>
      <label htmlFor={fid} className={cn(hideLabel && "sr-only")}>{label}</label>
      <textarea id={fid} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      {error ? <div id={`${fid}-err`} className="help err" role="alert">{error}</div> : help ? <div id={`${fid}-help`} className="help">{help}</div> : null}
    </div>
  );
}

export function Select({
  label, help, error, onDark, hideLabel, className, id, name, options, placeholder, ...rest
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement> & { options: Array<{ value: string | number; label: string }>; placeholder?: string }) {
  const rid = useId();
  const fid = id ?? `f${rid}${name ?? ""}`;
  const describedBy = error ? `${fid}-err` : help ? `${fid}-help` : undefined;
  return (
    <div className={cn("field", onDark && "on-dark", error && "has-error", className)}>
      <label htmlFor={fid} className={cn(hideLabel && "sr-only")}>{label}</label>
      <select id={fid} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? <div id={`${fid}-err`} className="help err" role="alert">{error}</div> : help ? <div id={`${fid}-help`} className="help">{help}</div> : null}
    </div>
  );
}

export function CheckboxGroup({
  label, name, options, defaultValue = [], help, error, columns = 2,
}: { label: string; name: string; options: string[]; defaultValue?: string[]; help?: string; error?: string; columns?: number }) {
  const gid = `g${useId()}${name}`;
  const chosen = new Set(defaultValue);
  return (
    <fieldset className={cn("field checkgroup", error && "has-error")} aria-describedby={error ? `${gid}-err` : undefined}>
      <legend>{label}</legend>
      <div className="checkgrid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const oid = `${gid}-${o.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <label key={o} htmlFor={oid} className="check">
              <input id={oid} type="checkbox" name={`${name}[]`} value={o} defaultChecked={chosen.has(o)} />
              <span>{o}</span>
            </label>
          );
        })}
      </div>
      {error ? <div id={`${gid}-err`} className="help err" role="alert">{error}</div> : help ? <div className="help">{help}</div> : null}
    </fieldset>
  );
}

/** One labelled checkbox on its own, e.g. "Open to a partner". */
export function Checkbox({
  label, name, defaultChecked, help,
}: { label: string; name: string; defaultChecked?: boolean; help?: string }) {
  const cid = `c${useId()}${name}`;
  return (
    <div className="checkbox-row">
      <label htmlFor={cid} className="check single">
        <input id={cid} type="checkbox" name={name} defaultChecked={defaultChecked} aria-describedby={help ? `${cid}-help` : undefined} />
        <span>{label}</span>
      </label>
      {help && <p id={`${cid}-help`} className="caption">{help}</p>}
    </div>
  );
}

/* =========================================================================
   Surfaces
   ------------------------------------------------------------------------- */
export const Card = ({ children, emphasis, dark, pad, className, style, id, as: Tag = "div" }: {
  children: ReactNode; emphasis?: boolean; dark?: boolean; pad?: "sm"; className?: string; style?: CSSProperties; id?: string; as?: "div" | "article" | "section" | "li";
}) => (
  <Tag id={id} className={cn("card", emphasis && "emphasis", dark && "dark", pad === "sm" && "pad-sm", className)} style={style}>{children}</Tag>
);

export const Divider = ({ glyph = "❦", onDark, tight }: { glyph?: string; onDark?: boolean; tight?: boolean }) => (
  <div className={cn("divider", onDark && "on-dark", tight && "tight")} aria-hidden="true">
    <span className="glyph">{glyph}</span>
  </div>
);

export const Notice = ({ children, tone = "info", role }: { children: ReactNode; tone?: "info" | "ok" | "warn" | "err"; role?: "status" | "alert" }) => (
  <div className={cn("notice", tone)} role={role ?? (tone === "err" ? "alert" : "status")}>{children}</div>
);

/* =========================================================================
   Badges — one map from the enum, never raw values
   ------------------------------------------------------------------------- */
export const Badge = ({ children, tone = "", dot = true }: { children: ReactNode; tone?: string; dot?: boolean }) => (
  <span className={cn("badge", tone)}>
    {tone && dot && <span className="dot" aria-hidden="true" />}
    {children}
  </span>
);

const VISIT_TONE: Record<VisitStatus, string> = { proposed: "warn", agreed: "gold", declined: "muted", held: "ok", cancelled: "muted" };
const GOAL_TONE: Record<GoalStatus, string> = { open: "gold", done: "ok" };
const PARTNERSHIP_TONE: Record<PartnershipStatus, string> = { proposed: "warn", active: "gold", declined: "muted", ended: "muted" };

/** Where a companion visit stands. */
export const VisitBadge = ({ status }: { status: VisitStatus }) => (
  <Badge tone={VISIT_TONE[status]}>{VISIT_STATUS_LABEL[status]}</Badge>
);
export const GoalBadge = ({ status }: { status: GoalStatus }) => (
  <Badge tone={GOAL_TONE[status]}>{GOAL_STATUS_LABEL[status]}</Badge>
);
export const PartnershipBadge = ({ status }: { status: PartnershipStatus }) => (
  <Badge tone={PARTNERSHIP_TONE[status]}>{PARTNERSHIP_STATUS_LABEL[status]}</Badge>
);

/** What a principal is working on, as quiet badges. */
export const FocusBadges = ({ areas, label = "Working on" }: { areas: string[]; label?: string }) =>
  areas.length === 0 ? null : (
    <div className="badge-row start" aria-label={label}>
      {areas.map((a) => (
        <Badge key={a} dot={false}>{a}</Badge>
      ))}
    </div>
  );

/* =========================================================================
   People
   ------------------------------------------------------------------------- */
export const Avatar = ({ name, size = "md", dark }: { name: string; size?: "sm" | "md" | "lg"; dark?: boolean }) => (
  <span className={cn("avatar", size, dark && "dark")} aria-hidden="true">{toInitials(name)}</span>
);

export function Person({ name, meta, size = "md", href, trailing }: { name: string; meta?: ReactNode; size?: "sm" | "md" | "lg"; href?: string; trailing?: ReactNode }) {
  const body = (
    <>
      <Avatar name={name} size={size} />
      <span className="person-text">
        <span className="person-name">{name}</span>
        {meta && <span className="person-meta">{meta}</span>}
      </span>
      {trailing && <span className="person-trailing">{trailing}</span>}
    </>
  );
  return href ? <Link href={href} className={cn("person", size)}>{body}</Link> : <div className={cn("person", size)}>{body}</div>;
}

/* =========================================================================
   Numbers and marks
   ------------------------------------------------------------------------- */
export function Stat({ value, label, sub, tone }: { value: ReactNode; label: ReactNode; sub?: ReactNode; tone?: "gold" | "ok" | "warn" }) {
  return (
    <div className={cn("stat", tone)}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

/* =========================================================================
   Lists
   ------------------------------------------------------------------------- */
export function HairlineList({ children }: { children: ReactNode }) {
  return <div className="hairline-list">{children}</div>;
}

export function HairlineRow({ href, date, title, meta, right }: { href?: string; date: ReactNode; title: ReactNode; meta?: ReactNode; right?: ReactNode }) {
  const body = (
    <>
      <div className="date">{date}</div>
      <div>
        <div className="title">{title}</div>
        {meta && <div className="meta">{meta}</div>}
      </div>
      {right && <div className="right">{right}</div>}
    </>
  );
  return href ? <Link href={href} className="row">{body}</Link> : <div className="row static">{body}</div>;
}
