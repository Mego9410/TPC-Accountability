# Kept

An accountability club for UK principal dentists. Two things, and nothing else:

- **A partner.** You find another principal yourself from the members
  directory, ask them, and they accept or decline. One at a time. You share
  the handful of things you are working on, they can see them and write a word
  against them, and you against theirs. Once a month the Club sends you both a
  note asking how they are getting on.
- **A companion visit.** A morning inside another member's practice — the
  workflow, the systems, the processes, the feel of how they have built their
  culture — and in turn a morning inside yours. With any member, by mutual
  agreement, twice a year at most. You are both host and visitor.

There are no twelve-week programmes, no weekly check-ins, no scoring and no
benchmark. That was tried and it was too much.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Tour the House**. The tour is the
furnished example: a small world of UK principals. You can enter it as a
member (Dr Jordan Cheng, partnered with Dr Adesanya, a visit in the diary and
two requests waiting), as their partner (Dr Adesanya, the other side of the
same relationship), or as the House. Everything you do in the tour is kept in
your own browser as a compressed cookie and nowhere else, so the demo behaves
like the product without a database.

With Supabase configured (see `.env.example`) the same pages run against real
records, and the tour stays available until `NEXT_PUBLIC_ENABLE_PREVIEW=false`.

```bash
npm test         # unit tests: the domain helpers and the demo adapter
npm run lint
npm run typecheck
npm run build
```

## The model

All of it is in `lib/domain.ts`:

- A **profile** is a principal and their practice, with what they are working
  on and whether they are open to a partner or to visitors.
- A **partnership** is two principals: proposed, then active, declined or
  ended. One active at a time.
- A **goal** belongs to one principal and is open or done. A **goal update**
  is a line written against it, by its owner or by their partner.
- A **visit** is a morning at one principal's practice: proposed, then agreed,
  declined, held or cancelled, with the host's practicalities beforehand and
  shared notes afterwards.
- A **message** is one principal writing to another.

## How the code is arranged

```
app/(public)/        landing page, practice visits, membership, house rules, privacy, tour, sign in
app/onboarding/      first-run particulars
app/(app)/           home, partner, goals, visits, members, messages, settings, house
app/api/tour/        enter and leave the furnished example
components/ui/       the design system (type, buttons, fields, cards, badges, forms)
components/shell/    top nav, bottom nav, tour bar, footer
components/landing/  the public page sections
lib/domain.ts        the model
lib/repo/            the one door to data: types.ts, demo/ (world + cookie delta), supabase/
lib/session.ts       who is looking, through which door
lib/actions/         server actions, all through defineAction (zod, viewer, flush, revalidate)
supabase/            schema, policies, and the monthly note
tests/               vitest
```

Pages never touch a database client; they call `viewer.repo`. The demo adapter
and the Supabase adapter implement the same interface, so a page that works in
the tour works against real records.

## Connecting the Club

1. Create an empty Supabase project and put its URL and keys in `.env.local`.
2. Apply `supabase/migrations/*.sql` in order.
3. Enable email and Google sign-in in Supabase Auth.
4. Optionally deploy `supabase/functions/monthly-note` and schedule it.

## Design

Tokens and components live in `app/globals.css` and `components/ui/`. Midnight
and gold on cream, Italiana for the one big word, Cormorant for headings, Inter
for the utility layer. The voice may colour a label; it never replaces one.
