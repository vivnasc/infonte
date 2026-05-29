"use client";

import { useState } from "react";

type Props = {
  semana: number;
  slot: "manha" | "tarde";
  rotulo?: string;
};

export function BotaoRenderSemana({ semana, slot, rotulo }: Props) {
  const [estado, setEstado] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [erro, setErro] = useState<string | null>(null);

  async function correr() {
    setEstado("a-correr");
    setErro(null);
    try {
      const r = await fetch(
        `/api/admin/campanha/render-submit?semana=${semana}&slot=${slot}`,
        { method: "POST" }
      );
      const j = await r.json();
      if (!r.ok || j.erro) throw new Error(j.erro ?? `erro ${r.status}`);
      setEstado("ok");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
      setEstado("erro");
    }
  }

  return (
    <div>
      <button
        onClick={correr}
        disabled={estado === "a-correr"}
        className="text-xs px-3 py-1 rounded border border-[var(--borda-forte)] hover:bg-[var(--ambar)]/10 disabled:opacity-50"
      >
        {estado === "a-correr"
          ? "..."
          : estado === "ok"
          ? "lançado ✓"
          : rotulo ?? `render ${slot}`}
      </button>
      {erro && <div className="text-[10px] text-[var(--vermelho)] mt-1">{erro}</div>}
    </div>
  );
}
