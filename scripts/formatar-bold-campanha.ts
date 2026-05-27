// Pré-formata os texto_imagem dos 30 posts com **bold** nas palavras-chave.
// Corre com: npx tsx scripts/formatar-bold-campanha.ts
// Ou via o admin (futuro).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam vars Supabase.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: "infonte" },
});

// Mapa de bold por dia (palavras-chave que param o scroll)
const BOLD_MAP: Record<number, (t: string) => string> = {
  // Semana 1
  1: (t) => t, // carrossel, slides já têm texto próprio
  2: (t) =>
    "A tua cabeça tem\n**vinte abas abertas.**\nPor isso estás cansada\nsem ter feito nada.",
  3: (t) => "E se **metade dos teus sonhos**\nnem fossem teus?",
  4: (t) =>
    "Aprendeste cedo que tinhas\nde **fazer muito para valer.**\nE nunca mais paraste.",
  5: (t) => "Tens **talento a mais.**\nE **clareza a menos.**\nPor isso tocas em tudo\ne não aprofundas nada.",
  6: (t) => "Sabes dar.\nMas **sabes receber?**",
  7: (t) =>
    "Se esta semana te tocou,\né porque **já sabes**\no que vem a seguir.",

  // Semana 2
  8: (t) =>
    "A abundância não responde\na quem a persegue.\n**Responde a quem se basta.**",
  9: (t) =>
    "Bastar-se não é\n**desistir de querer.**\nÉ querer de um\n**lugar cheio.**",
  10: (t) => '"Deseja com mais força."\n**Mentira.**',
  11: (t) => "Quem tem fome\n**aceita migalhas.**\nQuem se basta\n**cobra o que vale.**",
  12: (t) =>
    "Não tens falta de dinheiro.\nTens falta de **permissão**\npara o ter.",
  13: (t) =>
    "O sucesso que te cansa\nnão é teu.\nO que é teu\n**dá-te energia.**",
  14: (t) =>
    "Não precisas de mais motivação.\nPrecisas de **mais verdade.**",
  15: (t) =>
    "Esta semana mudou\na forma como olhas\npara o que **persegues.**",

  // Semana 3
  16: (t) =>
    "**Esvaziar a mesa.**\nA primeira ferramenta\nque fica para a vida.",
  17: (t) =>
    "Ao lado de cada sonho,\nescreve uma palavra:\n**meu, emprestado, ou de outro.**",
  18: (t) =>
    "O que acendes mesmo\nquando **é difícil?**\nO mundo **já te pediu?**\nVai doer se **não fizeres?**",
  19: (t) => "Não é falta de foco.\nÉ **excesso.**\nA dispersão entre\ncoisas boas é a pior.",
  20: (t) =>
    "Um sonho grande.\nTrês meses.\nEsta semana.\n**Primeiro passo em 24h.**",
  21: (t) =>
    "A maioria dos planos falha\nporque são **grandes demais.**\nO teu primeiro passo\ntem de ser **pequeno demais.**",
  22: (t) =>
    "Vinte minutos por semana.\n**Três perguntas.**\nO encontro contigo\nque mantém tudo vivo.",
  23: (t) =>
    "Agora tens um método.\nNão precisas de **inspiração.**\nPrecisas de **estrutura.**",

  // Semana 4
  24: (t) =>
    "Isto chama-se **Infonte.**\nUm percurso de sete etapas\nque te leva da dispersão\nà ação concreta.",
  25: (t) =>
    "Não é mais um curso\nde mentalidade.\nÉ um percurso que\n**toca a raiz.**",
  26: (t) =>
    "Sou a Vivianne.\nNão te ensino o que tenho.\nEnsino o caminho\naté ao **bastar-te.**",
  27: (t) =>
    "Sete etapas.\nTrês semanas.\nFerramentas que ficam\n**para a vida.**",
  28: (t) =>
    "Pagas uma vez.\n**Acesso vitalício.**\nSem subscrição,\nsem upsell.",
  29: (t) =>
    "A etapa 1 é **grátis.**\nExperimenta antes de decidir.\nSem cartão, sem compromisso.",
  30: (t) =>
    "Pára de perseguir\no que **nunca foi teu.**\nComeça o percurso.\n**infonte.vivannedossantos.com**",
};

async function main() {
  const { data: posts } = await sb
    .from("campanha_posts")
    .select("dia, texto_imagem")
    .order("dia");

  if (!posts || posts.length === 0) {
    console.log("Sem posts. Corre o seed primeiro.");
    return;
  }

  let atualizados = 0;
  for (const p of posts) {
    const fn = BOLD_MAP[p.dia];
    if (!fn) continue;
    const novo = fn(p.texto_imagem ?? "");
    if (novo === p.texto_imagem) continue;

    const { error } = await sb
      .from("campanha_posts")
      .update({ texto_imagem: novo })
      .eq("dia", p.dia);

    if (error) {
      console.error(`Dia ${p.dia}: ${error.message}`);
    } else {
      console.log(`Dia ${p.dia}: bold aplicado`);
      atualizados++;
    }
  }

  console.log(`\n${atualizados} posts atualizados com bold.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
