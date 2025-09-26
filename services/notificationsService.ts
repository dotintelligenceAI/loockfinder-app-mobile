import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isWeb, withNativeCheck } from '../utils/platform';
import { supabase } from './supabase';

// Verificar se estamos no Expo Go ou em um development build
const isExpoGo = Constants.appOwnership === 'expo';
const isInDevelopment = __DEV__;

// Função para verificar se push notifications estão disponíveis
const isPushNotificationAvailable = (): boolean => {
  // No Expo Go, push notifications não funcionam a partir do SDK 53
  if (isExpoGo) {
    console.warn('⚠️ Push notifications não estão disponíveis no Expo Go. Use um development build para funcionalidade completa.');
    return false;
  }
  
  // Em development builds e production, funciona normalmente
  return true;
};

// Configurar como as notificações devem ser tratadas quando recebidas
// Só configurar se não estivermos no Expo Go e com tratamento de erro
const initializeNotificationHandler = () => {
  if (isWeb) {
    console.log('⚠️ Notification handler skipped (Web platform)');
    return;
  }

  try {
    if (isPushNotificationAvailable()) {
      withNativeCheck(
        () => {
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          console.log('✅ Notification handler initialized successfully');
        },
        null,
        'expo-notifications'
      );
    } else {
      console.log('⚠️ Notification handler skipped (Expo Go or unavailable)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize notification handler:', error);
    // Não falhar a inicialização do app por causa de notificações
  }
};

// Inicializar de forma segura
initializeNotificationHandler();

export interface Aviso {
  id: string;
  user_id: string;
  aviso_tipo: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  mostrado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface NotificationData {
  avisoId: string;
  tipo: string;
  [key: string]: any;
}

class NotificationsService {
  private expoPushToken: string | null = null;

  /**
   * Registrar dispositivo para receber push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (isWeb) {
      console.log('🚫 Push notifications não disponíveis na web');
      return null;
    }

    let token = null;

    // Verificar se push notifications estão disponíveis
    if (!isPushNotificationAvailable()) {
      console.log('🚫 Push notifications não disponíveis no Expo Go. Funcionalidade será habilitada no build de produção.');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push notifications só funcionam em dispositivos físicos');
      return null;
    }

    // Verificar permissões existentes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Solicitar permissões se necessário
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão para notificações negada');
      return null;
    }

    // Obter token do Expo
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID não encontrado');
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
      this.expoPushToken = token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }

    // Configurar canal de notificação no Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('lookfinder-notifications', {
        name: 'LookFinder Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1a1a1a',
      });
    }

    return token;
  }

  /**
   * Salvar token do dispositivo no Supabase
   */
  async saveDeviceToken(userId: string, token: string): Promise<void> {
    try {
      // Primeiro, tentar atualizar se já existe
      const { data: existing } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('expo_push_token', token)
        .single();

      if (existing) {
        // Token já existe, apenas atualizar
        const { error } = await supabase
          .from('device_tokens')
          .update({
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Erro ao atualizar token existente:', error);
        } else {
          console.log('Token existente atualizado com sucesso');
        }
      } else {
        // Token não existe, criar novo
        const { error } = await supabase
          .from('device_tokens')
          .insert({
            user_id: userId,
            expo_push_token: token,
            device_type: Platform.OS,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Erro ao criar novo token:', error);
        } else {
          console.log('Novo token criado com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  }

  /**
   * Buscar avisos não mostrados para o usuário
   */
  async getUnreadNotifications(userId: string): Promise<Aviso[]> {
    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true)
        .is('mostrado_em', null)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar avisos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      return [];
    }
  }

  /**
   * Marcar aviso como mostrado
   */
  async markNotificationAsShown(avisoId: string): Promise<void> {
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
      }
    } catch (error) {
      console.error('Erro ao marcar aviso como mostrado:', error);
    }
  }

  /**
   * Enviar notificação local (para teste)
   */
  async sendLocalNotification(title: string, body: string, data?: NotificationData): Promise<void> {
    if (isWeb) {
      console.log('🚫 Local notifications não disponíveis na web');
      return;
    }

    await withNativeCheck(
      () => Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Enviar imediatamente
      }),
      Promise.resolve(),
      'expo-notifications'
    );
  }

  /**
   * Enviar push notification via API do Expo
   */
  async sendPushNotification(
    expoPushToken: string, 
    title: string, 
    body: string, 
    data?: NotificationData
  ): Promise<boolean> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high' as const,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification enviada:', result);
      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
      return false;
    }
  }

  /**
   * Processar avisos e enviar notificações
   */
  async processNotifications(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);
      
      for (const aviso of unreadNotifications) {
        // Enviar notificação local
        await this.sendLocalNotification(
          aviso.titulo,
          aviso.descricao,
          {
            avisoId: aviso.id,
            tipo: aviso.aviso_tipo
          }
        );

        // Marcar como mostrado
        await this.markNotificationAsShown(aviso.id);
      }

      console.log(`Processadas ${unreadNotifications.length} notificações`);
    } catch (error) {
      console.error('Erro ao processar notificações:', error);
    }
  }

  /**
   * Configurar listeners de notificações
   */
  setupNotificationListeners(): {
    receivedSubscription: Notifications.Subscription | null;
    responseSubscription: Notifications.Subscription | null;
  } {
    if (isWeb) {
      console.log('🚫 Listeners de notificação não disponíveis na web');
      return {
        receivedSubscription: null,
        responseSubscription: null,
      };
    }

    // Verificar se push notifications estão disponíveis
    if (!isPushNotificationAvailable()) {
      console.log('🚫 Listeners de notificação não disponíveis no Expo Go.');
      return {
        receivedSubscription: null,
        responseSubscription: null,
      };
    }
    // Listener para quando uma notificação é recebida
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificação recebida:', notification);
      
      // Aqui você pode processar a notificação recebida
      const data = notification.request.content.data as NotificationData;
      if (data?.avisoId) {
        console.log('Aviso recebido:', data.avisoId, data.tipo);
      }
    });

    // Listener para quando o usuário interage com a notificação
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuário interagiu com notificação:', response);
      
      const data = response.notification.request.content.data as NotificationData;
      if (data?.avisoId) {
        console.log('Usuário clicou no aviso:', data.avisoId, data.tipo);
        
        // Aqui você pode navegar para uma tela específica baseada no tipo
        this.handleNotificationAction(data);
      }
    });

    return { receivedSubscription, responseSubscription };
  }

  /**
   * Tratar ações quando usuário clica na notificação
   */
  private handleNotificationAction(data: NotificationData): void {
    switch (data.tipo) {
      case 'welcome_tour':
        // Navegar para tour de boas-vindas
        console.log('Navegando para tour de boas-vindas');
        break;
      case 'new_feature':
        // Navegar para nova funcionalidade
        console.log('Navegando para nova funcionalidade');
        break;
      case 'promotion':
        // Navegar para promoção
        console.log('Navegando para promoção');
        break;
      default:
        console.log('Tipo de notificação desconhecido:', data.tipo);
    }
  }

  /**
   * Limpar listeners
   */
  removeNotificationListeners(
    receivedSubscription: Notifications.Subscription,
    responseSubscription: Notifications.Subscription
  ): void {
    receivedSubscription.remove();
    responseSubscription.remove();
  }
}

export const notificationsService = new NotificationsService();
