import { supabase } from './supabase';
import type { Database } from './database.types';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];
type ReferralInsert = Database['public']['Tables']['referrals']['Insert'];
type FollowUpInsert = Database['public']['Tables']['follow_ups']['Insert'];
type InterviewRoundInsert = Database['public']['Tables']['interview_rounds']['Insert'];
type InterviewRoundUpdate = Database['public']['Tables']['interview_rounds']['Update'];

export const applicationApi = {
  async getAll() {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        referrals(*),
        follow_ups(*),
        status_history(*),
        interview_rounds(*)
      `)
      .eq('archived', false)
      .order('application_date', { ascending: false });

    if (error) throw error;

    if (!applications) return [];

    const appIds = applications.map(app => app.id);
    const { data: appTags } = await supabase
      .from('application_tags')
      .select('application_id, tag_id, tags(*)')
      .in('application_id', appIds);

    const tagsMap = new Map();
    appTags?.forEach((item: any) => {
      if (!tagsMap.has(item.application_id)) {
        tagsMap.set(item.application_id, []);
      }
      if (item.tags) {
        tagsMap.get(item.application_id).push(item.tags);
      }
    });

    return applications.map(app => ({
      ...app,
      tags: tagsMap.get(app.id) || [],
    }));
  },

  async getById(id: string) {
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        referrals(*),
        follow_ups(*),
        status_history(*),
        interview_rounds(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!application) return null;

    const { data: appTags } = await supabase
      .from('application_tags')
      .select('tag_id, tags(*)')
      .eq('application_id', id);

    return {
      ...application,
      tags: (appTags || []).map((item: any) => item.tags).filter(Boolean),
    };
  },

  async create(application: ApplicationInsert, referrals: Omit<ReferralInsert, 'application_id'>[] = []) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('applications')
      .insert({ ...application, user_id: user.user.id })
      .select()
      .single();

    if (error) throw error;

    if (referrals.length > 0) {
      const { error: refError } = await supabase
        .from('referrals')
        .insert(referrals.map(ref => ({ ...ref, application_id: data.id })));

      if (refError) throw refError;
    }

    return data;
  },

  async update(id: string, application: ApplicationUpdate) {
    const { data, error } = await supabase
      .from('applications')
      .update(application)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('archived', false);

    if (error) throw error;

    const stats = {
      total: data.filter(a => a.status !== 'Withdrawn').length,
      applied: data.filter(a => a.status === 'Applied').length,
      interviewing: data.filter(a => a.status === 'Interviewing').length,
      offers: data.filter(a => a.status === 'Offer').length,
      rejected: data.filter(a => a.status === 'Rejected').length,
    };

    return stats;
  },

  async archive(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unarchive(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .update({ archived: false, archived_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getArchived() {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        referrals(*),
        follow_ups(*),
        status_history(*),
        interview_rounds(*)
      `)
      .eq('archived', true)
      .order('archived_at', { ascending: false });

    if (error) throw error;

    if (!applications) return [];

    const appIds = applications.map(app => app.id);
    const { data: appTags } = await supabase
      .from('application_tags')
      .select('application_id, tag_id, tags(*)')
      .in('application_id', appIds);

    const tagsMap = new Map();
    appTags?.forEach((item: any) => {
      if (!tagsMap.has(item.application_id)) {
        tagsMap.set(item.application_id, []);
      }
      if (item.tags) {
        tagsMap.get(item.application_id).push(item.tags);
      }
    });

    return applications.map(app => ({
      ...app,
      tags: tagsMap.get(app.id) || [],
    }));
  },
};

export const referralApi = {
  async create(referral: ReferralInsert) {
    const { data, error } = await supabase
      .from('referrals')
      .insert(referral)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('referrals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const followUpApi = {
  async getUpcoming() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        applications(company_name, position_title)
      `)
      .eq('completed', false)
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getOverdue() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        applications(company_name, position_title)
      `)
      .eq('completed', false)
      .lt('scheduled_date', today)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(followUp: FollowUpInsert) {
    const { data, error } = await supabase
      .from('follow_ups')
      .insert(followUp)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async complete(id: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uncomplete(id: string) {
    const { data, error } = await supabase
      .from('follow_ups')
      .update({ completed: false, completed_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCompleted(limit: number = 5) {
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        applications(company_name, position_title)
      `)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('follow_ups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createAutoSuggestions(applicationId: string, applicationDate: string) {
    const suggestions = [
      {
        application_id: applicationId,
        scheduled_date: addDays(applicationDate, 7),
        description: 'Follow up on application status',
        auto_generated: true,
      },
      {
        application_id: applicationId,
        scheduled_date: addDays(applicationDate, 14),
        description: 'Second follow-up if no response',
        auto_generated: true,
      },
    ];

    const { data, error } = await supabase
      .from('follow_ups')
      .insert(suggestions)
      .select();

    if (error) throw error;
    return data;
  },
};

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export const preferencesApi = {
  async get() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsert(positionTitles: string[], locations: string[]) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.user.id,
        position_titles: positionTitles,
        locations: locations,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addPositionTitle(title: string) {
    const prefs = await this.get();
    const currentTitles = prefs?.position_titles || [];

    if (!currentTitles.includes(title) && title.trim()) {
      const updatedTitles = [...currentTitles, title];
      return this.upsert(updatedTitles, prefs?.locations || []);
    }

    return prefs;
  },

  async addLocation(location: string) {
    const prefs = await this.get();
    const currentLocations = prefs?.locations || [];

    if (!currentLocations.includes(location) && location.trim()) {
      const updatedLocations = [...currentLocations, location];
      return this.upsert(prefs?.position_titles || [], updatedLocations);
    }

    return prefs;
  },

  async seedFromApplications() {
    const applications = await applicationApi.getAll();

    const positionTitles = [...new Set(
      applications
        .map(app => app.position_title)
        .filter(title => title && title.trim())
    )];

    const locations = [...new Set(
      applications
        .map(app => app.location)
        .filter(loc => loc && loc.trim())
    )];

    return this.upsert(positionTitles, locations);
  },
};

export const interviewRoundsApi = {
  async getByApplicationId(applicationId: string) {
    const { data, error } = await supabase
      .from('interview_rounds')
      .select('*')
      .eq('application_id', applicationId)
      .order('round_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  async create(interviewRound: InterviewRoundInsert) {
    const { data, error } = await supabase
      .from('interview_rounds')
      .insert(interviewRound)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, interviewRound: InterviewRoundUpdate) {
    const { data, error } = await supabase
      .from('interview_rounds')
      .update(interviewRound)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string, additionalData?: Partial<InterviewRoundUpdate>) {
    const updateData: InterviewRoundUpdate = {
      status,
      ...additionalData,
    };

    return this.update(id, updateData);
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('interview_rounds')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getUpcoming(limit?: number) {
    const now = new Date().toISOString();
    let query = supabase
      .from('interview_rounds')
      .select(`
        *,
        applications(company_name, position_title, id)
      `)
      .eq('status', 'Scheduled')
      .gte('interview_date', now)
      .order('interview_date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getStats() {
    const { data, error } = await supabase
      .from('interview_rounds')
      .select('status, interview_date');

    if (error) throw error;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalScheduled: data.filter(r => r.status === 'Scheduled').length,
      completedThisWeek: data.filter(r => {
        const date = new Date(r.interview_date);
        return r.status === 'Completed' && date >= weekAgo;
      }).length,
      totalCompleted: data.filter(r => r.status === 'Completed').length,
      totalCancelled: data.filter(r => r.status === 'Cancelled').length,
    };

    return stats;
  },

  async getNextRoundNumber(applicationId: string): Promise<number> {
    const rounds = await this.getByApplicationId(applicationId);
    if (rounds.length === 0) return 1;
    return Math.max(...rounds.map(r => r.round_number)) + 1;
  },

  async getNext7Days() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('interview_rounds')
      .select(`
        *,
        applications(company_name, position_title, id)
      `)
      .eq('status', 'Scheduled')
      .gte('interview_date', now.toISOString())
      .lte('interview_date', sevenDaysFromNow.toISOString())
      .order('interview_date', { ascending: true });

    if (error) throw error;
    return data;
  },
};

export interface CalendarEventType {
  id: string;
  type: 'follow-up' | 'interview';
  date: string;
  title: string;
  description: string;
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  application: {
    id: string;
    company_name: string;
    position_title: string;
  };
  metadata?: {
    round_number?: number;
    round_type?: string;
    interviewer_name?: string;
    completed?: boolean;
    auto_generated?: boolean;
  };
}

export const calendarApi = {
  async getEvents(startDate: string, endDate: string): Promise<CalendarEventType[]> {
    const [followUps, interviews] = await Promise.all([
      supabase
        .from('follow_ups')
        .select(`
          *,
          applications(id, company_name, position_title)
        `)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true }),

      supabase
        .from('interview_rounds')
        .select(`
          *,
          applications(id, company_name, position_title)
        `)
        .gte('interview_date', startDate)
        .lte('interview_date', endDate)
        .order('interview_date', { ascending: true }),
    ]);

    if (followUps.error) throw followUps.error;
    if (interviews.error) throw interviews.error;

    const events: CalendarEventType[] = [];

    followUps.data.forEach((followUp) => {
      const today = new Date().toISOString().split('T')[0];
      let status: 'scheduled' | 'completed' | 'overdue' = 'scheduled';

      if (followUp.completed) {
        status = 'completed';
      } else if (followUp.scheduled_date < today) {
        status = 'overdue';
      }

      events.push({
        id: followUp.id,
        type: 'follow-up',
        date: followUp.scheduled_date,
        title: followUp.description,
        description: followUp.description,
        status,
        application: followUp.applications as { id: string; company_name: string; position_title: string },
        metadata: {
          completed: followUp.completed,
          auto_generated: followUp.auto_generated,
        },
      });
    });

    interviews.data.forEach((interview) => {
      let status: 'scheduled' | 'completed' | 'overdue' | 'cancelled' = 'scheduled';

      if (interview.status === 'Completed') {
        status = 'completed';
      } else if (interview.status === 'Cancelled') {
        status = 'cancelled';
      } else {
        const interviewDate = new Date(interview.interview_date);
        const now = new Date();
        if (interviewDate < now) {
          status = 'overdue';
        }
      }

      events.push({
        id: interview.id,
        type: 'interview',
        date: interview.interview_date,
        title: `${interview.round_type} - Round ${interview.round_number}`,
        description: interview.round_type,
        status,
        application: interview.applications as { id: string; company_name: string; position_title: string },
        metadata: {
          round_number: interview.round_number,
          round_type: interview.round_type,
          interviewer_name: interview.interviewer_name,
        },
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async getAllEvents(): Promise<CalendarEventType[]> {
    const [followUps, interviews] = await Promise.all([
      supabase
        .from('follow_ups')
        .select(`
          *,
          applications(id, company_name, position_title)
        `)
        .order('scheduled_date', { ascending: true }),

      supabase
        .from('interview_rounds')
        .select(`
          *,
          applications(id, company_name, position_title)
        `)
        .order('interview_date', { ascending: true }),
    ]);

    if (followUps.error) throw followUps.error;
    if (interviews.error) throw interviews.error;

    const events: CalendarEventType[] = [];
    const today = new Date().toISOString().split('T')[0];

    followUps.data.forEach((followUp) => {
      let status: 'scheduled' | 'completed' | 'overdue' = 'scheduled';

      if (followUp.completed) {
        status = 'completed';
      } else if (followUp.scheduled_date < today) {
        status = 'overdue';
      }

      events.push({
        id: followUp.id,
        type: 'follow-up',
        date: followUp.scheduled_date,
        title: followUp.description,
        description: followUp.description,
        status,
        application: followUp.applications as { id: string; company_name: string; position_title: string },
        metadata: {
          completed: followUp.completed,
          auto_generated: followUp.auto_generated,
        },
      });
    });

    interviews.data.forEach((interview) => {
      let status: 'scheduled' | 'completed' | 'overdue' | 'cancelled' = 'scheduled';

      if (interview.status === 'Completed') {
        status = 'completed';
      } else if (interview.status === 'Cancelled') {
        status = 'cancelled';
      } else {
        const interviewDate = new Date(interview.interview_date);
        const now = new Date();
        if (interviewDate < now) {
          status = 'overdue';
        }
      }

      events.push({
        id: interview.id,
        type: 'interview',
        date: interview.interview_date,
        title: `${interview.round_type} - Round ${interview.round_number}`,
        description: interview.round_type,
        status,
        application: interview.applications as { id: string; company_name: string; position_title: string },
        metadata: {
          round_number: interview.round_number,
          round_type: interview.round_type,
          interviewer_name: interview.interviewer_name,
        },
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
};
