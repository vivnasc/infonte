import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const CHROME_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const OUT_DIR = join(process.cwd(), "mockups");
const WIDTH = 390;
const HEIGHT = 844;
const SCALE = 3; // 3x retina → 1170x2532

const CREME = "#F2E8DC";
const TERRA = "#2E1D12";
const CASTANHO = "#4A2F1B";
const OCRE = "#B8843D";
const OCRE_FORTE = "#9A6C2C";
const OLIVA = "#5C5C3E";
const TEXTO = "#1F1810";
const AMBAR = "#EBAE4A";
const AMBAR_CLARO = "#F4C56A";

const GOTA_SVG = `<svg width="20" height="20" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${OCRE}" stroke-width="15" stroke-linejoin="round"/>
  <circle cx="256" cy="338" r="32" fill="${OCRE}"/>
</svg>`;

const HEADER = `
<div style="display:flex;align-items:center;gap:10px;padding:16px 24px;">
  <div style="width:34px;height:34px;border-radius:50%;background:${TERRA};display:flex;align-items:center;justify-content:center;">
    <svg width="20" height="20" viewBox="0 0 512 512">
      <path d="M256 116 C198 218 166 282 166 334 A90 90 0 0 0 346 334 C346 282 314 218 256 116 Z" fill="none" stroke="${AMBAR}" stroke-width="28" stroke-linejoin="round"/>
      <circle cx="256" cy="338" r="38" fill="${AMBAR_CLARO}"/>
    </svg>
  </div>
  <span style="font-family:'EB Garamond',Georgia,serif;font-size:22px;color:${CASTANHO};">infonte</span>
</div>`;

const DIVIDER = `
<div style="display:flex;align-items:center;gap:10px;padding:16px 24px;">
  <span style="flex:1;height:1px;background:rgba(74,47,27,0.15);"></span>
  ${GOTA_SVG}
  <span style="flex:1;height:1px;background:rgba(74,47,27,0.15);"></span>
</div>`;

const SIGNATURE = `
<div style="text-align:center;padding:24px;">
  <div style="font-family:'EB Garamond',Georgia,serif;font-size:16px;color:${CASTANHO};">infonte</div>
  <div style="font-family:'EB Garamond',Georgia,serif;font-size:12px;color:rgba(74,47,27,0.7);margin-top:2px;">Vivianne dos Santos</div>
  <div style="font-family:Inter,system-ui,sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${OLIVA};margin-top:6px;">Sete Ecos</div>
</div>`;

function wrapScreen(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width:${WIDTH}px; height:${HEIGHT}px;
      background:${CREME};
      color:${TEXTO};
      font-family:'EB Garamond',Georgia,serif;
      -webkit-font-smoothing:antialiased;
      overflow:hidden;
    }
    .label { font-family:Inter,system-ui,sans-serif; font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:${OCRE_FORTE}; }
    .btn-ocre { display:block; background:${OCRE}; color:#fff; text-align:center; padding:14px 24px; border-radius:9999px; font-family:Inter,system-ui,sans-serif; font-size:14px; font-weight:500; letter-spacing:0.03em; }
    .btn-quiet { display:block; border:1.5px solid rgba(74,47,27,0.4); color:${CASTANHO}; text-align:center; padding:12px 20px; border-radius:9999px; font-family:Inter,system-ui,sans-serif; font-size:14px; font-weight:500; }
  </style>
</head>
<body>${content}</body>
</html>`;
}

const screens: { name: string; html: string }[] = [
  {
    name: "01-landing-hero",
    html: wrapScreen(`
      ${HEADER}
      <div style="padding:12px 24px 24px;">
        <p class="label" style="margin-bottom:20px;">Um percurso em sete etapas</p>
        <h1 style="font-size:28px;color:${CASTANHO};line-height:1.15;font-weight:500;">
          Fazes tanto. Começas tudo. E no fundo sabes que metade nem era teu.
        </h1>
        <p style="font-size:18px;color:${OCRE_FORTE};font-style:italic;margin-top:10px;">
          Pára de perseguir o que nunca foi teu.
        </p>
        <p style="font-size:14px;color:${TEXTO};line-height:1.7;margin-top:20px;">
          Entras com a agenda cheia e o vazio por baixo. Com talento a mais e clareza a menos. Sais a saber o que é teu, o que era emprestado, e o que herdaste sem escolher.
        </p>
        <div style="margin-top:24px;display:flex;flex-direction:column;gap:10px;">
          <div class="btn-ocre">Começar a etapa 1, grátis</div>
          <div class="btn-quiet">Conhecer a autora</div>
        </div>
        <p style="font-family:Inter,sans-serif;font-size:11px;color:${OLIVA};text-align:center;margin-top:12px;">
          A etapa 1 é gratuita. Não pedimos cartão.
        </p>
        ${DIVIDER}
        <p class="label" style="margin-bottom:10px;">Como funciona</p>
        <h2 style="font-size:20px;color:${CASTANHO};font-weight:500;margin-bottom:16px;">
          Cinco passos, do início ao fim.
        </h2>
      </div>
    `),
  },
  {
    name: "02-etapa-1",
    html: wrapScreen(`
      ${HEADER}
      <div style="padding:0 24px 24px;">
        <p class="label" style="margin-bottom:6px;">Etapa 1</p>
        <h1 style="font-size:24px;color:${CASTANHO};line-height:1.2;font-weight:500;">
          Antes de teres mais, tens de largar o que nem era teu.
        </h1>
        <div style="margin-top:20px;font-size:14px;line-height:1.75;color:${TEXTO};">
          <p>Tu não estás dispersa por falta de foco.</p>
          <p style="margin-top:12px;">Estás dispersa porque andas a perseguir coisas a mais, e a maioria delas nem são tuas. São o que te disseram que devias querer. O que viste alguém ter. O que parecia sucesso aos olhos dos outros.</p>
          <p style="margin-top:12px;">Antes de te ensinar a ter mais, tenho de te ensinar a largar. Não a largar os teus sonhos. A largar o que se fez passar por sonho teu e nunca foi.</p>
        </div>
        <div style="margin-top:24px;border:1px solid rgba(74,47,27,0.2);border-radius:10px;background:rgba(255,253,248,0.6);padding:14px;min-height:120px;">
          <p style="font-size:12px;color:rgba(74,47,27,0.35);font-style:italic;margin-bottom:8px;">Escreve aqui, em silêncio. Fica guardado para ti.</p>
          <p style="font-size:13px;line-height:1.7;color:${TEXTO};">O projecto do livro, meu.<br/>A app que vi no Instagram, emprestado.<br/>O negócio que a minha mãe queria ter, de outro.<br/>A marca de roupa, meu. O que me dá? Reconhecimento...</p>
        </div>
        <p style="font-family:Inter,sans-serif;font-size:10px;color:${OLIVA};margin-top:6px;">guardado</p>
      </div>
    `),
  },
  {
    name: "03-painel",
    html: wrapScreen(`
      ${HEADER}
      <div style="padding:0 24px 24px;">
        <h1 style="font-size:26px;color:${CASTANHO};font-weight:500;">Olá, Vivianne.</h1>
        <p style="font-size:13px;color:rgba(31,24,16,0.75);margin-top:6px;">O teu percurso. Cada etapa abre 3 dias depois da anterior.</p>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:8px;">
          ${[
            { n: 1, e: "Concluída", a: true, cor: OLIVA },
            { n: 2, e: "Aberta", a: true, cor: OCRE_FORTE },
            { n: 3, e: "Abre 28/06", a: false, cor: "" },
            { n: 4, e: "Fechada", a: false, cor: "" },
            { n: 5, e: "Fechada", a: false, cor: "" },
            { n: 6, e: "Fechada", a: false, cor: "" },
            { n: 7, e: "Fechada", a: false, cor: "" },
          ]
            .map(
              (et) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:10px;border:1px solid rgba(74,47,27,${et.a ? "0.2" : "0.1"});${et.a ? "" : "opacity:0.6;"}">
              <span style="font-size:15px;color:${et.a ? CASTANHO : "rgba(74,47,27,0.5)"};">Etapa ${et.n}</span>
              <span style="font-family:Inter,sans-serif;font-size:11px;color:${et.cor || "rgba(74,47,27,0.45)"};">${et.e}</span>
            </div>`
            )
            .join("")}
        </div>
        <p style="text-align:center;font-family:Inter,sans-serif;font-size:12px;color:rgba(74,47,27,0.45);margin-top:28px;">Sair</p>
      </div>
    `),
  },
  {
    name: "04-login",
    html: wrapScreen(`
      ${HEADER}
      <div style="padding:20px 24px;">
        <h1 style="font-size:26px;color:${CASTANHO};text-align:center;font-weight:500;">Entrar</h1>
        <p style="font-size:14px;color:${TEXTO};text-align:center;margin-top:8px;">Bem-vinda. Usa o teu email para entrar ou criar conta.</p>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:24px;">
          <div style="background:${CASTANHO};color:${CREME};padding:8px 16px;border-radius:9999px;font-family:Inter,sans-serif;font-size:13px;">Entrar</div>
          <div style="color:rgba(74,47,27,0.6);padding:8px 16px;border-radius:9999px;font-family:Inter,sans-serif;font-size:13px;">Criar conta</div>
        </div>
        <div style="margin-top:28px;display:flex;flex-direction:column;gap:16px;">
          <label style="display:block;">
            <span style="font-family:Inter,sans-serif;font-size:12px;color:rgba(74,47,27,0.7);display:block;margin-bottom:4px;">Email</span>
            <div style="width:100%;padding:10px 12px;border:1px solid rgba(74,47,27,0.25);border-radius:6px;background:rgba(255,255,255,0.5);font-size:14px;color:rgba(74,47,27,0.4);">tu@exemplo.com</div>
          </label>
          <label style="display:block;">
            <span style="font-family:Inter,sans-serif;font-size:12px;color:rgba(74,47,27,0.7);display:block;margin-bottom:4px;">Palavra-passe</span>
            <div style="width:100%;padding:10px 12px;border:1px solid rgba(74,47,27,0.25);border-radius:6px;background:rgba(255,255,255,0.5);font-size:14px;color:rgba(74,47,27,0.4);">pelo menos 8 caracteres</div>
          </label>
        </div>
        <div class="btn-ocre" style="margin-top:24px;">Entrar</div>
        <div style="display:flex;align-items:center;gap:10px;margin:20px 0;font-family:Inter,sans-serif;font-size:11px;color:rgba(74,47,27,0.4);">
          <span style="flex:1;height:1px;background:rgba(74,47,27,0.15);"></span>ou<span style="flex:1;height:1px;background:rgba(74,47,27,0.15);"></span>
        </div>
        <div class="btn-quiet" style="margin-bottom:8px;">Continuar com Google</div>
        <div class="btn-quiet">Continuar com Facebook</div>
      </div>
    `),
  },
  {
    name: "05-como-funciona",
    html: wrapScreen(`
      ${HEADER}
      <div style="padding:0 24px 24px;">
        <p class="label" style="text-align:center;margin-bottom:8px;">Como funciona</p>
        <h2 style="font-size:22px;color:${CASTANHO};text-align:center;font-weight:500;margin-bottom:24px;">
          Cinco passos, do início ao fim.
        </h2>
        ${[
          { n: "1", t: "Crias conta", d: "Só email e password. Sem cartão." },
          { n: "2", t: "Experimentas a etapa 1 (grátis)", d: "A primeira etapa é tua de borla." },
          { n: "3", t: "Compras o percurso", d: "Uma vez, via PayPal. Acesso vitalício." },
          { n: "4", t: "Uma etapa a cada 3 dias", d: "Cerca de 3 semanas no teu ritmo." },
          { n: "5", t: "Instalas a app", d: "PWA no teu telemóvel, sempre disponível." },
        ]
          .map(
            (p) => `
          <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:18px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${OCRE};color:#fff;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;font-size:13px;font-weight:600;flex-shrink:0;">${p.n}</div>
            <div>
              <div style="font-size:15px;color:${CASTANHO};font-weight:500;">${p.t}</div>
              <div style="font-size:13px;color:${TEXTO};margin-top:2px;line-height:1.5;">${p.d}</div>
            </div>
          </div>`
          )
          .join("")}
        ${DIVIDER}
        ${SIGNATURE}
      </div>
    `),
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  for (const screen of screens) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.setContent(screen.html, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const buf = await page.screenshot({
      type: "png",
      scale: "device",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    // Also generate at 3x scale
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    const ctx = browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: SCALE,
    });
    const hiPage = await (await ctx).newPage();
    await hiPage.setContent(screen.html, { waitUntil: "networkidle" });
    await hiPage.waitForTimeout(500);
    const hiBuf = await hiPage.screenshot({ type: "png" });

    const path1x = join(OUT_DIR, `${screen.name}.png`);
    const path3x = join(OUT_DIR, `${screen.name}@3x.png`);
    await writeFile(path1x, buf);
    await writeFile(path3x, hiBuf);
    console.log(`${screen.name}: ${path1x} (1x) + ${path3x} (3x)`);

    await hiPage.close();
    await (await ctx).close();
    await page.close();
  }

  await browser.close();
  console.log(`\nGerados ${screens.length} mockups em ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
