import { chromium } from "playwright-core";
import { aplicarBoldDinamico } from "./keywords-bold";
import { limparTravessoes } from "./limpar-texto";

// Caminho local para o Chromium pré-instalado, se existir. Em ambientes
// como GitHub Actions o Playwright tem o browser instalado num path
// default, e setamos executablePath para undefined para deixar a
// biblioteca resolver. Pode ser sobreposto por env (PLAYWRIGHT_CHROMIUM_PATH).
const CHROME_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
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
// Slides usam terra escuro como fundo principal (mais impacto),
// com o âmbar no bold e acentos.
const BG_SLIDE = "#2E1D12";
const BOLD_COR = "#EBAE4A";
const TEXTO_SOBRE_BG = "#FFFBF5";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const GOTA_INLINE = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 512 512" style="display:inline-block;"><path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="${AMBAR_CLARO}" stroke="${AMBAR}" stroke-width="14" stroke-linejoin="round"/></svg>`;

const GOTA_SVG = `<svg width="72" height="72" viewBox="0 0 512 512"><path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="${AMBAR_CLARO}" stroke="${AMBAR}" stroke-width="16" stroke-linejoin="round"/></svg>`;

// Substitui tokens do brief que devem virar SVG/ícone no render.
// O brief escreve "(gota)" como marcador editorial; aqui troca-se
// por uma gota inline (estilo capitular).
function substituirTokens(s: string): string {
  return s.replace(
    /\(gota\)/gi,
    `<span style="display:inline-block;vertical-align:-0.18em;margin:0 0.1em;">${GOTA_INLINE(72)}</span>`
  );
}

function parseBold(s: string): string {
  return substituirTokens(esc(s)).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

const GOTA_ICON = (size: number, cor: string = AMBAR, fill: string = AMBAR_CLARO) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 512 512"><path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${cor}" stroke-width="20" stroke-linejoin="round"/><circle cx="256" cy="338" r="34" fill="${fill}"/></svg>`;

// Marca: gota 28px + "infonte" em 20px, estilo FreeMe (discreta no
// canto, sem tirar peso ao conteúdo).
function marca(light: boolean): string {
  const cor = light ? OCRE_FORTE : AMBAR;
  const textCor = light ? CASTANHO : "rgba(242,232,220,0.92)";
  const fill = light ? OCRE : AMBAR_CLARO;
  return `<div style="display:flex;align-items:center;gap:8px;">
    ${GOTA_ICON(28, cor, fill)}
    <span style="font-family:'EB Garamond',serif;font-size:20px;color:${textCor};letter-spacing:0.01em;font-style:italic;">infonte</span>
  </div>`;
}

// Crédito inferior: handle @vivianne.dos.santos discreto (estilo FreeMe).
function credito(light: boolean): string {
  const cor = light ? "rgba(74,47,27,0.45)" : "rgba(242,232,220,0.5)";
  return `<div style="font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.02em;color:${cor};">@vivianne.dos.santos</div>`;
}

const ARRASTE = `<div style="display:flex;align-items:center;justify-content:flex-start;gap:10px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;">DESLIZA PARA O LADO <span style="font-size:18px;letter-spacing:0;">→</span></div>`;

// Número ghost: dígito enorme em creme translúcido atrás do conteúdo
// (regra 5 do SyncHim — número fantasma visível em todas as slides).
function ghostNumero(slideNum: number | undefined, light: boolean): string {
  if (!slideNum) return "";
  const cor = light ? "rgba(74,47,27,0.06)" : "rgba(242,232,220,0.05)";
  return `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-58%);font-family:'EB Garamond',serif;font-weight:600;font-size:780px;line-height:1;color:${cor};z-index:0;pointer-events:none;letter-spacing:-0.05em;">${String(slideNum).padStart(2, "0")}</div>`;
}

// Paginação textual (regra 6 do SyncHim): "01 / 07" em vez de só dots,
// mais editorial. Devolve string formatada para usar no canto inferior.
function paginacaoTextual(atual: number, total: number, light: boolean): string {
  const cor = light ? "rgba(74,47,27,0.55)" : "rgba(242,232,220,0.6)";
  return `<div style="font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.2em;color:${cor};">${String(atual).padStart(2, "0")} / ${String(total).padStart(2, "0")}</div>`;
}

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
    : `<div style="width:100%;height:100%;background:linear-gradient(160deg,${BG_SLIDE} 0%,#3a2515 100%);"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(184,132,61,0.15) 0%,transparent 70%);"></div>`
  }
  <div style="position:absolute;top:32px;left:40px;z-index:2;">${marca(false)}</div>
</div>
<div style="position:relative;width:${W}px;height:${textoH}px;background:${BG_SLIDE};padding:48px 56px;display:flex;flex-direction:column;justify-content:center;">
  <style>strong{color:${BOLD_COR};font-weight:800;text-shadow:0 1px 8px rgba(0,0,0,0.4);}</style>
  <div style="font-size:${fs}px;line-height:1.2;color:${CREME};text-shadow:0 2px 12px rgba(0,0,0,0.3);letter-spacing:-0.005em;">
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
  const isCapa = opts.modo === "capa";
  const fs = isCapa
    ? (charCount < 30 ? 108 : charCount < 50 ? 92 : charCount < 80 ? 76 : charCount < 120 ? 64 : charCount < 200 ? 52 : 42)
    : (charCount < 30 ? 92 : charCount < 50 ? 78 : charCount < 80 ? 64 : charCount < 120 ? 54 : charCount < 200 ? 44 : 36);
  const italic = isCapa ? "font-style:italic;" : "";

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;">
  ${opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(46,29,18,0.5) 0%,rgba(46,29,18,0.8) 50%,rgba(46,29,18,0.95) 100%);"></div>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,${BG_SLIDE} 0%,#3a2515 40%,#1a120a 100%);"></div>
       <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%,rgba(184,132,61,0.12) 0%,transparent 60%);"></div>`
  }
  <div style="position:absolute;top:36px;left:48px;z-index:2;">${marca(false)}</div>
  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;text-align:center;">
    <style>strong{color:${BOLD_COR};font-weight:800;text-shadow:0 1px 8px rgba(0,0,0,0.4);}</style>
    <div style="font-size:${fs}px;line-height:1.18;color:${CREME};text-shadow:0 3px 20px rgba(0,0,0,0.6);${italic}letter-spacing:-0.01em;">
      ${linhas.map(l => `<p style="margin-bottom:18px;">${l}</p>`).join("")}
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
       <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(46,29,18,0.6) 0%,rgba(46,29,18,0.9) 100%);"></div>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(160deg,${BG_SLIDE} 0%,#3a2515 100%);"></div>
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
  const isCapa = opts.modo === "capa";
  const fs = isCapa
    ? (charCount < 30 ? 100 : charCount < 50 ? 86 : charCount < 80 ? 72 : charCount < 120 ? 60 : charCount < 180 ? 50 : 42)
    : (charCount < 30 ? 84 : charCount < 50 ? 72 : charCount < 80 ? 60 : charCount < 120 ? 50 : charCount < 180 ? 42 : 34);
  const italic = isCapa ? "font-style:italic;" : "";

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;background:linear-gradient(175deg,${CREME} 0%,#e8ddd0 60%,#ddd2c3 100%);">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(184,132,61,0.06) 0%,transparent 50%);"></div>
  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;justify-content:center;padding:80px 72px;">
    <div style="margin-bottom:32px;">${marca(true)}</div>
    <div style="font-size:${fs}px;line-height:1.2;color:${CASTANHO};${italic}letter-spacing:-0.01em;">
      <style>strong{color:${OCRE_FORTE};font-weight:800;}</style>
      ${linhas.map(l => `<p style="margin-bottom:16px;">${l}</p>`).join("")}
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
// LAYOUT F: Foto cheia, texto em baixo à esquerda
// (estilo FreeMe principal — mais usado para capa e statement com foto)
// ═══════════════════════════════════════════════════
function layoutFotoCheia(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoComBold = parseBold(opts.texto);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = opts.texto.replace(/\*\*/g, "").length;
  // Capa: tipografia maior e mais confiante (estilo FreeMe).
  // Conteúdo: legível mas com hierarquia inferior à capa.
  const isCapa = opts.modo === "capa";
  const fs = isCapa
    ? (charCount < 30 ? 96 : charCount < 60 ? 84 : charCount < 100 ? 68 : charCount < 160 ? 56 : 46)
    : (charCount < 30 ? 78 : charCount < 60 ? 66 : charCount < 100 ? 54 : charCount < 160 ? 46 : 38);
  const italic = isCapa ? "font-style:italic;" : "";

  // Gradient suave: praticamente transparente em cima, escuro quente
  // a meio, muito escuro em baixo para o texto agarrar bem.
  const scrim = `linear-gradient(180deg,rgba(28,18,11,0.10) 0%,rgba(28,18,11,0.35) 45%,rgba(28,18,11,0.85) 75%,rgba(28,18,11,0.95) 100%)`;

  const total = opts.totalSlides ?? 1;
  const num = opts.slideNum ?? 1;
  const mostraPag = total > 1;

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;background:${BG_SLIDE};overflow:hidden;">
  ${opts.imagemUrl
    ? `<img src="${opts.imagemUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;"/>
       <div style="position:absolute;inset:0;background:${scrim};"></div>`
    : `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 25%,#3a2515 0%,${BG_SLIDE} 60%,#180e08 100%);"></div>`
  }

  ${!opts.imagemUrl ? ghostNumero(num, false) : ""}

  <div style="position:absolute;top:36px;left:44px;z-index:3;">${marca(false)}</div>

  <div style="position:absolute;left:0;right:0;bottom:0;z-index:2;padding:0 56px 130px 56px;">
    <style>strong{color:${BOLD_COR};font-weight:800;text-shadow:0 1px 8px rgba(0,0,0,0.4);}</style>
    <div style="font-size:${fs}px;line-height:1.15;color:${CREME};text-shadow:0 2px 16px rgba(0,0,0,0.7);${italic}letter-spacing:-0.01em;">
      ${linhas.map(l => `<p style="margin-bottom:12px;">${l}</p>`).join("")}
    </div>
  </div>

  ${mostraPag ? `<div style="position:absolute;bottom:38px;left:56px;z-index:3;color:rgba(242,232,220,0.55);">${ARRASTE}</div>` : ""}
  <div style="position:absolute;bottom:38px;right:56px;z-index:3;display:flex;align-items:center;gap:18px;">
    ${mostraPag ? paginacaoTextual(num, total, false) : ""}
    ${credito(false)}
  </div>
</div>
</body></html>`;
}

// ═══════════════════════════════════════════════════
// LAYOUT G: Fecho/CTA sobre fundo terra quente (sem foto)
// (estilo FreeMe último slide — bold âmbar + CTA discreto)
// ═══════════════════════════════════════════════════
function layoutFechoCta(opts: FullOpts): string {
  const h = opts.formato === "story" ? H_STORY : H_FEED;
  const textoOriginal = opts.texto;
  const temGotaToken = /\(gota\)/i.test(textoOriginal);
  // Remove o token para o cálculo do tamanho de fonte (a gota
  // visualmente ocupa espaço próprio).
  const textoSemToken = textoOriginal.replace(/\(gota\)/gi, "").trim();
  const textoComBold = parseBold(textoSemToken);
  const linhas = textoComBold.split(/\n/).map(l => l.trim()).filter(Boolean);
  const charCount = textoSemToken.replace(/\*\*/g, "").length;
  // Fecho/CTA é o slide-punch. Fonte grande, italic levemente
  // (estilo manifesto). Hierarquia: punch breve = 96px, médio = 76px.
  const fs = charCount < 40 ? 96 : charCount < 80 ? 76 : charCount < 140 ? 60 : charCount < 200 ? 48 : 40;

  const total = opts.totalSlides ?? 1;
  const num = opts.slideNum ?? total;
  const mostraPag = total > 1;

  // No brief, "(gota)" sinaliza que a gota deve aparecer como
  // selo visual neste slide. Quando o token está presente,
  // mostra-se em grande acima do texto (estilo capitular).
  // Quando não, é só fecho de palavra; um selo pequeno bastará.
  const gotaSize = temGotaToken ? 112 : 56;

  return `${base(W, h)}
<div style="position:relative;width:${W}px;height:${h}px;background:radial-gradient(ellipse at 25% 20%,#4a2f1b 0%,${BG_SLIDE} 55%,#170d07 100%);overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:60%;background:radial-gradient(ellipse at 50% 0%,rgba(235,174,74,0.14) 0%,transparent 70%);"></div>

  ${ghostNumero(num, false)}

  <div style="position:absolute;top:36px;left:44px;z-index:2;">${marca(false)}</div>

  <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 64px 150px 64px;text-align:center;">
    <style>strong{color:${BOLD_COR};font-weight:700;}</style>
    <div style="margin-bottom:44px;">${GOTA_INLINE(gotaSize)}</div>
    <div style="font-size:${fs}px;line-height:1.18;color:${CREME};font-style:italic;letter-spacing:-0.005em;">
      ${linhas.map(l => `<p style="margin-bottom:18px;">${l}</p>`).join("")}
    </div>
    <div style="margin-top:48px;font-family:Inter,sans-serif;font-size:13px;letter-spacing:0.32em;text-transform:uppercase;color:${AMBAR};">link na bio</div>
  </div>

  <div style="position:absolute;bottom:38px;right:56px;z-index:2;display:flex;align-items:center;gap:18px;">
    ${mostraPag ? paginacaoTextual(num, total, false) : ""}
    ${credito(false)}
  </div>
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
  layout?: "foto-topo" | "foto-lado" | "statement" | "cta" | "claro" | "foto-cheia" | "fecho-cta";
  slideNum?: number;
  totalSlides?: number;
  imagemUrl?: string;
};

type FullOpts = SlideOpts;

function escolherLayout(opts: SlideOpts): string {
  const layout = opts.layout ?? inferirLayout(opts);
  switch (layout) {
    case "foto-cheia": return layoutFotoCheia(opts);
    case "fecho-cta": return layoutFechoCta(opts);
    case "foto-topo": return layoutFotoTopo(opts);
    case "foto-lado": return layoutFotoLado(opts);
    case "statement": return layoutStatement(opts);
    case "cta": return layoutCta(opts);
    case "claro": return layoutClaro(opts);
    default: return layoutFotoCheia(opts);
  }
}

// Devolve só o HTML do slide, sem screenshot. Para pré-visualização
// em iframe no editor, sem precisar de Chromium.
export function buildSlideHtml(opts: SlideOpts): string {
  return escolherLayout(opts);
}

function inferirLayout(opts: SlideOpts): string {
  // Fecho/CTA: terra quente sem foto, texto + "link na bio" (estilo FreeMe)
  if (opts.modo === "cta") return "fecho-cta";

  const temImagem = !!opts.imagemUrl;

  // Capa com foto: foto cheia + texto em baixo, scrim suave (estilo FreeMe)
  // Capa sem foto: statement no centro
  if (opts.modo === "capa") {
    return temImagem ? "foto-cheia" : "statement";
  }

  // Slides internos: com foto vai foto-cheia (mais elegante e legível);
  // sem foto alterna claro/statement para criar ritmo visual.
  if (opts.modo === "conteudo") {
    if (temImagem) return "foto-cheia";
    return opts.slideNum && opts.slideNum % 2 === 0 ? "claro" : "statement";
  }

  return "foto-cheia";
}

export async function renderSlides(
  slides: SlideOpts[]
): Promise<{ name: string; buffer: Buffer }[]> {
  const { existsSync } = await import("node:fs");
  const browser = await chromium.launch({
    // Se o caminho local existir, usa-o (modo dev/Vercel custom).
    // Caso contrário, deixa o Playwright resolver (CI/GH Actions).
    executablePath: existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
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
  // Higiene em render-time: troca travessões longos (—) e en-dashes
  // (–) por vírgula. Regra de voz da Infonte. Aplica-se a tudo o
  // que vier da BD, mesmo conteúdos antigos gerados antes de a
  // sanitização entrar no pipeline.
  textoImagem = limparTravessoes(textoImagem);
  // Bold dinâmico: aplica KEYWORDS_BOLD[dia] aqui em render-time,
  // por cima do que já estiver na BD. Idempotente (não duplica
  // `**...**`). Garante que o preview do editor mostra os destaques
  // dourados sem precisar de re-correr o seed.
  textoImagem = aplicarBoldDinamico(textoImagem, dia);
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
    // Sem capa fake nem CTA hardcoded. Os slides são exactamente os
    // que estão no brief da Vivianne (ex: 5 para dia 1 MANIFESTO).
    // Primeiro vira "capa" (estilo capa/foto-cheia), último vira "cta"
    // (estilo CTA com gota), meio é "conteudo". Tudo o conteúdo vem
    // do brief, nada inventado.
    const total = numerados.length;
    const slides: SlideOpts[] = [];

    numerados.forEach((line, i) => {
      const slideN = i + 1;
      const modo: "capa" | "conteudo" | "cta" =
        slideN === 1 ? "capa" : slideN === total ? "cta" : "conteudo";
      const podeImagem = pool.length >= total || slideN % 2 !== 0;
      slides.push({
        texto: line.replace(/^\d+\.\s*/, ""),
        dia,
        tema,
        modo,
        formato: fmt,
        slideNum: slideN,
        totalSlides: total,
        imagemUrl: podeImagem ? pool[(slideN - 1) % Math.max(1, pool.length)] : undefined,
      });
    });

    return slides;
  }

  // Post único: 1 slide statement. As tardes da Infonte foram escritas
  // para ser um punch único; forçar 3 slides com capa-rótulo e CTA
  // repetido só dilui. Quem precisa de carrossel já tem slides
  // numerados na origem (markdown ou bold) e cai no branch de cima.
  return [{ texto: textoImagem.trim(), dia, tema, modo: "capa", formato: fmt, imagemUrl: imgPara(0) }];
}
