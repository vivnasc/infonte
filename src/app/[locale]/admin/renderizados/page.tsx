import { Link } from "@/i18n/routing";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Galeria visual dos carrosséis renderizados em HD via Playwright.
// PNGs vêm do Storage em infonte-campanha-hd/<jobId>/result.json.
// Padrão portátil do SyncHim adaptado ao schema da Infonte:
//   SyncHim: content_items + output_urls.pngs
//   Infonte: campanha_posts + result.json per jobId

type Estado = "rascunho" | "rendering" | "failed" | "pronto" | "agendado" | "publicado";

async function carregarRenders(): Promise<Map<string, string[]>> {
  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  const renders = new Map<string, string[]>();
  for (const job of jobs ?? []) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text());
      const slot = (j.slot as string) ?? "manha";
      const dias = (j.dias ?? {}) as Record<string, { urls?: string[] }>;
      for (const [diaStr, r] of Object.entries(dias)) {
        const dia = parseInt(diaStr, 10);
        const key = `${dia}-${slot}`;
        if (renders.has(key)) continue; // já tem do job mais recente
        const urls = r?.urls;
        if (Array.isArray(urls) && urls.length > 0) renders.set(key, urls);
      }
    } catch {
      // ignora result.json inválido
    }
  }
  return renders;
}

type Post = {
  id: string;
  dia: number;
  semana: number;
  slot: string | null;
  tema: string;
  estado: string | null;
  data_publicacao: string | null;
};

type Item = Post & { pngs: string[]; key: string };

export default async function RenderizadosPage({
  searchParams,
}: {
  searchParams?: Promise<{ estado?: string }>;
}) {
  const sb = criarClienteAdmin();
  const sp = searchParams ? await searchParams : {};
  const filtroEstado = sp.estado ?? "pronto";

  const { data: posts } = await sb
    .from("campanha_posts")
    .select("id, dia, semana, slot, tema, estado, data_publicacao")
    .order("dia", { ascending: true })
    .order("slot", { ascending: true });

  const renders = await carregarRenders();

  const todos: Item[] = (posts ?? []).map((p: Post) => {
    const slot = p.slot ?? "manha";
    const key = `${p.dia}-${slot}`;
    return { ...p, slot, pngs: renders.get(key) ?? [], key };
  });

  const comRender = todos.filter((p) => p.pngs.length > 0);

  const items =
    filtroEstado === "todos"
      ? comRender
      : comRender.filter((p) => (p.estado ?? "rascunho") === filtroEstado);

  const stats = {
    total: comRender.length,
    pronto: comRender.filter((p) => (p.estado ?? "rascunho") === "pronto").length,
    agendado: comRender.filter((p) => (p.estado ?? "rascunho") === "agendado").length,
    publicado: comRender.filter((p) => (p.estado ?? "rascunho") === "publicado").length,
    failed: comRender.filter((p) => (p.estado ?? "rascunho") === "failed").length,
  };

  const porSemana = new Map<number, Item[]>();
  for (const it of items) {
    const s = it.semana ?? 0;
    if (!porSemana.has(s)) porSemana.set(s, []);
    porSemana.get(s)!.push(it);
  }
  const semanas = Array.from(porSemana.entries()).sort(([a], [b]) => a - b);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        produção visual
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">Carrosséis renderizados</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-3 max-w-leitura">
        PNGs HD compostos via Playwright no GitHub Actions. Diferente da{" "}
        <Link href="/admin/biblioteca" className="text-[var(--ambar)] underline">
          biblioteca
        </Link>{" "}
        (que mostra as imagens fonte Replicate, antes de virarem carrosséis).
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        {(
          [
            { id: "pronto", label: "pronto" },
            { id: "agendado", label: "agendado" },
            { id: "publicado", label: "publicado" },
            { id: "failed", label: "failed" },
            { id: "todos", label: "todos" },
          ] as const
        ).map((f) => {
          const ativo = filtroEstado === f.id;
          const n =
            f.id === "todos"
              ? stats.total
              : (stats as Record<string, number>)[f.id] ?? 0;
          return (
            <Link
              key={f.id}
              href={f.id === "pronto" ? "/admin/renderizados" : `/admin/renderizados?estado=${f.id}`}
              className={`estudio-pill ${ativo ? f.id : "rascunho"}`}
              style={ativo ? undefined : { opacity: 0.7 }}
            >
              {f.label} · {n}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="estudio-card mt-8">
          <p className="text-[var(--texto-suave)]">
            Sem carrosséis no estado <strong>{filtroEstado}</strong>. Dispara render HD nas
            secções de cobertura do painel, ou troca o filtro acima.
          </p>
        </div>
      ) : (
        semanas.map(([semana, list]) => (
          <section key={semana} className="mt-10">
            <h2 className="estudio-titulo text-xl border-b border-[var(--borda)] pb-2">
              Semana {semana}
              <span className="text-[var(--texto-suave)] text-sm font-normal">
                {" "}· {list.length}
              </span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {list.map((it) => (
                <CarrosselCard key={it.key} item={it} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function CarrosselCard({ item }: { item: Item }) {
  const cover = item.pngs[0];
  const slot = item.slot ?? "manha";
  const dataHora = item.data_publicacao
    ? new Date(item.data_publicacao).toLocaleString("pt-PT", {
        timeZone: "Africa/Maputo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const colunas = Math.min(item.pngs.length, 8);
  const estado = (item.estado ?? "rascunho") as Estado;

  return (
    <div className="estudio-card-elevado overflow-hidden" style={{ padding: 0 }}>
      <Link
        href={`/admin/campanha/${item.dia}?slot=${slot}`}
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={item.tema}
          loading="lazy"
          className="w-full block"
          style={{
            aspectRatio: "1080 / 1350",
            objectFit: "cover",
            background: "#0A0A0A",
          }}
        />
      </Link>
      <div className="p-3">
        <div className="flex justify-between items-center mb-2 gap-2">
          <code className="text-[10px] font-mono text-[var(--texto-mudo)]">
            dia {String(item.dia).padStart(2, "0")} · {slot}
          </code>
          <span className={`estudio-pill ${estado}`}>{estado}</span>
        </div>
        <div className="font-serif text-sm text-[var(--texto)] mb-1 leading-tight">
          {item.tema}
        </div>
        <div className="text-[11px] text-[var(--texto-mudo)] mb-3">{dataHora}</div>

        <div
          className="grid gap-1 mb-3"
          style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)` }}
        >
          {item.pngs.slice(0, 8).map((u, i) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="block leading-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt={`slide ${i + 1}`}
                loading="lazy"
                className="w-full block rounded-sm"
                style={{
                  aspectRatio: "1080 / 1350",
                  objectFit: "cover",
                  background: "#0A0A0A",
                }}
              />
            </a>
          ))}
        </div>

        <Link
          href={`/admin/campanha/${item.dia}?slot=${slot}`}
          className="estudio-btn text-xs w-full text-center block"
        >
          abrir editor →
        </Link>
      </div>
    </div>
  );
}
