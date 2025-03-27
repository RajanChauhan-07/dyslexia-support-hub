
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: These values need to be replaced with your actual Supabase project details
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
