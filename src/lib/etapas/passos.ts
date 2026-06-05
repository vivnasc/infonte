// Divide o corpo de uma etapa em "passos" para a experiência guiada.
// Mantém as palavras da autora intactas, só as separa em batidas: cada
// secção "## ..." vira um passo, os títulos "# ..." dão contexto, e os
// campos de resposta / assinatura ligam-se ao passo onde aparecem.

import { parseEtapa } from "@/lib/etapas/marcadores";
import { renderMarkdown } from "@/lib/etapas/markdown";

export type Parte =
  | { tipo: "html"; html: string }
  | { tipo: "campo"; bloco_id: string }
  | { tipo: "mostrar"; bloco_id: string }
  | { tipo: "assinatura"; valores: string[] };

export type Passo = {
  rotulo: string | null; // contexto vindo do "# ..." (ex: "ETAPA 1, ESVAZIAR")
  titulo: string | null; // o "## ..." da secção
  partes: Parte[];
  temFerramenta: boolean;
};

type Chunk = { nivel: number; titulo: string; corpo: string };

function splitPorTitulos(md: string): Chunk[] {
  const linhas = md.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let cur: { nivel: number; titulo: string; corpo: string[] } | null = null;
  const push = () => {
    if (cur) {
      chunks.push({
        nivel: cur.nivel,
        titulo: cur.titulo,
        corpo: cur.corpo.join("\n").trim(),
      });
      cur = null;
    }
  };
  for (const l of linhas) {
    const m = l.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      push();
      cur = { nivel: m[1].length, titulo: m[2].trim(), corpo: [] };
    } else {
      if (!cur) cur = { nivel: 0, titulo: "", corpo: [] };
      cur.corpo.push(l);
    }
  }
  push();
  return chunks;
}

// "Bloco A, a verdade que ninguém te diz" -> "a verdade que ninguém te diz"
function limparTitulo(t: string): string {
  return t.replace(/^bloco\s+[a-z]\s*,?\s*/i, "").trim() || t;
}

// Parte um corpo markdown em grupos de até `max` blocos (parágrafos ou
// listas, separados por linha em branco), para ecrãs mais leves.
function agruparBlocos(md: string, max: number): string[] {
  const blocos = md
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const grupos: string[] = [];
  for (let i = 0; i < blocos.length; i += max) {
    grupos.push(blocos.slice(i, i + max).join("\n\n"));
  }
  return grupos;
}

// Move o passo que contém a ferramenta (campo) para o início, para a etapa
// começar pela ação, com o ensino a seguir.
export function comFerramentaPrimeiro(passos: Passo[]): Passo[] {
  const idx = passos.findIndex((p) => p.partes.some((pt) => pt.tipo === "campo"));
  if (idx <= 0) return passos;
  const copia = [...passos];
  const [ferramenta] = copia.splice(idx, 1);
  copia.unshift(ferramenta);
  return copia;
}

// Corta o preâmbulo (manifesto global) antes do "# ETAPA", para a
// experiência começar direta no trabalho da etapa. Se não houver "# ETAPA"
// (etapas sem manifesto), devolve o corpo intacto.
export function cortarPreambuloEtapa(corpo: string): string {
  const linhas = corpo.split(/\r?\n/);
  const idx = linhas.findIndex((l) => /^#\s*ETAPA/i.test(l));
  return idx > 0 ? linhas.slice(idx).join("\n") : corpo;
}

export function dividirEmPassos(corpo: string): Passo[] {
  const nos = parseEtapa(corpo);
  const passos: Passo[] = [];
  let rotulo: string | null = null;

  const novoPasso = (titulo: string | null): Passo => {
    const p: Passo = { rotulo, titulo, partes: [], temFerramenta: false };
    passos.push(p);
    return p;
  };
  const passoAtual = (): Passo =>
    passos.length > 0 ? passos[passos.length - 1] : novoPasso(null);

  for (const no of nos) {
    if (no.tipo === "md") {
      for (const c of splitPorTitulos(no.conteudo)) {
        if (c.nivel === 1) {
          // Título grande: define contexto. Se trouxer corpo, abre passo.
          rotulo = c.titulo;
          if (c.corpo) {
            const p = novoPasso(null);
            p.partes.push({ tipo: "html", html: renderMarkdown(c.corpo) });
          }
          continue;
        }
        if (c.nivel === 2) {
          // "Título visível" é metadado (já é o H1 da página): ignora.
          if (/^t[ií]tulo\s+vis[ií]vel$/i.test(c.titulo)) continue;
          // Parte o corpo em ecrãs leves (até 2 blocos por passo). O título
          // fica só no primeiro; os seguintes são continuação.
          const grupos = agruparBlocos(c.corpo, 2);
          if (grupos.length === 0) {
            novoPasso(limparTitulo(c.titulo));
          } else {
            grupos.forEach((g, idx) => {
              const p = novoPasso(idx === 0 ? limparTitulo(c.titulo) : null);
              p.partes.push({ tipo: "html", html: renderMarkdown(g) });
            });
          }
          continue;
        }
        // Sem título, ou subtítulo (>=3): anexa ao passo actual.
        const p = passoAtual();
        const md =
          c.nivel >= 3 ? `${"#".repeat(c.nivel)} ${c.titulo}\n\n${c.corpo}` : c.corpo;
        const html = renderMarkdown(md);
        if (html.trim()) p.partes.push({ tipo: "html", html });
      }
    } else if (no.tipo === "campo") {
      const p = passoAtual();
      p.partes.push({ tipo: "campo", bloco_id: no.bloco_id });
      p.temFerramenta = true;
    } else if (no.tipo === "mostrar") {
      passoAtual().partes.push({ tipo: "mostrar", bloco_id: no.bloco_id });
    } else if (no.tipo === "assinatura") {
      passoAtual().partes.push({ tipo: "assinatura", valores: no.valores });
    }
  }

  return passos.filter((p) => p.partes.length > 0 || p.titulo);
}
