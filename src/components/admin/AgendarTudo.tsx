"use client";

import { useState } from "react";

// Permite agendar os 60 posts de uma vez a partir de uma data inicial.
// Manhã às 10h, tarde às 13h, 30 dias consecutivos.
export function AgendarTudo() {
  const [data, setData] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // sugestão: começa daqui a 2 dias
    return d.toISOString().slice(0, 10);
  });
  const [horaManha, setHoraManha] = useState("10:00");
  const [horaTarde, setHoraTarde] = useState("13:00");
  const [estado, setEstado] = useState<"calmo" | "a-correr" | "ok" | "erro">("calmo");
  const [resposta, setResposta] = useState<{ atualizados?: number; erro?: string } | null>(null);

  async function correr() {
    setEstado("a-correr");
    setResposta(null);
    try {
      const r = await fetch("/api/admin/campanha/agendar-tudo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataInicial: data, horaManha, horaTarde }),
      });
      const j = await r.json();
      if (!r.ok || j.erro) throw new Error(j.erro ?? `erro ${r.status}`);
      setResposta(j);
      setEstado("ok");
    } catch (e) {
      setResposta({ erro: e instanceof Error ? e.message : "erro" });
      setEstado("erro");
    }
  }

  return (
    <div className="estudio-card-elevado">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--oliva)] mb-3">
        agendar 60 posts automaticamente
      </div>
      <p className="text-xs text-[var(--texto-suave)] mb-3 max-w-leitura">
        Define o dia 1 e as horas. A app distribui os 30 dias consecutivos,
        manhã + tarde. Cada post fica em estado &quot;agendado&quot;. Idempotente:
        podes voltar a correr com outra data e sobrescreve.
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] mb-1">
            dia 1 (data)
          </span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-2 py-1.5 bg-black/30 border border-[var(--borda)] rounded text-sm text-[var(--texto)]"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] mb-1">
            hora manhã
          </span>
          <input
            type="time"
            value={horaManha}
            onChange={(e) => setHoraManha(e.target.value)}
            className="w-full px-2 py-1.5 bg-black/30 border border-[var(--borda)] rounded text-sm text-[var(--texto)]"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--texto-mudo)] mb-1">
            hora tarde
          </span>
          <input
            type="time"
            value={horaTarde}
            onChange={(e) => setHoraTarde(e.target.value)}
            className="w-full px-2 py-1.5 bg-black/30 border border-[var(--borda)] rounded text-sm text-[var(--texto)]"
          />
        </label>
      </div>
      <button
        onClick={correr}
        disabled={estado === "a-correr"}
        className="estudio-btn estudio-btn-primario disabled:opacity-50"
      >
        {estado === "a-correr"
          ? "a agendar..."
          : estado === "ok"
          ? `${resposta?.atualizados ?? 0} agendados ✓`
          : "agendar tudo agora"}
      </button>
      {estado === "erro" && resposta?.erro && (
        <p className="text-xs text-[var(--vermelho)] mt-2">{resposta.erro}</p>
      )}
    </div>
  );
}
