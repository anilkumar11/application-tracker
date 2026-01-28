/*
  # Consolidate Interview Statuses

  ## Changes
  This migration consolidates three separate interview-related statuses 
  into a single "Interviewing" status for simplified tracking.

  ## Status Mapping
  The following status values are being consolidated:
  - `Phone Screen` → `Interviewing`
  - `Technical Interview` → `Interviewing`
  - `Final Round` → `Interviewing`
  
  Other statuses remain unchanged:
  - `Applied`
  - `Offer`
  - `Rejected`
  - `Withdrawn`

  ## Data Migration
  All existing applications with old interview statuses will be 
  automatically updated to the new "Interviewing" status.

  ## Impact
  - Existing applications in interview stages are preserved
  - No data loss occurs
  - Applications remain in their current workflow stage
  - Statistics and analytics will reflect the simplified status model
*/

-- Update all applications with old interview statuses to the new unified status
UPDATE applications 
SET status = 'Interviewing',
    updated_at = now()
WHERE status IN ('Phone Screen', 'Technical Interview', 'Final Round');

-- Update status history records to reflect the consolidated status
UPDATE status_history 
SET status = 'Interviewing'
WHERE status IN ('Phone Screen', 'Technical Interview', 'Final Round');