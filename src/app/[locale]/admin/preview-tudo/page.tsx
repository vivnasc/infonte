import { PreviewTudo } from "@/components/admin/PreviewTudo";

export default function PreviewTudoPage() {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        compilação visual
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">pré-visualizar a campanha inteira</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-3 max-w-leitura">
        Cada slide de cada dia renderizado em pequeno. Não é HD ainda, é
        o HTML que vai virar PNG quando lançares o render. Permite-te
        ver tudo num ecrã antes de gastar minutos do GitHub Actions ou
        publicar no Metricool.
      </p>

      <div className="mt-8">
        <PreviewTudo />
      </div>
    </div>
  );
}
