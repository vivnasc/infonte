import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 15;

// Verifica que o token Replicate é válido (consulta a conta, não gera imagem).
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ ok: false, erro: "acesso negado" }, { status: 403 });

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, erro: "REPLICATE_API_TOKEN ausente" });
  }

  try {
    const r = await fetch("https://api.replicate.com/v1/account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      const detalhe = (await r.text()).slice(0, 200);
      return NextResponse.json({ ok: false, erro: `Replicate ${r.status}`, detalhe });
    }
    const j = await r.json();
    return NextResponse.json({
      ok: true,
      conta: j.username ?? j.name ?? "(desconhecido)",
      modelo: "black-forest-labs/flux-1.1-pro",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : "erro desconhecido",
    });
  }
}
