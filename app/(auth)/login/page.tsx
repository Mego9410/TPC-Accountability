import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { isPreviewAvailable } from "@/lib/preview";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="signin-scene" />}>
      <AuthForm mode="signin" previewAvailable={isPreviewAvailable()} />
    </Suspense>
  );
}
