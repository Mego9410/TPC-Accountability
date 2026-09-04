-- =============================================================================
-- The Principals Club — the goal-block catalogue
--
-- Five templates, each a twelve-week block with suggested commitments by
-- week. Ids and text mirror `templates` in lib/repo/demo/world.ts so the
-- furnished example and the real records agree. Idempotent: re-running
-- refreshes titles and descriptions and replaces the weeks.
-- =============================================================================

insert into public.templates (id, slug, title, description, audience, sort) values
  ('t-turnover', 'grow-turnover', 'Grow turnover',
   'A focused twelve weeks on the three levers that move monthly revenue: acceptance, hygiene, fees.',
   'any', 1),
  ('t-tco', 'hire-tco', 'Hire a treatment coordinator',
   'Define the role, recruit well, and embed a TCO into the patient journey.',
   'mentee', 2),
  ('t-associate', 'associate-days', 'Add associate days',
   'Create the capacity, systems and patient flow to bring on an associate.',
   'any', 3),
  ('t-sale', 'sale-ready', 'Get sale-ready in three years',
   'Year one of three: make the practice a documented, transferable asset.',
   'any', 4),
  ('t-first-year', 'first-year', 'The first year as a principal',
   'For new owners: the twelve things that stop the wheels coming off.',
   'mentee', 5)
on conflict (id) do update set
  slug        = excluded.slug,
  title       = excluded.title,
  description = excluded.description,
  audience    = excluded.audience,
  sort        = excluded.sort;

-- Replace the weeks wholesale so edits here are the single source of truth.
delete from public.template_weeks
where template_id in ('t-turnover', 't-tco', 't-associate', 't-sale', 't-first-year');

insert into public.template_weeks (template_id, week, body, sort) values
  -- Grow turnover
  ('t-turnover',   1, 'Set the turnover target and name the three levers to reach it', 1),
  ('t-turnover',   1, 'Brief the team on the twelve-week goal', 2),
  ('t-turnover',   2, 'Audit treatment plan acceptance for the last quarter', 3),
  ('t-turnover',   3, 'Introduce a structured treatment-plan follow-up call', 4),
  ('t-turnover',   4, 'Benchmark fees against three local practices', 5),
  ('t-turnover',   5, 'Review the hygiene recall list and clear the backlog', 6),
  ('t-turnover',   6, 'Hold the fee review with the accountant', 7),
  ('t-turnover',   8, 'Introduce the new fee guide', 8),
  ('t-turnover',  10, 'Review acceptance against week two', 9),
  ('t-turnover',  12, 'Write up what moved and what did not', 10),

  -- Hire a treatment coordinator
  ('t-tco',        1, 'Write the TCO job description and success measures', 1),
  ('t-tco',        2, 'Agree the salary band with the accountant', 2),
  ('t-tco',        2, 'Post the role on two boards', 3),
  ('t-tco',        3, 'Shortlist and book first interviews', 4),
  ('t-tco',        5, 'Make the offer', 5),
  ('t-tco',        7, 'Map the patient journey with the TCO in it', 6),
  ('t-tco',        9, 'First month review: acceptance before and after', 7),
  ('t-tco',       12, 'Decide whether the role is working and what to change', 8),

  -- Add associate days
  ('t-associate',  1, 'Map current chair utilisation by day and surgery', 1),
  ('t-associate',  2, 'Define the associate role, days and remuneration', 2),
  ('t-associate',  3, 'Advertise and brief two recruiters', 3),
  ('t-associate',  5, 'Interview the shortlist', 4),
  ('t-associate',  6, 'Make the offer', 5),
  ('t-associate',  9, 'Build the associate''s diary six weeks out', 6),
  ('t-associate', 12, 'Review utilisation against week one', 7),

  -- Get sale-ready in three years
  ('t-sale',       1, 'Commission an independent practice valuation', 1),
  ('t-sale',       2, 'Start the systems handbook: one SOP a week from here', 2),
  ('t-sale',       4, 'Review the lease and any change-of-control clauses', 3),
  ('t-sale',       6, 'Separate owner-dependent income from practice income', 4),
  ('t-sale',       8, 'Tidy the accounts: three clean years is the target', 5),
  ('t-sale',      12, 'Meet a broker for an informal view', 6),

  -- The first year as a principal
  ('t-first-year', 1, 'Know the daily break-even figure', 1),
  ('t-first-year', 2, 'Meet every team member one to one', 2),
  ('t-first-year', 3, 'Write down the three things only you can do', 3),
  ('t-first-year', 5, 'Hand one of them to someone else', 4),
  ('t-first-year', 7, 'Agree a monthly numbers review with the accountant', 5),
  ('t-first-year', 9, 'Take a whole weekend off', 6),
  ('t-first-year', 12, 'Write the letter you wish you had received in week one', 7);
