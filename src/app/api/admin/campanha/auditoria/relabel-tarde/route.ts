import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Renomeia o tema dos posts da tarde para que não pareça duplicação do
// manhã. Antes era "${temaManha} (emocional)" — visualmente igual.
// Passa a "Eco · ${temaManha}" — distinto à vista.
// Idempotente.
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("id, tema")
    .eq("slot", "tarde");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  let atualizados = 0;
  const log: string[] = [];

  for (const p of posts ?? []) {
    const t = (p.tema as string) ?? "";
    let novo = t;
    // Casos a normalizar:
    //   "ALGO (emocional)" -> "Eco · ALGO"
    //   "Eco · ALGO" -> mantém
    //   "ALGO" sem sufixo -> "Eco · ALGO"
    if (t.startsWith("Eco · ")) continue;
    const m = t.match(/^(.+?)\s*\(emocional\)\s*$/i);
    if (m) {
      novo = `Eco · ${m[1].trim()}`;
    } else if (t) {
      novo = `Eco · ${t.trim()}`;
    } else {
      continue;
    }
    const { error: e } = await sb
      .from("campanha_posts")
      .update({ tema: novo })
      .eq("id", p.id);
    if (e) {
      log.push(`${t} → erro ${e.message}`);
    } else {
      atualizados++;
      log.push(`${t} → ${novo}`);
    }
  }

  return NextResponse.json({ ok: true, atualizados, log });
}
