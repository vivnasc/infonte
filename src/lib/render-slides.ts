import { chromium } from "playwright-core";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const W = 1080;
const H_FEED = 1350;
const H_STORY = 1920;
const SCALE = 2;

const CREME = "#F2E8DC";
const TERRA = "#2E1D12";
const CASTANHO = "#4A2F1B";
const OCRE = "#B8843D";
const OCRE_FORTE = "#9A6C2C";
const OLIVA = "#5C5C3E";
const AMBAR = "#EBAE4A";
const AMBAR_CLARO = "#F4C56A";

function slideHtml(opts: {
  texto: string;
  dia: number;
  tema: string;
  modo: "capa" | "conteudo" | "cta";
  formato: "feed" | "story";
  slideNum?: number;
  totalSlides?: number;
}): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const isCapa = opts.modo === "capa";
  const isCta = opts.modo === "cta";
  const bg = isCapa ? TERRA : CREME;
  const textColor = isCapa ? CREME : CASTANHO;
  const labelColor = isCapa ? AMBAR : OCRE_FORTE;

  const linhas = opts.texto.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const tamanhoTexto = isCapa
    ? "font-size:52px;line-height:1.2;font-weight:500;"
    : linhas.join(" ").length > 300
      ? "font-size:32px;line-height:1.6;"
      : "font-size:38px;line-height:1.55;";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body {
  width:${W}px;height:${h}px;background:${bg};color:${textColor};
  font-family:'EB Garamond',Georgia,serif;
  display:flex;flex-direction:column;justify-content:center;
  padding:80px 72px;overflow:hidden;
  -webkit-font-smoothing:antialiased;
}
.label { font-family:Inter,system-ui,sans-serif;font-size:16px;letter-spacing:0.3em;text-transform:uppercase;color:${labelColor}; }
.gota { margin:24px auto; }
.marca { font-family:'EB Garamond',serif;font-size:28px;color:${isCapa ? CREME : CASTANHO}; }
.sub { font-family:Inter,sans-serif;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;color:${isCapa ? "rgba(255,255,255,0.5)" : OLIVA}; }
.paginacao { font-family:Inter,sans-serif;font-size:14px;color:${isCapa ? "rgba(255,255,255,0.35)" : "rgba(74,47,27,0.35)"};position:absolute;bottom:40px;right:48px; }
.texto { ${tamanhoTexto} }
.texto p { margin-bottom:16px; }
${isCta ? `.cta-btn {
  display:inline-block;margin-top:32px;background:${OCRE};color:#fff;
  padding:20px 40px;border-radius:9999px;font-family:Inter,sans-serif;
  font-size:22px;font-weight:500;letter-spacing:0.03em;
}` : ""}
</style>
</head>
<body>
  ${isCapa ? `
    <div style="text-align:center;">
      <svg width="56" height="56" viewBox="0 0 512 512" style="margin-bottom:40px;">
        <path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${AMBAR}" stroke-width="20" stroke-linejoin="round"/>
        <circle cx="256" cy="338" r="36" fill="${AMBAR_CLARO}"/>
      </svg>
      <div class="label" style="margin-bottom:28px;">Dia ${opts.dia} · ${opts.tema}</div>
      <div class="texto">${linhas.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
      <div style="margin-top:48px;">
        <div class="marca">infonte</div>
        <div class="sub" style="margin-top:6px;">da Sete Ecos</div>
      </div>
    </div>
  ` : isCta ? `
    <div style="text-align:center;">
      <div class="label" style="margin-bottom:20px;">infonte</div>
      <div class="texto">${linhas.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
      <div class="cta-btn">Começar a etapa 1, grátis</div>
      <div style="margin-top:32px;">
        <div class="sub">infonte.vivannedossantos.com</div>
      </div>
    </div>
  ` : `
    <div>
      <div class="label" style="margin-bottom:32px;">Dia ${opts.dia}</div>
      <div class="texto">${linhas.map((l) => `<p>${esc(l)}</p>`).join("")}</div>
    </div>
  `}
  ${opts.slideNum != null && opts.totalSlides != null ? `<div class="paginacao">${opts.slideNum}/${opts.totalSlides}</div>` : ""}
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export type SlideOpts = {
  texto: string;
  dia: number;
  tema: string;
  modo: "capa" | "conteudo" | "cta";
  formato: "feed" | "story";
  slideNum?: number;
  totalSlides?: number;
};

export async function renderSlides(
  slides: SlideOpts[]
): Promise<{ name: string; buffer: Buffer }[]> {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const results: { name: string; buffer: Buffer }[] = [];

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const h = s.formato === "story" ? H_STORY : H_FEED;
    const ctx = await browser.newContext({
      viewport: { width: W, height: h },
      deviceScaleFactor: SCALE,
    });
    const page = await ctx.newPage();
    await page.setContent(slideHtml(s), { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const buf = await page.screenshot({ type: "png" });
    results.push({
      name: `dia-${String(s.dia).padStart(2, "0")}-slide-${i + 1}.png`,
      buffer: Buffer.from(buf),
    });
    await ctx.close();
  }

  await browser.close();
  return results;
}

export function parseTextoImagemToSlides(
  dia: number,
  tema: string,
  textoImagem: string,
  formato: string | null
): SlideOpts[] {
  if (!textoImagem?.trim()) return [];

  const isStory = formato === "reel";
  const fmt: "feed" | "story" = isStory ? "story" : "feed";

  // Se tem slides numerados (1. xxx \n 2. xxx)
  const numerados = textoImagem.match(/^\d+\.\s*.+$/gm);
  if (numerados && numerados.length >= 2) {
    const total = numerados.length + 2; // capa + slides + cta
    const slides: SlideOpts[] = [];

    // Capa (primeira linha ou tema)
    slides.push({
      texto: tema,
      dia,
      tema,
      modo: "capa",
      formato: fmt,
      slideNum: 1,
      totalSlides: total,
    });

    // Conteudo
    numerados.forEach((line, i) => {
      slides.push({
        texto: line.replace(/^\d+\.\s*/, ""),
        dia,
        tema,
        modo: "conteudo",
        formato: fmt,
        slideNum: i + 2,
        totalSlides: total,
      });
    });

    // CTA
    slides.push({
      texto: "Pára de perseguir o que nunca foi teu.\nComeça pela etapa 1, grátis.",
      dia,
      tema,
      modo: "cta",
      formato: fmt,
      slideNum: total,
      totalSlides: total,
    });

    return slides;
  }

  // Post unico ou reel: uma so imagem
  return [
    {
      texto: textoImagem.trim(),
      dia,
      tema,
      modo: "capa",
      formato: fmt,
    },
  ];
}
