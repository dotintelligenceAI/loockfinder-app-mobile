import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
});

export default supabase; 