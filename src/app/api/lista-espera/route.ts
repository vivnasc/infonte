import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmailsListaEspera } from "@/lib/emails";
import { gerarCodigoDesconto } from "@/lib/lista-espera";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { nome?: string; email?: string; fonte?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const fonte = ((body.fonte ?? "").trim().toLowerCase() || null) as string | null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ erro: "Email inválido." }, { status: 400 });
  }

  // O nome é opcional (o diagnóstico pede só email, como a Astroline).
  // Se vier vazio, derivamos da parte antes do @.
  const nome = (body.nome ?? "").trim() || email.split("@")[0];

  const sb = criarClienteAdmin();

  // Já existe? Mantemos criado_em e código originais, só refrescamos
  // nome/fonte se vierem.
  const { data: existente } = await sb
    .from("lista_espera")
    .select("id, codigo_desconto")
    .eq("email", email)
    .maybeSingle();

  let codigoDesconto: string;
  let jaEstava = false;

  if (existente) {
    jaEstava = true;
    codigoDesconto = existente.codigo_desconto ?? gerarCodigoDesconto();
    await sb
      .from("lista_espera")
      .update({ nome, fonte, codigo_desconto: codigoDesconto })
      .eq("id", existente.id);
  } else {
    codigoDesconto = gerarCodigoDesconto();
    const { error } = await sb.from("lista_espera").insert({
      nome,
      email,
      fonte,
      codigo_desconto: codigoDesconto,
    });
    if (error) {
      // Corrida: inserção simultânea com o mesmo email (unique).
      if (error.code === "23505") {
        jaEstava = true;
      } else {
        return NextResponse.json({ erro: error.message }, { status: 500 });
      }
    }
  }

  // Total atual da lista.
  const { count } = await sb
    .from("lista_espera")
    .select("id", { count: "exact", head: true });
  const total = count ?? 0;

  // Emails em cada inscrição (confirmação gentil à pessoa + aviso filtrável
  // à autora). Nunca bloqueiam a inscrição.
  let emailPendente = false;
  try {
    const r = await enviarEmailsListaEspera({
      nome,
      email,
      codigoDesconto,
      fonte,
      total,
    });
    if (!r.ok) emailPendente = true;
  } catch (e) {
    console.warn("[lista-espera] email falhou", e);
    emailPendente = true;
  }

  return NextResponse.json({
    ok: true,
    jaEstava,
    codigoDesconto,
    total,
    emailPendente,
  });
}
