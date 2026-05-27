import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const dia = formData.get("dia") as string | null;
  const indice = formData.get("indice") as string | null;

  if (!file || !dia) {
    return NextResponse.json({ erro: "ficheiro e dia obrigatórios" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ erro: "só aceita imagens" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ erro: "máximo 10MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const suffix = indice && indice !== "0" ? `-${indice}` : "";
  const path = `infonte-campanha/dia-${dia.padStart(2, "0")}${suffix}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const sb = criarClienteAdmin();

  // Cria o bucket se não existir (ignora erro se já existe)
  await sb.storage.createBucket("infonte-assets", {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  const { error: uploadError } = await sb.storage
    .from("infonte-assets")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { erro: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = sb.storage
    .from("infonte-assets")
    .getPublicUrl(path);

  const url = urlData.publicUrl;

  return NextResponse.json({ ok: true, url });
}
