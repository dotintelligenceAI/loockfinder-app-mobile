import { supabase } from './supabase';

export interface Favorite {
  user_id: string;
  look_id: string;
  created_at: string;
}

export interface FavoriteWithLook extends Favorite {
  look?: any; // Dados do look relacionado
}

export interface FavoritesResponse {
  success: boolean;
  data: FavoriteWithLook[];
  error?: string;
  fromCache?: boolean;
}

export interface FavoriteResponse {
  success: boolean;
  data: FavoriteWithLook | null;
  error?: string;
}

class FavoritesService {
  private favoritesCache: FavoriteWithLook[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Verifica se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    return this.favoritesCache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Busca todos os favoritos do usuário com dados do look
   */
  async getUserFavorites(userId: string): Promise<FavoritesResponse> {
    try {
      // Verificar cache primeiro
      if (this.isCacheValid() && this.favoritesCache) {
        return {
          success: true,
          data: this.favoritesCache,
          fromCache: true,
        };
      }

      console.log(`Buscando favoritos do usuário: ${userId}`);
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          look:looks(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar favoritos:', error);
        
        // Se temos cache, usar mesmo que expirado
        if (this.favoritesCache) {
          return {
            success: true,
            data: this.favoritesCache,
            fromCache: true,
            error: 'Dados do cache (erro na conexão)',
          };
        }
        
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao carregar favoritos',
        };
      }

      // Processar dados do Supabase
      const favorites = (data || []).map((favorite: any) => ({
        ...favorite,
        look: favorite.look,
      })) as FavoriteWithLook[];

      // Atualizar cache
      this.favoritesCache = favorites;
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        data: favorites,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar favoritos:', error);
      
      // Fallback para cache
      if (this.favoritesCache) {
        return {
          success: true,
          data: this.favoritesCache,
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
   * Verifica se um look está favoritado pelo usuário
   */
  async isLookFavorited(userId: string, lookId: string): Promise<boolean> {
    try {
      console.log(`Verificando se look ${lookId} está favoritado pelo usuário ${userId}`);
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('look_id', lookId);

      if (error) {
        console.error('Erro ao verificar favorito:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro interno ao verificar favorito:', error);
      return false;
    }
  }

  /**
   * Adiciona um look aos favoritos
   */
  async addToFavorites(userId: string, lookId: string): Promise<FavoriteResponse> {
    try {
      console.log(`Adicionando look ${lookId} aos favoritos do usuário ${userId}`);
      
      const insertData = {
        user_id: userId,
        look_id: lookId,
      };
      
      console.log('Dados para inserção:', insertData);
      
      const { data, error } = await supabase
        .from('favorites')
        .insert(insertData);

      if (error) {
        console.error('Erro ao adicionar favorito:', error);
        console.error('Detalhes do erro:', error.details);
        console.error('Código do erro:', error.code);
        return {
          success: false,
          data: null,
          error: error.message || 'Erro ao adicionar aos favoritos',
        };
      }

      console.log('Favorito adicionado com sucesso:', data);

      // Limpar cache para forçar atualização
      this.clearCache();

      return {
        success: true,
        data: null,
      };

    } catch (error) {
      console.error('Erro interno ao adicionar favorito:', error);
      return {
        success: false,
        data: null,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Remove um look dos favoritos
   */
  async removeFromFavorites(userId: string, lookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Removendo look ${lookId} dos favoritos do usuário ${userId}`);
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('look_id', lookId);

      if (error) {
        console.error('Erro ao remover favorito:', error);
        return {
          success: false,
          error: error.message || 'Erro ao remover dos favoritos',
        };
      }

      // Limpar cache para forçar atualização
      this.clearCache();

      return {
        success: true,
      };

    } catch (error) {
      console.error('Erro interno ao remover favorito:', error);
      return {
        success: false,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Toggle favorito (adiciona se não existe, remove se existe)
   */
  async toggleFavorite(userId: string, lookId: string): Promise<{ success: boolean; isFavorited: boolean; error?: string }> {
    try {
      const isFavorited = await this.isLookFavorited(userId, lookId);
      
      if (isFavorited) {
        const result = await this.removeFromFavorites(userId, lookId);
        return {
          success: result.success,
          isFavorited: false,
          error: result.error,
        };
      } else {
        const result = await this.addToFavorites(userId, lookId);
        return {
          success: result.success,
          isFavorited: true,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Erro interno ao toggle favorito:', error);
      return {
        success: false,
        isFavorited: false,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Conta quantos favoritos o usuário tem
   */
  async getFavoritesCount(userId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log(`Contando favoritos do usuário: ${userId}`);
      
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao contar favoritos:', error);
        return {
          success: false,
          count: 0,
          error: error.message || 'Erro ao contar favoritos',
        };
      }

      return {
        success: true,
        count: count || 0,
      };

    } catch (error) {
      console.error('Erro interno ao contar favoritos:', error);
      return {
        success: false,
        count: 0,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.favoritesCache = null;
    this.cacheTimestamp = 0;
    console.log('Cache de favoritos limpo');
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async refreshFavorites(userId: string): Promise<FavoritesResponse> {
    this.clearCache();
    return this.getUserFavorites(userId);
  }
}

export const favoritesService = new FavoritesService(); 