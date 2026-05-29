"use client";

import { useEffect, useState } from "react";

type UltimoJob = {
  ok: boolean;
  temUltimo: boolean;
  jobId?: string;
  slot?: string;
  strategy?: string;
  inicio?: number;
  fim?: number;
  gerados?: number;
  reusados?: number;
  saltados?: number;
  errorSlot?: number | null;
  criadoEm?: string;
  erro?: string;
};

export function CardRetoma() {
  const [job, setJob] = useState<UltimoJob | null>(null);
  const [estado, setEstado] = useState<"calmo" | "a-retomar" | "ok" | "erro">("calmo");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/campanha/imagens-replicate/ultimo-job")
      .then((r) => r.json())
      .then((j) => setJob(j))
      .catch(() => setJob(null));
  }, []);

  if (!job || !job.temUltimo || job.errorSlot == null) return null;

  async function retomar() {
    if (!job?.errorSlot || !job.fim || !job.slot) return;
    setEstado("a-retomar");
    setErro(null);
    try {
      const r = await fetch(
        `/api/admin/campanha/imagens-replicate?inicio=${job.errorSlot}&fim=${job.fim}&slot=${job.slot}&strategy=${job.strategy ?? "prefer-existing"}`,
        { method: "POST" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`);
      setEstado("ok");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
      setEstado("erro");
    }
  }

  const quando = job.criadoEm
    ? new Date(job.criadoEm).toLocaleString("pt-PT")
    : "?";

  return (
    <div
      className="estudio-card-elevado mb-4"
      style={{ borderColor: "var(--vermelho)", borderWidth: 1 }}
    >
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--vermelho)]">
        última corrida parou
      </div>
      <div className="font-serif text-base text-[var(--texto)] mt-1">
        Job {job.jobId} ({job.slot}) parou no dia {job.errorSlot}.
      </div>
      <div className="text-xs text-[var(--texto-suave)] mt-1">
        {quando} · gerados {job.gerados ?? 0}, reusados {job.reusados ?? 0}
      </div>
      <button
        type="button"
        onClick={retomar}
        disabled={estado === "a-retomar" || estado === "ok"}
        className="estudio-btn mt-3 text-xs"
      >
        {estado === "a-retomar"
          ? "a retomar..."
          : estado === "ok"
          ? "retomado ✓"
          : `retomar do dia ${job.errorSlot} → ${job.fim}`}
      </button>
      {erro && <div className="text-[10px] text-[var(--vermelho)] mt-2">{erro}</div>}
    </div>
  );
}
