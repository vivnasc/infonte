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

    // Tenta ler a linha existente
    const { data: utilizadora, error } = await supabase
      .from("utilizadoras")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[getUtilizadoraAtual] erro a ler utilizadoras:", error.message);
      return null;
    }

    // Se existe, devolve
    if (utilizadora) return utilizadora;

    // Lazy: primeira visita à Infonte, cria a linha
    const { data: nova, error: errInsert } = await supabase
      .from("utilizadoras")
      .insert({
        auth_id: user.id,
        email: user.email!,
        nome: user.user_metadata?.nome ?? user.user_metadata?.name ?? null,
      })
      .select("*")
      .single();

    if (errInsert) {
      const { data: retry } = await supabase
        .from("utilizadoras")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();
      return retry ?? null;
    }

    // Email de boas-vindas (não bloqueia)
    try {
      const { enviarEmailBoasVindas } = await import("@/lib/emails");
      await enviarEmailBoasVindas({ email: user.email!, nome: nova.nome });
    } catch (e) {
      console.warn("[boas-vindas] email falhou:", e);
    }

    return nova;
  } catch (e) {
    console.warn("[getUtilizadoraAtual] excecao:", e);
    return null;
  }
}
