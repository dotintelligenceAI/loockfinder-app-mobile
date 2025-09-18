import { useAuth } from '@/contexts/AuthContext';
import { Aviso, avisosService, notificationsService } from '@/services';
import { useCallback, useEffect, useState } from 'react';

export interface NotificationStats {
  total: number;
  naoMostrados: number;
  mostrados: number;
  ativos: number;
  inativos: number;
}

export function useNotifications() {
  const { user, expoPushToken } = useAuth();
  const [notifications, setNotifications] = useState<Aviso[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar notificações do usuário
  const loadNotifications = useCallback(async (options?: {
    ativo?: boolean;
    mostrado?: boolean;
    tipo?: string;
    limit?: number;
  }) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await avisosService.getUserAvisos(user.id, options);
      
      if (response.success) {
        setNotifications(response.data);
      } else {
        console.error('Erro ao carregar notificações:', response.error);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await avisosService.getUserNotificationStats(user.id);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [user?.id]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (avisoId: string) => {
    try {
      const response = await avisosService.markAsShown(avisoId);
      
      if (response.success) {
        // Atualizar lista local
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === avisoId 
              ? { ...notif, mostrado_em: new Date().toISOString() }
              : notif
          )
        );
        
        // Recarregar estatísticas
        await loadStats();
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [loadStats]);

  // Desativar notificação
  const deactivateNotification = useCallback(async (avisoId: string) => {
    try {
      const response = await avisosService.deactivateAviso(avisoId);
      
      if (response.success) {
        // Atualizar lista local
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === avisoId 
              ? { ...notif, ativo: false }
              : notif
          )
        );
        
        // Recarregar estatísticas
        await loadStats();
      }
    } catch (error) {
      console.error('Erro ao desativar notificação:', error);
    }
  }, [loadStats]);

  // Enviar notificação local de teste
  const sendTestNotification = useCallback(async (title: string, body: string) => {
    try {
      await notificationsService.sendLocalNotification(title, body, {
        avisoId: 'test',
        tipo: 'custom'
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  }, []);

  // Processar notificações pendentes
  const processNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      await notificationsService.processNotifications(user.id);
      // Recarregar após processar
      await loadNotifications();
      await loadStats();
    } catch (error) {
      console.error('Erro ao processar notificações:', error);
    }
  }, [user?.id, loadNotifications, loadStats]);

  // Carregar dados iniciais quando usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadStats();
    }
  }, [user?.id, loadNotifications, loadStats]);

  return {
    // Estados
    notifications,
    stats,
    loading,
    expoPushToken,
    
    // Ações
    loadNotifications,
    loadStats,
    markAsRead,
    deactivateNotification,
    sendTestNotification,
    processNotifications,
    
    // Dados computados
    unreadCount: stats?.naoMostrados || 0,
    hasUnread: (stats?.naoMostrados || 0) > 0,
  };
}
