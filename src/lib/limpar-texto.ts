// Higiene de texto da Infonte. Regra de voz: sem travessões longos
// (em-dash —) nem en-dashes (–). Substituídos por vírgula com
// espaço, que cobre 95% dos casos onde Claude meteria um travessão
// (aposto, parêntese curto). Para casos em que era pausa forte,
// fica vírgula simples mas mantém legibilidade.
export function limparTravessoes(s: string): string {
  if (!s) return s;
  return s
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, ", ")
    // Evita ", ," se ficar duplicado
    .replace(/,\s*,/g, ",");
}
