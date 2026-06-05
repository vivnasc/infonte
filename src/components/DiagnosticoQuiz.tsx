"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Diagnóstico da dispersão, na coreografia de um quiz funnel (uma decisão
// por ecrã, guia que reflete as respostas, retrato que se monta, medidor
// que cresce, mapeamento cinematográfico, resultado com peça guardada +
// email), na voz e cor da infonte.

type Opcao = { id: string; rotulo: string };
type Passo =
  | { tipo: "intro" }
  | { tipo: "pergunta"; chave: string; titulo: string; sub?: string; opcoes: Opcao[] }
  | { tipo: "reflexo"; chave: string }
  | { tipo: "retrato" }
  | { tipo: "medidor"; valor: number; legenda: string }
  | { tipo: "mesa" }
  | { tipo: "montar" }
  | { tipo: "resultado" };

const CHAVE_MESA = "infonte-mesa-inicial";

const PASSOS: Passo[] = [
  { tipo: "intro" },
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
  { tipo: "reflexo", chave: "dia" },
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
  { tipo: "retrato" },
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
    valor: 40,
    legenda: "A tua clareza começa a formar-se. Continua, falta o que é mais teu.",
  },
  {
    tipo: "pergunta",
    chave: "area",
    titulo: "Onde isto te dispersa mais?",
    opcoes: [
      { id: "trabalho", rotulo: "No trabalho e nos projetos" },
      { id: "relacoes", rotulo: "Nas relações" },
      { id: "dinheiro", rotulo: "No dinheiro" },
      { id: "proposito", rotulo: "No propósito, no sentido de tudo" },
    ],
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
  { tipo: "reflexo", chave: "teu" },
  {
    tipo: "medidor",
    valor: 78,
    legenda: "Quase lá. Mais uma, e o teu retrato fica inteiro.",
  },
  {
    tipo: "pergunta",
    chave: "tempo",
    titulo: "Há quanto tempo sentes isto?",
    opcoes: [
      { id: "recente", rotulo: "Há pouco tempo" },
      { id: "anos", rotulo: "Há anos" },
      { id: "sempre", rotulo: "Desde que me lembro" },
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
  { tipo: "mesa" },
  { tipo: "montar" },
  { tipo: "resultado" },
];

const REFLEXOS: Record<string, Record<string, string>> = {
  dia: {
    comecado: "Cheia de começos. O problema nunca foi falta de vontade.",
    vazio: "Produtiva por fora, vazia por dentro. Guarda isso, vamos voltar lá.",
    travado: "Travada não é preguiça. É ruído a mais para uma direção só.",
    automatico: "Piloto automático é viver a vida que esperam de ti, não a tua.",
  },
  teu: {
    quase: "Há muito de ti aí dentro. Falta tirar o que abafa.",
    metade: "Metade é tua. A outra metade é peso que podes pousar.",
    poucoteu: "Pouco é teu. Não é falta de foco, é ruído que não escolheste.",
  },
};

const FRAGMENTOS: Record<string, Record<string, string>> = {
  dia: {
    comecado: "começos sem fim",
    vazio: "cheia por fora, vazia por dentro",
    travado: "travada",
    automatico: "em piloto automático",
  },
  motor: {
    provar: "a provar valor",
    medo: "em fuga de parar",
    comparacao: "movida por comparação",
    heranca: "a carregar heranças",
  },
  meta: {
    cheia: "chega em paz",
    vazia: "nunca chega",
    alivio: "alívio curto",
  },
  area: {
    trabalho: "dispersa no trabalho",
    relacoes: "dispersa nas relações",
    dinheiro: "dispersa no dinheiro",
    proposito: "sem propósito claro",
  },
  teu: {
    quase: "quase tudo é teu",
    metade: "metade é tua",
    poucoteu: "pouco é teu",
  },
  tempo: {
    recente: "há pouco tempo",
    anos: "há anos",
    sempre: "desde sempre",
  },
  precisa: {
    largar: "precisa de largar",
    direcao: "precisa de direção",
    acao: "precisa de agir",
    naosei: "precisa de clareza",
  },
};

const ORDEM_FRAG = ["dia", "motor", "meta", "area", "teu", "tempo", "precisa"];

function fragmentosDe(resp: Record<string, string>): string[] {
  const out: string[] = [];
  for (const chave of ORDEM_FRAG) {
    const v = resp[chave];
    const frag = v ? FRAGMENTOS[chave]?.[v] : undefined;
    if (frag) out.push(frag);
  }
  return out;
}

const CAPTACOES_MONTAR = [
  "A ouvir o que disseste...",
  "A separar o teu do emprestado...",
  "A reconhecer os teus padrões...",
  "A desenhar o teu retrato...",
  "Quase pronto...",
];

function retratoDe(resp: Record<string, string>): string {
  const partes: string[] = [];

  const motores: Record<string, string> = {
    provar: "Fazes tanto para provar que vales. Mas o teu valor não está à espera de ser provado.",
    medo: "A agenda cheia protege-te de parar, e é justamente ao parar que a clareza aparece.",
    comparacao: "Muito do que persegues entrou por comparação, não por desejo teu.",
    heranca: "Alguns dos sonhos que carregas não nasceram em ti. Nasceram antes de ti.",
  };
  const motor = motores[resp["motor"] ?? ""];
  if (motor) partes.push(motor);

  const teus: Record<string, string> = {
    quase: "Grande parte do que persegues é mesmo teu. O que te falta é foco, não verdade.",
    metade: "Metade do que persegues é teu. A outra metade pesa sem nunca ter sido tua.",
    poucoteu: "Muito do que persegues é emprestado ou herdado, e isso dispersa-te sem que escolhesses.",
  };
  const teu = teus[resp["teu"] ?? ""];
  if (teu) partes.push(teu);

  if (resp["meta"] === "vazia" || resp["meta"] === "alivio") {
    partes.push(
      "Por isso, quando chegas, sabe a pouco. Não é ingratidão, é sinal de que a meta talvez não fosse tua."
    );
  }
  if (resp["tempo"] === "sempre" || resp["tempo"] === "anos") {
    partes.push("Carregas isto há demasiado tempo para continuar a achar que é normal.");
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
    setTimeout(avancar, 300);
  }

  useEffect(() => {
    topo.current?.scrollIntoView({ block: "start" });
  }, [i]);

  return (
    <div ref={topo} className="max-w-md mx-auto px-6 pt-8 pb-16 min-h-[80vh] flex flex-col">
      {passo.tipo !== "resultado" && passo.tipo !== "intro" && (
        <div className="h-1 rounded-full bg-castanho/10 overflow-hidden mb-10">
          <div
            className="h-full bg-ocre transition-all duration-500"
            style={{ width: `${Math.max(8, progresso)}%` }}
          />
        </div>
      )}

      <div key={i} className="flex-1 etapa-passo" data-activo="true">
        {passo.tipo === "intro" && <Intro onComecar={avancar} />}

        {passo.tipo === "pergunta" && (
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-castanho leading-tight text-center">
              {passo.titulo}
            </h2>
            {passo.sub && (
              <p className="font-serif text-terra-texto/70 text-center mt-3">{passo.sub}</p>
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

        {passo.tipo === "reflexo" && (
          <Reflexo
            texto={REFLEXOS[passo.chave]?.[respostas[passo.chave] ?? ""] ?? ""}
            onContinuar={avancar}
          />
        )}

        {passo.tipo === "retrato" && (
          <RetratoEmConstrucao fragmentos={fragmentosDe(respostas)} onContinuar={avancar} />
        )}

        {passo.tipo === "medidor" && (
          <Medidor valor={passo.valor} legenda={passo.legenda} onContinuar={avancar} />
        )}

        {passo.tipo === "mesa" && <MesaInicial onContinuar={avancar} />}

        {passo.tipo === "montar" && <Montar onPronto={avancar} />}

        {passo.tipo === "resultado" && (
          <Resultado
            retrato={retratoDe(respostas)}
            fragmentos={fragmentosDe(respostas)}
            fonte={fonte}
          />
        )}
      </div>
    </div>
  );
}

function Intro({ onComecar }: { onComecar: () => void }) {
  return (
    <div className="text-center pt-16">
      <div className="relative w-14 h-20 mx-auto">
        <Image src="/gota.svg" alt="" fill className="object-contain" />
      </div>
      <p className="font-sans text-[11px] uppercase tracking-[0.32em] text-ocre-forte mt-8">
        diagnóstico da dispersão
      </p>
      <h1 className="font-serif text-3xl md:text-4xl text-castanho mt-4 leading-tight">
        Em um minuto, vê quanto do que persegues é mesmo teu.
      </h1>
      <p className="font-serif text-terra-texto/80 mt-5 leading-relaxed max-w-sm mx-auto">
        Sete perguntas, sem certo nem errado. No fim, o teu retrato e o teu
        primeiro passo.
      </p>
      <button onClick={onComecar} className="btn-ocre mt-10">
        começar
      </button>
    </div>
  );
}

function Reflexo({ texto, onContinuar }: { texto: string; onContinuar: () => void }) {
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

function RetratoEmConstrucao({
  fragmentos,
  onContinuar,
}: {
  fragmentos: string[];
  onContinuar: () => void;
}) {
  return (
    <div className="text-center pt-8">
      <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-ocre-forte">
        o teu retrato está a formar-se
      </p>
      <div className="mt-6 rounded-2xl border border-castanho/15 bg-creme/60 p-6">
        <div className="flex flex-wrap justify-center gap-2">
          {fragmentos.map((f, k) => (
            <span
              key={k}
              className="rounded-full bg-ocre/12 text-ocre-forte px-3 py-1.5 text-sm font-serif"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      <p className="font-serif text-terra-texto/80 mt-6 max-w-sm mx-auto leading-relaxed">
        Já vejo um padrão a desenhar-se. Faltam umas peças.
      </p>
      <div className="mt-8">
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
    const t = setTimeout(() => setV(valor), 100);
    return () => clearTimeout(t);
  }, [valor]);
  return (
    <div className="text-center pt-10">
      <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-oliva">a tua clareza</p>
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

function MesaInicial({ onContinuar }: { onContinuar: () => void }) {
  const [rascunho, setRascunho] = useState("");
  const [itens, setItens] = useState<string[]>([]);

  function adicionar() {
    const t = rascunho.trim();
    if (!t) return;
    setItens((x) => [...x, t]);
    setRascunho("");
  }

  function continuar() {
    try {
      localStorage.setItem(CHAVE_MESA, JSON.stringify(itens));
    } catch {
      /* sem localStorage, segue na mesma */
    }
    onContinuar();
  }

  return (
    <div className="pt-2">
      <h2 className="font-serif text-2xl md:text-3xl text-castanho leading-tight text-center">
        Antes do teu primeiro passo, põe na mesa o que andas a perseguir.
      </h2>
      <p className="font-serif text-terra-texto/70 text-center mt-3">
        Três ou quatro chegam. Vais trabalhá-las já a seguir, na etapa 1.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
          placeholder="uma coisa de cada vez..."
          className="flex-1 px-4 py-3 rounded-xl border border-castanho/25 bg-white/70 focus:border-ocre focus:outline-none"
        />
        <button onClick={adicionar} className="btn-ocre whitespace-nowrap px-5">
          pôr na mesa
        </button>
      </div>

      {itens.length > 0 && (
        <ul className="mt-4 space-y-2">
          {itens.map((t, k) => (
            <li
              key={k}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-castanho/15 bg-white/50 font-serif text-castanho"
            >
              <span>{t}</span>
              <button
                onClick={() => setItens((x) => x.filter((_, i) => i !== k))}
                className="text-castanho/40 hover:text-castanho text-lg leading-none"
                aria-label="remover"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={continuar}
          disabled={itens.length === 0}
          className="btn-ocre disabled:opacity-50"
        >
          continuar
        </button>
      </div>
    </div>
  );
}

function Montar({ onPronto }: { onPronto: () => void }) {
  const [idx, setIdx] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const captacoes = setInterval(
      () => setIdx((v) => Math.min(CAPTACOES_MONTAR.length - 1, v + 1)),
      1100
    );
    const barra = setInterval(() => setPct((v) => Math.min(100, v + 2)), 110);
    const fim = setTimeout(onPronto, 5600);
    return () => {
      clearInterval(captacoes);
      clearInterval(barra);
      clearTimeout(fim);
    };
  }, [onPronto]);
  return (
    <div className="text-center pt-16">
      {/* radar de gota: anéis a pulsar à volta da gota */}
      <div className="relative w-32 h-32 mx-auto">
        <span className="absolute inset-0 rounded-full bg-ocre/20 animate-ping" />
        <span
          className="absolute inset-4 rounded-full bg-ocre/20 animate-ping"
          style={{ animationDelay: "0.4s" }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <Image src="/gota.svg" alt="" width={36} height={48} />
        </span>
      </div>
      <p className="font-serif text-xl text-castanho mt-10">A montar o teu retrato</p>
      <p key={idx} className="font-serif text-terra-texto/70 mt-3 etapa-passo" data-activo="true">
        {CAPTACOES_MONTAR[idx]}
      </p>
      <div className="h-1 rounded-full bg-castanho/10 overflow-hidden mt-6 max-w-[12rem] mx-auto">
        <div className="h-full bg-ocre transition-all duration-100" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Resultado({
  retrato,
  fragmentos,
  fonte,
}: {
  retrato: string;
  fragmentos: string[];
  fonte: string;
}) {
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
        o teu retrato
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
          <div className="flex flex-wrap gap-2 mb-4">
            {fragmentos.map((f, k) => (
              <span
                key={k}
                className="rounded-full bg-ocre/12 text-ocre-forte px-3 py-1 text-xs font-serif"
              >
                {f}
              </span>
            ))}
          </div>
          <p className="font-serif text-lg text-castanho leading-relaxed">{retrato}</p>
        </div>
      </div>

      {!feito ? (
        <div className="mt-6 rounded-2xl border border-ocre/40 bg-white/40 p-6 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-oliva">
            o teu primeiro passo
          </p>
          <p className="font-serif text-2xl text-castanho mt-3 blur-sm select-none" aria-hidden>
            esvaziar a mesa e largar o que
          </p>
          <p className="font-serif text-terra-texto/80 mt-4 leading-relaxed">
            Deixa o email e recebe o teu primeiro passo, mais acesso antecipado e
            25% de desconto no lançamento de 1 de Julho.
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
      ) : (
        <div className="mt-6 rounded-2xl border border-ocre/40 bg-creme/70 p-7 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-ocre-forte">
            o teu primeiro passo
          </p>
          <h3 className="font-serif text-2xl text-castanho mt-3">Esvaziar a mesa.</h3>
          <p className="font-serif text-terra-texto/85 mt-4 leading-relaxed">
            O que puseste na mesa já está à tua espera na etapa 1. Vamos ver, uma
            a uma, o que é mesmo teu, e largar o resto. É tua, grátis.
          </p>
          <a href="/etapa/1" className="btn-ocre inline-block mt-6">
            esvaziar a mesa, na etapa 1
          </a>
          <p className="text-xs text-oliva mt-4">
            Guardámos o teu lugar na lista. Código {feito.codigo}.
          </p>
        </div>
      )}
    </div>
  );
}
