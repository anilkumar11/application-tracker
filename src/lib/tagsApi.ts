import { supabase } from './supabase';
import type { Tag } from './database.types';

export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async create(name: string, color: string = '#3b82f6'): Promise<Tag> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { name?: string; color?: string }): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addToApplication(applicationId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('application_tags')
      .insert({
        application_id: applicationId,
        tag_id: tagId,
      });

    if (error) throw error;
  },

  async removeFromApplication(applicationId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('application_tags')
      .delete()
      .eq('application_id', applicationId)
      .eq('tag_id', tagId);

    if (error) throw error;
  },

  async getApplicationTags(applicationId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('application_tags')
      .select('tag_id, tags(*)')
      .eq('application_id', applicationId);

    if (error) throw error;
    return (data || []).map((item: any) => item.tags).filter(Boolean);
  },
};
