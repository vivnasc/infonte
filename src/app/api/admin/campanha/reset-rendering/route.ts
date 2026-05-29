import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Reset de estado órfão: quando um workflow GH Actions falha antes de
// escrever result.json, os dias ficam presos em "rendering" para sempre.
// Este endpoint devolve-os a "rascunho" para a próxima corrida poder
// recomeçar limpa. Idempotente. Não toca em agendado/publicado.
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();

  const { data, error } = await sb
    .from("campanha_posts")
    .update({ estado: "rascunho" })
    .eq("estado", "rendering")
    .select("id");

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    repostos: data?.length ?? 0,
    mensagem: `${data?.length ?? 0} dias devolvidos a rascunho. Podes lançar render outra vez.`,
  });
}
