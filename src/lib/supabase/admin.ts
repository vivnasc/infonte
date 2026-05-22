import { createClient } from "@supabase/supabase-js";

// Cliente com service role, só para rotas de API. Nunca importar
// no cliente. Aponta por omissão ao schema infonte.
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "infonte" },
  });
}
