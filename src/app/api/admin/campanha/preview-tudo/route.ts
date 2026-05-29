import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { parseTextoImagemToSlides } from "@/lib/render-slides";

export const runtime = "nodejs";
export const maxDuration = 30;

// Devolve, num único pedido, a estrutura dos slides para TODOS os
// posts (60: 30 manhã + 30 tarde). Permite ao cliente montar uma
// grelha com a campanha inteira sem ter de fazer 60 fetches.
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const { data: posts, error } = await sb
    .from("campanha_posts")
    .select("dia, slot, tema, semana, texto_imagem, formato, imagem_url, imagens, estado")
    .order("dia", { ascending: true })
    .order("slot", { ascending: true });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  type Saida = {
    dia: number;
    slot: string;
    semana: number;
    tema: string;
    estado: string;
    temTextoImagem: boolean;
    temImagem: boolean;
    slides: Array<{ idx: number; modo: string; temImagem: boolean }>;
  };

  const saida: Saida[] = [];
  for (const p of posts ?? []) {
    const slot = (p.slot ?? "manha") as string;
    if (!p.texto_imagem?.trim()) {
      saida.push({
        dia: p.dia,
        slot,
        semana: p.semana,
        tema: p.tema,
        estado: (p.estado as string) ?? "rascunho",
        temTextoImagem: false,
        temImagem: !!p.imagem_url || (p.imagens?.length ?? 0) > 0,
        slides: [],
      });
      continue;
    }
    const slides = parseTextoImagemToSlides(
      p.dia,
      p.tema,
      p.texto_imagem,
      p.formato,
      p.imagem_url,
      p.imagens,
    );
    saida.push({
      dia: p.dia,
      slot,
      semana: p.semana,
      tema: p.tema,
      estado: (p.estado as string) ?? "rascunho",
      temTextoImagem: true,
      temImagem: !!p.imagem_url || (p.imagens?.length ?? 0) > 0,
      slides: slides.map((s, i) => ({
        idx: i + 1,
        modo: s.modo,
        temImagem: !!s.imagemUrl,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    total: saida.length,
    totalSlides: saida.reduce((acc, p) => acc + p.slides.length, 0),
    posts: saida,
  });
}
