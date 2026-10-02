-- Break RLS cycles between student_profiles and parent_student_links.
-- Policies that subquery each other cause "infinite recursion detected".

CREATE OR REPLACE FUNCTION public.linked_student_ids_for_uid()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT student_profile_id
  FROM public.parent_student_links
  WHERE parent_auth_user_id = auth.uid()
$$;

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
  )
$$;

GRANT EXECUTE ON FUNCTION public.linked_student_ids_for_uid() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.owns_student_profile(uuid) TO authenticated, anon;

DROP POLICY IF EXISTS student_profiles_select_linked ON public.student_profiles;
CREATE POLICY student_profiles_select_linked ON public.student_profiles
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR id IN (SELECT public.linked_student_ids_for_uid())
  );

DROP POLICY IF EXISTS student_profiles_update_linked ON public.student_profiles;
CREATE POLICY student_profiles_update_linked ON public.student_profiles
  FOR UPDATE USING (
    auth_user_id = auth.uid()
    OR id IN (SELECT public.linked_student_ids_for_uid())
  );

DROP POLICY IF EXISTS parent_student_links_own ON public.parent_student_links;
CREATE POLICY parent_student_links_own ON public.parent_student_links
  FOR ALL USING (
    parent_auth_user_id = auth.uid()
    OR public.owns_student_profile(student_profile_id)
  )
  WITH CHECK (parent_auth_user_id = auth.uid());

DROP POLICY IF EXISTS pending_parent_identities_access ON public.pending_parent_identities;
CREATE POLICY pending_parent_identities_access ON public.pending_parent_identities
  FOR ALL USING (
    public.owns_student_profile(student_profile_id)
    OR parent_national_id IN (
      SELECT national_id FROM public.parent_profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (public.owns_student_profile(student_profile_id));

DROP POLICY IF EXISTS student_apps_own ON public.student_applications;
CREATE POLICY student_apps_own ON public.student_applications
  FOR ALL USING (
    public.owns_student_profile(student_profile_id)
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
  );

DROP POLICY IF EXISTS student_docs_own ON public.student_documents;
CREATE POLICY student_docs_own ON public.student_documents
  FOR ALL USING (
    public.owns_student_profile(student_profile_id)
    OR student_profile_id IN (SELECT public.linked_student_ids_for_uid())
  );

DROP POLICY IF EXISTS student_notes_own ON public.student_notifications;
CREATE POLICY student_notes_own ON public.student_notifications
  FOR ALL USING (public.owns_student_profile(student_profile_id));

DROP POLICY IF EXISTS student_logs_own ON public.student_activity_logs;
CREATE POLICY student_logs_own ON public.student_activity_logs
  FOR ALL USING (public.owns_student_profile(student_profile_id));
