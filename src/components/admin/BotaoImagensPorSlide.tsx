"use client";

import { useState } from "react";

// Gera imagens DISTINTAS por slide para todos os carrosséis em sequência.
// 1 dia por chamada para caber no 60s do Vercel. Cliente faz o loop.
// 60 dias × ~30s = ~30 min. Custo total: ~$10-12 em Replicate.

type Estado = "calmo" | "a-correr" | "ok" | "erro";

type Linha = {
  dia: number;
  slot: "manha" | "tarde";
  estado: "pendente" | "a-correr" | "ok" | "saltado" | "erro";
  msg?: string;
};

export function BotaoImagensPorSlide() {
  const [estado, setEstado] = useState<Estado>("calmo");
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [max, setMax] = useState(5);

  function inicializar(): Linha[] {
    const out: Linha[] = [];
    for (let dia = 1; dia <= 30; dia++) {
      out.push({ dia, slot: "manha", estado: "pendente" });
    }
    for (let dia = 1; dia <= 30; dia++) {
      out.push({ dia, slot: "tarde", estado: "pendente" });
    }
    return out;
  }

  function atualizar(dia: number, slot: "manha" | "tarde", patch: Partial<Linha>) {
    setLinhas((cur) =>
      cur.map((l) => (l.dia === dia && l.slot === slot ? { ...l, ...patch } : l))
    );
  }

  async function correr() {
    setEstado("a-correr");
    const ini = inicializar();
    setLinhas(ini);

    for (const l of ini) {
      atualizar(l.dia, l.slot, { estado: "a-correr" });
      try {
        const r = await fetch(
          `/api/admin/campanha/imagens-por-slide?inicio=${l.dia}&fim=${l.dia}&slot=${l.slot}&max=${max}`,
          { method: "POST" }
        );
        const j = await r.json();
        if (!r.ok || j.erro) {
          atualizar(l.dia, l.slot, { estado: "erro", msg: j.erro ?? `erro ${r.status}` });
          continue;
        }
        const log0 = (j.log?.[0] as string | undefined) ?? "";
        if (log0.includes("saltado") || (j.saltados ?? 0) > 0) {
          atualizar(l.dia, l.slot, { estado: "saltado", msg: log0 });
        } else if ((j.gerados ?? 0) > 0) {
          atualizar(l.dia, l.slot, { estado: "ok", msg: log0 });
        } else {
          atualizar(l.dia, l.slot, { estado: "saltado", msg: log0 });
        }
      } catch (e) {
        atualizar(l.dia, l.slot, {
          estado: "erro",
          msg: e instanceof Error ? e.message : "erro",
        });
      }
    }

    setEstado("ok");
  }

  const totalOk = linhas.filter((l) => l.estado === "ok").length;
  const totalErro = linhas.filter((l) => l.estado === "erro").length;
  const totalSaltado = linhas.filter((l) => l.estado === "saltado").length;
  const totalPendente = linhas.filter((l) => l.estado === "pendente").length;
  const totalCorrer = linhas.filter((l) => l.estado === "a-correr").length;

  return (
    <div
      className="estudio-card"
      style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--ambar)]">
        imagens distintas por slide
      </div>
      <h3 className="estudio-titulo text-xl mt-1">
        Gerar até {max} imagens distintas por carrossel
      </h3>
      <p className="text-sm text-[var(--texto-suave)] mt-2 max-w-leitura">
        Para cada carrossel (60 dias × 2 slots), Claude escreve 5 prompts
        visuais (um por slide-chave) e FLUX 1.1 Pro gera 5 imagens
        distintas. Sobescreve imagem única anterior. Custo total:
        ~${(60 * max * 0.04).toFixed(2)} em Replicate + ~${(60 * 0.01).toFixed(2)} em
        Claude. Duração: ~30 min (1 dia por chamada).
      </p>

      <div className="flex items-center gap-3 mt-3 text-xs">
        <label>
          imagens por carrossel:{" "}
          <select
            value={max}
            onChange={(e) => setMax(parseInt(e.target.value, 10))}
            disabled={estado === "a-correr"}
            className="bg-black/30 border border-[var(--borda)] rounded px-2 py-1"
          >
            {[3, 4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={correr}
        disabled={estado === "a-correr"}
        className="estudio-btn estudio-btn-primario mt-3"
      >
        {estado === "a-correr"
          ? `a gerar... (${totalOk + totalErro + totalSaltado}/${linhas.length})`
          : estado === "ok"
          ? `terminado: ${totalOk} ok, ${totalSaltado} saltados, ${totalErro} erros`
          : "gerar imagens distintas por slide"}
      </button>

      {linhas.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs max-h-96 overflow-y-auto">
          {(["manha", "tarde"] as const).map((slot) => (
            <div key={slot}>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-2">
                {slot === "manha" ? "manhã" : "tarde"}
              </div>
              <ul className="space-y-0.5">
                {linhas
                  .filter((l) => l.slot === slot)
                  .map((l) => {
                    const cor =
                      l.estado === "ok"
                        ? "text-[var(--verde)]"
                        : l.estado === "erro"
                        ? "text-[var(--vermelho)]"
                        : l.estado === "saltado"
                        ? "text-[var(--texto-mudo)]"
                        : l.estado === "a-correr"
                        ? "text-[var(--ambar)]"
                        : "text-[var(--texto-mudo)]";
                    const icone =
                      l.estado === "ok"
                        ? "✓"
                        : l.estado === "erro"
                        ? "✗"
                        : l.estado === "saltado"
                        ? "·"
                        : l.estado === "a-correr"
                        ? "→"
                        : " ";
                    return (
                      <li key={l.dia} className={cor}>
                        <span className="font-mono mr-2">{icone}</span>
                        dia {String(l.dia).padStart(2, "0")}
                        {l.msg && <span className="ml-2 opacity-70">{l.msg.slice(0, 40)}</span>}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[var(--texto-mudo)] mt-4">
        Pode-se interromper a meio (fechar separador). Re-clicar continua
        do dia onde parou — singles e dias com imagens já preenchidas
        saltam automaticamente.
      </p>
    </div>
  );
}
