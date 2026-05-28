import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { gerarEUploadDia } from "@/lib/replicate-campanha";

export const runtime = "nodejs";
export const maxDuration = 60;

// Gera as imagens para vários dias de uma vez. Por defeito cobre os 30
// da manhã. Aceita ?inicio=1&fim=30&slot=manha para retomar lotes que
// tenham falhado a meio.
export async function POST(request: Request) {
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

  const url = new URL(request.url);
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));
  const slot = url.searchParams.get("slot") ?? "manha";

  const dias: number[] = [];
  for (let d = inicio; d <= fim; d++) dias.push(d);

  const log: string[] = [];
  let gerados = 0;

  // FLUX 1.1 Pro demora 8-15s. Em paralelo de 3 cabemos em ~50s para
  // ~10 dias num único pedido. Para cobrir os 30, o cliente faz três
  // pedidos com inicio/fim diferentes.
  const CONCORRENCIA = 3;
  for (let i = 0; i < dias.length; i += CONCORRENCIA) {
    const lote = dias.slice(i, i + CONCORRENCIA);
    await Promise.all(
      lote.map(async (d) => {
        try {
          await gerarEUploadDia({
            dia: d,
            slot,
            anthropicKey,
            replicateToken,
          });
          gerados++;
          log.push(`Dia ${d}: ok`);
        } catch (e) {
          log.push(
            `Dia ${d}: erro ${e instanceof Error ? e.message : String(e)}`
          );
        }
      })
    );
  }

  return NextResponse.json({
    ok: true,
    gerados,
    intervalo: `${inicio}-${fim}`,
    slot,
    log,
  });
}
