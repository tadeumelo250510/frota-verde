import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente ou valores fornecidos para fallback garantido
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://xtouxruuuprevzryyfqf.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0b3V4cnV1dXByZXZ6cnl5ZnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNzgxNTAsImV4cCI6MjEwNDg1NDE1MH0.nTN7WeTltsvGToSplcrYhwIiMcz7noahCC4u1zlFOuo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
