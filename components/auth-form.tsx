"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Body, Button, Eyebrow, Field, H2, Notice } from "@/components/ui";
import { env } from "@/lib/env";

type Mode = "signin" | "signup";
type Wants = "mentee" | "mentor";

const WANTS: Record<Wants, string> = {
  mentee: "You are asking for a mentor",
  mentor: "You are offering to mentor",
};

/** A same-origin path, or nothing. Mirrors safeNext in lib/supabase/middleware. */
function safePath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : env.siteUrl;
}

/**
 * The door. Email and password, or Google, through the browser Supabase
 * client. A sign-up carries `wants` (mentee or mentor) in its metadata and
 * lands on onboarding; a sign-in goes where it was heading.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const isSignup = mode === "signup";
  const next = safePath(params.get("next")) ?? "/home";
  const asParam = params.get("as");
  const wants: Wants | null = asParam === "mentee" || asParam === "mentor" ? asParam : null;
  const onboarding = wants ? `/onboarding?as=${wants}` : "/onboarding";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const configured = env.supabase.isConfigured;
  const ready = email.trim().length > 3 && password.length >= 6 && (!isSignup || fullName.trim().length >= 2);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), wants: wants ?? "mentee" },
          emailRedirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(onboarding)}`,
        },
      });
      if (error) {
        setError(humanise(error.message));
        setBusy(false);
        return;
      }
      if (data.session) {
        router.push(onboarding);
        router.refresh();
        return;
      }
      setNotice("Your request is received. Confirm your address by the email just sent, and the House will read it.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(humanise(error.message));
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(isSignup ? onboarding : next)}`,
      },
    });
    if (error) {
      setError(humanise(error.message));
      setBusy(false);
    }
  }

  return (
    <div className="signin-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="watermark" src="/brand/monogram-gold.png" alt="" />
      <div className="signin-card fade-enter">
        <div className="mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-auth-mark" src="/brand/monogram-on-navy.jpg" alt="" />
        </div>
        <Eyebrow onDark>{isSignup ? "Membership is by introduction" : "The Principals Club"}</Eyebrow>
        <H2 style={{ color: "var(--fg)", fontWeight: 400 }}>{isSignup ? "Request an introduction." : "Sign in."}</H2>
        <Body className="muted" style={{ color: "var(--fg-muted)", maxWidth: 380, margin: "0 auto" }}>
          {isSignup
            ? "An introduction is a sign-up the House reads before you are seated. Leave your particulars below; the House writes back within the week."
            : "Members and mentors of the Club sign in below. If you have not been introduced, the door is to the right."}
        </Body>
        {isSignup && wants && <div className="lp-auth-who">{WANTS[wants]}</div>}

        {!configured ? (
          <>
            <Notice>
              <b>The Club&rsquo;s records are not yet connected.</b> Signing in will be possible once they are. The House itself may still be toured.
            </Notice>
            <Button href="/tour" block>Tour the House</Button>
          </>
        ) : (
          <>
            <form className="lp-auth-fields" onSubmit={handleSubmit} noValidate>
              {isSignup && (
                <Field
                  onDark
                  label="Your name"
                  name="full_name"
                  autoComplete="name"
                  placeholder="Dr Jordan Cheng"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              )}
              <Field
                onDark
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourpractice.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Field
                onDark
                label="Password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                help={isSignup ? "At least six characters." : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error ?? undefined}
                required
                minLength={6}
              />
              {notice && <Notice tone="ok">{notice}</Notice>}
              <Button type="submit" disabled={!ready || busy} block aria-busy={busy}>
                {busy ? "One moment" : isSignup ? "Request an introduction" : "Sign in"}
              </Button>
            </form>

            <div className="lp-or" aria-hidden="true">or</div>

            <Button variant="secondary" onDark onClick={handleGoogle} disabled={busy} block>
              Continue with Google
            </Button>
          </>
        )}

        <Button href="/tour" variant="ghost" onDark className="lp-auth-tour">Tour the House instead</Button>

        <div className="lp-auth-foot">
          {isSignup ? (
            <>Already a member? <Link href="/login">Sign in</Link></>
          ) : (
            <>Not yet introduced? <Link href="/signup">Request an introduction</Link></>
          )}
        </div>
      </div>
    </div>
  );
}

function humanise(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That entry is not recognised. Please try again.";
  if (/already registered/i.test(message)) return "That address is already known to the Club. Please sign in.";
  if (/rate limit/i.test(message)) return "Too many attempts for the moment. Please try again shortly.";
  return message;
}
