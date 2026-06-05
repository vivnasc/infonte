import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { getUtilizadoraAtual, criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { podeAbrir, HORAS_GATING, dataDeAbertura } from "@/lib/etapas/gating";
import { EtapaGuiada } from "@/components/EtapaGuiada";
import { dividirEmPassos, cortarPreambuloEtapa } from "@/lib/etapas/passos";
import { OfertaCompra } from "@/components/OfertaCompra";
import { BotaoConcluir } from "@/components/BotaoConcluir";
import { PresencaEtapa } from "@/components/PresencaEtapa";
import { Link } from "@/i18n/routing";

export default async function EtapaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; n: string }>;
  searchParams: Promise<{ paypal?: string }>;
}) {
  const { locale, n: nStr } = await params;
  const sp = await searchParams;
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

      {sp.paypal === "cancelado" && (
        <div className="max-w-leitura mx-auto mb-8 p-5 border border-ocre/40 rounded-lg bg-ocre/5">
          <p className="font-serif text-castanho">
            O pagamento foi cancelado. Podes tentar de novo quando quiseres.
          </p>
        </div>
      )}
      {(sp.paypal === "erro" || sp.paypal === "falhou") && (
        <div className="max-w-leitura mx-auto mb-8 p-5 border border-red-300 rounded-lg bg-red-50">
          <p className="font-serif text-castanho">
            Houve um problema a processar o pagamento. Se o valor foi cobrado,
            contacta ola@vivannedossantos.com para resolvermos.
          </p>
        </div>
      )}

      <EtapaGuiada
        passos={dividirEmPassos(cortarPreambuloEtapa(etapa.corpo_md))}
        respostas={respostas}
      >
        {n === 1 && !utilizadora.comprou && (
          <div className="mb-12">
            <div className="text-center mb-8 max-w-md mx-auto">
              <p className="font-serif text-xl md:text-2xl text-castanho leading-relaxed">
                Acabaste de esvaziar a mesa.
              </p>
              <p className="font-serif text-terra-texto/90 mt-4 leading-relaxed">
                Repara no que sentiste. A maioria das mulheres sente alívio, não
                perda. Isto foi só a etapa 1, e já mexeu.
              </p>
              <p className="font-serif text-terra-texto/90 mt-4 leading-relaxed">
                As próximas seis pegam no pouco que é mesmo teu e transformam-no
                numa direção, num plano, num primeiro passo. Não é mais conteúdo.
                É o caminho todo, com ferramentas que ficam.
              </p>
            </div>
            <OfertaCompra />
          </div>
        )}

        <PresencaEtapa etapa={n} />

        <div className="mt-12 space-y-8">
          <BotaoConcluir
            etapa={n}
            jaConcluida={!!progressoAtual?.concluida_em}
            abreSeguinteStr={abreSeguinte?.toISOString() ?? null}
          />

          <div className="text-center">
            <Link href="/painel" className="btn-quieto inline-block">
              voltar ao percurso
            </Link>
          </div>
        </div>
      </EtapaGuiada>
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
