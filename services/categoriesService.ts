import { Gallery4Item } from '@/components/Gallery4';
import { supabase } from './supabase';

export interface Category {
  id: string;
  title: string;
  type: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Gallery4Item[];
  error?: string;
  fromCache?: boolean;
}

class CategoriesService {
  private categoriesCache: Gallery4Item[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Verifica se o cache ainda é válido
   */
  private isCacheValid(): boolean {
    return this.categoriesCache !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Mapeia categoria do Supabase para Gallery4Item
   */
  private mapCategoryToGalleryItem(category: Category): Gallery4Item {
    return {
      id: category.id,
      title: category.title,
      description: `Explore looks da categoria ${category.title}`,
      type: category.type,
      image_url: category.image_url,
    };
  }

  /**
   * Busca todas as categorias do Supabase com cache
   */
  async getCategories(): Promise<CategoriesResponse> {
    try {
      // Verificar cache primeiro
      if (this.isCacheValid() && this.categoriesCache) {
        return {
          success: true,
          data: this.categoriesCache,
          fromCache: true,
        };
      }

      console.log('Buscando categorias do Supabase...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias:', error);
        
        // Se temos cache, usar mesmo que expirado
        if (this.categoriesCache) {
          return {
            success: true,
            data: this.categoriesCache,
            fromCache: true,
            error: 'Dados do cache (erro na conexão)',
          };
        }
        
        // Fallback para categorias padrão
        const defaultCategories = this.getDefaultCategories();
        return {
          success: false,
          data: defaultCategories,
          error: error.message || 'Erro ao carregar categorias',
        };
      }

      // Processar dados do Supabase
      const categories = (data || []).map((category: Category) => 
        this.mapCategoryToGalleryItem(category)
      );

      // Validar se temos categorias
      if (categories.length === 0) {
        console.warn('Nenhuma categoria encontrada no banco');
        const defaultCategories = this.getDefaultCategories();
        return {
          success: true,
          data: defaultCategories,
          error: 'Nenhuma categoria encontrada no banco',
        };
      }

      // Atualizar cache
      this.categoriesCache = categories;
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        data: categories,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar categorias:', error);
      
      // Fallback para cache ou categorias padrão
      if (this.categoriesCache) {
        return {
          success: true,
          data: this.categoriesCache,
          fromCache: true,
          error: 'Erro de conexão, usando cache',
        };
      }

      const defaultCategories = this.getDefaultCategories();
      return {
        success: false,
        data: defaultCategories,
        error: 'Erro de conexão, usando categorias padrão',
      };
    }
  }

  /**
   * Busca categorias por tipo específico
   */
  async getCategoriesByType(type: string): Promise<CategoriesResponse> {
    try {
      console.log(`Buscando categorias do tipo: ${type}`);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', type)
        .order('title', { ascending: true });

      if (error) {
        console.error('Erro ao buscar categorias por tipo:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao buscar categorias por tipo',
        };
      }

      const categories = (data || []).map((category: Category) => 
        this.mapCategoryToGalleryItem(category)
      );

      return {
        success: true,
        data: categories,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao buscar categorias por tipo:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Busca categoria por ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      console.log(`Buscando categoria ID: ${id}`);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar categoria por ID:', error);
        return null;
      }

      return data as Category;

    } catch (error) {
      console.error('Erro interno ao buscar categoria por ID:', error);
      return null;
    }
  }

  /**
   * Busca categorias por termo de pesquisa
   */
  async searchCategories(searchTerm: string): Promise<CategoriesResponse> {
    try {
      console.log(`Pesquisando categorias: ${searchTerm}`);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`)
        .order('title', { ascending: true });

      if (error) {
        console.error('Erro ao pesquisar categorias:', error);
        return {
          success: false,
          data: [],
          error: error.message || 'Erro ao pesquisar categorias',
        };
      }

      const categories = (data || []).map((category: Category) => 
        this.mapCategoryToGalleryItem(category)
      );

      return {
        success: true,
        data: categories,
        fromCache: false,
      };

    } catch (error) {
      console.error('Erro interno ao pesquisar categorias:', error);
      return {
        success: false,
        data: [],
        error: 'Erro de conexão na pesquisa',
      };
    }
  }

  /**
   * Obtém tipos únicos de categorias
   */
  async getCategoryTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('type')
        .not('type', 'is', null);

      if (error) {
        console.error('Erro ao buscar tipos de categorias:', error);
        return [];
      }

      // Extrair tipos únicos
      const types = [...new Set((data || []).map(item => item.type))];
      return types.sort();

    } catch (error) {
      console.error('Erro interno ao buscar tipos:', error);
      return [];
    }
  }

  /**
   * Limpa o cache de categorias
   */
  clearCache(): void {
    this.categoriesCache = null;
    this.cacheTimestamp = 0;
    console.log('Cache de categorias limpo');
  }

  /**
   * Força atualização das categorias (ignora cache)
   */
  async refreshCategories(): Promise<CategoriesResponse> {
    this.clearCache();
    return this.getCategories();
  }

  /**
   * Categorias padrão caso não consiga buscar do Supabase
   */
  private getDefaultCategories(): Gallery4Item[] {
    return [
      {
        id: 'acessorios',
        title: 'Acessórios',
        description: 'Explore looks com acessórios incríveis',
        type: 'acessorios',
        image_url: 'https://images.unsplash.com/photo-1506629905607-d9c8e8b8e8e8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
      {
        id: 'ocasiao_uso',
        title: 'Ocasião de Uso',
        description: 'Looks para diferentes ocasiões',
        type: 'ocasiao_uso',
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
      {
        id: 'cores',
        title: 'Cores',
        description: 'Descubra looks por cores',
        type: 'cores',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
      {
        id: 'estampas_materiais',
        title: 'Estampas e Materiais',
        description: 'Explore diferentes texturas e estampas',
        type: 'estampas_materiais',
        image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
      {
        id: 'partes',
        title: 'Partes',
        description: 'Looks organizados por peças',
        type: 'partes',
        image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
      {
        id: 'tendencias',
        title: 'Tendências',
        description: 'As últimas tendências da moda',
        type: 'tendencias',
        image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
    ];
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService; 