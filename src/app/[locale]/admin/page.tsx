import { Link } from "@/i18n/routing";
import { BotaoSeed } from "@/components/admin/BotaoSeed";
import { criarClienteAdmin } from "@/lib/supabase/admin";

async function contarSeguro(
  supabase: ReturnType<typeof criarClienteAdmin>,
  tabela: string
): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export default async function AdminHome() {
  const supabase = criarClienteAdmin();
  const [nEtapas, nPosts] = await Promise.all([
    contarSeguro(supabase, "etapas"),
    contarSeguro(supabase, "campanha_posts"),
  ]);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        painel
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">administração</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-3 max-w-leitura">
        Produção e empacotamento de conteúdo da Infonte. Tudo a partir daqui,
        sem terminal.
      </p>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/campanha"
          className="estudio-card hover:border-[var(--ambar)]/40 transition-colors block"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
            redes sociais
          </div>
          <div className="font-serif text-xl mt-2">campanha 30 dias</div>
          <div className="text-sm text-[var(--texto-suave)] mt-2">
            Editar legendas, gerar imagens, render HD, exportar para Metricool.{" "}
            {nPosts != null && (
              <span className="text-[var(--ambar)]">
                ({nPosts} {nPosts === 1 ? "post" : "posts"})
              </span>
            )}
          </div>
        </Link>

        <div className="estudio-card">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)]">
            percurso
          </div>
          <div className="font-serif text-xl mt-2">7 etapas em base</div>
          <div className="text-sm text-[var(--texto-suave)] mt-2">
            {nEtapas != null && (
              <span>
                {nEtapas} de 7 etapas populadas.{" "}
                {nEtapas < 7 && (
                  <span className="text-[var(--ambar)]">faltam carregar.</span>
                )}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="estudio-titulo text-xl border-b border-[var(--borda)] pb-2">
          configuração inicial
        </h2>
        <p className="text-sm text-[var(--texto-suave)] mt-4 max-w-leitura">
          Estes botões carregam o conteúdo do repositório (ficheiros markdown)
          para a base de dados. Idempotentes, podes correr quantas vezes
          quiseres, atualizam só os campos editoriais sem mexer em
          agendamentos.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 gap-4 max-w-2xl">
          <BotaoSeed
            url="/api/admin/seed/etapas"
            titulo="popular etapas"
            descricao="Lê content/etapa-0X-*.md e faz upsert das 7 etapas."
          />
          <BotaoSeed
            url="/api/admin/seed/campanha"
            titulo="popular campanha"
            descricao="Lê infonte-campanha-30-dias/semana-X-posts.md e faz upsert dos 30 dias."
          />
        </div>
      </section>
    </div>
  );
}
