import { renderSlides, parseTextoImagemToSlides } from "../src/lib/render-slides";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "mockups", "carrossel-mix");
const IMG = `file://${join(process.cwd(), "public", "vivianne-trabalho.jpg")}`;

async function main() {
  await mkdir(OUT, { recursive: true });

  // Simula um carrossel de 5 slides com imagem MJ disponível
  const texto = `1. Tu não estás cansada de trabalhar. **Estás cansada de perseguir.**
2. Estás dispersa porque andas a perseguir coisas a mais, e a maioria **nem são tuas.**
3. Vem da comparação, do medo, da **carência antiga.**
4. Alguns dos sonhos que persegues **não nasceram em ti.**
5. A mulher que se basta **não corre atrás de tudo.** Ela escolhe.`;

  const slides = parseTextoImagemToSlides(1, "MANIFESTO", texto, "carrossel", IMG);

  console.log("Slides gerados:");
  slides.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.modo} | imagem: ${s.imagemUrl ? "SIM" : "NÃO"} | layout inferido`);
  });

  const rendered = await renderSlides(slides);
  for (const r of rendered) {
    await writeFile(join(OUT, r.name), r.buffer);
    console.log(`${r.name}: ${(r.buffer.length / 1024).toFixed(0)} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
