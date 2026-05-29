"use client";

import { useState } from "react";

type Resposta = {
  ok?: boolean;
  atualizados?: number;
  jobs_analisados?: number;
  log?: string[];
  erro?: string;
};

export function BotaoSyncRender() {
  const [estado, setEstado] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [resposta, setResposta] = useState<Resposta | null>(null);

  async function correr() {
    setEstado("a-correr");
    setResposta(null);
    try {
      const r = await fetch("/api/admin/campanha/render-submit/sync", { method: "POST" });
      const j = (await r.json()) as Resposta;
      setResposta(j);
      setEstado(r.ok && j.ok ? "ok" : "erro");
    } catch (e) {
      setResposta({ erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  return (
    <div className="estudio-card-elevado max-w-md">
      <div className="font-serif text-[15px]">Sincronizar estado dos renders</div>
      <p className="text-xs text-[var(--texto-suave)] mt-1">
        Lê os <code className="text-[var(--ambar)]">result.json</code> dos últimos
        jobs de GitHub Actions e marca cada dia como{" "}
        <span className="text-[var(--verde)]">pronto</span> ou{" "}
        <span className="text-[var(--vermelho)]">falhou</span>. Não toca em agendados.
      </p>
      <button
        onClick={correr}
        disabled={estado === "a-correr"}
        className="estudio-btn mt-3"
      >
        {estado === "a-correr" ? "a sincronizar..." : "sincronizar agora"}
      </button>
      {resposta && (
        <div className="mt-3 text-xs">
          {estado === "ok" ? (
            <div className="text-[var(--verde)]">
              {resposta.atualizados ?? 0} dias actualizados de {resposta.jobs_analisados ?? 0} jobs.
            </div>
          ) : (
            <div className="text-[var(--vermelho)]">erro: {resposta.erro}</div>
          )}
          {resposta.log && resposta.log.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[var(--texto-mudo)]">
                log ({resposta.log.length} linhas)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-[var(--texto-suave)]">
                {resposta.log.join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
