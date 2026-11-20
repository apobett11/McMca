-- ==============================================================================
-- MIGRATION: 20261101_sec03_age_boundary_spoofing.sql
-- DEFECT SEC-03: Registration Age & Boundary Spoofing Lockdown
-- ==============================================================================

-- 1. Database-level age calculation function
CREATE OR REPLACE FUNCTION public.compute_age_years(dob date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, dob))::integer;
$$;

GRANT EXECUTE ON FUNCTION public.compute_age_years(date) TO authenticated, anon;

-- 2. Trigger function to enforce age and identity constraints on student_profiles
CREATE OR REPLACE FUNCTION public.validate_student_age_and_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_age integer;
  v_clean_class text;
  v_clean_type text;
BEGIN
  v_clean_class := LOWER(COALESCE(NEW.account_class, ''));
  v_clean_type := UPPER(COALESCE(NEW.student_type, ''));

  -- Calculate age if date_of_birth is present
  IF NEW.date_of_birth IS NOT NULL THEN
    v_age := public.compute_age_years(NEW.date_of_birth);
  ELSE
    v_age := NULL;
  END IF;

  -- 1. Independent Student (IND) Validations
  IF v_clean_class IN ('ind', 'independent') OR v_clean_type = 'IND' THEN
    -- Must have valid date of birth
    IF NEW.date_of_birth IS NULL THEN
      RAISE EXCEPTION 'Independent students must provide a valid date of birth.';
    END IF;

    -- Age must be 18+ (Age of Majority Act Cap 33 / Children Act 2022)
    IF v_age < 18 THEN
      RAISE EXCEPTION 'Statutory requirement: Students under 18 years of age cannot register as independent (IND). Custody registration by a parent or legal guardian is required. Current age: %', v_age;
    END IF;

    -- Must have a valid Kenyan National ID (7 to 9 digits)
    IF NEW.national_id IS NULL OR NOT (NEW.national_id ~ '^[0-9]{7,9}$') THEN
      RAISE EXCEPTION 'Independent students must provide a valid 7 to 9 digit Kenyan National ID number.';
    END IF;
  END IF;

  -- 2. Custody Student (CUS) Validations
  IF v_clean_class IN ('cus', 'custody') OR v_clean_type = 'CUS' THEN
    -- Custody students cannot have direct auth credentials
    NEW.category_locked := true;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to public.student_profiles
DROP TRIGGER IF EXISTS trg_validate_student_age_and_id ON public.student_profiles;
CREATE TRIGGER trg_validate_student_age_and_id
  BEFORE INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_age_and_id();

-- 4. Check constraints on public.student_profiles
ALTER TABLE public.student_profiles
  DROP CONSTRAINT IF EXISTS check_independent_student_age;

ALTER TABLE public.student_profiles
  ADD CONSTRAINT check_independent_student_age
  CHECK (
    LOWER(COALESCE(account_class, student_type, '')) NOT IN ('ind', 'independent')
    OR (date_of_birth IS NOT NULL AND date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
  );

ALTER TABLE public.student_profiles
  DROP CONSTRAINT IF EXISTS check_national_id_format;

ALTER TABLE public.student_profiles
  ADD CONSTRAINT check_national_id_format
  CHECK (
    national_id IS NULL 
    OR national_id ~ '^[0-9]{7,9}$'
  );
