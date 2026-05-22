import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Faltam variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: "infonte" },
});

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

  // O título visível está na linha a seguir a "## Título visível"
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
    // Fallback: primeira "# ETAPA N, NOME"
    const cabecalho = linhas.find((l) => /^#\s*ETAPA/i.test(l));
    titulo = cabecalho ? cabecalho.replace(/^#\s*/, "") : `Etapa ${id}`;
  }

  return {
    id,
    slug,
    titulo,
    corpo_md: raw,
    idioma: "pt",
  };
}

async function main() {
  const dir = join(process.cwd(), "content");
  const ficheiros = (await readdir(dir))
    .filter((f) => /^etapa-\d{2}-.+\.md$/.test(f))
    .sort();

  console.log(`A ler ${ficheiros.length} ficheiros de ${dir}.`);

  const etapas: Etapa[] = [];
  for (const f of ficheiros) {
    const raw = await readFile(join(dir, f), "utf8");
    const parsed = parseEtapa(f, raw);
    if (!parsed) {
      console.warn(`Ignorado, não corresponde ao padrão: ${f}`);
      continue;
    }
    etapas.push(parsed);
    console.log(`  ${f} -> id=${parsed.id} slug=${parsed.slug} titulo="${parsed.titulo}"`);
  }

  const { error } = await supabase
    .from("etapas")
    .upsert(etapas, { onConflict: "id" });

  if (error) {
    console.error("Erro a fazer upsert:", error);
    process.exit(1);
  }

  console.log(`\nUpsert concluído. ${etapas.length} etapas em base.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
