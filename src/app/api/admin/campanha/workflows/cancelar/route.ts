import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";

// Cancela um run do GitHub Actions sem ter de sair da interface.
// Body: { runId: number }
export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER ?? "vivnasc";
  const repo = process.env.GITHUB_REPO_NAME ?? "infonte";

  if (!token) {
    return NextResponse.json({ erro: "GITHUB_DISPATCH_TOKEN ausente" }, { status: 500 });
  }

  let body: { runId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "body inválido" }, { status: 400 });
  }
  const runId = Number(body.runId);
  if (!Number.isFinite(runId)) {
    return NextResponse.json({ erro: "runId em falta" }, { status: 400 });
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!r.ok && r.status !== 202) {
    const detalhe = (await r.text()).slice(0, 200);
    return NextResponse.json(
      { erro: `GitHub ${r.status}`, detalhe },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, runId });
}
