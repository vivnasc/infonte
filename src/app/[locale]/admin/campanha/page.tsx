import { criarClienteAdmin } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { BotaoSeed } from "@/components/admin/BotaoSeed";
import { Diagnostico } from "@/components/admin/Diagnostico";

type Estado = "rascunho" | "pronto" | "agendado" | "publicado";

type PostResumo = {
  dia: number;
  semana: number;
  tema: string;
  formato: string | null;
  estado: string | null;
  data_publicacao: string | null;
  imagem_url: string | null;
  redes: string[] | null;
  slot: string | null;
};

function agruparPorDia(posts: PostResumo[]) {
  const mapa = new Map<number, { dia: number; manha: PostResumo | null; tarde: PostResumo | null }>();
  for (const p of posts) {
    if (!mapa.has(p.dia)) {
      mapa.set(p.dia, { dia: p.dia, manha: null, tarde: null });
    }
    const grupo = mapa.get(p.dia)!;
    if (p.slot === "tarde") {
      grupo.tarde = p;
    } else {
      grupo.manha = p;
    }
  }
  return Array.from(mapa.values()).sort((a, b) => a.dia - b.dia);
}

const corEstado: Record<Estado, string> = {
  rascunho: "bg-castanho/10 text-castanho/70",
  pronto: "bg-oliva/20 text-oliva",
  agendado: "bg-ocre/20 text-ocre",
  publicado: "bg-castanho text-creme",
};

function Fase({
  numero,
  titulo,
  subtitulo,
  custo,
  children,
}: {
  numero: number;
  titulo: string;
  subtitulo: string;
  custo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <header className="border-b border-castanho/15 pb-3 mb-5">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-sans text-xs tracking-[0.3em] text-oliva/80">
            FASE {numero}
          </span>
          <h2 className="font-serif text-2xl text-castanho">{titulo}</h2>
          {custo && (
            <span className="text-xs text-ocre font-medium ml-auto">{custo}</span>
          )}
        </div>
        <p className="text-sm text-castanho/70 mt-1">{subtitulo}</p>
      </header>
      {children}
    </section>
  );
}

export default async function CampanhaListaPage() {
  const supabase = criarClienteAdmin();
  const { data: posts } = await supabase
    .from("campanha_posts")
    .select(
      "dia, semana, tema, formato, estado, data_publicacao, imagem_url, redes, slot"
    )
    .order("dia", { ascending: true })
    .order("slot", { ascending: true });

  if (!posts || posts.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-castanho">campanha 30 dias</h1>
        <p className="font-serif text-terra-texto/80 mt-6 max-w-leitura">
          Ainda não há posts em base. Vai a{" "}
          <Link href="/admin" className="text-ocre underline">
            /admin
          </Link>{" "}
          e clica em <span className="font-medium">popular campanha</span>.
        </p>
      </div>
    );
  }

  const contagem = posts.reduce<Record<Estado, number>>(
    (acc, p) => {
      const e = (p.estado as Estado) ?? "rascunho";
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    },
    { rascunho: 0, pronto: 0, agendado: 0, publicado: 0 }
  );

  const totalManha = posts.filter((p) => p.slot !== "tarde").length;
  const totalTarde = posts.filter((p) => p.slot === "tarde").length;
  const comImagem = posts.filter((p) => p.imagem_url).length;

  const porSemana = [1, 2, 3, 4].map((s) => ({
    semana: s,
    posts: posts.filter((p) => p.semana === s),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-castanho">campanha 30 dias</h1>
          <p className="font-serif text-terra-texto/80 mt-2">
            Um post por dia, Instagram e TikTok. Empacotar para Metricool.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(contagem) as Estado[]).map((e) => (
            <span key={e} className={`px-3 py-1 rounded-full ${corEstado[e]}`}>
              {e}: {contagem[e]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 text-xs text-castanho/60 flex flex-wrap gap-4">
        <span>{totalManha} posts manhã</span>
        <span>· {totalTarde} posts tarde</span>
        <span>· {comImagem} com imagem</span>
      </div>

      <Fase
        numero={0}
        titulo="Diagnóstico"
        subtitulo="Verifica as integrações antes de produzir. Faz isto sempre primeiro."
      >
        <Diagnostico />
      </Fase>

      <Fase
        numero={1}
        titulo="Conteúdo"
        subtitulo="Formatar bold nas artes e gerar os posts emocionais da tarde via Claude. Idempotente."
        custo="grátis (texto)"
      >
        <div className="flex flex-wrap gap-3">
          <BotaoSeed
            url="/api/admin/campanha/formatar-bold"
            titulo="Aplicar bold aos 30 posts"
            descricao="Mete **negrito** nas palavras-chave do texto das artes."
          />
          <BotaoSeed
            url="/api/admin/campanha/gerar-tarde"
            titulo="Gerar 30 posts da tarde (Claude)"
            descricao="Posts emocionais das 13h, par emocional do didáctico das 10h."
          />
        </div>
      </Fase>

      <Fase
        numero={2}
        titulo="Imagens automáticas"
        subtitulo="FLUX 1.1 Pro via Replicate. Claude decide o que mostra cada imagem. Testa 3 antes do lote completo."
        custo="$0.04/imagem · ~$1.20 os 30 dias"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-castanho/60 mb-2">teste</p>
            <BotaoSeed
              url="/api/admin/campanha/imagens-replicate?inicio=1&fim=3&slot=manha"
              titulo="Testar 3 primeiros (dias 1-3)"
              descricao="~30s · ~$0.12. Vê os resultados em /admin/campanha/[dia] antes de escalar."
            />
          </div>
          <div>
            <p className="text-xs text-castanho/60 mb-2">lotes completos, correr em sequência</p>
            <div className="flex flex-wrap gap-3">
              <BotaoSeed
                url="/api/admin/campanha/imagens-replicate?inicio=1&fim=10&slot=manha"
                titulo="Dias 1-10"
                descricao="~40s · ~$0.40"
              />
              <BotaoSeed
                url="/api/admin/campanha/imagens-replicate?inicio=11&fim=20&slot=manha"
                titulo="Dias 11-20"
                descricao="~40s · ~$0.40"
              />
              <BotaoSeed
                url="/api/admin/campanha/imagens-replicate?inicio=21&fim=30&slot=manha"
                titulo="Dias 21-30"
                descricao="~40s · ~$0.40"
              />
            </div>
          </div>
        </div>
      </Fase>

      <Fase
        numero={3}
        titulo="Render HD"
        subtitulo="PNGs dos slides em 2160x3840 via Playwright no GitHub Actions, sobe direto ao Storage."
        custo="grátis (minutos do GitHub Actions)"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-castanho/60 mb-2">teste</p>
            <BotaoSeed
              url="/api/admin/campanha/render-submit?dias=[1,2,3]&slot=manha"
              titulo="Render HD, 3 dias"
              descricao="Dias 1-3 da manhã. Acompanha o run pelo link no log."
            />
          </div>
          <div>
            <p className="text-xs text-castanho/60 mb-2">lotes completos</p>
            <div className="flex flex-wrap gap-3">
              <BotaoSeed
                url="/api/admin/campanha/render-submit?dias=all&slot=manha"
                titulo="30 dias da manhã"
                descricao="2-5 minutos. Workflow no GitHub."
              />
              <BotaoSeed
                url="/api/admin/campanha/render-submit?dias=all&slot=tarde"
                titulo="30 dias da tarde"
                descricao="2-5 minutos. Workflow no GitHub."
              />
            </div>
          </div>
        </div>
      </Fase>

      <Fase
        numero={4}
        titulo="Agendar e exportar"
        subtitulo="Define data/redes em cada dia abaixo, muda para 'pronto' ou 'agendado', e exporta o CSV."
      >
        <div className="flex flex-wrap gap-3">
          <a href="/api/admin/campanha/exportar.csv" className="btn-ocre">
            CSV Metricool
          </a>
          <a href="/api/admin/campanha/exportar.csv?modo=por-rede" className="btn-quieto">
            CSV por rede
          </a>
        </div>
      </Fase>

      <section className="mt-16 space-y-12">
        <h2 className="font-serif text-2xl text-castanho border-b border-castanho/15 pb-3">
          dias
        </h2>
        {porSemana.map(({ semana, posts: pSemana }) => (
          <div key={semana}>
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-oliva mb-3">
              semana {semana}
            </h3>
            <ul className="divide-y divide-castanho/10">
              {agruparPorDia(pSemana).map(({ dia, manha, tarde }) => (
                <li key={dia} className="py-2">
                  {manha && (
                    <Link
                      href={`/admin/campanha/${dia}?slot=manha`}
                      className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-2 hover:bg-creme/60 px-2 rounded"
                    >
                      <span className="font-serif text-ocre text-lg">{dia}</span>
                      <span>
                        <span className="font-serif text-castanho">{manha.tema}</span>
                        <span className="block text-xs text-castanho/60 mt-0.5">
                          10h · {manha.formato ?? "sem formato"}
                          {manha.imagem_url ? " · arte" : " · sem arte"}
                        </span>
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${corEstado[(manha.estado as Estado) ?? "rascunho"]}`}
                      >
                        {(manha.estado as Estado) ?? "rascunho"}
                      </span>
                    </Link>
                  )}
                  {tarde && (
                    <Link
                      href={`/admin/campanha/${dia}?slot=tarde`}
                      className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-2 hover:bg-creme/60 px-2 rounded"
                    >
                      <span className="font-serif text-ocre/60 text-lg">
                        {!manha ? dia : ""}
                      </span>
                      <span>
                        <span className="font-serif text-castanho/80">{tarde.tema}</span>
                        <span className="block text-xs text-castanho/60 mt-0.5">
                          13h · emocional
                          {tarde.imagem_url ? " · arte" : " · sem arte"}
                        </span>
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${corEstado[(tarde.estado as Estado) ?? "rascunho"]}`}
                      >
                        {(tarde.estado as Estado) ?? "rascunho"}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
