import { Caption, Card, CommitmentBadge, Eyebrow, H3, RangeBar, TextLink, WeekStrip } from "@/components/ui";
import { formatMetric } from "@/lib/benchmarks";
import type { CommitmentStatus } from "@/lib/domain";
import { LandingSection, SectionHead } from "./furniture";

/**
 * The furnished example, rendered still. Dr Jordan Cheng, week five of a
 * turnover block, and where the practice stands among twelve like it. The
 * figures match lib/repo/demo/world.ts so the tour picks up where this leaves off.
 */
const WEEK_STATUS: Partial<Record<number, "kept" | "mixed" | "missed" | "open" | "none">> = {
  1: "kept", 2: "mixed", 3: "missed", 4: "mixed", 5: "open",
  6: "none", 7: "none", 8: "none", 9: "none", 10: "none", 11: "none", 12: "none",
};

const ROWS: Array<{ week: number; text: string; status: CommitmentStatus; meta?: string }> = [
  { week: 3, text: "Shadow the TCO on three consultations", status: "missed", meta: "Too many clinical days. Said so at the check-in." },
  { week: 4, text: "Benchmark fees against three local practices", status: "done" },
  { week: 5, text: "Renegotiate the lab contract", status: "open", meta: "Carried from week three." },
];

const money = (n: number) => formatMetric("currency", n);

export function FurnishedExample() {
  return (
    <LandingSection tone="parchment">
      <SectionHead
        eyebrow="What it looks like"
        title="One block, one benchmark, week five."
        lede="This is a member's page as it stands mid-block. Nothing here is a mock-up; it is the furnished example the tour walks you through."
      />
      <div className="lp-example">
        <Card as="article">
          <div className="row between wrap">
            <div>
              <Eyebrow>Dr Jordan Cheng · week 5 of 12</Eyebrow>
              <H3>Grow turnover to £150k a month</H3>
            </div>
          </div>
          <Caption>Twelve weeks on treatment plan acceptance, hygiene recall and a fee review.</Caption>
          <WeekStrip current={5} weekStatus={WEEK_STATUS} />
          <div>
            {ROWS.map((r) => (
              <div key={r.text} className={`commitment ${r.status}`}>
                <div className="cm-week">Wk {r.week}</div>
                <div>
                  <div className="cm-text">{r.text}</div>
                  {r.meta && <div className="cm-meta">{r.meta}</div>}
                </div>
                <div className="cm-actions">
                  <CommitmentBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
          <Caption>4 kept · 1 partly kept · 1 missed · 1 carried · 3 open</Caption>
        </Card>

        <Card as="article">
          <Eyebrow>The benchmark · monthly turnover</Eyebrow>
          <H3>{money(140000)}</H3>
          <RangeBar min={60000} max={180000} p25={98000} p75={145000} median={122000} value={140000} format={money} />
          <Caption>Among 12 practices like yours. Mixed, three to five chairs, London. The band is the middle half; the dark mark is you.</Caption>
        </Card>
      </div>
      <div className="lp-example-note">
        <Caption>From the furnished example. Tour it as a member or a mentor.</Caption>
        <TextLink href="/tour">Tour the House</TextLink>
      </div>
    </LandingSection>
  );
}
