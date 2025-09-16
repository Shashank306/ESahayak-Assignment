import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name);
        console.log(`Getting cookie ${name}:`, cookie?.value ? 'present' : 'missing');
        return cookie?.value;
      },
      set(name: string, value: string, options: { [key: string]: unknown }) {
        console.log(`Setting cookie ${name}:`, value ? 'present' : 'missing');
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          console.error(`Error setting cookie ${name}:`, error);
        }
      },
      remove(name: string) {
        console.log(`Removing cookie ${name}`);
        try {
          cookieStore.delete(name);
        } catch (error) {
          console.error(`Error removing cookie ${name}:`, error);
        }
      },
    },
  });
};

// Admin client for server-side operations (only if service role key is available)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
