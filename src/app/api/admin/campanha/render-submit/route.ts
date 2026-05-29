import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const WORKFLOW_FILE = "render-infonte-artes.yml";

// Dispara o workflow do GitHub Actions que faz o render HD via Playwright.
// O ficheiro do workflow é `.github/workflows/render-infonte-artes.yml`.
//
// Body: { dias: number[] | "all"; slot?: "manha" | "tarde" }
export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER ?? "vivnasc";
  const repo = process.env.GITHUB_REPO_NAME ?? "infonte";
  const ref = process.env.GITHUB_DISPATCH_REF ?? "main";

  if (!token) {
    return NextResponse.json(
      { erro: "GITHUB_DISPATCH_TOKEN ausente" },
      { status: 500 }
    );
  }

  let body: { dias?: number[] | "all"; slot?: string } = {};
  try {
    body = await request.json();
  } catch {}

  // Aceita também query params para o BotaoSeed conseguir disparar
  // sem body: ?dias=all&slot=manha ou ?dias=[1,2,3]&slot=tarde.
  const url = new URL(request.url);
  const diasQs = url.searchParams.get("dias");
  const slotQs = url.searchParams.get("slot");
  let diasInput: number[] | "all" = body.dias ?? "all";
  if (!body.dias && diasQs) {
    if (diasQs === "all") diasInput = "all";
    else {
      try {
        diasInput = JSON.parse(diasQs);
      } catch {
        diasInput = "all";
      }
    }
  }
  const slot = body.slot ?? slotQs ?? "manha";
  const jobId = `hd-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

  const diasJsonStr =
    diasInput === "all" ? "all" : JSON.stringify(diasInput);

  const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

  const r = await fetch(dispatchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref,
      inputs: {
        dias: diasJsonStr,
        slot,
        job_id: jobId,
      },
    }),
  });

  if (!r.ok) {
    const detalhe = await r.text();
    return NextResponse.json(
      {
        erro: `GitHub dispatch ${r.status}`,
        detalhe: detalhe.slice(0, 400),
      },
      { status: 500 }
    );
  }

  // Marca os dias do batch como "rendering" para o utilizador ver
  // que estão em vôo (state machine SyncHim). Só promove de rascunho/
  // failed; não atropela agendado/publicado.
  try {
    const sb = criarClienteAdmin();
    const diasAlvo =
      diasInput === "all" ? Array.from({ length: 30 }, (_, i) => i + 1) : diasInput;
    if (Array.isArray(diasAlvo)) {
      await sb
        .from("campanha_posts")
        .update({ estado: "rendering" })
        .in("dia", diasAlvo)
        .eq("slot", slot)
        .in("estado", ["rascunho", "failed", "rendering"]);
    }
  } catch (e) {
    // Não bloquear o dispatch se a marcação falhar.
    console.warn("[render-submit] erro a marcar rendering:", e);
  }

  // O workflow_dispatch não devolve o run_id directamente, só status 204.
  // Damos o link para a página de Actions filtrada por workflow.
  const workflowUrl = `https://github.com/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}`;
  const resultadoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
    /\/?$/,
    ""
  )}/storage/v1/object/public/infonte-assets/infonte-campanha-hd/${jobId}/result.json`;

  return NextResponse.json({
    ok: true,
    jobId,
    slot,
    dias: diasInput,
    workflowUrl,
    resultadoUrl,
    log: [
      `Job ID: ${jobId}`,
      `Workflow: ${workflowUrl}`,
      `Resultado (quando terminar): ${resultadoUrl}`,
      `Demora 2-5 min, depende dos slides por dia.`,
    ],
  });
}
