/*
  # Job Application Tracker Schema

  ## Overview
  Creates a comprehensive job application tracking system with support for:
  - Application tracking with detailed information
  - Multiple referrals per application
  - Follow-up reminders (manual and automatic)
  - Status history tracking

  ## New Tables

  ### `applications`
  Core table storing all job applications with fields:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users for multi-user support
  - `company_name` (text) - Company name
  - `position_title` (text) - Job position title
  - `status` (text) - Current status (Applied, Phone Screen, Technical Interview, Final Round, Offer, Rejected, Withdrawn)
  - `application_date` (date) - Date of application
  - `application_source` (text) - How application was submitted (Referral, Direct, Recruiter, Job Board, Company Website, Networking Event, Other)
  - `salary_range` (text) - Expected salary range
  - `job_url` (text) - Link to job posting
  - `location` (text) - Job location
  - `work_type` (text) - Remote, Hybrid, or Onsite (default: Hybrid)
  - `documents_url` (text) - Link to application documents (resume, cover letter)
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `referrals`
  Stores referral contacts for applications (supports multiple referrals per application):
  - `id` (uuid, primary key) - Unique identifier
  - `application_id` (uuid, foreign key) - References applications table
  - `name` (text) - Referral contact name
  - `relationship` (text) - Relationship to referral (Friend, Former Colleague, LinkedIn Connection, etc.)
  - `contact_info` (text) - Email or phone number
  - `created_at` (timestamptz) - Record creation timestamp

  ### `follow_ups`
  Tracks follow-up reminders for applications:
  - `id` (uuid, primary key) - Unique identifier
  - `application_id` (uuid, foreign key) - References applications table
  - `scheduled_date` (date) - Date for follow-up
  - `description` (text) - Follow-up task description
  - `completed` (boolean) - Whether follow-up is completed
  - `completed_at` (timestamptz) - Completion timestamp
  - `auto_generated` (boolean) - Whether this was auto-suggested
  - `created_at` (timestamptz) - Record creation timestamp

  ### `status_history`
  Logs all status changes for applications:
  - `id` (uuid, primary key) - Unique identifier
  - `application_id` (uuid, foreign key) - References applications table
  - `status` (text) - Status at this point in time
  - `changed_at` (timestamptz) - When status changed
  - `notes` (text) - Optional notes about the status change

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies check auth.uid() = user_id for applications
  - Referrals, follow_ups, and status_history inherit security through application_id
*/

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  position_title text NOT NULL,
  status text NOT NULL DEFAULT 'Applied',
  application_date date NOT NULL DEFAULT CURRENT_DATE,
  application_source text NOT NULL DEFAULT 'Direct',
  salary_range text DEFAULT '',
  job_url text DEFAULT '',
  location text DEFAULT '',
  work_type text NOT NULL DEFAULT 'Hybrid',
  documents_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text DEFAULT '',
  contact_info text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  description text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  auto_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_application_date ON applications(application_date);
CREATE INDEX IF NOT EXISTS idx_referrals_application_id ON referrals(application_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_application_id ON follow_ups(application_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_date ON follow_ups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON status_history(application_id);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications table
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for referrals table
CREATE POLICY "Users can view referrals for own applications"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert referrals for own applications"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update referrals for own applications"
  ON referrals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete referrals for own applications"
  ON referrals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = referrals.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for follow_ups table
CREATE POLICY "Users can view follow_ups for own applications"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert follow_ups for own applications"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update follow_ups for own applications"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete follow_ups for own applications"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = follow_ups.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- RLS Policies for status_history table
CREATE POLICY "Users can view status_history for own applications"
  ON status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = status_history.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert status_history for own applications"
  ON status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = status_history.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on applications table
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create status history when status changes
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO status_history (application_id, status, changed_at)
    VALUES (NEW.id, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create status history
DROP TRIGGER IF EXISTS create_status_history_trigger ON applications;
CREATE TRIGGER create_status_history_trigger
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_status_history();