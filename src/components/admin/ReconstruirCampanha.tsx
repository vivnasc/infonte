"use client";

import { useState } from "react";

// Reconstrói a campanha inteira a partir do brief da Vivianne.
// Sequência fixa, idempotente onde possível:
//
//   1. Popular etapas (7 do percurso) — fast
//   2. Popular campanha (30 manhã do brief markdown) — fast
//   3. Aplicar bold aos 30 posts da manhã — fast
//   4. Apagar todas as 30 tarde (limpeza)
//   5. Gerar 30 posts tarde com prompt novo (3 lotes, ~$0.15)
//   6. Imagens manhã 1-30 prefer-existing (6 lotes, salta o que existe)
//   7. Imagens tarde 1-30 prefer-existing (6 lotes, todas novas)
//   8. Render HD 30 manhã (dispara workflow)
//   9. Render HD 30 tarde (dispara workflow)
//
// Os passos são chamadas HTTP separadas, cada uma respeita o
// maxDuration do Vercel. Cada um mostra o estado em tempo real.

type Estado = "pendente" | "a-correr" | "ok" | "erro";

type Passo = { id: string; rotulo: string; url: string };

const PASSOS: Passo[] = [
  { id: "etapas", rotulo: "Popular 7 etapas", url: "/api/admin/seed/etapas" },
  { id: "manha", rotulo: "Popular 30 manhã (do brief)", url: "/api/admin/seed/campanha" },
  { id: "bold", rotulo: "Aplicar bold aos 30 manhã", url: "/api/admin/campanha/formatar-bold" },
  { id: "expand-m1", rotulo: "Expandir manhã 1-5 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=1&fim=5" },
  { id: "expand-m2", rotulo: "Expandir manhã 6-10 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=6&fim=10" },
  { id: "expand-m3", rotulo: "Expandir manhã 11-15 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=11&fim=15" },
  { id: "expand-m4", rotulo: "Expandir manhã 16-20 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=16&fim=20" },
  { id: "expand-m5", rotulo: "Expandir manhã 21-25 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=21&fim=25" },
  { id: "expand-m6", rotulo: "Expandir manhã 26-30 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=manha&inicio=26&fim=30" },
  { id: "wipe-tarde", rotulo: "Apagar 30 tarde antigas", url: "/api/admin/campanha/wipe-tarde" },
  { id: "tarde-1", rotulo: "Gerar tarde dias 1-10 (Claude)", url: "/api/admin/campanha/gerar-tarde?inicio=1&fim=10" },
  { id: "tarde-2", rotulo: "Gerar tarde dias 11-20 (Claude)", url: "/api/admin/campanha/gerar-tarde?inicio=11&fim=20" },
  { id: "tarde-3", rotulo: "Gerar tarde dias 21-30 (Claude)", url: "/api/admin/campanha/gerar-tarde?inicio=21&fim=30" },
  { id: "expand-t1", rotulo: "Expandir tarde 1-5 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=1&fim=5" },
  { id: "expand-t2", rotulo: "Expandir tarde 6-10 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=6&fim=10" },
  { id: "expand-t3", rotulo: "Expandir tarde 11-15 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=11&fim=15" },
  { id: "expand-t4", rotulo: "Expandir tarde 16-20 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=16&fim=20" },
  { id: "expand-t5", rotulo: "Expandir tarde 21-25 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=21&fim=25" },
  { id: "expand-t6", rotulo: "Expandir tarde 26-30 em carrosséis", url: "/api/admin/campanha/expandir-singles?slot=tarde&inicio=26&fim=30" },
  { id: "limpar-travessoes", rotulo: "Limpar travessões dos 60 posts", url: "/api/admin/campanha/limpar-travessoes" },
  { id: "bold-m1", rotulo: "Aplicar bold manhã 1-5 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=1&fim=5" },
  { id: "bold-m2", rotulo: "Aplicar bold manhã 6-10 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=6&fim=10" },
  { id: "bold-m3", rotulo: "Aplicar bold manhã 11-15 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=11&fim=15" },
  { id: "bold-m4", rotulo: "Aplicar bold manhã 16-20 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=16&fim=20" },
  { id: "bold-m5", rotulo: "Aplicar bold manhã 21-25 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=21&fim=25" },
  { id: "bold-m6", rotulo: "Aplicar bold manhã 26-30 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=manha&inicio=26&fim=30" },
  { id: "bold-t1", rotulo: "Aplicar bold tarde 1-5 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=1&fim=5" },
  { id: "bold-t2", rotulo: "Aplicar bold tarde 6-10 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=6&fim=10" },
  { id: "bold-t3", rotulo: "Aplicar bold tarde 11-15 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=11&fim=15" },
  { id: "bold-t4", rotulo: "Aplicar bold tarde 16-20 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=16&fim=20" },
  { id: "bold-t5", rotulo: "Aplicar bold tarde 21-25 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=21&fim=25" },
  { id: "bold-t6", rotulo: "Aplicar bold tarde 26-30 (Claude)", url: "/api/admin/campanha/aplicar-bold-carrosseis?slot=tarde&inicio=26&fim=30" },
  { id: "img-m1", rotulo: "Imagens manhã 1-5", url: "/api/admin/campanha/imagens-replicate?inicio=1&fim=5&slot=manha&strategy=prefer-existing" },
  { id: "img-m2", rotulo: "Imagens manhã 6-10", url: "/api/admin/campanha/imagens-replicate?inicio=6&fim=10&slot=manha&strategy=prefer-existing" },
  { id: "img-m3", rotulo: "Imagens manhã 11-15", url: "/api/admin/campanha/imagens-replicate?inicio=11&fim=15&slot=manha&strategy=prefer-existing" },
  { id: "img-m4", rotulo: "Imagens manhã 16-20", url: "/api/admin/campanha/imagens-replicate?inicio=16&fim=20&slot=manha&strategy=prefer-existing" },
  { id: "img-m5", rotulo: "Imagens manhã 21-25", url: "/api/admin/campanha/imagens-replicate?inicio=21&fim=25&slot=manha&strategy=prefer-existing" },
  { id: "img-m6", rotulo: "Imagens manhã 26-30", url: "/api/admin/campanha/imagens-replicate?inicio=26&fim=30&slot=manha&strategy=prefer-existing" },
  { id: "img-t1", rotulo: "Imagens tarde 1-5", url: "/api/admin/campanha/imagens-replicate?inicio=1&fim=5&slot=tarde&strategy=prefer-existing" },
  { id: "img-t2", rotulo: "Imagens tarde 6-10", url: "/api/admin/campanha/imagens-replicate?inicio=6&fim=10&slot=tarde&strategy=prefer-existing" },
  { id: "img-t3", rotulo: "Imagens tarde 11-15", url: "/api/admin/campanha/imagens-replicate?inicio=11&fim=15&slot=tarde&strategy=prefer-existing" },
  { id: "img-t4", rotulo: "Imagens tarde 16-20", url: "/api/admin/campanha/imagens-replicate?inicio=16&fim=20&slot=tarde&strategy=prefer-existing" },
  { id: "img-t5", rotulo: "Imagens tarde 21-25", url: "/api/admin/campanha/imagens-replicate?inicio=21&fim=25&slot=tarde&strategy=prefer-existing" },
  { id: "img-t6", rotulo: "Imagens tarde 26-30", url: "/api/admin/campanha/imagens-replicate?inicio=26&fim=30&slot=tarde&strategy=prefer-existing" },
  // Render HD intencionalmente FORA daqui. A Vivianne quer ver preview
  // (HTML) primeiro, aprovar, e depois disparar render manualmente nos
  // botões "render manhã" / "render tarde" do painel ou por semana
  // na tabela cobertura.
];

type Linha = { estado: Estado; detalhe?: string; erro?: string };

export function ReconstruirCampanha() {
  const [resultados, setResultados] = useState<Record<string, Linha>>({});
  const [emCurso, setEmCurso] = useState(false);
  const [pararEm, setPararEm] = useState<string | null>(null);

  async function correr() {
    setEmCurso(true);
    setPararEm(null);
    const ini: Record<string, Linha> = {};
    for (const p of PASSOS) ini[p.id] = { estado: "pendente" };
    setResultados(ini);

    for (const p of PASSOS) {
      setResultados((cur) => ({ ...cur, [p.id]: { estado: "a-correr" } }));
      try {
        const r = await fetch(p.url, { method: "POST" });
        const texto = await r.text();
        let j: { ok?: boolean; erro?: string; gerados?: number; reusados?: number; saltados?: number; atualizados?: number; apagados?: number; jobId?: string };
        try {
          j = JSON.parse(texto);
        } catch {
          setResultados((cur) => ({
            ...cur,
            [p.id]: { estado: "erro", erro: `resposta não-JSON (${r.status})`, detalhe: texto.slice(0, 100) },
          }));
          setPararEm(p.id);
          break;
        }
        if (!r.ok || j.erro) {
          setResultados((cur) => ({
            ...cur,
            [p.id]: { estado: "erro", erro: j.erro ?? `erro ${r.status}` },
          }));
          setPararEm(p.id);
          break;
        }
        const partes: string[] = [];
        if (j.gerados != null) partes.push(`${j.gerados} gerados`);
        if (j.reusados != null && j.reusados > 0) partes.push(`${j.reusados} reusados`);
        if (j.saltados != null && j.saltados > 0) partes.push(`${j.saltados} saltados`);
        if (j.atualizados != null) partes.push(`${j.atualizados} actualizados`);
        if (j.apagados != null) partes.push(`${j.apagados} apagados`);
        if (j.jobId) partes.push(`job ${j.jobId}`);
        setResultados((cur) => ({
          ...cur,
          [p.id]: { estado: "ok", detalhe: partes.join(" · ") || "ok" },
        }));
      } catch (e) {
        setResultados((cur) => ({
          ...cur,
          [p.id]: { estado: "erro", erro: e instanceof Error ? e.message : "erro" },
        }));
        setPararEm(p.id);
        break;
      }
    }

    setEmCurso(false);
  }

  return (
    <div
      className="estudio-card"
      style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--ambar)]">
        reconstruir a campanha do brief
      </div>
      <h3 className="estudio-titulo text-xl mt-1">Recompor 60 posts + imagens (sem render)</h3>
      <p className="text-sm text-[var(--texto-suave)] mt-2 max-w-leitura">
        Apaga as 30 tarde antigas, lê os teus markdowns para repopular as
        30 manhã, expande singles em carrosséis de 10 slides (manhã
        didáctico, tarde emocional) e completa imagens em falta.
        <strong className="text-[var(--ambar)]"> NÃO dispara render HD</strong>:
        primeiro vês a pré-visualização e aprovas. O render é um clique
        separado no painel quando quiseres. Custo: ~$3.20 em créditos.
        Duração: ~5 min.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href="/admin/preview-tudo"
          target="_blank"
          rel="noreferrer"
          className="estudio-btn text-xs"
        >
          abrir pré-visualização tudo (novo separador) →
        </a>
        <span className="text-[11px] text-[var(--texto-mudo)] self-center">
          deixa aberto e refresca durante a reconstrução para veres
          os carrosséis a aparecer
        </span>
      </div>

      <button
        onClick={correr}
        disabled={emCurso}
        className="estudio-btn estudio-btn-primario mt-4"
      >
        {emCurso ? "a reconstruir..." : "reconstruir tudo agora"}
      </button>

      {Object.keys(resultados).length > 0 && (
        <ul className="mt-5 space-y-1.5 text-xs">
          {PASSOS.map((p) => {
            const r = resultados[p.id];
            if (!r) return null;
            const icone =
              r.estado === "ok"
                ? "✓"
                : r.estado === "erro"
                ? "✗"
                : r.estado === "a-correr"
                ? "·"
                : " ";
            const cor =
              r.estado === "ok"
                ? "text-[var(--verde)]"
                : r.estado === "erro"
                ? "text-[var(--vermelho)]"
                : r.estado === "a-correr"
                ? "text-[var(--ambar)]"
                : "text-[var(--texto-mudo)]";
            return (
              <li key={p.id} className={cor}>
                <span className="font-mono mr-2">{icone}</span>
                <span>{p.rotulo}</span>
                {r.detalhe && (
                  <span className="text-[var(--texto-suave)]"> · {r.detalhe}</span>
                )}
                {r.erro && <span className="text-[var(--vermelho)]"> · {r.erro}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {pararEm && (
        <div className="text-[11px] text-[var(--vermelho)] mt-3">
          Parou em <span className="font-mono">{pararEm}</span>. Clica
          &quot;reconstruir tudo agora&quot; outra vez — a sequência é idempotente,
          retoma do passo onde parou (etapas/manhã/bold já feitas saltam,
          tarde gera só os 30 vazios, imagens prefer-existing saltam o
          que existe).
        </div>
      )}
    </div>
  );
}
