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
const AMBAR = "#EBAE4A";
const AMBAR_CLARO = "#F4C56A";

const GOTA_SVG = `<svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${AMBAR}" stroke-width="18" stroke-linejoin="round"/>
  <circle cx="256" cy="338" r="34" fill="${AMBAR_CLARO}"/>
</svg>`;

const GOTA_SMALL = `<svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="rgba(235,174,74,0.6)" stroke-width="18" stroke-linejoin="round"/>
  <circle cx="256" cy="338" r="34" fill="rgba(244,197,106,0.6)"/>
</svg>`;

// Converte **texto** em <strong>texto</strong> para negrito selectivo
function parseBold(s: string): string {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;font-weight:700;">$1</strong>');
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slideHtml(opts: {
  texto: string;
  dia: number;
  tema: string;
  modo: "capa" | "conteudo" | "cta";
  formato: "feed" | "story";
  slideNum?: number;
  totalSlides?: number;
  fotoFundo?: string;
}): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const isCapa = opts.modo === "capa";
  const isCta = opts.modo === "cta";
  const usaFoto = !!opts.fotoFundo;

  // Aplica negrito antes de dividir em linhas (pode abranger várias linhas)
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const charCount = opts.texto.replace(/\*\*/g, "").length;
  let fontSize: number;
  if (charCount < 40) fontSize = 84;
  else if (charCount < 70) fontSize = 72;
  else if (charCount < 120) fontSize = 60;
  else if (charCount < 200) fontSize = 48;
  else if (charCount < 350) fontSize = 38;
  else fontSize = 32;

  const textShadow = usaFoto || isCapa
    ? "text-shadow: 0 2px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);"
    : "";

  const bgLayer = usaFoto
    ? `<div style="position:absolute;inset:0;z-index:0;">
        <img src="${opts.fotoFundo}" style="width:100%;height:100%;object-fit:cover;object-position:center 20%;"/>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(46,29,18,0.55) 0%, rgba(46,29,18,0.85) 60%, rgba(46,29,18,0.95) 100%);"></div>
       </div>`
    : isCapa
      ? `<div style="position:absolute;inset:0;z-index:0;background:linear-gradient(160deg, ${TERRA} 0%, #3a2515 40%, #1a120a 100%);"></div>
         <div style="position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 30% 30%, rgba(184,132,61,0.12) 0%, transparent 60%);"></div>`
      : isCta
        ? `<div style="position:absolute;inset:0;z-index:0;background:linear-gradient(160deg, ${TERRA} 0%, #3a2515 100%);"></div>
           <div style="position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 70% 70%, rgba(184,132,61,0.15) 0%, transparent 60%);"></div>`
        : `<div style="position:absolute;inset:0;z-index:0;background:linear-gradient(175deg, ${CREME} 0%, #e8ddd0 60%, #ddd2c3 100%);"></div>
           <div style="position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 60% 40%, rgba(184,132,61,0.06) 0%, transparent 50%);"></div>`;

  const textColor = isCapa || usaFoto ? "rgba(242,232,220,0.95)" : CASTANHO;
  const boldColor = isCapa || usaFoto ? "#fff" : OCRE_FORTE;
  const labelColor = AMBAR;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body {
  width:${W}px;height:${h}px;position:relative;overflow:hidden;
  font-family:'EB Garamond',Georgia,serif;
  -webkit-font-smoothing:antialiased;
}
.content {
  position:relative;z-index:1;
  display:flex;flex-direction:column;justify-content:center;
  padding:${isCapa ? "80px 64px" : "72px 64px"};
  height:100%;
}
.label {
  font-family:Inter,system-ui,sans-serif;font-size:15px;
  letter-spacing:0.3em;text-transform:uppercase;color:${labelColor};
  ${textShadow}
}
.texto {
  font-size:${fontSize}px;line-height:1.25;color:${textColor};
  ${textShadow}
  font-weight:400;
}
.texto strong { color:${boldColor};font-weight:700; }
.texto p { margin-bottom:${fontSize < 40 ? 14 : 20}px; }
.marca {
  font-family:'EB Garamond',serif;font-size:26px;
  color:${isCapa || usaFoto ? CREME : CASTANHO};${textShadow}
}
.watermark {
  position:absolute;top:36px;right:40px;z-index:2;opacity:0.7;
}
.arraste {
  position:absolute;bottom:44px;left:0;right:0;z-index:2;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font-family:Inter,sans-serif;font-size:15px;font-weight:500;
  color:${isCapa || usaFoto ? "rgba(255,255,255,0.6)" : "rgba(74,47,27,0.45)"};
  letter-spacing:0.05em;
}
.paginacao {
  position:absolute;bottom:44px;right:48px;z-index:2;
  display:flex;gap:6px;
}
.paginacao .dot {
  width:8px;height:8px;border-radius:50%;
  background:${isCapa || usaFoto ? "rgba(255,255,255,0.3)" : "rgba(74,47,27,0.2)"};
}
.paginacao .dot.active {
  background:${isCapa || usaFoto ? "rgba(255,255,255,0.9)" : OCRE};
}
.cta-btn {
  display:inline-block;margin-top:36px;
  background:${OCRE};color:#fff;
  padding:22px 48px;border-radius:9999px;
  font-family:Inter,sans-serif;font-size:24px;font-weight:600;
  letter-spacing:0.03em;
  box-shadow:0 4px 0 rgba(154,108,44,0.5);
}
.sub {
  font-family:Inter,sans-serif;font-size:14px;letter-spacing:0.2em;
  text-transform:uppercase;
  color:${isCapa || usaFoto ? "rgba(255,255,255,0.45)" : "rgba(92,92,62,0.7)"};
  ${textShadow}
}
</style>
</head>
<body>
  ${bgLayer}

  <div class="watermark">${GOTA_SMALL}</div>

  <div class="content">
    ${isCapa ? `
      <div style="text-align:center;">
        <div style="margin-bottom:40px;">${GOTA_SVG}</div>
        <div class="label" style="margin-bottom:28px;">infonte · Dia ${opts.dia}</div>
        <div class="texto">${linhas.map((l) => `<p>${l}</p>`).join("")}</div>
        <div style="margin-top:48px;">
          <div class="marca">infonte</div>
          <div class="sub" style="margin-top:6px;">Vivianne dos Santos · Sete Ecos</div>
        </div>
      </div>
    ` : isCta ? `
      <div style="text-align:center;">
        <div style="margin-bottom:24px;">${GOTA_SVG}</div>
        <div class="texto">${linhas.map((l) => `<p>${l}</p>`).join("")}</div>
        <div class="cta-btn">Começar a etapa 1, grátis</div>
        <div style="margin-top:28px;">
          <div class="sub">infonte.vivannedossantos.com</div>
        </div>
      </div>
    ` : `
      <div>
        <div class="label" style="margin-bottom:36px;">infonte · Dia ${opts.dia}</div>
        <div class="texto">${linhas.map((l) => `<p>${l}</p>`).join("")}</div>
      </div>
    `}
  </div>

  ${opts.slideNum != null && opts.totalSlides != null && opts.totalSlides > 1 ? `
    <div class="arraste">Arraste para o lado →</div>
    <div class="paginacao">
      ${Array.from({ length: opts.totalSlides }, (_, i) => `<div class="dot ${i + 1 === opts.slideNum ? "active" : ""}"></div>`).join("")}
    </div>
  ` : ""}
</body>
</html>`;
}

export type SlideOpts = {
  texto: string;
  dia: number;
  tema: string;
  modo: "capa" | "conteudo" | "cta";
  formato: "feed" | "story";
  slideNum?: number;
  totalSlides?: number;
  fotoFundo?: string;
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
    await page.waitForTimeout(500);
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

  // Detecta slides numerados (1. xxx)
  const numerados = textoImagem.match(/^\d+\.\s*.+$/gm);
  if (numerados && numerados.length >= 2) {
    const total = numerados.length + 2;
    const slides: SlideOpts[] = [];

    slides.push({
      texto: tema,
      dia,
      tema,
      modo: "capa",
      formato: fmt,
      slideNum: 1,
      totalSlides: total,
    });

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

    slides.push({
      texto: "**Pára de perseguir** o que nunca foi teu.\nComeça pela etapa 1, grátis.",
      dia,
      tema,
      modo: "cta",
      formato: fmt,
      slideNum: total,
      totalSlides: total,
    });

    return slides;
  }

  // Post unico ou reel
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
