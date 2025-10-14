
export interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
  type: 'consumable' | 'non_consumable' | 'auto_renewable_subscription';
}

export interface IAPSubscription {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
  introductoryPrice?: string;
  subscriptionPeriod?: string;
}

class IAPServiceMock {
  private isInitialized = false;
  private availableProducts: IAPProduct[] = [];

  // IDs dos produtos no App Store Connect
  private readonly PRODUCT_IDS = {
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

      console.log('🔄 Inicializando IAP Mock (Expo Go)...');
      
      // Simular inicialização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isInitialized = true;
      
      // Carregar produtos mock
      await this.loadProducts();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao inicializar IAP Mock:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Carrega produtos mock para desenvolvimento
   */
  async loadProducts(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🛍️ Carregando produtos IAP Mock...');

      // Produtos mock para desenvolvimento
      this.availableProducts = [
        {
          productId: this.PRODUCT_IDS.PREMIUM_MONTHLY,
          price: '2.99',
          currency: 'USD',
          title: 'Finder mensal',
          description: 'Assinatura mensal com todos os recursos premium',
          localizedPrice: '$2.99',
          type: 'auto_renewable_subscription',
        },
        {
          productId: this.PRODUCT_IDS.PREMIUM_SEMESTRAL,
          price: '14.99',
          currency: 'USD',
          title: 'Finder semestral',
          description: 'Assinatura semestral com todos os recursos premium',
          localizedPrice: '$14.99',
          type: 'auto_renewable_subscription',
        },
        {
          productId: this.PRODUCT_IDS.PREMIUM_ANNUAL,
          price: '19.99',
          currency: 'USD',
          title: 'Finder Anual',
          description: 'Assinatura anual com todos os recursos premium',
          localizedPrice: '$19.99',
          type: 'auto_renewable_subscription',
        },
      ];

      console.log('✅ Produtos Mock carregados:', {
        products: this.availableProducts.length,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao carregar produtos Mock:', error);
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
      product.productId === this.PRODUCT_IDS.PREMIUM_ANNUAL
    );
  }

  /**
   * Compra um produto (mock)
   */
  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string; purchase?: any }> {
    try {
      console.log('💳 Iniciando compra Mock do produto:', productId);

      // Simular delay de compra
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular compra bem-sucedida
      const mockPurchase = {
        productId,
        transactionId: `mock_${Date.now()}`,
        purchaseToken: `mock_token_${Date.now()}`,
        transactionDate: Date.now(),
      };

      console.log('✅ Compra Mock realizada:', mockPurchase);
      
      // Processar a compra
      const processResult = await this.processPurchase(mockPurchase);
      
      if (processResult.success) {
        return { success: true, purchase: mockPurchase };
      } else {
        return { success: false, error: processResult.error };
      }
    } catch (error) {
      console.error('❌ Erro na compra Mock:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro na compra' 
      };
    }
  }

  /**
   * Compra uma assinatura (alias para purchaseProduct)
   */
  async purchaseSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string; purchase?: any }> {
    return this.purchaseProduct(subscriptionId);
  }

  /**
   * Processa uma compra (mock)
   */
  private async processPurchase(purchase: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Processando compra Mock:', purchase);

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✅ Compra Mock processada com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao processar compra Mock:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar compra' 
      };
    }
  }

  /**
   * Restaura compras (mock)
   */
  async restorePurchases(): Promise<{ success: boolean; restoredPurchases?: any[]; error?: string }> {
    try {
      console.log('🔄 Restaurando compras Mock...');

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✅ Compras Mock restauradas');
      return { success: true, restoredPurchases: [] };
    } catch (error) {
      console.error('❌ Erro ao restaurar compras Mock:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao restaurar compras' 
      };
    }
  }

  /**
   * Finaliza a conexão IAP
   */
  async cleanup(): Promise<void> {
    try {
      this.isInitialized = false;
      console.log('✅ Conexão IAP Mock finalizada');
    } catch (error) {
      console.error('❌ Erro ao finalizar IAP Mock:', error);
    }
  }
}

export const iapService = new IAPServiceMock();
export default iapService;
