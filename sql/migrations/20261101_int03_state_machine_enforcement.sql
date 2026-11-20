-- ==============================================================================
-- MIGRATION: 20261101_int03_state_machine_enforcement.sql
-- DEFECT INT-03: State Machine Sequence Enforcement & Applicant Lockout
-- ==============================================================================

-- 1. Extend application_status_type enum to include institutional workflow tokens
DO $$ BEGIN
  ALTER TYPE public.application_status_type ADD VALUE IF NOT EXISTS 'chief_approved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.application_status_type ADD VALUE IF NOT EXISTS 'mca_approved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.application_status_type ADD VALUE IF NOT EXISTS 'disbursed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. State Machine Unidirectional Transition and Editing Lock Trigger
CREATE OR REPLACE FUNCTION public.enforce_application_lifecycle_state_machine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_new_status text;
  v_is_staff boolean;
BEGIN
  v_old_status := OLD.application_status::text;
  v_new_status := NEW.application_status::text;

  -- Determine if actor has administrative/review credentials
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.auth_user_id = auth.uid() 
      AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
      AND ur.is_active = true
  ) INTO v_is_staff;

  -- Check 1: Lock applicant editing capabilities once submitted or under review
  IF v_old_status IN ('submitted', 'under_review', 'chief_approved', 'mca_approved', 'approved', 'disbursed') THEN
    IF NOT v_is_staff AND auth.uid() IS NOT NULL THEN
      IF (OLD.institution_name IS DISTINCT FROM NEW.institution_name)
        OR (OLD.institution_level IS DISTINCT FROM NEW.institution_level)
        OR (OLD.requested_amount IS DISTINCT FROM NEW.requested_amount)
        OR (OLD.student_profile_id IS DISTINCT FROM NEW.student_profile_id)
        OR (OLD.application_window_id IS DISTINCT FROM NEW.application_window_id) THEN
        RAISE EXCEPTION 'Editing locked: Application is currently in status "%" and cannot be modified by the applicant.', v_old_status
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  -- If status is not changing, allow update (e.g. committee updating notes or review flags)
  IF v_old_status = v_new_status THEN
    RETURN NEW;
  END IF;

  -- Check 2: Enforce unidirectional lifecycle sequence
  CASE v_old_status
    WHEN 'draft' THEN
      IF v_new_status NOT IN ('submitted', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition: Draft application can only transition to "submitted" (or "rejected"). Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'submitted' THEN
      IF v_new_status NOT IN ('under_review', 'chief_approved', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition: Submitted application can only transition to "under_review", "chief_approved", or "rejected". Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'under_review' THEN
      IF v_new_status NOT IN ('chief_approved', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition: Application under review can only transition to "chief_approved", "approved", or "rejected". Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'chief_approved' THEN
      IF v_new_status NOT IN ('mca_approved', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition: Chief-approved application can only transition to "mca_approved" (or "rejected"). Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'approved', 'mca_approved' THEN
      IF v_new_status NOT IN ('disbursed', 'appealed', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition: Approved application can only transition to "disbursed" or "appealed". Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'rejected' THEN
      IF v_new_status NOT IN ('appealed') THEN
        RAISE EXCEPTION 'Illegal state transition: Rejected application can only transition to "appealed". Attempted: %', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'appealed' THEN
      IF v_new_status NOT IN ('under_review', 'chief_approved', 'mca_approved', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Illegal state transition from "appealed" to "%".', v_new_status
          USING ERRCODE = '23514';
      END IF;

    WHEN 'disbursed' THEN
      RAISE EXCEPTION 'Terminal state: Disbursed applications cannot be modified or re-transitioned.'
        USING ERRCODE = '23514';

    ELSE
      -- Custom fallback
  END CASE;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to public.student_applications
DROP TRIGGER IF EXISTS trg_enforce_application_lifecycle ON public.student_applications;
CREATE TRIGGER trg_enforce_application_lifecycle
  BEFORE UPDATE ON public.student_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_application_lifecycle_state_machine();
