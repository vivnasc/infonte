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

// Paleta Infonte conforme sistema dos 5 mundos:
// Bg: âmbar #B8843D | Bold: dourado #EBAE4A
const BG_SLIDE = "#B8843D";
const BOLD_COR = "#EBAE4A";
const TEXTO_SOBRE_BG = "#FFFBF5";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseBold(s: string): string {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

const GOTA_SVG = `<svg width="48" height="48" viewBox="0 0 512 512"><path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${AMBAR}" stroke-width="18" stroke-linejoin="round"/><circle cx="256" cy="338" r="34" fill="${AMBAR_CLARO}"/></svg>`;

const GOTA_ICON = (size: number, cor: string = AMBAR, fill: string = AMBAR_CLARO) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 512 512"><path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${cor}" stroke-width="20" stroke-linejoin="round"/><circle cx="256" cy="338" r="34" fill="${fill}"/></svg>`;

// Marca: gota 36px + "infonte" em 24px, sempre bem visível
function marca(light: boolean): string {
  const cor = light ? OCRE_FORTE : AMBAR;
  const textCor = light ? CASTANHO : CREME;
  const fill = light ? OCRE : AMBAR_CLARO;
  return `<div style="display:flex;align-items:center;gap:12px;">
    ${GOTA_ICON(36, cor, fill)}
    <span style="font-family:'EB Garamond',serif;font-size:24px;color:${textCor};letter-spacing:0.02em;font-style:italic;">infonte</span>
  </div>`;
}

// Crédito inferior: © viviannedossantos (como o FreeMe)
function credito(light: boolean): string {
  const cor = light ? "rgba(74,47,27,0.4)" : "rgba(255,255,255,0.4)";
  return `<div style="display:flex;align-items:center;gap:6px;font-family:Inter,sans-serif;font-size:13px;color:${cor};">
    <span>©</span> <span>viviannedossantos</span>
  </div>`;
}

const ARRASTE = `<div style="display:flex;align-items:center;justify-content:center;gap:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;letter-spacing:0.05em;">Arraste para o lado <span style="font-size:20px;">→</span></div>`;

function paginacao(atual: number, total: number, light: boolean): string {
  const dots = Array.from({ length: total }, (_, i) =>
    `<div style="width:8px;height:8px;border-radius:50%;background:${i + 1 === atual
      ? (light ? OCRE : "#fff")
      : (light ? "rgba(74,47,27,0.2)" : "rgba(255,255,255,0.3)")
    };"></div>`
  ).join("");
  return `<div style="display:flex;gap:6px;">${dots}</div>`;
}

function base(w: number, h: number): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${w}px;height:${h}px;overflow:hidden;font-family:'EB Garamond',Georgia,serif;-webkit-font-smoothing:antialiased;}
strong{font-weight:700;}
</style></head><body>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT A: Foto metade superior, texto metade inferior
// (estilo Modo Caverna principal)
// ═══════════════════════════════════════════════════
function layoutFotoTopo(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const fotoH = Math.round(h * 0.45);
  const textoH = h - fotoH;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = opts.texto.replace(/\*\*/g, "").length;
  const fs = charCount < 30 ? 96 : charCount < 50 ? 82 : charCount < 80 ? 68 : charCount < 120 ? 56 : charCount < 180 ? 46 : 38;

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${fotoH}px;overflow:hidden;">
  ${opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center 25%;"/>
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,${BG_SLIDE} 100%);"></div>`
    : `<div style="width:100%;height:100%;background:linear-gradient(160deg,${BG_SLIDE} 0%,#7A5C2A 100%);"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(184,132,61,0.15) 0%,transparent 70%);"></div>`
  }
  <div style="position:absolute;top:32px;left:40px;z-index:2;">${marca(false)}</div>
</div>
<div style="position:relative;width:${W}px;height:${textoH}px;background:${BG_SLIDE};padding:48px 56px;display:flex;flex-direction:column;justify-content:center;">
  <style>strong{color:${BOLD_COR};font-weight:700;}</style>
  <div style="font-size:${fs}px;line-height:1.2;color:${CREME};text-shadow:0 2px 12px rgba(0,0,0,0.3);">
    ${linhas.map(l => `<p style="margin-bottom:12px;">${l}</p>`).join("")}
  </div>
  <div style="position:absolute;bottom:32px;left:56px;">${credito(false)}</div>
  ${opts.slideNum && opts.totalSlides && opts.totalSlides > 1 ? `
  <div style="position:absolute;bottom:56px;left:0;right:0;display:flex;justify-content:center;color:rgba(255,255,255,0.5);">${ARRASTE}</div>
  <div style="position:absolute;bottom:32px;right:40px;">${paginacao(opts.slideNum, opts.totalSlides, false)}</div>` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT B: Foto metade esquerda, texto metade direita
// ═══════════════════════════════════════════════════
function layoutFotoLado(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = opts.texto.replace(/\*\*/g, "").length;
  const fs = charCount < 50 ? 48 : charCount < 100 ? 40 : charCount < 180 ? 34 : 28;

  return `${base(W, h)}
<div style="display:flex;width:${W}px;height:${h}px;">
  <div style="width:42%;position:relative;overflow:hidden;">
    ${opts.imagemUrl
      ? `<img src="${opts.imagemUrl}" style="width:100%;height:100%;object-fit:cover;object-position:center;"/>
         <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,${BG_SLIDE} 100%);"></div>`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#3a2515 0%,${BG_SLIDE} 100%);display:flex;align-items:center;justify-content:center;">
           ${GOTA_SVG}
         </div>`
    }
  </div>
  <div style="width:58%;background:${BG_SLIDE};padding:60px 48px;display:flex;flex-direction:column;justify-content:center;position:relative;">
    <div style="margin-bottom:28px;">${marca(false)}</div>
    <div style="font-size:${fs}px;line-height:1.25;color:${CREME};">
      <style>strong{color:${BOLD_COR};font-weight:700;}</style>
      ${linhas.map(l => `<p style="margin-bottom:12px;">${l}</p>`).join("")}
    </div>
    ${opts.slideNum && opts.totalSlides && opts.totalSlides > 1 ? `
    <div style="margin-top:auto;padding-top:24px;display:flex;justify-content:space-between;align-items:center;">
      <div style="color:rgba(255,255,255,0.4);font-family:Inter,sans-serif;font-size:13px;">Arraste →</div>
      ${paginacao(opts.slideNum, opts.totalSlides, false)}
    </div>` : ""}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT C: Texto grande sobre fundo cheio (foto ou gradiente)
// com scrim forte (estilo statement)
// ═══════════════════════════════════════════════════
function layoutStatement(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = opts.texto.replace(/\*\*/g, "").length;
  const fs = charCount < 30 ? 100 : charCount < 50 ? 86 : charCount < 80 ? 72 : charCount < 120 ? 60 : charCount < 200 ? 48 : 38;

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;">
  ${opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(184,132,61,0.5) 0%,rgba(130,95,45,0.8) 50%,rgba(107,80,37,0.95) 100%);"></div>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,${BG_SLIDE} 0%,#8B6830 40%,#6B5025 100%);"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%,rgba(184,132,61,0.12) 0%,transparent 60%);"></div>`
  }
  <div style="position:absolute;top:36px;left:48px;z-index:2;">${marca(false)}</div>
  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;text-align:center;">
    <style>strong{color:${BOLD_COR};font-weight:700;}</style>
    <div style="font-size:${fs}px;line-height:1.2;color:${CREME};text-shadow:0 3px 20px rgba(0,0,0,0.5);">
      ${linhas.map(l => `<p style="margin-bottom:16px;">${l}</p>`).join("")}
    </div>
  </div>
  <div style="position:absolute;bottom:32px;left:48px;z-index:2;">${credito(false)}</div>
  ${opts.slideNum && opts.totalSlides && opts.totalSlides > 1 ? `
  <div style="position:absolute;bottom:32px;left:0;right:0;z-index:2;display:flex;justify-content:center;color:rgba(255,255,255,0.5);">${ARRASTE}</div>
  <div style="position:absolute;bottom:32px;right:40px;z-index:2;">${paginacao(opts.slideNum, opts.totalSlides, false)}</div>` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT D: CTA final com botão
// ═══════════════════════════════════════════════════
function layoutCta(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;">
  ${opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(184,132,61,0.6) 0%,rgba(107,80,37,0.9) 100%);"></div>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,${BG_SLIDE} 0%,#7A5C2A 100%);"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 70% 70%,rgba(184,132,61,0.12) 0%,transparent 60%);"></div>`
  }
  <div style="position:absolute;top:36px;left:48px;z-index:2;">${marca(false)}</div>
  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 64px;text-align:center;">
    <div style="margin-bottom:40px;">${GOTA_SVG}</div>
    <div style="font-size:62px;line-height:1.2;color:rgba(242,232,220,0.9);text-shadow:0 2px 16px rgba(0,0,0,0.4);">
      <style>strong{color:${BOLD_COR};font-weight:700;}</style>
      ${linhas.map(l => `<p style="margin-bottom:14px;">${l}</p>`).join("")}
    </div>
    <div style="margin-top:36px;display:inline-block;background:${OCRE};color:#fff;padding:22px 52px;border-radius:9999px;font-family:Inter,sans-serif;font-size:22px;font-weight:600;letter-spacing:0.03em;box-shadow:0 4px 0 rgba(154,108,44,0.5);">Começar a etapa 1, grátis</div>
    <div style="margin-top:20px;font-family:Inter,sans-serif;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);">infonte.vivannedossantos.com</div>
  </div>
  ${opts.slideNum && opts.totalSlides ? `
  <div style="position:absolute;bottom:32px;right:40px;z-index:2;">${paginacao(opts.slideNum, opts.totalSlides, false)}</div>` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT E: Fundo claro, texto escuro (variação limpa)
// ═══════════════════════════════════════════════════
function layoutClaro(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = opts.texto.replace(/\*\*/g, "").length;
  const fs = charCount < 30 ? 96 : charCount < 50 ? 82 : charCount < 80 ? 68 : charCount < 120 ? 56 : charCount < 180 ? 46 : 38;

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;background:linear-gradient(175deg,${CREME} 0%,#e8ddd0 60%,#ddd2c3 100%);">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(184,132,61,0.06) 0%,transparent 50%);"></div>
  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;">
    <div style="margin-bottom:32px;">${marca(true)}</div>
    <div style="font-size:${fs}px;line-height:1.25;color:${CASTANHO};">
      <style>strong{color:${OCRE_FORTE};font-weight:700;}</style>
      ${linhas.map(l => `<p style="margin-bottom:14px;">${l}</p>`).join("")}
    </div>
  </div>
  <div style="position:absolute;bottom:32px;left:72px;">${credito(true)}</div>
  ${opts.slideNum && opts.totalSlides && opts.totalSlides > 1 ? `
  <div style="position:absolute;bottom:56px;left:0;right:0;display:flex;justify-content:center;color:rgba(74,47,27,0.4);">${ARRASTE}</div>
  <div style="position:absolute;bottom:32px;right:40px;">${paginacao(opts.slideNum, opts.totalSlides, true)}</div>` : ""}
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════

export type SlideOpts = {
  texto: string;
  dia: number;
  tema: string;
  modo: "capa" | "conteudo" | "cta";
  formato: "feed" | "story";
  layout?: "foto-topo" | "foto-lado" | "statement" | "cta" | "claro";
  slideNum?: number;
  totalSlides?: number;
  imagemUrl?: string;
};

type FullOpts = SlideOpts;

function escolherLayout(opts: SlideOpts): string {
  const layout = opts.layout ?? inferirLayout(opts);
  switch (layout) {
    case "foto-topo": return layoutFotoTopo(opts);
    case "foto-lado": return layoutFotoLado(opts);
    case "statement": return layoutStatement(opts);
    case "cta": return layoutCta(opts);
    case "claro": return layoutClaro(opts);
    default: return layoutStatement(opts);
  }
}

function inferirLayout(opts: SlideOpts): string {
  if (opts.modo === "cta") return "cta";

  const temImagem = !!opts.imagemUrl;

  if (opts.modo === "capa") {
    return temImagem ? "foto-topo" : "statement";
  }

  // Slides internos de carrossel: com imagem alterna foto-topo/foto-lado,
  // sem imagem alterna claro/statement (cria ritmo visual dentro do carrossel)
  if (opts.modo === "conteudo") {
    if (temImagem) {
      return opts.slideNum && opts.slideNum % 3 === 0 ? "foto-lado" : "foto-topo";
    }
    return opts.slideNum && opts.slideNum % 2 === 0 ? "claro" : "statement";
  }

  return "statement";
}

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
    const html = escolherLayout(s);
    const ctx = await browser.newContext({
      viewport: { width: W, height: h },
      deviceScaleFactor: SCALE,
    });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
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
  formato: string | null,
  imagemUrl?: string | null,
  imagens?: string[] | null,
): SlideOpts[] {
  if (!textoImagem?.trim()) return [];
  const isStory = formato === "reel";
  const fmt: "feed" | "story" = isStory ? "story" : "feed";

  // Pool de imagens: usa o array de múltiplas, ou fallback para a URL única
  const pool = imagens && imagens.length > 0
    ? imagens
    : imagemUrl ? [imagemUrl] : [];

  // Distribui imagens circulando pelo pool
  const imgPara = (idx: number): string | undefined =>
    pool.length > 0 ? pool[idx % pool.length] : undefined;

  const numerados = textoImagem.match(/^\d+\.\s*.+$/gm);
  if (numerados && numerados.length >= 2) {
    const total = numerados.length + 2;
    const slides: SlideOpts[] = [];
    let imgIdx = 0;

    // Capa: com imagem
    slides.push({
      texto: tema, dia, tema, modo: "capa", formato: fmt,
      slideNum: 1, totalSlides: total, imagemUrl: imgPara(imgIdx++),
    });

    // Slides internos: pares com imagem (cada uma diferente), ímpares sem
    numerados.forEach((line, i) => {
      const slideN = i + 2;
      const usaImagem = slideN % 2 === 0;
      slides.push({
        texto: line.replace(/^\d+\.\s*/, ""), dia, tema, modo: "conteudo", formato: fmt,
        slideNum: slideN, totalSlides: total,
        imagemUrl: usaImagem ? imgPara(imgIdx++) : undefined,
      });
    });

    // CTA: com imagem
    slides.push({
      texto: "**Pára de perseguir** o que nunca foi teu.\nComeça pela etapa 1, grátis.",
      dia, tema, modo: "cta", formato: fmt,
      slideNum: total, totalSlides: total, imagemUrl: imgPara(imgIdx),
    });

    return slides;
  }

  // Post único
  return [{ texto: textoImagem.trim(), dia, tema, modo: "capa", formato: fmt, imagemUrl: imgPara(0) }];
}
