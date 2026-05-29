"use client";

import { useState } from "react";

type Estado = "calmo" | "a-correr" | "ok" | "erro";

type Resposta = {
  ok?: boolean;
  total?: number;
  inseridos?: number;
  atualizados?: number;
  log?: string[];
  erro?: string;
  detalhe?: string;
};

export function BotaoSeed({
  url,
  titulo,
  descricao,
}: {
  url: string;
  titulo: string;
  descricao: string;
}) {
  const [estado, setEstado] = useState<Estado>("calmo");
  const [resposta, setResposta] = useState<Resposta | null>(null);

  async function correr() {
    setEstado("a-correr");
    setResposta(null);
    try {
      const r = await fetch(url, { method: "POST" });
      const texto = await r.text();
      let json: Resposta;
      try {
        json = JSON.parse(texto) as Resposta;
      } catch {
        // Vercel devolve "An error occurred..." em texto puro em timeouts
        // e gateway errors. Mostramos o início do corpo em vez de rebentar.
        const trecho = texto.trim().slice(0, 200);
        json = {
          erro: `${r.status} ${r.statusText || "resposta não-JSON"}`.trim(),
          detalhe: trecho || "(corpo vazio)",
        };
      }
      setResposta(json);
      setEstado(r.ok && !json.erro ? "ok" : "erro");
    } catch (e: unknown) {
      setResposta({ erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  return (
    <div className="estudio-card-elevado max-w-md">
      <div className="font-serif text-[15px]">{titulo}</div>
      <p className="text-xs text-[var(--texto-suave)] mt-1">{descricao}</p>
      <button
        onClick={correr}
        disabled={estado === "a-correr"}
        className="estudio-btn estudio-btn-primario mt-3"
      >
        {estado === "a-correr" ? "a correr..." : "correr"}
      </button>
      {resposta && (
        <div className="mt-3 text-xs">
          {estado === "ok" ? (
            <div className="text-[var(--verde)]">
              feito.{" "}
              {resposta.total != null && <span>total: {resposta.total}.</span>}{" "}
              {resposta.inseridos != null && (
                <span>inseridos: {resposta.inseridos}.</span>
              )}{" "}
              {resposta.atualizados != null && (
                <span>atualizados: {resposta.atualizados}.</span>
              )}
            </div>
          ) : (
            <div className="text-[var(--vermelho)]">
              erro: {resposta.erro ?? "desconhecido"}
              {resposta.detalhe && (
                <div className="mt-1 opacity-70">{resposta.detalhe}</div>
              )}
            </div>
          )}
          {resposta.log && resposta.log.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[var(--texto-mudo)]">
                log ({resposta.log.length} linhas)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-[var(--texto-suave)] break-all">
                {resposta.log.join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
