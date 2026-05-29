import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Estimativa viva para o botão de bulk Replicate.
// GET /api/admin/campanha/imagens-replicate/estimativa?inicio=1&fim=10&slot=manha&strategy=always-new
//   → { dias_total, dias_com_imagem, dias_por_gerar, custo, tempo_seg }
export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const url = new URL(request.url);
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));
  const slot = url.searchParams.get("slot") ?? "manha";
  const strategy = url.searchParams.get("strategy") ?? "always-new";

  const sb = criarClienteAdmin();
  const { data: posts } = await sb
    .from("campanha_posts")
    .select("dia, imagem_url, imagens")
    .gte("dia", inicio)
    .lte("dia", fim)
    .eq("slot", slot);

  const total = (posts ?? []).length;
  const comImagem = (posts ?? []).filter((p) => {
    const imgs = (p.imagens as string[] | null) ?? [];
    return p.imagem_url || imgs.length > 0;
  }).length;

  // prefer-existing salta dias com imagem; always-new gera para todos;
  // reuse-only nunca chama Replicate (custo zero, mas pode deixar dias
  // sem imagem se a biblioteca não cobrir).
  let porGerar = total;
  if (strategy === "prefer-existing") porGerar = total - comImagem;
  if (strategy === "reuse-only") porGerar = 0;

  const custo = porGerar * 0.04;
  // FLUX 1.1 Pro: 8-15s por imagem, concorrência 3 no servidor.
  const tempoSeg = Math.ceil((porGerar / 3) * 12);

  return NextResponse.json({
    ok: true,
    inicio,
    fim,
    slot,
    strategy,
    dias_total: total,
    dias_com_imagem: comImagem,
    dias_por_gerar: porGerar,
    custo: Number(custo.toFixed(2)),
    tempo_seg: tempoSeg,
  });
}
