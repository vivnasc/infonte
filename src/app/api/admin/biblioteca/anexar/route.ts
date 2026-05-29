import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST { url: string, dia: number, slot?: "manha" | "tarde" }
// Anexa a URL a campanha_posts.imagens (no topo, se ainda não existir)
// e actualiza imagem_url para esta. Não toca em mais nada.
export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  let body: { url?: string; dia?: number; slot?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "body inválido" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  const dia = Number(body.dia);
  const slot = body.slot === "tarde" ? "tarde" : "manha";

  if (!url) return NextResponse.json({ erro: "url em falta" }, { status: 400 });
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }

  const sb = criarClienteAdmin();
  const { data: post, error } = await sb
    .from("campanha_posts")
    .select("id, imagens")
    .eq("dia", dia)
    .eq("slot", slot)
    .single();

  if (error || !post) {
    return NextResponse.json({ erro: "post não encontrado" }, { status: 404 });
  }

  const antigas = (post.imagens as string[] | null) ?? [];
  const filtradas = antigas.filter((u) => u !== url);
  const novas = [url, ...filtradas];

  const { error: upErr } = await sb
    .from("campanha_posts")
    .update({ imagens: novas, imagem_url: url })
    .eq("id", post.id);

  if (upErr) {
    return NextResponse.json({ erro: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, dia, slot, total: novas.length });
}
