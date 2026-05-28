import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 15;

// Verifica que o GITHUB_DISPATCH_TOKEN tem permissão de Actions:write
// no repo. Tenta listar workflows (read-only mas exige scope adequado).
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ ok: false, erro: "acesso negado" }, { status: 403 });

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER ?? "vivnasc";
  const repo = process.env.GITHUB_REPO_NAME ?? "infonte";

  if (!token) {
    return NextResponse.json({ ok: false, erro: "GITHUB_DISPATCH_TOKEN ausente" });
  }

  try {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    if (!r.ok) {
      const detalhe = (await r.text()).slice(0, 200);
      const dica =
        r.status === 401
          ? "Token errado ou expirado"
          : r.status === 403
          ? "Token não tem permissão Actions:write no repo"
          : r.status === 404
          ? "Repo não encontrado (verifica GITHUB_REPO_OWNER/NAME)"
          : "";
      return NextResponse.json({
        ok: false,
        erro: `GitHub ${r.status}`,
        dica,
        detalhe,
      });
    }
    const j = await r.json();
    const temRenderWorkflow = (j.workflows ?? []).some((w: { path?: string }) =>
      w.path?.includes("render-infonte-artes.yml")
    );
    return NextResponse.json({
      ok: true,
      repo: `${owner}/${repo}`,
      totalWorkflows: j.total_count ?? 0,
      renderWorkflowVisivel: temRenderWorkflow,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : "erro desconhecido",
    });
  }
}
