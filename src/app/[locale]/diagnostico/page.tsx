import { setRequestLocale } from "next-intl/server";
import { DiagnosticoQuiz } from "@/components/DiagnosticoQuiz";

export const metadata = {
  title: "Diagnóstico da dispersão, infonte",
  description:
    "Em um minuto, vê quanto do que persegues é mesmo teu. O teu retrato e o teu primeiro passo.",
};

export default async function DiagnosticoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ utm_source?: string; fonte?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const origem =
    (sp.utm_source ?? sp.fonte ?? "").toString().trim().toLowerCase();
  const fonte = origem ? `diagnostico-${origem}` : "diagnostico";

  return <DiagnosticoQuiz fonte={fonte} />;
}
