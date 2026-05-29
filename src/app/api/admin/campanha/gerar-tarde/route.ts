import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

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

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ erro: "ANTHROPIC_API_KEY ausente" }, { status: 500 });

  // Aceitar intervalos para suportar retoma e evitar timeout do Vercel.
  // Default = 1-30 (todos), mas é seguro chamar com 1-10, 11-20, 21-30.
  const url = new URL(request.url);
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));

  const sb = criarClienteAdmin();
  const log: string[] = [];
  let gerados = 0;
  let saltados = 0;

  async function processarDia(dia: number): Promise<void> {
    const temaManha = TEMAS_MANHA[dia] ?? `DIA ${dia}`;

    // Check de existência ANTES de chamar a Claude. Se já existe com
    // texto, salta sem gastar tokens nem segundos. Isto evita o timeout
    // do Vercel quando o lote já está quase todo feito.
    const { data: jaExiste } = await sb
      .from("campanha_posts")
      .select("id, texto_imagem")
      .eq("dia", dia)
      .eq("slot", "tarde")
      .maybeSingle();

    if (jaExiste && jaExiste.texto_imagem?.trim()) {
      saltados++;
      log.push(`Dia ${dia}: já existia, saltado`);
      return;
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `És a Vivianne dos Santos, autora da Infonte. Estás a escrever o post das 13h do dia ${dia}.

CONTEXTO DA CAMPANHA (arco de 30 dias)
- Semana 1 (dias 1-7): A ferida que ninguém nomeia. Mostrar à mulher que a dispersão, o cansaço e o perseguir têm nome. Reconhecimento, não solução.
- Semana 2 (dias 8-15): A virada. A tese: a abundância não vem de perseguir, vem de bastar-se. Quebrar a lógica do esforço.
- Semana 3 (dias 16-23): O método. Ferramentas concretas (esvaziar a mesa, contar o que tens, partir o sonho). Provas pequenas de valor.
- Semana 4 (dias 24-30): A porta. Revelar a Infonte como produto, abrir lista de espera, convite a entrar.

O post da manhã (10h, didáctico) hoje é sobre: "${temaManha}".

O post da tarde NÃO é repetição do manhã. É o eco emocional: uma frase curta, visceral, que a mulher lê no fim do dia e sente "isto sou eu". O manhã ensina, a tarde reconhece.

REGRAS DE VOZ (não negociáveis)
- pt-PT, segunda pessoa (tu). Íntima, sem ferida, com poder.
- Sem travessões longos (—) nem en-dashes. Vírgulas, pontos, parênteses ok.
- Sem jargão new-age: NUNCA usar "universo", "manifesta", "mindset", "abundância" sozinha, "energia", "vibração", "frequência", "alma", "cura", "luz", "alinhamento".
- Sem clichés de coaching: "abraça-te", "ama-te", "tu mereces tudo", "tu és luz", "vai funcionar".
- Sem palavras de marketing americano: "hustle", "mindset", "growth", "abundance mindset".
- Tom: quem se bastou a falar para quem ainda persegue. Calma, autoridade, sem ostentar.
- Frases curtas. Verbos fortes. Concreto sobre abstracto.

TEXTO PARA A IMAGEM
- Máximo 3 a 4 linhas curtas. Cada linha lê-se em 1 respiração.
- **negrito** nas 2 a 4 palavras que mais doem (saem em âmbar dourado).
- Início de frases em maiúscula.
- Sem hashtags, sem @.

LEGENDA
- 3 a 5 frases curtas que expandem a frase da imagem. Sem repetir.
- NÃO incluir CTA genérico ("entra para a lista"). A tarde não vende, reconhece.
- Acaba com a pergunta separada (vai no campo abaixo).

PERGUNTA
- Uma pergunta directa, concreta, que pede UMA palavra ou UMA frase de resposta.
- NÃO sim/não. NÃO retórica.

OUTPUT
Devolve APENAS este JSON, sem explicações:
{
  "texto_imagem": "...",
  "legenda": "...",
  "pergunta": "..."
}

Devolve APENAS o JSON, sem explicação.`,
        }],
      }),
    });

    if (!r.ok) {
      log.push(`Dia ${dia}: erro Claude ${r.status}`);
      return;
    }

    const j = await r.json();
    const texto = j.content?.[0]?.text?.trim();
    if (!texto) {
      log.push(`Dia ${dia}: resposta vazia`);
      return;
    }

    let parsed: { texto_imagem: string; legenda: string; pergunta: string };
    try {
      const jsonStr = texto.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      log.push(`Dia ${dia}: JSON inválido`);
      return;
    }

    // Re-aproveitamos o jaExiste do início. Se existia mas sem texto,
    // atualizamos. Se não existia, criamos novo.
    if (jaExiste) {
      await sb.from("campanha_posts").update({
        texto_imagem: parsed.texto_imagem,
        legenda: parsed.legenda,
        pergunta: parsed.pergunta,
      }).eq("id", jaExiste.id);
      gerados++;
      log.push(`Dia ${dia}: atualizado`);
    } else {
      const { error } = await sb.from("campanha_posts").insert({
        dia,
        semana: Math.min(4, Math.ceil(dia / 7)),
        tema: `Eco · ${temaManha}`,
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

  // Processar em lotes paralelos. Concorrência alta + intervalo de 1-10
  // ou 11-20 ou 21-30 evita o timeout do Vercel.
  const CONCORRENCIA = 10;
  const dias: number[] = [];
  for (let d = inicio; d <= fim; d++) dias.push(d);
  for (let i = 0; i < dias.length; i += CONCORRENCIA) {
    const lote = dias.slice(i, i + CONCORRENCIA);
    await Promise.all(lote.map((d) => processarDia(d).catch((e) => {
      log.push(`Dia ${d}: excepção ${e instanceof Error ? e.message : String(e)}`);
    })));
  }

  return NextResponse.json({
    ok: true,
    inicio,
    fim,
    gerados,
    saltados,
    total: dias.length,
    log,
  });
}
