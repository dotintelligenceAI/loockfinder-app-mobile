import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  location?: string;
  instagram_link?: string;
}

class UserProfilesService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
    return data as UserProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }
    return data as UserProfile;
  }
}

export const userProfilesService = new UserProfilesService(); 