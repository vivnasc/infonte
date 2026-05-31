"use client";

import { useState } from "react";

// Re-render dos dias que falharam no último import do Metricool +
// os singles que ficaram com 1 imagem (dia 20, 29, 30 das âncoras).
// Faz expand-singles + imagens-por-slide + render num só clique.
// Tudo idempotente: dias já OK saltam.
//
//   manhã: 3, 8, 11, 13, 14, 19, 20, 29, 30
//   tarde: 5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30

const DIAS_MANHA = [3, 8, 11, 13, 14, 19, 20, 29, 30];
const DIAS_TARDE = [5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30];

export function BotaoRenderFalhados() {
  const [estado, setEstado] = useState<"calmo" | "a-disparar" | "ok" | "erro">("calmo");
  const [msg, setMsg] = useState<string | null>(null);

  async function correr() {
    setEstado("a-disparar");
    setMsg(null);
    try {
      const todosDias = Array.from(new Set([...DIAS_MANHA, ...DIAS_TARDE])).sort(
        (a, b) => a - b
      );
      const inicio = Math.min(...todosDias);
      const fim = Math.max(...todosDias);

      // 1. Expand singles (idempotente: salta dias já carrosséis).
      setMsg("a expandir singles via Claude...");
      await Promise.all(
        (["manha", "tarde"] as const).map((slot) =>
          fetch(
            `/api/admin/campanha/expandir-singles?slot=${slot}&inicio=${inicio}&fim=${fim}`,
            { method: "POST" }
          )
        )
      );

      // 2. Imagens por slide (idempotente: salta dias com 5 imagens).
      setMsg("a gerar imagens por slide via Replicate...");
      await Promise.all(
        (["manha", "tarde"] as const).map((slot) =>
          fetch(
            `/api/admin/campanha/imagens-por-slide?slot=${slot}&inicio=${inicio}&fim=${fim}&max=5`,
            { method: "POST" }
          )
        )
      );

      // 3. Render HD só dos dias específicos por slot.
      setMsg("a disparar render HD...");
      const resultados = await Promise.all(
        (
          [
            { slot: "manha" as const, dias: DIAS_MANHA },
            { slot: "tarde" as const, dias: DIAS_TARDE },
          ]
        ).map(async ({ slot, dias }) => {
          const r = await fetch(
            `/api/admin/campanha/render-submit?dias=${JSON.stringify(dias)}&slot=${slot}`,
            { method: "POST" }
          );
          const j = await r.json().catch(() => ({}));
          return { ok: r.ok && !j.erro, slot, dias, erro: j.erro };
        })
      );
      const erros = resultados.filter((r) => !r.ok);
      if (erros.length > 0) {
        setEstado("erro");
        setMsg(erros.map((e) => `${e.slot}: ${e.erro ?? "erro"}`).join(" | "));
      } else {
        setEstado("ok");
        setMsg(
          `expand + imagens + render disparados (${DIAS_MANHA.length} manhã + ${DIAS_TARDE.length} tarde). ~5 min. Depois sincroniza.`
        );
      }
    } catch (e) {
      setEstado("erro");
      setMsg(e instanceof Error ? e.message : "erro");
    }
  }

  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--vermelho)] mb-3">
        rever dias falhados (expand + imagens + render)
      </div>
      <p className="text-xs text-[var(--texto-suave)] mb-3 max-w-leitura">
        Dias que ficaram fora do Metricool ou só com 1 imagem (singles).
        Faz expand-singles + imagens-por-slide + render num só clique
        (idempotente). Manhã: 3, 8, 11, 13, 14, 19, 20, 29, 30. Tarde:
        5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30.
      </p>
      <button
        onClick={correr}
        disabled={estado === "a-disparar"}
        className="estudio-btn estudio-btn-primario"
      >
        {estado === "a-disparar"
          ? "a disparar..."
          : estado === "ok"
          ? "disparado ✓"
          : "rever todos os falhados"}
      </button>
      <a
        href="/api/admin/campanha/exportar.csv?falhados=1"
        className="estudio-btn estudio-btn-primario ml-2 inline-block"
      >
        ↓ CSV falhados (22)
      </a>
      {msg && (
        <p
          className={`text-[11px] mt-2 ${
            estado === "erro" ? "text-[var(--vermelho)]" : "text-[var(--texto-suave)]"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
