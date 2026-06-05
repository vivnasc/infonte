import Image from "next/image";
import { PRESENCA_ETAPAS } from "@/lib/percurso-presenca";

// Mostra a presença da Vivianne no fim de uma etapa. Se ainda não houver
// imagem para a etapa, não renderiza nada.
export function PresencaEtapa({ etapa }: { etapa: number }) {
  const p = PRESENCA_ETAPAS[etapa];
  if (!p || !p.imagem) return null;

  return (
    <div className="max-w-leitura mx-auto mt-20 text-center">
      <div className="mx-auto w-px h-10 bg-castanho/15" />
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mt-8">
        uma palavra de Vivianne
      </p>
      <div className="relative mx-auto mt-6 w-full max-w-md aspect-[3/2] rounded-2xl overflow-hidden border border-castanho/15 shadow-sm">
        <Image
          src={p.imagem}
          alt="Vivianne dos Santos"
          fill
          sizes="(max-width: 768px) 90vw, 448px"
          className="object-cover"
        />
      </div>
      <p className="font-serif text-lg md:text-xl text-castanho italic mt-6 leading-relaxed max-w-md mx-auto">
        {p.frase}
      </p>
      <div className="mt-5 flex justify-center">
        <Image src="/gota.svg" alt="" width={16} height={22} aria-hidden />
      </div>
    </div>
  );
}
