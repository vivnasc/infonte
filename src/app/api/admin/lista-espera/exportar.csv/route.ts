import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (v: string | null | undefined) =>
  `"${(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) {
    return new Response("acesso negado", { status: 403 });
  }

  const sb = criarClienteAdmin();
  const { data } = await sb
    .from("lista_espera")
    .select("nome, email, codigo_desconto, fonte, criado_em, convertido_em")
    .order("criado_em", { ascending: false });

  const linhas = data ?? [];
  const header = ["nome", "email", "codigo", "fonte", "criado_em", "convertida"].join(",");
  const corpo = linhas
    .map((l) =>
      [
        esc(l.nome),
        esc(l.email),
        esc(l.codigo_desconto ?? ""),
        esc(l.fonte ?? "direto"),
        esc(l.criado_em ?? ""),
        esc(l.convertido_em ? "sim" : "nao"),
      ].join(",")
    )
    .join("\n");
  const csv = `${header}\n${corpo}\n`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="infonte-lista-espera.csv"',
    },
  });
}
