"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Body, Button, Eyebrow, Field, H2 } from "@/components/ui";
import { env } from "@/lib/env";

type Mode = "signin" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const configured = env.supabase.isConfigured;
  const isSignup = mode === "signup";

  const ready =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (!isSignup || fullName.trim().length >= 2);

  async function handleSubmit() {
    if (!configured) {
      setError("The Club's records are not yet connected. See the setup notes.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
        },
      });
      if (error) {
        setError(humanize(error.message));
        setBusy(false);
        return;
      }
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
        return;
      }
      setNotice("Your request is received. Confirm your address by the email just sent.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(humanize(error.message));
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    if (!configured) {
      setError("The Club's records are not yet connected. See the setup notes.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(
          isSignup ? "/onboarding" : next,
        )}`,
      },
    });
    if (error) {
      setError(humanize(error.message));
      setBusy(false);
    }
  }

  return (
    <div className="signin-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="watermark" src="/brand/monogram.svg" alt="" />
      <div className="signin-card fade-enter">
        <div className="mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/monogram-on-midnight.svg" alt="" style={{ borderRadius: 999 }} />
        </div>
        <Eyebrow onDark>An invitation, not an introduction</Eyebrow>
        <H2 style={{ color: "var(--fg)", fontWeight: 400 }}>
          {isSignup ? "Request an introduction." : "Welcome back."}
        </H2>
        <Body className="muted" style={{ color: "var(--fg-muted)", maxWidth: 360, margin: "0 auto" }}>
          {isSignup
            ? "Principals are received below. A partner follows once your particulars are known."
            : "Members of the Club may sign in below. Guests are received at the door."}
        </Body>

        {!configured && (
          <div className="notice" style={{ textAlign: "left" }}>
            <b>The records are not yet connected.</b> Add your Supabase keys to{" "}
            <code>.env.local</code> to enable sign in. The rest of the Club may still be toured.
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            textAlign: "left",
            marginTop: 4,
          }}
        >
          {isSignup && (
            <Field
              onDark
              label="Your name"
              placeholder="Dr. Jordan Cheng"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <Field
            onDark
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@practice.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            onDark
            label="Password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="At least six characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            onKeyDown={(e) => e.key === "Enter" && ready && handleSubmit()}
          />
        </div>

        {notice && (
          <div className="notice" style={{ textAlign: "left" }}>
            {notice}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!ready || busy} block>
          {busy ? "One moment" : isSignup ? "Put me forward" : "Enter the House"}
        </Button>

        <div className="row center" style={{ gap: 14, color: "var(--fg-faint)" }}>
          <span style={{ height: 1, width: 40, background: "var(--rule)" }} />
          <span style={{ font: "500 10px/1 var(--font-sans)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            or
          </span>
          <span style={{ height: 1, width: 40, background: "var(--rule)" }} />
        </div>

        <Button variant="secondary" onDark onClick={handleGoogle} disabled={busy} block>
          Continue with Google
        </Button>

        {!configured && (
          <a href="/api/preview" className="btn ghost on-dark" style={{ alignSelf: "center" }}>
            Bypass — tour the House
          </a>
        )}

        <div
          style={{
            font: "500 10px/1.6 var(--font-sans)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            marginTop: 4,
          }}
        >
          {isSignup ? (
            <>
              Already a member?{" "}
              <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Sign in
              </Link>
            </>
          ) : (
            <>
              Not yet introduced?{" "}
              <Link href="/signup" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Request an introduction
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function humanize(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "That entry is not recognized. Please try again.";
  }
  if (/already registered/i.test(message)) {
    return "That address is already known to the Club. Please sign in.";
  }
  return message;
}
