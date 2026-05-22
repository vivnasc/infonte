import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { Link } from "@/i18n/routing";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/entrar?proximo=/admin");

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-24">
      <nav className="flex flex-wrap gap-4 items-center justify-between border-b border-castanho/15 pb-4 mb-10">
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
            admin
          </span>
          <Link
            href="/admin/campanha"
            className="font-serif text-castanho hover:text-ocre"
          >
            campanha 30 dias
          </Link>
        </div>
        <div className="text-xs text-castanho/60">
          {admin.nome ?? admin.email}
        </div>
      </nav>
      {children}
    </div>
  );
}
