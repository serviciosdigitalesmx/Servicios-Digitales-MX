import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Get all cookies starting with 'sb-' (standard Supabase prefix)
  const authCookie = cookieStore.getAll().find(c => c.name.startsWith('sb-'))?.value;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist on server
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: authCookie ? { Authorization: `Bearer ${JSON.parse(authCookie).access_token}` } : {},
    }
  });
}
