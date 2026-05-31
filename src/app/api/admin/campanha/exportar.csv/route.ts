import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;
// Sem cache: cada download lê result.json mais recente da Storage.
// Sem isto, o Next 15 podia cachear a resposta e devolver URLs antigos
// mesmo depois de um novo render ter terminado.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// CSV bulk para Metricool. Cabeçalho oficial 2026 (93 colunas).
// Cada linha = 1 post (manhã ou tarde). Picture Url 1..10 vêm dos
// PNGs HD renderizados via Playwright (carregados de result.json
// no bucket infonte-assets/infonte-campanha-hd/<jobId>/).

const HEADER = [
  "Text",
  "Date",
  "Time",
  "Draft",
  "Facebook",
  "Twitter/X",
  "LinkedIn",
  "GBP",
  "Instagram",
  "Pinterest",
  "TikTok",
  "Youtube",
  "Threads",
  "Bluesky",
  "Picture Url 1",
  "Picture Url 2",
  "Picture Url 3",
  "Picture Url 4",
  "Picture Url 5",
  "Picture Url 6",
  "Picture Url 7",
  "Picture Url 8",
  "Picture Url 9",
  "Picture Url 10",
  "Alt text picture 1",
  "Alt text picture 2",
  "Alt text picture 3",
  "Alt text picture 4",
  "Alt text picture 5",
  "Alt text picture 6",
  "Alt text picture 7",
  "Alt text picture 8",
  "Alt text picture 9",
  "Alt text picture 10",
  "Document title",
  "Shortener",
  "Video Thumbnail Url",
  "Video Cover Frame",
  "Twitter/X Can reply",
  "Twitter/X Type",
  "Twitter/X Poll Duration minutes",
  "Twitter/X Poll Option 1",
  "Twitter/X Poll Option 2",
  "Twitter/X Poll Option 3",
  "Twitter/X Poll Option 4",
  "Pinterest Board",
  "Pinterest Pin Title",
  "Pinterest Pin Link",
  "Pinterest Pin New Format",
  "Instagram Post Type",
  "Instagram Show Reel On Feed",
  "Youtube Video Title",
  "Youtube Video Type",
  "Youtube Video Privacy",
  "Youtube video for kids",
  "Youtube Video Category",
  "Youtube Video Tags",
  "Youtube playlist",
  "GBP Post Type",
  "Facebook Post Type",
  "Facebook Title",
  "First Comment Text",
  "TikTok Title",
  "TikTok disable comments",
  "TikTok disable duet",
  "TikTok disable stitch",
  "TikTok Post Privacy",
  "TikTok Branded Content",
  "TikTok Your Brand",
  "TikTok Auto Add Music",
  "TikTok Photo Cover Index",
  "TikTok musicId",
  "TikTok music title",
  "TikTok music author",
  "TikTok music previewUrl",
  "TikTok music thumbnailUrl",
  "TikTok music soundVolume",
  "TikTok music originalVolume",
  "TikTok music startMillis",
  "TikTok music endMillis",
  "TikTok is AI generated content",
  "LinkedIn Type",
  "LinkedIn Poll Question",
  "LinkedIn Poll Option 1",
  "LinkedIn Poll Option 2",
  "LinkedIn Poll Option 3",
  "LinkedIn Poll Option 4",
  "LinkedIn Poll Duration",
  "LinkedIn Show link preview",
  "LinkedIn Images as Carousel",
  "Threads Reply Control",
  "Threads Is Spoiler",
  "Threads Post Type",
];

// Mapa rede DB → coluna no cabeçalho Metricool.
const COL_REDE: Record<string, string> = {
  facebook: "Facebook",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  pinterest: "Pinterest",
  tiktok: "TikTok",
  youtube: "Youtube",
  threads: "Threads",
  bluesky: "Bluesky",
};

type Post = {
  dia: number;
  semana: number;
  tema: string;
  legenda: string | null;
  pergunta: string | null;
  hashtags: string | null;
  link: string | null;
  redes: string[] | null;
  data_publicacao: string | null;
  slot: string | null;
  formato: string | null;
};

async function carregarRenders(): Promise<Map<string, string[]>> {
  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";
  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  const renders = new Map<string, string[]>();
  for (const job of jobs ?? []) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text());
      const slot = (j.slot as string) ?? "manha";
      const dias = (j.dias ?? {}) as Record<string, { urls?: string[] }>;
      for (const [diaStr, r] of Object.entries(dias)) {
        const dia = parseInt(diaStr, 10);
        const key = `${dia}-${slot}`;
        if (renders.has(key)) continue;
        const urls = r?.urls;
        if (Array.isArray(urls) && urls.length > 0) renders.set(key, urls);
      }
    } catch {
      // ignora result.json inválido
    }
  }
  return renders;
}

export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  // ?dias=29,30 → exporta só esses dias (útil para re-importar
  // apenas os que falharam, sem duplicar os 41 já agendados).
  const url = new URL(request.url);
  const diasParam = url.searchParams.get("dias");
  const diasFiltro = diasParam
    ? new Set(
        diasParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => Number.isFinite(n))
      )
    : null;

  // ?falhados=1 → exporta só as 22 linhas (dia,slot) que falharam
  // no último import do Metricool. Mesma lista do BotaoRenderFalhados.
  // Útil para re-importar sem duplicar os 43 já agendados.
  const falhadosParam = url.searchParams.get("falhados");
  const DIAS_MANHA_FALHADOS = [3, 8, 11, 13, 14, 19, 20, 29, 30];
  const DIAS_TARDE_FALHADOS = [5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30];
  const filtroFalhados = falhadosParam
    ? new Set<string>([
        ...DIAS_MANHA_FALHADOS.map((d) => `${d}-manha`),
        ...DIAS_TARDE_FALHADOS.map((d) => `${d}-tarde`),
      ])
    : null;

  // ?lista=3-manha,5-tarde,8-manha → exporta exactamente esses
  // (dia,slot). Permite re-importar só os que falharam na última
  // tentativa sem trazer duplicados dos já agendados.
  const listaParam = url.searchParams.get("lista");
  const filtroLista = listaParam
    ? new Set<string>(
        listaParam
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => /^\d+-(manha|tarde)$/.test(s))
      )
    : null;

  const sb = criarClienteAdmin();
  const { data, error } = await sb
    .from("campanha_posts")
    .select(
      "dia, semana, tema, legenda, pergunta, hashtags, link, redes, data_publicacao, slot, formato"
    )
    .order("dia", { ascending: true })
    .order("slot", { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const renders = await carregarRenders();
  const linhas: string[][] = [HEADER];

  // Índice por nome de coluna para preencher por chave sem erros de posição.
  const idx = new Map(HEADER.map((h, i) => [h, i]));
  const set = (row: string[], coluna: string, valor: string) => {
    const i = idx.get(coluna);
    if (i !== undefined) row[i] = valor;
  };

  for (const p of (data ?? []) as Post[]) {
    if (diasFiltro && !diasFiltro.has(p.dia)) continue;
    if (filtroFalhados && !filtroFalhados.has(`${p.dia}-${p.slot ?? "manha"}`)) continue;
    if (filtroLista && !filtroLista.has(`${p.dia}-${p.slot ?? "manha"}`)) continue;
    const row = new Array(HEADER.length).fill("");

    set(row, "Text", composarTexto(p));
    const { date, time } = formatarData(p.data_publicacao, p.slot);
    set(row, "Date", date);
    set(row, "Time", time);
    // Draft fica vazio (post agendado).

    const redes = p.redes ?? ["instagram", "tiktok"];
    for (const r of redes) {
      const col = COL_REDE[r];
      if (col) set(row, col, "yes");
    }

    const slot = p.slot ?? "manha";
    const urls = renders.get(`${p.dia}-${slot}`) ?? [];
    for (let i = 0; i < Math.min(urls.length, 10); i++) {
      set(row, `Picture Url ${i + 1}`, urls[i]);
      set(row, `Alt text picture ${i + 1}`, p.tema ?? "");
    }

    // Instagram Post Type: Carousel se múltiplas imagens, senão vazio.
    if (redes.includes("instagram") && urls.length > 1) {
      set(row, "Instagram Post Type", "Carousel");
    }
    // LinkedIn carousel se múltiplas imagens.
    if (redes.includes("linkedin") && urls.length > 1) {
      set(row, "LinkedIn Images as Carousel", "yes");
    }
    // TikTok: tem que indicar quem pode ver, senão o auto-publish falha.
    if (redes.includes("tiktok")) {
      set(row, "TikTok Post Privacy", "PUBLIC_TO_EVERYONE");
    }

    linhas.push(row);
  }

  const csv = linhas.map((cols) => cols.map(escaparCSV).join(",")).join("\r\n");
  const sufixo = filtroLista
    ? `-lista-${filtroLista.size}`
    : filtroFalhados
    ? "-falhados"
    : diasFiltro
    ? `-dias-${[...diasFiltro].sort((a, b) => a - b).join("-")}`
    : "";
  const nome = `infonte-campanha-metricool${sufixo}.csv`;

  return new NextResponse("﻿" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}

function composarTexto(p: Post): string {
  const partes: string[] = [];
  if (p.legenda?.trim()) partes.push(p.legenda.trim());
  if (p.pergunta?.trim()) partes.push("Pergunta: " + p.pergunta.trim());
  if (p.link?.trim()) partes.push(p.link.trim());

  const tag = (process.env.CAPTION_AUTHOR_TAG ?? "").trim();
  const baseAteAqui = partes.join("\n\n");
  if (tag && !baseAteAqui.toLowerCase().includes(tag.toLowerCase())) {
    partes.push(tag);
  }

  if (p.hashtags?.trim()) partes.push(p.hashtags.trim());
  return partes.join("\n\n");
}

function formatarData(iso: string | null, slot?: string | null): { date: string; time: string } {
  // Metricool: Date = YYYY-MM-DD, Time = HH:MM:SS.
  // Supabase devolve TIMESTAMPTZ sempre em UTC ("2026-06-01T08:00:00Z"
  // mesmo que tenha sido guardado como 10:00+02:00). Aplicamos o offset
  // de Maputo de volta para repor 10:00 / 13:00.
  const horaSlot = slot === "tarde" ? "13:00:00" : "10:00:00";
  if (!iso) return { date: "", time: horaSlot };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: horaSlot };
  const offsetMin = 2 * 60; // Maputo (CAT) +02:00 todo o ano
  const maputo = new Date(d.getTime() + offsetMin * 60 * 1000);
  const iso2 = maputo.toISOString();
  return {
    date: iso2.slice(0, 10),
    time: iso2.slice(11, 19),
  };
}

function escaparCSV(s: string): string {
  if (s == null) return "";
  const necessitaQuote = /[",\r\n]/.test(s);
  const limpo = s.replace(/"/g, '""');
  return necessitaQuote ? `"${limpo}"` : limpo;
}
