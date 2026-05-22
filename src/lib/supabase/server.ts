import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "infonte" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Em Server Components a escrita falha silenciosa,
            // o middleware refresca os cookies.
          }
        },
      },
    }
  );
}

export async function getUtilizadoraAtual() {
  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: utilizadora, error } = await supabase
      .from("utilizadoras")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (error) {
      console.warn("[getUtilizadoraAtual] erro a ler utilizadoras:", error.message);
      return null;
    }
    return utilizadora;
  } catch (e) {
    console.warn("[getUtilizadoraAtual] excecao:", e);
    return null;
  }
}
