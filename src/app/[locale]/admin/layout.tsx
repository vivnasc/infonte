import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { Link } from "@/i18n/routing";
import "./admin.css";

const NAV = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/campanha", label: "Campanha 30 dias" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await exigirAdmin();
  if (!admin) redirect("/entrar?proximo=/admin");

  return (
    <div className="estudio">
      <div className="flex min-h-screen">
        <aside className="estudio-sidebar w-60 shrink-0 hidden md:flex flex-col">
          <div className="p-5">
            <Link href="/admin" className="block">
              <div className="estudio-marca font-serif text-lg">
                infonte<span className="text-[var(--texto-suave)]"> · estúdio</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--texto-mudo)] mt-1">
                da sete ecos
              </div>
            </Link>
          </div>

          <nav className="estudio-nav px-3 flex-1 space-y-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-[var(--borda)] text-[11px] text-[var(--texto-mudo)]">
            <div className="truncate">{admin.email}</div>
            <form action="/auth/sair" method="post" className="mt-2">
              <button
                type="submit"
                className="text-[11px] text-[var(--texto-suave)] hover:text-[var(--ambar)]"
              >
                sair
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-6 sm:px-10 py-8 max-w-6xl">
          <nav className="md:hidden flex gap-3 text-xs uppercase tracking-[0.2em] text-[var(--texto-suave)] mb-6">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[var(--ambar)]">
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
