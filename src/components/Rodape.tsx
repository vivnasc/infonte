import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function Rodape() {
  const t = await getTranslations("rodape");
  return (
    <footer className="w-full border-t border-castanho/20 mt-24 bg-creme-fundo/50">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col items-center gap-2 text-center">
        <Image
          src="/gota.svg"
          alt=""
          width={28}
          height={28}
          className="opacity-80 mb-2"
          aria-hidden
        />
        <span className="font-serif text-xl text-castanho">{t("marca")}</span>
        <span className="font-serif text-base text-castanho/90">
          {t("autora")}
        </span>
        <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-oliva mt-2">
          {t("casa")}
        </span>
      </div>
    </footer>
  );
}
