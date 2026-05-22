import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Cabecalho() {
  const t = useTranslations("nav");
  const m = useTranslations("marca");

  return (
    <header className="w-full">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-serif text-2xl text-castanho group-hover:text-ocre transition-colors">
            infonte
          </span>
          <span className="font-sans text-xs text-oliva tracking-wide">
            {m("subnome")}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-sans text-castanho/80">
          <Link href="/sobre" className="hover:text-ocre transition-colors">
            {t("sobre")}
          </Link>
          <Link href="/entrar" className="hover:text-ocre transition-colors">
            {t("entrar")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
