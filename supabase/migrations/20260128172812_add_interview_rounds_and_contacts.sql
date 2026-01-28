/*
  # Add Interview Rounds and TA/HR Contact Fields

  ## Overview
  This migration adds comprehensive interview round tracking capabilities and TA/HR contact information
  to the job application tracker system.

  ## New Tables
  
  ### interview_rounds
  Tracks all interview rounds for each application with detailed information about scheduling,
  completion, and feedback.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for the interview round
  - `application_id` (uuid, foreign key) - Reference to the parent application
  - `round_number` (integer) - Sequential number of the interview round (1, 2, 3, etc.)
  - `round_type` (text) - Type of interview (Phone Screen, Technical Interview, etc.)
  - `status` (text) - Current status (Scheduled, Completed, Cancelled)
  - `interview_date` (timestamptz) - Scheduled date and time of the interview
  - `interviewer_name` (text) - Name of the interviewer
  - `interviewer_linkedin_url` (text, optional) - LinkedIn profile URL of interviewer
  - `question_types_expected` (text, optional) - Expected question types/topics
  - `actual_questions_asked` (text, optional) - Questions actually asked (for completed rounds)
  - `feedback_sentiment` (text, optional) - Overall sentiment (Positive, Negative, Neutral, Mixed)
  - `feedback_notes` (text, optional) - Detailed feedback notes
  - `learnings` (text, optional) - Key learnings from the interview
  - `cancellation_reason` (text, optional) - Reason if interview was cancelled
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Modified Tables
  
  ### applications
  Added TA (Talent Acquisition) and HR coordinator contact information fields.
  
  **New Columns:**
  - `ta_contact_name` (text, optional) - Name of TA/recruiter contact
  - `ta_contact_phone` (text, optional) - Phone number of TA/recruiter
  - `hr_coordinator_name` (text, optional) - Name of HR coordinator
  - `hr_coordinator_phone` (text, optional) - Phone number of HR coordinator

  ## Security
  - RLS enabled on interview_rounds table
  - Users can only access interview rounds for their own applications
  - Policies enforce ownership through application_id relationship
  - CASCADE DELETE when parent application is removed

  ## Indexes
  - Index on application_id for efficient queries
  - Index on status for filtering
  - Index on interview_date for sorting and upcoming interview queries

  ## Important Notes
  1. Round numbers should be sequential but gaps are allowed (e.g., if round 2 is cancelled)
  2. Status transitions: Scheduled → Completed or Cancelled
  3. Completed rounds should have feedback fields populated
  4. Cancelled rounds should have cancellation_reason populated
  5. Interview date stored with timezone for accurate calendar integration
*/

-- Add TA/HR contact fields to applications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ta_contact_name'
  ) THEN
    ALTER TABLE applications
      ADD COLUMN ta_contact_name text DEFAULT '',
      ADD COLUMN ta_contact_phone text DEFAULT '',
      ADD COLUMN hr_coordinator_name text DEFAULT '',
      ADD COLUMN hr_coordinator_phone text DEFAULT '';
  END IF;
END $$;

-- Create interview_rounds table
CREATE TABLE IF NOT EXISTS interview_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  round_type text NOT NULL,
  status text NOT NULL DEFAULT 'Scheduled',
  interview_date timestamptz NOT NULL,
  interviewer_name text NOT NULL,
  interviewer_linkedin_url text DEFAULT '',
  question_types_expected text DEFAULT '',
  actual_questions_asked text DEFAULT '',
  feedback_sentiment text DEFAULT '',
  feedback_notes text DEFAULT '',
  learnings text DEFAULT '',
  cancellation_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS interview_rounds_application_id_idx ON interview_rounds(application_id);
CREATE INDEX IF NOT EXISTS interview_rounds_status_idx ON interview_rounds(status);
CREATE INDEX IF NOT EXISTS interview_rounds_interview_date_idx ON interview_rounds(interview_date);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_interview_rounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_rounds_updated_at_trigger
  BEFORE UPDATE ON interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_rounds_updated_at();

-- Enable Row Level Security
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_rounds
CREATE POLICY "Users can view own interview rounds"
  ON interview_rounds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own interview rounds"
  ON interview_rounds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own interview rounds"
  ON interview_rounds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own interview rounds"
  ON interview_rounds
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = interview_rounds.application_id
      AND applications.user_id = auth.uid()
    )
  );