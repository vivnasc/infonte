"use client";

import { useEffect, useState } from "react";

export function BotaoPaypal() {
  const [a, setA] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [desconto, setDesconto] = useState<string | null>(null);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("desconto");
    if (c) setDesconto(c.trim().toUpperCase());
  }, []);

  async function comprar() {
    setA(true);
    setErro(null);
    try {
      const r = await fetch("/api/paypal/criar-ordem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(desconto ? { desconto } : {}),
      });
      const json = await r.json();
      if (json.url_aprovacao) {
        window.location.href = json.url_aprovacao;
        return;
      }
      // Mensagem amigável se as variáveis PayPal não estão configuradas
      if (json.erro?.includes("PayPal") || json.erro?.includes("variáveis") || r.status === 500) {
        setErro(
          "O pagamento ainda não está disponível. Envia um email para ola@vivannedossantos.com para garantires o teu acesso."
        );
      } else {
        setErro(json.erro ?? "Não foi possível iniciar a compra agora. Tenta novamente.");
      }
    } catch {
      setErro("Erro de ligação. Verifica a tua internet e tenta novamente.");
    } finally {
      setA(false);
    }
  }

  return (
    <div>
      {desconto && (
        <p className="text-sm text-ocre-forte mb-3">
          Código <strong>{desconto}</strong> aplicado: 25% de desconto.
        </p>
      )}
      <button onClick={comprar} disabled={a} className="btn-ocre">
        {a ? "a abrir o PayPal..." : "abrir o percurso completo"}
      </button>
      {erro && (
        <p className="text-sm text-castanho/80 mt-3 max-w-sm mx-auto">
          {erro}
        </p>
      )}
    </div>
  );
}
