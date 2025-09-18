import { CreateAvisoData } from './avisosService';

export interface NotificationTemplate {
  tipo: string;
  titulo: string;
  descricao: string;
  aviso_tipo: CreateAvisoData['aviso_tipo'];
  delay?: number; // em milissegundos
}

export class NotificationTemplates {
  /**
   * Templates de notificações de boas-vindas
   */
  static getWelcomeTemplates(): NotificationTemplate[] {
    return [
      {
        tipo: 'welcome_immediate',
        titulo: 'Bem-vindo à LookFinder!',
        descricao: 'Descubra looks incríveis personalizados para você com IA. Toque para começar sua jornada de estilo!',
        aviso_tipo: 'welcome_tour',
        delay: 0 // Imediato
      },
      {
        tipo: 'welcome_features',
        titulo: 'Descubra todas as funcionalidades',
        descricao: 'Chat com IA, cupons de desconto, links de compra e muito mais te esperam!',
        aviso_tipo: 'new_feature',
        delay: 5 * 60 * 1000 // 5 minutos
      },
      {
        tipo: 'welcome_upgrade',
        titulo: 'Desbloqueie todo o potencial!',
        descricao: 'Faça upgrade para acesso ilimitado a looks, cupons exclusivos e links de compra premium.',
        aviso_tipo: 'promotion',
        delay: 30 * 60 * 1000 // 30 minutos
      }
    ];
  }

  /**
   * Templates de notificações de planos
   */
  static getPlanTemplates(): NotificationTemplate[] {
    return [
      {
        tipo: 'plan_activated',
        titulo: 'Assinatura ativada!',
        descricao: 'Parabéns! Sua assinatura premium está ativa. Agora você tem acesso completo a todas as funcionalidades do LookFinder!',
        aviso_tipo: 'promotion'
      },
      {
        tipo: 'plan_renewed',
        titulo: 'Assinatura renovada!',
        descricao: 'Sua assinatura foi renovada automaticamente. Continue aproveitando todos os recursos premium!',
        aviso_tipo: 'update'
      },
      {
        tipo: 'plan_canceled',
        titulo: 'Assinatura cancelada',
        descricao: 'Sua assinatura foi cancelada. Você ainda pode fazer upgrade a qualquer momento para acessar recursos premium!',
        aviso_tipo: 'update'
      },
      {
        tipo: 'plan_payment_failed',
        titulo: 'Problema com pagamento ⚠️',
        descricao: 'Não conseguimos processar seu pagamento. Verifique seus dados de pagamento para manter o acesso premium.',
        aviso_tipo: 'maintenance'
      },
      {
        tipo: 'plan_expiring_soon',
        titulo: 'Assinatura expirando em breve ⏰',
        descricao: 'Sua assinatura expira em 3 dias. Renove agora para não perder o acesso aos recursos premium!',
        aviso_tipo: 'promotion'
      }
    ];
  }

  /**
   * Templates de notificações de funcionalidades
   */
  static getFeatureTemplates(): NotificationTemplate[] {
    return [
      {
        tipo: 'feature_cupons',
        titulo: 'Cupons de desconto disponíveis!',
        descricao: 'Novos cupons exclusivos com até 70% de desconto nas suas lojas favoritas!',
        aviso_tipo: 'new_feature'
      },
      {
        tipo: 'feature_links',
        titulo: 'Links de compra atualizados!',
        descricao: 'Milhares de novos links com preços exclusivos e ofertas especiais foram adicionados!',
        aviso_tipo: 'new_feature'
      },
      {
        tipo: 'feature_ai_chat',
        titulo: 'Chat com IA melhorado!',
        descricao: 'Nossa IA ficou ainda mais inteligente! Faça perguntas sobre moda e receba sugestões personalizadas.',
        aviso_tipo: 'new_feature'
      },
      {
        tipo: 'feature_new_looks',
        titulo: 'Novos looks adicionados!',
        descricao: 'Centenas de novos looks foram adicionados à nossa coleção. Descubra seu próximo estilo favorito!',
        aviso_tipo: 'new_feature'
      }
    ];
  }

  /**
   * Templates de notificações promocionais
   */
  static getPromotionTemplates(): NotificationTemplate[] {
    return [
      {
        tipo: 'promo_weekend',
        titulo: 'Oferta de fim de semana!',
        descricao: 'Aproveite 50% de desconto no plano premium apenas neste fim de semana!',
        aviso_tipo: 'promotion'
      },
      {
        tipo: 'promo_black_friday',
        titulo: 'Black Friday LookFinder!',
        descricao: 'Maior desconto do ano! 70% OFF no plano anual. Oferta por tempo limitado!',
        aviso_tipo: 'promotion'
      },
      {
        tipo: 'promo_new_year',
        titulo: 'Ano novo, estilo novo!',
        descricao: 'Comece 2024 com estilo! Plano premium com desconto especial para renovar seu guarda-roupa.',
        aviso_tipo: 'promotion'
      }
    ];
  }

  /**
   * Obter template por tipo
   */
  static getTemplateByType(tipo: string): NotificationTemplate | null {
    const allTemplates = [
      ...this.getWelcomeTemplates(),
      ...this.getPlanTemplates(),
      ...this.getFeatureTemplates(),
      ...this.getPromotionTemplates()
    ];

    return allTemplates.find(template => template.tipo === tipo) || null;
  }

  /**
   * Criar notificação personalizada baseada em template
   */
  static createCustomNotification(
    template: NotificationTemplate,
    customData?: {
      titulo?: string;
      descricao?: string;
      variables?: Record<string, string>;
    }
  ): Omit<CreateAvisoData, 'user_id'> {
    let titulo = customData?.titulo || template.titulo;
    let descricao = customData?.descricao || template.descricao;

    // Substituir variáveis se fornecidas
    if (customData?.variables) {
      Object.entries(customData.variables).forEach(([key, value]) => {
        titulo = titulo.replace(`{${key}}`, value);
        descricao = descricao.replace(`{${key}}`, value);
      });
    }

    return {
      aviso_tipo: template.aviso_tipo,
      titulo,
      descricao,
      ativo: true
    };
  }
}

export const notificationTemplates = NotificationTemplates;
