import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/campanha/render-submit/estimativa?dias=all&slot=manha
//   → { dias_total, tempo_min, custo }
//
// Render HD via GitHub Actions é grátis dentro dos minutos do plano.
export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";
  const diasQs = url.searchParams.get("dias") ?? "all";

  let diasAlvo: number[] = [];
  if (diasQs === "all") {
    diasAlvo = Array.from({ length: 30 }, (_, i) => i + 1);
  } else {
    try {
      diasAlvo = JSON.parse(diasQs);
    } catch {
      return NextResponse.json({ erro: "dias inválido" }, { status: 400 });
    }
  }

  const sb = criarClienteAdmin();
  const { data: posts } = await sb
    .from("campanha_posts")
    .select("dia, texto_imagem")
    .in("dia", diasAlvo)
    .eq("slot", slot);

  const validos = (posts ?? []).filter((p) => p.texto_imagem?.trim().length).length;
  // Cada dia rende ~3-7 slides; assume média 5; ~2s por slide.
  const tempoSeg = validos * 5 * 2;
  const tempoMin = Math.ceil(tempoSeg / 60);

  return NextResponse.json({
    ok: true,
    slot,
    dias_total: validos,
    custo: 0,
    tempo_min: tempoMin,
    nota: "grátis (GitHub Actions)",
  });
}
