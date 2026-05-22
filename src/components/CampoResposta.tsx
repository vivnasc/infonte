"use client";

import { useEffect, useRef, useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/client";

type Estado = "calmo" | "a-guardar" | "guardado" | "erro";

export function CampoResposta({
  bloco_id,
  valor_inicial,
  somente_leitura,
}: {
  bloco_id: string;
  valor_inicial: string;
  somente_leitura?: boolean;
}) {
  const [valor, setValor] = useState(valor_inicial);
  const [estado, setEstado] = useState<Estado>("calmo");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function guardar(v: string) {
    setEstado("a-guardar");
    try {
      const r = await fetch("/api/respostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloco_id, valor: v }),
      });
      if (!r.ok) throw new Error(await r.text());
      setEstado("guardado");
      setTimeout(() => setEstado("calmo"), 1800);
    } catch {
      setEstado("erro");
    }
  }

  // Autosave ao sair do campo, ou um segundo depois de parar de escrever
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValor(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => guardar(v), 1200);
  }

  function onBlur() {
    if (timer.current) clearTimeout(timer.current);
    if (valor !== valor_inicial) guardar(valor);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="my-8">
      <textarea
        className="infonte-textarea"
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        disabled={somente_leitura}
        placeholder="escreve aqui, em silêncio. fica guardado para ti."
      />
      <div className="text-xs text-castanho/50 mt-1 h-4">
        {estado === "a-guardar" && "a guardar..."}
        {estado === "guardado" && "guardado"}
        {estado === "erro" && "não consegui guardar, tenta de novo."}
      </div>
    </div>
  );
}
