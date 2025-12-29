
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ewgzwwumjimlrimiavld.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Z3p3d3VtamltbHJpbWlhdmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDM4NzEsImV4cCI6MjA4MjU3OTg3MX0.-k3mVwDvLrkSPwn7Vm5cvXEaPhFInYJP_de7tZuet94';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
