"use client";

import { useEffect, useRef, useState } from "react";

// Ferramenta interactiva da etapa 1 ("esvaziar a mesa"). Substitui a caixa
// de texto simples: a pessoa despeja o que persegue, marca de quem é cada
// coisa, e vê os emprestados riscarem-se e os "de outro" serem devolvidos,
// ficando só o que é teu. Guarda um resumo legível em respostas (mesmo
// bloco_id), por isso aparece na admin e em "mostrar resposta".

type Tag = "meu" | "emprestado" | "deoutro" | null;
type Item = { id: number; texto: string; tag: Tag };
type Fase = "despejar" | "marcar" | "fica";

let contador = 1;

function serializar(items: Item[]): string {
  const linhas = (t: Tag) =>
    items.filter((i) => i.tag === t).map((i) => `- ${i.texto}`);
  const blocos: string[] = [];
  const meu = linhas("meu");
  const emp = linhas("emprestado");
  const out = linhas("deoutro");
  const sem = items.filter((i) => !i.tag).map((i) => `- ${i.texto}`);
  if (meu.length) blocos.push("MEU:\n" + meu.join("\n"));
  if (emp.length) blocos.push("EMPRESTADO:\n" + emp.join("\n"));
  if (out.length) blocos.push("DE OUTRO:\n" + out.join("\n"));
  if (sem.length) blocos.push("POR MARCAR:\n" + sem.join("\n"));
  return blocos.join("\n\n");
}

function parsear(texto: string): Item[] {
  if (!texto.trim()) return [];
  const items: Item[] = [];
  let tag: Tag = null;
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trim();
    if (/^MEU:/i.test(l)) { tag = "meu"; continue; }
    if (/^EMPRESTADO:/i.test(l)) { tag = "emprestado"; continue; }
    if (/^DE OUTRO:/i.test(l)) { tag = "deoutro"; continue; }
    if (/^POR MARCAR:/i.test(l)) { tag = null; continue; }
    const m = l.match(/^-\s+(.*)$/);
    if (m && m[1].trim()) items.push({ id: contador++, texto: m[1].trim(), tag });
  }
  return items;
}

const TAGS: { id: Exclude<Tag, null>; rotulo: string }[] = [
  { id: "meu", rotulo: "meu" },
  { id: "emprestado", rotulo: "emprestado" },
  { id: "deoutro", rotulo: "de outro" },
];

export function EsvaziarMesa({
  bloco_id,
  valorInicial,
}: {
  bloco_id: string;
  valorInicial: string;
}) {
  const iniciais = parsear(valorInicial);
  const [items, setItems] = useState<Item[]>(iniciais);
  const [fase, setFase] = useState<Fase>(iniciais.length > 0 ? "marcar" : "despejar");
  const [rascunho, setRascunho] = useState("");
  const [revelado, setRevelado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function guardar(lista: Item[]) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await fetch("/api/respostas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bloco_id, valor: serializar(lista) }),
        });
        setGuardado(true);
        setTimeout(() => setGuardado(false), 1600);
      } catch {
        /* silencioso, tenta de novo na próxima alteração */
      }
    }, 800);
  }

  function atualizar(lista: Item[]) {
    setItems(lista);
    guardar(lista);
  }

  function adicionar() {
    const t = rascunho.trim();
    if (!t) return;
    atualizar([...items, { id: contador++, texto: t, tag: null }]);
    setRascunho("");
  }

  function remover(id: number) {
    atualizar(items.filter((i) => i.id !== id));
  }

  function marcar(id: number, tag: Tag) {
    atualizar(items.map((i) => (i.id === id ? { ...i, tag } : i)));
  }

  useEffect(() => {
    if (fase === "fica") {
      const t = setTimeout(() => setRevelado(true), 400);
      return () => clearTimeout(t);
    }
    setRevelado(false);
  }, [fase]);

  // Continuidade com o diagnóstico: se a mesa vier de lá (e ainda não houver
  // nada gravado), começa já com essas coisas, prontas a marcar.
  useEffect(() => {
    if (items.length > 0 || valorInicial.trim()) return;
    try {
      const raw = localStorage.getItem("infonte-mesa-inicial");
      if (!raw) return;
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr)) return;
      const seeded: Item[] = arr
        .filter((t) => typeof t === "string" && t.trim())
        .map((t) => ({ id: contador++, texto: String(t).trim(), tag: null }));
      if (seeded.length > 0) {
        setItems(seeded);
        setFase("marcar");
        guardar(seeded);
        localStorage.removeItem("infonte-mesa-inicial");
      }
    } catch {
      /* ignora seed inválido */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const porMarcar = items.filter((i) => !i.tag).length;
  const meus = items.filter((i) => i.tag === "meu");

  // ── Fase 1: despejar ──────────────────────────────────────────────
  if (fase === "despejar") {
    return (
      <div>
        <p className="font-serif text-terra-texto/85 leading-relaxed">
          Escreve tudo o que andas a perseguir. Projetos, sonhos, objetivos,
          coisas que achas que devias estar a fazer. Sem ordem, sem julgar.
        </p>

        <div className="mt-5 flex gap-2">
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

        {items.length > 0 && (
          <ul className="mt-5 space-y-2">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-castanho/15 bg-white/50 font-serif text-castanho"
              >
                <span>{i.texto}</span>
                <button
                  onClick={() => remover(i.id)}
                  className="text-castanho/40 hover:text-castanho text-lg leading-none"
                  aria-label="remover"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex items-center justify-between">
          <span className="text-xs text-oliva">
            {items.length === 0
              ? "começa por uma."
              : `${items.length} na mesa. Não pares enquanto houver coisa lá dentro.`}
          </span>
          <button
            onClick={() => setFase("marcar")}
            disabled={items.length === 0}
            className="btn-ocre disabled:opacity-50"
          >
            de quem é?
          </button>
        </div>
      </div>
    );
  }

  // ── Fase 2: marcar ────────────────────────────────────────────────
  if (fase === "marcar") {
    return (
      <div>
        <p className="font-serif text-terra-texto/85 leading-relaxed">
          Ao lado de cada uma, de quem é? <strong>Meu</strong> se te acende
          mesmo quando ninguém vê. <strong>Emprestado</strong> se vem de
          comparação ou pressão. <strong>De outro</strong> se é o sonho de
          alguém da tua família que pegaste sem escolher.
        </p>

        <ul className="mt-5 space-y-3">
          {items.map((i) => (
            <li
              key={i.id}
              className={`px-4 py-3 rounded-xl border ${
                i.tag ? "border-ocre/40 bg-creme/50" : "border-castanho/15 bg-white/50"
              }`}
            >
              <div className="font-serif text-castanho">{i.texto}</div>
              <div className="mt-2 flex gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => marcar(i.id, t.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      i.tag === t.id
                        ? "border-ocre bg-ocre text-creme"
                        : "border-castanho/25 text-castanho/70 hover:border-ocre/60"
                    }`}
                  >
                    {t.rotulo}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={() => setFase("despejar")}
            className="text-sm text-castanho/60 hover:text-castanho"
          >
            ← pôr mais na mesa
          </button>
          <button
            onClick={() => setFase("fica")}
            disabled={porMarcar > 0}
            className="btn-ocre disabled:opacity-50"
          >
            {porMarcar > 0 ? `faltam ${porMarcar}` : "ver o que fica"}
          </button>
        </div>
      </div>
    );
  }

  // ── Fase 3: o que fica ────────────────────────────────────────────
  return (
    <div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className={`px-4 py-3 rounded-xl border font-serif transition-all duration-700 ${
              i.tag === "meu"
                ? revelado
                  ? "border-ocre bg-ocre/10 text-castanho"
                  : "border-castanho/15 bg-white/50 text-castanho"
                : i.tag === "emprestado"
                  ? revelado
                    ? "border-castanho/10 bg-transparent text-castanho/35 line-through"
                    : "border-castanho/15 bg-white/50 text-castanho"
                  : revelado
                    ? "border-castanho/10 bg-transparent text-castanho/30 italic"
                    : "border-castanho/15 bg-white/50 text-castanho"
            }`}
          >
            <span>{i.texto}</span>
            {revelado && i.tag === "emprestado" && (
              <span className="float-right text-xs not-italic text-oliva">risca-se</span>
            )}
            {revelado && i.tag === "deoutro" && (
              <span className="float-right text-xs text-oliva">devolvido</span>
            )}
          </li>
        ))}
      </ul>

      {revelado && (
        <div className="mt-8 etapa-passo" data-activo="true">
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-ocre-forte">
            o que fica, e é teu
          </p>
          {meus.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {meus.map((i) => (
                <li
                  key={i.id}
                  className="px-4 py-3 rounded-xl border border-ocre/40 bg-creme/60 font-serif text-lg text-castanho"
                >
                  {i.texto}
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-serif text-terra-texto/80 mt-3">
              Nada ficou marcado como teu. Não faz mal, às vezes a mesa precisa
              de mais uma volta. Podes voltar atrás.
            </p>
          )}
          <p className="font-serif text-castanho italic mt-6 leading-relaxed">
            Repara no corpo. A maioria das mulheres sente alívio, não perda.
            Repara no teu.
          </p>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setFase("marcar")}
              className="text-sm text-castanho/60 hover:text-castanho"
            >
              ← rever
            </button>
            <span className="text-xs text-oliva h-4">{guardado ? "guardado" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}
