/*
  # Add Timezone Support to User Preferences

  1. Changes
    - Add `timezone` column to `user_preferences` table
      - Type: text (IANA timezone identifier like 'Asia/Kolkata', 'America/New_York', etc.)
      - Default: 'UTC' (will be auto-detected and updated by the client)
      - Not null with default value

  2. Migration Safety
    - Uses IF NOT EXISTS pattern to safely add column
    - Sets default value so existing records get 'UTC' initially
    - Client will detect and update to user's actual timezone on first load

  3. Notes
    - Stores IANA timezone identifiers (e.g., 'Asia/Kolkata', 'Europe/London')
    - Existing data timestamps will be treated as IST timezone as per user request
    - Future timestamps will be converted based on user's configured timezone
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
  END IF;
END $$;
