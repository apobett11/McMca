-- Minimal public schema for this Supabase project (public was empty).
-- Enums + tables the app reads, plus account-allocation extras.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.student_type_enum AS ENUM ('IND', 'DEL', 'CUS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('student', 'parent', 'chief', 'mca');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status_type AS ENUM (
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'appealed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  auth_user_id uuid UNIQUE,
  student_type public.student_type_enum NOT NULL,
  admission_number text,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  gender text,
  date_of_birth date NOT NULL,
  national_id text,
  email text,
  phone_number text,
  email_verified boolean DEFAULT false NOT NULL,
  phone_verified boolean DEFAULT false NOT NULL,
  national_id_verified boolean DEFAULT false NOT NULL,
  delegated_access boolean DEFAULT false NOT NULL,
  parent_created boolean DEFAULT false NOT NULL,
  school_name text,
  school_level text,
  institution_code text,
  county text,
  ward text,
  location_name text,
  profile_photo_url text,
  is_active boolean DEFAULT true NOT NULL,
  account_class text,
  account_status text DEFAULT 'pending',
  category_locked boolean DEFAULT true NOT NULL,
  birth_certificate_number text,
  wizard_completed jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  auth_user_id uuid UNIQUE,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  gender text,
  date_of_birth date,
  national_id text UNIQUE,
  email text,
  phone_number text,
  email_verified boolean DEFAULT false NOT NULL,
  phone_verified boolean DEFAULT false NOT NULL,
  national_id_verified boolean DEFAULT false NOT NULL,
  profile_photo_url text,
  account_status text DEFAULT 'pending' NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  wizard_completed jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  auth_user_id uuid NOT NULL UNIQUE,
  role public.user_role_enum NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  parent_auth_user_id uuid NOT NULL,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  relationship text,
  can_view boolean DEFAULT true NOT NULL,
  can_manage boolean DEFAULT false NOT NULL,
  linked_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wizard_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  auth_user_id uuid NOT NULL,
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  flow_id text NOT NULL,
  step_key text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (owner_type, owner_id, flow_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.pending_parent_identities (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  parent_national_id text NOT NULL,
  parent_first_name text,
  parent_middle_name text,
  parent_last_name text,
  parent_phone text,
  relationship text,
  verification_status text DEFAULT 'pending' NOT NULL,
  linked_parent_profile_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (student_profile_id, parent_national_id)
);

CREATE TABLE IF NOT EXISTS public.identity_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  student_profile_id uuid,
  document_kind text NOT NULL,
  bucket_name text NOT NULL,
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  file_size bigint,
  verification_status text DEFAULT 'uploaded' NOT NULL,
  matched_name text,
  matched_id_number text,
  readability_passed boolean DEFAULT false NOT NULL,
  visibility_passed boolean DEFAULT false NOT NULL,
  quality_notes jsonb,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.application_windows (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  academic_year integer NOT NULL,
  term text,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_window_id uuid NOT NULL REFERENCES public.application_windows(id),
  application_status public.application_status_type DEFAULT 'draft'::public.application_status_type NOT NULL,
  institution_name text,
  institution_level text,
  fee_balance numeric,
  requested_amount numeric,
  allocated_amount numeric,
  chief_approval_status public.approval_status_type DEFAULT 'pending'::public.approval_status_type NOT NULL,
  mca_approval_status public.approval_status_type DEFAULT 'pending'::public.approval_status_type NOT NULL,
  appeal_status text DEFAULT 'none'::text,
  readiness_score integer DEFAULT 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.application_details (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE,
  household_income numeric,
  guardian_name text,
  guardian_phone text,
  school_fee_total numeric,
  amount_paid numeric,
  balance numeric,
  bank_name text,
  bank_branch text,
  account_number text,
  additional_notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_id uuid,
  document_type text NOT NULL,
  bucket_name text NOT NULL,
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  file_size bigint,
  ai_verified boolean DEFAULT false NOT NULL,
  readability_passed boolean DEFAULT false NOT NULL,
  visibility_passed boolean DEFAULT false NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_activity_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_student_links_unique_pair'
  ) THEN
    ALTER TABLE public.parent_student_links
      ADD CONSTRAINT parent_student_links_unique_pair
      UNIQUE (parent_auth_user_id, student_profile_id);
  END IF;
END $$;

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wizard_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_parent_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_profiles_own ON public.parent_profiles;
CREATE POLICY parent_profiles_own ON public.parent_profiles
  FOR ALL USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS identity_documents_own ON public.identity_documents;
CREATE POLICY identity_documents_own ON public.identity_documents
  FOR ALL USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS wizard_steps_own ON public.wizard_steps;
CREATE POLICY wizard_steps_own ON public.wizard_steps
  FOR ALL USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS pending_parent_identities_access ON public.pending_parent_identities;
CREATE POLICY pending_parent_identities_access ON public.pending_parent_identities
  FOR ALL USING (
    student_profile_id IN (
      SELECT id FROM public.student_profiles WHERE auth_user_id = auth.uid()
    )
    OR parent_national_id IN (
      SELECT national_id FROM public.parent_profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    student_profile_id IN (
      SELECT id FROM public.student_profiles WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_profiles_insert_parent ON public.student_profiles;
CREATE POLICY student_profiles_insert_parent ON public.student_profiles
  FOR INSERT WITH CHECK (parent_created = true);

DROP POLICY IF EXISTS student_profiles_insert_self ON public.student_profiles;
CREATE POLICY student_profiles_insert_self ON public.student_profiles
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS student_profiles_select_linked ON public.student_profiles;
CREATE POLICY student_profiles_select_linked ON public.student_profiles
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR id IN (
      SELECT student_profile_id FROM public.parent_student_links
      WHERE parent_auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_profiles_update_linked ON public.student_profiles;
CREATE POLICY student_profiles_update_linked ON public.student_profiles
  FOR UPDATE USING (
    auth_user_id = auth.uid()
    OR id IN (
      SELECT student_profile_id FROM public.parent_student_links
      WHERE parent_auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS parent_student_links_own ON public.parent_student_links;
CREATE POLICY parent_student_links_own ON public.parent_student_links
  FOR ALL USING (
    parent_auth_user_id = auth.uid()
    OR student_profile_id IN (
      SELECT id FROM public.student_profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (parent_auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_insert_self ON public.user_roles;
CREATE POLICY user_roles_insert_self ON public.user_roles
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_select_self ON public.user_roles;
CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS student_apps_own ON public.student_applications;
CREATE POLICY student_apps_own ON public.student_applications
  FOR ALL USING (
    student_profile_id IN (
      SELECT id FROM public.student_profiles
      WHERE auth_user_id = auth.uid()
      OR id IN (SELECT student_profile_id FROM public.parent_student_links WHERE parent_auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS student_docs_own ON public.student_documents;
CREATE POLICY student_docs_own ON public.student_documents
  FOR ALL USING (
    student_profile_id IN (
      SELECT id FROM public.student_profiles
      WHERE auth_user_id = auth.uid()
      OR id IN (SELECT student_profile_id FROM public.parent_student_links WHERE parent_auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS student_notes_own ON public.student_notifications;
CREATE POLICY student_notes_own ON public.student_notifications
  FOR ALL USING (
    student_profile_id IN (SELECT id FROM public.student_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS student_logs_own ON public.student_activity_logs;
CREATE POLICY student_logs_own ON public.student_activity_logs
  FOR ALL USING (
    student_profile_id IN (SELECT id FROM public.student_profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS app_details_own ON public.application_details;
CREATE POLICY app_details_own ON public.application_details
  FOR ALL USING (
    application_id IN (SELECT id FROM public.student_applications)
  );

DROP POLICY IF EXISTS windows_read ON public.application_windows;
CREATE POLICY windows_read ON public.application_windows
  FOR SELECT USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
