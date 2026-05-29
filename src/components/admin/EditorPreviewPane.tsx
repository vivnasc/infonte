"use client";

import { useEffect, useState } from "react";

type SlideInfo = {
  idx: number;
  modo: "capa" | "conteudo" | "cta";
  layout?: string;
  temImagem: boolean;
};

const ROTULO_MODO: Record<SlideInfo["modo"], string> = {
  capa: "capa",
  conteudo: "conteúdo",
  cta: "cta",
};

type Props = {
  dia: number;
  slot: string;
  refreshKey?: number | string;
  onSlidesCarregados?: (slides: SlideInfo[]) => void;
  slideActual?: number;
  setSlideActual?: (n: number) => void;
};

// Painel esquerdo do editor: preview tamanho grande, slide actual,
// botões anterior/próximo. Sem lista lateral (essa fica no painel
// direito).
export function EditorPreviewPane({
  dia,
  slot,
  refreshKey,
  onSlidesCarregados,
  slideActual: ctrlSlide,
  setSlideActual: ctrlSet,
}: Props) {
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const [interno, setInterno] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  const actual = ctrlSlide ?? interno;
  const setActual = ctrlSet ?? setInterno;

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setErro(null);
      try {
        const r = await fetch(`/api/admin/campanha/${dia}/preview?slot=${slot}`);
        const j = await r.json();
        if (cancelado) return;
        if (!r.ok) {
          setErro(j.erro ?? `erro ${r.status}`);
          return;
        }
        const ss = (j.slides ?? []) as SlideInfo[];
        setSlides(ss);
        onSlidesCarregados?.(ss);
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : "erro");
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [dia, slot, refreshKey, onSlidesCarregados]);

  if (erro) {
    return (
      <div className="estudio-card-elevado text-xs text-[var(--vermelho)]">
        {erro}
      </div>
    );
  }
  if (slides.length === 0) {
    return (
      <div className="estudio-card-elevado text-xs text-[var(--texto-suave)]">
        sem slides para mostrar
      </div>
    );
  }

  const slideObj = slides[actual - 1];
  const total = slides.length;
  const src = `/api/admin/campanha/${dia}/preview?slot=${slot}&slide=${actual}&v=${refreshKey ?? ""}`;

  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
        preview
      </div>

      <div
        className="relative bg-black rounded overflow-hidden border border-[var(--borda)] w-full"
        style={{ aspectRatio: "1080 / 1350" }}
      >
        <iframe
          key={src}
          src={src}
          title={`Slide ${actual}`}
          className="absolute inset-0 w-full h-full"
          style={{
            transform: "scale(0.30)",
            transformOrigin: "top left",
            width: "333%",
            height: "333%",
            border: "0",
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setActual(Math.max(1, actual - 1))}
          disabled={actual === 1}
          className="estudio-btn text-xs px-3 py-1.5 disabled:opacity-40"
        >
          ←
        </button>
        <span className="text-[var(--texto-suave)]">
          slide {actual} de {total} · {ROTULO_MODO[slideObj.modo]}
        </span>
        <button
          type="button"
          onClick={() => setActual(Math.min(total, actual + 1))}
          disabled={actual === total}
          className="estudio-btn text-xs px-3 py-1.5 disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}
