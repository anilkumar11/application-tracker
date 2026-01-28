/*
  # Add Tags and Archive Support

  ## Overview
  Adds support for custom tags to organize applications and archive functionality 
  to hide completed or withdrawn applications without deletion.

  ## New Tables
  
  ### `tags`
  - `id` (uuid, primary key) - Unique identifier for each tag
  - `user_id` (uuid, foreign key) - References auth.users for multi-tenant support
  - `name` (text, unique per user) - Tag name (e.g., "Priority", "Remote Only")
  - `color` (text) - Hex color for visual identification
  - `created_at` (timestamptz) - Timestamp when tag was created

  ### `application_tags`
  - `application_id` (uuid, foreign key) - References applications table
  - `tag_id` (uuid, foreign key) - References tags table
  - `created_at` (timestamptz) - Timestamp when tag was applied
  - Primary key: composite of (application_id, tag_id)

  ## Modified Tables
  
  ### `applications`
  - Added `archived` (boolean) - Flag to mark applications as archived
  - Added `archived_at` (timestamptz) - Timestamp when application was archived

  ## Security
  - RLS enabled on all new tables
  - Users can only access their own tags
  - Users can only tag their own applications
  - Proper cascade deletion on foreign key relationships
*/

-- Add archived columns to applications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'archived'
  ) THEN
    ALTER TABLE applications ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create application_tags junction table
CREATE TABLE IF NOT EXISTS application_tags (
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (application_id, tag_id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags table
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for application_tags table
CREATE POLICY "Users can view tags on own applications"
  ON application_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to own applications"
  ON application_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM tags
      WHERE tags.id = application_tags.tag_id
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own applications"
  ON application_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_tags.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_application_tags_application_id ON application_tags(application_id);
CREATE INDEX IF NOT EXISTS idx_application_tags_tag_id ON application_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_applications_archived ON applications(archived) WHERE archived = true;
