-- ==============================================================================
-- MIGRATION: 20261101_sec02_storage_lockdown.sql
-- DEFECT SEC-02: Storage Bucket Lockdown & KDPA Privacy
-- ==============================================================================

-- 1. Ensure the 'student-documents' bucket is strictly private and enforces permitted MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,
  15728640, -- 15MB max file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent permissive leaks or duplicate rules
DROP POLICY IF EXISTS "student_documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "student_documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "student_documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "student_documents_delete_policy" ON storage.objects;

-- 4. SELECT Policy: Private Signed URL generation and download access
-- Allows access only if caller is:
--   - The independent/delegated student owner of the document path
--   - The verified parent linked to the student
--   - The parent owner of a parent identity document
--   - An authorized administrative role (chief, helpdesk, mca, committee, admin)
CREATE POLICY "student_documents_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      -- Student documents path: student-documents/{student_profile_id}/...
      (
        (storage.foldername(name))[1] = 'student-documents'
        AND (
          public.owns_student_profile(((storage.foldername(name))[2])::uuid)
          OR ((storage.foldername(name))[2])::uuid IN (SELECT public.linked_student_ids_for_uid())
        )
      )
      -- Identity student documents: identity/student/{student_profile_id}/...
      OR (
        (storage.foldername(name))[1] = 'identity'
        AND (storage.foldername(name))[2] = 'student'
        AND (
          public.owns_student_profile(((storage.foldername(name))[3])::uuid)
          OR ((storage.foldername(name))[3])::uuid IN (SELECT public.linked_student_ids_for_uid())
        )
      )
      -- Identity parent documents: identity/parent/{parent_profile_id}/...
      OR (
        (storage.foldername(name))[1] = 'identity'
        AND (storage.foldername(name))[2] = 'parent'
        AND EXISTS (
          SELECT 1 FROM public.parent_profiles pp
          WHERE pp.id = ((storage.foldername(name))[3])::uuid
            AND pp.auth_user_id = auth.uid()
        )
      )
      -- Administrative roles
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.auth_user_id = auth.uid()
          AND ur.role IN ('chief', 'helpdesk', 'mca', 'committee', 'admin')
          AND ur.is_active = true
      )
    )
  );

-- 5. INSERT Policy: Upload Lockdown
-- Prohibits custody students; enforces that the target folder path matches caller identity
CREATE POLICY "student_documents_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND NOT public.is_custody_account(auth.uid())
    AND (
      -- Student uploading to own profile directory
      (
        (storage.foldername(name))[1] = 'student-documents'
        AND (
          public.owns_student_profile(((storage.foldername(name))[2])::uuid)
          OR ((storage.foldername(name))[2])::uuid IN (SELECT public.linked_student_ids_for_uid())
        )
      )
      -- Student identity upload
      OR (
        (storage.foldername(name))[1] = 'identity'
        AND (storage.foldername(name))[2] = 'student'
        AND (
          public.owns_student_profile(((storage.foldername(name))[3])::uuid)
          OR ((storage.foldername(name))[3])::uuid IN (SELECT public.linked_student_ids_for_uid())
        )
      )
      -- Parent identity upload
      OR (
        (storage.foldername(name))[1] = 'identity'
        AND (storage.foldername(name))[2] = 'parent'
        AND EXISTS (
          SELECT 1 FROM public.parent_profiles pp
          WHERE pp.id = ((storage.foldername(name))[3])::uuid
            AND pp.auth_user_id = auth.uid()
        )
      )
    )
  );

-- 6. UPDATE Policy: Strictly deny mutating uploaded files except by owner or admin
CREATE POLICY "student_documents_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.auth_user_id = auth.uid()
          AND ur.role IN ('admin', 'helpdesk')
          AND ur.is_active = true
      )
    )
  );

-- 7. DELETE Policy: Strictly deny deleting verified documents except by uploader or admin
CREATE POLICY "student_documents_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.auth_user_id = auth.uid()
          AND ur.role IN ('admin', 'helpdesk')
          AND ur.is_active = true
      )
    )
  );
