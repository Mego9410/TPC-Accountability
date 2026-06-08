import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type TypeProps = { children: ReactNode; className?: string; style?: CSSProperties };

/* ---------- Type primitives ---------- */
export const Eyebrow = ({
  children,
  onDark,
  className,
  style,
}: TypeProps & { onDark?: boolean }) => (
  <div className={cn("eyebrow", onDark && "on-dark", className)} style={style}>
    {children}
  </div>
);

export const Display = ({ children, className, style }: TypeProps) => (
  <div className={cn("display", className)} style={style}>
    {children}
  </div>
);
export const H1 = ({ children, className, style }: TypeProps) => (
  <h1 className={cn("h1", className)} style={style}>
    {children}
  </h1>
);
export const H2 = ({ children, className, style }: TypeProps) => (
  <h2 className={cn("h2", className)} style={style}>
    {children}
  </h2>
);
export const H3 = ({ children, className, style }: TypeProps) => (
  <h3 className={cn("h3", className)} style={style}>
    {children}
  </h3>
);
export const Body = ({ children, lg, className, style }: TypeProps & { lg?: boolean }) => (
  <p className={cn(lg ? "body-lg" : "body", className)} style={style}>
    {children}
  </p>
);
export const Caption = ({ children, className, style }: TypeProps) => (
  <p className={cn("caption", className)} style={style}>
    {children}
  </p>
);

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm";
  onDark?: boolean;
  block?: boolean;
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  size,
  onDark,
  block,
  href,
  className,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "btn",
    variant,
    onDark && "on-dark",
    size === "sm" && "sm",
    block && "block",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={rest.type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Field ---------- */
type FieldBase = { label?: string; help?: string; error?: string; onDark?: boolean };

export function Field({
  label,
  help,
  error,
  onDark,
  ...rest
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("field", onDark && "on-dark")}>
      {label && <label>{label}</label>}
      <input {...rest} />
      {(help || error) && <div className={cn("help", error && "err")}>{error || help}</div>}
    </div>
  );
}

export function TextArea({
  label,
  help,
  error,
  onDark,
  ...rest
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn("field", onDark && "on-dark")}>
      {label && <label>{label}</label>}
      <textarea {...rest} />
      {(help || error) && <div className={cn("help", error && "err")}>{error || help}</div>}
    </div>
  );
}

/* ---------- Card ---------- */
export const Card = ({
  children,
  emphasis,
  dark,
  className,
  style,
}: {
  children: ReactNode;
  emphasis?: boolean;
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={cn("card", emphasis && "emphasis", dark && "dark", className)} style={style}>
    {children}
  </div>
);

/* ---------- Badge ---------- */
export const Badge = ({
  children,
  variant = "",
}: {
  children: ReactNode;
  variant?: string;
}) => (
  <span className={cn("badge", variant)}>
    {variant && variant !== "gold" && <span className="dot" />}
    {children}
  </span>
);

/* ---------- Divider ---------- */
export const Divider = ({
  glyph = "\u2766",
  onDark,
  tight,
}: {
  glyph?: string;
  onDark?: boolean;
  tight?: boolean;
}) => (
  <div className={cn("divider", onDark && "on-dark", tight && "tight")}>
    <span className="glyph">{glyph}</span>
  </div>
);

/* ---------- Notice ---------- */
export const Notice = ({ children }: { children: ReactNode }) => (
  <div className="notice">{children}</div>
);
