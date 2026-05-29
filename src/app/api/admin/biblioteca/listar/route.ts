import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "infonte-assets";

// Lista todas as imagens da Infonte em Supabase Storage, com URL
// pública, agrupadas por origem (replicate, MJ uploads, render HD).
// Não toca em campanha_posts: serve para reanexar manualmente.
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();

  type Item = {
    nome: string;
    path: string;
    url: string;
    tamanho: number | null;
    criadoEm: string | null;
    origem: "replicate" | "mj" | "hd" | "outro";
    diaInferido: number | null;
    slotInferido: "manha" | "tarde" | null;
  };

  function classificar(nome: string, prefix: string): {
    origem: Item["origem"];
    dia: number | null;
    slot: Item["slotInferido"];
  } {
    if (prefix.startsWith("infonte-campanha-hd/")) return { origem: "hd", dia: null, slot: null };
    const mReplicate = nome.match(/^dia-(\d{2})(-tarde)?-replicate\.png$/i);
    if (mReplicate) {
      return {
        origem: "replicate",
        dia: parseInt(mReplicate[1], 10),
        slot: mReplicate[2] ? "tarde" : "manha",
      };
    }
    const mMJ = nome.match(/^dia-(\d{2})(?:-(\d+))?\.(jpg|jpeg|png|webp)$/i);
    if (mMJ) {
      return {
        origem: "mj",
        dia: parseInt(mMJ[1], 10),
        slot: "manha",
      };
    }
    return { origem: "outro", dia: null, slot: null };
  }

  async function listarPrefix(prefix: string, profundidade = 0): Promise<Item[]> {
    const items: Item[] = [];
    const { data, error } = await sb.storage.from(BUCKET).list(prefix, {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return items;

    for (const obj of data ?? []) {
      const isFolder = obj.id == null && obj.metadata == null;
      const path = prefix ? `${prefix}/${obj.name}` : obj.name;
      if (isFolder) {
        if (profundidade < 2) {
          const sub = await listarPrefix(path, profundidade + 1);
          items.push(...sub);
        }
        continue;
      }
      // Só imagens
      if (!/\.(png|jpe?g|webp)$/i.test(obj.name)) continue;

      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      const meta = classificar(obj.name, prefix);
      items.push({
        nome: obj.name,
        path,
        url: pub.publicUrl,
        tamanho: (obj.metadata?.size as number | undefined) ?? null,
        criadoEm: obj.created_at ?? null,
        origem: meta.origem,
        diaInferido: meta.dia,
        slotInferido: meta.slot,
      });
    }
    return items;
  }

  const replicateMj = await listarPrefix("infonte-campanha");
  const hd = await listarPrefix("infonte-campanha-hd");
  const tudo = [...replicateMj, ...hd];

  return NextResponse.json({
    ok: true,
    total: tudo.length,
    porOrigem: {
      replicate: tudo.filter((i) => i.origem === "replicate").length,
      mj: tudo.filter((i) => i.origem === "mj").length,
      hd: tudo.filter((i) => i.origem === "hd").length,
      outro: tudo.filter((i) => i.origem === "outro").length,
    },
    itens: tudo,
  });
}
