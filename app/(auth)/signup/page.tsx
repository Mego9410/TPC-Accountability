import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Request an introduction" };

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="signin-scene" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
