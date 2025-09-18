// Edge Function para gerenciar notificações push do LookFinder
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface DeviceToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_type: string;
  updated_at: string;
}

interface Aviso {
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

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({
        error: "Configuração do Supabase ausente"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { action, ...payload } = await req.json();

    switch (action) {
      case 'send_to_user':
        return await sendNotificationToUser(supabase, payload);
      case 'send_to_all':
        return await sendNotificationToAll(supabase, payload);
      case 'process_pending':
        return await processPendingNotifications(supabase);
      case 'process_scheduled':
        return await processScheduledNotifications(supabase);
      case 'create_welcome':
        return await createWelcomeNotification(supabase, payload);
      case 'create_scheduled':
        return await createScheduledNotification(supabase, payload);
      default:
        return new Response(JSON.stringify({
          error: "Ação não reconhecida"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

  } catch (e) {
    console.error("Erro na Edge Function:", e);
    return new Response(JSON.stringify({
      error: "Internal error",
      message: String(e?.message || e)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// Enviar notificação para usuário específico
async function sendNotificationToUser(supabase: any, payload: {
  user_id: string;
  titulo: string;
  descricao: string;
  aviso_tipo: string;
}) {
  try {
    // Criar aviso no banco
    const { data: aviso, error: avisoError } = await supabase
      .from('avisos')
      .insert({
        user_id: payload.user_id,
        aviso_tipo: payload.aviso_tipo,
        titulo: payload.titulo,
        descricao: payload.descricao,
        ativo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (avisoError) {
      console.error("Erro ao criar aviso:", avisoError);
      return new Response(JSON.stringify({
        error: "Erro ao criar aviso",
        details: avisoError
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Buscar token do dispositivo
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('expo_push_token')
      .eq('user_id', payload.user_id);

    if (tokens && tokens.length > 0) {
      // Enviar push notification
      for (const tokenData of tokens) {
        await sendExpoPushNotification(
          tokenData.expo_push_token,
          payload.titulo,
          payload.descricao,
          {
            avisoId: aviso.id,
            tipo: payload.aviso_tipo
          }
        );
      }
    }

    return new Response(JSON.stringify({
      success: true,
      avisoId: aviso.id,
      sentTo: tokens?.length || 0
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    return new Response(JSON.stringify({
      error: "Erro ao enviar notificação"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Enviar notificação para todos os usuários
async function sendNotificationToAll(supabase: any, payload: {
  titulo: string;
  descricao: string;
  aviso_tipo: string;
}) {
  try {
    // Buscar todos os usuários ativos
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Nenhum usuário ativo encontrado"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Criar avisos para todos os usuários
    for (const user of users) {
      try {
        // Criar aviso
        const { data: aviso, error: avisoError } = await supabase
          .from('avisos')
          .insert({
            user_id: user.id,
            aviso_tipo: payload.aviso_tipo,
            titulo: payload.titulo,
            descricao: payload.descricao,
            ativo: true,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          })
          .select()
          .single();

        if (avisoError) {
          console.error(`Erro ao criar aviso para usuário ${user.id}:`, avisoError);
          errorCount++;
          continue;
        }

        // Buscar token do dispositivo
        const { data: tokens } = await supabase
          .from('device_tokens')
          .select('expo_push_token')
          .eq('user_id', user.id);

        if (tokens && tokens.length > 0) {
          // Enviar push notification
          for (const tokenData of tokens) {
            await sendExpoPushNotification(
              tokenData.expo_push_token,
              payload.titulo,
              payload.descricao,
              {
                avisoId: aviso.id,
                tipo: payload.aviso_tipo
              }
            );
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Erro ao processar usuário ${user.id}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalUsers: users.length,
      successCount,
      errorCount
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao enviar notificação para todos:", error);
    return new Response(JSON.stringify({
      error: "Erro ao enviar notificação para todos"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Processar notificações pendentes
async function processPendingNotifications(supabase: any) {
  try {
    // Buscar avisos não mostrados
    const { data: avisos } = await supabase
      .from('avisos')
      .select(`
        *,
        device_tokens!inner(expo_push_token)
      `)
      .eq('ativo', true)
      .is('mostrado_em', null)
      .order('criado_em', { ascending: true });

    if (!avisos || avisos.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Nenhuma notificação pendente"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let processedCount = 0;

    for (const aviso of avisos) {
      try {
        // Enviar notificação
        if (aviso.device_tokens && aviso.device_tokens.length > 0) {
          for (const tokenData of aviso.device_tokens) {
            await sendExpoPushNotification(
              tokenData.expo_push_token,
              aviso.titulo,
              aviso.descricao,
              {
                avisoId: aviso.id,
                tipo: aviso.aviso_tipo
              }
            );
          }
        }

        // Marcar como mostrado
        await supabase
          .from('avisos')
          .update({
            mostrado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          })
          .eq('id', aviso.id);

        processedCount++;
      } catch (error) {
        console.error(`Erro ao processar aviso ${aviso.id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalPending: avisos.length,
      processed: processedCount
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao processar notificações pendentes:", error);
    return new Response(JSON.stringify({
      error: "Erro ao processar notificações pendentes"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Criar notificação de boas-vindas
async function createWelcomeNotification(supabase: any, payload: { user_id: string }) {
  try {
    const { data: aviso, error } = await supabase
      .from('avisos')
      .insert({
        user_id: payload.user_id,
        aviso_tipo: 'welcome_tour',
        titulo: 'Bem-vindo à LookFinder! 👋',
        descricao: 'Descubra todas as funcionalidades da nossa plataforma de moda. Toque para começar o tour!',
        ativo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({
        error: "Erro ao criar aviso de boas-vindas",
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      avisoId: aviso.id
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao criar notificação de boas-vindas:", error);
    return new Response(JSON.stringify({
      error: "Erro ao criar notificação de boas-vindas"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Enviar push notification via Expo
async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
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
    console.log('Push notification result:', result);
    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    return false;
  }
}

// Processar notificações agendadas
async function processScheduledNotifications(supabase: any) {
  try {
    console.log('🗓️ Processando notificações agendadas...');

    // Buscar notificações agendadas que devem ser enviadas agora
    const { data: scheduledNotifications, error } = await supabase
      .from('avisos')
      .select(`
        *,
        device_tokens!inner(expo_push_token)
      `)
      .eq('ativo', true)
      .is('sent_at', null)
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Erro ao buscar notificações agendadas:', error);
      return new Response(JSON.stringify({
        error: "Erro ao buscar notificações agendadas"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Nenhuma notificação agendada pendente"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let processedCount = 0;
    let recurringCount = 0;

    for (const notification of scheduledNotifications) {
      try {
        // Enviar notificação
        if (notification.device_tokens && notification.device_tokens.length > 0) {
          for (const tokenData of notification.device_tokens) {
            await sendExpoPushNotification(
              tokenData.expo_push_token,
              notification.titulo,
              notification.descricao,
              {
                avisoId: notification.id,
                tipo: notification.aviso_tipo
              }
            );
          }
        }

        // Marcar como enviada
        await supabase
          .from('avisos')
          .update({
            sent_at: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          })
          .eq('id', notification.id);

        // Se for recorrente, criar próxima ocorrência
        if (notification.schedule_type?.startsWith('recurring_')) {
          await createNextRecurringNotification(supabase, notification);
          recurringCount++;
        }

        processedCount++;
        console.log(`✅ Notificação agendada enviada: ${notification.titulo}`);
      } catch (error) {
        console.error(`Erro ao processar notificação ${notification.id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalScheduled: scheduledNotifications.length,
      processed: processedCount,
      recurringCreated: recurringCount
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao processar notificações agendadas:", error);
    return new Response(JSON.stringify({
      error: "Erro ao processar notificações agendadas"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

// Criar próxima ocorrência de notificação recorrente
async function createNextRecurringNotification(supabase: any, notification: any) {
  try {
    const currentDate = new Date(notification.scheduled_for);
    let nextDate = new Date(currentDate);

    switch (notification.schedule_type) {
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

    await supabase
      .from('avisos')
      .insert({
        user_id: notification.user_id,
        aviso_tipo: notification.aviso_tipo,
        titulo: notification.titulo,
        descricao: notification.descricao,
        ativo: true,
        scheduled_for: nextDate.toISOString(),
        schedule_type: notification.schedule_type,
        recurrence_config: notification.recurrence_config || {},
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      });

    console.log(`🔄 Próxima recorrência criada para ${nextDate.toISOString()}`);
  } catch (error) {
    console.error('Erro ao criar próxima recorrência:', error);
  }
}

// Criar notificação agendada via API
async function createScheduledNotification(supabase: any, payload: {
  user_id: string;
  titulo: string;
  descricao: string;
  aviso_tipo: string;
  scheduled_for: string;
  schedule_type?: string;
}) {
  try {
    const { data: aviso, error } = await supabase
      .from('avisos')
      .insert({
        user_id: payload.user_id,
        aviso_tipo: payload.aviso_tipo,
        titulo: payload.titulo,
        descricao: payload.descricao,
        ativo: true,
        scheduled_for: payload.scheduled_for,
        schedule_type: payload.schedule_type || 'scheduled',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({
        error: "Erro ao criar notificação agendada",
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      avisoId: aviso.id,
      scheduledFor: payload.scheduled_for
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Erro ao criar notificação agendada:", error);
    return new Response(JSON.stringify({
      error: "Erro ao criar notificação agendada"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
