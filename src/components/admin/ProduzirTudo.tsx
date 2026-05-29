"use client";

import { useState } from "react";

type Fase = {
  id: string;
  rotulo: string;
  url: string;
};

// Sequência completa de produção. Cada passo é uma chamada HTTP
// independente, respeita o limite de 60s do Vercel. Total esperado
// 3-5 min para um arranque do zero.
const FASES: Fase[] = [
  { id: "bold", rotulo: "Aplicar bold aos 30 posts", url: "/api/admin/campanha/formatar-bold" },
  { id: "tarde-1", rotulo: "Gerar tarde, dias 1-10", url: "/api/admin/campanha/gerar-tarde?inicio=1&fim=10" },
  { id: "tarde-2", rotulo: "Gerar tarde, dias 11-20", url: "/api/admin/campanha/gerar-tarde?inicio=11&fim=20" },
  { id: "tarde-3", rotulo: "Gerar tarde, dias 21-30", url: "/api/admin/campanha/gerar-tarde?inicio=21&fim=30" },
  { id: "img-m1", rotulo: "Imagens manhã, dias 1-5", url: "/api/admin/campanha/imagens-replicate?inicio=1&fim=5&slot=manha&strategy=prefer-existing" },
  { id: "img-m2", rotulo: "Imagens manhã, dias 6-10", url: "/api/admin/campanha/imagens-replicate?inicio=6&fim=10&slot=manha&strategy=prefer-existing" },
  { id: "img-m3", rotulo: "Imagens manhã, dias 11-15", url: "/api/admin/campanha/imagens-replicate?inicio=11&fim=15&slot=manha&strategy=prefer-existing" },
  { id: "img-m4", rotulo: "Imagens manhã, dias 16-20", url: "/api/admin/campanha/imagens-replicate?inicio=16&fim=20&slot=manha&strategy=prefer-existing" },
  { id: "img-m5", rotulo: "Imagens manhã, dias 21-25", url: "/api/admin/campanha/imagens-replicate?inicio=21&fim=25&slot=manha&strategy=prefer-existing" },
  { id: "img-m6", rotulo: "Imagens manhã, dias 26-30", url: "/api/admin/campanha/imagens-replicate?inicio=26&fim=30&slot=manha&strategy=prefer-existing" },
  { id: "img-t1", rotulo: "Imagens tarde, dias 1-5", url: "/api/admin/campanha/imagens-replicate?inicio=1&fim=5&slot=tarde&strategy=prefer-existing" },
  { id: "img-t2", rotulo: "Imagens tarde, dias 6-10", url: "/api/admin/campanha/imagens-replicate?inicio=6&fim=10&slot=tarde&strategy=prefer-existing" },
  { id: "img-t3", rotulo: "Imagens tarde, dias 11-15", url: "/api/admin/campanha/imagens-replicate?inicio=11&fim=15&slot=tarde&strategy=prefer-existing" },
  { id: "img-t4", rotulo: "Imagens tarde, dias 16-20", url: "/api/admin/campanha/imagens-replicate?inicio=16&fim=20&slot=tarde&strategy=prefer-existing" },
  { id: "img-t5", rotulo: "Imagens tarde, dias 21-25", url: "/api/admin/campanha/imagens-replicate?inicio=21&fim=25&slot=tarde&strategy=prefer-existing" },
  { id: "img-t6", rotulo: "Imagens tarde, dias 26-30", url: "/api/admin/campanha/imagens-replicate?inicio=26&fim=30&slot=tarde&strategy=prefer-existing" },
  { id: "render-manha", rotulo: "Render HD, 30 manhã", url: "/api/admin/campanha/render-submit?dias=all&slot=manha" },
  { id: "render-tarde", rotulo: "Render HD, 30 tarde", url: "/api/admin/campanha/render-submit?dias=all&slot=tarde" },
];

type EstadoFase = "pendente" | "a-correr" | "ok" | "erro";

type LinhaResultado = {
  estado: EstadoFase;
  ok?: boolean;
  detalhe?: string;
  erro?: string;
};

export function ProduzirTudo() {
  const [resultados, setResultados] = useState<Record<string, LinhaResultado>>({});
  const [emCurso, setEmCurso] = useState(false);
  const [pararEm, setPararEm] = useState<string | null>(null);

  function atualizar(id: string, r: LinhaResultado) {
    setResultados((cur) => ({ ...cur, [id]: r }));
  }

  async function produzir() {
    setEmCurso(true);
    setPararEm(null);
    // Reset
    const inicial: Record<string, LinhaResultado> = {};
    for (const f of FASES) inicial[f.id] = { estado: "pendente" };
    setResultados(inicial);

    for (const fase of FASES) {
      atualizar(fase.id, { estado: "a-correr" });
      try {
        const r = await fetch(fase.url, { method: "POST" });
        const texto = await r.text();
        let json: { ok?: boolean; erro?: string; gerados?: number; saltados?: number; atualizados?: number };
        try {
          json = JSON.parse(texto);
        } catch {
          atualizar(fase.id, {
            estado: "erro",
            erro: `resposta não-JSON (${r.status})`,
            detalhe: texto.slice(0, 200),
          });
          setPararEm(fase.id);
          break;
        }
        if (!r.ok || json.erro) {
          atualizar(fase.id, {
            estado: "erro",
            erro: json.erro ?? `erro ${r.status}`,
          });
          setPararEm(fase.id);
          break;
        }
        const partes: string[] = [];
        if (json.gerados != null) partes.push(`${json.gerados} gerados`);
        if (json.saltados != null && json.saltados > 0) partes.push(`${json.saltados} saltados`);
        if (json.atualizados != null) partes.push(`${json.atualizados} actualizados`);
        atualizar(fase.id, {
          estado: "ok",
          ok: true,
          detalhe: partes.join(" · ") || "ok",
        });
      } catch (e) {
        atualizar(fase.id, {
          estado: "erro",
          erro: e instanceof Error ? e.message : "erro",
        });
        setPararEm(fase.id);
        break;
      }
    }

    setEmCurso(false);
  }

  return (
    <div
      className="estudio-card-elevado"
      style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--ambar)]">
        produção integrada
      </div>
      <h3 className="font-serif text-xl text-[var(--texto)] mt-1">
        Produzir tudo agora
      </h3>
      <p className="text-xs text-[var(--texto-suave)] mt-1 max-w-leitura">
        Corre bold, posts da tarde, imagens manhã e render HD em sequência.
        Idempotente: salta dias que já têm conteúdo. Pára na primeira falha
        e mantém o resto disponível para retoma manual.
      </p>

      <button
        onClick={produzir}
        disabled={emCurso}
        className="estudio-btn estudio-btn-primario mt-4"
      >
        {emCurso ? "a produzir..." : "produzir tudo"}
      </button>

      {Object.keys(resultados).length > 0 && (
        <ul className="mt-4 space-y-1.5 text-xs">
          {FASES.map((f) => {
            const r = resultados[f.id];
            if (!r) return null;
            const icone =
              r.estado === "ok"
                ? "✓"
                : r.estado === "erro"
                ? "✗"
                : r.estado === "a-correr"
                ? "·"
                : " ";
            const cor =
              r.estado === "ok"
                ? "text-[var(--verde)]"
                : r.estado === "erro"
                ? "text-[var(--vermelho)]"
                : r.estado === "a-correr"
                ? "text-[var(--ambar)]"
                : "text-[var(--texto-mudo)]";
            return (
              <li key={f.id} className={cor}>
                <span className="font-mono mr-2">{icone}</span>
                <span>{f.rotulo}</span>
                {r.detalhe && (
                  <span className="text-[var(--texto-suave)]"> · {r.detalhe}</span>
                )}
                {r.erro && (
                  <span className="text-[var(--vermelho)]"> · {r.erro}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pararEm && (
        <div className="text-[11px] text-[var(--vermelho)] mt-3">
          Parou na fase{" "}
          <span className="font-mono">{pararEm}</span>. Retoma manual a partir
          da Fase 2 (Imagens) ou Fase 3 (Render HD) abaixo.
        </div>
      )}
    </div>
  );
}
