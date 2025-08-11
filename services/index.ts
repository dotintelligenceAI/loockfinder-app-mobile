// Supabase client
export { supabase } from './supabase';

// Services
export { authService } from './authService';
export { categoriesService } from './categoriesService';
export { cuponsService } from './cuponsService';
export { favoritesService } from './favoritesService';
export { profilesService } from './profilesService';
export { shoppingLinksService } from './shoppingLinksService';
export { subcategoriesService } from './subcategoriesService';
export { subscriptionsService } from './subscriptionsService';
export { userProfilesService } from './userProfilesService';

// Types
export type { CategoriesResponse, Category } from './categoriesService';
export type { Cupom, CupomResponse, CupomWithStore, CuponsResponse, Store } from './cuponsService';
export type { Favorite, FavoriteResponse, FavoriteWithLook, FavoritesResponse } from './favoritesService';
export type { ProfileRow } from './profilesService';
export type { ShoppingCategoriesResponse, ShoppingCategory, ShoppingLink, ShoppingLinksResponse } from './shoppingLinksService';
export type { ProfileSubscriptionInfo, SubscriptionPlan, SubscriptionStatus } from './subscriptionsService';
export * from './types/auth';
export type { AuthResponse, LoginCredentials, SignUpCredentials, User } from './types/auth';

