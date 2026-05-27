import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BOLD_MAP: Record<number, string> = {
  2: "A tua cabeça tem\n**vinte abas abertas.**\nPor isso estás cansada\nsem ter feito nada.",
  3: "E se **metade dos teus sonhos**\nnem fossem teus?",
  4: "Aprendeste cedo que tinhas\nde **fazer muito para valer.**\nE nunca mais paraste.",
  5: "Tens **talento a mais.**\nE **clareza a menos.**\nPor isso tocas em tudo\ne não aprofundas nada.",
  6: "Sabes dar.\nMas **sabes receber?**",
  7: "Se esta semana te tocou,\né porque **já sabes**\no que vem a seguir.",
  8: "A abundância não responde\na quem a persegue.\n**Responde a quem se basta.**",
  9: "Bastar-se não é\n**desistir de querer.**\nÉ querer de um\n**lugar cheio.**",
  10: '"Deseja com mais força."\n**Mentira.**',
  11: "Quem tem fome\n**aceita migalhas.**\nQuem se basta\n**cobra o que vale.**",
  12: "Não tens falta de dinheiro.\nTens falta de **permissão**\npara o ter.",
  13: "O sucesso que te cansa\nnão é teu.\nO que é teu\n**dá-te energia.**",
  14: "Não precisas de mais motivação.\nPrecisas de **mais verdade.**",
  15: "Esta semana mudou\na forma como olhas\npara o que **persegues.**",
  16: "**Esvaziar a mesa.**\nA primeira ferramenta\nque fica para a vida.",
  17: "Ao lado de cada sonho,\nescreve uma palavra:\n**meu, emprestado, ou de outro.**",
  18: "O que acendes mesmo\nquando **é difícil?**\nO mundo **já te pediu?**\nVai doer se **não fizeres?**",
  19: "Não é falta de foco.\nÉ **excesso.**\nA dispersão entre\ncoisas boas é a pior.",
  20: "Um sonho grande.\nTrês meses.\nEsta semana.\n**Primeiro passo em 24h.**",
  21: "A maioria dos planos falha\nporque são **grandes demais.**\nO teu primeiro passo\ntem de ser **pequeno demais.**",
  22: "Vinte minutos por semana.\n**Três perguntas.**\nO encontro contigo\nque mantém tudo vivo.",
  23: "Agora tens um método.\nNão precisas de **inspiração.**\nPrecisas de **estrutura.**",
  24: "Isto chama-se **Infonte.**\nUm percurso de sete etapas\nque te leva da dispersão\nà ação concreta.",
  25: "Não é mais um curso\nde mentalidade.\nÉ um percurso que\n**toca a raiz.**",
  26: "Sou a Vivianne.\nNão te ensino o que tenho.\nEnsino o caminho\naté ao **bastar-te.**",
  27: "Sete etapas.\nTrês semanas.\nFerramentas que ficam\n**para a vida.**",
  28: "Pagas uma vez.\n**Acesso vitalício.**\nSem subscrição,\nsem upsell.",
  29: "A etapa 1 é **grátis.**\nExperimenta antes de decidir.\nSem cartão, sem compromisso.",
  30: "Pára de perseguir\no que **nunca foi teu.**\nComeça o percurso.\n**infonte.vivannedossantos.com**",
};

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const sb = criarClienteAdmin();
  let atualizados = 0;
  const log: string[] = [];

  for (const [diaStr, texto] of Object.entries(BOLD_MAP)) {
    const dia = parseInt(diaStr, 10);
    const { error } = await sb
      .from("campanha_posts")
      .update({ texto_imagem: texto })
      .eq("dia", dia)
      .eq("slot", "manha");
    if (error) {
      log.push(`Dia ${dia}: erro, ${error.message}`);
    } else {
      log.push(`Dia ${dia}: bold aplicado`);
      atualizados++;
    }
  }

  return NextResponse.json({ ok: true, atualizados, log });
}
