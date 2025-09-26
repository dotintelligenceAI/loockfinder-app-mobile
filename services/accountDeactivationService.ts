import { supabase } from './supabase';

export interface DeactivationResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface DeactivationData {
  userId: string;
  reason?: string;
  feedback?: string;
}

class AccountDeactivationService {
  /**
   * Desativa a conta do usuário
   */
  async deactivateAccount(data: DeactivationData): Promise<DeactivationResult> {
    try {
      console.log('🔄 Iniciando desativação de conta para usuário:', data.userId);

      // 1. Marcar perfil como inativo
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: data.reason,
          deactivation_feedback: data.feedback
        })
        .eq('id', data.userId);

      if (profileError) {
        console.error('❌ Erro ao desativar perfil:', profileError);
        return {
          success: false,
          error: 'Erro ao desativar perfil do usuário'
        };
      }

      // 2. Cancelar todas as assinaturas ativas
      const { error: subscriptionError } = await supabase
        .from('subscription_plans')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'account_deactivation'
        })
        .eq('user_id', data.userId)
        .eq('status', 'active');

      if (subscriptionError) {
        console.error('❌ Erro ao cancelar assinaturas:', subscriptionError);
        // Não falha a operação, apenas loga o erro
      }

      // 3. Desativar tokens de notificação
      const { error: tokenError } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', data.userId)
        .eq('is_active', true);

      if (tokenError) {
        console.error('❌ Erro ao desativar tokens:', tokenError);
        // Não falha a operação, apenas loga o erro
      }

      // 4. Fazer logout do usuário
      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        console.error('❌ Erro ao fazer logout:', authError);
        // Não falha a operação, apenas loga o erro
      }

      console.log('✅ Conta desativada com sucesso');
      
      return {
        success: true,
        message: 'Sua conta foi desativada com sucesso. Esperamos vê-lo novamente em breve!'
      };

    } catch (error) {
      console.error('❌ Erro geral na desativação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na desativação'
      };
    }
  }

  /**
   * Verifica se o usuário pode desativar a conta
   */
  async canDeactivateAccount(userId: string): Promise<{ canDeactivate: boolean; reason?: string }> {
    try {
      // Verificar se há assinaturas ativas
      const { data: activeSubscriptions, error } = await supabase
        .from('subscription_plans')
        .select('id, status, plan_type')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('❌ Erro ao verificar assinaturas:', error);
        return { canDeactivate: false, reason: 'Erro ao verificar status da conta' };
      }

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        return { 
          canDeactivate: false, 
          reason: 'Você tem uma assinatura ativa. Cancele sua assinatura primeiro antes de desativar a conta.' 
        };
      }

      return { canDeactivate: true };

    } catch (error) {
      console.error('❌ Erro ao verificar possibilidade de desativação:', error);
      return { canDeactivate: false, reason: 'Erro ao verificar status da conta' };
    }
  }

  /**
   * Salva feedback de desativação
   */
  async saveDeactivationFeedback(userId: string, feedback: string): Promise<DeactivationResult> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          deactivation_feedback: feedback,
          feedback_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao salvar feedback:', error);
        return {
          success: false,
          error: 'Erro ao salvar feedback'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erro geral ao salvar feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const accountDeactivationService = new AccountDeactivationService();
export default accountDeactivationService;
