
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if valid credentials are provided
const isValidUrl = supabaseUrl !== 'https://example.supabase.co' && supabaseUrl.startsWith('https://');
const isValidKey = supabaseAnonKey !== 'your-anon-key' && supabaseAnonKey.length > 10;

if (!isValidUrl || !isValidKey) {
  console.warn(
    'Invalid Supabase credentials. Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Authentication features will not work properly.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => isValidUrl && isValidKey;
