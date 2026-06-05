"use client";

import { useState } from "react";

type Sucesso = { jaEstava: boolean; codigoDesconto: string; emailPendente: boolean };

export function FormularioListaEspera({ fonte }: { fonte: string | null }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [a, setA] = useState(false);
  const [sucesso, setSucesso] = useState<Sucesso | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setA(true);
    try {
      const r = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome, email, fonte }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        setErro(json.erro ?? "Algo correu mal, tenta de novo.");
        return;
      }
      setSucesso({
        jaEstava: json.jaEstava,
        codigoDesconto: json.codigoDesconto,
        emailPendente: json.emailPendente,
      });
    } catch {
      setErro("Erro de ligação. Verifica a tua internet e tenta de novo.");
    } finally {
      setA(false);
    }
  }

  if (sucesso) {
    return (
      <div className="max-w-sm mx-auto border border-ocre/40 rounded-2xl p-8 bg-creme/70">
        {sucesso.jaEstava ? (
          <p className="font-serif text-lg text-castanho">
            Já estás na lista, obrigada.
          </p>
        ) : (
          <>
            <p className="font-serif text-lg text-castanho">
              Apontada. Email enviado.
            </p>
            <p className="text-sm text-terra-texto mt-4">
              O teu código de acesso antecipado:
            </p>
            <p className="font-serif text-xl text-ocre-forte mt-2 tracking-wide">
              {sucesso.codigoDesconto}
            </p>
            {sucesso.emailPendente && (
              <p className="text-xs text-oliva mt-3">
                (O email pode demorar um pouco a chegar. O teu lugar está
                garantido.)
              </p>
            )}
          </>
        )}
        <p className="text-xs text-oliva mt-5">
          infonte abre 1 de Julho. Avisamos-te antes de todas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submeter} className="max-w-sm mx-auto space-y-4 text-left">
      <label className="block">
        <span className="block text-sm text-castanho/80 mb-1">Nome</span>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-castanho/25 bg-white/60 focus:border-ocre focus:outline-none"
          placeholder="o teu primeiro nome"
        />
      </label>
      <label className="block">
        <span className="block text-sm text-castanho/80 mb-1">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-castanho/25 bg-white/60 focus:border-ocre focus:outline-none"
          placeholder="tu@exemplo.com"
        />
      </label>

      {erro && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={a}
        className="btn-ocre w-full disabled:opacity-60"
      >
        {a ? "A apontar..." : "Entrar na lista de espera"}
      </button>
      <p className="text-xs text-oliva text-center">
        Só usamos o teu email para o aviso do lançamento. Sem ruído.
      </p>
    </form>
  );
}
