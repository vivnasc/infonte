import { renderSlides, SlideOpts } from "../src/lib/render-slides";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "mockups", "artes-teste");

const slides: SlideOpts[] = [
  {
    texto: "Tu não estás cansada\nde trabalhar.\n**Estás cansada\nde perseguir.**",
    dia: 1,
    tema: "MANIFESTO",
    modo: "capa",
    formato: "feed",
    slideNum: 1,
    totalSlides: 5,
  },
  {
    texto: "A tua cabeça tem\n**vinte abas abertas.**\nPor isso estás cansada\nsem ter feito nada.",
    dia: 2,
    tema: "AS VINTE ABAS",
    modo: "conteudo",
    formato: "feed",
    slideNum: 2,
    totalSlides: 5,
  },
  {
    texto: "E se **metade dos teus sonhos**\nnem fossem teus?",
    dia: 3,
    tema: "O SONHO QUE NEM É TEU",
    modo: "capa",
    formato: "feed",
  },
  {
    texto: "**Pára de perseguir** o que nunca foi teu.\nComeça pela etapa 1, grátis.",
    dia: 1,
    tema: "CTA",
    modo: "cta",
    formato: "feed",
    slideNum: 5,
    totalSlides: 5,
  },
  {
    texto: "A abundância não responde\na quem a persegue.\n**Responde a quem se basta.**",
    dia: 8,
    tema: "A FRASE QUE MUDA TUDO",
    modo: "capa",
    formato: "feed",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const rendered = await renderSlides(slides);
  for (const r of rendered) {
    const path = join(OUT, r.name);
    await writeFile(path, r.buffer);
    console.log(`${r.name}: ${(r.buffer.length / 1024).toFixed(0)} KB`);
  }
  console.log(`\n${rendered.length} artes em ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
