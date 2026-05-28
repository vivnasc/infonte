"use client";

import { useState } from "react";

type Estado = "calmo" | "a-testar" | "ok" | "erro";

type Resultado = {
  ok: boolean;
  erro?: string;
  detalhe?: string;
  dica?: string;
  [k: string]: unknown;
};

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
      setResultado(j);
      setEstado(j.ok ? "ok" : "erro");
    } catch (e) {
      setResultado({ ok: false, erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  const cor =
    estado === "ok"
      ? "bg-oliva/20 text-oliva border-oliva/30"
      : estado === "erro"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-creme border-castanho/20 text-castanho/80";

  return (
    <div className={`flex-1 min-w-[200px] p-3 rounded-lg border ${cor}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-sm">{nome}</span>
        <button
          onClick={testar}
          disabled={estado === "a-testar"}
          className="text-xs px-2 py-1 rounded border border-current/30 hover:bg-current/10 disabled:opacity-50"
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
      <p className="text-[11px] text-castanho/60 mt-1">{legenda}</p>
      {resultado && (
        <div className="mt-2 text-[11px]">
          {resultado.ok ? (
            <span className="text-oliva block space-y-0.5">
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
                          <span className="text-oliva">todas ok</span>
                        ) : (
                          <span className="text-red-700">faltam {faltam.join(", ")}</span>
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
            <span className="text-red-700">
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
