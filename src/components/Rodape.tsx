import { useTranslations } from "next-intl";

export function Rodape() {
  const t = useTranslations("rodape");
  return (
    <footer className="w-full border-t border-castanho/15 mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center gap-1 text-center">
        <span className="font-serif text-lg text-castanho">{t("marca")}</span>
        <span className="font-sans text-sm text-castanho/70">
          {t("autora")}
        </span>
        <span className="font-sans text-xs text-oliva tracking-wider uppercase mt-1">
          {t("casa")}
        </span>
      </div>
    </footer>
  );
}
