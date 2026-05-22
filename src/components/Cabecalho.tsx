import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getUtilizadoraAtual } from "@/lib/supabase/server";

export async function Cabecalho() {
  const t = await getTranslations("nav");
  const m = await getTranslations("marca");
  const utilizadora = await getUtilizadoraAtual();

  return (
    <header className="w-full border-b border-castanho/15 bg-creme/85 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-terra shadow-sm ring-1 ring-castanho/20 group-hover:ring-ocre transition-all">
            <Image
              src="/infonte-simbolo.svg"
              alt=""
              width={26}
              height={26}
              priority
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-2xl text-castanho group-hover:text-ocre-forte transition-colors">
              infonte
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-oliva mt-1">
              {m("subnome")}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-sans text-castanho">
          <Link href="/sobre" className="hover:text-ocre-forte transition-colors">
            {t("sobre")}
          </Link>
          {utilizadora ? (
            <>
              <Link href="/painel" className="hover:text-ocre-forte transition-colors">
                {t("percurso")}
              </Link>
              {utilizadora.is_admin && (
                <Link href="/admin" className="hover:text-ocre-forte transition-colors">
                  Admin
                </Link>
              )}
              <form action="/auth/sair" method="post">
                <button
                  type="submit"
                  className="hover:text-ocre-forte transition-colors"
                >
                  {t("sair")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/entrar" className="hover:text-ocre-forte transition-colors">
              {t("entrar")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
