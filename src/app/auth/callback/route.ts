import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const proximo = url.searchParams.get("proximo") ?? "/painel";

  if (code) {
    const supabase = await criarClienteServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(proximo, url.origin));
}
