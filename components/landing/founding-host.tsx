import { Body, Caption, Eyebrow, H2 } from "@/components/ui";
import { LandingSection } from "./furniture";

/* =========================================================================
   The founding host.

   The first member to open his practice. A named person with a photograph
   and a quotation carries more weight than anything else on this page, which
   is exactly why none of it may be invented: every field below has to come
   from him.

   `ready` stays false until his words, his photograph and his sign-off are
   in hand. While it is false the section does not render at all, so nothing
   unapproved can reach the live site by accident. Fill the blanks, flip the
   flag, and it appears.
   ------------------------------------------------------------------------- */

const FOUNDING_HOST = {
  ready: false,

  /** Full name, as he would like it written. */
  name: "Moonis",
  /** Practice and town. */
  practice: "",
  /** Years a principal, or whatever line he prefers underneath his name. */
  standing: "",
  /** His own words. Do not draft these for him. */
  quote: "",
  /** A photograph in /public/brand/, or leave empty for the ruled placeholder. */
  photo: "",
};

export function FoundingHost() {
  const host = FOUNDING_HOST;
  if (!host.ready || !host.quote) return null;

  return (
    <LandingSection tone="parchment" narrow>
      <div className="lp-host">
        <figure className="lp-host-portrait">
          {host.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={host.photo} alt={host.name} />
          ) : (
            <div className="lp-host-placeholder" aria-hidden="true" />
          )}
        </figure>

        <div className="lp-host-words">
          <Eyebrow>The first host</Eyebrow>
          <H2>&ldquo;{host.quote}&rdquo;</H2>
          <Body className="muted">
            <strong>{host.name}</strong>
            {host.practice ? ` · ${host.practice}` : ""}
          </Body>
          {host.standing && <Caption>{host.standing}</Caption>}
        </div>
      </div>
    </LandingSection>
  );
}
