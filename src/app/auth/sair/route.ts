import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/server";
import { COOKIE_ADMIN } from "@/lib/admin-env";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();

  const jar = await cookies();
  jar.delete(COOKIE_ADMIN);

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
}
