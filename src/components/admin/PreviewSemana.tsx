"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";

// Mini-preview de 3 slides (capa + meio + cta) de um dia, dentro do
// próprio modo guiado. Não dispara render nenhum — é só HTML em iframe.
//
// Serve para a Vivianne ver a estética antes de gastar minutos do GH
// Actions a renderizar PNGs HD.

export function PreviewSemana({ semana, slot }: { semana: number; slot: "manha" | "tarde" }) {
  const [aberto, setAberto] = useState(false);

  const diaInicio = (semana - 1) * 7 + 1;
  const diaFim = Math.min(30, semana * 7);
  const diasAmostra = [diaInicio, Math.floor((diaInicio + diaFim) / 2), diaFim];

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="text-xs px-3 py-1 rounded border border-[var(--borda-forte)] hover:bg-[var(--ambar)]/10"
      >
        {aberto ? "esconder pré-visualização" : `pré-visualizar semana ${semana} (3 dias)`}
      </button>

      {aberto && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)] mb-2">
            slide 1 de cada dia, sem render — só HTML
          </div>
          <div className="grid grid-cols-3 gap-3">
            {diasAmostra.map((dia) => (
              <div key={dia}>
                <div
                  className="relative bg-black rounded overflow-hidden border border-[var(--borda)]"
                  style={{ aspectRatio: "1080 / 1350" }}
                >
                  <iframe
                    src={`/api/admin/campanha/${dia}/preview?slot=${slot}&slide=1`}
                    title={`Dia ${dia}`}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      transform: "scale(0.27)",
                      transformOrigin: "top left",
                      width: "370%",
                      height: "370%",
                      border: "0",
                    }}
                  />
                </div>
                <div className="text-[10px] text-[var(--texto-suave)] mt-1 text-center">
                  <Link
                    href={`/admin/campanha/${dia}?slot=${slot}`}
                    className="hover:text-[var(--ambar)]"
                  >
                    dia {dia} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[var(--texto-suave)] mt-2">
            Se aprovas a estética, podes lançar o render HD da semana
            ({slot}). Se não, abre um dia e ajusta antes — gerar imagem,
            mudar layout, mudar texto.
          </div>
        </div>
      )}
    </div>
  );
}
