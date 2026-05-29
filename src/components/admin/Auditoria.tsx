"use client";

import { useEffect, useState } from "react";

type Auditoria = {
  ok: boolean;
  total: number;
  esperado: number;
  porSlot: { manha: number; tarde: number };
  porSemana: Array<{ semana: number; total: number; manha: number; tarde: number }>;
  problemas: {
    duplicados: Array<{ dia: number; slot: string; ids: string[]; total: number }>;
    manhaEmFalta: number[];
    tardeEmFalta: number[];
    semanaErrada: Array<{ id: string; dia: number; semanaActual: number | null; semanaCorrecta: number }>;
    semTexto: Array<{ id: string; dia: number; slot: string }>;
  };
  contagens: Record<string, number>;
  erro?: string;
};

export function Auditoria() {
  const [dados, setDados] = useState<Auditoria | null>(null);
  const [a, setA] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [estadoCorr, setEstadoCorr] = useState<"calmo" | "a-corrigir" | "ok" | "erro">("calmo");
  const [logCorr, setLogCorr] = useState<string[] | null>(null);

  async function carregar() {
    setA(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/campanha/auditoria");
      const j = (await r.json()) as Auditoria;
      if (!r.ok || j.erro) throw new Error(j.erro ?? `erro ${r.status}`);
      setDados(j);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setA(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function corrigir() {
    setEstadoCorr("a-corrigir");
    setLogCorr(null);
    try {
      const r = await fetch("/api/admin/campanha/auditoria/corrigir", { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.erro) throw new Error(j.erro ?? `erro ${r.status}`);
      setEstadoCorr("ok");
      setLogCorr(j.log ?? []);
      // Refrescar auditoria
      await carregar();
    } catch (e) {
      setEstadoCorr("erro");
      setLogCorr([(e instanceof Error ? e.message : "erro")]);
    }
  }

  if (a && !dados) {
    return <div className="text-sm text-[var(--texto-suave)]">a auditar...</div>;
  }
  if (erro) {
    return <div className="text-sm text-[var(--vermelho)]">{erro}</div>;
  }
  if (!dados) return null;

  const probs = dados.contagens;
  const totalProblemas =
    (probs.duplicados ?? 0) +
    (probs.semanaErrada ?? 0) +
    (probs.manhaEmFalta ?? 0) +
    (probs.tardeEmFalta ?? 0);

  return (
    <div className="estudio-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
            auditoria da campanha
          </div>
          <div className="font-serif text-lg mt-1">
            {dados.total} posts em base · {dados.porSlot.manha} manhã ·{" "}
            {dados.porSlot.tarde} tarde
            <span className="text-[var(--texto-mudo)] text-sm">
              {" "}(esperado {dados.esperado})
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={carregar}
          disabled={a}
          className="estudio-btn text-xs"
        >
          {a ? "..." : "voltar a auditar"}
        </button>
      </div>

      {totalProblemas === 0 ? (
        <div className="text-sm text-[var(--verde)]">
          ✓ Sem problemas detectados. Estrutura limpa.
        </div>
      ) : (
        <>
          <ul className="space-y-1.5 text-sm">
            {probs.duplicados > 0 && (
              <li className="text-[var(--vermelho)]">
                • {probs.duplicados} duplicados (mesmo dia+slot mais que uma linha)
                <details className="ml-3 mt-1">
                  <summary className="cursor-pointer text-[10px] text-[var(--texto-mudo)]">ver detalhe</summary>
                  <pre className="text-[10px] mt-1 text-[var(--texto-suave)]">
                    {dados.problemas.duplicados
                      .map((d) => `dia ${d.dia} ${d.slot}: ${d.total} linhas`)
                      .join("\n")}
                  </pre>
                </details>
              </li>
            )}
            {probs.semanaErrada > 0 && (
              <li className="text-[var(--ambar)]">
                • {probs.semanaErrada} posts com coluna semana errada (não bate com ceil(dia/7))
              </li>
            )}
            {probs.manhaEmFalta > 0 && (
              <li className="text-[var(--vermelho)]">
                • Manhã em falta nos dias:{" "}
                <span className="font-mono text-xs">
                  {dados.problemas.manhaEmFalta.join(", ")}
                </span>
              </li>
            )}
            {probs.tardeEmFalta > 0 && (
              <li className="text-[var(--ambar)]">
                • Tarde em falta nos dias:{" "}
                <span className="font-mono text-xs">
                  {dados.problemas.tardeEmFalta.join(", ")}
                </span>
              </li>
            )}
            {probs.semTexto > 0 && (
              <li className="text-[var(--texto-suave)]">
                • {probs.semTexto} posts sem texto_imagem (preencher manualmente
                ou correr seed outra vez)
              </li>
            )}
          </ul>

          {(probs.duplicados > 0 || probs.semanaErrada > 0) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={corrigir}
                disabled={estadoCorr === "a-corrigir"}
                className="estudio-btn estudio-btn-primario text-sm"
              >
                {estadoCorr === "a-corrigir"
                  ? "a corrigir..."
                  : estadoCorr === "ok"
                  ? "corrigido ✓"
                  : "corrigir duplicados + semanas"}
              </button>
              <p className="text-[10px] text-[var(--texto-mudo)] mt-2 max-w-leitura">
                Apaga as linhas duplicadas (mantém a mais antiga, que é a do
                seed). Ajusta a coluna semana onde estiver errada. Não toca
                em estado nem em agendamentos. Para preencher dias em falta,
                é mais seguro correr os seeds + gerar-tarde outra vez (são
                idempotentes).
              </p>
              {logCorr && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[10px] text-[var(--texto-mudo)]">
                    log ({logCorr.length} linhas)
                  </summary>
                  <pre className="text-[10px] mt-1 text-[var(--texto-suave)] whitespace-pre-wrap">
                    {logCorr.join("\n")}
                  </pre>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
