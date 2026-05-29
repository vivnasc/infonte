"use client";

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

// Painel direito do editor: lista vertical de slides com o actual
// destacado. Estilo SyncHim.
export function EditorSlidesNav({
  slides,
  actual,
  onSelecionar,
}: {
  slides: SlideInfo[];
  actual: number;
  onSelecionar: (idx: number) => void;
}) {
  if (slides.length === 0) return null;
  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
        slides ({slides.length})
      </div>
      <ul className="space-y-1">
        {slides.map((s) => {
          const activo = s.idx === actual;
          return (
            <li key={s.idx}>
              <button
                type="button"
                onClick={() => onSelecionar(s.idx)}
                className={`w-full text-left px-2 py-2 rounded text-xs transition-colors ${
                  activo
                    ? "bg-[var(--ambar)]/15 text-[var(--ambar-claro)] border border-[var(--ambar)]/30"
                    : "text-[var(--texto-suave)] hover:bg-[var(--ambar)]/5 border border-transparent"
                }`}
              >
                <span className="font-mono mr-2">
                  {String(s.idx).padStart(2, "0")}
                </span>
                <span>{ROTULO_MODO[s.modo]}</span>
                {s.temImagem && (
                  <span className="ml-2 text-[var(--oliva)]">·imagem</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
