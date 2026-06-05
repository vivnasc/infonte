import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarOrdemPaypal, INFONTE_PRECO } from "@/lib/paypal";
import { aplicarDesconto } from "@/lib/lista-espera";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "não autenticada" }, { status: 401 });
  }

  const { data: utilizadora } = await supabase
    .from("utilizadoras")
    .select("id, comprou")
    .eq("auth_id", user.id)
    .single();

  if (!utilizadora) {
    return NextResponse.json({ erro: "utilizadora não encontrada" }, { status: 404 });
  }
  if (utilizadora.comprou) {
    return NextResponse.json({ erro: "já tens acesso completo" }, { status: 400 });
  }

  const origem =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // Código de desconto da lista de espera (opcional). Se válido, aplica 25%
  // e propaga o código para o return_url, para a captura marcar a conversão.
  let codigoDesconto: string | null = null;
  try {
    const body = await request.json();
    const c = (body?.desconto ?? "").toString().trim().toUpperCase();
    if (c) codigoDesconto = c;
  } catch {
    // sem corpo, segue sem desconto
  }

  let valor = INFONTE_PRECO.valor;
  let returnQuery = "";
  if (codigoDesconto) {
    const admin = criarClienteAdmin();
    const { data: insc } = await admin
      .from("lista_espera")
      .select("id")
      .eq("codigo_desconto", codigoDesconto)
      .maybeSingle();
    if (insc) {
      valor = aplicarDesconto(parseFloat(INFONTE_PRECO.valor)).toFixed(2);
      returnQuery = `?desconto=${encodeURIComponent(codigoDesconto)}`;
    }
  }

  try {
    const ordem = await criarOrdemPaypal({
      referencia: utilizadora.id,
      valor,
      // O PayPal acrescenta &token=<orderId>&PayerID=<id> à return_url.
      returnUrl: `${origem}/api/paypal/capturar${returnQuery}`,
      cancelUrl: `${origem}/etapa/1?paypal=cancelado`,
    });

    const admin = criarClienteAdmin();
    await admin.from("compras").insert({
      utilizadora_id: utilizadora.id,
      paypal_order_id: ordem.id,
      valor: parseFloat(ordem.valor),
      moeda: ordem.moeda,
      estado: "pendente",
    });

    return NextResponse.json({
      ordem_id: ordem.id,
      url_aprovacao: ordem.url_aprovacao,
      preco: INFONTE_PRECO,
    });
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ erro: m }, { status: 500 });
  }
}
