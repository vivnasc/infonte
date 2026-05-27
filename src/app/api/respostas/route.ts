import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "não autenticada" }, { status: 401 });
  }

  let body: { bloco_id?: unknown; valor?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo JSON inválido" }, { status: 400 });
  }
  const { bloco_id, valor } = body;
  if (typeof bloco_id !== "string" || bloco_id.length === 0) {
    return NextResponse.json({ erro: "bloco_id inválido" }, { status: 400 });
  }
  if (typeof valor !== "string") {
    return NextResponse.json({ erro: "valor inválido" }, { status: 400 });
  }
  if (valor.length > 20000) {
    return NextResponse.json({ erro: "valor demasiado longo" }, { status: 400 });
  }

  const { data: utilizadora } = await supabase
    .from("utilizadoras")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!utilizadora) {
    return NextResponse.json({ erro: "utilizadora não encontrada" }, { status: 404 });
  }

  const { error } = await supabase
    .from("respostas")
    .upsert(
      { utilizadora_id: utilizadora.id, bloco_id, valor },
      { onConflict: "utilizadora_id,bloco_id" }
    );

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
