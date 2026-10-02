-- Account allocation: profiles, identity documents, wizard progress, parent linking.
-- Run in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS / additive).

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS account_class text,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS category_locked boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS birth_certificate_number text,
  ADD COLUMN IF NOT EXISTS wizard_completed jsonb DEFAULT '{}'::jsonb;

UPDATE public.student_profiles
SET account_class = CASE
      WHEN parent_created AND delegated_access THEN 'delegated'
      WHEN parent_created THEN 'custody'
      ELSE 'independent'
    END
WHERE account_class IS NULL;

UPDATE public.student_profiles
SET account_status = CASE
      WHEN is_active AND national_id_verified THEN 'active'
      WHEN national_id_verified THEN 'verifying'
      ELSE 'pending'
    END
WHERE account_status IS NULL;

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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
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
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL
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
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (student_profile_id, parent_national_id)
);

CREATE INDEX IF NOT EXISTS identity_documents_owner_idx
  ON public.identity_documents (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS wizard_steps_owner_idx
  ON public.wizard_steps (auth_user_id, flow_id);
CREATE INDEX IF NOT EXISTS pending_parent_id_idx
  ON public.pending_parent_identities (parent_national_id);
CREATE INDEX IF NOT EXISTS parent_profiles_national_id_idx
  ON public.parent_profiles (national_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'parent_student_links_unique_pair'
  ) THEN
    ALTER TABLE public.parent_student_links
      ADD CONSTRAINT parent_student_links_unique_pair
      UNIQUE (parent_auth_user_id, student_profile_id);
  END IF;
END $$;

ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wizard_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_parent_identities ENABLE ROW LEVEL SECURITY;

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
  FOR ALL USING (parent_auth_user_id = auth.uid())
  WITH CHECK (parent_auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_insert_self ON public.user_roles;
CREATE POLICY user_roles_insert_self ON public.user_roles
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_select_self ON public.user_roles;
CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT USING (auth_user_id = auth.uid());
