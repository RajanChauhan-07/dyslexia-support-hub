
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your project credentials
const supabaseUrl = 'https://zffrzrctjfzywbxpkbfg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZnJ6cmN0amZ6eXdieHBrYmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMDYyMDAsImV4cCI6MjA1ODY4MjIwMH0.1Qqbz2ESSgKy_6BeHi_Rb84aYYctiCFTqhgHYSUPsro';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to check if Supabase is properly configured (will always be true now)
export const isSupabaseConfigured = () => true;
