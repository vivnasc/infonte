import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Apaga TODOS os posts da tarde. Usar quando se quer regenerar com o
// prompt novo e respeitar as regras de voz da Vivianne (sem que o
// gerar-tarde idempotente salte os existentes).
//
// NÃO toca em manhã (esses são o brief dela em markdown).
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data, error } = await sb
    .from("campanha_posts")
    .delete()
    .eq("slot", "tarde")
    .select("id");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    apagados: data?.length ?? 0,
  });
}
