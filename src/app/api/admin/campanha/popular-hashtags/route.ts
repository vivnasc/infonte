import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// Popula hashtags em todos os 60 posts a partir do pool definido no
// brief (01-estrutura-30-dias.md). Núcleo sempre, amplas + lusófonas
// rotacionadas por dia para evitar shadowban do Instagram.
// Idempotente: sobrescreve mas mantém formato consistente.

const NUCLEO = ["#clareza", "#foco", "#bastarse", "#infonte"];
const AMPLAS = [
  "#desenvolvimentopessoal",
  "#mulheres",
  "#propósito",
  "#mentefocada",
  "#produtividade",
];
const LUSOFONAS = ["#mulheresempreendedoras", "#portugal", "#moçambique", "#brasil"];

function hashtagsParaDia(dia: number, slot: string): string {
  // Núcleo: sempre os 4.
  const nucleo = NUCLEO;
  // Amplas: 4 das 5, rotacionando qual se omite por dia.
  const omitirAmpla = (dia - 1) % AMPLAS.length;
  const amplas = AMPLAS.filter((_, i) => i !== omitirAmpla);
  // Lusófonas: 2 das 4, rotaciona por dia+slot.
  const offsetLuso = ((dia - 1) * 2 + (slot === "tarde" ? 1 : 0)) % LUSOFONAS.length;
  const lusofonas = [
    LUSOFONAS[offsetLuso],
    LUSOFONAS[(offsetLuso + 1) % LUSOFONAS.length],
  ];
  return [...nucleo, ...amplas, ...lusofonas].join(" ");
}

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("id, dia, slot");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  let atualizados = 0;
  const log: string[] = [];

  for (const p of posts ?? []) {
    const slot = p.slot ?? "manha";
    const tags = hashtagsParaDia(p.dia, slot);
    const { error: upErr } = await sb
      .from("campanha_posts")
      .update({ hashtags: tags })
      .eq("id", p.id);
    if (upErr) {
      log.push(`Dia ${p.dia} ${slot}: erro ${upErr.message}`);
    } else {
      atualizados++;
    }
  }

  return NextResponse.json({ ok: true, atualizados, total: posts?.length ?? 0, log: log.slice(0, 10) });
}
