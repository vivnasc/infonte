import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { capturarOrdemPaypal } from "@/lib/paypal";
import { enviarEmailCompra } from "@/lib/emails";

// Esta rota é o return_url do PayPal. Captura a ordem, atualiza compra
// e marca a utilizadora como comprou=true. Depois redireciona ao painel.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token");
  const codigoDesconto = url.searchParams.get("desconto");
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (!orderId) {
    return NextResponse.redirect(`${origem}/etapa/1?paypal=falhou`);
  }

  try {
    const captura = await capturarOrdemPaypal(orderId);
    const admin = criarClienteAdmin();

    const { data: compra } = await admin
      .from("compras")
      .select("id, utilizadora_id")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (!compra) {
      return NextResponse.redirect(`${origem}/etapa/1?paypal=desconhecida`);
    }

    if (captura.estado === "COMPLETED" || captura.estado === "APPROVED") {
      await admin
        .from("compras")
        .update({
          estado: "paga",
          valor: parseFloat(captura.valor),
          moeda: captura.moeda,
        })
        .eq("id", compra.id);

      await admin
        .from("utilizadoras")
        .update({ comprou: true })
        .eq("id", compra.utilizadora_id);

      // Marca a conversão na lista de espera, se veio com código.
      if (codigoDesconto) {
        try {
          await admin
            .from("lista_espera")
            .update({ convertido_em: new Date().toISOString() })
            .eq("codigo_desconto", codigoDesconto.toUpperCase())
            .is("convertido_em", null);
        } catch (e) {
          console.warn("marcar conversão lista-espera falhou", e);
        }
      }

      // Email de confirmação (não bloqueia se falhar)
      try {
        const { data: u } = await admin
          .from("utilizadoras")
          .select("email, nome")
          .eq("id", compra.utilizadora_id)
          .single();
        if (u?.email) {
          await enviarEmailCompra({ email: u.email, nome: u.nome });
        }
      } catch (e) {
        console.warn("email compra falhou", e);
      }

      return NextResponse.redirect(`${origem}/painel?paypal=ok`);
    }

    await admin
      .from("compras")
      .update({ estado: captura.estado.toLowerCase() })
      .eq("id", compra.id);

    return NextResponse.redirect(`${origem}/etapa/1?paypal=pendente`);
  } catch (e) {
    console.error("PayPal capture error", e);
    return NextResponse.redirect(`${origem}/etapa/1?paypal=erro`);
  }
}
