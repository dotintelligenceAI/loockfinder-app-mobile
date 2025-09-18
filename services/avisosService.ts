import { Aviso } from './notificationsService';
import { supabase } from './supabase';

export interface CreateAvisoData {
  user_id: string;
  aviso_tipo: 'welcome_tour' | 'new_feature' | 'promotion' | 'update' | 'maintenance' | 'custom';
  titulo: string;
  descricao: string;
  ativo?: boolean;
  scheduled_for?: string; // ISO string da data/hora para envio
  schedule_type?: 'immediate' | 'scheduled' | 'recurring_daily' | 'recurring_weekly' | 'recurring_monthly';
  recurrence_config?: Record<string, any>;
}

export interface UpdateAvisoData {
  titulo?: string;
  descricao?: string;
  ativo?: boolean;
  mostrado_em?: string | null;
  scheduled_for?: string | null;
  schedule_type?: string;
  sent_at?: string | null;
}

class AvisosService {
  /**
   * Criar novo aviso
   */
  async createAviso(data: CreateAvisoData): Promise<{ success: boolean; data?: Aviso; error?: string }> {
    try {
      const { data: aviso, error } = await supabase
        .from('avisos')
        .insert({
          ...data,
          ativo: data.ativo ?? true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar aviso:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: aviso };
    } catch (error) {
      console.error('Erro ao criar aviso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Buscar avisos do usuário
   */
  async getUserAvisos(
    userId: string, 
    options?: {
      ativo?: boolean;
      mostrado?: boolean;
      tipo?: string;
      limit?: number;
    }
  ): Promise<{ success: boolean; data: Aviso[]; error?: string }> {
    try {
      let query = supabase
        .from('avisos')
        .select('*')
        .eq('user_id', userId)
        .order('criado_em', { ascending: false });

      // Aplicar filtros opcionais
      if (options?.ativo !== undefined) {
        query = query.eq('ativo', options.ativo);
      }

      if (options?.mostrado === true) {
        query = query.not('mostrado_em', 'is', null);
      } else if (options?.mostrado === false) {
        query = query.is('mostrado_em', null);
      }

      if (options?.tipo) {
        query = query.eq('aviso_tipo', options.tipo);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar avisos:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      return { success: false, data: [], error: 'Erro interno do servidor' };
    }
  }

  /**
   * Buscar aviso por ID
   */
  async getAvisoById(avisoId: string): Promise<{ success: boolean; data?: Aviso; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('id', avisoId)
        .single();

      if (error) {
        console.error('Erro ao buscar aviso:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar aviso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualizar aviso
   */
  async updateAviso(
    avisoId: string, 
    data: UpdateAvisoData
  ): Promise<{ success: boolean; data?: Aviso; error?: string }> {
    try {
      const { data: aviso, error } = await supabase
        .from('avisos')
        .update({
          ...data,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', avisoId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar aviso:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: aviso };
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Marcar aviso como mostrado
   */
  async markAsShown(avisoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('avisos')
        .update({
          mostrado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', avisoId);

      if (error) {
        console.error('Erro ao marcar aviso como mostrado:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar aviso como mostrado:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Desativar aviso
   */
  async deactivateAviso(avisoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('avisos')
        .update({
          ativo: false,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', avisoId);

      if (error) {
        console.error('Erro ao desativar aviso:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao desativar aviso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Deletar aviso
   */
  async deleteAviso(avisoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', avisoId);

      if (error) {
        console.error('Erro ao deletar aviso:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar aviso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Criar aviso de boas-vindas para novo usuário
   */
  async createWelcomeNotification(userId: string): Promise<{ success: boolean; error?: string }> {
    const welcomeData: CreateAvisoData = {
      user_id: userId,
      aviso_tipo: 'welcome_tour',
      titulo: 'Bem-vindo à LookFinder! 👋',
      descricao: 'Descubra todas as funcionalidades da nossa plataforma de moda. Toque para começar o tour!',
      ativo: true
    };

    const result = await this.createAviso(welcomeData);
    return { success: result.success, error: result.error };
  }

  /**
   * Criar aviso de nova funcionalidade
   */
  async createFeatureNotification(
    userId: string, 
    featureName: string, 
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    const featureData: CreateAvisoData = {
      user_id: userId,
      aviso_tipo: 'new_feature',
      titulo: `🆕 Nova funcionalidade: ${featureName}`,
      descricao: description,
      ativo: true
    };

    const result = await this.createAviso(featureData);
    return { success: result.success, error: result.error };
  }

  /**
   * Criar aviso promocional
   */
  async createPromotionNotification(
    userId: string, 
    title: string, 
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    const promotionData: CreateAvisoData = {
      user_id: userId,
      aviso_tipo: 'promotion',
      titulo: `🎉 ${title}`,
      descricao: description,
      ativo: true
    };

    const result = await this.createAviso(promotionData);
    return { success: result.success, error: result.error };
  }

  /**
   * Buscar estatísticas de avisos do usuário
   */
  async getUserNotificationStats(userId: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      naoMostrados: number;
      mostrados: number;
      ativos: number;
      inativos: number;
      agendados: number;
      enviados: number;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('ativo, mostrado_em, scheduled_for, sent_at')
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total: data.length,
        naoMostrados: data.filter(a => !a.mostrado_em).length,
        mostrados: data.filter(a => a.mostrado_em).length,
        ativos: data.filter(a => a.ativo).length,
        inativos: data.filter(a => !a.ativo).length,
        agendados: data.filter(a => a.scheduled_for && !a.sent_at).length,
        enviados: data.filter(a => a.sent_at).length,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Criar notificação agendada para data/hora específica
   */
  async createScheduledNotification(
    userId: string,
    titulo: string,
    descricao: string,
    scheduledFor: Date,
    avisoTipo: CreateAvisoData['aviso_tipo'] = 'custom'
  ): Promise<{ success: boolean; data?: Aviso; error?: string }> {
    const data: CreateAvisoData = {
      user_id: userId,
      aviso_tipo: avisoTipo,
      titulo,
      descricao,
      ativo: true,
      scheduled_for: scheduledFor.toISOString(),
      schedule_type: 'scheduled'
    };

    return this.createAviso(data);
  }

  /**
   * Criar notificação recorrente
   */
  async createRecurringNotification(
    userId: string,
    titulo: string,
    descricao: string,
    recurrenceType: 'recurring_daily' | 'recurring_weekly' | 'recurring_monthly',
    startDate?: Date,
    config?: Record<string, any>
  ): Promise<{ success: boolean; data?: Aviso; error?: string }> {
    const scheduledFor = startDate || new Date();
    
    // Ajustar data baseada no tipo de recorrência
    const now = new Date();
    switch (recurrenceType) {
      case 'recurring_daily':
        if (scheduledFor <= now) {
          scheduledFor.setDate(now.getDate() + 1);
        }
        break;
      case 'recurring_weekly':
        if (scheduledFor <= now) {
          scheduledFor.setDate(now.getDate() + 7);
        }
        break;
      case 'recurring_monthly':
        if (scheduledFor <= now) {
          scheduledFor.setMonth(now.getMonth() + 1);
        }
        break;
    }

    const data: CreateAvisoData = {
      user_id: userId,
      aviso_tipo: 'custom',
      titulo,
      descricao,
      ativo: true,
      scheduled_for: scheduledFor.toISOString(),
      schedule_type: recurrenceType,
      recurrence_config: config || {}
    };

    return this.createAviso(data);
  }

  /**
   * Buscar notificações agendadas pendentes
   */
  async getPendingScheduledNotifications(): Promise<{ success: boolean; data: Aviso[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('ativo', true)
        .is('sent_at', null)
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Erro ao buscar notificações agendadas:', error);
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Erro ao buscar notificações agendadas:', error);
      return { success: false, data: [], error: 'Erro interno do servidor' };
    }
  }

  /**
   * Marcar notificação como enviada
   */
  async markAsSent(avisoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('avisos')
        .update({
          sent_at: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        })
        .eq('id', avisoId);

      if (error) {
        console.error('Erro ao marcar como enviada:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar como enviada:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Processar notificações recorrentes (criar próxima ocorrência)
   */
  async processRecurringNotification(aviso: Aviso): Promise<{ success: boolean; error?: string }> {
    try {
      if (!aviso.schedule_type?.startsWith('recurring_')) {
        return { success: false, error: 'Não é uma notificação recorrente' };
      }

      // Calcular próxima data
      const currentDate = new Date(aviso.scheduled_for || aviso.criado_em);
      let nextDate = new Date(currentDate);

      switch (aviso.schedule_type) {
        case 'recurring_daily':
          nextDate.setDate(currentDate.getDate() + 1);
          break;
        case 'recurring_weekly':
          nextDate.setDate(currentDate.getDate() + 7);
          break;
        case 'recurring_monthly':
          nextDate.setMonth(currentDate.getMonth() + 1);
          break;
      }

      // Criar próxima ocorrência
      const { error } = await supabase
        .from('avisos')
        .insert({
          user_id: aviso.user_id,
          aviso_tipo: aviso.aviso_tipo,
          titulo: aviso.titulo,
          descricao: aviso.descricao,
          ativo: true,
          scheduled_for: nextDate.toISOString(),
          schedule_type: aviso.schedule_type,
          recurrence_config: aviso.recurrence_config || {},
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao criar próxima recorrência:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Próxima recorrência criada para ${nextDate.toISOString()}`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao processar recorrência:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}

export const avisosService = new AvisosService();
