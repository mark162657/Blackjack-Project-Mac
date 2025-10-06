import { createClient } from '@supabase/supabase-js';

// Access the environment variables defined in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the Supabase client instance (NO JSX HERE)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);