-- =============================================================================
-- The Principals Club — Industry goal templates (master doc Step 3.5)
--
-- Data-driven: templates and their suggested weekly commitments live in tables,
-- so new ones can be added without a deploy. Read-only catalogue for members;
-- authoring is done by staff (service role / SQL).
-- =============================================================================

create table if not exists public.goal_block_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.template_commitments (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.goal_block_templates (id) on delete cascade,
  week_number int not null check (week_number between 1 and 12),
  text        text not null,
  sort        int not null default 0
);
create index if not exists template_commitments_template_idx
  on public.template_commitments (template_id);

alter table public.goal_block_templates enable row level security;
alter table public.template_commitments enable row level security;

-- Catalogue is readable by any authenticated member; no member writes.
drop policy if exists goal_block_templates_select on public.goal_block_templates;
create policy goal_block_templates_select on public.goal_block_templates
  for select to authenticated using (true);

drop policy if exists template_commitments_select on public.template_commitments;
create policy template_commitments_select on public.template_commitments
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Seed (idempotent)
-- -----------------------------------------------------------------------------
insert into public.goal_block_templates (slug, title, description, sort) values
  ('sale-ready', 'Get sale-ready in three years',
   'Lay the groundwork now so the practice is an attractive, well-documented asset when you choose to sell.', 1),
  ('associate-days', 'Add associate days',
   'Create the capacity, systems and patient flow to bring on (or expand) an associate.', 2),
  ('grow-turnover', 'Grow turnover',
   'A focused twelve weeks on the levers that move monthly revenue.', 3),
  ('hire-tco', 'Hire a treatment coordinator',
   'Define the role, recruit well, and embed a TCO into the patient journey.', 4)
on conflict (slug) do nothing;

insert into public.template_commitments (template_id, week_number, text, sort)
select t.id, v.week_number, v.text, v.sort
from public.goal_block_templates t
join (values
  ('sale-ready', 1, 'Commission an independent practice valuation', 1),
  ('sale-ready', 2, 'Document all systems and SOPs into one handbook', 2),
  ('sale-ready', 4, 'Review associate and supplier contracts for transferability', 3),
  ('sale-ready', 8, 'Tidy the financials — three years of clean management accounts', 4),
  ('associate-days', 1, 'Map current chair utilisation by day and surgery', 1),
  ('associate-days', 2, 'Define the associate role, days and remuneration', 2),
  ('associate-days', 5, 'Advertise and begin interviewing candidates', 3),
  ('associate-days', 9, 'Plan patient redistribution and diary changes', 4),
  ('grow-turnover', 1, 'Set the turnover target and the three levers to reach it', 1),
  ('grow-turnover', 2, 'Audit treatment plan acceptance and follow-up process', 2),
  ('grow-turnover', 4, 'Introduce or refine hygiene recall', 3),
  ('grow-turnover', 6, 'Review fee structure against the local market', 4),
  ('hire-tco', 1, 'Write the TCO job description and success measures', 1),
  ('hire-tco', 3, 'Recruit — shortlist and interview', 2),
  ('hire-tco', 6, 'Onboard and shadow the patient journey', 3),
  ('hire-tco', 9, 'Set TCO conversion targets and a weekly review', 4)
) as v(slug, week_number, text, sort) on v.slug = t.slug
where not exists (
  select 1 from public.template_commitments tc
  where tc.template_id = t.id and tc.week_number = v.week_number and tc.text = v.text
);
