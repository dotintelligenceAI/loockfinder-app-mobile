// Supabase client
export { supabase } from './supabase';

// Services
export { authService } from './authService';
export { categoriesService } from './categoriesService';
export { subcategoriesService } from './subcategoriesService';
export { userProfilesService } from './userProfilesService';
export { cuponsService } from './cuponsService';
export { favoritesService } from './favoritesService';

// Types
export type { CategoriesResponse, Category } from './categoriesService';
export type { CuponsResponse, CupomResponse, CupomWithStore, Cupom, Store } from './cuponsService';
export type { FavoritesResponse, FavoriteResponse, FavoriteWithLook, Favorite } from './favoritesService';
export * from './types/auth';
export type { AuthResponse, LoginCredentials, SignUpCredentials, User } from './types/auth';
