import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ADMIN, tokenAdmin, verificarCredenciaisAdmin } from "@/lib/admin-env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "pedido inválido" }, { status: 400 });
  }

  const email = (body.email ?? "").toString();
  const password = (body.password ?? "").toString();

  if (!email || !password) {
    return NextResponse.json({ erro: "credenciais em falta" }, { status: 400 });
  }

  if (!verificarCredenciaisAdmin(email, password)) {
    return NextResponse.json({ erro: "credenciais inválidas" }, { status: 401 });
  }

  const token = tokenAdmin();
  if (!token) {
    return NextResponse.json(
      { erro: "admin por env não está configurado" },
      { status: 500 }
    );
  }

  const jar = await cookies();
  jar.set(COOKIE_ADMIN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
