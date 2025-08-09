import { supabase } from './supabase';

export interface ShoppingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  category_id?: string | null;
  subcategoria_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ShoppingLink {
  id: string;
  shopping_category_id: string;
  store_id?: string | null;
  look_id?: string | null;
  item_id?: string | null;
  title?: string | null;
  url?: string | null;
  description?: string | null;
  price?: number | null;
  original_price?: number | null;
  currency?: string | null; // e.g., 'BRL', 'USD'
  is_url_valid?: boolean | null;
  priority?: number | null;
  status?: string | null; // e.g., 'active'
  click_count?: number | null;
  last_clicked_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
  image_url?: string | null; // opcional, caso exista na tabela
}

export interface ShoppingCategoriesResponse {
  success: boolean;
  data: ShoppingCategory[];
  error?: string;
  fromCache?: boolean;
}

export interface ShoppingLinksResponse {
  success: boolean;
  data: ShoppingLink[];
  error?: string;
  fromCache?: boolean;
}

class ShoppingLinksService {
  private categoriesCache: ShoppingCategory[] | null = null;
  private categoriesCacheTs: number = 0;
  private linksCache: { [categoryId: string]: { data: ShoppingLink[]; ts: number } } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private isFresh(ts: number): boolean {
    return Date.now() - ts < this.CACHE_DURATION;
  }

  async getCategories(): Promise<ShoppingCategoriesResponse> {
    try {
      if (this.categoriesCache && this.isFresh(this.categoriesCacheTs)) {
        return { success: true, data: this.categoriesCache, fromCache: true };
      }

      const { data, error } = await supabase
        .from('shopping_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        return { success: false, data: [], error: error.message };
      }

      const categories: ShoppingCategory[] = (data || []) as any;
      this.categoriesCache = categories;
      this.categoriesCacheTs = Date.now();
      return { success: true, data: categories, fromCache: false };
    } catch (e) {
      return { success: false, data: [], error: 'Erro ao carregar categorias' };
    }
  }

  async getLinksByCategory(categoryId?: string): Promise<ShoppingLinksResponse> {
    try {
      const cacheKey = categoryId || 'all';
      const cached = this.linksCache[cacheKey];
      if (cached && this.isFresh(cached.ts)) {
        return { success: true, data: cached.data, fromCache: true };
      }

      let query = supabase
        .from('shopping_links')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (categoryId && categoryId !== 'todos') {
        query = query.eq('shopping_category_id', categoryId);
      }

      // Filtros opcionais, se existirem essas colunas/valores
      // query = query.eq('status', 'active');

      const { data, error } = await query;
      if (error) {
        return { success: false, data: [], error: error.message };
      }

      const links: ShoppingLink[] = (data || []) as any;
      this.linksCache[cacheKey] = { data: links, ts: Date.now() };
      return { success: true, data: links, fromCache: false };
    } catch (e) {
      return { success: false, data: [], error: 'Erro ao carregar links' };
    }
  }
}

export const shoppingLinksService = new ShoppingLinksService();
export default shoppingLinksService;


