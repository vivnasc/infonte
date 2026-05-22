import { NextResponse } from "next/server";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Post = {
  dia: number;
  semana: number;
  tema: string;
  formato: string | null;
  texto_imagem: string | null;
  legenda: string | null;
  pergunta: string | null;
};

function detectarFormato(raw: string): string | null {
  const m = raw.match(/^Formato:\s*(.+)$/m);
  if (!m) return null;
  const lower = m[1].toLowerCase();
  if (lower.includes("carrossel")) return "carrossel";
  if (
    lower.includes("reel") ||
    lower.includes("vídeo") ||
    lower.includes("video")
  )
    return "reel";
  if (lower.includes("post único") || lower.includes("post unico"))
    return "post-unico";
  return m[1].trim();
}

function extrairBloco(raw: string, etiqueta: string): string | null {
  const etiquetas = [
    "Slides:",
    "Texto na imagem:",
    "Legenda:",
    "Pergunta:",
    "Formato:",
  ];
  const idx = raw.search(new RegExp(`^${etiqueta}\\s*$|^${etiqueta}\\s`, "m"));
  if (idx < 0) return null;
  const inicio = raw.indexOf("\n", idx) + 1;
  let fim = raw.length;
  for (const e of etiquetas) {
    if (e === etiqueta) continue;
    const re = new RegExp(`^${e.replace(":", "\\:")}`, "m");
    const m = re.exec(raw.slice(inicio));
    if (m && m.index !== undefined) {
      const pos = inicio + m.index;
      if (pos < fim) fim = pos;
    }
  }
  return raw.slice(inicio, fim).trim();
}

function parsePosts(raw: string, semana: number): Post[] {
  const re = /^##\s*DIA\s+(\d+)\s*,\s*([^\n]+)$/gm;
  let m: RegExpExecArray | null;
  const inicios: { idx: number; dia: number; tema: string }[] = [];
  while ((m = re.exec(raw)) !== null) {
    inicios.push({
      idx: m.index,
      dia: parseInt(m[1], 10),
      tema: m[2].trim(),
    });
  }
  const blocos = inicios.map((s, i) => ({
    dia: s.dia,
    tema: s.tema,
    corpo: raw.slice(s.idx, i + 1 < inicios.length ? inicios[i + 1].idx : raw.length),
  }));

  return blocos.map(({ dia, tema, corpo }) => {
    const formato = detectarFormato(corpo);
    let textoImagem = extrairBloco(corpo, "Texto na imagem:");
    const slides = extrairBloco(corpo, "Slides:");
    if (slides) textoImagem = (textoImagem ? textoImagem + "\n\n" : "") + slides;
    let legenda = extrairBloco(corpo, "Legenda:");
    let pergunta: string | null = null;
    if (legenda) {
      const pMatch = legenda.match(/^Pergunta:\s*(.+)$/m);
      if (pMatch) {
        pergunta = pMatch[1].trim();
        legenda = legenda.replace(/^Pergunta:\s*.+$/m, "").trim();
      }
    }
    if (!pergunta) pergunta = extrairBloco(corpo, "Pergunta:");
    return {
      dia,
      semana,
      tema,
      formato,
      texto_imagem: textoImagem,
      legenda,
      pergunta,
    };
  });
}

export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const dir = join(process.cwd(), "infonte-campanha-30-dias");
  let ficheiros: string[] = [];
  try {
    ficheiros = (await readdir(dir))
      .filter((f) => /^semana-\d-posts\.md$/.test(f))
      .sort();
  } catch (e) {
    return NextResponse.json(
      {
        erro: "pasta infonte-campanha-30-dias/ não encontrada no servidor",
        detalhe: String(e),
      },
      { status: 500 }
    );
  }

  const posts: Post[] = [];
  const log: string[] = [];
  for (const f of ficheiros) {
    const sm = f.match(/^semana-(\d)-posts\.md$/);
    const semana = sm ? parseInt(sm[1], 10) : 0;
    const raw = await readFile(join(dir, f), "utf8");
    const lista = parsePosts(raw, semana);
    posts.push(...lista);
    log.push(`${f}: ${lista.length} posts (semana ${semana})`);
  }
  posts.sort((a, b) => a.dia - b.dia);

  const sb = criarClienteAdmin();
  let inseridos = 0;
  let atualizados = 0;
  for (const p of posts) {
    const { data: existente } = await sb
      .from("campanha_posts")
      .select("id")
      .eq("dia", p.dia)
      .maybeSingle();
    if (existente) {
      const { error } = await sb
        .from("campanha_posts")
        .update({
          semana: p.semana,
          tema: p.tema,
          formato: p.formato,
          texto_imagem: p.texto_imagem,
          legenda: p.legenda,
          pergunta: p.pergunta,
        })
        .eq("id", existente.id);
      if (error) {
        log.push(`erro a atualizar dia ${p.dia}: ${error.message}`);
      } else {
        atualizados++;
      }
    } else {
      const { error } = await sb.from("campanha_posts").insert(p);
      if (error) {
        log.push(`erro a inserir dia ${p.dia}: ${error.message}`);
      } else {
        inseridos++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: posts.length,
    inseridos,
    atualizados,
    log,
  });
}
