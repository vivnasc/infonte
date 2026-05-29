"use client";

import { useEffect, useState } from "react";

type Estado = "calmo" | "a-testar" | "ok" | "erro";

type Resultado = {
  ok: boolean;
  erro?: string;
  detalhe?: string;
  dica?: string;
  [k: string]: unknown;
};

type CacheValor = {
  resultado: Resultado;
  estado: "ok" | "erro";
  ts: number;
};

function chaveCache(url: string): string {
  return `infonte:diag:${url}`;
}

function lerCache(url: string): CacheValor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(chaveCache(url));
    if (!raw) return null;
    return JSON.parse(raw) as CacheValor;
  } catch {
    return null;
  }
}

function escreverCache(url: string, v: CacheValor): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chaveCache(url), JSON.stringify(v));
  } catch {}
}

function quandoFmt(ts: number): string {
  const d = new Date(ts);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (mesmoDia) return `${hh}:${mm}`;
  return `${d.getDate()}/${d.getMonth() + 1} ${hh}:${mm}`;
}

function Pastilha({
  nome,
  url,
  legenda,
}: {
  nome: string;
  url: string;
  legenda: string;
}) {
  const [estado, setEstado] = useState<Estado>("calmo");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [quando, setQuando] = useState<number | null>(null);

  // Restaurar resultado anterior do localStorage ao montar
  useEffect(() => {
    const cache = lerCache(url);
    if (cache) {
      setResultado(cache.resultado);
      setEstado(cache.estado);
      setQuando(cache.ts);
    }
  }, [url]);

  async function testar() {
    setEstado("a-testar");
    setResultado(null);
    try {
      const r = await fetch(url);
      const texto = await r.text();
      let j: Resultado;
      try {
        j = JSON.parse(texto);
      } catch {
        j = { ok: false, erro: `resposta não-JSON (${r.status})`, detalhe: texto.slice(0, 200) };
      }
      const novoEstado: "ok" | "erro" = j.ok ? "ok" : "erro";
      const ts = Date.now();
      setResultado(j);
      setEstado(novoEstado);
      setQuando(ts);
      escreverCache(url, { resultado: j, estado: novoEstado, ts });
    } catch (e) {
      const j: Resultado = { ok: false, erro: e instanceof Error ? e.message : "erro" };
      const ts = Date.now();
      setResultado(j);
      setEstado("erro");
      setQuando(ts);
      escreverCache(url, { resultado: j, estado: "erro", ts });
    }
  }

  const corBorda =
    estado === "ok"
      ? "border-[var(--verde)]/50"
      : estado === "erro"
      ? "border-[var(--vermelho)]/50"
      : "border-[var(--borda)]";

  return (
    <div className={`flex-1 min-w-[220px] estudio-card-elevado border ${corBorda}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-sm">{nome}</span>
        <button
          onClick={testar}
          disabled={estado === "a-testar"}
          className="text-[11px] px-2 py-1 rounded border border-[var(--borda-forte)] hover:bg-[var(--ambar)]/10 disabled:opacity-50"
        >
          {estado === "a-testar"
            ? "a testar..."
            : estado === "ok"
            ? "ok ✓"
            : estado === "erro"
            ? "voltar a testar"
            : "testar"}
        </button>
      </div>
      <p className="text-[11px] text-[var(--texto-suave)] mt-1">{legenda}</p>
      {quando && (
        <p className="text-[10px] text-[var(--texto-mudo)] mt-0.5">
          última verificação: {quandoFmt(quando)}
        </p>
      )}
      {resultado && (
        <div className="mt-2 text-[11px]">
          {resultado.ok ? (
            <span className="text-[var(--verde)] block space-y-0.5">
              {Object.entries(resultado)
                .filter(([k]) => k !== "ok")
                .map(([k, v]) => {
                  if (v == null) return null;
                  if (Array.isArray(v)) {
                    return v.length > 0 ? (
                      <span key={k} className="block">
                        {k}: {v.join(", ")}
                      </span>
                    ) : null;
                  }
                  if (typeof v === "object") {
                    const entries = Object.entries(v as Record<string, unknown>);
                    const faltam = entries.filter(([, val]) => val === false).map(([kk]) => kk);
                    return (
                      <span key={k} className="block">
                        {k}:{" "}
                        {faltam.length === 0 ? (
                          <span className="text-[var(--verde)]">todas ok</span>
                        ) : (
                          <span className="text-[var(--vermelho)]">faltam {faltam.join(", ")}</span>
                        )}
                      </span>
                    );
                  }
                  return (
                    <span key={k} className="block">
                      {k}: {String(v)}
                    </span>
                  );
                })}
            </span>
          ) : (
            <span className="text-[var(--vermelho)]">
              {resultado.erro}
              {resultado.dica && <span className="block opacity-80">↳ {resultado.dica}</span>}
              {resultado.detalhe && (
                <span className="block opacity-70 mt-1 break-all">{resultado.detalhe}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function Diagnostico() {
  return (
    <div className="flex flex-wrap gap-3">
      <Pastilha
        nome="Deploy + envs"
        url="/api/admin/auth/debug"
        legenda="SHA do deploy actual e env vars críticas."
      />
      <Pastilha
        nome="Claude API"
        url="/api/admin/test-claude"
        legenda="Posts da tarde e prompts das imagens."
      />
      <Pastilha
        nome="Replicate / FLUX"
        url="/api/admin/test-replicate"
        legenda="Imagens automáticas."
      />
      <Pastilha
        nome="GitHub Actions"
        url="/api/admin/test-github"
        legenda="Render HD dos slides."
      />
    </div>
  );
}
