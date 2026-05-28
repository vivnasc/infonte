import { notFound } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { EditorPost } from "@/components/admin/EditorPost";
import { Link } from "@/i18n/routing";

export default async function EditarPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ dia: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { dia: diaStr } = await params;
  const sp = await searchParams;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) notFound();

  const supabase = criarClienteAdmin();

  // Carregar todos os posts deste dia (manhã e/ou tarde)
  const { data: posts } = await supabase
    .from("campanha_posts")
    .select("*")
    .eq("dia", dia)
    .order("slot", { ascending: true });

  if (!posts || posts.length === 0) notFound();

  const slotAtivo = sp.slot ?? "manha";
  const post = posts.find((p) => p.slot === slotAtivo) ?? posts[0];
  const temDois = posts.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/campanha" className="text-sm text-castanho/60 hover:text-ocre">
            voltar à lista
          </Link>
          <h1 className="font-serif text-3xl text-castanho mt-2">
            dia {post.dia}, {post.tema}
          </h1>
          <p className="text-sm text-oliva mt-1">
            semana {post.semana} · {post.formato ?? "sem formato"}
            {post.slot === "tarde" ? " · 13h emocional" : " · 10h"}
          </p>
        </div>
      </div>

      {temDois && (
        <div className="mt-4 flex gap-2">
          {posts.map((p) => (
            <Link
              key={p.slot}
              href={`/admin/campanha/${dia}?slot=${p.slot ?? "manha"}`}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                (p.slot ?? "manha") === (post.slot ?? "manha")
                  ? "border-ocre bg-ocre/10 text-castanho"
                  : "border-castanho/20 text-castanho/60 hover:border-castanho/40"
              }`}
            >
              {p.slot === "tarde" ? "13h emocional" : "10h principal"}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <EditorPost post={post} />
      </div>
    </div>
  );
}
