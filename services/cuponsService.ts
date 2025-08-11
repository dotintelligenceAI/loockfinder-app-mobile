import { supabase } from './supabase';

export interface Store {
  id: string;
  name: string; // Campo obrigatório na tabela
  logo_url?: string;
  website_url?: string;
  category: string; // Campo obrigatório na tabela
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cupom {
  id: string;
  title: string;
  code: string;
  discount: number;
  description?: string;
  store_id: string;
  expiry_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  store?: Store; // Relacionamento com a loja
}

export interface CupomWithStore extends Cupom {
  store: Store;
}

export interface CuponsResponse {
  success: boolean;
  data: CupomWithStore[];
  error?: string;
  fromCache?: boolean;
}

export interface CupomResponse {
  success: boolean;
  data: CupomWithStore | null;
  error?: string;
}

class CuponsService {
  private cuponsCache: CupomWithStore[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  /**
   * Verifica se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    return this.cuponsCache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Busca todos os cupons ativos com dados da loja
   */
  async getCupons(): Promise<CuponsResponse> {
    try {
      // Verificar cache primeiro
      if (this.isCacheValid() && this.cuponsCache) {
        return {
          success: true,
          data: this.cuponsCache,
          fromCache: true,
        };
      }

      console.log('Buscando cupons do Supabase...');
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          store:stores(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cupons:', error);
        
        // Se temos cache, usar mesmo que expirado
        if (this.cuponsCache) {
          return {
            success: true,
            data: this.cuponsCache,
            fromCache: true,
            error: 'Dados do cache (erro na conexão)',
          };
        }
        
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao carregar cupons',
        };
      }

      // Processar dados do Supabase
      const cupons = (data || []).map((cupom: any) => ({
        ...cupom,
        store: cupom.store,
      })) as CupomWithStore[];

      // Validar se temos cupons
      if (cupons.length === 0) {
        console.warn('Nenhum cupom ativo encontrado');
        return {
          success: true,
          data: [],
          error: 'Nenhum cupom ativo encontrado',
        };
      }

      // Atualizar cache
      this.cuponsCache = cupons;
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        data: cupons,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar cupons:', error);
      
      // Fallback para cache
      if (this.cuponsCache) {
        return {
          success: true,
          data: this.cuponsCache,
          fromCache: true,
          error: 'Erro de conexão, usando cache',
        };
      }

      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca cupons por loja
   */
  async getCuponsByStore(storeId: string): Promise<CuponsResponse> {
    try {
      console.log(`Buscando cupons da loja ID: ${storeId}`);
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cupons por loja:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao buscar cupons por loja',
        };
      }

      const cupons = (data || []).map((cupom: any) => ({
        ...cupom,
        store: cupom.store,
      })) as CupomWithStore[];

      return {
        success: true,
        data: cupons,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar cupons por loja:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca cupom por ID
   */
  async getCupomById(id: string): Promise<CupomResponse> {
    try {
      console.log(`Buscando cupom ID: ${id}`);
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar cupom por ID:', error);
        return {
          success: false,
          data: null,
          error: error.message || 'Cupom não encontrado',
        };
      }

      const cupom = {
        ...data,
        store: data.store,
      } as CupomWithStore;

      return {
        success: true,
        data: cupom,
      };

    } catch (error) {
      console.error('Erro interno ao buscar cupom por ID:', error);
      return {
        success: false,
        data: null,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca cupons por categoria de loja
   */
  async getCuponsByCategory(category: string): Promise<CuponsResponse> {
    try {
      console.log(`Buscando cupons da categoria: ${category}`);
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          store:stores(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cupons por categoria:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao buscar cupons por categoria',
        };
      }

      // Filtrar por categoria da loja
      const cupons = (data || [])
        .filter((cupom: any) => cupom.store?.category === category)
        .map((cupom: any) => ({
          ...cupom,
          store: cupom.store,
        })) as CupomWithStore[];

      return {
        success: true,
        data: cupons,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar cupons por categoria:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca cupons por termo de busca (título, descrição ou nome da loja)
   */
  async searchCupons(searchTerm: string): Promise<CuponsResponse> {
    try {
      console.log(`Buscando cupons com termo: ${searchTerm}`);
      
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          store:stores(*)
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,store.name.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cupons:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao buscar cupons',
        };
      }

      const cupons = (data || []).map((cupom: any) => ({
        ...cupom,
        store: cupom.store,
      })) as CupomWithStore[];

      return {
        success: true,
        data: cupons,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar cupons:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca todas as lojas ativas
   */
  async getStores(): Promise<{ success: boolean; data: Store[]; error?: string }> {
    try {
      console.log('Buscando lojas do Supabase...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar lojas:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao carregar lojas',
        };
      }

      return {
        success: true,
        data: data || [],
      };

    } catch (error) {
      console.error('Erro interno ao buscar lojas:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cuponsCache = null;
    this.cacheTimestamp = 0;
    console.log('Cache de cupons limpo');
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async refreshCupons(): Promise<CuponsResponse> {
    this.clearCache();
    return this.getCupons();
  }
}

export const cuponsService = new CuponsService(); 