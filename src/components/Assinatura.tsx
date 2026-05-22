export function Assinatura({ valores }: { valores: string[] }) {
  return (
    <div className="mt-16 mb-4 text-center flex flex-col items-center gap-1">
      <span className="font-serif text-xl text-castanho">
        {valores[0] ?? "infonte"}
      </span>
      {valores.slice(1).map((v, i) => (
        <span
          key={i}
          className={
            i === 0
              ? "font-serif text-sm text-castanho/80"
              : "font-sans text-xs uppercase tracking-[0.2em] text-oliva mt-1"
          }
        >
          {v}
        </span>
      ))}
    </div>
  );
}
