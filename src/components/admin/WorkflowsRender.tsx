"use client";

import { useEffect, useState } from "react";

type Run = {
  id: number;
  titulo: string;
  status: "queued" | "in_progress" | "completed" | "waiting";
  conclusao: "success" | "failure" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
  criadoEm: string;
  iniciadoEm: string;
  evento: string;
};

const ROTULO_STATUS: Record<string, { texto: string; cor: string }> = {
  queued: { texto: "na fila", cor: "estudio-pill rascunho" },
  in_progress: { texto: "a correr", cor: "estudio-pill rendering" },
  waiting: { texto: "à espera", cor: "estudio-pill rascunho" },
  completed_success: { texto: "ok", cor: "estudio-pill pronto" },
  completed_failure: { texto: "falhou", cor: "estudio-pill failed" },
  completed_cancelled: { texto: "cancelado", cor: "estudio-pill rascunho" },
  completed_timed_out: { texto: "timeout", cor: "estudio-pill failed" },
  completed_skipped: { texto: "saltado", cor: "estudio-pill rascunho" },
  completed_action_required: { texto: "acção", cor: "estudio-pill agendado" },
};

function classificar(r: Run) {
  if (r.status === "completed") {
    const chave = `completed_${r.conclusao ?? "skipped"}`;
    return ROTULO_STATUS[chave] ?? { texto: r.conclusao ?? "?", cor: "estudio-pill rascunho" };
  }
  return ROTULO_STATUS[r.status] ?? { texto: r.status, cor: "estudio-pill rascunho" };
}

function tempoDesde(iso: string): string {
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return `há ${seg}s`;
  if (seg < 3600) return `há ${Math.floor(seg / 60)}min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)}h`;
  return `há ${Math.floor(seg / 86400)}d`;
}

export function WorkflowsRender() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [a, setA] = useState(false);
  const [cancelando, setCancelando] = useState<number | null>(null);

  async function carregar() {
    setA(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/campanha/workflows/listar");
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`);
      setRuns(j.runs ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
    } finally {
      setA(false);
    }
  }

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 15000);
    return () => clearInterval(t);
  }, []);

  async function cancelar(runId: number) {
    setCancelando(runId);
    try {
      const r = await fetch("/api/admin/campanha/workflows/cancelar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`);
      await carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "erro");
    } finally {
      setCancelando(null);
    }
  }

  if (a && !runs) {
    return <div className="text-sm text-[var(--texto-suave)]">a carregar workflows...</div>;
  }

  if (erro) {
    return (
      <div className="estudio-card-elevado">
        <div className="text-sm text-[var(--vermelho)]">{erro}</div>
        <button onClick={carregar} className="estudio-btn text-xs mt-2">voltar a tentar</button>
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="estudio-card-elevado">
        <div className="text-sm text-[var(--texto-suave)]">
          Ainda não há runs do workflow de render HD.
        </div>
      </div>
    );
  }

  const aCorrer = runs.filter((r) => r.status === "in_progress" || r.status === "queued");

  return (
    <div className="estudio-card">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
            workflows de render HD
          </div>
          <div className="font-serif text-lg mt-1">
            {aCorrer.length > 0
              ? `${aCorrer.length} a correr agora`
              : "sem nada em execução"}
          </div>
        </div>
        <button onClick={carregar} disabled={a} className="estudio-btn text-xs disabled:opacity-50">
          {a ? "..." : "actualizar"}
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] text-left border-b border-[var(--borda)]">
            <th className="py-2 pr-3">run</th>
            <th className="py-2 pr-3">estado</th>
            <th className="py-2 pr-3">quando</th>
            <th className="py-2 pr-3">acção</th>
          </tr>
        </thead>
        <tbody>
          {runs.slice(0, 8).map((r) => {
            const c = classificar(r);
            const podeCancelar = r.status === "in_progress" || r.status === "queued";
            return (
              <tr key={r.id} className="border-b border-[var(--borda)] last:border-0">
                <td className="py-2.5 pr-3 font-mono text-[10px] text-[var(--texto-suave)]">
                  #{r.id}
                </td>
                <td className="py-2.5 pr-3">
                  <span className={c.cor}>{c.texto}</span>
                </td>
                <td className="py-2.5 pr-3 text-xs text-[var(--texto-suave)]">
                  {tempoDesde(r.criadoEm)}
                </td>
                <td className="py-2.5 pr-3">
                  {podeCancelar ? (
                    <button
                      onClick={() => cancelar(r.id)}
                      disabled={cancelando === r.id}
                      className="text-xs px-2 py-1 rounded border border-[var(--vermelho)]/40 text-[var(--vermelho)] hover:bg-[var(--vermelho)]/10 disabled:opacity-50"
                    >
                      {cancelando === r.id ? "..." : "cancelar"}
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--texto-mudo)]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[10px] text-[var(--texto-mudo)] mt-3">
        Auto-actualiza a cada 15 segundos. Não precisas de abrir o GitHub
        para nada — quando um run termina, o sync no painel promove os
        dias correspondentes a <em>pronto</em> ou <em>failed</em>.
      </p>
    </div>
  );
}
