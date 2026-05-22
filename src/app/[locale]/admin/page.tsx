import { Link } from "@/i18n/routing";
import { BotaoSeed } from "@/components/admin/BotaoSeed";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function AdminHome() {
  const supabase = await criarClienteServidor();
  const [{ count: nEtapas }, { count: nPosts }] = await Promise.all([
    supabase.from("etapas").select("*", { count: "exact", head: true }),
    supabase.from("campanha_posts").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-castanho">administração</h1>
      <p className="font-serif text-terra-texto/80 mt-4 max-w-leitura">
        Produção e empacotamento de conteúdo. Tudo a partir daqui, sem terminal.
      </p>

      <section className="mt-10 grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/campanha"
          className="block p-6 rounded-lg border border-castanho/20 hover:border-ocre transition-colors"
        >
          <div className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
            redes sociais
          </div>
          <div className="font-serif text-xl text-castanho mt-2">
            campanha 30 dias
          </div>
          <div className="text-sm text-castanho/70 mt-2">
            Editar legendas, agendar e exportar para o Metricool.{" "}
            {nPosts != null && (
              <span className="text-oliva">
                ({nPosts} {nPosts === 1 ? "post" : "posts"} em base)
              </span>
            )}
          </div>
        </Link>

        <div className="block p-6 rounded-lg border border-castanho/20">
          <div className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
            percurso
          </div>
          <div className="font-serif text-xl text-castanho mt-2">
            7 etapas em base
          </div>
          <div className="text-sm text-castanho/70 mt-2">
            {nEtapas != null && (
              <span>
                {nEtapas} de 7 etapas populadas.{" "}
                {nEtapas < 7 && (
                  <span className="text-ocre">faltam carregar.</span>
                )}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-xl text-castanho border-b border-castanho/15 pb-2">
          configuração inicial
        </h2>
        <p className="text-sm text-castanho/70 mt-4 max-w-leitura">
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
