"use client";

import { useState } from "react";

type Resp = { ok?: boolean; repostos?: number; mensagem?: string; erro?: string };

export function BotaoResetRendering({ rendering }: { rendering: number }) {
  const [estado, setEstado] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [resp, setResp] = useState<Resp | null>(null);

  if (rendering === 0 && estado !== "ok") return null;

  async function reset() {
    setEstado("a-correr");
    setResp(null);
    try {
      const r = await fetch("/api/admin/campanha/reset-rendering", { method: "POST" });
      const j = (await r.json()) as Resp;
      if (!r.ok || j.erro) throw new Error(j.erro ?? `erro ${r.status}`);
      setResp(j);
      setEstado("ok");
    } catch (e) {
      setResp({ erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  return (
    <div
      className="estudio-card"
      style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--ambar)]">
        atenção
      </div>
      <div className="font-serif text-base mt-1">
        {rendering} dias presos em <em>rendering</em>
      </div>
      <p className="text-xs text-[var(--texto-suave)] mt-2 max-w-leitura">
        Acontece quando um workflow do GitHub Actions falhou antes de
        terminar (ex: bug Node 20 que já corrigi). Como não chegou a
        escrever um resultado, ficam presos. Clica para devolvê-los a
        rascunho e recomeça do zero, com a versão certa.
      </p>
      <button
        onClick={reset}
        disabled={estado === "a-correr"}
        className="estudio-btn estudio-btn-primario mt-3 disabled:opacity-50"
      >
        {estado === "a-correr"
          ? "a repor..."
          : estado === "ok"
          ? `${resp?.repostos ?? 0} repostos ✓`
          : `repor ${rendering} dias a rascunho`}
      </button>
      {resp?.erro && (
        <div className="text-xs text-[var(--vermelho)] mt-2">{resp.erro}</div>
      )}
    </div>
  );
}
