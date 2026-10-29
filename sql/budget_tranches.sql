-- Budget tranches: the ward-level pool the MCA committee allocates from.
-- The Executive workspace (/mca/*) reads/writes this shape. Until this migration
-- is applied it runs against a localStorage mirror with identical column names
-- (see src/workspaces/mca/store.ts).

CREATE TABLE IF NOT EXISTS public.budget_tranches (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  academic_cycle text NOT NULL,                       -- e.g. '2026/2027'
  title text NOT NULL,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  committed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  hard_cap_amount numeric(14,2) NOT NULL,             -- cannot commit past this
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

-- Read: authenticated staff. Write: only via service role / RPC (no direct policy).
DROP POLICY IF EXISTS budget_tranches_read ON public.budget_tranches;
CREATE POLICY budget_tranches_read ON public.budget_tranches
  FOR SELECT TO authenticated USING (true);
