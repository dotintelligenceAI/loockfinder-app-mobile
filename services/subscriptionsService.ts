import { supabase } from './supabase';

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'free' | 'monthly' | 'semiannual' | 'annual' | string;
  description?: string | null;
  price_cents: number;
  currency?: string | null;
  billing_period: 'lifetime' | 'monthly' | 'semiannual' | 'annual' | string;
  features?: any;
  limits_config?: any;
  stripe_price_id?: string | null;
  is_popular?: boolean | null;
  sort_order?: number | null;
  is_active?: boolean | null;
}

export interface ProfileSubscriptionInfo {
  user_id: string;
  name?: string | null;
  avatar_url?: string | null;
  subscription_status: SubscriptionStatus;
  current_plan_id: string | null;
  subscription_expires_at: string | null;
  plan?: SubscriptionPlan | null;
}

class SubscriptionsService {
  async getActivePlans(): Promise<{ success: boolean; data: SubscriptionPlan[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) return { success: false, data: [], error: error.message };
      return { success: true, data: (data || []) as SubscriptionPlan[] };
    } catch (e) {
      return { success: false, data: [], error: 'Erro ao carregar planos' };
    }
  }

  async getProfileWithPlan(userId: string): Promise<{ success: boolean; data: ProfileSubscriptionInfo | null; error?: string }> {
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (pErr) return { success: false, data: null, error: pErr.message };

      let plan: SubscriptionPlan | null = null;
      if (profile?.current_plan_id) {
        const { data: p, error: planErr } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', profile.current_plan_id)
          .single();
        if (!planErr) plan = p as SubscriptionPlan;
      }

      return {
        success: true,
        data: {
          user_id: profile.id,
          name: profile.name ?? null,
          avatar_url: profile.avatar_url ?? null,
          subscription_status: profile.subscription_status as SubscriptionStatus,
          current_plan_id: profile.current_plan_id,
          subscription_expires_at: profile.subscription_expires_at,
          plan,
        },
      };
    } catch (e) {
      return { success: false, data: null, error: 'Erro ao carregar perfil' };
    }
  }

  async selectFreePlan(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar id do plano Free
      const { data: freePlan, error: fErr } = await supabase
        .from('subscription_plans')
        .select('id, slug')
        .eq('slug', 'free')
        .single();
      if (fErr || !freePlan) return { success: false, error: fErr?.message || 'Plano Free não encontrado' };

      // Atualizar profile
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          current_plan_id: freePlan.id,
          subscription_expires_at: null,
          user_type: 'standard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (upErr) return { success: false, error: upErr.message };

      // Atualizar limites de chat
      const { error: chatErr } = await supabase
        .from('user_chat_limits')
        .update({ max_daily_messages: 5 })
        .eq('user_id', userId);
      // Caso não exista, cria
      if (chatErr) {
        await supabase.from('user_chat_limits').insert({ user_id: userId, daily_message_count: 0, max_daily_messages: 5 });
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Erro ao selecionar plano Free' };
    }
  }

  async prepareCheckout(planId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Espera existir uma RPC ou Edge Function que retorna checkout_url
      const { data, error } = await supabase.rpc('prepare_checkout_data', { plan_id: planId });
      if (error) return { success: false, error: error.message };
      return { success: true, url: (data as any)?.checkout_url || (data as any)?.url };
    } catch (e) {
      return { success: false, error: 'Erro ao preparar checkout' };
    }
  }
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;


