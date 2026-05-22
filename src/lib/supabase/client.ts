"use client";

import { createBrowserClient } from "@supabase/ssr";

// Todas as queries da Infonte vão para o schema `infonte` no Supabase
// (isolado de outras apps que partilham a mesma instância).
export function criarClienteBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "infonte" },
    }
  );
}
