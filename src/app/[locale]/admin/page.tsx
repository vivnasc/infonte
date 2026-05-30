import { Link } from "@/i18n/routing";
import { BotaoSeed } from "@/components/admin/BotaoSeed";
import { BotaoSyncRender } from "@/components/admin/BotaoSyncRender";
import { BotaoRenderSemana } from "@/components/admin/BotaoRenderSemana";
import { BotaoResetRendering } from "@/components/admin/BotaoResetRendering";
import { WorkflowsRender } from "@/components/admin/WorkflowsRender";
import { AgendarTudo } from "@/components/admin/AgendarTudo";
import { ReconstruirCampanha } from "@/components/admin/ReconstruirCampanha";
import { BotaoImagensPorSlide } from "@/components/admin/BotaoImagensPorSlide";
import { BotaoRenderDias29e30 } from "@/components/admin/BotaoRenderDias29e30";
import { BotaoRenderFalhados } from "@/components/admin/BotaoRenderFalhados";
import { criarClienteAdmin } from "@/lib/supabase/admin";

type EstadoRaw = string | null;
type EstadoCanon = "rascunho" | "rendering" | "failed" | "pronto" | "agendado" | "publicado";

function canon(e: EstadoRaw): EstadoCanon {
  if (e === "rendering" || e === "failed" || e === "pronto" || e === "agendado" || e === "publicado") {
    return e;
  }
  return "rascunho";
}

async function carregar() {
  const sb = criarClienteAdmin();

  const [postsRes, etapasCountRes] = await Promise.all([
    sb
      .from("campanha_posts")
      .select("dia, semana, slot, estado, texto_imagem, imagem_url, imagens, data_publicacao"),
    sb.from("etapas").select("*", { count: "exact", head: true }),
  ]);

  return {
    posts: postsRes.data ?? [],
    nEtapas: etapasCountRes.count ?? 0,
  };
}

type PostRow = {
  dia: number;
  semana: number;
  slot: string | null;
  estado: EstadoRaw;
  texto_imagem: string | null;
  imagem_url: string | null;
  imagens: string[] | null;
  data_publicacao: string | null;
};

function proximaAccao(posts: PostRow[]): { titulo: string; descricao: string; href: string; botao: string } | null {
  if (posts.length === 0) {
    return {
      titulo: "Popular a campanha",
      descricao: "Não há posts em base. Começa pelos seeds.",
      href: "#seeds",
      botao: "configurar inicial",
    };
  }
  const manha = posts.filter((p) => (p.slot ?? "manha") === "manha");
  const tarde = posts.filter((p) => p.slot === "tarde");
  const semBold = posts.filter((p) => p.texto_imagem && !p.texto_imagem.includes("**"));

  if (tarde.length < 30) {
    return {
      titulo: `Gerar posts da tarde (${30 - tarde.length} em falta)`,
      descricao: "Cada tarde é o par emocional do post da manhã.",
      href: "/admin/campanha",
      botao: "ir à Fase 1",
    };
  }
  if (semBold.length > 5) {
    return {
      titulo: "Aplicar bold aos posts",
      descricao: `${semBold.length} posts ainda sem palavras-chave a negrito.`,
      href: "/admin/campanha",
      botao: "ir à Fase 1",
    };
  }
  const semImagem = posts.filter((p) => {
    const imgs = (p.imagens as string[] | null) ?? [];
    return !p.imagem_url && imgs.length === 0;
  });
  if (semImagem.length > 0) {
    return {
      titulo: `Gerar imagens (${semImagem.length} em falta)`,
      descricao: "FLUX 1.1 Pro via Replicate. ~$0.04 por imagem.",
      href: "/admin/campanha",
      botao: "ir à Fase 2",
    };
  }
  const rascunho = manha.filter((p) => canon(p.estado) === "rascunho").length;
  if (rascunho > 0) {
    return {
      titulo: "Render HD dos slides",
      descricao: `${rascunho} dias da manhã ainda por renderizar. Distribui por semana.`,
      href: "/admin/campanha",
      botao: "ir à Fase 3",
    };
  }
  const agendados = posts.filter((p) => canon(p.estado) === "agendado").length;
  const prontos = posts.filter((p) => canon(p.estado) === "pronto").length;
  if (prontos > 0) {
    return {
      titulo: `Agendar datas (${prontos} prontos)`,
      descricao: "Define data e hora em cada dia. Estado passa a agendado.",
      href: "/admin/campanha",
      botao: "ir aos dias",
    };
  }
  if (agendados >= posts.length * 0.8) {
    return {
      titulo: "Exportar para Metricool",
      descricao: "Quase tudo agendado. Já podes empacotar o CSV.",
      href: "/admin/campanha",
      botao: "exportar CSV",
    };
  }
  return null;
}

export default async function PainelPage() {
  const { posts, nEtapas } = await carregar();

  const total = posts.length;
  const funil = {
    total,
    rascunho: posts.filter((p) => canon(p.estado) === "rascunho").length,
    rendering: posts.filter((p) => canon(p.estado) === "rendering").length,
    pronto: posts.filter((p) => canon(p.estado) === "pronto").length,
    agendado: posts.filter((p) => canon(p.estado) === "agendado").length,
    publicado: posts.filter((p) => canon(p.estado) === "publicado").length,
    failed: posts.filter((p) => canon(p.estado) === "failed").length,
  };

  const acao = proximaAccao(posts as PostRow[]);

  const semanas = [1, 2, 3, 4].map((s) => {
    const ps = posts.filter((p) => p.semana === s);
    const c = {
      total: ps.length,
      rascunho: ps.filter((p) => canon(p.estado) === "rascunho").length,
      rendering: ps.filter((p) => canon(p.estado) === "rendering").length,
      pronto: ps.filter((p) => canon(p.estado) === "pronto").length,
      agendado: ps.filter((p) => canon(p.estado) === "agendado").length,
      publicado: ps.filter((p) => canon(p.estado) === "publicado").length,
    };
    const cobertura =
      c.total === 0
        ? "vazia"
        : c.publicado === c.total
        ? "publicada"
        : c.agendado + c.publicado === c.total
        ? "agendada"
        : c.pronto + c.agendado + c.publicado === c.total
        ? "completa"
        : c.rascunho === c.total
        ? "rascunho"
        : "parcial";
    return { semana: s, ...c, cobertura };
  });

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        infonte estúdio
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">painel de produção</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-2 max-w-leitura">
        Estado da campanha + atalhos. Edição por dia em Campanha 30 dias.
        Pré-visualização total em Pré-visualizar tudo.
      </p>

      <div className="mt-8">
        <ReconstruirCampanha />
      </div>

      <div className="mt-6">
        <BotaoImagensPorSlide />
      </div>

      {funil.rendering > 0 && (
        <div className="mt-6">
          <BotaoResetRendering rendering={funil.rendering} />
        </div>
      )}

      {acao && (
        <div
          className="estudio-card mt-10 flex flex-wrap items-center gap-6 justify-between"
          style={{ borderColor: "var(--ambar)", borderWidth: 1 }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--ambar)]">
              próxima acção sugerida
            </div>
            <div className="font-serif text-xl mt-1">{acao.titulo}</div>
            <div className="text-sm text-[var(--texto-suave)] mt-1">{acao.descricao}</div>
          </div>
          <Link href={acao.href} className="estudio-btn estudio-btn-primario">
            {acao.botao} →
          </Link>
        </div>
      )}

      <section className="mt-10">
        <h2 className="estudio-titulo text-xl mb-4">Funil de produção</h2>
        <div className="estudio-card grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-4">
          <Coluna rotulo="total" valor={funil.total} />
          <Coluna rotulo="rascunho" valor={funil.rascunho} cor="text-[var(--texto)]" />
          <Coluna rotulo="rendering" valor={funil.rendering} cor="text-[var(--ambar)]" />
          <Coluna rotulo="rendered" valor={funil.pronto} cor="text-[var(--verde)]" />
          <Coluna rotulo="agendado" valor={funil.agendado} cor="text-[var(--ambar-claro)]" />
          <Coluna rotulo="publicado" valor={funil.publicado} cor="text-[var(--ambar)]" />
          <Coluna rotulo="failed" valor={funil.failed} cor="text-[var(--vermelho)]" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="estudio-titulo text-xl mb-4">Cobertura da campanha</h2>
        <div className="estudio-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] text-left border-b border-[var(--borda)]">
                <th className="py-2 pr-4">semana</th>
                <th className="py-2 pr-4">posts</th>
                <th className="py-2 pr-4">rascunho</th>
                <th className="py-2 pr-4">rendering</th>
                <th className="py-2 pr-4">rendered</th>
                <th className="py-2 pr-4">agendado</th>
                <th className="py-2 pr-4">publicado</th>
                <th className="py-2 pr-4">cobertura</th>
                <th className="py-2 pr-4">render bulk</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((s) => (
                <tr key={s.semana} className="border-b border-[var(--borda)] last:border-0">
                  <td className="py-3 pr-4 font-mono text-[var(--texto-suave)]">
                    semana {s.semana}
                  </td>
                  <td className="py-3 pr-4">{s.total}</td>
                  <td className="py-3 pr-4 text-[var(--texto-suave)]">{s.rascunho}</td>
                  <td className="py-3 pr-4 text-[var(--ambar)]">{s.rendering}</td>
                  <td className="py-3 pr-4 text-[var(--verde)]">{s.pronto}</td>
                  <td className="py-3 pr-4 text-[var(--ambar-claro)]">{s.agendado}</td>
                  <td className="py-3 pr-4">{s.publicado}</td>
                  <td className="py-3 pr-4">
                    <span className={`estudio-pill ${s.cobertura === "publicada" ? "publicado" : s.cobertura === "agendada" ? "agendado" : s.cobertura === "completa" ? "pronto" : "rascunho"}`}>
                      {s.cobertura}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <BotaoRenderSemana semana={s.semana} slot="manha" rotulo={`s${s.semana} manhã`} />
                      <BotaoRenderSemana semana={s.semana} slot="tarde" rotulo={`s${s.semana} tarde`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid lg:grid-cols-[1fr_1fr] gap-4 items-start">
          <WorkflowsRender />
          <BotaoSyncRender />
        </div>
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          <BotaoRenderFalhados />
          <BotaoRenderDias29e30 />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="estudio-titulo text-xl mb-4">Agendar e exportar</h2>
        <p className="text-sm text-[var(--texto-suave)] max-w-leitura mb-4">
          Primeiro distribui os 60 posts pelos 30 dias, manhã 10h + tarde 13h.
          Depois descarrega o CSV para o Metricool (Date/Time vêm preenchidos,
          93 colunas oficiais).
        </p>
        <AgendarTudo />
        <div className="estudio-card-elevado mt-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
            descarregar CSV Metricool
          </div>
          <p className="text-xs text-[var(--texto-suave)] mb-3 max-w-leitura">
            Cabeçalho oficial 2026 (93 colunas). Picture Url 1..10 vêm dos
            PNGs HD renderizados. Importa direto em Metricool → Calendar →
            Import posts from CSV.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/campanha/exportar.csv"
              className="estudio-btn estudio-btn-primario"
            >
              ↓ CSV Metricool (60 posts)
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12" id="seeds">
        <h2 className="estudio-titulo text-xl mb-4">Configuração inicial</h2>
        <p className="text-sm text-[var(--texto-suave)] max-w-leitura mb-4">
          Estes botões carregam o conteúdo do repositório (ficheiros markdown)
          para a base de dados. Idempotentes, podes correr quantas vezes
          quiseres, actualizam só os campos editoriais sem mexer em
          agendamentos.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <BotaoSeed
            url="/api/admin/seed/etapas"
            titulo={`popular etapas (${nEtapas}/7)`}
            descricao="Lê content/etapa-0X-*.md e faz upsert das 7 etapas."
          />
          <BotaoSeed
            url="/api/admin/seed/campanha"
            titulo={`popular campanha (${total} posts)`}
            descricao="Lê infonte-campanha-30-dias/semana-X-posts.md e faz upsert dos 30 dias."
          />
        </div>
      </section>
    </div>
  );
}

function Coluna({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)]">
        {rotulo}
      </div>
      <div className={`font-serif text-3xl mt-1 ${cor ?? ""}`}>{valor}</div>
    </div>
  );
}
