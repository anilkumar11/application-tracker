/*
  # Add email fields to TA and HR contacts

  1. Changes
    - Add `ta_contact_email` column to `applications` table
      - Type: text (email address)
      - Optional field with empty string default
    - Add `hr_coordinator_email` column to `applications` table
      - Type: text (email address)
      - Optional field with empty string default
    
  2. Notes
    - Email addresses will help users keep track of contact information for recruiters and HR coordinators
    - Fields use empty string defaults to maintain consistency with existing contact fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ta_contact_email'
  ) THEN
    ALTER TABLE applications ADD COLUMN ta_contact_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'hr_coordinator_email'
  ) THEN
    ALTER TABLE applications ADD COLUMN hr_coordinator_email text DEFAULT '';
  END IF;
END $$;
