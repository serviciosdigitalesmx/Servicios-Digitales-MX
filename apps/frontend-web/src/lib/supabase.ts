import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Manual cookie-based storage for SSR compatibility
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${key}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    // Set cookie with 1 year expiry and secure flags
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax; Secure`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: cookieStorage, // Use our manual cookie storage
  }
});
