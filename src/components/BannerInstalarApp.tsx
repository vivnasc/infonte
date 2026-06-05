"use client";

import { useEffect, useState } from "react";

type Variante = "celebracao" | "membro";

type PromptInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE_DISPENSAR = "infonte-instalar-dispensado";

// Gota assinatura da infonte, em dourado.
function Gota({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden="true">
      <path
        d="M12 0C12 0 2 12 2 21a10 10 0 0 0 20 0C22 12 12 0 12 0Z"
        fill="#EBAE4A"
      />
    </svg>
  );
}

export function BannerInstalarApp({ variante = "membro" }: { variante?: Variante }) {
  const [montado, setMontado] = useState(false);
  const [instalada, setInstalada] = useState(false);
  const [ios, setIos] = useState(false);
  const [promptInstalar, setPromptInstalar] = useState<PromptInstalar | null>(null);
  const [verPassos, setVerPassos] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    setMontado(true);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS expõe navigator.standalone
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalada(standalone);

    const ua = window.navigator.userAgent || "";
    setIos(/iphone|ipad|ipod/i.test(ua));

    if (variante === "membro" && localStorage.getItem(CHAVE_DISPENSAR) === "1") {
      setDispensado(true);
    }

    const aoPrompt = (e: Event) => {
      e.preventDefault();
      setPromptInstalar(e as PromptInstalar);
    };
    const aoInstalar = () => setInstalada(true);

    window.addEventListener("beforeinstallprompt", aoPrompt);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPrompt);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, [variante]);

  // Antes de montar (SSR/hidratação), ou se já instalada/dispensada, nada.
  if (!montado || instalada) return null;
  if (variante === "membro" && dispensado) return null;

  async function instalar() {
    if (!promptInstalar) return;
    await promptInstalar.prompt();
    await promptInstalar.userChoice;
    setPromptInstalar(null);
  }

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSAR, "1");
    setDispensado(true);
  }

  const titulo =
    variante === "celebracao"
      ? "A tua travessia começa agora."
      : "Leva a infonte contigo.";

  const intro =
    variante === "celebracao"
      ? "Tens acesso vitalício às sete etapas. Instala a infonte no telemóvel e ela fica ali, à mão, como uma app dedicada, com tudo guardado."
      : "Instala a infonte no ecrã inicial e abre o teu percurso como uma app, sem ir à App Store nem ao Google Play.";

  return (
    <div className="mt-6 rounded-2xl border border-ocre/40 bg-gradient-to-b from-creme/80 to-creme-fundo/40 p-6 md:p-7">
      <div className="flex items-start gap-4">
        <Gota className="w-6 h-8 shrink-0 mt-1" />
        <div className="flex-1">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-ocre-forte">
            leva a infonte contigo
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-castanho mt-1.5 leading-tight">
            {titulo}
          </h3>
          <p className="font-serif text-terra-texto/90 mt-3 leading-relaxed">
            {intro}
          </p>

          {/* Android / desktop Chrome: instalação nativa num clique */}
          {promptInstalar && (
            <button onClick={instalar} className="btn-ocre inline-block mt-5">
              Instalar a app
            </button>
          )}

          {/* iPhone: o gesto do Safari */}
          {!promptInstalar && ios && (
            <p className="font-serif text-sm text-terra-texto mt-5 leading-relaxed">
              No Safari, carrega no botão de partilha (o quadrado com a seta para
              cima) e escolhe <strong>&ldquo;Adicionar ao ecrã principal&rdquo;</strong>.
              A infonte aparece com a gota dourada.
            </p>
          )}

          {/* Outros casos: passos por plataforma, escondidos por omissão */}
          {!promptInstalar && !ios && (
            <div className="mt-5">
              <button
                onClick={() => setVerPassos((v) => !v)}
                className="text-sm text-ocre-forte hover:underline"
              >
                {verPassos ? "esconder" : "como instalar"}
              </button>
              {verPassos && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-lg border border-castanho/15 bg-white/40">
                    <h4 className="font-sans text-xs font-semibold text-castanho">
                      iPhone ou iPad (Safari)
                    </h4>
                    <ol className="font-serif text-sm text-terra-texto mt-2 space-y-1.5 list-decimal list-inside">
                      <li>Carrega no botão de partilha.</li>
                      <li>Escolhe &ldquo;Adicionar ao ecrã principal&rdquo;.</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg border border-castanho/15 bg-white/40">
                    <h4 className="font-sans text-xs font-semibold text-castanho">
                      Android (Chrome)
                    </h4>
                    <ol className="font-serif text-sm text-terra-texto mt-2 space-y-1.5 list-decimal list-inside">
                      <li>Abre o menu (três pontos).</li>
                      <li>Escolhe &ldquo;Instalar aplicação&rdquo;.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {variante === "membro" && (
            <button
              onClick={dispensar}
              className="block text-xs text-castanho/50 hover:text-castanho/80 mt-5"
            >
              agora não
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
