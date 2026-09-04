import type { Metadata } from "next";
import { MenteesSection } from "@/components/landing/audience";
import { FurnishedExample } from "@/components/landing/example";
import { Closing, Faq, LandingSection, SectionHead } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "For mentees",
  description:
    "For principals in their first years. A mentor who has run a practice through them, a pod of six at your stage, twelve-week blocks, a four-minute weekly check-in, and the benchmark.",
};

const FAQ = [
  {
    q: "What does it cost?",
    a: "Membership is by introduction and carries no monthly charge: your circle, your sittings and your correspondence are part of being a Member. The Society, which adds blocks, the check-in, wins, the benchmark and challenges, is £95 a month and can be left at any time. Nothing else is sold and nobody in the Club is paid a fee for mentoring.",
  },
  {
    q: "How much time does it take?",
    a: "An hour a fortnight with your mentor, an evening a month with your pod, and four minutes a week for the check-in. The commitments themselves are things you were going to have to do anyway; the Club only makes you say which ones, and when.",
  },
  {
    q: "Who will my mentor be?",
    a: "A principal of at least ten years who has done the thing you are trying to do. The House reads your focus, your practice and your hours, and seats you with a mentor whose history fits. You are told who before the first sitting, and you can ask for a different seat within the first block without explanation.",
  },
  {
    q: "What if it is not working?",
    a: "Say so, to your mentor first if you can and to the House if you cannot. Pairs that are not right are re-seated. Members who find the cadence too much may step down to monthly. Leaving is a message to the House; there is no notice period and no penalty, and your record goes with you.",
  },
  {
    q: "Who sees what I write?",
    a: "Your mentor sees your commitments, your check-ins, your wins and any notes they have left you. Your pod sees your check-ins and wins, because that is what a pod is for. The House sees everything except benchmark figures, which are held apart and shown to nobody as yours. There are eight house rules on this and they are short.",
  },
];

export default function ForMenteesPage() {
  return (
    <>
      <MenteesSection full />
      <FurnishedExample />
      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="Questions" title="What mentees ask before they are seated." />
        <Faq items={FAQ} />
      </LandingSection>
      <Closing eyebrow="For mentees" />
    </>
  );
}
