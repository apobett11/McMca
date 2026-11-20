-- ==============================================================================
-- budget_tranches.sql
-- DEFECT INT-02: MCA Hard Budget Cap & Concurrency Row Locking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.budget_tranches (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  academic_cycle text NOT NULL,                       -- e.g. '2026/2027'
  title text NOT NULL,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  committed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  hard_cap_amount numeric(14,2) NOT NULL,             -- cannot commit past this (KES 15,000,000)
  reserve_amount numeric(14,2) NOT NULL DEFAULT 0,    -- Special Hardship Emergency Reserve
  reserve_committed numeric(14,2) NOT NULL DEFAULT 0,
  warn_threshold_pct numeric(5,2) NOT NULL DEFAULT 80,
  min_sublocation_share_pct numeric(5,2) NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT budget_tranches_cap_ok CHECK (committed_amount <= hard_cap_amount),
  CONSTRAINT budget_tranches_reserve_ok CHECK (reserve_committed <= reserve_amount)
);

CREATE UNIQUE INDEX IF NOT EXISTS budget_tranches_one_active
  ON public.budget_tranches ((is_active)) WHERE is_active;

ALTER TABLE public.budget_tranches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_tranches_read ON public.budget_tranches;
CREATE POLICY budget_tranches_read ON public.budget_tranches
  FOR SELECT TO authenticated USING (true);

-- Concurrency-Safe Batch Approval RPC with SELECT ... FOR UPDATE
CREATE OR REPLACE FUNCTION public.mca_batch_approve_applications(
  p_tranche_id uuid,
  p_approvals jsonb,
  p_is_reserve boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tranche record;
  v_item jsonb;
  v_app_id uuid;
  v_amount numeric;
  v_justification text;
  v_total_batch_delta numeric := 0;
  v_updated_count integer := 0;
  v_cur_allocated numeric;
BEGIN
  -- Acquire pessimistic row-level exclusive lock on target budget tranche
  SELECT *
  INTO v_tranche
  FROM public.budget_tranches
  WHERE id = p_tranche_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget tranche % not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_tranche.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Budget tranche % is not currently active.' USING ERRCODE = 'P0003';
  END IF;

  -- Validate items and compute net delta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_approvals)
  LOOP
    v_app_id := (v_item->>'application_id')::uuid;
    v_amount := (v_item->>'amount')::numeric;

    IF v_amount IS NULL OR v_amount <= 0 THEN
      RAISE EXCEPTION 'Approved allocation amount for application % must be greater than zero.', v_app_id;
    END IF;

    SELECT COALESCE(allocated_amount, 0)
    INTO v_cur_allocated
    FROM public.student_applications
    WHERE id = v_app_id;

    v_total_batch_delta := v_total_batch_delta + (v_amount - v_cur_allocated);
  END LOOP;

  -- Verify Hard Cap: committed_amount + delta <= hard_cap_amount
  IF (v_tranche.committed_amount + v_total_batch_delta) > v_tranche.hard_cap_amount THEN
    RAISE EXCEPTION 'Statutory PFM Act violation: Committing KES % would exceed the tranche hard cap of KES % by KES %.',
      (v_tranche.committed_amount + v_total_batch_delta),
      v_tranche.hard_cap_amount,
      ((v_tranche.committed_amount + v_total_batch_delta) - v_tranche.hard_cap_amount)
      USING ERRCODE = '23514';
  END IF;

  -- Verify Reserve Cap if emergency reserve requested
  IF p_is_reserve AND (v_tranche.reserve_committed + v_total_batch_delta) > v_tranche.reserve_amount THEN
    RAISE EXCEPTION 'Statutory Emergency Reserve exhausted: Committing KES % exceeds the maximum reserve pool of KES %.',
      (v_tranche.reserve_committed + v_total_batch_delta),
      v_tranche.reserve_amount
      USING ERRCODE = '23514';
  END IF;

  -- Mutate student_applications atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_approvals)
  LOOP
    v_app_id := (v_item->>'application_id')::uuid;
    v_amount := (v_item->>'amount')::numeric;
    v_justification := COALESCE(v_item->>'justification', 'Approved by MCA Executive Committee');

    UPDATE public.student_applications
    SET
      application_status = 'approved',
      mca_approval_status = 'approved',
      allocated_amount = v_amount,
      approved_at = now(),
      updated_at = now()
    WHERE id = v_app_id;

    INSERT INTO public.student_activity_logs (
      student_profile_id,
      activity_type,
      activity_description,
      actor_id,
      metadata
    )
    SELECT
      student_profile_id,
      'mca_award_committed',
      'Bursary award of KES ' || v_amount::text || ' approved by MCA Committee. Justification: ' || v_justification,
      auth.uid(),
      jsonb_build_object(
        'tranche_id', p_tranche_id,
        'application_id', v_app_id,
        'allocated_amount', v_amount,
        'is_reserve', p_is_reserve,
        'justification', v_justification
      )
    FROM public.student_applications
    WHERE id = v_app_id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Update budget_tranches row atomically
  UPDATE public.budget_tranches
  SET
    committed_amount = committed_amount + v_total_batch_delta,
    reserve_committed = reserve_committed + (CASE WHEN p_is_reserve THEN v_total_batch_delta ELSE 0 END),
    updated_at = now()
  WHERE id = p_tranche_id
  RETURNING * INTO v_tranche;

  RETURN jsonb_build_object(
    'ok', true,
    'updated_count', v_updated_count,
    'tranche_id', v_tranche.id,
    'committed_amount', v_tranche.committed_amount,
    'remaining_amount', (v_tranche.hard_cap_amount - v_tranche.committed_amount),
    'hard_cap_amount', v_tranche.hard_cap_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mca_batch_approve_applications TO authenticated;
