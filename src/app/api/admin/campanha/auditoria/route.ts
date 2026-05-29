import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Auditoria da tabela campanha_posts:
//   - dias em falta (manhã e tarde)
//   - duplicados (mesmo dia+slot mais que uma linha)
//   - dia/semana inconsistentes
//   - posts sem texto_imagem
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("id, dia, semana, slot, texto_imagem, criado_em");

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const lista = posts ?? [];

  // Indexar por (dia, slot)
  type Linha = { id: string; dia: number; semana: number | null; slot: string | null; texto_imagem: string | null };
  const porChave = new Map<string, Linha[]>();
  for (const p of lista as Linha[]) {
    const slot = p.slot ?? "manha";
    const k = `${p.dia}-${slot}`;
    const arr = porChave.get(k) ?? [];
    arr.push(p);
    porChave.set(k, arr);
  }

  const duplicados: Array<{ dia: number; slot: string; ids: string[]; total: number }> = [];
  for (const [k, arr] of porChave.entries()) {
    if (arr.length > 1) {
      const [diaStr, slot] = k.split("-");
      duplicados.push({
        dia: parseInt(diaStr, 10),
        slot,
        ids: arr.map((p) => p.id),
        total: arr.length,
      });
    }
  }

  const manhaEmFalta: number[] = [];
  const tardeEmFalta: number[] = [];
  for (let d = 1; d <= 30; d++) {
    if (!porChave.has(`${d}-manha`)) manhaEmFalta.push(d);
    if (!porChave.has(`${d}-tarde`)) tardeEmFalta.push(d);
  }

  const semanaErrada: Array<{ id: string; dia: number; semanaActual: number | null; semanaCorrecta: number }> = [];
  for (const p of lista as Linha[]) {
    const correcta = Math.ceil(p.dia / 7);
    if (p.semana !== correcta) {
      semanaErrada.push({
        id: p.id,
        dia: p.dia,
        semanaActual: p.semana,
        semanaCorrecta: correcta,
      });
    }
  }

  const semTexto: Array<{ id: string; dia: number; slot: string }> = [];
  for (const p of lista as Linha[]) {
    if (!p.texto_imagem?.trim()) {
      semTexto.push({ id: p.id, dia: p.dia, slot: p.slot ?? "manha" });
    }
  }

  const porSlot = {
    manha: lista.filter((p) => (p.slot ?? "manha") === "manha").length,
    tarde: lista.filter((p) => p.slot === "tarde").length,
  };

  const porSemana = [1, 2, 3, 4, 5].map((s) => ({
    semana: s,
    total: lista.filter((p) => p.semana === s).length,
    manha: lista.filter((p) => p.semana === s && (p.slot ?? "manha") === "manha").length,
    tarde: lista.filter((p) => p.semana === s && p.slot === "tarde").length,
  }));

  return NextResponse.json({
    ok: true,
    total: lista.length,
    esperado: 60,
    porSlot,
    porSemana,
    problemas: {
      duplicados,
      manhaEmFalta,
      tardeEmFalta,
      semanaErrada,
      semTexto,
    },
    contagens: {
      duplicados: duplicados.length,
      manhaEmFalta: manhaEmFalta.length,
      tardeEmFalta: tardeEmFalta.length,
      semanaErrada: semanaErrada.length,
      semTexto: semTexto.length,
    },
  });
}
