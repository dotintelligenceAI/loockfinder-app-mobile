import { supabase } from './supabase';

export interface Look {
  id: string;
  title: string;
  description: string;
  image_url: string;
  categories_id: string;
  created_at: string;
}

class LooksService {
  async getLooks(): Promise<Look[]> {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLooksByCategory(categoryId: string): Promise<Look[]> {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('categories_id', categoryId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getLooksBySubcategory(subcategoryId: string): Promise<Look[]> {
    const { data, error } = await supabase
      .from('looks')
      .select('*')
      .eq('subcategorias_id', subcategoryId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}

export const looksService = new LooksService();
export default looksService; 