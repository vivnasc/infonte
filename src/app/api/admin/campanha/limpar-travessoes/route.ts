import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { limparTravessoes } from "@/lib/limpar-texto";

export const runtime = "nodejs";

// Limpa travessões longos (—) e en-dashes (–) que tenham ficado
// na BD por conteúdo gerado antes da sanitização entrar no pipeline.
// Idempotente: se não houver dashes, não escreve nada.
// POST sem body. Devolve contagem por campo.
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts } = await sb
    .from("campanha_posts")
    .select("id, dia, slot, texto_imagem, legenda, pergunta");

  let atualizados = 0;
  let saltados = 0;
  const log: string[] = [];

  for (const p of posts ?? []) {
    const ti = p.texto_imagem ? limparTravessoes(p.texto_imagem) : p.texto_imagem;
    const le = p.legenda ? limparTravessoes(p.legenda) : p.legenda;
    const pe = p.pergunta ? limparTravessoes(p.pergunta) : p.pergunta;

    const mudou =
      ti !== p.texto_imagem || le !== p.legenda || pe !== p.pergunta;

    if (!mudou) {
      saltados++;
      continue;
    }

    const { error } = await sb
      .from("campanha_posts")
      .update({ texto_imagem: ti, legenda: le, pergunta: pe })
      .eq("id", p.id);
    if (error) {
      log.push(`Dia ${p.dia} ${p.slot}: erro ${error.message}`);
    } else {
      atualizados++;
      log.push(`Dia ${p.dia} ${p.slot}: limpo`);
    }
  }

  return NextResponse.json({ ok: true, atualizados, saltados, log });
}
