"use client";

import { useEffect, useMemo, useState } from "react";

type Strategy = "always-new" | "prefer-existing" | "reuse-only";

type Estimativa = {
  ok: boolean;
  dias_total: number;
  dias_com_imagem: number;
  dias_por_gerar: number;
  custo: number;
  tempo_seg: number;
};

type Resposta = {
  ok?: boolean;
  jobId?: string;
  gerados?: number;
  reusados?: number;
  saltados?: number;
  errorSlot?: number | null;
  log?: string[];
  erro?: string;
  detalhe?: string;
};

type Props = {
  inicio: number;
  fim: number;
  slot: "manha" | "tarde";
  titulo: string;
  defaultStrategy?: Strategy;
};

const ROTULO_STRATEGY: Record<Strategy, string> = {
  "always-new": "sempre gerar",
  "prefer-existing": "reusar se existir",
  "reuse-only": "só reusar (sem Replicate)",
};

export function BotaoBulkImagens({ inicio, fim, slot, titulo, defaultStrategy }: Props) {
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy ?? "prefer-existing");
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null);
  const [estado, setEstado] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [resposta, setResposta] = useState<Resposta | null>(null);

  const urlEstimativa = useMemo(
    () =>
      `/api/admin/campanha/imagens-replicate/estimativa?inicio=${inicio}&fim=${fim}&slot=${slot}&strategy=${strategy}`,
    [inicio, fim, slot, strategy]
  );

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      try {
        const r = await fetch(urlEstimativa);
        const j = await r.json();
        if (!cancelado && r.ok) setEstimativa(j);
      } catch {
        // silencioso, a estimativa é só informativa
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [urlEstimativa]);

  async function correr() {
    setEstado("a-correr");
    setResposta(null);
    try {
      const r = await fetch(
        `/api/admin/campanha/imagens-replicate?inicio=${inicio}&fim=${fim}&slot=${slot}&strategy=${strategy}`,
        { method: "POST" }
      );
      const texto = await r.text();
      let j: Resposta;
      try {
        j = JSON.parse(texto);
      } catch {
        j = { erro: `resposta não-JSON (${r.status})`, detalhe: texto.slice(0, 200) };
      }
      setResposta(j);
      setEstado(j.ok ? "ok" : "erro");
    } catch (e) {
      setResposta({ erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  const custoFmt = estimativa ? `$${estimativa.custo.toFixed(2)}` : "...";
  const tempoFmt = estimativa
    ? estimativa.tempo_seg < 60
      ? `${estimativa.tempo_seg}s`
      : `${Math.ceil(estimativa.tempo_seg / 60)}min`
    : "...";

  return (
    <div className="estudio-card-elevado max-w-md">
      <div className="font-serif text-[15px]">{titulo}</div>

      <div className="mt-2 text-[11px] text-[var(--texto-suave)] space-y-0.5">
        {estimativa ? (
          <>
            <div>
              {estimativa.dias_por_gerar} a gerar de {estimativa.dias_total}
              {estimativa.dias_com_imagem > 0 && (
                <span className="text-[var(--texto-mudo)]">
                  {" · "}{estimativa.dias_com_imagem} já têm imagem
                </span>
              )}
            </div>
            <div>
              <span className="text-[var(--ambar)]">{custoFmt}</span>
              <span className="text-[var(--texto-mudo)]"> · ~{tempoFmt}</span>
            </div>
          </>
        ) : (
          <div className="text-[var(--texto-mudo)]">a estimar...</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as Strategy)}
          className="text-xs bg-black/30 border border-[var(--borda)] rounded px-2 py-1 text-[var(--texto)]"
        >
          {(Object.keys(ROTULO_STRATEGY) as Strategy[]).map((s) => (
            <option key={s} value={s}>
              {ROTULO_STRATEGY[s]}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={correr}
        disabled={estado === "a-correr" || (estimativa?.dias_por_gerar ?? 0) === 0}
        className="estudio-btn estudio-btn-primario mt-3 disabled:opacity-50"
      >
        {estado === "a-correr"
          ? "a correr..."
          : (estimativa?.dias_por_gerar ?? 0) === 0
          ? "nada para gerar"
          : "correr"}
      </button>

      {resposta && (
        <div className="mt-3 text-xs">
          {estado === "ok" ? (
            <div className="text-[var(--verde)]">
              {resposta.gerados != null && <span>gerados: {resposta.gerados}. </span>}
              {resposta.reusados != null && resposta.reusados > 0 && (
                <span>reusados: {resposta.reusados}. </span>
              )}
              {resposta.saltados != null && resposta.saltados > 0 && (
                <span>saltados: {resposta.saltados}. </span>
              )}
            </div>
          ) : (
            <div className="text-[var(--vermelho)]">
              erro: {resposta.erro ?? "desconhecido"}
              {resposta.errorSlot != null && (
                <span> no dia {resposta.errorSlot}</span>
              )}
              {resposta.detalhe && <div className="mt-1 opacity-70">{resposta.detalhe}</div>}
            </div>
          )}

          {estado === "ok" && (
            <div className="mt-2 flex flex-wrap gap-2 text-[var(--ambar)]">
              <span className="text-[var(--texto-mudo)]">ver →</span>
              {Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i).slice(0, 6).map((d) => (
                <a
                  key={d}
                  href={`/admin/campanha/${d}?slot=${slot}`}
                  className="hover:underline"
                >
                  dia {d}
                </a>
              ))}
              <a href="/admin/biblioteca" className="hover:underline text-[var(--ambar-claro)]">
                · biblioteca completa
              </a>
            </div>
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
