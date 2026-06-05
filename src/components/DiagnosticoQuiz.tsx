"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Protótipo do "Diagnóstico da dispersão", na coreografia do quiz funnel
// (uma decisão por ecrã, guia que acompanha, medidor que cresce, retrato
// que se monta, resultado com peça guardada + email), na voz da infonte.

type Opcao = { id: string; rotulo: string };
type Passo =
  | { tipo: "pergunta"; chave: string; titulo: string; sub?: string; opcoes: Opcao[] }
  | { tipo: "guia"; texto: string }
  | { tipo: "medidor"; valor: number; legenda: string }
  | { tipo: "montar" }
  | { tipo: "resultado" };

const PASSOS: Passo[] = [
  {
    tipo: "pergunta",
    chave: "dia",
    titulo: "Como é o teu dia, por dentro?",
    sub: "Escolhe o que sentes mais verdadeiro.",
    opcoes: [
      { id: "comecado", rotulo: "Cheio de coisas começadas, nenhuma acabada" },
      { id: "vazio", rotulo: "Produtivo por fora, vazio por dentro" },
      { id: "travado", rotulo: "Travado, sem saber por onde pegar" },
      { id: "automatico", rotulo: "Em piloto automático, a cumprir o que esperam de mim" },
    ],
  },
  {
    tipo: "guia",
    texto:
      "Não estás dispersa por falta de foco. Estás cheia de coisas que talvez nem sejam tuas. Vamos ver.",
  },
  {
    tipo: "pergunta",
    chave: "motor",
    titulo: "O que te puxa a fazer tanto?",
    sub: "Por baixo da agenda cheia, costuma estar uma só coisa.",
    opcoes: [
      { id: "provar", rotulo: "Provar o meu valor" },
      { id: "medo", rotulo: "Medo de parar" },
      { id: "comparacao", rotulo: "Comparação com os outros" },
      { id: "heranca", rotulo: "Um sonho que sinto que tenho de realizar" },
    ],
  },
  {
    tipo: "pergunta",
    chave: "meta",
    titulo: "Quando alcanças uma meta, sentes-te...",
    opcoes: [
      { id: "cheia", rotulo: "Cheia e em paz" },
      { id: "vazia", rotulo: "Vazia, e já a perseguir a próxima" },
      { id: "alivio", rotulo: "Aliviada uns dias, depois igual" },
    ],
  },
  {
    tipo: "medidor",
    valor: 55,
    legenda: "A tua clareza está a formar-se. Falta pouco para o teu retrato.",
  },
  {
    tipo: "pergunta",
    chave: "teu",
    titulo: "Do que andas a perseguir, quanto é mesmo teu?",
    sub: "Teu é o que te acende mesmo quando ninguém está a ver.",
    opcoes: [
      { id: "quase", rotulo: "Quase tudo" },
      { id: "metade", rotulo: "Cerca de metade" },
      { id: "poucoteu", rotulo: "Pouco. Muito é emprestado ou herdado" },
    ],
  },
  {
    tipo: "pergunta",
    chave: "precisa",
    titulo: "O que mais precisas, agora?",
    opcoes: [
      { id: "largar", rotulo: "Largar o que não é meu" },
      { id: "direcao", rotulo: "Encontrar uma direção, uma só" },
      { id: "acao", rotulo: "Transformar uma ideia em ação" },
      { id: "naosei", rotulo: "Não sei, e isso é que me pesa" },
    ],
  },
  { tipo: "montar" },
  { tipo: "resultado" },
];

const CAPTACOES_MONTAR = [
  "A ouvir o que disseste...",
  "A separar o que é teu do que é emprestado...",
  "A desenhar o teu retrato...",
];

function retratoDe(respostas: Record<string, string>): string {
  const partes: string[] = [];

  const motores: Record<string, string> = {
    provar: "Fazes tanto para provar que vales. Mas o teu valor não está à espera de ser provado.",
    medo: "A agenda cheia protege-te de parar, e é justamente ao parar que a clareza aparece.",
    comparacao: "Muito do que persegues entrou por comparação, não por desejo teu.",
    heranca: "Alguns dos sonhos que carregas não nasceram em ti. Nasceram antes de ti.",
  };
  const motor = motores[respostas["motor"] ?? ""];
  if (motor) partes.push(motor);

  const teus: Record<string, string> = {
    quase: "Grande parte do que persegues é mesmo teu. O que te falta é foco, não verdade.",
    metade: "Metade do que persegues é teu. A outra metade pesa sem nunca ter sido tua.",
    poucoteu: "Muito do que persegues é emprestado ou herdado, e isso dispersa-te sem que escolhesses.",
  };
  const teu = teus[respostas["teu"] ?? ""];
  if (teu) partes.push(teu);

  const meta = respostas["meta"];
  if (meta === "vazia" || meta === "alivio") {
    partes.push(
      "Por isso, quando chegas, sabe a pouco. Não é ingratidão, é sinal de que a meta talvez não fosse tua."
    );
  }

  if (partes.length === 0) {
    partes.push("Andas a perseguir mais do que é teu, e isso dispersa-te.");
  }
  return partes.join(" ");
}

export function DiagnosticoQuiz({ fonte = "diagnostico" }: { fonte?: string }) {
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const topo = useRef<HTMLDivElement>(null);

  const passo = PASSOS[i];
  const progresso = Math.round((i / (PASSOS.length - 1)) * 100);

  function avancar() {
    setSelecionado(null);
    setI((v) => Math.min(PASSOS.length - 1, v + 1));
  }

  function escolher(chave: string, id: string) {
    setRespostas((r) => ({ ...r, [chave]: id }));
    setSelecionado(id);
    setTimeout(avancar, 320);
  }

  useEffect(() => {
    topo.current?.scrollIntoView({ block: "start" });
  }, [i]);

  return (
    <div ref={topo} className="max-w-md mx-auto px-6 pt-8 pb-16 min-h-[80vh] flex flex-col">
      {/* progresso */}
      {passo.tipo !== "resultado" && (
        <div className="h-1 rounded-full bg-castanho/10 overflow-hidden mb-10">
          <div
            className="h-full bg-ocre transition-all duration-500"
            style={{ width: `${Math.max(8, progresso)}%` }}
          />
        </div>
      )}

      <div key={i} className="flex-1 etapa-passo" data-activo="true">
        {passo.tipo === "pergunta" && (
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-castanho leading-tight text-center">
              {passo.titulo}
            </h2>
            {passo.sub && (
              <p className="font-serif text-terra-texto/70 text-center mt-3">
                {passo.sub}
              </p>
            )}
            <div className="mt-8 space-y-3">
              {passo.opcoes.map((o) => (
                <button
                  key={o.id}
                  onClick={() => escolher(passo.chave, o.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border font-serif transition-all ${
                    selecionado === o.id
                      ? "border-ocre bg-ocre/10 text-castanho"
                      : "border-castanho/20 bg-white/50 text-terra-texto hover:border-ocre/60"
                  }`}
                >
                  {o.rotulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {passo.tipo === "guia" && <Guia texto={passo.texto} onContinuar={avancar} />}

        {passo.tipo === "medidor" && (
          <Medidor valor={passo.valor} legenda={passo.legenda} onContinuar={avancar} />
        )}

        {passo.tipo === "montar" && <Montar onPronto={avancar} />}

        {passo.tipo === "resultado" && (
          <Resultado retrato={retratoDe(respostas)} fonte={fonte} />
        )}
      </div>
    </div>
  );
}

function Guia({ texto, onContinuar }: { texto: string; onContinuar: () => void }) {
  return (
    <div className="text-center pt-6">
      <div className="relative w-16 h-16 mx-auto rounded-full overflow-hidden border border-ocre/40">
        <Image src="/vivianne-retrato.jpg" alt="Vivianne" fill className="object-cover" />
      </div>
      <div className="mt-5 inline-block max-w-sm rounded-2xl bg-creme border border-castanho/15 px-5 py-4">
        <p className="font-serif text-lg text-castanho italic leading-relaxed">{texto}</p>
      </div>
      <div className="mt-10">
        <button onClick={onContinuar} className="btn-ocre">
          continuar
        </button>
      </div>
    </div>
  );
}

function Medidor({
  valor,
  legenda,
  onContinuar,
}: {
  valor: number;
  legenda: string;
  onContinuar: () => void;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), 80);
    return () => clearTimeout(t);
  }, [valor]);
  return (
    <div className="text-center pt-10">
      <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-oliva">
        a tua clareza
      </p>
      <div className="text-5xl font-serif text-castanho mt-4 tabular-nums">{v}%</div>
      <div className="h-2 rounded-full bg-castanho/10 overflow-hidden mt-5 max-w-xs mx-auto">
        <div
          className="h-full bg-ocre transition-all duration-1000 ease-out"
          style={{ width: `${v}%` }}
        />
      </div>
      <p className="font-serif text-terra-texto/80 mt-6 max-w-xs mx-auto leading-relaxed">
        {legenda}
      </p>
      <div className="mt-10">
        <button onClick={onContinuar} className="btn-ocre">
          continuar
        </button>
      </div>
    </div>
  );
}

function Montar({ onPronto }: { onPronto: () => void }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setIdx((v) => Math.min(CAPTACOES_MONTAR.length - 1, v + 1)),
      900
    );
    const fim = setTimeout(onPronto, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(fim);
    };
  }, [onPronto]);
  return (
    <div className="text-center pt-20">
      <div className="w-12 h-12 mx-auto rounded-full border-2 border-ocre/30 border-t-ocre animate-spin" />
      <p className="font-serif text-xl text-castanho mt-8">A montar o teu retrato</p>
      <p key={idx} className="font-serif text-terra-texto/70 mt-3 etapa-passo" data-activo="true">
        {CAPTACOES_MONTAR[idx]}
      </p>
    </div>
  );
}

function Resultado({ retrato, fonte }: { retrato: string; fonte: string }) {
  const [email, setEmail] = useState("");
  const [a, setA] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<{ codigo: string } | null>(null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setA(true);
    try {
      const r = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, fonte }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        setErro(json.erro ?? "Algo correu mal, tenta de novo.");
        return;
      }
      setFeito({ codigo: json.codigoDesconto });
    } catch {
      setErro("Erro de ligação. Tenta de novo.");
    } finally {
      setA(false);
    }
  }

  return (
    <div className="pt-2">
      <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-ocre-forte text-center">
        o teu retrato agora
      </p>

      <div className="mt-5 rounded-2xl overflow-hidden border border-castanho/15 bg-creme/60">
        <div className="relative w-full aspect-[16/10]">
          <Image
            src="/gratidao-sucesso.png"
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-cover"
          />
        </div>
        <div className="p-6">
          <p className="font-serif text-lg text-castanho leading-relaxed">{retrato}</p>
        </div>
      </div>

      {!feito ? (
        <>
          {/* a peça guardada */}
          <div className="mt-6 rounded-2xl border border-ocre/40 bg-white/40 p-6 text-center">
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-oliva">
              o teu primeiro passo
            </p>
            <p
              className="font-serif text-2xl text-castanho mt-3 blur-sm select-none"
              aria-hidden
            >
              esvaziar a mesa e largar o que
            </p>
            <p className="font-serif text-terra-texto/80 mt-4 leading-relaxed">
              Deixa o email e recebe o teu primeiro passo, mais acesso antecipado
              e 25% de desconto no lançamento de 1 de Julho.
            </p>
            <form onSubmit={submeter} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o teu email"
                className="w-full px-4 py-3 rounded-xl border border-castanho/25 bg-white/70 text-center focus:border-ocre focus:outline-none"
              />
              {erro && <p className="text-sm text-red-800">{erro}</p>}
              <button type="submit" disabled={a} className="btn-ocre w-full disabled:opacity-60">
                {a ? "a revelar..." : "revelar o meu primeiro passo"}
              </button>
            </form>
            <p className="text-xs text-oliva mt-3">Sem ruído. Só o aviso do lançamento.</p>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-ocre/40 bg-creme/70 p-7 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-ocre-forte">
            o teu primeiro passo
          </p>
          <h3 className="font-serif text-2xl text-castanho mt-3">Esvaziar a mesa.</h3>
          <p className="font-serif text-terra-texto/85 mt-4 leading-relaxed">
            Largar o que nem era teu, para veres o que fica. Está na etapa 1, e é
            tua, grátis.
          </p>
          <a href="/etapa/1" className="btn-ocre inline-block mt-6">
            começar a etapa 1
          </a>
          <p className="text-xs text-oliva mt-4">
            Guardámos o teu lugar na lista. Código {feito.codigo}.
          </p>
        </div>
      )}
    </div>
  );
}
