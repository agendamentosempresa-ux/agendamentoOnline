// supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// Removemos VITE_ da chave Service Role, pois ela não é segura no Frontend, mas a SERVICE_ROLE_KEY está definida no seu .env
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
// Alteração aqui: SERVICE_ROLE_KEY é acessada com VITE_ prefix para ser exposta no frontend
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;

// CLIENTE PADRÃO: SEMPRE USA A ANON KEY POR SEGURANÇA NO FRONTEND
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não estão definidas.');
}
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY as string);

// CLIENTE ADMIN: Usa a SERVICE_ROLE_KEY. EXTREMAMENTE PERIGOSO NO FRONTEND EM PRODUÇÃO!
// Usaremos `import.meta.env.SUPABASE_SERVICE_ROLE_KEY` (conforme seu .env)
// E passamos a service role key.
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    }
  })
  : null;

if (!supabaseAdmin) {
  console.error("SERVICE_ROLE_KEY não configurada. As funções Admin (como criar usuário) NÃO funcionarão.");
}