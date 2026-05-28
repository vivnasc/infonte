import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { gerarEUploadDia } from "@/lib/replicate-campanha";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!anthropicKey || !replicateToken) {
    return NextResponse.json(
      {
        erro: "faltam env vars",
        detalhe: !anthropicKey ? "ANTHROPIC_API_KEY" : "REPLICATE_API_TOKEN",
      },
      { status: 500 }
    );
  }

  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";

  try {
    const r = await gerarEUploadDia({
      dia,
      slot,
      anthropicKey,
      replicateToken,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e: unknown) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "erro desconhecido" },
      { status: 500 }
    );
  }
}
