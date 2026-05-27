import { renderSlides, SlideOpts } from "../src/lib/render-slides";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "mockups", "artes-final");

const slides: SlideOpts[] = [
  {
    texto: "Tu não estás cansada\nde trabalhar.\n**Estás cansada\nde perseguir.**",
    dia: 1, tema: "MANIFESTO", modo: "capa", formato: "feed",
    layout: "statement", slideNum: 1, totalSlides: 5,
  },
  {
    texto: "A tua cabeça tem\n**vinte abas abertas.**\nPor isso estás cansada\nsem ter feito nada.",
    dia: 2, tema: "AS VINTE ABAS", modo: "capa", formato: "feed",
    layout: "foto-topo",
    imagemUrl: `file://${join(process.cwd(), "public", "vivianne-trabalho.jpg")}`,
  },
  {
    texto: "E se **metade dos teus sonhos**\nnem fossem teus?",
    dia: 3, tema: "O SONHO", modo: "capa", formato: "feed",
    layout: "foto-lado",
    imagemUrl: `file://${join(process.cwd(), "public", "vivianne-sereno.jpg")}`,
  },
  {
    texto: "Aprendeste cedo que tinhas\nde **fazer muito para valer.**\nE nunca mais paraste.",
    dia: 4, tema: "FAZER PARA VALER", modo: "conteudo", formato: "feed",
    layout: "claro", slideNum: 3, totalSlides: 5,
  },
  {
    texto: "**Pára de perseguir** o que nunca foi teu.\nComeça pela etapa 1, grátis.",
    dia: 1, tema: "CTA", modo: "cta", formato: "feed",
    layout: "cta", slideNum: 5, totalSlides: 5,
    imagemUrl: `file://${join(process.cwd(), "public", "vivianne-retrato.jpg")}`,
  },
  {
    texto: "A abundância não responde\na quem a persegue.\n**Responde a quem\nse basta.**",
    dia: 8, tema: "A FRASE QUE MUDA TUDO", modo: "capa", formato: "feed",
    layout: "statement",
  },
  {
    texto: "Quem tem fome\n**aceita migalhas.**\nQuem se basta\n**cobra o que vale.**",
    dia: 11, tema: "MIGALHAS", modo: "capa", formato: "feed",
    layout: "foto-topo",
    imagemUrl: `file://${join(process.cwd(), "public", "vivianne-ambiente.jpg")}`,
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const rendered = await renderSlides(slides);
  for (const r of rendered) {
    await writeFile(join(OUT, r.name), r.buffer);
    console.log(`${r.name}: ${(r.buffer.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
