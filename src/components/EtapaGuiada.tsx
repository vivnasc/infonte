"use client";

import { useEffect, useRef, useState } from "react";
import type { Passo, Parte } from "@/lib/etapas/passos";
import { CampoResposta } from "./CampoResposta";
import { EsvaziarMesa } from "./EsvaziarMesa";
import { Assinatura } from "./Assinatura";

function ParteView({
  parte,
  respostas,
}: {
  parte: Parte;
  respostas: Record<string, string>;
}) {
  if (parte.tipo === "html") {
    return (
      <div
        className="prose-infonte"
        dangerouslySetInnerHTML={{ __html: parte.html }}
      />
    );
  }
  if (parte.tipo === "campo") {
    // A etapa 1 ("esvaziar a mesa") tem uma ferramenta interactiva própria.
    if (parte.bloco_id === "esvaziamento_etapa_1") {
      return (
        <EsvaziarMesa
          bloco_id={parte.bloco_id}
          valorInicial={respostas[parte.bloco_id] ?? ""}
        />
      );
    }
    return (
      <CampoResposta
        bloco_id={parte.bloco_id}
        valor_inicial={respostas[parte.bloco_id] ?? ""}
      />
    );
  }
  if (parte.tipo === "mostrar") {
    const valor = respostas[parte.bloco_id];
    return (
      <blockquote className="my-8 px-5 py-4 border-l-4 border-ocre/60 bg-creme/60 italic font-serif whitespace-pre-wrap">
        {valor && valor.trim().length > 0
          ? valor
          : "(não preencheste esta, podes voltar a ela.)"}
      </blockquote>
    );
  }
  if (parte.tipo === "assinatura") {
    return <Assinatura valores={parte.valores} />;
  }
  return null;
}

export function EtapaGuiada({
  passos,
  respostas,
  children,
}: {
  passos: Passo[];
  respostas: Record<string, string>;
  children?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const topo = useRef<HTMLDivElement>(null);
  const primeiraRender = useRef(true);

  const total = passos.length;
  const noFim = i >= total - 1;

  useEffect(() => {
    if (primeiraRender.current) {
      primeiraRender.current = false;
      return;
    }
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [i]);

  if (total === 0) return <>{children}</>;

  return (
    <div className="max-w-leitura mx-auto" ref={topo}>
      {/* progresso */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {passos.map((_, idx) => (
          <button
            key={idx}
            aria-label={`passo ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i
                ? "w-8 bg-ocre"
                : idx < i
                  ? "w-3 bg-ocre/50"
                  : "w-3 bg-castanho/15"
            }`}
          />
        ))}
      </div>

      {/* passos: todos montados, só o activo visível (preserva o campo) */}
      <div className="relative">
        {passos.map((p, idx) => (
          <div
            key={idx}
            data-activo={idx === i}
            className="etapa-passo"
          >
            {(p.rotulo || p.titulo) && (
              <div className="text-center mb-8">
                {p.rotulo && (
                  <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-oliva">
                    {p.rotulo}
                  </p>
                )}
                {p.titulo && (
                  <h2 className="font-serif text-2xl md:text-3xl text-castanho mt-3 leading-tight">
                    {p.titulo}
                  </h2>
                )}
              </div>
            )}

            <div
              className={
                p.temFerramenta
                  ? "rounded-2xl border border-ocre/40 bg-creme/50 p-6 md:p-8"
                  : ""
              }
            >
              {p.temFerramenta && (
                <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-ocre-forte mb-4">
                  a ferramenta
                </p>
              )}
              {p.partes.map((parte, k) => (
                <ParteView key={k} parte={parte} respostas={respostas} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* navegação */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="text-sm text-castanho/60 hover:text-castanho disabled:opacity-0 transition-opacity"
        >
          ← voltar
        </button>

        <span className="text-xs text-oliva tabular-nums">
          {i + 1} de {total}
        </span>

        {!noFim ? (
          <button onClick={() => setI((v) => Math.min(total - 1, v + 1))} className="btn-ocre">
            continuar
          </button>
        ) : (
          <span className="w-[1px]" />
        )}
      </div>

      {/* conclusão: só aparece quando chegas ao fim da etapa */}
      {noFim && children && (
        <div className="mt-16 etapa-passo" data-activo="true">
          {children}
        </div>
      )}
    </div>
  );
}
