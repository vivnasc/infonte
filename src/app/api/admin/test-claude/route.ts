import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 15;

// Diagnóstico ligeiro: verifica que ANTHROPIC_API_KEY existe e responde.
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ ok: false, erro: "acesso negado" }, { status: 403 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, erro: "ANTHROPIC_API_KEY ausente" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (!r.ok) {
      const detalhe = (await r.text()).slice(0, 200);
      return NextResponse.json({ ok: false, erro: `Claude ${r.status}`, detalhe });
    }
    const j = await r.json();
    const texto = j.content?.[0]?.text?.trim() ?? "(vazio)";
    return NextResponse.json({ ok: true, modelo: "claude-sonnet-4-6", resposta: texto });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : "erro desconhecido",
    });
  }
}
