// Lista de espera do lançamento de 1 de Julho.
// Código de desconto e regra de desconto, partilhados entre o endpoint
// público e a integração de checkout do PayPal.

import { randomUUID } from "node:crypto";

// Desconto para quem entrou na lista de espera antes do lançamento.
export const DESCONTO_PCT = 25;

// Código pessoal, ex: "INFONTE-EARLY-3F9A". Os 4 chars vêm de um uuid,
// suficiente para não colidir na escala desta lista.
export function gerarCodigoDesconto(): string {
  const frag = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `INFONTE-EARLY-${frag}`;
}

// Aplica o desconto a um valor base, arredondado a 2 casas.
export function aplicarDesconto(valorBase: number): number {
  return Math.round(valorBase * (1 - DESCONTO_PCT / 100) * 100) / 100;
}
