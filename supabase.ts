
import { createClient } from '@supabase/supabase-js';

// Prioritize environment variables for Vercel hosting, fallback to original keys
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ewgzwwumjimlrimiavld.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z3p3d3VtamltbHJpbWlhdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDM4NzEsImV4cCI6MjA4MjU3OTg3MX0.-k3mVwDvLrkSPwn7Vm5cvXEaPhFInYJP_de7tZuet94';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
