import { avisosService } from './avisosService';
import { geolocationService, Region } from './geolocationService';
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
  stripe_product_id?: string | null;
  region?: 'BR' | 'US' | 'EU' | 'OTHER' | null;
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
  async getActivePlans(region?: Region): Promise<{ success: boolean; data: SubscriptionPlan[]; error?: string }> {
    try {
      // Se não foi especificada uma região, detectar automaticamente
      if (!region) {
        const location = await geolocationService.detectLocation();
        region = location.region;
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('region', region)
        .order('sort_order', { ascending: true });
      
      if (error) return { success: false, data: [], error: error.message };
      return { success: true, data: (data || []) as SubscriptionPlan[] };
    } catch (e) {
      return { success: false, data: [], error: 'Erro ao carregar planos' };
    }
  }

  /**
   * Obtém planos para todas as regiões (útil para comparação)
   */
  async getAllActivePlans(): Promise<{ success: boolean; data: SubscriptionPlan[]; error?: string }> {
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

  async prepareCheckout(
    planId: string,
    userId?: string,
    stripePriceId?: string,
    region?: Region
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Se não foi especificada uma região, detectar automaticamente
      if (!region) {
        const location = await geolocationService.detectLocation();
        region = location.region;
      }

      // Buscar o plano específico da região
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('region', region)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'Plano não encontrado para esta região' };
      }

      // Usar o stripe_price_id do plano da região específica
      const finalStripePriceId = stripePriceId || plan.stripe_price_id;

      // Espera existir uma RPC ou Edge Function que retorna checkout_url
      const params: Record<string, any> = { 
        plan_id: planId,
        region: region,
        stripe_price_id: finalStripePriceId
      };
      if (userId) params.user_id = userId;
      
      const { data, error } = await supabase.rpc('prepare_checkout_data', params);
      if (!error) {
        return { success: true, url: (data as any)?.checkout_url || (data as any)?.url };
      }
      
      // Fallback: se RPC não existir, tentar Edge Function homônima
      if ((error as any)?.code === 'PGRST202') {
        // 1) Tenta prepare_checkout_data
        const fn1 = await (supabase as any).functions.invoke('prepare_checkout_data', {
          body: { ...params, stripe_price_id: finalStripePriceId },
        });
        if (!fn1.error && fn1.data) {
          return { success: true, url: (fn1.data as any)?.checkout_url || (fn1.data as any)?.url };
        }
        // 2) Tenta slug alternativo comum (ex.: 'hyper-service')
        const fn2 = await (supabase as any).functions.invoke('hyper-service', {
          body: { ...params, stripe_price_id: finalStripePriceId },
        });
        if (fn2.error) return { success: false, error: fn2.error.message || 'Erro ao preparar checkout' };
        return { success: true, url: (fn2.data as any)?.checkout_url || (fn2.data as any)?.url };
      }
      return { success: false, error: (error as any)?.message || 'Erro ao preparar checkout' };
    } catch (e) {
      return { success: false, error: 'Erro ao preparar checkout' };
    }
  }

  /**
   * Cancela a assinatura do usuário e volta para o plano gratuito
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚫 Cancelando assinatura do usuário:', userId);
      
      // Buscar plano gratuito da região do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return { success: false, error: 'Perfil do usuário não encontrado' };
      }

      // Detectar região para buscar o plano gratuito correto
      const location = await geolocationService.detectLocation();
      
      const { data: freePlans, error: freePlanError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', 'free')
        .eq('region', location.region)
        .eq('is_active', true)
        .limit(1);

      if (freePlanError || !freePlans || freePlans.length === 0) {
        console.error('❌ Erro ao buscar plano gratuito:', freePlanError);
        return { success: false, error: 'Plano gratuito não encontrado' };
      }

      const freePlan = freePlans[0];

      // Atualizar perfil do usuário para plano gratuito
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          current_plan_id: freePlan.id,
          subscription_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        return { success: false, error: 'Erro ao cancelar assinatura' };
      }

      console.log('✅ Assinatura cancelada com sucesso. Usuário voltou para plano gratuito.');
      
      // Chamar Edge Function para cancelar no Stripe (se houver subscription_id)
      if (profile.stripe_subscription_id) {
        try {
          const { data: cancelResult, error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
            body: { 
              user_id: userId,
              subscription_id: profile.stripe_subscription_id 
            }
          });
          
          if (cancelError) {
            console.warn('⚠️ Erro ao cancelar no Stripe, mas perfil foi atualizado:', cancelError);
          } else {
            console.log('✅ Assinatura cancelada no Stripe também');
          }
        } catch (stripeError) {
          console.warn('⚠️ Falha na comunicação com Stripe, mas perfil foi atualizado:', stripeError);
        }
      }

      // Criar notificação de cancelamento
      try {
        await avisosService.createAviso({
          user_id: userId,
          aviso_tipo: 'update',
          titulo: 'Assinatura cancelada 😔',
          descricao: 'Sua assinatura foi cancelada. Você ainda pode fazer upgrade a qualquer momento para acessar recursos premium!',
          ativo: true
        });
      } catch (notifError) {
        console.warn('Erro ao criar notificação de cancelamento:', notifError);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      return { success: false, error: 'Erro interno ao cancelar assinatura' };
    }
  }

  /**
   * Verifica se o usuário tem um plano pago (não gratuito)
   */
  async hasPaidPlan(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, current_plan_id')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      // Se não tem plano atual ou status é free, não é pago
      if (!profile.current_plan_id || profile.subscription_status === 'free') {
        return false;
      }

      // Verificar se o plano atual não é gratuito
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('slug, price_cents')
        .eq('id', profile.current_plan_id)
        .single();

      if (!plan) return false;

      // Plano é pago se não é 'free' e tem preço > 0
      return plan.slug !== 'free' && plan.price_cents > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar plano pago:', error);
      return false;
    }
  }
}

export const subscriptionsService = new SubscriptionsService();
export default subscriptionsService;


