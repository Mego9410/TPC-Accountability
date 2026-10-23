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
        <Eyebrow onDark>An accountability club for principal dentists</Eyebrow>

        <h1 className="lp-kept">
          <span>Kept.</span>
        </h1>

        <p className="lp-thesis">
          A goal said aloud to someone who will ask about it is a goal more often kept.
        </p>
        <p className="lp-thesis-2">
          One partner, chosen and asked by you — and a morning inside each other&rsquo;s practices, twice a year at most.
        </p>

        <div className="lp-doors">
          <a href="#partner" className="lp-door">
            <Eyebrow onDark>The partner</Eyebrow>
            <span className="lp-door-title">Someone who asks how it is going.</span>
            <span className="lp-door-detail">
              Another principal you pick out of the directory and ask yourself. You each share what you are
              working on, and once a month we ask you both how the other is getting on.
            </span>
            <span className="lp-door-go">Read on</span>
          </a>
          <a href="#visits" className="lp-door">
            <Eyebrow onDark>The visit</Eyebrow>
            <span className="lp-door-title">A morning inside another practice.</span>
            <span className="lp-door-detail">
              The workflow, the systems, the feel of how someone else has built their culture — and, in
              turn, a morning inside yours.
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
