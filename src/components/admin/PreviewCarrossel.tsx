"use client";

import { useEffect, useState } from "react";

type SlideInfo = {
  idx: number;
  modo: "capa" | "conteudo" | "cta";
  layout?: string;
  temImagem: boolean;
};

type Props = {
  dia: number;
  slot: string;
  // Trigger para forçar refresh quando o utilizador grava ou regera
  // imagens. Passar a timestamp/contador externo.
  refreshKey?: number | string;
};

const ROTULO_MODO: Record<SlideInfo["modo"], string> = {
  capa: "capa",
  conteudo: "conteúdo",
  cta: "cta",
};

export function PreviewCarrossel({ dia, slot, refreshKey }: Props) {
  const [slides, setSlides] = useState<SlideInfo[] | null>(null);
  const [actual, setActual] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [a, setA] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setA(true);
      setErro(null);
      try {
        const r = await fetch(`/api/admin/campanha/${dia}/preview?slot=${slot}`);
        const j = await r.json();
        if (cancelado) return;
        if (!r.ok) {
          setErro(j.erro ?? `erro ${r.status}`);
          setSlides(null);
        } else {
          setSlides(j.slides ?? []);
          setActual((cur) => Math.min(cur, j.slides?.length ?? 1) || 1);
        }
      } catch (e) {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : "erro");
          setSlides(null);
        }
      } finally {
        if (!cancelado) setA(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [dia, slot, refreshKey]);

  if (a && !slides) {
    return (
      <div className="estudio-card-elevado text-center text-sm text-[var(--texto-suave)]">
        a montar pré-visualização...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="estudio-card-elevado text-sm text-[var(--vermelho)]">
        Pré-visualização indisponível: {erro}
      </div>
    );
  }

  if (!slides || slides.length === 0) return null;

  const total = slides.length;
  const slideActual = slides[actual - 1];
  // Cache buster para o iframe refrescar quando refreshKey mudar.
  const src = `/api/admin/campanha/${dia}/preview?slot=${slot}&slide=${actual}&v=${refreshKey ?? ""}`;

  return (
    <div className="estudio-card-elevado">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
          pré-visualização do carrossel
        </div>
        <div className="text-[11px] text-[var(--texto-mudo)]">
          slide {actual} de {total} · {ROTULO_MODO[slideActual.modo]}
          {slideActual.layout ? ` · ${slideActual.layout}` : ""}
        </div>
      </div>

      <div className="grid sm:grid-cols-[180px_1fr] gap-4 items-start">
        <ul className="space-y-1">
          {slides.map((s) => {
            const activo = s.idx === actual;
            return (
              <li key={s.idx}>
                <button
                  type="button"
                  onClick={() => setActual(s.idx)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    activo
                      ? "bg-[var(--ambar)]/15 text-[var(--ambar-claro)] border border-[var(--ambar)]/30"
                      : "text-[var(--texto-suave)] hover:bg-[var(--ambar)]/5 border border-transparent"
                  }`}
                >
                  <span className="font-mono">{String(s.idx).padStart(2, "0")}</span>
                  <span className="mx-2">·</span>
                  <span>{ROTULO_MODO[s.modo]}</span>
                  {s.temImagem && (
                    <span className="ml-2 text-[var(--oliva)]">·imagem</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div>
          <div
            className="relative w-full bg-black rounded overflow-hidden border border-[var(--borda)]"
            style={{ aspectRatio: "1080 / 1350" }}
          >
            <iframe
              key={src}
              src={src}
              title={`Slide ${actual} de ${total}`}
              className="absolute inset-0 w-full h-full"
              style={{
                transform: "scale(0.33)",
                transformOrigin: "top left",
                width: "303%",
                height: "303%",
                border: "0",
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => setActual((a) => Math.max(1, a - 1))}
              disabled={actual === 1}
              className="estudio-btn text-xs px-3 py-1.5 disabled:opacity-40"
            >
              ← anterior
            </button>
            <button
              type="button"
              onClick={() => setActual((a) => Math.min(total, a + 1))}
              disabled={actual === total}
              className="estudio-btn text-xs px-3 py-1.5 disabled:opacity-40"
            >
              próximo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
