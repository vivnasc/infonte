import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { EditorPost } from "@/components/admin/EditorPost";
import { Link } from "@/i18n/routing";

export default async function EditarPostPage({
  params,
}: {
  params: Promise<{ dia: string }>;
}) {
  const { dia: diaStr } = await params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) notFound();

  const supabase = await criarClienteServidor();
  const { data: post } = await supabase
    .from("campanha_posts")
    .select("*")
    .eq("dia", dia)
    .single();

  if (!post) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/campanha" className="text-sm text-castanho/60 hover:text-ocre">
            ← voltar à lista
          </Link>
          <h1 className="font-serif text-3xl text-castanho mt-2">
            dia {post.dia}, {post.tema}
          </h1>
          <p className="text-sm text-oliva mt-1">
            semana {post.semana} · {post.formato ?? "sem formato"}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <EditorPost post={post} />
      </div>
    </div>
  );
}
