import Image from "next/image";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <Image
        src="/gota.svg"
        alt=""
        width={48}
        height={48}
        className="opacity-60 mb-8"
      />
      <h1 className="font-serif text-4xl md:text-5xl text-castanho">
        Esta página não existe.
      </h1>
      <p className="font-serif text-lg text-terra-texto mt-6 max-w-md leading-relaxed">
        Talvez tenhas seguido um caminho que não era teu. Acontece. O
        importante é saber voltar.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <Link href="/" className="btn-ocre">
          Voltar ao início
        </Link>
        <Link href="/sobre" className="btn-quieto">
          Conhecer a autora
        </Link>
      </div>
    </div>
  );
}
