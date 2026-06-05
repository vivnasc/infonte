import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  let body: { id?: string; convertido?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ erro: "falta id" }, { status: 400 });
  }

  const sb = criarClienteAdmin();
  const { error } = await sb
    .from("lista_espera")
    .update({ convertido_em: body.convertido ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
