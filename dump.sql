-- =============================================================
-- Supabase Database Dump
-- Project: cwdxubijntcwvsngnzqw (McMCA)
-- Exported: 2026-09-28T10:57:41.838594+00:00
-- =============================================================

CREATE SCHEMA IF NOT EXISTS public;

-- Table: public."application_details"
CREATE TABLE IF NOT EXISTS public."application_details" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "application_id" uuid NOT NULL,
    "household_income" numeric,
    "guardian_name" text,
    "guardian_phone" text,
    "school_fee_total" numeric,
    "amount_paid" numeric,
    "balance" numeric,
    "bank_name" text,
    "bank_branch" text,
    "account_number" text,
    "additional_notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."application_details" (1 rows)
INSERT INTO public."application_details" ("id", "application_id", "household_income", "guardian_name", "guardian_phone", "school_fee_total", "amount_paid", "balance", "bank_name", "bank_branch", "account_number", "additional_notes", "created_at") VALUES ('bab7feb8-fe1d-4ecc-b1bd-1d92c1c74c30'::uuid, '52f940a5-57e1-4c22-b8b5-a5ad8e0c0766'::uuid, 45000.00, 'Alex Kiprotich', '+254700111222', 120000.00, 64000.00, 56000.00, 'KCB Bank', 'Nakuru Branch', '1234567890', 'Student requires financial support for tuition and accommodation.', '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."application_windows"
CREATE TABLE IF NOT EXISTS public."application_windows" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "academic_year" integer NOT NULL,
    "term" text,
    "opens_at" timestamp with time zone NOT NULL,
    "closes_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."application_windows" (1 rows)
INSERT INTO public."application_windows" ("id", "title", "academic_year", "term", "opens_at", "closes_at", "is_active", "created_at") VALUES ('4646f2ce-8509-4734-81a5-d8c51be50c45'::uuid, '2026 Ward Education Bursary', 2026, 'Term 1', '2026-06-05T18:06:35.848487+00:00', '2026-09-03T18:06:35.848487+00:00', TRUE, '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."parent_student_links"
CREATE TABLE IF NOT EXISTS public."parent_student_links" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "parent_auth_user_id" uuid NOT NULL,
    "student_profile_id" uuid NOT NULL,
    "relationship" text,
    "can_view" boolean DEFAULT true NOT NULL,
    "can_manage" boolean DEFAULT false NOT NULL,
    "linked_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- (0 rows in public."parent_student_links")

-- Table: public."student_activity_logs"
CREATE TABLE IF NOT EXISTS public."student_activity_logs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "student_profile_id" uuid NOT NULL,
    "activity_type" text NOT NULL,
    "activity_description" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."student_activity_logs" (1 rows)
INSERT INTO public."student_activity_logs" ("id", "student_profile_id", "activity_type", "activity_description", "metadata", "created_at") VALUES ('fce58171-cc43-49d7-8627-3dffe29d4842'::uuid, 'e4592478-53e9-4e15-885e-15f86765388e'::uuid, 'application_submission', 'Student submitted bursary application.', '{"source": "student_dashboard", "status": "under_review"}'::jsonb, '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."student_applications"
CREATE TABLE IF NOT EXISTS public."student_applications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "student_profile_id" uuid NOT NULL,
    "application_window_id" uuid NOT NULL,
    "application_status" USER-DEFINED DEFAULT 'draft'::application_status_type NOT NULL,
    "institution_name" text,
    "institution_level" text,
    "fee_balance" numeric,
    "requested_amount" numeric,
    "allocated_amount" numeric,
    "chief_approval_status" USER-DEFINED DEFAULT 'pending'::approval_status_type NOT NULL,
    "mca_approval_status" USER-DEFINED DEFAULT 'pending'::approval_status_type NOT NULL,
    "appeal_status" text DEFAULT 'none'::text,
    "readiness_score" integer DEFAULT 0,
    "submitted_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."student_applications" (1 rows)
INSERT INTO public."student_applications" ("id", "student_profile_id", "application_window_id", "application_status", "institution_name", "institution_level", "fee_balance", "requested_amount", "allocated_amount", "chief_approval_status", "mca_approval_status", "appeal_status", "readiness_score", "submitted_at", "approved_at", "created_at", "updated_at") VALUES ('52f940a5-57e1-4c22-b8b5-a5ad8e0c0766'::uuid, 'e4592478-53e9-4e15-885e-15f86765388e'::uuid, '4646f2ce-8509-4734-81a5-d8c51be50c45'::uuid, 'under_review', 'Egerton University', 'University', 56000.00, 40000.00, NULL, 'approved', 'pending', 'none', 92, '2026-06-05T18:06:35.848487+00:00', NULL, '2026-06-05T18:06:35.848487+00:00', '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."student_documents"
CREATE TABLE IF NOT EXISTS public."student_documents" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "student_profile_id" uuid NOT NULL,
    "application_id" uuid,
    "document_type" text NOT NULL,
    "bucket_name" text NOT NULL,
    "storage_path" text NOT NULL,
    "original_filename" text,
    "mime_type" text,
    "file_size" bigint,
    "ai_verified" boolean DEFAULT false NOT NULL,
    "readability_passed" boolean DEFAULT false NOT NULL,
    "visibility_passed" boolean DEFAULT false NOT NULL,
    "uploaded_by" uuid,
    "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."student_documents" (2 rows)
INSERT INTO public."student_documents" ("id", "student_profile_id", "application_id", "document_type", "bucket_name", "storage_path", "original_filename", "mime_type", "file_size", "ai_verified", "readability_passed", "visibility_passed", "uploaded_by", "uploaded_at") VALUES ('fddd093d-7046-4caa-90a9-8dc7dd92eedc'::uuid, 'e4592478-53e9-4e15-885e-15f86765388e'::uuid, '52f940a5-57e1-4c22-b8b5-a5ad8e0c0766'::uuid, 'fee_structure', 'student-documents', 'student-documents/e4592478-53e9-4e15-885e-15f86765388e/52f940a5-57e1-4c22-b8b5-a5ad8e0c0766/fee-structure.pdf', 'fee-structure.pdf', 'application/pdf', 245678, TRUE, TRUE, TRUE, NULL, '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public."student_documents" ("id", "student_profile_id", "application_id", "document_type", "bucket_name", "storage_path", "original_filename", "mime_type", "file_size", "ai_verified", "readability_passed", "visibility_passed", "uploaded_by", "uploaded_at") VALUES ('614d62a5-8437-4ba9-913b-225421702264'::uuid, 'e4592478-53e9-4e15-885e-15f86765388e'::uuid, NULL, 'student-id', 'student-documents', 'student-documents/e4592478-53e9-4e15-885e-15f86765388e/general/1780806539137_student-id.jpg', '89a905ac-5fce-4c7d-a0cc-c469eacbaeef.jpg', 'image/jpeg', 260993, FALSE, FALSE, FALSE, '937b0d74-764e-450b-9c8a-d66002f46655'::uuid, '2026-06-07T04:29:01.469958+00:00') ON CONFLICT DO NOTHING;

-- Table: public."student_notifications"
CREATE TABLE IF NOT EXISTS public."student_notifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "student_profile_id" uuid NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."student_notifications" (1 rows)
INSERT INTO public."student_notifications" ("id", "student_profile_id", "title", "message", "is_read", "created_at") VALUES ('6a5fb8c7-3d3e-40e3-a64f-79b37d422888'::uuid, 'e4592478-53e9-4e15-885e-15f86765388e'::uuid, 'Application Submitted', 'Your bursary application has been successfully submitted.', FALSE, '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."student_profiles"
CREATE TABLE IF NOT EXISTS public."student_profiles" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "auth_user_id" uuid,
    "student_type" USER-DEFINED NOT NULL,
    "admission_number" text,
    "first_name" text NOT NULL,
    "middle_name" text,
    "last_name" text NOT NULL,
    "gender" text,
    "date_of_birth" date NOT NULL,
    "national_id" text,
    "email" text,
    "phone_number" text,
    "email_verified" boolean DEFAULT false NOT NULL,
    "phone_verified" boolean DEFAULT false NOT NULL,
    "national_id_verified" boolean DEFAULT false NOT NULL,
    "delegated_access" boolean DEFAULT false NOT NULL,
    "parent_created" boolean DEFAULT false NOT NULL,
    "school_name" text,
    "school_level" text,
    "institution_code" text,
    "county" text,
    "ward" text,
    "location_name" text,
    "profile_photo_url" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."student_profiles" (1 rows)
INSERT INTO public."student_profiles" ("id", "auth_user_id", "student_type", "admission_number", "first_name", "middle_name", "last_name", "gender", "date_of_birth", "national_id", "email", "phone_number", "email_verified", "phone_verified", "national_id_verified", "delegated_access", "parent_created", "school_name", "school_level", "institution_code", "county", "ward", "location_name", "profile_photo_url", "is_active", "created_at", "updated_at") VALUES ('e4592478-53e9-4e15-885e-15f86765388e'::uuid, '937b0d74-764e-450b-9c8a-d66002f46655'::uuid, 'IND', 'EG2026001', 'Brian', 'Kiptoo', 'Langat', 'Male', '2005-04-12', '40112233', 'student1@gmail.com', '+254712345678', TRUE, TRUE, TRUE, FALSE, FALSE, 'Egerton University', 'University', 'EG-U-001', 'Nakuru', 'Kuresoi South', 'Amalo', NULL, TRUE, '2026-06-05T18:06:35.848487+00:00', '2026-06-05T18:06:35.848487+00:00') ON CONFLICT DO NOTHING;

-- Table: public."user_roles"
CREATE TABLE IF NOT EXISTS public."user_roles" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "auth_user_id" uuid NOT NULL,
    "role" USER-DEFINED NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Data: public."user_roles" (1 rows)
INSERT INTO public."user_roles" ("id", "auth_user_id", "role", "is_active", "created_at", "updated_at") VALUES ('6dfc0160-7eff-4af0-b6f1-68ee6b37804d'::uuid, '937b0d74-764e-450b-9c8a-d66002f46655'::uuid, 'student', TRUE, '2026-06-05T18:17:18.298945+00:00', '2026-06-05T18:17:18.298945+00:00') ON CONFLICT DO NOTHING;
