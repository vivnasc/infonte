import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const WORKFLOW_FILE = "render-infonte-artes.yml";

// Lista os últimos runs do workflow de render HD, directamente da
// API do GitHub. A Vivianne não tem de abrir o GitHub para ver
// status, basta-lhe ficar dentro do estúdio.
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER ?? "vivnasc";
  const repo = process.env.GITHUB_REPO_NAME ?? "infonte";

  if (!token) {
    return NextResponse.json({ erro: "GITHUB_DISPATCH_TOKEN ausente" }, { status: 500 });
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=10`;

  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!r.ok) {
    const detalhe = (await r.text()).slice(0, 200);
    return NextResponse.json(
      { erro: `GitHub ${r.status}`, detalhe },
      { status: 500 }
    );
  }

  const j = await r.json();
  const runs = (j.workflow_runs ?? []).map((run: {
    id: number;
    name: string;
    display_title?: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_started_at: string;
    event: string;
  }) => ({
    id: run.id,
    titulo: run.display_title ?? run.name,
    status: run.status, // queued | in_progress | completed | waiting
    conclusao: run.conclusion, // success | failure | cancelled | null
    criadoEm: run.created_at,
    atualizadoEm: run.updated_at,
    iniciadoEm: run.run_started_at,
    htmlUrl: run.html_url,
    evento: run.event,
  }));

  return NextResponse.json({ ok: true, total: j.total_count ?? 0, runs });
}
