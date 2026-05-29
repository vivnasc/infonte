import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const HANDLE = "@vivianne.dos.santos";

function jaTemHandle(legenda: string | null): boolean {
  if (!legenda) return false;
  return legenda.includes(HANDLE);
}

function injetar(legenda: string | null): string {
  const base = (legenda ?? "").trimEnd();
  if (!base) return HANDLE;
  return `${base}\n\n${HANDLE}`;
}

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const sb = criarClienteAdmin();

  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("id, dia, slot, legenda");

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const log: string[] = [];
  let atualizados = 0;
  let saltados = 0;

  for (const p of posts ?? []) {
    if (jaTemHandle(p.legenda)) {
      saltados++;
      log.push(`Dia ${p.dia} ${p.slot ?? "manha"}: já tinha`);
      continue;
    }
    const nova = injetar(p.legenda);
    const { error: upErr } = await sb
      .from("campanha_posts")
      .update({ legenda: nova })
      .eq("id", p.id);
    if (upErr) {
      log.push(`Dia ${p.dia} ${p.slot ?? "manha"}: erro ${upErr.message}`);
    } else {
      atualizados++;
      log.push(`Dia ${p.dia} ${p.slot ?? "manha"}: ok`);
    }
  }

  return NextResponse.json({
    ok: true,
    atualizados,
    saltados,
    total: posts?.length ?? 0,
    log,
  });
}
