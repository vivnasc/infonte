import { criarClienteAdmin } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";

type Estado = "rascunho" | "rendering" | "failed" | "pronto" | "agendado" | "publicado";

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
    if (p.slot === "tarde") grupo.tarde = p;
    else grupo.manha = p;
  }
  return Array.from(mapa.values()).sort((a, b) => a.dia - b.dia);
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
        <h1 className="estudio-titulo text-3xl">campanha 30 dias</h1>
        <p className="text-[var(--texto-suave)] mt-6 max-w-leitura">
          Ainda não há posts em base. Vai a{" "}
          <Link href="/admin" className="text-[var(--ambar)] underline">
            /admin
          </Link>{" "}
          e clica em <span className="text-[var(--ambar)]">popular campanha</span>.
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
    { rascunho: 0, rendering: 0, failed: 0, pronto: 0, agendado: 0, publicado: 0 }
  );

  const totalManha = posts.filter((p) => p.slot !== "tarde").length;
  const totalTarde = posts.filter((p) => p.slot === "tarde").length;
  const comImagem = posts.filter((p) => p.imagem_url).length;
  const semImagem = posts.length - comImagem;
  const semTarde = 30 - totalTarde;
  const custoImagensRestantes = (semImagem * 0.04).toFixed(2);

  const porSemana = [1, 2, 3, 4].map((s) => ({
    semana: s,
    posts: posts.filter((p) => p.semana === s),
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
            campanha
          </div>
          <h1 className="estudio-titulo text-3xl mt-1">30 dias, manhã + tarde</h1>
          <p className="text-[var(--texto-suave)] text-sm mt-2">
            Instagram e TikTok. Empacotar para Metricool no fim.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(contagem) as Estado[]).map((e) => (
            <span key={e} className={`estudio-pill ${e}`}>
              {e}: {contagem[e]}
            </span>
          ))}
        </div>
      </div>

      <div className="estudio-card mt-6">
        <div className="grid sm:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)]">posts</div>
            <div className="text-xl mt-1">{totalManha} <span className="text-[var(--texto-mudo)] text-sm">manhã</span></div>
            <div className="text-xl">{totalTarde} <span className="text-[var(--texto-mudo)] text-sm">tarde</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)]">imagens</div>
            <div className="text-xl mt-1">{comImagem}<span className="text-[var(--texto-mudo)] text-sm">/{posts.length}</span></div>
            <div className="text-xs text-[var(--texto-suave)]">{semImagem} por gerar</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)]">tarde a gerar</div>
            <div className="text-xl mt-1">{semTarde}<span className="text-[var(--texto-mudo)] text-sm">/30</span></div>
            <div className="text-xs text-[var(--texto-suave)]">grátis (Claude)</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)]">custo p/ acabar</div>
            <div className="text-xl text-[var(--ambar)] mt-1">${custoImagensRestantes}</div>
            <div className="text-xs text-[var(--texto-suave)]">só Replicate</div>
          </div>
        </div>
      </div>


      <div className="estudio-card mt-6 text-xs text-[var(--texto-suave)]">
        Produção (bold, tarde, imagens, render, agendar, CSV) é toda no{" "}
        <Link href="/admin" className="text-[var(--ambar)] underline">painel</Link>.
        Aqui só navegas entre os 60 dias. Clica num dia para abrir o editor.
      </div>

      <section className="mt-10 space-y-10">
        <h2 className="estudio-titulo text-2xl border-b border-[var(--borda)] pb-3">dias</h2>
        {porSemana.map(({ semana, posts: pSemana }) => (
          <div key={semana}>
            <h3 className="text-[11px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
              semana {semana}
            </h3>
            <ul className="estudio-divisao space-y-0">
              {agruparPorDia(pSemana).map(({ dia, manha, tarde }) => (
                <li key={dia} className="py-1 border-b border-[var(--borda)]">
                  {manha && (
                    <Link href={`/admin/campanha/${dia}?slot=manha`} className="estudio-link-dia">
                      <span className="text-[var(--ambar)] font-serif text-lg">{dia}</span>
                      <span>
                        <span className="font-serif">{manha.tema}</span>
                        <span className="block text-xs text-[var(--texto-suave)] mt-0.5">
                          10h · {manha.formato ?? "sem formato"}
                          {manha.imagem_url ? " · arte" : " · sem arte"}
                        </span>
                      </span>
                      <span className={`estudio-pill ${(manha.estado as Estado) ?? "rascunho"}`}>
                        {(manha.estado as Estado) ?? "rascunho"}
                      </span>
                    </Link>
                  )}
                  {tarde && (
                    <Link href={`/admin/campanha/${dia}?slot=tarde`} className="estudio-link-dia">
                      <span className="text-[var(--ocre)] font-serif text-lg">{!manha ? dia : ""}</span>
                      <span>
                        <span className="font-serif text-[var(--texto-suave)]">{tarde.tema}</span>
                        <span className="block text-xs text-[var(--texto-suave)] mt-0.5">
                          13h · emocional
                          {tarde.imagem_url ? " · arte" : " · sem arte"}
                        </span>
                      </span>
                      <span className={`estudio-pill ${(tarde.estado as Estado) ?? "rascunho"}`}>
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
