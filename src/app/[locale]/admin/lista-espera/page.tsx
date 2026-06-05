import { criarClienteAdmin } from "@/lib/supabase/admin";
import { ListaEsperaTabela } from "@/components/admin/ListaEsperaTabela";

export const dynamic = "force-dynamic";

export default async function AdminListaEsperaPage() {
  const sb = criarClienteAdmin();
  const { data, error } = await sb
    .from("lista_espera")
    .select("id, nome, email, fonte, criado_em, codigo_desconto, convertido_em")
    .order("criado_em", { ascending: false });

  const linhas = data ?? [];

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        lançamento 1 de Julho
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">lista de espera</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-3 max-w-leitura">
        Quem se inscreveu para o lançamento. Cada uma tem um código de 25% de
        desconto. Exporta o CSV para a campanha de email do dia 1, e marca as
        convertidas à medida que vês as vendas no PayPal.
      </p>

      {error && (
        <p className="text-red-700 text-sm mt-4">erro: {error.message}</p>
      )}

      <div className="mt-8">
        <ListaEsperaTabela linhas={linhas} />
      </div>
    </div>
  );
}
