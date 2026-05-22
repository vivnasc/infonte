import { setRequestLocale } from "next-intl/server";
import { FormularioEntrar } from "@/components/FormularioEntrar";
import { redirect } from "next/navigation";
import { getUtilizadoraAtual } from "@/lib/supabase/server";

export default async function EntrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ erro?: string; mensagem?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const user = await getUtilizadoraAtual();
  if (user) {
    redirect("/painel");
  }

  return (
    <div className="px-6 max-w-leitura mx-auto pt-16 pb-24">
      <h1 className="font-serif text-3xl text-castanho text-center">Entrar</h1>
      <p className="font-serif text-center text-terra-texto mt-3">
        Bem-vinda. Usa o teu email para entrar ou criar conta.
      </p>
      <div className="mt-12">
        <FormularioEntrar erro={sp.erro} mensagem={sp.mensagem} />
      </div>
    </div>
  );
}
