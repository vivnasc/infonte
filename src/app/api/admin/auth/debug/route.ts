import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";

// Confirma o SHA do deploy e se cada env crítica está presente.
// Não devolve valores, só `set: true/false`. Útil para diagnóstico
// antes de bulks: vês logo se acabaste de fazer redeploy e se nada
// caiu pelo caminho.
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, erro: "acesso negado" }, { status: 403 });
  }

  const envsCriticas = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "REPLICATE_API_TOKEN",
    "RESEND_API_KEY",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "GITHUB_DISPATCH_TOKEN",
    "GITHUB_REPO_OWNER",
    "GITHUB_REPO_NAME",
    "GITHUB_DISPATCH_REF",
    "CRON_SECRET",
  ];

  const envs: Record<string, boolean> = {};
  for (const k of envsCriticas) {
    envs[k] = !!process.env[k];
  }

  const todasOk = Object.values(envs).every(Boolean);
  const captionTag = (process.env.CAPTION_AUTHOR_TAG ?? "").trim();

  return NextResponse.json({
    ok: todasOk,
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "(local)",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "(local)",
    region: process.env.VERCEL_REGION ?? "(local)",
    ambiente: process.env.VERCEL_ENV ?? "development",
    captionTag: captionTag || "(desactivada)",
    envs,
    emFalta: Object.entries(envs)
      .filter(([, v]) => !v)
      .map(([k]) => k),
  });
}
