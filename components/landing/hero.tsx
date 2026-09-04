import { Button, Eyebrow } from "@/components/ui";
import { Engraving } from "./engraving";

/**
 * The door. An engraved invitation rather than a banner: the rosette turned on
 * canvas behind the word, a ruled frame, and the two doors raised off the
 * ground as though laid on it.
 */
export function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-ground" aria-hidden="true">
        <Engraving className="lp-hero-engraving" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lp-hero-mark" src="/brand/monogram-gold.png" alt="" />
      </div>
      <div className="lp-hero-frame" aria-hidden="true" />

      <div className="lp-hero-inner">
        <Eyebrow onDark>An accountability society for principal dentists</Eyebrow>

        <h1 className="lp-kept">
          <span>Kept.</span>
        </h1>

        <p className="lp-thesis">
          A goal said aloud to someone who will ask about it is a goal more often kept.
        </p>
        <p className="lp-thesis-2">
          A mentor, a pod of six, twelve weeks at a time — and a morning inside each other&rsquo;s practices.
        </p>

        <div className="lp-doors">
          <a href="#mentees" className="lp-door">
            <Eyebrow onDark>For mentees</Eyebrow>
            <span className="lp-door-title">I run a practice and want this year to go differently.</span>
            <span className="lp-door-detail">
              A mentor who has done it, a pod of six at your stage, and a record of what you kept.
            </span>
            <span className="lp-door-go">Read on</span>
          </a>
          <a href="#mentors" className="lp-door">
            <Eyebrow onDark>For mentors</Eyebrow>
            <span className="lp-door-title">I have done it and want to give a year back.</span>
            <span className="lp-door-detail">
              An hour a fortnight with one or two principals, a pod to lead, and a circle of your own.
            </span>
            <span className="lp-door-go">Read on</span>
          </a>
        </div>

        <div className="lp-quiet">
          <Button href="/tour" variant="secondary" onDark size="sm">Tour the House</Button>
          <a className="lp-quiet-link" href="/login">Sign in</a>
        </div>
      </div>
    </section>
  );
}
