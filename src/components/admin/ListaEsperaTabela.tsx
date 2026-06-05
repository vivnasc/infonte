"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Linha = {
  id: string;
  nome: string;
  email: string;
  fonte: string | null;
  criado_em: string;
  codigo_desconto: string | null;
  convertido_em: string | null;
};

type Filtro = "todas" | "convertidas" | "naoconvertidas";

function fmtData(s: string | null): string {
  if (!s) return "—";
  // TIMESTAMPTZ vem em UTC; apresentar em hora de Maputo.
  return new Date(s).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export function ListaEsperaTabela({ linhas }: { linhas: Linha[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busy, setBusy] = useState<string | null>(null);

  const total = linhas.length;
  const convertidas = linhas.filter((l) => l.convertido_em).length;

  const visiveis = linhas.filter((l) =>
    filtro === "todas"
      ? true
      : filtro === "convertidas"
      ? !!l.convertido_em
      : !l.convertido_em
  );

  async function marcar(id: string, convertido: boolean) {
    setBusy(id);
    try {
      await fetch("/api/admin/lista-espera/marcar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, convertido }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const tabFiltro = (valor: Filtro, label: string) => (
    <button
      onClick={() => setFiltro(valor)}
      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
        filtro === valor
          ? "bg-[var(--acento,#B8843D)] text-white"
          : "text-[var(--texto-suave)] hover:text-[var(--texto)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="text-sm text-[var(--texto-suave)]">
          <span className="text-2xl font-serif text-[var(--texto)]">{total}</span>{" "}
          inscritas
          <span className="mx-2">·</span>
          {convertidas} convertidas
        </div>
        <div className="flex items-center gap-2">
          {tabFiltro("todas", "todas")}
          {tabFiltro("naoconvertidas", "não convertidas")}
          {tabFiltro("convertidas", "convertidas")}
          <a
            href="/api/admin/lista-espera/exportar.csv"
            className="px-3 py-1.5 rounded-full text-xs border border-[var(--linha,#0002)] text-[var(--texto-suave)] hover:text-[var(--texto)] ml-2"
          >
            ↓ exportar CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] border-b border-[var(--linha,#0002)]">
              <th className="py-2 pr-4 font-normal">data</th>
              <th className="py-2 pr-4 font-normal">nome</th>
              <th className="py-2 pr-4 font-normal">email</th>
              <th className="py-2 pr-4 font-normal">fonte</th>
              <th className="py-2 pr-4 font-normal">código</th>
              <th className="py-2 pr-4 font-normal">convertida</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => (
              <tr
                key={l.id}
                className="border-b border-[var(--linha,#0001)] align-middle"
              >
                <td className="py-2.5 pr-4 whitespace-nowrap text-[var(--texto-suave)]">
                  {fmtData(l.criado_em)}
                </td>
                <td className="py-2.5 pr-4">{l.nome}</td>
                <td className="py-2.5 pr-4 text-[var(--texto-suave)]">
                  {l.email}
                </td>
                <td className="py-2.5 pr-4 text-[var(--texto-suave)]">
                  {l.fonte ?? "direto"}
                </td>
                <td className="py-2.5 pr-4 font-mono text-xs">
                  {l.codigo_desconto ?? "—"}
                </td>
                <td className="py-2.5 pr-4">
                  {l.convertido_em ? (
                    <span className="text-green-700">sim</span>
                  ) : (
                    <span className="text-[var(--texto-mudo)]">não</span>
                  )}
                </td>
                <td className="py-2.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => marcar(l.id, !l.convertido_em)}
                    disabled={busy === l.id}
                    className="text-xs underline text-[var(--texto-suave)] hover:text-[var(--texto)] disabled:opacity-50"
                  >
                    {busy === l.id
                      ? "..."
                      : l.convertido_em
                      ? "desmarcar"
                      : "marcar convertida"}
                  </button>
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-[var(--texto-mudo)]"
                >
                  sem inscrições neste filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
