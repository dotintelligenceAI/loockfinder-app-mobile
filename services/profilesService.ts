import { supabase } from './supabase';

export interface ProfileRow {
  id: string;
  user_id: string;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  instagram?: string | null;
  user_type?: string | null; // 'standard' | 'premium' | etc
  subscription_status?: string | null; // 'free' | 'active' | ...
  current_plan_id?: string | null;
  subscription_expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_trial?: boolean | null;
  trial_expires_at?: string | null;
}

class ProfilesService {
  async createMinimalProfile(userId: string, name?: string | null, avatarUrl?: string | null): Promise<{ success: boolean; data?: ProfileRow | null; error?: string }> {
    try {
      // Verifica se já existe
      const { data: existing } = await supabase
        .from('profiles')
        .select('id,user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) return { success: true, data: existing as any };

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name: name ?? null,
          avatar_url: avatarUrl ?? null,
          // Demais campos usam defaults do banco: user_type='standard', subscription_status='free', etc.
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: data as ProfileRow };
    } catch (e) {
      return { success: false, error: 'Erro ao criar perfil' };
    }
  }

  async updateProfile(userId: string, updates: Partial<ProfileRow>): Promise<{ success: boolean; data?: ProfileRow | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: data as ProfileRow };
    } catch (e) {
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  }

  async getProfile(userId: string): Promise<{ success: boolean; data?: ProfileRow | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data: data as ProfileRow };
    } catch (e) {
      return { success: false, error: 'Erro ao carregar perfil' };
    }
  }
}

export const profilesService = new ProfilesService();
export default profilesService;


