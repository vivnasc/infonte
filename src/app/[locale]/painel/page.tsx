import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getUtilizadoraAtual, criarClienteServidor } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";

const HORAS_GATING = 72;

export default async function PainelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const utilizadora = await getUtilizadoraAtual();
  if (!utilizadora) redirect("/entrar");

  const supabase = await criarClienteServidor();
  const { data: progresso } = await supabase
    .from("progresso")
    .select("etapa, desbloqueada_em, concluida_em")
    .eq("utilizadora_id", utilizadora.id)
    .order("etapa", { ascending: true });

  const agora = Date.now();
  const mapaProgresso = new Map<number, { desbloqueada_em: string | null; concluida_em: string | null }>();
  for (const p of progresso ?? []) {
    mapaProgresso.set(p.etapa, p);
  }

  const etapas = [1, 2, 3, 4, 5, 6, 7].map((n) => {
    const p = mapaProgresso.get(n);
    const desbloqueadaEm = p?.desbloqueada_em ? new Date(p.desbloqueada_em).getTime() : null;
    const acessivel = n === 1 || (desbloqueadaEm !== null && desbloqueadaEm <= agora);
    let abreEm: Date | null = null;
    if (!acessivel && desbloqueadaEm !== null) abreEm = new Date(desbloqueadaEm);
    return {
      n,
      acessivel,
      concluida: !!p?.concluida_em,
      abreEm,
      paga: n > 1,
    };
  });

  return (
    <div className="px-6 max-w-leitura mx-auto pt-16 pb-24">
      <h1 className="font-serif text-3xl text-castanho">
        olá{utilizadora.nome ? `, ${utilizadora.nome}` : ""}.
      </h1>
      <p className="font-serif text-terra-texto/80 mt-3">
        o teu percurso da Infonte. cada etapa abre {HORAS_GATING / 24} dias depois da anterior.
      </p>

      {!utilizadora.comprou && (
        <div className="mt-8 p-5 border border-ocre/40 rounded-lg bg-ocre/5">
          <p className="font-serif text-castanho">
            A etapa 1 é grátis. Para abrires o resto do percurso, falta a compra.
          </p>
          <Link href="/etapa/1" className="btn-ocre inline-block mt-3">
            começar pela etapa 1
          </Link>
        </div>
      )}

      <ol className="mt-12 space-y-3">
        {etapas.map((e) => (
          <li key={e.n}>
            {e.acessivel && (e.n === 1 || utilizadora.comprou) ? (
              <Link
                href={`/etapa/${e.n}`}
                className="flex items-center justify-between p-4 rounded-md border border-castanho/15 hover:border-ocre transition-colors"
              >
                <span className="font-serif text-lg text-castanho">
                  etapa {e.n}
                </span>
                <span className="text-sm text-oliva">
                  {e.concluida ? "concluída" : "aberta"}
                </span>
              </Link>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-md border border-castanho/10 bg-creme/40 opacity-70">
                <span className="font-serif text-lg text-castanho/70">
                  etapa {e.n}
                </span>
                <span className="text-sm text-oliva">
                  {e.n > 1 && !utilizadora.comprou
                    ? "depois da compra"
                    : e.abreEm
                      ? `abre ${e.abreEm.toLocaleDateString("pt-PT")}`
                      : "fechada"}
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>

      <form action="/auth/sair" method="post" className="mt-16 text-center">
        <button type="submit" className="text-sm text-castanho/60 hover:text-castanho">
          sair
        </button>
      </form>
    </div>
  );
}
