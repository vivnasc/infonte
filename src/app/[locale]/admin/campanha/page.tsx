import { criarClienteServidor } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { BotaoSeed } from "@/components/admin/BotaoSeed";

type Estado = "rascunho" | "pronto" | "agendado" | "publicado";

const corEstado: Record<Estado, string> = {
  rascunho: "bg-castanho/10 text-castanho/70",
  pronto: "bg-oliva/20 text-oliva",
  agendado: "bg-ocre/20 text-ocre",
  publicado: "bg-castanho text-creme",
};

export default async function CampanhaListaPage() {
  const supabase = await criarClienteServidor();
  const { data: posts } = await supabase
    .from("campanha_posts")
    .select(
      "dia, semana, tema, formato, estado, data_publicacao, imagem_url, redes"
    )
    .order("dia", { ascending: true });

  if (!posts || posts.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-castanho">campanha 30 dias</h1>
        <p className="font-serif text-terra-texto/80 mt-6 max-w-leitura">
          Ainda não há posts em base. Corre o seed:
        </p>
        <pre className="mt-4 bg-castanho/5 border border-castanho/15 rounded p-3 text-sm">
          npm run seed:campanha
        </pre>
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
        <div className="flex flex-wrap gap-3">
          <a href="/api/admin/campanha/exportar.csv" className="btn-quieto">
            CSV Metricool
          </a>
          <a href="/api/admin/campanha/exportar.csv?modo=por-rede" className="btn-quieto">
            CSV por rede
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <BotaoSeed
          url="/api/admin/campanha/formatar-bold"
          titulo="Aplicar bold aos 30 posts"
          descricao="Formata os texto_imagem com **negrito** nas palavras-chave para as artes."
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {(Object.keys(contagem) as Estado[]).map((e) => (
          <span
            key={e}
            className={`px-3 py-1 rounded-full ${corEstado[e]}`}
          >
            {e}: {contagem[e]}
          </span>
        ))}
      </div>

      <div className="mt-10 space-y-12">
        {porSemana.map(({ semana, posts: pSemana }) => (
          <div key={semana}>
            <h2 className="font-serif text-xl text-castanho border-b border-castanho/15 pb-2">
              semana {semana}
            </h2>
            <ul className="mt-4 divide-y divide-castanho/10">
              {pSemana.map((p) => {
                const estado = (p.estado as Estado) ?? "rascunho";
                const dataStr = p.data_publicacao
                  ? new Date(p.data_publicacao).toLocaleString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;
                return (
                  <li key={p.dia}>
                    <Link
                      href={`/admin/campanha/${p.dia}`}
                      className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-3 hover:bg-creme/60 px-2 rounded"
                    >
                      <span className="font-serif text-ocre text-lg">
                        {p.dia}
                      </span>
                      <span>
                        <span className="font-serif text-castanho">
                          {p.tema}
                        </span>
                        <span className="block text-xs text-castanho/60 mt-0.5">
                          {p.formato ?? "sem formato"}
                          {p.imagem_url ? " · arte" : " · sem arte"}
                          {dataStr ? ` · ${dataStr}` : ""}
                        </span>
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${corEstado[estado]}`}
                      >
                        {estado}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
