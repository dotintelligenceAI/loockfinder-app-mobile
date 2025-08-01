import { Gallery4Item } from '@/components/Gallery4';
import { supabase } from './supabase';

export interface Subcategory {
  id: string;
  title: string;
  type: string;
  image_url?: string;
  categoria_id: string;
}

class SubcategoriesService {
  /**
   * Busca subcategorias por categoria_id
   */
  async getSubcategoriesByCategory(categoryId: string): Promise<Gallery4Item[]> {
    const { data, error } = await supabase
      .from('subcategorias')
      .select('*')
      .eq('categoria_id', categoryId)
      .order('title', { ascending: true });

    if (error) {
      console.error('Erro ao buscar subcategorias:', error);
      return [];
    }

    return (data || []).map((subcat: Subcategory) => ({
      id: subcat.id,
      title: subcat.title,
      description: `Explore looks da subcategoria ${subcat.title}`,
      type: subcat.type,
      image_url: subcat.image_url,
    }));
  }
}

export const subcategoriesService = new SubcategoriesService(); 