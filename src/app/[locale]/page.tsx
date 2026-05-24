import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";

type Ferramenta = {
  n: number;
  titulo: string;
  ferramenta: string;
  corpo: string;
};

const FERRAMENTAS: Ferramenta[] = [
  {
    n: 1,
    titulo: "Esvaziar",
    ferramenta: "Esvaziar a mesa",
    corpo:
      "Tiras o ruído e vês quanto do que persegues nem é teu. Separas o meu, o emprestado, e o que herdaste de alguém antes de ti.",
  },
  {
    n: 2,
    titulo: "Bastar-se",
    ferramenta: "Contar o que já tens, e deixar entrar",
    corpo:
      "Encontras o chão de onde se age sem fome. Três listas curtas, e a porta de receber que andava fechada.",
  },
  {
    n: 3,
    titulo: "Clarear",
    ferramenta: "Os três filtros",
    corpo:
      "De tudo o que sobrou, o que é mesmo para seguir. Acende no difícil, o mundo já pediu, vai doer se não fizeres.",
  },
  {
    n: 4,
    titulo: "Focar",
    ferramenta: "A linha que protege",
    corpo:
      "Cortas o resto. Defines o que sai automaticamente, e abres a janela protegida onde a coisa cresce.",
  },
  {
    n: 5,
    titulo: "Materializar",
    ferramenta: "Partir o sonho",
    corpo:
      "A ideia vira ano, três meses, semana, primeiro passo em 24 horas. O coração do percurso.",
  },
  {
    n: 6,
    titulo: "Sustentar",
    ferramenta: "Encontro semanal contigo",
    corpo:
      "Vinte minutos por semana com três perguntas fixas. O ritual que protege a clareza quando a vida tenta trazer o ruído de volta.",
  },
  {
    n: 7,
    titulo: "Tornar-se fonte",
    ferramenta: "Devolução do percurso",
    corpo:
      "Vês o caminho que fizeste, na tua letra. A clareza deixa de ser método. Passa a ser quem tu és.",
  },
];

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  return (
    <div className="px-6">
      <Hero t={t} />

      <Divisor />

      <Problema />

      <Divisor />

      <FotoAmbiente />

      <Divisor />

      <Virada />

      <Divisor />

      <Resultado t={t} />

      <Divisor />

      <SeteEtapas />

      <Divisor />

      <Autora />

      <Divisor />

      <Modelo />

      <Divisor />

      <Diferenca />

      <Divisor />

      <FechoCta />
    </div>
  );
}

function Hero({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"landing">>>;
}) {
  return (
    <section className="max-w-2xl mx-auto pt-16 md:pt-24 pb-12 text-center">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mb-12">
        {t("tagline_topo")}
      </p>
      <h1 className="font-serif text-[2.4rem] md:text-[3.4rem] text-castanho leading-[1.1] font-medium">
        {t("titulo")}
      </h1>
      <h2 className="font-serif text-2xl md:text-[2rem] text-ocre-forte leading-snug mt-4 italic">
        {t("titulo_b")}
      </h2>
      <p className="font-serif text-lg md:text-xl text-terra-texto mt-10 leading-relaxed">
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
      <p className="text-xs text-oliva mt-6">
        A etapa 1 é gratuita. Não pedimos cartão.
      </p>
    </section>
  );
}

function Problema() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        Para ti
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Tu não estás cansada de trabalhar. Estás cansada de perseguir.
      </h2>
      <div className="prose-infonte mt-10 space-y-5">
        <p>
          Acordas com vinte abas abertas na cabeça. Cinco projetos a meio, três
          versões de ti que ainda não conseguiste viver, e a sensação de que,
          quanto mais corres, mais a vida te escapa.
        </p>
        <p>
          Não é falta de capacidade. É excesso. A dispersão entre coisas más é
          fácil de cortar. A dispersão entre coisas boas é a armadilha que
          prende as mulheres talentosas a vida inteira.
        </p>
        <p>
          E há sonhos que tu carregas e não nasceram em ti. Vieram da pressão,
          da comparação, do que ficaria bem aos olhos de alguém antes de ti.
          Andas a gastar a tua vida a correr atrás de coisas que nem escolheste.
        </p>
      </div>
    </section>
  );
}

function FotoAmbiente() {
  return (
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
  );
}

function Virada() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        A virada
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        A abundância não vem para quem persegue. Vem para quem se basta.
      </h2>
      <div className="prose-infonte mt-10 space-y-5">
        <p>
          Não é poesia. É mecânica. Quem persegue age de carência, e a carência
          dispersa, agarra, sabota. Quem se basta age de clareza, e a clareza
          foca, e o foco vira ação. E é a ação que muda a vida.
        </p>
        <p>
          Bastar-se não é desistir de querer. É querer de um lugar cheio, não
          de um lugar vazio. A mesma vontade, a partir de outro chão, dá outro
          resultado.
        </p>
      </div>
    </section>
  );
}

function Resultado({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"landing">>>;
}) {
  return (
    <section className="max-w-leitura mx-auto py-16 text-center">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mb-6">
        {t("resultado_titulo")}
      </p>
      <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
        Clareza mental. Foco para maximizares o teu potencial. E um sonho ou
        ideia já partido em ações concretas que tu começaste a executar.
      </p>
    </section>
  );
}

function SeteEtapas() {
  return (
    <section className="max-w-3xl mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-3">
        As sete etapas
      </p>
      <h2 className="font-serif text-3xl md:text-4xl text-castanho text-center leading-tight">
        Cada etapa entrega uma ferramenta que fica para a vida.
      </h2>
      <p className="font-serif text-base text-oliva text-center italic mt-3">
        Não uma teoria. Uma coisa que tu fazes, e que passa a ser tua.
      </p>

      <ol className="mt-14 space-y-12">
        {FERRAMENTAS.map((f) => (
          <li key={f.n} className="grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr] gap-6 items-start">
            <div className="text-right">
              <div className="font-serif text-3xl md:text-4xl text-ocre-forte leading-none">
                {f.n}
              </div>
              <div className="font-sans text-[10px] uppercase tracking-[0.25em] text-oliva mt-2">
                Etapa
              </div>
            </div>
            <div className="border-l border-castanho/15 pl-6">
              <h3 className="font-serif text-xl md:text-2xl text-castanho">
                {f.titulo}
              </h3>
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-ocre-forte mt-1">
                Ferramenta: {f.ferramenta}
              </p>
              <p className="font-serif text-base md:text-lg text-terra-texto mt-3 leading-relaxed">
                {f.corpo}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Autora() {
  return (
    <section className="max-w-3xl mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        A autora
      </p>
      <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start">
        <div className="mx-auto md:mx-0">
          <div className="relative w-44 h-56 md:w-48 md:h-60 rounded-lg overflow-hidden ring-1 ring-castanho/15 shadow-md">
            <Image
              src="/vivianne-retrato.jpg"
              alt="Vivianne dos Santos"
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-2xl md:text-3xl text-castanho leading-tight">
            Vivianne dos Santos
          </h3>
          <p className="font-sans text-xs uppercase tracking-[0.2em] text-oliva mt-2">
            Escritora, em formação em constelação familiar sistémica e psicologia transpessoal
          </p>
          {/* VERSÃO FINAL (destrancar quando concluir, ~8 meses):
              "Escritora, pós-graduada em terapia da constelação familiar sistémica e em psicologia transpessoal" */}
          <div className="prose-infonte mt-6 space-y-4">
            <p>
              Construí a Infonte a partir de uma descoberta simples e difícil. A
              abundância não vem para quem persegue. Vem para quem se basta.
            </p>
            <p>
              Estudo, há anos, os sistemas que nos formam. Estou em formação em
              psicologia transpessoal, em psicologia e espiritualidade, e em
              terapia da constelação familiar sistémica. Não para te dar uma
              sessão de terapia. Para construir ferramentas que funcionam porque
              tocam o que herdaste sem escolher.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/sobre" className="text-sm text-ocre-forte hover:underline">
              Ler a história completa →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Modelo() {
  const blocos = [
    {
      titulo: "7 etapas, 3 dias entre cada",
      corpo:
        "Cerca de três semanas, no teu ritmo. Cada etapa abre 72 horas depois da anterior, para a ferramenta enraizar antes da seguinte.",
    },
    {
      titulo: "Pagas uma vez, é tua",
      corpo:
        "Sem subscrição, sem upsell etapa a etapa. Acesso vitalício, podes revisitar sempre que precisares.",
    },
    {
      titulo: "Em silêncio, contigo",
      corpo:
        "Não é um grupo, não é uma comunidade barulhenta. É um percurso íntimo, na primeira pessoa. As tuas respostas ficam guardadas para ti.",
    },
    {
      titulo: "Uma aplicação para a tua vida",
      corpo:
        "A Infonte é uma aplicação web. Abres no telemóvel ou no computador. Podes instalar no ecrã inicial, funciona como uma app dedicada. As tuas respostas e o teu percurso ficam guardados, sempre disponíveis quando precisares de voltar.",
    },
  ];
  return (
    <section className="max-w-3xl mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-3">
        O modelo
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Um percurso fechado, com início e fim. Sem ruído.
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        {blocos.map((b) => (
          <div
            key={b.titulo}
            className="p-6 rounded-lg border border-castanho/15 bg-creme-fundo/30"
          >
            <h3 className="font-serif text-lg text-castanho">{b.titulo}</h3>
            <p className="font-serif text-base text-terra-texto mt-3 leading-relaxed">
              {b.corpo}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Diferenca() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        Não é mais um curso de mentalidade
      </p>
      <div className="prose-infonte space-y-5">
        <p>
          A Infonte não te diagnostica. Não te diz qual é a tua ferida, nem te
          pede para encaixares num arquétipo. Não te promete riqueza. Não te
          mostra o que eu tenho.
        </p>
        <p>
          A Infonte constrói. Cada etapa põe na tua mão uma ferramenta concreta
          que tu usas, e que continua a servir-te dez anos depois. Pequenas,
          simples, sérias. Voltas a elas em qualquer manhã difícil.
        </p>
        <p>
          Não desejas com mais força. Aprendes a bastar-te. E a abundância
          começa a chegar, como sempre fez para quem deixou de a perseguir.
        </p>
        <p>
          O Infonte assenta no trabalho sistémico: aquilo que herdamos e que
          molda o que nos deixamos ter. A formação em constelação familiar é a
          base de ferramentas como esvaziar a mesa.
        </p>
      </div>
    </section>
  );
}

function FechoCta() {
  return (
    <section className="max-w-leitura mx-auto py-16 text-center">
      <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
        Quando estiveres pronta, entra pela etapa 1. É gratuita, e fica contigo
        para sempre.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/etapa/1" className="btn-ocre">
          Começar a etapa 1, grátis
        </Link>
        <Link href="/sobre" className="btn-quieto">
          Conhecer a autora
        </Link>
      </div>
      <p className="font-serif text-sm text-oliva mt-8 italic max-w-leitura mx-auto">
        Um percurso de Vivianne dos Santos, escritora e em formação em
        constelação familiar sistémica e psicologia transpessoal.
      </p>
      {/* VERSÃO FINAL: "Um percurso de Vivianne dos Santos, escritora,
          pós-graduada em terapia da constelação familiar sistémica e em
          psicologia transpessoal." */}
    </section>
  );
}

function Divisor() {
  return (
    <div className="max-w-leitura mx-auto py-6 flex items-center gap-4">
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
