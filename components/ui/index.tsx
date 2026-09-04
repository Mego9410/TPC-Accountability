import Link from "next/link";
import { useId, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from "react";
import {
  BLOCK_STATUS_LABEL,
  BLOCK_WEEKS,
  CIRCLE_ROLE_LABEL,
  COMMITMENT_STATUS_LABEL,
  SITTING_STATUS_LABEL,
  initials as toInitials,
  type BlockStatus,
  type CircleRole,
  type CommitmentStatus,
  type SittingStatus,
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

export function Section({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("block", className)}>
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

/** Large radio choices, e.g. "I want a mentor / I want to mentor". */
export function ChoiceCards({
  name, options, defaultValue, legend, error,
}: { name: string; legend: string; defaultValue?: string; error?: string; options: Array<{ value: string; title: string; detail: string }> }) {
  return (
    <fieldset className={cn("field choicecards", error && "has-error")}>
      <legend>{legend}</legend>
      <div className="choicegrid">
        {options.map((o) => {
          const oid = `${name}-${o.value}`;
          return (
            <label key={o.value} htmlFor={oid} className="choice">
              <input id={oid} type="radio" name={name} value={o.value} defaultChecked={defaultValue === o.value} />
              <span className="choice-body">
                <span className="choice-title">{o.title}</span>
                <span className="choice-detail">{o.detail}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && <div className="help err" role="alert">{error}</div>}
    </fieldset>
  );
}

/* =========================================================================
   Surfaces
   ------------------------------------------------------------------------- */
export const Card = ({ children, emphasis, dark, pad, className, style, as: Tag = "div" }: {
  children: ReactNode; emphasis?: boolean; dark?: boolean; pad?: "sm"; className?: string; style?: CSSProperties; as?: "div" | "article" | "section" | "li";
}) => (
  <Tag className={cn("card", emphasis && "emphasis", dark && "dark", pad === "sm" && "pad-sm", className)} style={style}>{children}</Tag>
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

const COMMITMENT_TONE: Record<CommitmentStatus, string> = { open: "", done: "ok", partial: "warn", missed: "err", carried: "muted" };
const BLOCK_TONE: Record<BlockStatus, string> = { active: "gold", completed: "ok", abandoned: "muted" };
const SITTING_TONE: Record<SittingStatus, string> = { scheduled: "gold", completed: "ok", cancelled: "muted" };

export const CommitmentBadge = ({ status }: { status: CommitmentStatus }) => (
  <Badge tone={COMMITMENT_TONE[status]}>{COMMITMENT_STATUS_LABEL[status]}</Badge>
);
export const BlockBadge = ({ status }: { status: BlockStatus }) => (
  <Badge tone={BLOCK_TONE[status]}>{BLOCK_STATUS_LABEL[status]}</Badge>
);
export const SittingBadge = ({ status }: { status: SittingStatus }) => (
  <Badge tone={SITTING_TONE[status]}>{SITTING_STATUS_LABEL[status]}</Badge>
);
export const RoleBadge = ({ role }: { role: CircleRole }) => (
  <Badge tone={role === "mentor" || role === "lead" ? "gold" : ""} dot={false}>{CIRCLE_ROLE_LABEL[role]}</Badge>
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

/** Twelve cells, one per block week, coloured by the commitments in them. */
export function WeekStrip({ current, weekStatus, compact }: { current: number; weekStatus: Partial<Record<number, "kept" | "mixed" | "missed" | "open" | "none">>; compact?: boolean }) {
  return (
    <ol className={cn("weekstrip", compact && "compact")} aria-label={`Week ${current} of ${BLOCK_WEEKS}`}>
      {Array.from({ length: BLOCK_WEEKS }, (_, i) => i + 1).map((w) => (
        <li key={w} className={cn("wk", weekStatus[w] ?? "none", w === current && "now", w > current && "future")} title={`Week ${w}`}>
          <span>{w}</span>
        </li>
      ))}
    </ol>
  );
}

/** A cohort band (p25–p75) with the median and the member's own marker. */
export function RangeBar({ min, max, p25, p75, median, value, format }: { min: number; max: number; p25: number; p75: number; median: number; value: number; format: (n: number) => string }) {
  const span = Math.max(1e-9, max - min);
  const pct = (n: number) => `${Math.min(100, Math.max(0, ((n - min) / span) * 100))}%`;
  return (
    <div className="rangebar" role="img" aria-label={`You ${format(value)}; cohort median ${format(median)}; middle half ${format(p25)} to ${format(p75)}`}>
      <div className="rb-track">
        <div className="rb-band" style={{ left: pct(p25), width: `calc(${pct(p75)} - ${pct(p25)})` }} />
        <div className="rb-median" style={{ left: pct(median) }} />
        <div className="rb-you" style={{ left: pct(value) }} />
      </div>
      <div className="rb-labels">
        <span>{format(min)}</span>
        <span className="rb-med">median {format(median)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

/** Small inline series; last point emphasised. */
export function Sparkline({ values, width = 160, height = 40 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L${pts[0][0].toFixed(1)} ${height - pad} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <path d={area} className="spark-area" />
      <path d={d} className="spark-line" />
      <circle cx={lx} cy={ly} r={3} className="spark-end" />
    </svg>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
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
