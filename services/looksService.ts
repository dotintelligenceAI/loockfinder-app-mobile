import { subscriptionsService } from './subscriptionsService';
import { supabase } from './supabase';

export interface Look {
  id: string;
  title: string;
  description: string;
  image_url: string;
  categories_id: string;
  created_at: string;
}

class LooksService {
  async getLooks(userId?: string): Promise<Look[]> {
    // Verificar se o usuário é gratuito para aplicar limitação de quantidade
    let isFreeUser = true;
    if (userId) {
      try {
        const userPlan = await subscriptionsService.getProfileWithPlan(userId);
        if (userPlan.success && userPlan.data) {
          // Usuário é gratuito se tem plano free E status free
          isFreeUser = userPlan.data.plan?.slug === 'free' && userPlan.data.subscription_status === 'free';
        }
      } catch (error) {
        console.error('Erro ao verificar plano do usuário:', error);
      }
    }

    // Todos os planos têm acesso aos looks dinâmicos
    // A diferença é apenas na quantidade retornada
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .limit(isFreeUser ? 50 : 1000); // Free: 50 looks, Pagos: 1000 looks
    
    if (error) throw error;
    
    // Embaralhar os resultados para todos os usuários (dinâmico)
    const shuffledData = (data || []).sort(() => Math.random() - 0.5);
    return shuffledData;
  }

  async getLooksByCategory(categoryId: string, userId?: string): Promise<Look[]> {
    // Verificar se o usuário é gratuito para aplicar limitação
    let isFreeUser = true;
    if (userId) {
      try {
        const userPlan = await subscriptionsService.getProfileWithPlan(userId);
        if (userPlan.success && userPlan.data) {
          isFreeUser = userPlan.data.plan?.slug === 'free' && userPlan.data.subscription_status === 'free';
        }
      } catch (error) {
        console.error('Erro ao verificar plano do usuário:', error);
      }
    }

    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('categories_id', categoryId)
      .limit(isFreeUser ? 5 : 1000) // Free: apenas 5 looks, Pagos: 1000 looks
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Embaralhar para tornar dinâmico
    const shuffledData = (data || []).sort(() => Math.random() - 0.5);
    return shuffledData;
  }

  async getLooksBySubcategory(subcategoryId: string, userId?: string): Promise<Look[]> {
    // Verificar se o usuário é gratuito para aplicar limitação
    let isFreeUser = true;
    if (userId) {
      try {
        const userPlan = await subscriptionsService.getProfileWithPlan(userId);
        if (userPlan.success && userPlan.data) {
          isFreeUser = userPlan.data.plan?.slug === 'free' && userPlan.data.subscription_status === 'free';
        }
      } catch (error) {
        console.error('Erro ao verificar plano do usuário:', error);
      }
    }

    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('subcategorias_id', subcategoryId)
      .limit(isFreeUser ? 5 : 1000) // Free: apenas 5 looks, Pagos: 1000 looks
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Embaralhar para tornar dinâmico
    const shuffledData = (data || []).sort(() => Math.random() - 0.5);
    return shuffledData;
  }
}

export const looksService = new LooksService();
export default looksService; 