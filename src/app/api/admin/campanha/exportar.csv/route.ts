import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// CSV bulk para o Metricool.
//
// O Metricool aceita importação em massa via CSV/Excel. As colunas
// principais são:
//   date       (DD/MM/YYYY)
//   time       (HH:MM, 24h)
//   text       (texto da publicação)
//   link       (URL associada, opcional)
//   image      (URL da arte/vídeo, opcional)
//   networks   (Facebook;Instagram;Twitter;LinkedIn;TikTok;...)
//
// Há dois modos:
//   - default: uma linha por dia, todas as redes na coluna networks
//   - por-rede: uma linha por (dia × rede), útil quando o texto difere
//
// Para já geramos texto idêntico em todas as redes, com tagged hashtags.

type Post = {
  dia: number;
  semana: number;
  tema: string;
  legenda: string | null;
  pergunta: string | null;
  hashtags: string | null;
  link: string | null;
  imagem_url: string | null;
  redes: string[] | null;
  data_publicacao: string | null;
};

const NOME_REDE: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  youtube: "YouTube",
  pinterest: "Pinterest",
};

export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const url = new URL(request.url);
  const modo = url.searchParams.get("modo") === "por-rede" ? "por-rede" : "default";

  const sb = criarClienteAdmin();
  const { data, error } = await sb
    .from("campanha_posts")
    .select(
      "dia, semana, tema, legenda, pergunta, hashtags, link, imagem_url, redes, data_publicacao"
    )
    .order("dia", { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const linhas: string[][] = [];
  const cabecalho = ["date", "time", "text", "link", "image", "networks"];
  linhas.push(cabecalho);

  for (const p of (data ?? []) as Post[]) {
    const texto = composarTexto(p);
    const link = p.link ?? "";
    const imagem = p.imagem_url ?? "";
    const redes = (p.redes ?? ["instagram", "tiktok"]).map(
      (r) => NOME_REDE[r] ?? r
    );

    const { date, time } = formatarData(p.data_publicacao);

    if (modo === "por-rede") {
      for (const r of redes) {
        linhas.push([date, time, texto, link, imagem, r]);
      }
    } else {
      linhas.push([date, time, texto, link, imagem, redes.join(";")]);
    }
  }

  const csv = linhas.map((cols) => cols.map(escaparCSV).join(",")).join("\r\n");
  const nome = `infonte-campanha-30dias${modo === "por-rede" ? "-por-rede" : ""}.csv`;

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
  if (p.hashtags?.trim()) partes.push(p.hashtags.trim());
  return partes.join("\n\n");
}

function formatarData(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function escaparCSV(s: string): string {
  if (s == null) return "";
  const necessitaQuote = /[",\r\n]/.test(s);
  const limpo = s.replace(/"/g, '""');
  return necessitaQuote ? `"${limpo}"` : limpo;
}
