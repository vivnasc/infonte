import Image from "next/image";
import { BotaoPaypal } from "./BotaoPaypal";

export function OfertaCompra() {
  return (
    <div className="border border-ocre/40 rounded-2xl overflow-hidden bg-creme/70 text-center">
      <div className="relative w-full aspect-[16/9]">
        <Image
          src="/gratidao-venda.png"
          alt="Vivianne dos Santos"
          fill
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover object-top"
        />
      </div>
      <div className="p-8">
      <p className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
        o percurso completo
      </p>
      <h3 className="font-serif text-2xl text-castanho mt-3">
        abrir as 7 etapas, acesso vitalício às ferramentas
      </h3>
      <p className="font-serif text-terra-texto/85 mt-4 max-w-md mx-auto leading-relaxed">
        Esvaziar, bastar-se, clarear, focar, materializar, sustentar, tornar-se
        fonte. Cada etapa entrega uma ferramenta que fica para a vida. Sem
        upsell, sem reassinatura. Pagas uma vez.
      </p>
      <div className="my-6 flex items-center justify-center gap-6 font-serif text-castanho">
        <div>
          <div className="text-xs uppercase tracking-wider text-oliva">em reais</div>
          <div className="text-2xl mt-1">R$ 397</div>
        </div>
        <div className="w-px h-10 bg-castanho/20" />
        <div>
          <div className="text-xs uppercase tracking-wider text-oliva">em dólares</div>
          <div className="text-2xl mt-1">US$ 77</div>
        </div>
      </div>
      <BotaoPaypal />
      <p className="text-xs text-oliva mt-3">
        Pagamento processado pelo PayPal.
      </p>
      </div>
    </div>
  );
}
