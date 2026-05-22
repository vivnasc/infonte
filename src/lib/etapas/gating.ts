export const HORAS_GATING = 72;

export function dataDeAbertura(desbloqueada_em_anterior: Date | null): Date | null {
  if (!desbloqueada_em_anterior) return null;
  return new Date(
    desbloqueada_em_anterior.getTime() + HORAS_GATING * 60 * 60 * 1000
  );
}

export function podeAbrir(
  n: number,
  comprou: boolean,
  progressoAnterior:
    | { desbloqueada_em: string | null; concluida_em: string | null }
    | null
    | undefined
): { acessivel: boolean; abreEm: Date | null; razao?: "compra" | "tempo" } {
  if (n === 1) return { acessivel: true, abreEm: null };
  if (!comprou) return { acessivel: false, abreEm: null, razao: "compra" };
  if (!progressoAnterior || !progressoAnterior.desbloqueada_em) {
    return { acessivel: false, abreEm: null, razao: "tempo" };
  }
  const anterior = new Date(progressoAnterior.desbloqueada_em);
  const abre = dataDeAbertura(anterior);
  if (abre && abre.getTime() <= Date.now()) {
    return { acessivel: true, abreEm: abre };
  }
  return { acessivel: false, abreEm: abre, razao: "tempo" };
}
