import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST sem body. Faz duas correcções:
//
// 1) Duplicados: para cada (dia, slot) com mais de uma linha, mantém
//    a mais antiga (criado_em mais cedo) e APAGA as outras. A mais
//    antiga é, em regra, a original do seed.
// 2) Semana errada: actualiza p.semana para Math.ceil(p.dia/7).
//
// Não toca em estado/agendamentos. Idempotente.
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("id, dia, semana, slot, criado_em");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const lista = posts ?? [];
  const log: string[] = [];
  let apagados = 0;
  let semanaAjustada = 0;

  // 1. Duplicados
  type Linha = { id: string; dia: number; semana: number | null; slot: string | null; criado_em: string | null };
  const porChave = new Map<string, Linha[]>();
  for (const p of lista as Linha[]) {
    const slot = p.slot ?? "manha";
    const k = `${p.dia}-${slot}`;
    const arr = porChave.get(k) ?? [];
    arr.push(p);
    porChave.set(k, arr);
  }

  for (const [k, arr] of porChave.entries()) {
    if (arr.length <= 1) continue;
    arr.sort((a, b) => {
      const ta = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const tb = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      return ta - tb;
    });
    const [manter, ...remover] = arr;
    const idsRemover = remover.map((r) => r.id);
    const { error: errDel } = await sb
      .from("campanha_posts")
      .delete()
      .in("id", idsRemover);
    if (errDel) {
      log.push(`${k}: erro a apagar ${idsRemover.length} duplicados: ${errDel.message}`);
    } else {
      apagados += idsRemover.length;
      log.push(`${k}: mantido ${manter.id}, apagados ${idsRemover.length}`);
    }
  }

  // 2. Semana errada
  for (const p of lista as Linha[]) {
    // Schema tem check (semana between 1 and 4), por isso clamp a 4.
    const correcta = Math.min(4, Math.ceil(p.dia / 7));
    if (p.semana !== correcta) {
      const { error: errUp } = await sb
        .from("campanha_posts")
        .update({ semana: correcta })
        .eq("id", p.id);
      if (errUp) {
        log.push(`Dia ${p.dia}: erro a corrigir semana ${p.semana} → ${correcta}: ${errUp.message}`);
      } else {
        semanaAjustada++;
        log.push(`Dia ${p.dia}: semana ${p.semana} → ${correcta}`);
      }
    }
  }

  // 3. Renomear tarde para "Eco · ${manha}" em vez de "(emocional)".
  let relabeled = 0;
  const { data: tardes } = await sb
    .from("campanha_posts")
    .select("id, tema")
    .eq("slot", "tarde");
  for (const p of (tardes ?? []) as { id: string; tema: string }[]) {
    const t = p.tema ?? "";
    if (t.startsWith("Eco · ")) continue;
    let novo = t;
    const m = t.match(/^(.+?)\s*\(emocional\)\s*$/i);
    if (m) novo = `Eco · ${m[1].trim()}`;
    else if (t) novo = `Eco · ${t.trim()}`;
    else continue;
    const { error: e } = await sb
      .from("campanha_posts")
      .update({ tema: novo })
      .eq("id", p.id);
    if (!e) {
      relabeled++;
      log.push(`Tema ${t} → ${novo}`);
    }
  }

  return NextResponse.json({
    ok: true,
    apagados,
    semanaAjustada,
    relabeled,
    log,
  });
}
