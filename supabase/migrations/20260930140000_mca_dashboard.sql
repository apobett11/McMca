-- MCA dashboard: chief-approved applications only, server-side analytics,
-- and an atomic MCA decision. Chiefs, chief areas, polling stations, cycles,
-- and MCA ward scope are written by the administrator (service role), never by the MCA.
-- Safe to re-run.

-- ——— Reference data (administrator-managed) ———

create table if not exists bursary_cycles (
  label text primary key,
  status text not null default 'open' check (status in ('open', 'closed')),
  budget numeric(14, 2) not null default 0 check (budget >= 0),
  opens_on date,
  closes_on date,
  created_at timestamptz not null default now()
);

create table if not exists chief_assignments (
  chief_auth_user_id uuid primary key references auth.users (id) on delete cascade,
  chief_name text not null,
  ward text not null,
  location text not null,
  sub_location text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists polling_stations (
  id uuid primary key default gen_random_uuid(),
  ward text not null,
  name text not null,
  unique (ward, name)
);

create table if not exists mca_profiles (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  phone_number text,
  constituency text,
  wards text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ——— Columns the analytics group by ———

alter table student_profiles
  add column if not exists education_level text,
  add column if not exists ward text,
  add column if not exists polling_station text;

alter table student_applications
  add column if not exists amount_requested numeric(12, 2) check (amount_requested is null or amount_requested >= 0),
  add column if not exists amount_allocated numeric(12, 2) check (amount_allocated is null or amount_allocated >= 0),
  add column if not exists reviewed_by_chief uuid,
  add column if not exists chief_approved_at timestamptz,
  add column if not exists decided_by_mca uuid,
  add column if not exists mca_decided_at timestamptz,
  add column if not exists mca_note text;

create index if not exists student_applications_chief_approved_idx
  on student_applications (chief_approved_at desc)
  where chief_approved_at is not null;

create index if not exists student_applications_cycle_status_idx
  on student_applications (cycle, application_status);

create index if not exists student_profiles_grouping_idx
  on student_profiles (ward, education_level, school_name);

-- Chief approval stamps itself, so no client can forge the time or the reviewer.
create or replace function stamp_chief_approval()
returns trigger
language plpgsql
as $$
begin
  if new.application_status = 'chief_approved'
     and (old.application_status is distinct from 'chief_approved')
     and new.chief_approved_at is null then
    new.chief_approved_at := now();
    new.reviewed_by_chief := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists student_applications_stamp_chief on student_applications;
create trigger student_applications_stamp_chief
  before update on student_applications
  for each row execute function stamp_chief_approval();

-- ——— Access ———

alter table bursary_cycles enable row level security;
alter table chief_assignments enable row level security;
alter table polling_stations enable row level security;
alter table mca_profiles enable row level security;

do $$ begin
  create policy bursary_cycles_read on bursary_cycles for select using (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy polling_stations_read on polling_stations for select using (auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chief_assignments_read on chief_assignments for select using (
    chief_auth_user_id = auth.uid()
    or exists (select 1 from user_roles where auth_user_id = auth.uid() and role = 'mca')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy mca_profiles_own_read on mca_profiles for select using (auth_user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy mca_profiles_own_update on mca_profiles for update
    using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- The MCA may change only their phone number. Name, email, and ward scope are set by the administrator.
revoke update on mca_profiles from authenticated;
grant update (phone_number, updated_at) on mca_profiles to authenticated;

create or replace function is_mca()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from user_roles where auth_user_id = auth.uid() and role = 'mca');
$$;

create or replace function mca_ward_scope()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select wards from mca_profiles where auth_user_id = auth.uid()), '{}');
$$;

-- Definer helpers read past RLS so the policies below cannot recurse into themselves.
create or replace function mca_can_read_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_mca() and exists (
    select 1
    from student_applications a
    join student_profiles p on p.id = a.student_profile_id
    left join chief_assignments c on c.chief_auth_user_id = a.reviewed_by_chief
    where a.id = p_application_id
      and a.chief_approved_at is not null
      and (cardinality(mca_ward_scope()) = 0 or coalesce(c.ward, p.ward) = any (mca_ward_scope()))
  );
$$;

create or replace function mca_can_read_student(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_mca() and exists (
    select 1
    from student_applications a
    join student_profiles p on p.id = a.student_profile_id
    left join chief_assignments c on c.chief_auth_user_id = a.reviewed_by_chief
    where a.student_profile_id = p_profile_id
      and a.chief_approved_at is not null
      and (cardinality(mca_ward_scope()) = 0 or coalesce(c.ward, p.ward) = any (mca_ward_scope()))
  );
$$;

-- The MCA reads a student only after a chief approved that student's application, and only inside the MCA's wards.
do $$ begin
  create policy mca_read_applications on student_applications for select
    using (mca_can_read_application(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy mca_read_profiles on student_profiles for select
    using (mca_can_read_student(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy mca_read_documents on student_documents for select
    using (mca_can_read_student(student_profile_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy mca_read_guardians on student_guardians for select
    using (mca_can_read_student(student_profile_id));
exception when duplicate_object then null; end $$;

-- ——— One row per chief-approved application ———

create or replace view mca_application_facts
with (security_invoker = true)
as
select
  a.id,
  a.student_profile_id,
  a.application_status,
  case
    when a.application_status in ('approved', 'funds_sent', 'disbursed') then 'approved'
    when a.application_status = 'rejected' then 'declined'
    else 'awaiting'
  end as mca_stage,
  a.cycle,
  a.submitted_at,
  a.chief_approved_at,
  a.mca_decided_at,
  a.amount_requested,
  a.amount_allocated,
  a.mca_note,
  nullif(concat_ws(' ', p.first_name, p.middle_name, p.last_name), '') as student_name,
  p.admission_number,
  coalesce(nullif(p.school_name, ''), nullif(a.institution_name, ''), 'Unknown school') as school,
  coalesce(nullif(p.education_level, ''), nullif(p.student_type, ''), 'Unspecified') as education_level,
  coalesce(c.ward, nullif(p.ward, ''), 'Unassigned') as ward,
  coalesce(c.location, 'Unassigned') as location,
  c.sub_location,
  c.chief_name,
  coalesce(nullif(p.polling_station, ''), 'Not recorded') as polling_station,
  exists (
    select 1
    from student_applications prev
    where prev.student_profile_id = a.student_profile_id
      and prev.created_at < a.created_at
      and prev.application_status in ('approved', 'funds_sent', 'disbursed')
  ) as returning_beneficiary
from student_applications a
join student_profiles p on p.id = a.student_profile_id
left join chief_assignments c on c.chief_auth_user_id = a.reviewed_by_chief
where a.chief_approved_at is not null
  and (
    cardinality(mca_ward_scope()) = 0
    or coalesce(c.ward, p.ward) = any (mca_ward_scope())
  );

-- ——— Analytics, computed in the database so the browser never loads every row ———

drop function if exists mca_dashboard_summary(text, text, text, text);

create or replace function mca_dashboard_summary(
  p_cycle text default null,
  p_ward text default null,
  p_level text default null,
  p_school text default null,
  p_location text default null,
  p_polling text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_budget numeric;
  v_result jsonb;
begin
  if not is_mca() then
    raise exception 'MCA access only' using errcode = '42501';
  end if;

  select coalesce(sum(budget), 0) into v_budget
  from bursary_cycles
  where p_cycle is null or label = p_cycle;

  v_result := (
    with f as (
      select *
      from mca_application_facts
      where (p_cycle is null or cycle = p_cycle)
        and (p_ward is null or ward = p_ward)
        and (p_level is null or education_level = p_level)
        and (p_school is null or school = p_school)
        and (p_location is null or location = p_location)
        and (p_polling is null or polling_station = p_polling)
    ),
    weeks as (
      select generate_series(
        date_trunc('week', now()) - interval '11 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) as week
    ),
    verified_weekly as (
      select date_trunc('week', chief_approved_at) as week, count(*) as n
      from f group by 1
    ),
    decided_weekly as (
      select date_trunc('week', mca_decided_at) as week, count(*) as n
      from f where mca_decided_at is not null group by 1
    )
    select jsonb_build_object(
      'budget', v_budget,
      'totals', (
        select jsonb_build_object(
          'verified', count(*),
          'awaiting', count(*) filter (where mca_stage = 'awaiting'),
          'approved', count(*) filter (where mca_stage = 'approved'),
          'declined', count(*) filter (where mca_stage = 'declined'),
          'students', count(distinct student_profile_id),
          'returning', count(*) filter (where returning_beneficiary),
          'requested', coalesce(sum(amount_requested), 0),
          'requested_awaiting', coalesce(sum(amount_requested) filter (where mca_stage = 'awaiting'), 0),
          'allocated', coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0),
          'median_allocation', percentile_cont(0.5) within group (order by amount_allocated::float8)
            filter (where mca_stage = 'approved' and amount_allocated is not null),
          'median_days_to_chief', percentile_cont(0.5) within group (
            order by (extract(epoch from (chief_approved_at - submitted_at)) / 86400)::float8
          ) filter (where submitted_at is not null),
          'median_days_to_mca', percentile_cont(0.5) within group (
            order by (extract(epoch from (mca_decided_at - chief_approved_at)) / 86400)::float8
          ) filter (where mca_decided_at is not null),
          'oldest_awaiting_days', max((extract(epoch from (now() - chief_approved_at)) / 86400)::float8)
            filter (where mca_stage = 'awaiting')
        )
        from f
      ),
      'by_level', (
        select coalesce(jsonb_agg(row_to_json(x) order by x.applicants desc), '[]'::jsonb)
        from (
          select education_level as label,
                 count(*) as applicants,
                 count(*) filter (where mca_stage = 'approved') as approved,
                 count(*) filter (where mca_stage = 'awaiting') as awaiting,
                 coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0) as allocated
          from f group by 1
        ) x
      ),
      'by_ward', (
        select coalesce(jsonb_agg(row_to_json(x) order by x.applicants desc), '[]'::jsonb)
        from (
          select ward as label,
                 count(*) as applicants,
                 count(*) filter (where mca_stage = 'approved') as approved,
                 count(*) filter (where mca_stage = 'awaiting') as awaiting,
                 coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0) as allocated
          from f group by 1
        ) x
      ),
      'by_location', (
        select coalesce(jsonb_agg(row_to_json(x) order by x.applicants desc), '[]'::jsonb)
        from (
          select location as label,
                 min(ward) as ward,
                 count(*) as applicants,
                 count(*) filter (where mca_stage = 'approved') as approved,
                 count(*) filter (where mca_stage = 'awaiting') as awaiting,
                 coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0) as allocated
          from f group by 1
        ) x
      ),
      'by_polling_station', (
        select coalesce(jsonb_agg(row_to_json(x) order by x.applicants desc), '[]'::jsonb)
        from (
          select polling_station as label,
                 min(ward) as ward,
                 count(*) as applicants,
                 count(*) filter (where mca_stage = 'approved') as approved,
                 count(*) filter (where mca_stage = 'awaiting') as awaiting,
                 coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0) as allocated
          from f group by 1
          order by count(*) desc
          limit 15
        ) x
      ),
      'by_school', (
        select coalesce(jsonb_agg(row_to_json(x) order by x.applicants desc), '[]'::jsonb)
        from (
          select school as label,
                 min(education_level) as level,
                 count(*) as applicants,
                 count(*) filter (where mca_stage = 'approved') as approved,
                 coalesce(avg(amount_requested), 0) as avg_requested,
                 coalesce(sum(amount_allocated) filter (where mca_stage = 'approved'), 0) as allocated
          from f group by 1
          order by count(*) desc
          limit 10
        ) x
      ),
      'weekly', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'week', w.week::date,
          'verified', coalesce(v.n, 0),
          'decided', coalesce(d.n, 0)
        ) order by w.week), '[]'::jsonb)
        from weeks w
        left join verified_weekly v on v.week = w.week
        left join decided_weekly d on d.week = w.week
      )
    )
  );

  return v_result;
end;
$$;

create or replace function mca_filter_options()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not is_mca() then
    raise exception 'MCA access only' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'cycles', (
      select coalesce(jsonb_agg(label order by label desc), '[]'::jsonb)
      from (
        select distinct cycle as label from mca_application_facts where cycle is not null
        union
        select label from bursary_cycles
      ) c
    ),
    'wards', (select coalesce(jsonb_agg(distinct ward), '[]'::jsonb) from mca_application_facts),
    'levels', (select coalesce(jsonb_agg(distinct education_level), '[]'::jsonb) from mca_application_facts),
    'schools', (select coalesce(jsonb_agg(distinct school), '[]'::jsonb) from mca_application_facts),
    'locations', (select coalesce(jsonb_agg(distinct location), '[]'::jsonb) from mca_application_facts),
    'polling_stations', (select coalesce(jsonb_agg(distinct polling_station), '[]'::jsonb) from mca_application_facts)
  );
end;
$$;

-- ——— MCA decision: one transaction, row lock, budget guard, student notified ———

create or replace function mca_decide(
  p_application_id uuid,
  p_action text,
  p_amount numeric default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app student_applications%rowtype;
  v_budget numeric;
  v_committed numeric;
  v_status text;
begin
  if not is_mca() then
    raise exception 'MCA access only' using errcode = '42501';
  end if;
  if p_action not in ('approve', 'decline') then
    raise exception 'Unknown decision';
  end if;

  select * into v_app from student_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found';
  end if;
  if v_app.chief_approved_at is null then
    raise exception 'Only chief-approved applications reach the MCA';
  end if;
  if v_app.application_status not in ('chief_approved', 'mca_review') then
    raise exception 'This application already has an MCA decision';
  end if;
  if not exists (select 1 from mca_application_facts where id = p_application_id) then
    raise exception 'This application is outside your wards' using errcode = '42501';
  end if;

  if p_action = 'approve' then
    if p_amount is null or p_amount <= 0 then
      raise exception 'Enter the amount to allocate';
    end if;
    if v_app.amount_requested is not null and p_amount > v_app.amount_requested then
      raise exception 'Allocation is above the amount requested';
    end if;

    select budget into v_budget from bursary_cycles where label = v_app.cycle;
    if coalesce(v_budget, 0) > 0 then
      select coalesce(sum(amount_allocated), 0) into v_committed
      from student_applications
      where cycle = v_app.cycle
        and application_status in ('approved', 'funds_sent', 'disbursed');
      if v_committed + p_amount > v_budget then
        raise exception 'Allocation exceeds the remaining cycle budget of %', v_budget - v_committed;
      end if;
    end if;
    v_status := 'approved';
  else
    if coalesce(trim(p_note), '') = '' then
      raise exception 'Give the reason for declining';
    end if;
    v_status := 'rejected';
  end if;

  update student_applications
  set application_status = v_status,
      current_office = case when v_status = 'approved' then 'treasury' else null end,
      amount_allocated = case when v_status = 'approved' then p_amount else null end,
      decided_by_mca = auth.uid(),
      mca_decided_at = now(),
      mca_note = nullif(trim(p_note), '')
  where id = p_application_id;

  insert into student_notifications (student_profile_id, title, message, is_read)
  values (
    v_app.student_profile_id,
    case when v_status = 'approved' then 'Bursary approved' else 'Application not approved' end,
    case
      when v_status = 'approved' then 'The MCA office approved KES ' || to_char(p_amount, 'FM999,999,999') || ' for this cycle.'
      else coalesce(nullif(trim(p_note), ''), 'The MCA office did not approve this application.')
    end,
    false
  );

  return jsonb_build_object('id', p_application_id, 'status', v_status, 'amount', p_amount);
end;
$$;

revoke all on function mca_decide(uuid, text, numeric, text) from public;
grant execute on function mca_decide(uuid, text, numeric, text) to authenticated;
grant execute on function mca_dashboard_summary(text, text, text, text, text, text) to authenticated;
grant execute on function mca_filter_options() to authenticated;
grant select on mca_application_facts to authenticated;
