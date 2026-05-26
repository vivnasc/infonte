export default function MockupPage() {
  return (
    <div className="min-h-screen bg-terra p-8 md:p-16">
      <p className="text-center text-creme/60 text-xs uppercase tracking-[0.3em] mb-4">
        Mockups para a página de venda (fazer screenshot)
      </p>
      <h1 className="text-center font-serif text-3xl text-creme mb-16">
        infonte na tua mão
      </h1>

      <div className="flex flex-wrap justify-center gap-12 md:gap-16">
        <Phone titulo="Landing">
          <ScreenLanding />
        </Phone>
        <Phone titulo="Etapa 1">
          <ScreenEtapa />
        </Phone>
        <Phone titulo="Painel">
          <ScreenPainel />
        </Phone>
      </div>

      <p className="text-center text-creme/40 text-xs mt-16 max-w-lg mx-auto">
        Para fazer screenshot: abre esta página no Safari ou Chrome, faz zoom
        até o telemóvel ocupar o ecrã, e usa Cmd+Shift+4 (Mac) ou a
        ferramenta de recorte (Windows/Android).
      </p>
    </div>
  );
}

function Phone({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-creme/70 text-sm font-sans">{titulo}</p>
      <div className="relative w-[280px] h-[580px] rounded-[40px] bg-[#1a1a1a] p-[10px] shadow-2xl ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-[#1a1a1a] rounded-b-2xl z-20" />
        {/* Screen */}
        <div className="w-full h-full rounded-[30px] overflow-hidden bg-creme">
          <div className="h-full overflow-y-auto text-terra-texto">
            {children}
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white/30 rounded-full" />
      </div>
    </div>
  );
}

function ScreenLanding() {
  return (
    <div className="px-5 pt-10 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-full bg-terra flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 512 512">
            <path
              d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z"
              fill="none"
              stroke="#EBAE4A"
              strokeWidth="30"
              strokeLinejoin="round"
            />
            <circle cx="256" cy="338" r="40" fill="#F4C56A" />
          </svg>
        </div>
        <span className="font-serif text-lg text-castanho">infonte</span>
      </div>

      {/* Tagline */}
      <p className="text-[8px] uppercase tracking-[0.3em] text-ocre-forte mb-4">
        Um percurso em sete etapas
      </p>

      {/* Hero */}
      <h1 className="font-serif text-[18px] text-castanho leading-tight font-medium">
        Fazes tanto. Começas tudo. E no fundo sabes que metade nem era teu.
      </h1>
      <p className="font-serif text-[13px] text-ocre-forte italic mt-2">
        Pára de perseguir o que nunca foi teu.
      </p>

      <p className="font-serif text-[11px] text-terra-texto/90 mt-5 leading-relaxed">
        Entras com a agenda cheia e o vazio por baixo. Com talento a mais e
        clareza a menos. Sais a saber o que é teu, o que era emprestado, e o
        que herdaste sem escolher.
      </p>

      {/* CTA */}
      <div className="mt-6 space-y-2">
        <div className="bg-ocre text-white text-center py-2.5 rounded-full text-[11px] font-medium shadow-sm">
          Começar a etapa 1, grátis
        </div>
        <div className="border border-castanho/30 text-castanho text-center py-2 rounded-full text-[11px]">
          Conhecer a autora
        </div>
      </div>
      <p className="text-[9px] text-oliva text-center mt-3">
        A etapa 1 é gratuita. Não pedimos cartão.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-2 my-6">
        <span className="flex-1 h-px bg-castanho/15" />
        <svg width="14" height="14" viewBox="0 0 512 512" className="opacity-70">
          <path
            d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z"
            fill="none"
            stroke="#B8843D"
            strokeWidth="15"
            strokeLinejoin="round"
          />
          <circle cx="256" cy="338" r="32" fill="#B8843D" />
        </svg>
        <span className="flex-1 h-px bg-castanho/15" />
      </div>

      {/* Steps preview */}
      <p className="text-[8px] uppercase tracking-[0.3em] text-ocre-forte mb-3">
        As sete etapas
      </p>
      {[
        "Esvaziar",
        "Bastar-se",
        "Clarear",
        "Focar",
        "Materializar",
        "Sustentar",
        "Tornar-se fonte",
      ].map((e, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <span className="text-ocre-forte font-serif text-[14px] w-5 text-right">
            {i + 1}
          </span>
          <span className="font-serif text-[11px] text-castanho">{e}</span>
        </div>
      ))}
    </div>
  );
}

function ScreenEtapa() {
  return (
    <div className="px-5 pt-10 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-full bg-terra flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 512 512">
            <path
              d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z"
              fill="none"
              stroke="#EBAE4A"
              strokeWidth="30"
              strokeLinejoin="round"
            />
            <circle cx="256" cy="338" r="40" fill="#F4C56A" />
          </svg>
        </div>
        <span className="font-serif text-lg text-castanho">infonte</span>
      </div>

      <p className="text-[8px] uppercase tracking-[0.3em] text-ocre-forte mb-1">
        Etapa 1
      </p>
      <h1 className="font-serif text-[17px] text-castanho leading-snug font-medium">
        Antes de teres mais, tens de largar o que nem era teu.
      </h1>

      <div className="mt-5 space-y-3">
        <p className="font-serif text-[11px] text-terra-texto leading-relaxed">
          Tu não estás dispersa por falta de foco.
        </p>
        <p className="font-serif text-[11px] text-terra-texto leading-relaxed">
          Estás dispersa porque andas a perseguir coisas a mais, e a maioria
          delas nem são tuas. São o que te disseram que devias querer. O que
          viste alguém ter.
        </p>
        <p className="font-serif text-[11px] text-terra-texto leading-relaxed">
          Antes de te ensinar a ter mais, tenho de te ensinar a largar. Não a
          largar os teus sonhos. A largar o que se fez passar por sonho teu e
          nunca foi.
        </p>
      </div>

      {/* Textarea mockup */}
      <div className="mt-6">
        <div className="w-full rounded-lg border border-castanho/20 bg-white/50 p-3 min-h-[100px]">
          <p className="text-[10px] text-castanho/40 italic">
            Escreve aqui, em silêncio. Fica guardado para ti.
          </p>
          <p className="text-[11px] font-serif text-terra-texto mt-2 leading-relaxed">
            O projecto do livro, meu.{"\n"}
            A app que vi no Instagram, emprestado.{"\n"}
            O negócio que a minha mãe queria ter, de outro...
          </p>
        </div>
        <p className="text-[9px] text-oliva mt-1">guardado</p>
      </div>

      {/* Signature */}
      <div className="mt-8 text-center">
        <p className="font-serif text-[13px] text-castanho">infonte</p>
        <p className="font-serif text-[10px] text-castanho/70">
          Vivianne dos Santos
        </p>
        <p className="text-[8px] uppercase tracking-[0.2em] text-oliva mt-1">
          Sete Ecos
        </p>
      </div>
    </div>
  );
}

function ScreenPainel() {
  const etapas = [
    { n: 1, estado: "Concluída", ativa: true },
    { n: 2, estado: "Aberta", ativa: true },
    { n: 3, estado: "Abre 28/06", ativa: false },
    { n: 4, estado: "Fechada", ativa: false },
    { n: 5, estado: "Fechada", ativa: false },
    { n: 6, estado: "Fechada", ativa: false },
    { n: 7, estado: "Fechada", ativa: false },
  ];

  return (
    <div className="px-5 pt-10 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-full bg-terra flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 512 512">
            <path
              d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z"
              fill="none"
              stroke="#EBAE4A"
              strokeWidth="30"
              strokeLinejoin="round"
            />
            <circle cx="256" cy="338" r="40" fill="#F4C56A" />
          </svg>
        </div>
        <span className="font-serif text-lg text-castanho">infonte</span>
      </div>

      <h1 className="font-serif text-[20px] text-castanho">Olá, Vivianne.</h1>
      <p className="font-serif text-[11px] text-terra-texto/80 mt-1">
        O teu percurso. Cada etapa abre 3 dias depois da anterior.
      </p>

      <div className="mt-6 space-y-2">
        {etapas.map((e) => (
          <div
            key={e.n}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              e.ativa
                ? "border-castanho/20"
                : "border-castanho/10 opacity-60"
            }`}
          >
            <span
              className={`font-serif text-[13px] ${
                e.ativa ? "text-castanho" : "text-castanho/60"
              }`}
            >
              Etapa {e.n}
            </span>
            <span
              className={`text-[10px] ${
                e.estado === "Concluída"
                  ? "text-oliva"
                  : e.estado === "Aberta"
                    ? "text-ocre-forte"
                    : "text-castanho/50"
              }`}
            >
              {e.estado}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-castanho/50 mt-8">Sair</p>
    </div>
  );
}
