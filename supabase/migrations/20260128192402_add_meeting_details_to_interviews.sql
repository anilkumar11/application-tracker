/*
  # Add Meeting Details to Interview Rounds

  1. Changes
    - Add meeting_type column to store the type of interview (Zoom, Google Meet, Phone Call, etc.)
    - Add meeting_link column to store video conference URLs
    - Add meeting_phone column to store phone numbers for phone interviews
    - Add meeting_notes column to store access codes, instructions, or additional meeting information

  2. Purpose
    - Enable users to track how they'll conduct their interviews
    - Store video conference links for quick access
    - Store phone numbers for phone interviews
    - Store any additional meeting instructions or notes

  3. Security
    - No RLS changes needed as these fields are added to existing table with existing policies
*/

-- Add meeting-related columns to interview_rounds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_rounds' AND column_name = 'meeting_type'
  ) THEN
    ALTER TABLE interview_rounds ADD COLUMN meeting_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_rounds' AND column_name = 'meeting_link'
  ) THEN
    ALTER TABLE interview_rounds ADD COLUMN meeting_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_rounds' AND column_name = 'meeting_phone'
  ) THEN
    ALTER TABLE interview_rounds ADD COLUMN meeting_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_rounds' AND column_name = 'meeting_notes'
  ) THEN
    ALTER TABLE interview_rounds ADD COLUMN meeting_notes text;
  END IF;
END $$;
