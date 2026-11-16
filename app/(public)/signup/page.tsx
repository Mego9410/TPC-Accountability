import type { Metadata } from "next";
import { Introduction } from "@/components/introduction";

export const metadata: Metadata = {
  title: "Request an introduction",
  description:
    "An introduction is a sign-up the House reads before you are admitted. Four steps: who is asking, the practice you run, what you are trying to do this year, and the undertakings.",
};

export default function SignupPage() {
  return <Introduction />;
}
