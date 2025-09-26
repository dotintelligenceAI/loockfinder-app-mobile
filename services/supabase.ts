import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { supabaseConfig } from '../config/supabase';
import { isWeb } from '../utils/platform';

// Configurar storage condicionalmente
let storage: any = undefined;
if (!isWeb) {
  try {
    storage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.warn('AsyncStorage não disponível:', error);
  }
}

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    ...(storage && { storage }), // Só adiciona storage se estiver disponível
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

export { supabase };
export default supabase;