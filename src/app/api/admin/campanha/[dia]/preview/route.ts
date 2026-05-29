import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { parseTextoImagemToSlides, buildSlideHtml } from "@/lib/render-slides";

export const runtime = "nodejs";

// GET /api/admin/campanha/[dia]/preview?slot=manha&slide=N
//   - sem slide: devolve JSON com { total, slides: [{ idx, modo, layout }] }
//   - com slide: devolve HTML directo (para iframe srcDoc)
export async function GET(
  request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";
  const slideQs = url.searchParams.get("slide");

  const sb = criarClienteAdmin();
  const { data: post } = await sb
    .from("campanha_posts")
    .select("dia, tema, texto_imagem, formato, imagem_url, imagens")
    .eq("dia", dia)
    .eq("slot", slot)
    .single();

  if (!post) return NextResponse.json({ erro: "post não encontrado" }, { status: 404 });
  if (!post.texto_imagem?.trim()) {
    return NextResponse.json({ erro: "sem texto_imagem" }, { status: 400 });
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
    return NextResponse.json({ erro: "sem slides" }, { status: 400 });
  }

  if (slideQs == null) {
    return NextResponse.json({
      ok: true,
      total: slides.length,
      slides: slides.map((s, i) => ({
        idx: i + 1,
        modo: s.modo,
        layout: s.layout,
        temImagem: !!s.imagemUrl,
      })),
    });
  }

  const idx = parseInt(slideQs, 10);
  if (!Number.isFinite(idx) || idx < 1 || idx > slides.length) {
    return NextResponse.json({ erro: "slide fora do intervalo" }, { status: 400 });
  }

  const html = buildSlideHtml(slides[idx - 1]);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // Permitir embed no editor mesmo origem.
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
