import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Palavras-chave a sublinhar a negrito em cada dia. NÃO substitui o
// texto — só envolve estas substrings com **bold**. Preserva
// numeração ("1. Tens...") e estrutura original do seed.
const KEYWORDS_BOLD: Record<number, string[]> = {
  2: ["vinte abas abertas"],
  3: ["metade dos teus sonhos"],
  4: ["fazer muito para valer"],
  5: ["talento a mais", "clareza a menos"],
  6: ["sabes receber"],
  7: ["já sabes"],
  8: ["Responde a quem se basta"],
  9: ["desistir de querer", "lugar cheio"],
  10: ["Mentira"],
  11: ["aceita migalhas", "cobra o que vale"],
  12: ["permissão"],
  13: ["dá-te energia"],
  14: ["mais verdade"],
  15: ["persegues"],
  16: ["Esvaziar a mesa"],
  17: ["meu, emprestado, ou de outro"],
  18: ["é difícil", "já te pediu", "não fizeres"],
  19: ["excesso"],
  20: ["Primeiro passo em 24h"],
  21: ["grandes demais", "pequeno demais"],
  22: ["Três perguntas"],
  23: ["inspiração", "estrutura"],
  24: ["Infonte"],
  25: ["toca a raiz"],
  26: ["bastar-te"],
  27: ["para a vida"],
  28: ["Acesso vitalício"],
  29: ["grátis"],
  30: ["nunca foi teu", "infonte.vivannedossantos.com"],
};

function aplicarBold(texto: string, keywords: string[]): string {
  let resultado = texto;
  for (const kw of keywords) {
    // Não envolver se já está envolvido
    const regex = new RegExp(
      `(?<!\\*\\*)\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b(?!\\*\\*)`,
      "gi"
    );
    resultado = resultado.replace(regex, (match) => `**${match}**`);
  }
  return resultado;
}

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const sb = criarClienteAdmin();
  let atualizados = 0;
  let saltados = 0;
  const log: string[] = [];

  // Lê o texto existente do seed e adiciona bold sem destruir estrutura.
  for (const [diaStr, keywords] of Object.entries(KEYWORDS_BOLD)) {
    const dia = parseInt(diaStr, 10);
    const { data: post } = await sb
      .from("campanha_posts")
      .select("id, texto_imagem")
      .eq("dia", dia)
      .eq("slot", "manha")
      .maybeSingle();

    if (!post || !post.texto_imagem?.trim()) {
      saltados++;
      log.push(`Dia ${dia}: sem texto_imagem, saltado`);
      continue;
    }

    const novo = aplicarBold(post.texto_imagem, keywords);
    if (novo === post.texto_imagem) {
      saltados++;
      log.push(`Dia ${dia}: já tinha bold ou keywords não encontradas`);
      continue;
    }

    const { error } = await sb
      .from("campanha_posts")
      .update({ texto_imagem: novo })
      .eq("id", post.id);
    if (error) {
      log.push(`Dia ${dia}: erro, ${error.message}`);
    } else {
      log.push(`Dia ${dia}: bold aplicado em [${keywords.join(", ")}]`);
      atualizados++;
    }
  }

  return NextResponse.json({ ok: true, atualizados, saltados, log });
}
