import { NextResponse } from "next/server";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Etapa = {
  id: number;
  slug: string;
  titulo: string;
  corpo_md: string;
  idioma: string;
};

function parseEtapa(filename: string, raw: string): Etapa | null {
  const m = filename.match(/^etapa-(\d{2})-(.+)\.md$/);
  if (!m) return null;
  const id = parseInt(m[1], 10);
  const slug = m[2];

  const linhas = raw.split(/\r?\n/);
  let titulo = "";
  for (let i = 0; i < linhas.length; i++) {
    if (/^##\s*Título visível/i.test(linhas[i])) {
      for (let j = i + 1; j < linhas.length; j++) {
        const linha = linhas[j].trim();
        if (linha.length > 0) {
          titulo = linha;
          break;
        }
      }
      break;
    }
  }
  if (!titulo) {
    const cabecalho = linhas.find((l) => /^#\s*ETAPA/i.test(l));
    titulo = cabecalho ? cabecalho.replace(/^#\s*/, "") : `Etapa ${id}`;
  }

  return { id, slug, titulo, corpo_md: raw, idioma: "pt" };
}

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const dir = join(process.cwd(), "content");
  let ficheiros: string[] = [];
  try {
    ficheiros = (await readdir(dir))
      .filter((f) => /^etapa-\d{2}-.+\.md$/.test(f))
      .sort();
  } catch (e) {
    return NextResponse.json(
      { erro: "pasta content/ não encontrada no servidor", detalhe: String(e) },
      { status: 500 }
    );
  }

  const etapas: Etapa[] = [];
  const log: string[] = [];
  for (const f of ficheiros) {
    const raw = await readFile(join(dir, f), "utf8");
    const parsed = parseEtapa(f, raw);
    if (parsed) {
      etapas.push(parsed);
      log.push(`${f} -> id=${parsed.id} "${parsed.titulo}"`);
    } else {
      log.push(`ignorado: ${f}`);
    }
  }

  const sb = criarClienteAdmin();
  const { error } = await sb.from("etapas").upsert(etapas, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ erro: error.message, log }, { status: 500 });
  }

  return NextResponse.json({ ok: true, total: etapas.length, log });
}
