import type { Metadata } from "next";
import { MentorsSection } from "@/components/landing/audience";
import { Closing, Faq, LandingSection, SectionHead } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "For mentors",
  description:
    "For experienced principals who want to give a year back. Fortnightly sittings with one or two mentees, a pod of six to lead, no fee either way, and a circle of your own.",
};

const FAQ = [
  {
    q: "How much time does it take?",
    a: "An hour a fortnight for each mentee, an evening a month for the pod, and perhaps twenty minutes a week reading check-ins and leaving a note where one is due. With two mentees and a pod, call it five hours a month. The House asks for a year; most mentors give more.",
  },
  {
    q: "Who am I seated with?",
    a: "Principals whose focus matches your history. The House reads what you did, not just how long you have done it: a mentor who sold a site is seated with a member preparing to, and a mentor who rebuilt a team with a member losing theirs. You are shown the member's particulars before the first sitting and may decline a seat.",
  },
  {
    q: "Do I need to be a Club member?",
    a: "You become one by offering. Mentors are Members of the Club and of the Society without charge, for as long as they mentor. That means your own twelve-week block, your own check-in and your own place in the benchmark, alongside the mentees you are seated with.",
  },
  {
    q: "What if my mentee stops turning up?",
    a: "Tell the House after the second missed sitting. The House writes to the member; most come back, some step down to monthly, a few leave. None of it is held against you and none of it is held against them. A missed sitting is recorded, like a missed commitment, so that the pattern is visible before it becomes a habit.",
  },
  {
    q: "Can I mentor more than one?",
    a: "Yes. When you offer, you say how many you will take, up to six. Most mentors settle at two mentees and a pod. The House will not seat you beyond your stated capacity, and you may lower it at any time as long as the mentees you have are kept.",
  },
];

export default function ForMentorsPage() {
  return (
    <>
      <MentorsSection full />
      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="Questions" title="What mentors ask before they offer." />
        <Faq items={FAQ} />
      </LandingSection>
      <Closing eyebrow="For mentors" />
    </>
  );
}
