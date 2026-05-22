import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const etapas = t.raw("etapas") as string[];

  return (
    <div className="px-6">
      <section className="max-w-leitura mx-auto pt-20 pb-12 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-oliva mb-10">
          {t("tagline_topo")}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-castanho leading-tight">
          {t("titulo")}
        </h1>
        <h2 className="font-serif text-2xl md:text-3xl text-ocre leading-snug mt-3">
          {t("titulo_b")}
        </h2>
        <p className="font-serif text-lg text-terra-texto/90 mt-10 leading-relaxed">
          {t("intro")}
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/etapa/1" className="btn-ocre">
            {t("cta_comecar")}
          </Link>
          <Link href="/sobre" className="btn-quieto">
            {t("cta_sobre")}
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto py-8">
        <div className="relative aspect-[4/5] md:aspect-[16/10] rounded-lg overflow-hidden shadow-md max-h-[520px]">
          <Image
            src="/vivianne-ambiente.jpg"
            alt="Vivianne dos Santos"
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover object-center"
            priority
          />
        </div>
      </section>

      <section className="max-w-leitura mx-auto py-16 text-center">
        <h3 className="font-serif text-2xl text-castanho">
          {t("resultado_titulo")}
        </h3>
        <p className="font-serif text-lg text-terra-texto/90 mt-6 leading-relaxed">
          {t("resultado_corpo")}
        </p>
      </section>

      <section className="max-w-leitura mx-auto py-16">
        <h3 className="font-serif text-2xl text-castanho text-center">
          {t("etapas_titulo")}
        </h3>
        <ol className="mt-10 space-y-5">
          {etapas.map((linha, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-serif text-ocre text-xl w-8 shrink-0 text-right">
                {i + 1}.
              </span>
              <span className="font-serif text-lg text-terra-texto/90 leading-relaxed">
                {linha}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-12 font-sans text-sm text-oliva text-center italic">
          {t("ferramentas_nota")}
        </p>
      </section>
    </div>
  );
}
