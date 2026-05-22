import { parseEtapa } from "@/lib/etapas/marcadores";
import { renderMarkdown } from "@/lib/etapas/markdown";
import { CampoResposta } from "./CampoResposta";
import { Assinatura } from "./Assinatura";

export function RendererEtapa({
  corpo,
  respostas,
  modoLeitura,
}: {
  corpo: string;
  respostas: Record<string, string>;
  modoLeitura?: boolean;
}) {
  const nos = parseEtapa(corpo);
  return (
    <div className="prose-infonte">
      {nos.map((no, i) => {
        if (no.tipo === "md") {
          return (
            <div
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(no.conteudo) }}
            />
          );
        }
        if (no.tipo === "campo") {
          return (
            <CampoResposta
              key={i}
              bloco_id={no.bloco_id}
              valor_inicial={respostas[no.bloco_id] ?? ""}
              somente_leitura={modoLeitura}
            />
          );
        }
        if (no.tipo === "mostrar") {
          const valor = respostas[no.bloco_id];
          return (
            <blockquote
              key={i}
              className="my-8 px-5 py-4 border-l-4 border-ocre/60 bg-creme/60 italic font-serif whitespace-pre-wrap"
            >
              {valor && valor.trim().length > 0
                ? valor
                : "(não preencheste esta, podes voltar a ela.)"}
            </blockquote>
          );
        }
        if (no.tipo === "assinatura") {
          return <Assinatura key={i} valores={no.valores} />;
        }
        return null;
      })}
    </div>
  );
}
