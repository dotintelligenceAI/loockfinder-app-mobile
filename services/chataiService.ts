import { supabase } from './supabase';

// Fallback logger compatível com o formato usado no serviço
const secureLogger = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

// Utilitário: fetch com timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs, ...rest } = options;
  if (!timeoutMs) return fetch(url, rest);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

const WEBHOOK_URL = 'https://webhook.amcbots.com.br/webhook/37904998-15b1-4a0f-bee9-26595b760c7f/chat';

export interface ChatLook {
  id: string;
  title: string;
  image_url: string;
  description?: string;
}

export interface ChatResponse {
  text?: string;
  message?: string;
  output?: string;
  response?: string;
  success: boolean;
  error?: string;
  details?: any;
  looks?: ChatLook[];
  showLooks?: boolean;
  limitExceeded?: boolean;
  remainingMessages?: number;
}

export interface ChatSession {
  id: string;
  user_id: string;
  session_title: string;
  started_at: string;
  last_activity: string;
  message_count: number;
  is_active: boolean;
}

export interface UserChatLimits {
  user_id: string;
  daily_message_count: number;
  max_daily_messages: number;
  monthly_message_count: number;
  max_monthly_messages: number;
  subscription_tier: 'free' | 'premium' | 'unlimited';
  is_suspended: boolean;
  suspension_until: string | null;
}

export interface ChatHistoryMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_content: string;
  is_user_message: boolean;
  search_terms: string[];
  looks_shown: number;
  look_ids: string[];
  ai_response_time?: number;
  status: 'sent' | 'delivered' | 'error';
  error_message?: string;
  created_at: string;
  looks?: ChatLook[];
}

/**
 * Serviço para comunicação com o webhook do FinderAI no N8N
 * 
 * NOTA: Para otimizar a performance dos contadores, execute este SQL no Supabase:
 * 
 * CREATE OR REPLACE FUNCTION increment_user_message_counters(p_user_id UUID)
 * RETURNS void AS $$
 * BEGIN
 *   INSERT INTO user_chat_limits (user_id, daily_message_count, monthly_message_count)
 *   VALUES (p_user_id, 1, 1)
 *   ON CONFLICT (user_id) DO UPDATE SET
 *     daily_message_count = user_chat_limits.daily_message_count + 1,
 *     monthly_message_count = user_chat_limits.monthly_message_count + 1,
 *     updated_at = NOW();
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * Também criar função para reset diário automático:
 * 
 * CREATE OR REPLACE FUNCTION reset_daily_limits()
 * RETURNS void AS $$
 * BEGIN
 *   UPDATE user_chat_limits 
 *   SET 
 *     daily_message_count = 0,
 *     last_reset_date = CURRENT_DATE
 *   WHERE last_reset_date < CURRENT_DATE;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
export const chatService = {
  /**
   * Verifica os limites de uso do usuário
   */
  async checkUserLimits(userId: string): Promise<{ canSend: boolean; limits: UserChatLimits | null; message?: string }> {
    try {
      // Primeiro, tentar buscar os limites existentes
      let { data: limitsData, error: limitsError } = await supabase
        .from('user_chat_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Se não existir, criar um novo registro com limites padrão
      if (limitsError && limitsError.code === 'PGRST116') {
        const { data: newLimits, error: createError } = await supabase
          .from('user_chat_limits')
          .insert({
            user_id: userId,
            daily_message_count: 0,
            max_daily_messages: 10, // Limite padrão para usuários free
            monthly_message_count: 0,
            max_monthly_messages: 500,
            subscription_tier: 'free'
          })
          .select()
          .single();

        if (createError) {
          secureLogger.error('Erro ao criar limites do usuário', {
            error: createError.message,
            userId
          }, {
            component: 'ChatService'
          });
          return { canSend: true, limits: null }; // Permitir em caso de erro
        }

        limitsData = newLimits;
      } else if (limitsError) {
        secureLogger.error('Erro ao verificar limites', {
          error: limitsError.message,
          userId
        }, {
          component: 'ChatService'
        });
        return { canSend: true, limits: null }; // Permitir em caso de erro
      }

      // Verificar se o usuário está suspenso
      if (limitsData.is_suspended && limitsData.suspension_until) {
        const suspensionEnd = new Date(limitsData.suspension_until);
        if (suspensionEnd > new Date()) {
          return {
            canSend: false,
            limits: limitsData,
            message: `Conta suspensa até ${suspensionEnd.toLocaleDateString('pt-BR')}`
          };
        } else {
          // Remover suspensão expirada
          await supabase
            .from('user_chat_limits')
            .update({ is_suspended: false, suspension_until: null })
            .eq('user_id', userId);
        }
      }

      // Verificar limites baseados no plano
      if (limitsData.subscription_tier === 'unlimited') {
        return { canSend: true, limits: limitsData };
      }

      // Verificar limite diário
      if (limitsData.daily_message_count >= limitsData.max_daily_messages) {
        return {
          canSend: false,
          limits: limitsData,
          message: `Limite diário de ${limitsData.max_daily_messages} mensagens atingido. Tente novamente amanhã.`
        };
      }

      // Verificar limite mensal
      if (limitsData.monthly_message_count >= limitsData.max_monthly_messages) {
        return {
          canSend: false,
          limits: limitsData,
          message: `Limite mensal de ${limitsData.max_monthly_messages} mensagens atingido.`
        };
      }

      const remainingDaily = limitsData.max_daily_messages - limitsData.daily_message_count;
      return {
        canSend: true,
        limits: limitsData,
        message: `${remainingDaily} mensagens restantes hoje`
      };

    } catch (error: any) {
      secureLogger.error('Erro ao verificar limites do usuário', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
      return { canSend: true, limits: null }; // Permitir em caso de erro crítico
    }
  },

  /**
   * Atualiza os contadores de mensagem do usuário
   */
  async updateMessageCounters(userId: string): Promise<void> {
    try {
      // Incrementar contadores diário e mensal usando RPC personalizada
      const { error } = await supabase.rpc('increment_user_message_counters', {
        p_user_id: userId
      });

      if (error) {
        // Se a função RPC não existir, buscar o registro atual e incrementar
        const { data: currentLimits, error: fetchError } = await supabase
          .from('user_chat_limits')
          .select('daily_message_count, monthly_message_count')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Fazer update com valores incrementados
        const { error: updateError } = await supabase
          .from('user_chat_limits')
          .update({
            daily_message_count: (currentLimits?.daily_message_count || 0) + 1,
            monthly_message_count: (currentLimits?.monthly_message_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      }

    } catch (error: any) {
      secureLogger.error('Erro ao atualizar contadores', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
    }
  },

  /**
   * Cria ou obtém uma sessão ativa para o usuário
   */
  async getOrCreateSession(userId: string): Promise<string> {
    try {
      // Tentar buscar uma sessão ativa
      const { data: activeSessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .limit(1);

      if (sessionError) {
        throw sessionError;
      }

      // Se existe sessão ativa, retornar
      if (activeSessions && activeSessions.length > 0) {
        // Atualizar última atividade
        await supabase
          .from('chat_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', activeSessions[0].id);

        return activeSessions[0].id;
      }

      // Criar nova sessão
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_title: `Conversa ${new Date().toLocaleString('pt-BR')}`,
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      return newSession.id;

    } catch (error: any) {
      secureLogger.error('Erro ao gerenciar sessão', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
      // Retornar um ID temporário em caso de erro
      return `temp_${Date.now()}`;
    }
  },

  /**
   * Salva uma mensagem no histórico
   */
  async saveMessage(
    sessionId: string,
    userId: string,
    messageContent: string,
    isUserMessage: boolean,
    searchTerms?: string[],
    lookIds?: string[],
    aiResponseTime?: number,
    status: 'sent' | 'delivered' | 'error' = 'sent',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          message_content: messageContent,
          is_user_message: isUserMessage,
          search_terms: searchTerms || [],
          looks_shown: lookIds?.length || 0,
          look_ids: lookIds || [],
          ai_response_time: aiResponseTime,
          status,
          error_message: errorMessage
        });

      if (error) {
        throw error;
      }

      // Atualizar contador de mensagens na sessão
      const { data: currentSession, error: sessionFetchError } = await supabase
        .from('chat_sessions')
        .select('message_count')
        .eq('id', sessionId)
        .single();

      if (!sessionFetchError && currentSession) {
        await supabase
          .from('chat_sessions')
          .update({
            message_count: (currentSession.message_count || 0) + 1,
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

    } catch (error: any) {
      secureLogger.error('Erro ao salvar mensagem', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
    }
  },

  /**
   * Busca looks no banco de dados baseado em critérios
   */
  async searchLooks(query: string, limit: number = 4): Promise<ChatLook[]> {
    try {
      // Limpar e preparar a query
      const cleanQuery = query.toLowerCase().trim();
      
      secureLogger.info('Iniciando busca de looks', {
        query: cleanQuery,
        limit
      }, {
        component: 'ChatService',
        maskFields: ['query']
      });

      // Buscar por título, descrição usando ilike (case-insensitive)
      const { data: looksData, error: looksError } = await supabase
        .from('looks')
        .select('id, title, image_url, description')
        .or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (looksError) {
        secureLogger.error('Erro ao buscar looks', {
          error: looksError.message
        }, {
          component: 'ChatService'
        });
        return [];
      }

      const looks = looksData?.map(look => ({
        id: look.id,
        title: look.title || 'Look sem título',
        image_url: look.image_url || '/placeholder.svg',
        description: look.description
      })) || [];

      secureLogger.info('Looks encontrados', {
        count: looks.length,
        query: cleanQuery
      }, {
        component: 'ChatService',
        maskFields: ['query']
      });

      return looks;

    } catch (error: any) {
      secureLogger.error('Erro na busca de looks', {
        error: error.message
      }, {
        component: 'ChatService'
      });
      return [];
    }
  },

  /**
   * Detecta se a mensagem do usuário tem intenção de buscar looks
   */
  detectLookSearchIntent(message: string): { hasIntent: boolean; searchTerms: string[] } {
    const lowerMessage = message.toLowerCase();
    
    // Palavras-chave que indicam busca por looks
    const lookKeywords = [
      'look', 'looks', 'outfit', 'roupa', 'roupas', 'vestido', 'vestidos',
      'calça', 'calças', 'blusa', 'blusas', 'saia', 'saias', 'casaco', 'casacos',
      'mostrar', 'buscar', 'procurar', 'encontrar', 'ver', 'quero ver',
      'festa', 'casamento', 'trabalho', 'casual', 'formal', 'praia',
      'verão', 'inverno', 'outono', 'primavera',
      'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'preto', 'branco',
      'jeans', 'social', 'esportivo', 'elegante', 'básico'
    ];

    const hasIntent = lookKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (!hasIntent) {
      return { hasIntent: false, searchTerms: [] };
    }

    // Extrair termos de busca (remover palavras de parada)
    const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'para', 'com', 'em', 'no', 'na'];
    const words = lowerMessage.split(/\s+/);
    const searchTerms = words.filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) &&
      !['buscar', 'mostrar', 'procurar', 'encontrar', 'ver', 'quero'].includes(word)
    );

    return { hasIntent: true, searchTerms };
  },

  /**
   * Envia uma mensagem para o webhook do N8N e retorna a resposta processada
   * 
   * @param message - Mensagem do usuário
   * @param userId - ID do usuário para controlar histórico da conversa
   * @returns Resposta do assistente
   */
  async sendMessage(message: string, userId?: string): Promise<ChatResponse> {
    const startTime = Date.now();
    let sessionId = '';
    
    try {
      // Verificar se o usuário está logado
      if (!userId) {
        return {
          response: 'É necessário fazer login para usar o chat da FinderAI.',
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      // Verificar limites do usuário
      const limitsCheck = await this.checkUserLimits(userId);
      if (!limitsCheck.canSend) {
        return {
          response: limitsCheck.message || 'Limite de mensagens atingido.',
          success: false,
          limitExceeded: true,
          remainingMessages: 0
        };
      }

      // Obter ou criar sessão
      sessionId = await this.getOrCreateSession(userId);

      // Salvar mensagem do usuário
      await this.saveMessage(sessionId, userId, message, true);

      // Detectar se o usuário quer buscar looks
      const lookIntent = this.detectLookSearchIntent(message);
      let foundLooks: ChatLook[] = [];
      
      if (lookIntent.hasIntent && lookIntent.searchTerms.length > 0) {
        // Buscar looks relevantes
        const searchQuery = lookIntent.searchTerms.join(' ');
        foundLooks = await this.searchLooks(searchQuery);
      }

      // Estrutura da mensagem de acordo com o formato do N8N que funciona
      const payload = {
        message,         // Mantemos para compatibilidade
        chatInput: message, // Campo que o AI Agent espera
        sessionId: sessionId,
        // Adicionar contexto se encontramos looks
        context: foundLooks.length > 0 ? {
          hasLooks: true,
          looksCount: foundLooks.length,
          searchTerms: lookIntent.searchTerms
        } : undefined
      };

      secureLogger.info('Enviando mensagem para FinderAI', {
        messageLength: message.length,
        userId: userId,
        hasLookIntent: lookIntent.hasIntent,
        looksFound: foundLooks.length,
        sessionId
      }, {
        component: 'ChatService',
        maskFields: ['message']
      });

      console.log('Enviando para webhook:', payload);
      
      // Configuração explícita de cabeçalhos
      const response = await fetchWithTimeout(
        WEBHOOK_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          timeoutMs: 30000,
        }
      );

      const responseBodyText = await response.text();
      console.log('Resposta do webhook:', responseBodyText);

      // Analisar a resposta - se for uma string, tentar parsear JSON
      let processedResponse: any = responseBodyText;
      
      if (typeof processedResponse === 'string') {
        try {
          // Tentar analisar como JSON se for uma string
          processedResponse = JSON.parse(processedResponse);
        } catch (e) {
          // Se não foi JSON, criar um objeto com a mensagem de texto
          processedResponse = { message: processedResponse };
        }
      }

      const responseTime = Date.now() - startTime;

      secureLogger.info('Resposta da IA recebida', {
        responseReceived: true,
        responseLength: (processedResponse.message || processedResponse.text || processedResponse.output || processedResponse.response || '').length,
        looksToShow: foundLooks.length,
        responseTime,
        sessionId
      }, {
        component: 'ChatService'
      });

      // Extrair a resposta em texto do formato retornado
      let responseText = processedResponse.message || 
                        processedResponse.text || 
                        processedResponse.output || 
                        processedResponse.response || 
                        'Desculpe, não consegui processar sua mensagem.';

      // Se encontramos looks, adicionar contexto à resposta
      if (foundLooks.length > 0) {
        responseText += `\n\nEncontrei ${foundLooks.length} look${foundLooks.length > 1 ? 's' : ''} que podem te interessar:`;
      }

      // Salvar resposta da IA
      await this.saveMessage(
        sessionId,
        userId,
        responseText,
        false,
        lookIntent.searchTerms,
        foundLooks.map(look => look.id),
        responseTime,
        'delivered'
      );

      // Atualizar contadores do usuário
      await this.updateMessageCounters(userId);

      const remainingMessages = limitsCheck.limits ? 
        (limitsCheck.limits.max_daily_messages - limitsCheck.limits.daily_message_count - 1) : undefined;

      return {
        response: responseText,
        success: true,
        looks: foundLooks,
        showLooks: foundLooks.length > 0,
        remainingMessages,
        ...processedResponse
      };
      
    } catch (error: any) {
      console.error('Erro ao comunicar com o webhook do FinderAI:', error);
      
      const responseTime = Date.now() - startTime;
      
      // Salvar erro se temos sessionId
      if (sessionId && userId) {
        await this.saveMessage(
          sessionId,
          userId,
          'Erro na resposta da IA',
          false,
          undefined,
          undefined,
          responseTime,
          'error',
          error.message
        );
      }
      
      secureLogger.error('Erro ao comunicar com IA', {
        errorMessage: error.message,
        errorType: error.name,
        userId,
        sessionId
      }, {
        component: 'ChatService',
        sensitive: true
      });

      // Resposta genérica de erro
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.',
        success: false,
        error: error?.message || 'Erro desconhecido na comunicação com o serviço',
      };
    }
  },

  /**
   * Obtém histórico de mensagens de uma sessão
   */
  async getSessionHistory(sessionId: string, userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error: any) {
      secureLogger.error('Erro ao buscar histórico', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
      return [];
    }
  },

  /**
   * Obtém sessões do usuário
   */
  async getUserSessions(userId: string, limit: number = 10): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error: any) {
      secureLogger.error('Erro ao buscar sessões', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
      return [];
    }
  },

  /**
   * Health check simplificado usando axios
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Fazer um ping simples
      const response = await fetchWithTimeout(
        WEBHOOK_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            message: 'ping',
            chatInput: 'ping',
            sessionId: `health_${Date.now()}`,
          }),
          timeoutMs: 10000,
        }
      );

      return response.ok;
    } catch (error: any) {
      secureLogger.error('Health check falhou', {
        errorMessage: error.message,
        errorType: error.name
      }, {
        component: 'ChatService'
      });
      return false;
    }
  },

  /**
   * Função de debug para testar diferentes formatos (baseada no seu exemplo)
   */
  async testFormats(message: string, userId?: string): Promise<{success: boolean, format: string, response?: any, error?: any}> {
    const sessionId = userId || `test_${Date.now()}`;
    
    // Diferentes formatos para testar com o webhook
    const formats = [
      {
        name: 'Formato FinderAI',
        payload: { message, chatInput: message, sessionId }
      },
      {
        name: 'Básico',
        payload: { message, sessionId }
      },
      {
        name: 'Só chatInput',
        payload: { chatInput: message, sessionId }
      },
      {
        name: 'Com timestamp',
        payload: { 
          message, 
          chatInput: message, 
          sessionId,
          timestamp: new Date().toISOString()
        }
      }
    ];

    for (const format of formats) {
      try {
        console.log(`Testando formato "${format.name}":`, format.payload);
        
        const response = await fetchWithTimeout(
          WEBHOOK_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(format.payload),
            timeoutMs: 30000,
          }
        );

        const body = await response.text();
        console.log(`Formato "${format.name}" bem-sucedido:`, body);

        return {
          success: true,
          format: format.name,
          response: body
        };
      } catch (error) {
        console.error(`Erro ao testar formato "${format.name}":`, error);
      }
    }

    return {
      success: false,
      format: 'Nenhum',
      error: 'Nenhum formato testado funcionou'
    };
  },

  /**
   * Obtém todas as sessões de chat do usuário
   */
  async getUserChatSessions(userId: string, limit: number = 20): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      secureLogger.info('Sessões de chat carregadas', {
        userId,
        sessionsCount: data?.length || 0
      }, {
        component: 'ChatService'
      });

      return data || [];

    } catch (error: any) {
      secureLogger.error('Erro ao buscar sessões do usuário', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
      return [];
    }
  },

  /**
   * Carrega o histórico completo de uma sessão específica
   */
  async loadSessionHistory(sessionId: string, userId: string): Promise<ChatHistoryMessage[]> {
    try {
      // Buscar mensagens da sessão
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Para cada mensagem que tem look_ids, buscar os dados dos looks
      const messagesWithLooks = await Promise.all(
        (messages || []).map(async (message) => {
          let looks: ChatLook[] = [];
          
          if (message.look_ids && message.look_ids.length > 0) {
            const { data: looksData, error: looksError } = await supabase
              .from('looks')
              .select('id, title, image_url, description')
              .in('id', message.look_ids);

            if (!looksError && looksData) {
              looks = looksData.map(look => ({
                id: look.id,
                title: look.title || 'Look sem título',
                image_url: look.image_url || '/placeholder.svg',
                description: look.description
              }));
            }
          }

          return {
            ...message,
            looks: looks.length > 0 ? looks : undefined
          };
        })
      );

      secureLogger.info('Histórico da sessão carregado', {
        sessionId,
        messagesCount: messagesWithLooks.length,
        userId
      }, {
        component: 'ChatService'
      });

      return messagesWithLooks;

    } catch (error: any) {
      secureLogger.error('Erro ao carregar histórico da sessão', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
      return [];
    }
  },

  /**
   * Atualiza o título de uma sessão
   */
  async updateSessionTitle(sessionId: string, userId: string, newTitle: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          session_title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      secureLogger.info('Título da sessão atualizado', {
        sessionId,
        newTitle,
        userId
      }, {
        component: 'ChatService',
        maskFields: ['newTitle']
      });

      return true;

    } catch (error: any) {
      secureLogger.error('Erro ao atualizar título da sessão', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
      return false;
    }
  },

  /**
   * Marca uma sessão como inativa
   */
  async deactivateSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;

    } catch (error: any) {
      secureLogger.error('Erro ao desativar sessão', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
      return false;
    }
  },

  /**
   * Exclui uma sessão e todas suas mensagens
   */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // As mensagens serão deletadas automaticamente devido ao CASCADE
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      secureLogger.info('Sessão deletada', {
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });

      return true;

    } catch (error: any) {
      secureLogger.error('Erro ao deletar sessão', {
        error: error.message,
        sessionId,
        userId
      }, {
        component: 'ChatService'
      });
      return false;
    }
  },

  /**
   * Cria uma nova sessão
   */
  async createNewSession(userId: string, title?: string): Promise<string> {
    try {
      // Primeiro, desativar a sessão atual se existir
      await supabase
        .from('chat_sessions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Criar nova sessão
      const sessionTitle = title || `Conversa ${new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_title: sessionTitle,
          started_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      secureLogger.info('Nova sessão criada', {
        sessionId: newSession.id,
        userId,
        title: sessionTitle
      }, {
        component: 'ChatService'
      });

      return newSession.id;

    } catch (error: any) {
      secureLogger.error('Erro ao criar nova sessão', {
        error: error.message,
        userId
      }, {
        component: 'ChatService'
      });
      // Retornar um ID temporário em caso de erro
      return `temp_${Date.now()}`;
    }
  },
};

export default chatService; 