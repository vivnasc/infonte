"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/routing";

type Slide = { idx: number; modo: string; temImagem: boolean };
type PostInfo = {
  dia: number;
  slot: string;
  semana: number;
  tema: string;
  estado: string;
  temTextoImagem: boolean;
  temImagem: boolean;
  slides: Slide[];
};

type Filtro = "todos" | "manha" | "tarde";

type Modo = "antes" | "depois";

function SlideThumb({
  dia,
  slot,
  idx,
  modo,
  urlDepois,
}: {
  dia: number;
  slot: string;
  idx: number;
  modo: Modo;
  urlDepois?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy load via IntersectionObserver
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisivel(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const semRender = modo === "depois" && !urlDepois;

  return (
    <div
      ref={ref}
      className="relative bg-black rounded overflow-hidden border border-[var(--borda)]"
      style={{ aspectRatio: "1080 / 1350" }}
    >
      {!visivel ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--texto-mudo)]">
          ...
        </div>
      ) : semRender ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--texto-mudo)] text-center px-2">
          ainda sem render HD
        </div>
      ) : modo === "depois" && urlDepois ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlDepois}
          alt={`Dia ${dia} ${slot} slide ${idx}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <iframe
          src={`/api/admin/campanha/${dia}/preview?slot=${slot}&slide=${idx}`}
          title={`Dia ${dia} ${slot} slide ${idx}`}
          className="absolute inset-0 w-full h-full"
          style={{
            transform: "scale(0.33)",
            transformOrigin: "top left",
            width: "303%",
            height: "303%",
            border: "0",
          }}
        />
      )}
      <div className="absolute bottom-1 left-1 text-[9px] font-mono text-[var(--texto-mudo)] bg-black/60 px-1 rounded">
        {String(idx).padStart(2, "0")}
      </div>
    </div>
  );
}

// Cache de PNGs renderizados por (dia, slot). Carregamento lazy quando
// a Vivianne troca para "depois".
function useRendersHD(posts: PostInfo[] | null, modo: Modo) {
  const [renders, setRenders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (modo !== "depois" || !posts) return;
    let cancelado = false;
    async function carregar() {
      const novos: Record<string, string[]> = {};
      // Paralelo, mas em pequenos lotes para não rebentar a rede
      const LOTE = 8;
      for (let i = 0; i < posts!.length; i += LOTE) {
        const lote = posts!.slice(i, i + LOTE);
        await Promise.all(
          lote.map(async (p) => {
            const k = `${p.dia}-${p.slot}`;
            try {
              const r = await fetch(`/api/admin/campanha/${p.dia}/renders-hd?slot=${p.slot}`);
              const j = await r.json();
              if (j.ok && j.urls) novos[k] = j.urls;
              else novos[k] = [];
            } catch {
              novos[k] = [];
            }
          })
        );
        if (cancelado) return;
      }
      if (!cancelado) setRenders(novos);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [modo, posts]);

  return renders;
}

export function PreviewTudo() {
  const [posts, setPosts] = useState<PostInfo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [a, setA] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [semana, setSemana] = useState<number | null>(null);
  const [modo, setModo] = useState<Modo>("antes");
  const renders = useRendersHD(posts, modo);

  useEffect(() => {
    setA(true);
    fetch("/api/admin/campanha/preview-tudo")
      .then((r) => r.json())
      .then((j) => {
        if (j.erro) throw new Error(j.erro);
        setPosts(j.posts ?? []);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "erro"))
      .finally(() => setA(false));
  }, []);

  const filtrados = useMemo(() => {
    if (!posts) return [];
    return posts.filter((p) => {
      if (filtro !== "todos" && p.slot !== filtro) return false;
      if (semana != null && p.semana !== semana) return false;
      return true;
    });
  }, [posts, filtro, semana]);

  const totaisGlobais = useMemo(() => {
    if (!posts) return { posts: 0, slides: 0 };
    return {
      posts: posts.length,
      slides: posts.reduce((acc, p) => acc + p.slides.length, 0),
    };
  }, [posts]);

  if (a && !posts) return <div className="text-sm text-[var(--texto-suave)]">a carregar todos os dias...</div>;
  if (erro) return <div className="text-sm text-[var(--vermelho)]">{erro}</div>;
  if (!posts) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">modo</span>
        <div className="flex gap-1">
          {(["antes", "depois"] as Modo[]).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-3 py-1 rounded-full text-xs border ${
                modo === m
                  ? "border-[var(--ambar)] bg-[var(--ambar)]/10 text-[var(--ambar-claro)]"
                  : "border-[var(--borda)] text-[var(--texto-suave)] hover:border-[var(--borda-forte)]"
              }`}
            >
              {m === "antes" ? "antes (HTML preview)" : "depois (PNG renderizado)"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">filtros</span>
        <div className="flex gap-1">
          {(["todos", "manha", "tarde"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full text-xs border ${
                filtro === f
                  ? "border-[var(--ambar)] bg-[var(--ambar)]/10 text-[var(--ambar-claro)]"
                  : "border-[var(--borda)] text-[var(--texto-suave)] hover:border-[var(--borda-forte)]"
              }`}
            >
              {f === "todos" ? "todos" : f === "manha" ? "manhã" : "tarde"}
            </button>
          ))}
        </div>
        <div className="text-[var(--texto-mudo)] text-xs">|</div>
        <div className="flex gap-1">
          {[null, 1, 2, 3, 4].map((s) => (
            <button
              key={String(s)}
              onClick={() => setSemana(s)}
              className={`px-3 py-1 rounded-full text-xs border ${
                semana === s
                  ? "border-[var(--ambar)] bg-[var(--ambar)]/10 text-[var(--ambar-claro)]"
                  : "border-[var(--borda)] text-[var(--texto-suave)] hover:border-[var(--borda-forte)]"
              }`}
            >
              {s == null ? "todas semanas" : `semana ${s}`}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[var(--texto-mudo)]">
          {filtrados.length} posts · {filtrados.reduce((acc, p) => acc + p.slides.length, 0)} slides
          {filtro === "todos" && semana == null && (
            <span> (de {totaisGlobais.posts} / {totaisGlobais.slides})</span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {filtrados.map((p) => {
          const numColunas = Math.min(8, Math.max(3, p.slides.length || 1));
          return (
            <div key={`${p.dia}-${p.slot}`} className="estudio-card">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                <div>
                  <span className="font-serif text-lg text-[var(--ambar)] mr-3">
                    dia {p.dia}
                  </span>
                  <span className="text-[var(--texto-suave)] text-xs uppercase tracking-[0.2em] mr-3">
                    {p.slot === "tarde" ? "tarde 13h" : "manhã 10h"}
                  </span>
                  <span className="font-serif text-[var(--texto)]">{p.tema}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`estudio-pill ${p.estado}`}>{p.estado}</span>
                  <Link
                    href={`/admin/campanha/${p.dia}?slot=${p.slot}`}
                    className="text-xs text-[var(--ambar)] hover:underline"
                  >
                    editar →
                  </Link>
                </div>
              </div>
              {p.slides.length === 0 ? (
                <div className="text-xs text-[var(--texto-mudo)] italic">
                  ainda sem texto_imagem
                </div>
              ) : (
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${Math.min(4, numColunas)}, minmax(0, 1fr))` }}
                >
                  {p.slides.map((s) => {
                    const k = `${p.dia}-${p.slot}`;
                    const urlsDep = renders[k] ?? [];
                    return (
                      <SlideThumb
                        key={s.idx}
                        dia={p.dia}
                        slot={p.slot}
                        idx={s.idx}
                        modo={modo}
                        urlDepois={urlsDep[s.idx - 1]}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
