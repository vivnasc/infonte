"use client";

// Placeholder, a Fase 6 substitui pelo PayPal JS SDK e botão real.
import { useState } from "react";

export function BotaoPaypal() {
  const [a, setA] = useState(false);
  async function comprar() {
    setA(true);
    try {
      const r = await fetch("/api/paypal/criar-ordem", { method: "POST" });
      const json = await r.json();
      if (json.url_aprovacao) {
        window.location.href = json.url_aprovacao;
        return;
      }
      alert(json.erro ?? "Não foi possível iniciar a compra agora.");
    } catch (e) {
      alert("Erro a iniciar a compra.");
    } finally {
      setA(false);
    }
  }
  return (
    <button onClick={comprar} disabled={a} className="btn-ocre">
      {a ? "a abrir o PayPal..." : "abrir o percurso completo"}
    </button>
  );
}
