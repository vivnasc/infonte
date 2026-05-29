import { Biblioteca } from "@/components/admin/Biblioteca";

export default function BibliotecaPage() {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--texto-mudo)]">
        pool global
      </div>
      <h1 className="estudio-titulo text-3xl mt-1">biblioteca de imagens</h1>
      <p className="text-[var(--texto-suave)] text-sm mt-3 max-w-leitura">
        Tudo o que foi gerado ou carregado para o Storage da Infonte
        aparece aqui. As imagens nunca se perdem mesmo que percas a
        ligação ao post: podes reanexá-las a qualquer dia abaixo. Útil
        para reaproveitar trabalho semanas ou meses depois.
      </p>

      <div className="mt-8">
        <Biblioteca />
      </div>
    </div>
  );
}
