import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { renderSlides, parseTextoImagemToSlides } from "@/lib/render-slides";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }

  const sb = criarClienteAdmin();
  const { data: post, error } = await sb
    .from("campanha_posts")
    .select("dia, tema, texto_imagem, formato, imagem_url, imagens")
    .eq("dia", dia)
    .single();

  if (error || !post) {
    return NextResponse.json({ erro: "post não encontrado" }, { status: 404 });
  }

  if (!post.texto_imagem?.trim()) {
    return NextResponse.json(
      { erro: "este post não tem texto de imagem" },
      { status: 400 }
    );
  }

  const slides = parseTextoImagemToSlides(
    post.dia,
    post.tema,
    post.texto_imagem,
    post.formato,
    post.imagem_url,
    post.imagens,
  );

  if (slides.length === 0) {
    return NextResponse.json({ erro: "sem slides para gerar" }, { status: 400 });
  }

  const rendered = await renderSlides(slides);

  // Devolver a primeira imagem como PNG (para posts únicos)
  // ou todas num JSON com base64 (para carrosséis)
  if (rendered.length === 1) {
    return new NextResponse(new Uint8Array(rendered[0].buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="infonte-dia-${dia}.png"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Carrossel: devolver ZIP ou JSON com base64
  const imagens = rendered.map((r) => ({
    nome: r.name,
    base64: r.buffer.toString("base64"),
    tipo: "image/png",
  }));

  return NextResponse.json({
    ok: true,
    dia,
    total: imagens.length,
    imagens,
  });
}
