import { setRequestLocale } from "next-intl/server";
import { FormularioListaEspera } from "@/components/FormularioListaEspera";

export const metadata = {
  title: "Lista de espera, infonte",
  description:
    "Sê das primeiras a saber. Acesso antecipado e condição especial no lançamento de 1 de Julho.",
};

export default async function ListaEsperaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ utm_source?: string; fonte?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const fonte =
    (sp.utm_source ?? sp.fonte ?? "").toString().trim().toLowerCase() || null;

  return (
    <div className="px-6 max-w-leitura mx-auto pt-20 pb-24 text-center">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mb-8">
        infonte abre 1 de Julho
      </p>
      <h1 className="font-serif text-[2rem] md:text-[2.8rem] text-castanho leading-[1.15] font-medium">
        Sê das primeiras a saber.
      </h1>
      <p className="font-serif text-lg text-terra-texto mt-6 leading-relaxed max-w-leitura mx-auto">
        Acesso antecipado e uma condição especial no lançamento: 25% de
        desconto para quem entra na lista antes do dia 1.
      </p>

      <div className="mt-12">
        <FormularioListaEspera fonte={fonte} />
      </div>
    </div>
  );
}
