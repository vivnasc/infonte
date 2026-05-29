"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  nome: string;
  path: string;
  url: string;
  tamanho: number | null;
  criadoEm: string | null;
  origem: "replicate" | "mj" | "hd" | "outro";
  diaInferido: number | null;
  slotInferido: "manha" | "tarde" | null;
};

type Resposta = {
  ok: boolean;
  total: number;
  porOrigem: Record<string, number>;
  itens: Item[];
  erro?: string;
};

const ROTULO: Record<Item["origem"], string> = {
  replicate: "Replicate",
  mj: "Drop manual",
  hd: "Render HD",
  outro: "Outro",
};

function FormAnexar({ url }: { url: string }) {
  const [dia, setDia] = useState("");
  const [slot, setSlot] = useState<"manha" | "tarde">("manha");
  const [estado, setEstado] = useState<"calmo" | "a-anexar" | "ok" | "erro">("calmo");
  const [erro, setErro] = useState<string | null>(null);

  async function anexar() {
    const n = parseInt(dia, 10);
    if (!Number.isFinite(n) || n < 1 || n > 30) {
      setErro("dia entre 1 e 30");
      setEstado("erro");
      return;
    }
    setEstado("a-anexar");
    setErro(null);
    try {
      const r = await fetch("/api/admin/biblioteca/anexar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, dia: n, slot }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro ?? `erro ${r.status}`);
      setEstado("ok");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro");
      setEstado("erro");
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <input
        type="number"
        min={1}
        max={30}
        placeholder="dia"
        value={dia}
        onChange={(e) => setDia(e.target.value)}
        className="w-14 text-xs bg-black/30 border border-[var(--borda)] rounded px-2 py-1 text-[var(--texto)]"
      />
      <select
        value={slot}
        onChange={(e) => setSlot(e.target.value as "manha" | "tarde")}
        className="text-xs bg-black/30 border border-[var(--borda)] rounded px-1 py-1 text-[var(--texto)]"
      >
        <option value="manha">manhã</option>
        <option value="tarde">tarde</option>
      </select>
      <button
        type="button"
        onClick={anexar}
        disabled={estado === "a-anexar"}
        className="text-xs px-2 py-1 rounded border border-[var(--borda-forte)] hover:bg-[var(--ambar)]/10 disabled:opacity-50"
      >
        {estado === "a-anexar" ? "..." : estado === "ok" ? "anexado ✓" : "anexar"}
      </button>
      {erro && <span className="text-[10px] text-[var(--vermelho)]">{erro}</span>}
    </div>
  );
}

export function Biblioteca() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [filtro, setFiltro] = useState<"todos" | Item["origem"]>("todos");
  const [a, setA] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setA(true);
      try {
        const r = await fetch("/api/admin/biblioteca/listar");
        const j = (await r.json()) as Resposta;
        if (cancelado) return;
        if (!r.ok) {
          setErro(j.erro ?? `erro ${r.status}`);
        } else {
          setDados(j);
          setErro(null);
        }
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : "erro");
      } finally {
        if (!cancelado) setA(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    if (filtro === "todos") return dados.itens;
    return dados.itens.filter((i) => i.origem === filtro);
  }, [dados, filtro]);

  if (a && !dados) {
    return <p className="text-sm text-[var(--texto-suave)]">a carregar imagens...</p>;
  }

  if (erro) {
    return (
      <div className="estudio-card-elevado">
        <p className="text-sm text-[var(--vermelho)]">{erro}</p>
      </div>
    );
  }

  if (!dados || dados.total === 0) {
    return (
      <div className="estudio-card-elevado text-sm text-[var(--texto-suave)]">
        Ainda não há imagens em Storage. Quando gerares (Replicate) ou
        arrastares (MJ) qualquer imagem para um dia, aparece aqui
        automaticamente.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mr-2">
          filtros
        </span>
        {(["todos", "replicate", "mj", "hd"] as const).map((f) => {
          const cn =
            f === "todos"
              ? dados.total
              : (dados.porOrigem[f] ?? 0);
          const activo = filtro === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                activo
                  ? "border-[var(--ambar)] bg-[var(--ambar)]/10 text-[var(--ambar-claro)]"
                  : "border-[var(--borda)] text-[var(--texto-suave)] hover:border-[var(--borda-forte)]"
              }`}
            >
              {f === "todos" ? "todos" : ROTULO[f as Item["origem"]]} · {cn}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtrados.map((it) => (
          <div key={it.path} className="estudio-card-elevado">
            <a
              href={it.url}
              target="_blank"
              rel="noreferrer"
              className="block bg-black rounded overflow-hidden mb-2"
              style={{ aspectRatio: "9 / 16" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.nome}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </a>
            <div className="text-[11px] text-[var(--texto-suave)] break-all">
              {it.path}
            </div>
            <div className="text-[10px] mt-1 flex flex-wrap gap-2 text-[var(--texto-mudo)]">
              <span className="text-[var(--oliva)]">{ROTULO[it.origem]}</span>
              {it.diaInferido && (
                <span>
                  dia {it.diaInferido} {it.slotInferido === "tarde" ? "tarde" : "manhã"}
                </span>
              )}
              {it.tamanho && (
                <span>{(it.tamanho / 1024).toFixed(0)} KB</span>
              )}
            </div>
            <FormAnexar url={it.url} />
          </div>
        ))}
      </div>
    </div>
  );
}
