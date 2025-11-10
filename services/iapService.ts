import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Product,
  Purchase,
  requestPurchase,
} from 'react-native-iap';
import { iapConfig } from '../config/supabase';
import { supabase } from './supabase';

export interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
  type: 'consumable' | 'non_consumable' | 'auto_renewable_subscription';
}

class IAPService {
  private isInitialized = false;
  private availableProducts: IAPProduct[] = [];

  // IDs dos produtos no App Store Connect
  private readonly PRODUCT_IDS = {
    // Assinaturas automáticas
    PREMIUM_MONTHLY: 'com.lookfinder.premium.monthly',
    PREMIUM_SEMESTRAL: 'com.lookfinder.premium.semest',
    PREMIUM_ANNUAL: 'com.lookfinder.premium.annual',
  };

  /**
   * Inicializa a conexão com a App Store/Google Play
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      console.log('🔄 Inicializando IAP...');
      
      const result = await initConnection();
      console.log('✅ Conexão IAP inicializada:', result);
      
      this.isInitialized = true;
      
      // Carregar produtos disponíveis
      await this.loadProducts();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao inicializar IAP:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Carrega produtos disponíveis
   */
  async loadProducts(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🛍️ Carregando produtos IAP...');

      // Carregar todos os produtos (assinaturas)
      const products = await fetchProducts({
        skus: [
          this.PRODUCT_IDS.PREMIUM_MONTHLY,
          this.PRODUCT_IDS.PREMIUM_SEMESTRAL,
          this.PRODUCT_IDS.PREMIUM_ANNUAL,
        ],
      });

      this.availableProducts = products?.map(this.mapProductToIAP) || [];

      console.log('✅ Produtos carregados:', {
        products: this.availableProducts.length,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar produtos' 
      };
    }
  }

  /**
   * Obtém produtos disponíveis
   */
  getAvailableProducts(): IAPProduct[] {
    return this.availableProducts;
  }

  /**
   * Obtém assinaturas disponíveis (filtra produtos de assinatura)
   */
  getAvailableSubscriptions(): IAPProduct[] {
    return this.availableProducts.filter(product => 
      product.productId === this.PRODUCT_IDS.PREMIUM_MONTHLY ||
      product.productId === this.PRODUCT_IDS.PREMIUM_SEMESTRAL ||
      product.productId === this.PRODUCT_IDS.PREMIUM_ANNUAL
    );
  }

  /**
   * Compra um produto
   */
  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string; purchase?: Purchase }> {
    try {
      console.log('💳 Iniciando compra do produto:', productId);

      const purchase = await requestPurchase({ sku: productId } as any);
      
      if (purchase) {
        console.log('✅ Compra realizada:', purchase);
        
        // Processar a compra (purchase pode ser array ou objeto único)
        const purchases = Array.isArray(purchase) ? purchase : [purchase];
        const firstPurchase = purchases[0];
        
        if (firstPurchase) {
          const processResult = await this.processPurchase(firstPurchase);
          
          if (processResult.success) {
            // Finalizar transação
            await finishTransaction({ purchase: firstPurchase, isConsumable: false });
            return { success: true, purchase: firstPurchase };
          } else {
            return { success: false, error: processResult.error };
          }
        }
      }

      return { success: false, error: 'Compra cancelada pelo usuário' };
    } catch (error) {
      console.error('❌ Erro na compra:', error);
      
      if (error instanceof Error && error.message.includes('User canceled')) {
        return { success: false, error: 'Compra cancelada pelo usuário' };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na compra' 
      };
    }
  }

  /**
   * Compra uma assinatura (alias para purchaseProduct)
   */
  async purchaseSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string; purchase?: Purchase }> {
    return this.purchaseProduct(subscriptionId);
  }

  /**
   * Valida receipt com a Apple (Production e Sandbox)
   * Retorna informações completas da assinatura
   */
  private async validateReceipt(receiptData: string): Promise<{ 
    success: boolean; 
    error?: string;
    expiresDate?: string;
    isActive?: boolean;
  }> {
    try {
      console.log('🔐 Validando receipt com Apple...');

      // IMPORTANTE: A Apple recomenda tentar produção primeiro, depois sandbox
      const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
      const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';

      // 1. Tentar validar no ambiente de produção primeiro
      console.log('🔄 Tentando validação em produção...');
      let response = await fetch(productionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          'password': iapConfig.appleSharedSecret || '', // Shared Secret para assinaturas
          'exclude-old-transactions': true
        })
      });

      let result = await response.json();

      // 2. Se recebeu erro 21007 (sandbox receipt usado em produção)
      // Validar no ambiente sandbox
      if (result.status === 21007) {
        console.log('🔄 Receipt de sandbox detectado, validando em sandbox...');
        response = await fetch(sandboxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'receipt-data': receiptData,
            'password': iapConfig.appleSharedSecret || '', // Shared Secret para assinaturas
            'exclude-old-transactions': true
          })
        });

        result = await response.json();
      }

      // 3. Verificar status da validação
      if (result.status === 0) {
        console.log('✅ Receipt validado com sucesso');
        
        // CRÍTICO: Extrair informações da assinatura retornadas pela Apple
        const latestReceiptInfo = result.latest_receipt_info?.[0];
        const pendingRenewalInfo = result.pending_renewal_info?.[0];
        
        if (latestReceiptInfo) {
          // Obter data de expiração real da Apple
          const expiresDate = new Date(parseInt(latestReceiptInfo.expires_date_ms));
          const isActive = expiresDate > new Date();
          
          console.log('📅 Assinatura expira em:', expiresDate);
          console.log('✅ Assinatura ativa:', isActive);
          console.log('🔄 Auto-renew status:', pendingRenewalInfo?.auto_renew_status_change_date);
          
          return { 
            success: true,
            expiresDate: expiresDate.toISOString(),
            isActive
          };
        }
        
        // Se não tem informações de assinatura, considerar inativo
        console.warn('⚠️ Receipt validado mas sem informações de assinatura');
        return { success: true, isActive: false };
      } else {
        console.error('❌ Falha na validação do receipt:', result.status);
        return { 
          success: false, 
          error: `Validation failed with status: ${result.status}` 
        };
      }
    } catch (error) {
      console.error('❌ Erro na validação de receipt:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao validar receipt' 
      };
    }
  }

  /**
   * Processa uma compra
   * Valida o receipt com a Apple e usa dados reais de expiração
   */
  private async processPurchase(purchase: Purchase): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processando compra:', purchase);

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // CRÍTICO: Obter e validar receipt com a Apple
      const receiptData = (purchase as any).transactionReceipt || (purchase as any).purchaseToken;
      
      if (!receiptData) {
        console.error('❌ Receipt não encontrado na compra');
        return { 
          success: false, 
          error: 'Receipt não encontrado. Por favor, tente novamente.' 
        };
      }

      console.log('🔐 Validando receipt antes de processar...');
      const validationResult = await this.validateReceipt(receiptData);
      
      if (!validationResult.success) {
        console.error('❌ Receipt inválido:', validationResult.error);
        return { 
          success: false, 
          error: 'Falha na validação do recibo. Por favor, tente novamente.' 
        };
      }

      // IMPORTANTE: Verificar se a assinatura está ativa
      if (!validationResult.isActive) {
        console.error('❌ Assinatura inativa ou expirada');
        return {
          success: false,
          error: 'Assinatura expirada ou inativa. Por favor, tente novamente.'
        };
      }

      console.log('✅ Receipt validado com sucesso - Assinatura ativa');

      // Mapear produto IAP para plano do sistema
      const planMapping = this.getPlanMapping(purchase.productId);
      if (!planMapping) {
        return { success: false, error: 'Produto não reconhecido' };
      }

      // CRÍTICO: Usar a data de expiração REAL retornada pela Apple
      const expirationDate = validationResult.expiresDate || 
                            this.calculateExpirationDate(planMapping.billingPeriod);

      console.log('📅 Data de expiração definida:', expirationDate);

      // Atualizar perfil do usuário com dados validados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          current_plan_id: planMapping.planId,
          subscription_expires_at: expirationDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        return { success: false, error: 'Erro ao ativar plano' };
      }

      // Registrar compra COM os dados do receipt
      await this.recordPurchase(user.id, purchase, planMapping, receiptData);

      console.log('✅ Compra processada com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao processar compra:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar compra' 
      };
    }
  }

  /**
   * Verifica compras pendentes e restaura compras
   */
  async restorePurchases(): Promise<{ success: boolean; restoredPurchases?: Purchase[]; error?: string }> {
    try {
      console.log('🔄 Restaurando compras...');

      const purchases = await getAvailablePurchases();
      
      if (purchases && purchases.length > 0) {
        console.log('✅ Compras encontradas para restaurar:', purchases.length);
        
        // Processar cada compra restaurada
        for (const purchase of purchases) {
          await this.processPurchase(purchase);
          await finishTransaction({ purchase, isConsumable: false });
        }
        
        return { success: true, restoredPurchases: purchases };
      }

      return { success: true, restoredPurchases: [] };
    } catch (error) {
      console.error('❌ Erro ao restaurar compras:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao restaurar compras' 
      };
    }
  }

  /**
   * Mapeia produto IAP para plano do sistema
   */
  private getPlanMapping(productId: string): { planId: string; billingPeriod: string; isLifetime: boolean } | null {
    const mappings: Record<string, { planId: string; billingPeriod: string; isLifetime: boolean }> = {
      [this.PRODUCT_IDS.PREMIUM_MONTHLY]: { 
        planId: 'monthly', 
        billingPeriod: 'monthly', 
        isLifetime: false 
      },
      [this.PRODUCT_IDS.PREMIUM_SEMESTRAL]: { 
        planId: 'semestral', 
        billingPeriod: 'semestral', 
        isLifetime: false 
      },
      [this.PRODUCT_IDS.PREMIUM_ANNUAL]: { 
        planId: 'annual', 
        billingPeriod: 'annual', 
        isLifetime: false 
      },
    };

    return mappings[productId] || null;
  }

  /**
   * Calcula data de expiração baseada no período
   */
  private calculateExpirationDate(billingPeriod: string): string {
    const now = new Date();
    
    switch (billingPeriod) {
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'semestral':
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 meses
      case 'annual':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Registra a compra no banco de dados com receipt para validação futura
   */
  private async recordPurchase(
    userId: string, 
    purchase: Purchase, 
    planMapping: any,
    receiptData: string
  ): Promise<void> {
    try {
      await supabase.from('iap_purchases').insert({
        user_id: userId,
        product_id: purchase.productId,
        transaction_id: purchase.transactionId,
        purchase_token: purchase.purchaseToken,
        receipt_data: receiptData, // CRÍTICO: Salvar receipt para validações futuras
        original_transaction_id: (purchase as any).originalTransactionIdIOS || purchase.transactionId,
        plan_id: planMapping.planId,
        purchase_date: new Date(purchase.transactionDate).toISOString(),
        is_restored: false,
        status: 'completed'
      });
      console.log('✅ Compra registrada no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao registrar compra:', error);
      // Não falhar a compra se o registro falhar
    }
  }

  /**
   * Mapeia produto para interface IAP
   */
  private mapProductToIAP(product: Product): IAPProduct {
    return {
      productId: (product as any).productId || '',
      price: product.price?.toString() || '0',
      currency: product.currency || 'USD',
      title: product.title || '',
      description: product.description || '',
      localizedPrice: (product as any).localizedPrice || product.price?.toString() || '0',
      type: 'non_consumable',
    };
  }

  /**
   * Verifica o status atual de uma assinatura validando com a Apple
   * Útil para verificar se a assinatura ainda está ativa
   */
  async checkSubscriptionStatus(userId: string): Promise<{ 
    isActive: boolean; 
    expiresAt?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Verificando status da assinatura para usuário:', userId);

      // Buscar última compra do usuário no banco
      const { data: purchase, error: fetchError } = await supabase
        .from('iap_purchases')
        .select('receipt_data, product_id, purchase_date')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('purchase_date', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !purchase?.receipt_data) {
        console.warn('⚠️ Nenhuma compra encontrada para o usuário');
        return { isActive: false };
      }

      // Validar receipt atualizado com a Apple
      console.log('🔐 Validando receipt atualizado com Apple...');
      const validationResult = await this.validateReceipt(purchase.receipt_data);
      
      if (!validationResult.success) {
        console.error('❌ Erro ao validar receipt:', validationResult.error);
        return { 
          isActive: false,
          error: validationResult.error
        };
      }

      console.log('✅ Status da assinatura verificado:', {
        isActive: validationResult.isActive,
        expiresAt: validationResult.expiresDate
      });

      // Se o status mudou, atualizar o perfil
      if (validationResult.isActive !== undefined) {
        const newStatus = validationResult.isActive ? 'active' : 'canceled';
        await supabase
          .from('profiles')
          .update({
            subscription_status: newStatus,
            subscription_expires_at: validationResult.expiresDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        
        console.log(`✅ Status do perfil atualizado para: ${newStatus}`);
      }

      return {
        isActive: validationResult.isActive || false,
        expiresAt: validationResult.expiresDate
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status da assinatura:', error);
      return { 
        isActive: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar status'
      };
    }
  }

  /**
   * Finaliza a conexão IAP
   */
  async cleanup(): Promise<void> {
    try {
      await endConnection();
      this.isInitialized = false;
      console.log('✅ Conexão IAP finalizada');
    } catch (error) {
      console.error('❌ Erro ao finalizar IAP:', error);
    }
  }
}

export const iapService = new IAPService();
export default iapService;