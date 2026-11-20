-- ==============================================================================
-- MIGRATION: 20261101_int01_anti_duplicate_locks.sql
-- DEFECT INT-01: Anti-Duplicate Submission Locks & Transactional Concurrency
-- ==============================================================================

-- 1. Composite Unique Constraint preventing duplicate submissions per cycle
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_apps_window_profile 
  ON public.student_applications (application_window_id, student_profile_id);

ALTER TABLE public.student_applications 
  DROP CONSTRAINT IF EXISTS uq_student_apps_window_profile;

ALTER TABLE public.student_applications 
  ADD CONSTRAINT uq_student_apps_window_profile 
  UNIQUE USING INDEX uq_student_apps_window_profile;

-- 2. Atomic Submission Procedure with Transactional Advisory Lock
CREATE OR REPLACE FUNCTION public.submit_student_application_atomic(
  p_student_profile_id uuid,
  p_application_window_id uuid,
  p_institution_name text,
  p_institution_level text,
  p_requested_amount numeric DEFAULT 15000,
  p_guardian_name text DEFAULT NULL,
  p_guardian_phone text DEFAULT NULL,
  p_bank_name text DEFAULT NULL,
  p_bank_branch text DEFAULT NULL,
  p_account_number text DEFAULT NULL,
  p_household_income numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_new_app_id uuid;
  v_window_active boolean;
  v_serial text;
  v_app jsonb;
BEGIN
  -- 1. Acquire transaction-level advisory lock using deterministic hash of window + student IDs
  -- Prevents concurrent double-click race conditions at the database transaction layer
  PERFORM pg_advisory_xact_lock(
    ('x' || substr(md5(p_student_profile_id::text || p_application_window_id::text), 1, 8))::bit(32)::bigint
  );

  -- 2. Verify window exists and is active
  SELECT is_active INTO v_window_active
  FROM public.application_windows
  WHERE id = p_application_window_id;

  IF v_window_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Application window is not currently open for submissions.' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Check for existing application
  SELECT id INTO v_existing_id
  FROM public.student_applications
  WHERE student_profile_id = p_student_profile_id
    AND application_window_id = p_application_window_id;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate submission: An application has already been submitted for this bursary cycle.' USING ERRCODE = '23505';
  END IF;

  -- 4. Insert into student_applications
  INSERT INTO public.student_applications (
    student_profile_id,
    application_window_id,
    application_status,
    institution_name,
    institution_level,
    requested_amount,
    submitted_at,
    readiness_score
  ) VALUES (
    p_student_profile_id,
    p_application_window_id,
    'submitted',
    p_institution_name,
    p_institution_level,
    p_requested_amount,
    now(),
    100
  )
  RETURNING id INTO v_new_app_id;

  -- 5. Insert details
  INSERT INTO public.application_details (
    application_id,
    guardian_name,
    guardian_phone,
    bank_name,
    bank_branch,
    account_number,
    household_income
  ) VALUES (
    v_new_app_id,
    p_guardian_name,
    p_guardian_phone,
    p_bank_name,
    p_bank_branch,
    p_account_number,
    p_household_income
  );

  -- 6. Insert activity log
  v_serial := 'BUR-' || EXTRACT(YEAR FROM now())::text || '-' || substr(p_student_profile_id::text, 1, 4);
  INSERT INTO public.student_activity_logs (
    student_profile_id,
    activity_type,
    activity_description,
    metadata
  ) VALUES (
    p_student_profile_id,
    'application_submitted',
    'Applied for bursary cycle (' || v_serial || ')',
    jsonb_build_object('application_id', v_new_app_id, 'window_id', p_application_window_id, 'serial', v_serial)
  );

  SELECT row_to_json(a)::jsonb INTO v_app
  FROM public.student_applications a
  WHERE a.id = v_new_app_id;

  RETURN jsonb_build_object('ok', true, 'application', v_app);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_student_application_atomic TO authenticated;
