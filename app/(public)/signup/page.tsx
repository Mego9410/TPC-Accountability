import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Request an introduction",
  description: "An introduction is a sign-up the House reads before you are admitted. Tell us what you run and what you would like to change this year.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="signin-scene" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
