import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Diagnóstico: visita /api/healthz para veres o que está OK e o que falta.
// Não expõe segredos, só presença de variáveis e respostas básicas.

export const runtime = "nodejs";

type Verificacao = { nome: string; ok: boolean; detalhe?: string };

async function verificar(): Promise<Verificacao[]> {
  const checks: Verificacao[] = [];

  const SITE = process.env.NEXT_PUBLIC_SITE_URL;
  checks.push({
    nome: "env NEXT_PUBLIC_SITE_URL",
    ok: !!SITE,
    detalhe: SITE ?? "ausente",
  });

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  checks.push({
    nome: "env NEXT_PUBLIC_SUPABASE_URL",
    ok: !!SUPA_URL,
    detalhe: SUPA_URL ? mascarar(SUPA_URL) : "ausente",
  });

  const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  checks.push({
    nome: "env NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: !!SUPA_ANON,
    detalhe: SUPA_ANON ? `presente, ${SUPA_ANON.length} chars` : "ausente",
  });

  const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
  checks.push({
    nome: "env SUPABASE_SERVICE_ROLE_KEY",
    ok: !!SUPA_SVC,
    detalhe: SUPA_SVC ? `presente, ${SUPA_SVC.length} chars` : "ausente",
  });

  checks.push({
    nome: "env RESEND_API_KEY",
    ok: !!process.env.RESEND_API_KEY,
    detalhe: process.env.RESEND_API_KEY ? "presente" : "ausente (opcional)",
  });

  checks.push({
    nome: "env NEXT_PUBLIC_PAYPAL_CLIENT_ID",
    ok: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    detalhe: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      ? "presente"
      : "ausente (opcional por agora)",
  });

  // Testa REST do PostgREST com o schema infonte
  if (SUPA_URL && SUPA_ANON) {
    try {
      const sb = createClient(SUPA_URL, SUPA_ANON, {
        auth: { persistSession: false },
        db: { schema: "infonte" },
      });
      const { error } = await sb.from("etapas").select("id", { count: "exact", head: true });
      if (error) {
        let dica = error.message;
        if (/schema/i.test(error.message) || /404/.test(error.message)) {
          dica += " (provável: schema 'infonte' não está em Exposed schemas)";
        } else if (/relation .* does not exist/i.test(error.message)) {
          dica += " (provável: migrações 0001/0002 não foram corridas)";
        }
        checks.push({
          nome: "supabase, schema infonte e tabela etapas",
          ok: false,
          detalhe: dica,
        });
      } else {
        checks.push({
          nome: "supabase, schema infonte e tabela etapas",
          ok: true,
          detalhe: "responde",
        });
      }
    } catch (e) {
      checks.push({
        nome: "supabase, ligação",
        ok: false,
        detalhe: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    checks.push({
      nome: "supabase, ligação",
      ok: false,
      detalhe: "saltado, faltam variáveis",
    });
  }

  return checks;
}

function mascarar(s: string): string {
  if (s.length < 16) return s;
  return s.slice(0, 24) + "..." + s.slice(-6);
}

export async function GET() {
  const checks = await verificar();
  const ok = checks.every((c) => c.ok || c.detalhe?.includes("opcional"));
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
