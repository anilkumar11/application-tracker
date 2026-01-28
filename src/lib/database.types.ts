export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          company_name: string
          position_title: string
          status: string
          application_date: string
          application_source: string
          salary_range: string
          job_url: string
          location: string
          work_type: string
          documents_url: string
          notes: string
          ta_contact_name: string
          ta_contact_phone: string
          ta_contact_email: string
          hr_coordinator_name: string
          hr_coordinator_phone: string
          hr_coordinator_email: string
          archived: boolean
          archived_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          position_title: string
          status?: string
          application_date?: string
          application_source?: string
          salary_range?: string
          job_url?: string
          location?: string
          work_type?: string
          documents_url?: string
          notes?: string
          ta_contact_name?: string
          ta_contact_phone?: string
          ta_contact_email?: string
          hr_coordinator_name?: string
          hr_coordinator_phone?: string
          hr_coordinator_email?: string
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          position_title?: string
          status?: string
          application_date?: string
          application_source?: string
          salary_range?: string
          job_url?: string
          location?: string
          work_type?: string
          documents_url?: string
          notes?: string
          ta_contact_name?: string
          ta_contact_phone?: string
          ta_contact_email?: string
          hr_coordinator_name?: string
          hr_coordinator_phone?: string
          hr_coordinator_email?: string
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      application_tags: {
        Row: {
          application_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          application_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          application_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          application_id: string
          name: string
          relationship: string
          contact_info: string
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          name: string
          relationship?: string
          contact_info?: string
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          name?: string
          relationship?: string
          contact_info?: string
          created_at?: string
        }
      }
      follow_ups: {
        Row: {
          id: string
          application_id: string
          scheduled_date: string
          description: string
          completed: boolean
          completed_at: string | null
          auto_generated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          scheduled_date: string
          description: string
          completed?: boolean
          completed_at?: string | null
          auto_generated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          scheduled_date?: string
          description?: string
          completed?: boolean
          completed_at?: string | null
          auto_generated?: boolean
          created_at?: string
        }
      }
      status_history: {
        Row: {
          id: string
          application_id: string
          status: string
          changed_at: string
          notes: string
        }
        Insert: {
          id?: string
          application_id: string
          status: string
          changed_at?: string
          notes?: string
        }
        Update: {
          id?: string
          application_id?: string
          status?: string
          changed_at?: string
          notes?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          position_titles: string[]
          locations: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          position_titles?: string[]
          locations?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          position_titles?: string[]
          locations?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      interview_rounds: {
        Row: {
          id: string
          application_id: string
          round_number: number
          round_type: string
          status: string
          interview_date: string
          interviewer_name: string
          interviewer_linkedin_url: string
          question_types_expected: string
          actual_questions_asked: string
          feedback_sentiment: string
          feedback_notes: string
          learnings: string
          cancellation_reason: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          round_number: number
          round_type: string
          status?: string
          interview_date: string
          interviewer_name: string
          interviewer_linkedin_url?: string
          question_types_expected?: string
          actual_questions_asked?: string
          feedback_sentiment?: string
          feedback_notes?: string
          learnings?: string
          cancellation_reason?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          round_number?: number
          round_type?: string
          status?: string
          interview_date?: string
          interviewer_name?: string
          interviewer_linkedin_url?: string
          question_types_expected?: string
          actual_questions_asked?: string
          feedback_sentiment?: string
          feedback_notes?: string
          learnings?: string
          cancellation_reason?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Application = Database['public']['Tables']['applications']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type ApplicationTag = Database['public']['Tables']['application_tags']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type FollowUp = Database['public']['Tables']['follow_ups']['Row'];
export type StatusHistory = Database['public']['Tables']['status_history']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

export type ApplicationWithRelations = Application & {
  tags?: Tag[];
  referrals?: Referral[];
  follow_ups?: FollowUp[];
  status_history?: StatusHistory[];
  interview_rounds?: InterviewRound[];
};

export const APPLICATION_STATUSES = [
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
] as const;

export const APPLICATION_SOURCES = [
  'Referral',
  'Direct',
  'Recruiter',
  'Job Board',
  'Company Website',
  'Networking Event',
  'Other',
] as const;

export const WORK_TYPES = [
  'Remote',
  'Hybrid',
  'Onsite',
] as const;

export const INTERVIEW_ROUND_TYPES = [
  'Phone Screen',
  'Technical Interview',
  'Behavioral Interview',
  'System Design',
  'Coding Challenge',
  'Panel Interview',
  'Final Round',
  'HR Round',
  'Culture Fit',
  'Onsite',
] as const;

export const INTERVIEW_ROUND_STATUSES = [
  'Scheduled',
  'Completed',
  'Cancelled',
] as const;

export const FEEDBACK_SENTIMENTS = [
  'Positive',
  'Negative',
  'Neutral',
  'Mixed',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export type ApplicationSource = typeof APPLICATION_SOURCES[number];
export type WorkType = typeof WORK_TYPES[number];
export type InterviewRoundType = typeof INTERVIEW_ROUND_TYPES[number];
export type InterviewRoundStatus = typeof INTERVIEW_ROUND_STATUSES[number];
export type FeedbackSentiment = typeof FEEDBACK_SENTIMENTS[number];
