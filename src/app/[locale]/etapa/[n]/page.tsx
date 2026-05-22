import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { getUtilizadoraAtual, criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { podeAbrir, HORAS_GATING, dataDeAbertura } from "@/lib/etapas/gating";
import { RendererEtapa } from "@/components/RendererEtapa";
import { OfertaCompra } from "@/components/OfertaCompra";
import { Link } from "@/i18n/routing";

export default async function EtapaPage({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}) {
  const { locale, n: nStr } = await params;
  setRequestLocale(locale);
  const n = parseInt(nStr, 10);
  if (!Number.isFinite(n) || n < 1 || n > 7) notFound();

  const utilizadora = await getUtilizadoraAtual();
  if (!utilizadora) {
    redirect(`/entrar?proximo=/etapa/${n}`);
  }

  const supabase = await criarClienteServidor();

  // Garante linha de progresso para a etapa 1 (e marca desbloqueada se ainda não)
  if (n === 1) {
    await garantirProgressoEtapa1(utilizadora.id);
  }

  const { data: progressoTodo } = await supabase
    .from("progresso")
    .select("etapa, desbloqueada_em, concluida_em")
    .eq("utilizadora_id", utilizadora.id);

  const mapa = new Map<number, { desbloqueada_em: string | null; concluida_em: string | null }>();
  for (const p of progressoTodo ?? []) mapa.set(p.etapa, p);

  const acesso = podeAbrir(n, !!utilizadora.comprou, mapa.get(n - 1));

  if (!acesso.acessivel) {
    return (
      <div className="px-6 max-w-leitura mx-auto pt-20 pb-24 text-center">
        <h1 className="font-serif text-3xl text-castanho">
          a etapa {n} ainda não está aberta.
        </h1>
        {acesso.razao === "compra" && (
          <p className="font-serif text-terra-texto/80 mt-6">
            O percurso completo abre depois da compra. A etapa 1 fica disponível
            para todas, como amostra.
          </p>
        )}
        {acesso.razao === "tempo" && acesso.abreEm && (
          <p className="font-serif text-terra-texto/80 mt-6">
            Cada etapa abre {HORAS_GATING / 24} dias depois da anterior. Esta
            abre em {acesso.abreEm.toLocaleString("pt-PT")}.
          </p>
        )}
        <Link href="/painel" className="btn-quieto inline-block mt-10">
          voltar ao percurso
        </Link>
      </div>
    );
  }

  // Carrega etapa
  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, slug, titulo, corpo_md")
    .eq("id", n)
    .single();

  if (!etapa) {
    return (
      <div className="px-6 max-w-leitura mx-auto pt-20 pb-24 text-center">
        <p className="font-serif text-terra-texto/80">
          (esta etapa ainda não tem conteúdo na base. corre o seed.)
        </p>
      </div>
    );
  }

  // Marca como desbloqueada se ainda não estava
  await garantirDesbloqueada(utilizadora.id, n);

  // Carrega respostas para os marcadores [ Mostrar resposta "X" ]
  const { data: respostasArr } = await supabase
    .from("respostas")
    .select("bloco_id, valor")
    .eq("utilizadora_id", utilizadora.id);
  const respostas: Record<string, string> = {};
  for (const r of respostasArr ?? []) {
    respostas[r.bloco_id] = r.valor ?? "";
  }

  const etapaSeguinte = n < 7 ? n + 1 : null;
  const progressoAtual = mapa.get(n);
  const abreSeguinte =
    etapaSeguinte && progressoAtual?.desbloqueada_em
      ? dataDeAbertura(new Date(progressoAtual.desbloqueada_em))
      : etapaSeguinte
        ? dataDeAbertura(new Date())
        : null;

  return (
    <div className="px-6 pt-12 pb-20">
      <div className="max-w-leitura mx-auto mb-8 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
          etapa {etapa.id}
        </p>
        <h1 className="font-serif text-3xl md:text-4xl text-castanho mt-3 leading-tight">
          {etapa.titulo}
        </h1>
      </div>

      <RendererEtapa corpo={etapa.corpo_md} respostas={respostas} />

      {n === 1 && !utilizadora.comprou && (
        <div className="max-w-leitura mx-auto mt-16">
          <OfertaCompra />
        </div>
      )}

      <div className="max-w-leitura mx-auto mt-16 text-center">
        {n < 7 && utilizadora.comprou && (
          <p className="font-serif text-terra-texto/80">
            a etapa {n + 1} abre em{" "}
            {abreSeguinte
              ? abreSeguinte.toLocaleString("pt-PT")
              : `${HORAS_GATING / 24} dias`}
            .
          </p>
        )}
        <div className="mt-8">
          <Link href="/painel" className="btn-quieto inline-block">
            voltar ao percurso
          </Link>
        </div>
      </div>
    </div>
  );
}

async function garantirProgressoEtapa1(utilizadora_id: string) {
  const admin = criarClienteAdmin();
  // upsert sem mexer em desbloqueada_em se já existir
  const { data: existente } = await admin
    .from("progresso")
    .select("id, desbloqueada_em")
    .eq("utilizadora_id", utilizadora_id)
    .eq("etapa", 1)
    .maybeSingle();
  if (!existente) {
    await admin.from("progresso").insert({
      utilizadora_id,
      etapa: 1,
      desbloqueada_em: new Date().toISOString(),
    });
  } else if (!existente.desbloqueada_em) {
    await admin
      .from("progresso")
      .update({ desbloqueada_em: new Date().toISOString() })
      .eq("id", existente.id);
  }
}

async function garantirDesbloqueada(utilizadora_id: string, etapa: number) {
  const admin = criarClienteAdmin();
  const { data: existente } = await admin
    .from("progresso")
    .select("id, desbloqueada_em")
    .eq("utilizadora_id", utilizadora_id)
    .eq("etapa", etapa)
    .maybeSingle();
  const agora = new Date().toISOString();
  if (!existente) {
    await admin.from("progresso").insert({
      utilizadora_id,
      etapa,
      desbloqueada_em: agora,
    });
  } else if (!existente.desbloqueada_em) {
    await admin
      .from("progresso")
      .update({ desbloqueada_em: agora })
      .eq("id", existente.id);
  }
}
