import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { changeTier } from "@/lib/actions/profile";
import { Caption, Card, Eyebrow, Field, H2, H3, PageHeader, TextLink } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "The Society" };

const MEMBER_INCLUDES = [
  "A seat in a circle: a mentor, a partner, or a pod of principals like you",
  "Sittings in the diary, with notes kept from each one",
  "Correspondence with everyone you sit with",
  "The House on hand to reseat you when your needs change",
];

const SOCIETY_ADDS = [
  "Twelve-week goal blocks, with weekly commitments beneath one outcome",
  "The weekly check-in: four short questions, never a blank page",
  "The win log, so the good weeks are on the record too",
  "The benchmark: your figures against principals of your kind and region",
  "The challenges, and a place on the leaderboard if you want one",
  "Your mentor sees your week and leaves notes on it",
];

export default async function UpgradePage() {
  const viewer = await requireViewer();
  const { profile, isTour } = viewer;

  if (profile.tier === "society") {
    return (
      <div className="section fade-enter">
        <PageHeader eyebrow="Membership" title="You are in the Society." lede="Your blocks, check-ins, wins and the benchmark are all open to you. Your membership can be changed from your particulars." />
        <Card emphasis>
          <Eyebrow>Society member</Eyebrow>
          <H3>Everything the Society keeps is waiting for you at home.</H3>
          <div className="row gap-4 wrap">
            <TextLink href="/home">Home</TextLink>
            <TextLink href="/settings">Your particulars</TextLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Membership"
        title="Join the Society."
        lede="Members keep their circle, their sittings and their correspondence. The Society adds the record: twelve-week blocks, the weekly check-in, the win log, the benchmark and the challenges."
      />

      <div className="grid-even">
        <Card>
          <Eyebrow>Member</Eyebrow>
          <H2>What every principal has.</H2>
          <Caption>Included with your introduction</Caption>
          <ul className="tick-list">
            {MEMBER_INCLUDES.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </Card>

        <Card emphasis>
          <Eyebrow>Society</Eyebrow>
          <H2>What the Society adds.</H2>
          <div className="price">
            £95<small>a month, or £950 a year</small>
          </div>
          <ul className="tick-list">
            {SOCIETY_ADDS.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <Caption>Leave at any time from your particulars. Nothing you have recorded is lost.</Caption>
        </Card>
      </div>

      <div className="grid-sidebar">
        <Card>
          <Eyebrow>Your details</Eyebrow>
          <H3>Join the Society.</H3>
          <Form action={changeTier}>
            <input type="hidden" name="tier" value="society" />
            <Field label="Name on card" name="card_name" autoComplete="cc-name" defaultValue={profile.fullName} required={!isTour} />
            <Field label="Card number" name="card_number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" required={!isTour} />
            <div className="form-row">
              <Field label="Expiry" name="card_exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" required={!isTour} />
              <Field label="CVC" name="card_cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} required={!isTour} />
            </div>
            <label className="check" htmlFor="house_rules">
              <input id="house_rules" type="checkbox" name="house_rules" required />
              <span>I have read the House rules</span>
            </label>
            <div className="form-actions">
              <SubmitButton pendingText="Seating you…">Join the Society · £95 a month</SubmitButton>
            </div>
            <Caption>
              {isTour
                ? "This is the furnished example: no card is charged and your membership changes at once."
                : "Payments are taken by Stripe. You may leave the Society at any time from your particulars."}
            </Caption>
          </Form>
        </Card>

        <div className="stack gap-6">
          <Card>
            <Eyebrow>Why the record</Eyebrow>
            <H3>A goal kept is struck through.</H3>
            <Caption>
              The Society is the part of the Club that remembers. Each week you say what you will do, and the next week it is on the page, kept or not, in front of someone who will ask.
            </Caption>
          </Card>
          <Card>
            <Eyebrow>Questions</Eyebrow>
            <Caption>Write to the House at any time and someone will reply within the day.</Caption>
            <div className="row gap-4 wrap">
              <TextLink href="/house-rules">The House rules</TextLink>
              <a className="textlink" href="mailto:house@principalsclub.co.uk">Write to the House</a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
