"use client";

import { useState } from "react";

export function BotaoConcluir({
  etapa,
  jaConcluida,
  abreSeguinteStr,
}: {
  etapa: number;
  jaConcluida: boolean;
  abreSeguinteStr: string | null;
}) {
  const [estado, setEstado] = useState<"calmo" | "a-enviar" | "concluida">(
    jaConcluida ? "concluida" : "calmo"
  );
  const [abreEm, setAbreEm] = useState<string | null>(abreSeguinteStr);
  const [erro, setErro] = useState<string | null>(null);

  async function concluir() {
    setEstado("a-enviar");
    setErro(null);
    try {
      const r = await fetch("/api/etapa/concluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa }),
      });
      const json = await r.json();
      if (!r.ok) {
        setErro(json.erro ?? "Erro ao concluir a etapa.");
        setEstado("calmo");
        return;
      }
      setEstado("concluida");
      if (json.abre_em) {
        setAbreEm(json.abre_em);
      }
    } catch {
      setErro("Erro de ligação. Tenta novamente.");
      setEstado("calmo");
    }
  }

  if (estado === "concluida") {
    return (
      <div className="text-center space-y-3">
        <p className="font-serif text-oliva text-lg">
          Etapa {etapa} concluída.
        </p>
        {etapa < 7 && abreEm && (
          <p className="font-serif text-terra-texto/80">
            A etapa {etapa + 1} abre em{" "}
            {new Date(abreEm).toLocaleString("pt-PT", {
              day: "2-digit",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        )}
        {etapa === 7 && (
          <p className="font-serif text-terra-texto/80">
            Completaste o percurso. As ferramentas são tuas, para a vida.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={concluir}
        disabled={estado === "a-enviar"}
        className="btn-ocre"
      >
        {estado === "a-enviar" ? "A concluir..." : `Concluir a etapa ${etapa}`}
      </button>
      {erro && (
        <p className="text-sm text-red-700 mt-3">{erro}</p>
      )}
    </div>
  );
}
