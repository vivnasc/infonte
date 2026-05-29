import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: "infonte" },
});

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
  if (lower.includes("reel") || lower.includes("vídeo") || lower.includes("video"))
    return "reel";
  if (lower.includes("post único") || lower.includes("post unico")) return "post-unico";
  return m[1].trim();
}

function limparSeparadores(s: string | null): string | null {
  if (!s) return s;
  const out = s
    .split("\n")
    .filter((linha) => !/^[\s─━_*\-]+$/.test(linha))
    .join("\n")
    .trim();
  return out || null;
}

function extrairBloco(raw: string, etiqueta: string): string | null {
  const etiquetas = ["Slides:", "Texto na imagem:", "Legenda:", "Pergunta:", "Formato:"];
  const etBase = etiqueta.replace(/:$/, "");
  const idx = raw.search(
    new RegExp(
      `^${etBase}:\\s*$|^${etBase}:\\s|^${etBase}\\s*\\([^)]*\\)\\s*:`,
      "m"
    )
  );
  if (idx < 0) return null;
  const linhaFim = raw.indexOf("\n", idx);
  const linha = raw.slice(idx, linhaFim < 0 ? raw.length : linhaFim);
  const inlineMatch = linha.match(new RegExp(`^${etBase}[^:]*:\\s*(.*)$`));
  const inlineContent = inlineMatch ? inlineMatch[1].trim() : "";
  const inicio = linhaFim < 0 ? raw.length : linhaFim + 1;
  let fim = raw.length;
  for (const e of etiquetas) {
    if (e === etiqueta) continue;
    const eBase = e.replace(/:$/, "");
    const re = new RegExp(
      `^${eBase}:|^${eBase}\\s*\\([^)]*\\)\\s*:`,
      "m"
    );
    const m = re.exec(raw.slice(inicio));
    if (m && m.index !== undefined) {
      const pos = inicio + m.index;
      if (pos < fim) fim = pos;
    }
  }
  const rest = raw.slice(inicio, fim).trim();
  const combined = inlineContent
    ? (rest ? `${inlineContent}\n${rest}` : inlineContent)
    : rest || null;
  return limparSeparadores(combined);
}

function parsePosts(raw: string, semana: number): Post[] {
  // Separa por "## DIA N, TEMA"
  const blocos: { dia: number; tema: string; corpo: string }[] = [];
  const re = /^##\s*DIA\s+(\d+)\s*,\s*([^\n]+)$/gm;
  let m: RegExpExecArray | null;
  const inicios: { idx: number; dia: number; tema: string }[] = [];
  while ((m = re.exec(raw)) !== null) {
    inicios.push({ idx: m.index, dia: parseInt(m[1], 10), tema: m[2].trim() });
  }
  for (let i = 0; i < inicios.length; i++) {
    const start = inicios[i].idx;
    const end = i + 1 < inicios.length ? inicios[i + 1].idx : raw.length;
    blocos.push({
      dia: inicios[i].dia,
      tema: inicios[i].tema,
      corpo: raw.slice(start, end),
    });
  }

  return blocos.map(({ dia, tema, corpo }) => {
    const formato = detectarFormato(corpo);
    let textoImagem = extrairBloco(corpo, "Texto na imagem:");
    const slides = extrairBloco(corpo, "Slides:");
    if (slides) textoImagem = (textoImagem ? textoImagem + "\n\n" : "") + slides;
    let legenda = extrairBloco(corpo, "Legenda:");
    let pergunta: string | null = null;
    if (legenda) {
      // A linha "Pergunta: ..." vem por vezes dentro do bloco "Legenda:"
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

async function main() {
  const dir = join(process.cwd(), "infonte-campanha-30-dias");
  const ficheiros = (await readdir(dir))
    .filter((f) => /^semana-\d-posts\.md$/.test(f))
    .sort();

  const posts: Post[] = [];
  for (const f of ficheiros) {
    const m = f.match(/^semana-(\d)-posts\.md$/);
    const semana = m ? parseInt(m[1], 10) : 0;
    const raw = await readFile(join(dir, f), "utf8");
    const lista = parsePosts(raw, semana);
    console.log(`${f}: ${lista.length} posts (semana ${semana})`);
    posts.push(...lista);
  }

  posts.sort((a, b) => a.dia - b.dia);

  // Para evitar mexer em estado/agendamento já editados, fazemos
  // upsert apenas dos campos editoriais. Estado, data_publicacao,
  // imagem_url e hashtags ficam intactos se já estiverem definidos.
  for (const p of posts) {
    const { data: existente } = await supabase
      .from("campanha_posts")
      .select("id")
      .eq("dia", p.dia)
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
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
        console.error(`Erro a atualizar dia ${p.dia}:`, error.message);
      }
    } else {
      const { error } = await supabase.from("campanha_posts").insert(p);
      if (error) {
        console.error(`Erro a inserir dia ${p.dia}:`, error.message);
      }
    }
  }

  console.log(`\nUpsert concluído. ${posts.length} dias em base.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
