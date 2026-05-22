import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export default async function SobrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="px-6 pb-24">
      <section className="max-w-4xl mx-auto pt-16">
        <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
          <div className="mx-auto md:mx-0">
            <Image
              src="/vivianne-retrato.jpg"
              alt="Vivianne dos Santos"
              width={280}
              height={350}
              className="rounded-lg object-cover shadow-md"
              priority
            />
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
              a autora
            </p>
            <h1 className="font-serif text-4xl text-castanho mt-3 leading-tight">
              Vivianne dos Santos
            </h1>
            <p className="font-serif text-lg text-terra-texto/90 mt-6 leading-relaxed">
              Escritora, criadora, e estudiosa dos sistemas que nos formam.
              Construí o Infonte a partir de uma descoberta simples e difícil,
              a de que a abundância não vem para quem persegue, vem para quem
              se basta.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-leitura mx-auto mt-16">
        <div className="prose-infonte">
          <p>Eu não vim ensinar-te a prosperar mostrando-te o que tenho.</p>
          <p>
            Vim de outro sítio. Passei anos a perseguir, a fazer muito para
            valer, a encher a mesa de sonhos que nem sempre eram meus, até
            perceber que a vida não respondia ao quanto eu corria. Respondia
            a outra coisa. Respondia ao dia em que comecei a bastar-me.
          </p>
          <p>
            Construí empresas, escrevi livros, criei coisas que hoje vivem
            sozinhas. Mas o que mudou a minha relação com a abundância não
            foi o que consegui lá fora. Foi o trabalho que fiz cá dentro, o
            de limpar a mente, o de saber o que é mesmo meu, o de me
            permitir receber.
          </p>
          <p>
            Estudo, há anos, os sistemas que nos formam, a forma como aquilo
            que herdámos, sem escolher, molda o que conseguimos ter e o que
            não nos deixamos ter. Formei-me em terapia sistémica para
            perceber isto a fundo, não para te dar uma sessão de terapia,
            mas para construir ferramentas que funcionam porque tocam a
            raiz, e não só a superfície.
          </p>
          <p>
            O Infonte é isso. Não é mais um curso de mentalidade. É um
            percurso com ferramentas que ficam contigo para a vida, para
            transformares a clareza em foco, e o foco em coisas que tu
            fazes acontecer de verdade.
          </p>
          <p>
            Não te vou dizer para desejares com mais força. Vou ensinar-te a
            bastar-te. Porque a abundância não responde a quem a persegue.
            Responde a quem se basta.
          </p>
          <p>Sou a Vivianne. Vamos a isto.</p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/etapa/1" className="btn-ocre">
            começar a etapa 1, grátis
          </Link>
        </div>
      </section>
    </div>
  );
}
