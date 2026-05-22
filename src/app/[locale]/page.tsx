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
      <section className="max-w-2xl mx-auto pt-16 md:pt-24 pb-12 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre mb-12">
          {t("tagline_topo")}
        </p>
        <h1 className="font-serif text-[2.4rem] md:text-[3.4rem] text-castanho leading-[1.1] font-medium">
          {t("titulo")}
        </h1>
        <h2 className="font-serif text-2xl md:text-[2rem] text-ocre-forte leading-snug mt-4 italic">
          {t("titulo_b")}
        </h2>
        <p className="font-serif text-lg md:text-xl text-terra-texto mt-10 leading-relaxed max-w-leitura mx-auto">
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

      <Divisor />

      <section className="max-w-3xl mx-auto py-8">
        <div className="relative aspect-[4/5] md:aspect-[5/4] rounded-lg overflow-hidden shadow-lg max-h-[600px] ring-1 ring-castanho/10">
          <Image
            src="/vivianne-ambiente.jpg"
            alt="Vivianne dos Santos"
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 18%" }}
            priority
          />
        </div>
      </section>

      <Divisor />

      <section className="max-w-leitura mx-auto py-12 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre mb-6">
          o que ganhas no fim
        </p>
        <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
          Clareza mental. Foco para maximizar o teu potencial. E um sonho ou
          ideia já partido em ações concretas que tu começaste a executar.
        </p>
      </section>

      <Divisor />

      <section className="max-w-2xl mx-auto py-16">
        <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre text-center mb-10">
          as sete etapas
        </p>
        <ol className="space-y-7">
          {etapas.map((linha, i) => (
            <li key={i} className="flex gap-6 items-start">
              <span className="font-serif text-3xl text-ocre-forte w-10 shrink-0 text-right leading-none mt-1">
                {i + 1}
              </span>
              <span className="font-serif text-lg md:text-xl text-castanho leading-relaxed flex-1 border-b border-castanho/10 pb-6">
                {linha}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-12 font-serif text-base text-oliva text-center italic">
          {t("ferramentas_nota")}
        </p>
      </section>

      <Divisor />

      <section className="max-w-leitura mx-auto py-12 text-center">
        <p className="font-serif text-xl text-castanho leading-relaxed">
          Quando estiveres pronta, entra pela etapa 1. É grátis.
        </p>
        <div className="mt-8">
          <Link href="/etapa/1" className="btn-ocre">
            começar a etapa 1, grátis
          </Link>
        </div>
      </section>
    </div>
  );
}

function Divisor() {
  return (
    <div className="max-w-leitura mx-auto py-8 flex items-center gap-4">
      <span className="flex-1 h-px bg-castanho/15" />
      <Image
        src="/infonte-simbolo.svg"
        alt=""
        width={22}
        height={22}
        className="opacity-70"
        aria-hidden
      />
      <span className="flex-1 h-px bg-castanho/15" />
    </div>
  );
}
