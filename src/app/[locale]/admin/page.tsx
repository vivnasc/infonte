import { Link } from "@/i18n/routing";

export default function AdminHome() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-castanho">administração</h1>
      <p className="font-serif text-terra-texto/80 mt-4 max-w-leitura">
        Aqui produzes e empacotas o conteúdo. Por agora, a campanha de 30 dias
        para o lançamento.
      </p>
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/campanha"
          className="block p-6 rounded-lg border border-castanho/20 hover:border-ocre transition-colors"
        >
          <div className="font-sans text-xs uppercase tracking-[0.25em] text-oliva">
            redes sociais
          </div>
          <div className="font-serif text-xl text-castanho mt-2">
            campanha 30 dias
          </div>
          <div className="text-sm text-castanho/70 mt-2">
            Editar legendas, agendar e exportar para o Metricool.
          </div>
        </Link>
      </div>
    </div>
  );
}
