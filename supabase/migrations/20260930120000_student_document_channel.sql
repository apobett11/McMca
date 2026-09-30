-- Document channel for the student portal.
-- One row per student profile. Documents stay on the profile so a later
-- cycle can apply again without a new upload once the chief has verified them.
-- Safe to re-run.

alter table student_applications
  add column if not exists cycle text,
  add column if not exists current_office text,
  add column if not exists submitted_at timestamptz,
  add column if not exists review_note text;

alter table student_documents
  add column if not exists guardian_id uuid,
  add column if not exists verification_status text default 'inline_passed',
  add column if not exists scope text default 'application',
  add column if not exists inline_checks jsonb,
  add column if not exists verified_at timestamptz;

create table if not exists student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references student_profiles(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  relationship text not null default 'parent',
  national_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_guardians_profile_idx
  on student_guardians (student_profile_id);

create index if not exists student_documents_profile_type_idx
  on student_documents (student_profile_id, document_type, uploaded_at desc);

create index if not exists student_applications_profile_created_idx
  on student_applications (student_profile_id, created_at desc);

create index if not exists student_applications_chief_queue_idx
  on student_applications (current_office, application_status, created_at desc);

alter table student_guardians enable row level security;

do $$
begin
  create policy student_guardians_own on student_guardians
    for all
    using (
      student_profile_id in (
        select id from student_profiles where auth_user_id = auth.uid()
      )
    )
    with check (
      student_profile_id in (
        select id from student_profiles where auth_user_id = auth.uid()
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_read_guardians on student_guardians
    for select
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_verify_documents on student_documents
    for update
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    )
    with check (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_read_applications on student_applications
    for select
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_read_documents on student_documents
    for select
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_read_profiles on student_profiles
    for select
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy chief_review_applications on student_applications
    for update
    using (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    )
    with check (
      exists (
        select 1 from user_roles
        where auth_user_id = auth.uid()
          and role = 'chief'
      )
    );
exception
  when duplicate_object then null;
end $$;
