"use client";

import { useState } from "react";

// Re-render dos dias que falharam no import do Metricool (aspect ratio,
// imagens stale, etc). Lista derivada do calendário pós-import:
//   manhã: 6, 11, 13, 14, 18, 19
//   tarde: 1, 4, 5, 8, 11, 12, 13, 14, 16, 17, 18, 19, 20
// Dispara 2 workflows em paralelo. Os outros 41 posts já agendados não
// são tocados (Metricool antigo continua válido para eles).

const DIAS_MANHA = [6, 11, 13, 14, 18, 19];
const DIAS_TARDE = [1, 4, 5, 8, 11, 12, 13, 14, 16, 17, 18, 19, 20];

export function BotaoRenderFalhados() {
  const [estado, setEstado] = useState<"calmo" | "a-disparar" | "ok" | "erro">("calmo");
  const [msg, setMsg] = useState<string | null>(null);

  async function correr() {
    setEstado("a-disparar");
    setMsg(null);
    try {
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
        setMsg("2 workflows disparados (19 dias). ~5 min. Depois sincroniza.");
      }
    } catch (e) {
      setEstado("erro");
      setMsg(e instanceof Error ? e.message : "erro");
    }
  }

  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--vermelho)] mb-3">
        re-render 19 dias falhados no Metricool
      </div>
      <p className="text-xs text-[var(--texto-suave)] mb-3 max-w-leitura">
        Dispara render só para os dias que o Metricool ignorou. Manhã: dia
        6, 11, 13, 14, 18, 19. Tarde: dia 1, 4, 5, 8, 11, 12, 13, 14, 16, 17,
        18, 19, 20. Outros 41 ficam intactos.
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
          : "re-render dias falhados"}
      </button>
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
