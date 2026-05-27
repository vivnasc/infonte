import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

const TEMAS_MANHA: Record<number, string> = {
  1: "MANIFESTO", 2: "AS VINTE ABAS", 3: "O SONHO QUE NEM É TEU",
  4: "FAZER MUITO PARA VALER", 5: "A MULHER TALENTOSA QUE NÃO AVANÇA",
  6: "RECEBER", 7: "RESUMO DA SEMANA",
  8: "A FRASE QUE MUDA TUDO", 9: "BASTAR-SE NÃO É DESISTIR",
  10: "OS GURUS MENTEM-TE", 11: "QUEM SE BASTA COBRA O QUE VALE",
  12: "PERMISSÃO PARA TER", 13: "O SUCESSO QUE TE CANSA NÃO É TEU",
  14: "MAIS VERDADE, NÃO MAIS MOTIVAÇÃO", 15: "RESUMO DA SEMANA",
  16: "ESVAZIAR A MESA", 17: "MEU, EMPRESTADO, DE OUTRO",
  18: "OS TRÊS FILTROS", 19: "DISPERSÃO ENTRE COISAS BOAS",
  20: "PARTIR O SONHO", 21: "O PRIMEIRO PASSO PEQUENO",
  22: "O ENCONTRO SEMANAL CONTIGO", 23: "RESUMO DA SEMANA",
  24: "ISTO CHAMA-SE INFONTE", 25: "NÃO É MAIS UM CURSO",
  26: "SOU A VIVIANNE", 27: "SETE ETAPAS, TRÊS SEMANAS",
  28: "PAGAS UMA VEZ", 29: "A ETAPA 1 É GRÁTIS", 30: "PÁRA DE PERSEGUIR",
};

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ erro: "ANTHROPIC_API_KEY ausente" }, { status: 500 });

  const sb = criarClienteAdmin();
  const log: string[] = [];
  let gerados = 0;

  for (let dia = 1; dia <= 30; dia++) {
    const temaManha = TEMAS_MANHA[dia] ?? `DIA ${dia}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Gera o post EMOCIONAL da tarde (13h) para o dia ${dia} da campanha Infonte.

O post da manhã (10h, didático) é sobre: "${temaManha}".
O post da tarde é o par emocional: uma frase curta, visceral, de reconhecimento. A mulher lê e sente "isto sou eu". Sem explicação, sem método, só a dor ou a verdade crua.

Regras:
- pt-PT, segunda pessoa (tu), íntima, sem ferida, com poder
- Sem travessões (vírgula, ponto, dois pontos, parênteses)
- Máximo 3 a 4 linhas de texto para a imagem
- Usa **negrito** nas 2 a 4 palavras que mais doem (para renderizar em dourado)
- Início de frases em maiúscula
- Tom: reconhecimento ("eu sei o que sentes"), não conselho
- Não uses: universo, manifesta, mindset, abundância como jargão

Devolve um JSON com esta estrutura exacta:
{
  "texto_imagem": "o texto para a arte (com **bold** e \\n para quebras de linha)",
  "legenda": "a legenda para o Instagram (3 a 5 frases curtas, sem hashtags)",
  "pergunta": "uma pergunta para os comentários"
}

Devolve APENAS o JSON, sem explicação.`,
        }],
      }),
    });

    if (!r.ok) {
      log.push(`Dia ${dia}: erro Claude ${r.status}`);
      continue;
    }

    const j = await r.json();
    const texto = j.content?.[0]?.text?.trim();
    if (!texto) {
      log.push(`Dia ${dia}: resposta vazia`);
      continue;
    }

    let parsed: { texto_imagem: string; legenda: string; pergunta: string };
    try {
      const jsonStr = texto.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      log.push(`Dia ${dia}: JSON inválido`);
      continue;
    }

    // Verificar se já existe post da tarde para este dia
    const { data: existente } = await sb
      .from("campanha_posts")
      .select("id")
      .eq("dia", dia)
      .eq("slot", "tarde")
      .maybeSingle();

    if (existente) {
      await sb.from("campanha_posts").update({
        texto_imagem: parsed.texto_imagem,
        legenda: parsed.legenda,
        pergunta: parsed.pergunta,
      }).eq("id", existente.id);
      log.push(`Dia ${dia}: atualizado`);
    } else {
      // Inserir como dia 31-60 (para não colidir com os 1-30 da manhã)
      // Ou usar o slot para diferenciar
      const { error } = await sb.from("campanha_posts").insert({
        dia: dia + 30, // 31-60 para os da tarde
        semana: Math.ceil(dia / 7),
        tema: `${temaManha} (emocional)`,
        formato: "post-unico",
        texto_imagem: parsed.texto_imagem,
        legenda: parsed.legenda,
        pergunta: parsed.pergunta,
        slot: "tarde",
        redes: ["instagram", "tiktok"],
        estado: "rascunho",
      });
      if (error) {
        log.push(`Dia ${dia}: erro insert: ${error.message}`);
      } else {
        log.push(`Dia ${dia}: gerado`);
        gerados++;
      }
    }
  }

  return NextResponse.json({ ok: true, gerados, log });
}
