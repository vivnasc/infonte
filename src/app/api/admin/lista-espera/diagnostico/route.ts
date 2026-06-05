import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Diz a verdade sobre porque um email da lista pode não ter chegado.
// GET /api/admin/lista-espera/diagnostico            -> config + últimas inscrições
// GET .../diagnostico?testar=ola@vivannedossantos.com -> faz um envio real e devolve a resposta do Resend
export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const url = new URL(request.url);
  const testar = url.searchParams.get("testar");

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom =
    process.env.RESEND_FROM ?? "infonte <noreply@vivannedossantos.com>";
  const emailAutora = "ola@vivannedossantos.com";

  const sb = criarClienteAdmin();
  const { count } = await sb
    .from("lista_espera")
    .select("id", { count: "exact", head: true });
  const { data: ultimas } = await sb
    .from("lista_espera")
    .select("email, criado_em, fonte, codigo_desconto")
    .order("criado_em", { ascending: false })
    .limit(8);

  let teste: unknown = null;
  if (testar) {
    if (!resendKey) {
      teste = { ok: false, motivo: "RESEND_API_KEY ausente na Vercel" };
    } else {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to: testar,
            subject: "[infonte] teste de envio",
            html: "<p>Teste de envio via Resend. Se recebeste isto, o email funciona.</p>",
          }),
        });
        const body = await r.text();
        teste = { ok: r.ok, status: r.status, resposta: body.slice(0, 600) };
      } catch (e) {
        teste = { ok: false, erro: e instanceof Error ? e.message : String(e) };
      }
    }
  }

  return NextResponse.json({
    resendConfigurado: !!resendKey,
    resendFrom,
    emailAutora,
    totalInscricoes: count ?? 0,
    ultimas: ultimas ?? [],
    teste,
    nota:
      "Os emails só são enviados na PRIMEIRA inscrição de cada email. Se o teu email já estava na lista, uma nova submissão (ex: pelo diagnóstico) não reenvia.",
  });
}
