import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getUtilizadoraAtual } from "@/lib/supabase/server";

export async function Cabecalho() {
  const t = await getTranslations("nav");
  const m = await getTranslations("marca");
  const utilizadora = await getUtilizadoraAtual();

  return (
    <header className="w-full border-b border-castanho/10 bg-creme/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-serif text-2xl text-castanho group-hover:text-ocre-forte transition-colors">
            infonte
          </span>
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-oliva">
            {m("subnome")}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-sans text-castanho">
          <Link href="/sobre" className="hover:text-ocre transition-colors">
            {t("sobre")}
          </Link>
          {utilizadora ? (
            <>
              <Link href="/painel" className="hover:text-ocre transition-colors">
                {t("percurso")}
              </Link>
              {utilizadora.is_admin && (
                <Link href="/admin" className="hover:text-ocre transition-colors">
                  admin
                </Link>
              )}
              <form action="/auth/sair" method="post">
                <button
                  type="submit"
                  className="hover:text-ocre transition-colors"
                >
                  {t("sair")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/entrar" className="hover:text-ocre transition-colors">
              {t("entrar")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
