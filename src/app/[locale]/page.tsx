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
      "Despejares tudo o que andas a perseguir. E ao lado de cada coisa, perguntares: isto é meu, emprestado, ou de alguém antes de mim? A maioria das mulheres descobre que metade da lista não lhe pertence.",
  },
  {
    n: 2,
    titulo: "Bastar-se",
    ferramenta: "Contar o que já tens, e deixar entrar",
    corpo:
      "Encontrares o chão de onde se age sem fome. Veres o que já tens (e que não contas), e abrires a porta de receber que andava fechada.",
  },
  {
    n: 3,
    titulo: "Clarear",
    ferramenta: "Os três filtros",
    corpo:
      "De tudo o que sobrou como genuinamente teu, o que é para seguir agora. Três perguntas que separam o que queres do que precisas.",
  },
  {
    n: 4,
    titulo: "Focar",
    ferramenta: "A linha que protege",
    corpo:
      "Escolheres uma coisa. Pela primeira vez, não por lealdade, não por compensação, não por medo. Por verdade. E protegeres essa escolha do ruído.",
  },
  {
    n: 5,
    titulo: "Materializar",
    ferramenta: "Partir o sonho",
    corpo:
      "O que escolheste vira ano, três meses, semana, primeiro passo em 24 horas. A ideia deixa de ser ideia e começa a existir.",
  },
  {
    n: 6,
    titulo: "Sustentar",
    ferramenta: "Encontro semanal contigo",
    corpo:
      "Vinte minutos por semana com três perguntas fixas. O ritual que mantém a clareza quando a vida tenta trazer de volta o ruído e os padrões antigos.",
  },
  {
    n: 7,
    titulo: "Tornar-se fonte",
    ferramenta: "Devolução do percurso",
    corpo:
      "Vês o caminho que fizeste, na tua letra. Já não é método. É quem tu és quando paras de perseguir e começas a ocupar o teu lugar.",
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
      <Hero />

      <Divisor />

      <ComoFunciona />

      <Divisor />

      <ADor />

      <Divisor />

      <FotoAmbiente />

      <Divisor />

      <ASubstituicao />

      <Divisor />

      <ODespertar />

      <Divisor />

      <Resultado />

      <Divisor />

      <SeteEtapas />

      <Divisor />

      <Autora />

      <Divisor />

      <Modelo />

      <Divisor />

      <Diferenca />

      <Divisor />

      <Seguranca />

      <Divisor />

      <InstalarApp />

      <Divisor />

      <FechoCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="max-w-2xl mx-auto pt-16 md:pt-24 pb-12 text-center">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mb-12">
        Um percurso em sete etapas
      </p>
      <h1 className="font-serif text-[2.4rem] md:text-[3.4rem] text-castanho leading-[1.1] font-medium">
        Fazes tanto. Começas tudo. E no fundo sabes que metade nem era teu.
      </h1>
      <p className="font-serif text-xl md:text-2xl text-ocre-forte mt-6 italic">
        Pára de perseguir o que nunca foi teu.
      </p>
      <p className="font-serif text-lg text-terra-texto mt-10 leading-relaxed max-w-leitura mx-auto">
        Entras com a agenda cheia e o vazio por baixo. Com talento a mais e
        clareza a menos. Com anos a correr atrás de metas que, quando as
        alcanças, te deixam sentir pouco. Sais a saber o que é teu, o que era
        emprestado, e o que herdaste sem escolher. E começas, pela primeira vez,
        a construir a partir do que é verdadeiramente teu.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/etapa/1" className="btn-ocre">
          Começar a etapa 1, grátis
        </Link>
        <Link href="/sobre" className="btn-quieto">
          Conhecer a autora
        </Link>
      </div>
      <p className="text-xs text-oliva mt-6">
        A etapa 1 é gratuita. Não pedimos cartão.
      </p>
    </section>
  );
}

function ComoFunciona() {
  const passos = [
    {
      n: "1",
      titulo: "Crias conta",
      corpo: "Só precisas de email e password. Sem cartão, sem compromisso.",
    },
    {
      n: "2",
      titulo: "Experimentas a etapa 1 (grátis)",
      corpo:
        "A primeira etapa é tua de borla. Usa a ferramenta, escreve, sente se é para ti.",
    },
    {
      n: "3",
      titulo: "Compras o percurso completo",
      corpo:
        "Se quiseres continuar, pagas uma vez via PayPal. Sem subscrição, acesso vitalício.",
    },
    {
      n: "4",
      titulo: "Avanças uma etapa a cada 3 dias",
      corpo:
        "O percurso leva cerca de 3 semanas. Cada etapa abre 72 horas depois da anterior, para a ferramenta enraizar.",
    },
    {
      n: "5",
      titulo: "Instalas a app no telemóvel",
      corpo:
        "A Infonte é uma aplicação web. Podes instalar no ecrã inicial do telemóvel e usar como uma app dedicada, com tudo guardado.",
    },
  ];

  return (
    <section className="max-w-3xl mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-3">
        Como funciona
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Cinco passos, do início ao fim.
      </h2>
      <ol className="mt-12 space-y-6 max-w-2xl mx-auto">
        {passos.map((p) => (
          <li key={p.n} className="flex gap-5 items-start">
            <span className="w-10 h-10 shrink-0 rounded-full bg-ocre text-white flex items-center justify-center font-sans text-sm font-semibold">
              {p.n}
            </span>
            <div className="flex-1 pt-1">
              <h3 className="font-serif text-lg text-castanho">{p.titulo}</h3>
              <p className="font-serif text-base text-terra-texto mt-1 leading-relaxed">
                {p.corpo}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ADor() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        Para ti
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Tens talento a mais e clareza a menos. E odeias-te por isso.
      </h2>
      <div className="prose-infonte mt-10 space-y-5">
        <p>
          Não é falta de capacidade. É excesso. Cinco projetos a meio, três
          versões de ti que ainda não conseguiste viver, e a sensação de que,
          quanto mais corres, mais a vida te escapa.
        </p>
        <p>
          Acordas com a agenda cheia. Trabalhas. Conquistas. E quando chegas
          ao que querias, sentes pouco. Mudas de emprego e o desconforto
          continua. Recebes a validação e continuas insuficiente. A pergunta
          instala-se: se fiz tudo certo, porque é que continuo perdida?
        </p>
        <p>
          Há sonhos que carregas e que não nasceram em ti. Vieram da pressão
          de alguém, da comparação que te invadiu, do que ficaria bem aos
          olhos de quem veio antes de ti. Andas a gastar a tua vida a correr
          atrás de coisas que nem escolheste.
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

function ASubstituicao() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        O que ninguém te diz
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Não é a meta que está errada. É o que procuras por trás dela.
      </h2>
      <div className="prose-infonte mt-10 space-y-5">
        <p>
          Tu não queres sucesso. Queres reconhecimento. Não queres dinheiro.
          Queres segurança. Não queres produtividade. Queres sentir que vales.
          Não queres aprovação. Queres pertença. Não queres estatuto. Queres
          sentir-te suficiente.
        </p>
        <p>
          A meta é só o veículo. Estás a tentar obter no futuro aquilo que
          faltou no passado. Por isso corres e não chegas: o objetivo nunca foi
          o problema, nem a solução.
        </p>
        <p>
          Isto não é falta de organização. É substituição. E enquanto não a
          vires, vais continuar a correr, a começar, a conquistar, e a sentir
          pouco.
        </p>
      </div>
    </section>
  );
}

function ODespertar() {
  return (
    <section className="max-w-leitura mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-8">
        A virada
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Antes de escolher o caminho, descobre quem está a escolher.
      </h2>
      <div className="prose-infonte mt-10 space-y-5">
        <p>
          O Infonte não te ensina a fazer mais. Ensina-te a ver. Ver o que
          estás realmente a procurar (não a meta, a necessidade por trás
          dela). Diferenciar o que é teu do que herdaste. Reconhecer o que
          procuras não no objetivo, mas numa necessidade que ainda não foi
          vista. Devolver as expectativas que não te pertencem. E então,
          pela primeira vez, escolher. Não por lealdade, não por compensação,
          não por medo. Por verdade.
        </p>
        <p>
          Não é produtividade. Não é organização. Não é mais um método para
          fazer melhor o que já fazes de mais. É parar de perseguir o que
          nunca foi teu, para poderes ocupar o teu lugar.
        </p>
      </div>
    </section>
  );
}

function Resultado() {
  return (
    <section className="max-w-leitura mx-auto py-16 text-center">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mb-6">
        O que muda
      </p>
      <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
        Paras de correr atrás do que não é teu. Começas a construir a partir do
        que é. O ruído baixa. A clareza vem. E o que fazes, pela primeira vez,
        é teu de verdade.
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
              Passei anos a perseguir. A fazer muito para valer. A encher a mesa
              de metas que nem sempre eram minhas. Até perceber que o que eu
              procurava não estava no próximo projeto, estava numa necessidade
              antiga que eu nunca tinha visto.
            </p>
            <p>
              Estou em formação em constelação familiar sistémica, em psicologia
              transpessoal, e em psicologia e espiritualidade. Não para te dar
              uma sessão. Para construir ferramentas que tocam a raiz: o que
              herdaste, o que é teu, e o que precisas de devolver.
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
        "Sem subscrição, sem upsell etapa a etapa. Acesso vitalício. As ferramentas ficam contigo, podes voltar sempre que precisares.",
    },
    {
      titulo: "Em silêncio, contigo",
      corpo:
        "Não é um grupo, não é uma comunidade barulhenta. É um percurso íntimo, na primeira pessoa. As tuas respostas ficam guardadas para ti.",
    },
    {
      titulo: "Uma aplicação para a tua vida",
      corpo:
        "A Infonte é uma aplicação web. Abres no telemóvel ou no computador. Podes instalar no ecrã inicial, funciona como uma app dedicada. Tudo guardado, sempre disponível.",
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
          A Infonte não te ensina a ser mais produtiva. Não te dá um planner,
          um sistema de metas, nem te pede para visualizares com mais força.
          Não te diagnostica, não te classifica, não te promete riqueza.
        </p>
        <p>
          A Infonte põe-te em frente ao que estás realmente a perseguir. Ajuda-te
          a ver o que é teu, o que é emprestado, e o que carregas por alguém que
          veio antes de ti. E dá-te ferramentas concretas para devolveres o que
          não é teu e escolheres, pela primeira vez, a partir de ti.
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

function Seguranca() {
  return (
    <section className="max-w-leitura mx-auto py-10">
      <div className="p-5 rounded-lg border border-castanho/10 bg-creme-fundo/20">
        <p className="font-serif text-sm text-castanho/80 leading-relaxed">
          <strong className="text-castanho">Uma nota importante.</strong> O Infonte
          usa princípios sistémicos como reflexão, não como sessão clínica. Se
          sentes que a exaustão que vives pode ser burnout, depressão, ou algo
          que precisa de acompanhamento profissional, por favor procura apoio
          especializado. As ferramentas do Infonte complementam, não substituem,
          o cuidado de quem está formado para isso.
        </p>
      </div>
    </section>
  );
}

function InstalarApp() {
  return (
    <section className="max-w-3xl mx-auto py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte text-center mb-3">
        Leva a Infonte contigo
      </p>
      <h2 className="font-serif text-2xl md:text-3xl text-castanho text-center leading-tight">
        Instala no teu telemóvel. Funciona como uma app.
      </h2>
      <p className="font-serif text-base text-terra-texto text-center mt-4 max-w-leitura mx-auto leading-relaxed">
        A Infonte é uma aplicação web progressiva. Não precisas de ir à
        App Store nem ao Google Play. Instalas diretamente do browser.
      </p>
      <div className="grid md:grid-cols-2 gap-6 mt-10 max-w-2xl mx-auto">
        <div className="p-5 rounded-lg border border-castanho/15 bg-creme-fundo/30">
          <h3 className="font-sans text-sm font-semibold text-castanho">
            iPhone ou iPad (Safari)
          </h3>
          <ol className="font-serif text-sm text-terra-texto mt-3 space-y-2 list-decimal list-inside">
            <li>Abre <span className="text-ocre-forte">infonte.vivannedossantos.com</span> no Safari.</li>
            <li>Carrega no botão de partilha (o quadrado com a seta para cima).</li>
            <li>Escolhe &ldquo;Adicionar ao ecrã inicial&rdquo;.</li>
            <li>Confirma. A Infonte aparece no ecrã com a gota dourada.</li>
          </ol>
        </div>
        <div className="p-5 rounded-lg border border-castanho/15 bg-creme-fundo/30">
          <h3 className="font-sans text-sm font-semibold text-castanho">
            Android (Chrome)
          </h3>
          <ol className="font-serif text-sm text-terra-texto mt-3 space-y-2 list-decimal list-inside">
            <li>Abre <span className="text-ocre-forte">infonte.vivannedossantos.com</span> no Chrome.</li>
            <li>Carrega nos três pontos (menu) no canto superior direito.</li>
            <li>Escolhe &ldquo;Adicionar ao ecrã inicial&rdquo; ou &ldquo;Instalar aplicação&rdquo;.</li>
            <li>Confirma. A Infonte aparece como app instalada.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function FechoCta() {
  return (
    <section className="max-w-leitura mx-auto py-16 text-center">
      <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
        Quando estiveres pronta para parar de perseguir e começar a escolher,
        entra pela etapa 1. É gratuita, e fica contigo para sempre.
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
      <p className="font-sans text-xs text-castanho/60 mt-4">
        <a href="mailto:ola@viviannedossantos.com" className="hover:text-ocre-forte transition-colors">ola@viviannedossantos.com</a>
        <span className="mx-2">·</span>
        <a href="https://wa.me/258845243875" target="_blank" rel="noopener noreferrer" className="hover:text-ocre-forte transition-colors">WhatsApp +258 84 524 3875</a>
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
        src="/gota.svg"
        alt=""
        width={22}
        height={22}
        className="opacity-80"
        aria-hidden
      />
      <span className="flex-1 h-px bg-castanho/15" />
    </div>
  );
}
