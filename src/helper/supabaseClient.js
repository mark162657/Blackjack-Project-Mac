import { createClient } from '@supabase/supabase-js';

// Configuration has been updated to use hardcoded strings instead of environment variables.
//
// 💡 IMPORTANT: Please replace the placeholder strings below with your actual
// Supabase Project URL and Public Anonymous Key. You can find these in your
// Supabase project settings under "API".

const SUPABASE_URL = "https://jklrvmntyasenloijzpy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbHJ2bW50eWFzZW5sb2lqenB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTU1NTEsImV4cCI6MjA3NTEzMTU1MX0._FurhGaZwkso4oaxoRBJU3GjNkyvp_xGh2KosmTLtbA"; // The 'public' anonymous key

// Create the Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
