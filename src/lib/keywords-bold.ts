// Palavras-chave a destacar a dourado em cada dia. Aplicado em
// render-time por aplicarBoldDinamico, pelo que mudanças aqui são
// visíveis no preview do editor sem precisar de re-correr o seed
// ou o endpoint formatar-bold.
//
// Regra: não envolver se já estiver envolvido (idempotente).
export const KEYWORDS_BOLD: Record<number, string[]> = {
  1: ["cansada de perseguir", "se basta", "clareza", "foco", "acção", "infonte"],
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

export function aplicarBoldDinamico(texto: string, dia: number): string {
  const keywords = KEYWORDS_BOLD[dia];
  if (!keywords) return texto;
  let resultado = texto;
  for (const kw of keywords) {
    const regex = new RegExp(
      `(?<!\\*\\*)\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b(?!\\*\\*)`,
      "gi"
    );
    resultado = resultado.replace(regex, (match) => `**${match}**`);
  }
  return resultado;
}
