"use client";

import { useState } from "react";

// Re-renderiza dias 29 e 30 (manhã + tarde) num só clique. Dispara
// 2 workflows em paralelo (dias=[29,30] × slot manhã e tarde).
export function BotaoRenderDias29e30() {
  const [estado, setEstado] = useState<"calmo" | "a-disparar" | "ok" | "erro">("calmo");
  const [msg, setMsg] = useState<string | null>(null);

  async function correr() {
    setEstado("a-disparar");
    setMsg(null);
    try {
      const resultados = await Promise.all(
        (["manha", "tarde"] as const).map((slot) =>
          fetch(
            `/api/admin/campanha/render-submit?dias=[29,30]&slot=${slot}`,
            { method: "POST" }
          ).then(async (r) => {
            const j = await r.json().catch(() => ({}));
            return { ok: r.ok && !j.erro, slot, erro: j.erro, jobId: j.jobId };
          })
        )
      );
      const erros = resultados.filter((r) => !r.ok);
      if (erros.length > 0) {
        setEstado("erro");
        setMsg(erros.map((e) => `${e.slot}: ${e.erro ?? "erro"}`).join(" | "));
      } else {
        setEstado("ok");
        setMsg(`2 workflows disparados. ~5 min. Depois sincroniza.`);
      }
    } catch (e) {
      setEstado("erro");
      setMsg(e instanceof Error ? e.message : "erro");
    }
  }

  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
        re-render dias 29-30 (manhã + tarde)
      </div>
      <p className="text-xs text-[var(--texto-suave)] mb-3 max-w-leitura">
        Dispara 2 workflows em paralelo só para estes 4 posts. Os outros 56 não
        são tocados (Metricool antigo continua válido para eles).
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
          : "re-render dias 29-30"}
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
