/*
  # Optimize RLS Policies and Function Security

  ## Overview
  This migration optimizes Row Level Security (RLS) policies for better performance at scale
  and fixes function security issues by setting proper search paths.

  ## Changes

  ### 1. RLS Policy Optimization
  All RLS policies are updated to use `(select auth.uid())` instead of `auth.uid()`.
  This prevents the auth function from being re-evaluated for each row, significantly
  improving query performance at scale.

  **Tables Updated:**
  - applications (4 policies)
  - referrals (4 policies)
  - follow_ups (4 policies)
  - status_history (2 policies)
  - user_preferences (3 policies)
  - interview_rounds (4 policies)
  - tags (4 policies)
  - application_tags (3 policies)

  ### 2. Function Security Enhancement
  Functions are updated with explicit search_path setting to prevent search path
  manipulation attacks.

  **Functions Updated:**
  - update_updated_at_column()
  - create_status_history()
  - update_interview_rounds_updated_at()

  ## Security Benefits
  1. Improved query performance - auth functions evaluated once per query
  2. Protected against search path manipulation attacks
  3. Maintains all existing security guarantees

  ## Important Notes
  - No changes to actual security logic - only optimization and hardening
  - All existing permissions and access controls remain unchanged
  - Policies are recreated (DROP + CREATE) to ensure clean state
*/

-- =============================================
-- PART 1: OPTIMIZE RLS POLICIES
-- =============================================

-- Drop all existing policies to recreate with optimized versions
-- Applications table policies
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

-- Referrals table policies
DROP POLICY IF EXISTS "Users can view referrals for own applications" ON referrals;
DROP POLICY IF EXISTS "Users can insert referrals for own applications" ON referrals;
DROP POLICY IF EXISTS "Users can update referrals for own applications" ON referrals;
DROP POLICY IF EXISTS "Users can delete referrals for own applications" ON referrals;

-- Follow_ups table policies
DROP POLICY IF EXISTS "Users can view follow_ups for own applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can insert follow_ups for own applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can update follow_ups for own applications" ON follow_ups;
DROP POLICY IF EXISTS "Users can delete follow_ups for own applications" ON follow_ups;

-- Status_history table policies
DROP POLICY IF EXISTS "Users can view status_history for own applications" ON status_history;
DROP POLICY IF EXISTS "Users can insert status_history for own applications" ON status_history;

-- User_preferences table policies
DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- Interview_rounds table policies
DROP POLICY IF EXISTS "Users can view own interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Users can insert own interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Users can update own interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Users can delete own interview rounds" ON interview_rounds;

-- Tags table policies
DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can update own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- Application_tags table policies
DROP POLICY IF EXISTS "Users can view tags on own applications" ON application_tags;
DROP POLICY IF EXISTS "Users can add tags to own applications" ON application_tags;
DROP POLICY IF EXISTS "Users can remove tags from own applications" ON application_tags;

-- =============================================
-- CREATE OPTIMIZED POLICIES
-- =============================================

-- Applications table - optimized policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Referrals table - optimized policies
CREATE POLICY "Users can view referrals for own applications"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert referrals for own applications"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update referrals for own applications"
  ON referrals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete referrals for own applications"
  ON referrals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Follow_ups table - optimized policies
CREATE POLICY "Users can view follow_ups for own applications"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert follow_ups for own applications"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update follow_ups for own applications"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete follow_ups for own applications"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Status_history table - optimized policies
CREATE POLICY "Users can view status_history for own applications"
  ON status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = status_history.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert status_history for own applications"
  ON status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = status_history.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- User_preferences table - optimized policies
CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Interview_rounds table - optimized policies
CREATE POLICY "Users can view own interview rounds"
  ON interview_rounds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own interview rounds"
  ON interview_rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own interview rounds"
  ON interview_rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own interview rounds"
  ON interview_rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- Tags table - optimized policies
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Application_tags table - optimized policies
CREATE POLICY "Users can view tags on own applications"
  ON application_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can add tags to own applications"
  ON application_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = (select auth.uid())
    )
    AND
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = application_tags.tag_id
      AND tags.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can remove tags from own applications"
  ON application_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- =============================================
-- PART 2: FIX FUNCTION SECURITY
-- =============================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix create_status_history function
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO status_history (application_id, status, changed_at)
    VALUES (NEW.id, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_interview_rounds_updated_at function
CREATE OR REPLACE FUNCTION update_interview_rounds_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
