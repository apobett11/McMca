-- ==============================================================================
-- MIGRATION: 20261101_sec01_accountgate_rls.sql
-- DEFECT SEC-01: AccountGate & Database-Level RLS Perimeter Hardening
-- ==============================================================================

-- 1. Helper function: Detect if an auth account is tied to a custody student profile
CREATE OR REPLACE FUNCTION public.is_custody_account(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_profiles
    WHERE auth_user_id = uid
      AND LOWER(COALESCE(account_class, student_type, '')) IN ('custody', 'cus')
  )
$$;

-- 2. Security Definer: Safely determine linked student IDs without RLS recursion
CREATE OR REPLACE FUNCTION public.linked_student_ids_for_uid()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT psl.student_profile_id
  FROM public.parent_student_links psl
  WHERE psl.parent_auth_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_profiles pp
      WHERE pp.auth_user_id = auth.uid()
    )
$$;

-- 3. Security Definer: Determine if caller owns student profile (DENYING custody accounts)
CREATE OR REPLACE FUNCTION public.owns_student_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_profiles
    WHERE id = profile_id
      AND auth_user_id = auth.uid()
      AND LOWER(COALESCE(account_class, student_type, 'independent')) NOT IN ('custody', 'cus')
  )
$$;

-- 4. Grant explicit execution permissions
GRANT EXECUTE ON FUNCTION public.is_custody_account(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.linked_student_ids_for_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.owns_student_profile(uuid) TO authenticated, anon;

-- ==============================================================================
-- RLS POLICIES: student_profiles
-- ==============================================================================
DROP POLICY IF EXISTS student_profiles_select_linked ON public.student_profiles;
CREATE POLICY student_profiles_select_linked ON public.student_profiles
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR id IN (SELECT public.linked_student_ids_for_uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS student_profiles_update_linked ON public.student_profiles;
CREATE POLICY student_profiles_update_linked ON public.student_profiles
  FOR UPDATE USING (
    (auth_user_id = auth.uid() AND NOT public.is_custody_account(auth.uid()))
    OR id IN (SELECT public.linked_student_ids_for_uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );

-- ==============================================================================
-- RLS POLICIES: parent_student_links
-- ==============================================================================
DROP POLICY IF EXISTS parent_student_links_own ON public.parent_student_links;
DROP POLICY IF EXISTS parent_student_links_select ON public.parent_student_links;
DROP POLICY IF EXISTS parent_student_links_insert ON public.parent_student_links;
DROP POLICY IF EXISTS parent_student_links_update ON public.parent_student_links;
DROP POLICY IF EXISTS parent_student_links_delete ON public.parent_student_links;

CREATE POLICY parent_student_links_select ON public.parent_student_links
  FOR SELECT USING (
    parent_auth_user_id = auth.uid()
    OR public.owns_student_profile(student_profile_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY parent_student_links_insert ON public.parent_student_links
  FOR INSERT WITH CHECK (
    parent_auth_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.parent_profiles pp
      WHERE pp.auth_user_id = auth.uid()
    )
  );

CREATE POLICY parent_student_links_update ON public.parent_student_links
  FOR UPDATE USING (
    parent_auth_user_id = auth.uid()
  ) WITH CHECK (
    parent_auth_user_id = auth.uid()
  );

CREATE POLICY parent_student_links_delete ON public.parent_student_links
  FOR DELETE USING (
    parent_auth_user_id = auth.uid()
  );

-- ==============================================================================
-- RLS POLICIES: student_applications (CUSTODY BLOCKED AT POSTGREST LAYER)
-- ==============================================================================
DROP POLICY IF EXISTS student_apps_own ON public.student_applications;
DROP POLICY IF EXISTS student_apps_select ON public.student_applications;
DROP POLICY IF EXISTS student_apps_insert ON public.student_applications;
DROP POLICY IF EXISTS student_apps_update ON public.student_applications;
DROP POLICY IF EXISTS student_apps_delete ON public.student_applications;

CREATE POLICY student_apps_select ON public.student_applications
  FOR SELECT USING (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );

CREATE POLICY student_apps_insert ON public.student_applications
  FOR INSERT WITH CHECK (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR (
      student_profile_id IN (SELECT public.linked_student_ids_for_uid())
      AND EXISTS (
        SELECT 1 FROM public.parent_student_links
        WHERE parent_auth_user_id = auth.uid()
          AND student_profile_id = public.student_applications.student_profile_id
          AND can_manage = true
      )
    )
  );

CREATE POLICY student_apps_update ON public.student_applications
  FOR UPDATE USING (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR (
      student_profile_id IN (SELECT public.linked_student_ids_for_uid())
      AND EXISTS (
        SELECT 1 FROM public.parent_student_links
        WHERE parent_auth_user_id = auth.uid()
          AND student_profile_id = public.student_applications.student_profile_id
          AND can_manage = true
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );

-- ==============================================================================
-- RLS POLICIES: student_documents & identity_documents
-- ==============================================================================
DROP POLICY IF EXISTS student_docs_own ON public.student_documents;
CREATE POLICY student_docs_own ON public.student_documents
  FOR ALL USING (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  )
  WITH CHECK (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
  );

DROP POLICY IF EXISTS identity_documents_own ON public.identity_documents;
CREATE POLICY identity_documents_own ON public.identity_documents
  FOR ALL USING (
    (uploaded_by = auth.uid() AND NOT public.is_custody_account(auth.uid()))
    OR (
      student_profile_id IS NOT NULL 
      AND student_profile_id IN (SELECT public.linked_student_ids_for_uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  )
  WITH CHECK (
    (uploaded_by = auth.uid() AND NOT public.is_custody_account(auth.uid()))
    OR (
      student_profile_id IS NOT NULL 
      AND student_profile_id IN (SELECT public.linked_student_ids_for_uid())
    )
  );

-- ==============================================================================
-- RLS POLICIES: student_notifications & student_activity_logs
-- ==============================================================================
DROP POLICY IF EXISTS student_notes_own ON public.student_notifications;
CREATE POLICY student_notes_own ON public.student_notifications
  FOR ALL USING (
    NOT public.is_custody_account(auth.uid()) 
    AND public.owns_student_profile(student_profile_id)
  );

DROP POLICY IF EXISTS student_logs_own ON public.student_activity_logs;
CREATE POLICY student_logs_own ON public.student_activity_logs
  FOR ALL USING (
    (NOT public.is_custody_account(auth.uid()) AND public.owns_student_profile(student_profile_id))
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.auth_user_id = auth.uid()
        AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
        AND ur.is_active = true
    )
  );
