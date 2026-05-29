"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { PreviewSemana } from "./PreviewSemana";

// Modo guiado: leva a Vivianne, passo a passo, do estado actual até
// "CSV pronto para o Metricool". Cada passo tem 3 estados visíveis:
//   - bloqueado (ainda não chegaste cá)
//   - actual    (faz isto agora)
//   - completo  (verde, segue em frente)
//
// O wizard chama os endpoints existentes; não duplica lógica. A
// verificação de "completo" lê o estado real da base de dados,
// não confia em flags locais.

type EstadoCampanha = {
  total: number;
  tarde: number;
  manha: number;
  semBold: number;
  semImagemManha: number;
  semImagemTarde: number;
  rendered: number; // estado pronto/agendado/publicado
  agendados: number;
  duplicados: number;
  semanaErrada: number;
};

type Passo = {
  id: string;
  rotulo: string;
  descricao: string;
  feito: (e: EstadoCampanha) => boolean;
  proximo?: string;
  bloco: React.ReactNode;
};

async function lerEstado(): Promise<EstadoCampanha> {
  const [aud, manhaEst, tardeEst] = await Promise.all([
    fetch("/api/admin/campanha/auditoria").then((r) => r.json()),
    fetch("/api/admin/campanha/imagens-replicate/estimativa?inicio=1&fim=30&slot=manha&strategy=prefer-existing")
      .then((r) => r.json()),
    fetch("/api/admin/campanha/imagens-replicate/estimativa?inicio=1&fim=30&slot=tarde&strategy=prefer-existing")
      .then((r) => r.json()),
  ]);

  return {
    total: aud.total ?? 0,
    tarde: aud.porSlot?.tarde ?? 0,
    manha: aud.porSlot?.manha ?? 0,
    semBold: 0,
    semImagemManha: manhaEst.dias_total ? manhaEst.dias_total - manhaEst.dias_com_imagem : 30,
    semImagemTarde: tardeEst.dias_total ? tardeEst.dias_total - tardeEst.dias_com_imagem : 30,
    rendered: 0,
    agendados: 0,
    duplicados: aud.contagens?.duplicados ?? 0,
    semanaErrada: aud.contagens?.semanaErrada ?? 0,
  };
}

async function call(url: string, init?: RequestInit): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const r = await fetch(url, init);
  let json: Record<string, unknown> = {};
  try {
    json = await r.json();
  } catch {
    json = { erro: `resposta não-JSON (${r.status})` };
  }
  return { ok: r.ok, json };
}

function Pastilha({ feito, activo }: { feito: boolean; activo: boolean }) {
  if (feito) {
    return <span className="estudio-pill pronto">✓ feito</span>;
  }
  if (activo) {
    return <span className="estudio-pill agendado">faz agora →</span>;
  }
  return <span className="estudio-pill rascunho">a seguir</span>;
}

function BlocoAcao({
  estado,
  textoOk,
  textoErro,
  rotulo,
  exec,
  apos,
}: {
  estado: "calmo" | "a-correr" | "ok" | "erro";
  textoOk?: string;
  textoErro?: string;
  rotulo: string;
  exec: () => Promise<void>;
  apos?: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <button
        onClick={exec}
        disabled={estado === "a-correr"}
        className="estudio-btn estudio-btn-primario disabled:opacity-50"
      >
        {estado === "a-correr" ? "a correr..." : rotulo}
      </button>
      {estado === "ok" && textoOk && (
        <span className="ml-3 text-sm text-[var(--verde)]">{textoOk}</span>
      )}
      {estado === "erro" && textoErro && (
        <span className="ml-3 text-sm text-[var(--vermelho)]">{textoErro}</span>
      )}
      {apos}
    </div>
  );
}

export function ModoGuiado() {
  const [estado, setEstado] = useState<EstadoCampanha | null>(null);
  const [a, setA] = useState(false);

  // Estados por passo
  const [s1, setS1] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s2bold, setS2bold] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s2tarde, setS2tarde] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s3, setS3] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s3manha, setS3manha] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s3tardeImg, setS3tardeImg] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s4, setS4] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [s4semana, setS4semana] = useState(1);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [thumbs, setThumbs] = useState<string[]>([]);

  async function refrescar() {
    setA(true);
    try {
      const e = await lerEstado();
      setEstado(e);
    } finally {
      setA(false);
    }
  }

  useEffect(() => {
    refrescar();
  }, []);

  if (!estado) {
    return <div className="text-sm text-[var(--texto-suave)]">a ler estado da campanha...</div>;
  }

  // Lógica de "feito"
  const passo1Feito = estado.total > 0 && estado.duplicados === 0 && estado.semanaErrada === 0;
  const passo2Feito = estado.tarde >= 30;
  const passo3ManhaFeito = estado.semImagemManha === 0;
  const passo3TardeFeito = estado.semImagemTarde === 0;
  const passo3Feito = passo3ManhaFeito && passo3TardeFeito;

  return (
    <div className="space-y-6">
      <div
        className="estudio-card"
        style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
      >
        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--ambar)]">
          modo guiado, passo a passo
        </div>
        <h2 className="estudio-titulo text-2xl mt-1">Produzir campanha de 30 dias</h2>
        <p className="text-sm text-[var(--texto-suave)] mt-2 max-w-leitura">
          Segue a ordem. Cada passo confirma o resultado antes de te deixar
          passar ao seguinte. Podes interromper e voltar quando quiseres
          que o sítio aparece no estado certo.
        </p>
        <div className="text-xs text-[var(--texto-mudo)] mt-3">
          {estado.total}/60 posts · {estado.manha} manhã · {estado.tarde} tarde ·{" "}
          {30 - estado.semImagemManha}/30 imagem manhã ·{" "}
          {30 - estado.semImagemTarde}/30 imagem tarde ·{" "}
          {estado.duplicados} duplicados
        </div>
        <button onClick={refrescar} disabled={a} className="estudio-btn text-xs mt-3 disabled:opacity-50">
          {a ? "a actualizar..." : "actualizar estado"}
        </button>
      </div>

      {/* PASSO 1: limpar a base */}
      <PassoCard
        n={1}
        titulo="Limpar a base"
        descricao="Detectar e corrigir duplicados e semanas inconsistentes. Sem isto, os passos seguintes vão mostrar contagens estranhas."
        feito={passo1Feito}
        activo={!passo1Feito}
        sumario={
          passo1Feito
            ? "✓ base limpa, sem duplicados nem semanas erradas"
            : `${estado.duplicados} duplicados · ${estado.semanaErrada} semanas erradas`
        }
      >
        {!passo1Feito && (
          <BlocoAcao
            estado={s1}
            rotulo="corrigir agora"
            textoOk={msg.s1}
            textoErro={msg.s1err}
            exec={async () => {
              setS1("a-correr");
              const { ok, json } = await call("/api/admin/campanha/auditoria/corrigir", { method: "POST" });
              if (ok) {
                setS1("ok");
                setMsg((m) => ({
                  ...m,
                  s1: `${json.apagados ?? 0} apagados · ${json.semanaAjustada ?? 0} semanas ajustadas`,
                }));
                await refrescar();
              } else {
                setS1("erro");
                setMsg((m) => ({ ...m, s1err: String(json.erro ?? "erro") }));
              }
            }}
          />
        )}
      </PassoCard>

      {/* PASSO 2: conteúdo */}
      <PassoCard
        n={2}
        titulo="Conteúdo"
        descricao="Bold nas palavras-chave das artes + gerar os 30 posts da tarde via Claude. Idempotente."
        feito={passo2Feito}
        activo={passo1Feito && !passo2Feito}
        bloqueado={!passo1Feito}
        sumario={
          passo2Feito
            ? `✓ ${estado.tarde}/30 tarde gerados`
            : `${estado.tarde}/30 tarde gerados`
        }
      >
        {passo1Feito && (
          <>
            <BlocoAcao
              estado={s2bold}
              rotulo="2.1 — aplicar bold aos 30 posts"
              textoOk={msg.s2bold}
              textoErro={msg.s2bolderr}
              exec={async () => {
                setS2bold("a-correr");
                const { ok, json } = await call("/api/admin/campanha/formatar-bold", { method: "POST" });
                if (ok) {
                  setS2bold("ok");
                  setMsg((m) => ({ ...m, s2bold: `${json.atualizados ?? 0} actualizados` }));
                } else {
                  setS2bold("erro");
                  setMsg((m) => ({ ...m, s2bolderr: String(json.erro ?? "erro") }));
                }
              }}
            />
            <BlocoAcao
              estado={s2tarde}
              rotulo="2.2 — gerar 30 posts da tarde (em 3 lotes)"
              textoOk={msg.s2tarde}
              textoErro={msg.s2tardeerr}
              exec={async () => {
                setS2tarde("a-correr");
                const lotes = ["1&fim=10", "11&fim=20", "21&fim=30"];
                let totalGerados = 0;
                let totalSaltados = 0;
                for (const l of lotes) {
                  const { ok, json } = await call(
                    `/api/admin/campanha/gerar-tarde?inicio=${l}`,
                    { method: "POST" }
                  );
                  if (!ok) {
                    setS2tarde("erro");
                    setMsg((m) => ({ ...m, s2tardeerr: String(json.erro ?? "erro") }));
                    return;
                  }
                  totalGerados += Number(json.gerados ?? 0);
                  totalSaltados += Number(json.saltados ?? 0);
                }
                setS2tarde("ok");
                setMsg((m) => ({
                  ...m,
                  s2tarde: `${totalGerados} gerados · ${totalSaltados} saltados`,
                }));
                await refrescar();
              }}
            />
          </>
        )}
      </PassoCard>

      {/* PASSO 3: imagens automáticas */}
      <PassoCard
        n={3}
        titulo="Imagens (Replicate / FLUX 1.1 Pro)"
        descricao="Primeiro testa 3 para ver a estética. Aprovas? Continua com os restantes 27. Saltam dias que já têm imagem (custo zero para esses)."
        feito={passo3Feito}
        activo={passo2Feito && !passo3Feito}
        bloqueado={!passo2Feito}
        sumario={
          passo3Feito
            ? `✓ 30/30 com imagem`
            : `${30 - estado.semImagem}/30 com imagem · ${estado.semImagem} por gerar`
        }
      >
        {passo2Feito && (
          <>
            <BlocoAcao
              estado={s3}
              rotulo="3.1 — testar 3 primeiros (~$0.12)"
              textoOk={msg.s3}
              textoErro={msg.s3err}
              exec={async () => {
                setS3("a-correr");
                const { ok, json } = await call(
                  "/api/admin/campanha/imagens-replicate?inicio=1&fim=3&slot=manha&strategy=prefer-existing",
                  { method: "POST" }
                );
                if (ok) {
                  setS3("ok");
                  setMsg((m) => ({
                    ...m,
                    s3: `${json.gerados ?? 0} gerados · ${json.reusados ?? 0} reusados`,
                  }));
                  // Carregar thumbs
                  const ths: string[] = [];
                  for (let d = 1; d <= 3; d++) {
                    ths.push(`/api/admin/campanha/${d}/preview?slot=manha&slide=1`);
                  }
                  setThumbs(ths);
                } else {
                  setS3("erro");
                  setMsg((m) => ({ ...m, s3err: String(json.erro ?? "erro") }));
                }
              }}
            />
            {thumbs.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)] mb-2">
                  pré-visualização (slide 1 dos 3 primeiros dias)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {thumbs.map((src, i) => (
                    <div
                      key={i}
                      className="relative bg-black rounded overflow-hidden border border-[var(--borda)]"
                      style={{ aspectRatio: "1080 / 1350" }}
                    >
                      <iframe
                        src={src}
                        title={`Dia ${i + 1}`}
                        className="absolute inset-0 w-full h-full"
                        style={{
                          transform: "scale(0.27)",
                          transformOrigin: "top left",
                          width: "370%",
                          height: "370%",
                          border: "0",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-[var(--texto-suave)] mt-2">
                  Aprovas? Avança para o lote completo. Não gostas? Volta atrás
                  no editor de cada dia e gera outra com ‘Gerar imagem
                  automática’.
                </div>
              </div>
            )}
            {s3 === "ok" && (
              <BlocoAcao
                estado={s3manha}
                rotulo="3.2 — gerar restantes (~$1.08, 27 dias)"
                textoOk={msg.s3manha}
                textoErro={msg.s3manhaerr}
                exec={async () => {
                  setS3img("a-correr");
                  const lotes = ["1&fim=10", "11&fim=20", "21&fim=30"];
                  let totalGerados = 0;
                  let totalReusados = 0;
                  for (const l of lotes) {
                    const { ok, json } = await call(
                      `/api/admin/campanha/imagens-replicate?inicio=${l}&slot=manha&strategy=prefer-existing`,
                      { method: "POST" }
                    );
                    if (!ok) {
                      setS3img("erro");
                      setMsg((m) => ({ ...m, s3manhaerr: String(json.erro ?? "erro") }));
                      return;
                    }
                    totalGerados += Number(json.gerados ?? 0);
                    totalReusados += Number(json.reusados ?? 0);
                  }
                  setS3img("ok");
                  setMsg((m) => ({
                    ...m,
                    s3manha: `${totalGerados} gerados · ${totalReusados} reusados`,
                  }));
                  await refrescar();
                }}
              />
            )}
            {passo3ManhaFeito && (
              <BlocoAcao
                estado={s3tardeImg}
                rotulo="3.3 — gerar imagens da TARDE (~$1.20, 30 dias)"
                textoOk={msg.s3tarde}
                textoErro={msg.s3tardeerr}
                exec={async () => {
                  setS3tardeImg("a-correr");
                  const lotes = ["1&fim=10", "11&fim=20", "21&fim=30"];
                  let totalGerados = 0;
                  let totalReusados = 0;
                  for (const l of lotes) {
                    const { ok, json } = await call(
                      `/api/admin/campanha/imagens-replicate?inicio=${l}&slot=tarde&strategy=prefer-existing`,
                      { method: "POST" }
                    );
                    if (!ok) {
                      setS3tardeImg("erro");
                      setMsg((m) => ({ ...m, s3tardeerr: String(json.erro ?? "erro") }));
                      return;
                    }
                    totalGerados += Number(json.gerados ?? 0);
                    totalReusados += Number(json.reusados ?? 0);
                  }
                  setS3tardeImg("ok");
                  setMsg((m) => ({
                    ...m,
                    s3tarde: `${totalGerados} gerados · ${totalReusados} reusados`,
                  }));
                  await refrescar();
                }}
              />
            )}
          </>
        )}
      </PassoCard>

      {/* PASSO 4: render HD por semana */}
      <PassoCard
        n={4}
        titulo="Render HD, semana a semana"
        descricao="Lança o render de uma semana de cada vez (7 dias × 2 slots = 14 PNGs). Permite distribuir o trabalho ao longo do tempo."
        activo={passo3Feito}
        bloqueado={!passo3Feito}
        sumario="acompanha o run pelo link no GitHub"
      >
        {passo3Feito && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-[var(--texto-suave)]">semana</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setS4semana(s)}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    s === s4semana
                      ? "border-[var(--ambar)] bg-[var(--ambar)]/10 text-[var(--ambar-claro)]"
                      : "border-[var(--borda)] text-[var(--texto-suave)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <PreviewSemana semana={s4semana} slot="manha" />
            </div>

            <div className="flex flex-wrap gap-2">
              <BlocoAcao
                estado={s4}
                rotulo={`4.1 — render semana ${s4semana} manhã`}
                textoOk={msg.s4}
                textoErro={msg.s4err}
                exec={async () => {
                  setS4("a-correr");
                  const { ok, json } = await call(
                    `/api/admin/campanha/render-submit?semana=${s4semana}&slot=manha`,
                    { method: "POST" }
                  );
                  if (ok) {
                    setS4("ok");
                    setMsg((m) => ({ ...m, s4: `dispatch ok, jobId ${json.jobId}` }));
                  } else {
                    setS4("erro");
                    setMsg((m) => ({ ...m, s4err: String(json.erro ?? "erro") }));
                  }
                }}
              />
            </div>
            <div className="text-xs text-[var(--texto-suave)] mt-3">
              Quando o workflow terminar (2-5 min), volta cá e clica{" "}
              <Link href="/admin" className="text-[var(--ambar)]">
                sincronizar
              </Link>{" "}
              no painel. Os dias passam de <em>rendering</em> para{" "}
              <em>rendered</em>.
            </div>
          </>
        )}
      </PassoCard>

      {/* PASSO 5: agendar + exportar */}
      <PassoCard
        n={5}
        titulo="Agendar datas e exportar CSV"
        descricao="Abre cada dia, define data + hora + redes, muda para 'agendado', guarda. Depois exporta o CSV e importa no Metricool."
        activo={passo3Feito}
        bloqueado={!passo3Feito}
      >
        {passo3Feito && (
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/campanha" className="estudio-btn">
              abrir lista de dias →
            </Link>
            <a href="/api/admin/campanha/exportar.csv" className="estudio-btn estudio-btn-primario">
              CSV Metricool
            </a>
            <a href="/api/admin/campanha/exportar.csv?modo=por-rede" className="estudio-btn">
              CSV por rede
            </a>
          </div>
        )}
      </PassoCard>
    </div>
  );
}

function PassoCard({
  n,
  titulo,
  descricao,
  feito,
  activo,
  bloqueado,
  sumario,
  children,
}: {
  n: number;
  titulo: string;
  descricao: string;
  feito?: boolean;
  activo?: boolean;
  bloqueado?: boolean;
  sumario?: string;
  children?: React.ReactNode;
}) {
  const opacidade = bloqueado ? 0.45 : 1;
  return (
    <div className="estudio-card" style={{ opacity: opacidade }}>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
            passo {n}
          </div>
          <h3 className="font-serif text-xl mt-1">{titulo}</h3>
        </div>
        <Pastilha feito={!!feito} activo={!!activo} />
      </div>
      <p className="text-sm text-[var(--texto-suave)] mt-2 max-w-leitura">{descricao}</p>
      {sumario && (
        <div className="text-xs text-[var(--texto-mudo)] mt-2">{sumario}</div>
      )}
      {bloqueado && (
        <div className="text-xs text-[var(--texto-mudo)] mt-3 italic">
          completa o passo anterior primeiro.
        </div>
      )}
      {children}
    </div>
  );
}
