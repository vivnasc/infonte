"use client";

import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/client";

type Modo = "entrar" | "registar";

export function FormularioEntrar({
  erro,
  mensagem,
}: {
  erro?: string;
  mensagem?: string;
}) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [a, setA] = useState(false);
  const [msg, setMsg] = useState<string | null>(mensagem ?? null);
  const [err, setErr] = useState<string | null>(erro ?? null);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setA(true);
    const supabase = criarClienteBrowser();
    try {
      if (modo === "entrar") {
        // Bypass de admin via env vars (ADMIN_EMAIL / ADMIN_PASSWORD na
        // Vercel). Como o projeto Supabase é partilhado, não criamos
        // conta lá só para administrar a Infonte.
        const r = await fetch("/api/admin/entrar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (r.ok) {
          window.location.href = "/admin";
          return;
        }
      }

      if (modo === "registar") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome } },
        });
        if (error) throw error;
        // Tenta entrar de imediato (caso confirmação esteja desligada)
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!e2) {
          window.location.href = "/painel";
          return;
        }
        setMsg(
          "Conta criada. Se a confirmação de email estiver ativa, verifica a caixa de entrada."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/painel";
        return;
      }
    } catch (e: unknown) {
      const m =
        e instanceof Error ? e.message : "Algo correu mal, tenta de novo.";
      setErr(traduzirErro(m));
    } finally {
      setA(false);
    }
  }

  async function entrarComProvedor(provedor: "google" | "facebook") {
    setErr(null);
    setA(true);
    const supabase = criarClienteBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provedor,
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?proximo=/painel`
            : undefined,
      },
    });
    if (error) {
      setErr(traduzirErro(error.message));
      setA(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-2 justify-center mb-6">
        <button
          onClick={() => setModo("entrar")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            modo === "entrar"
              ? "bg-castanho text-creme"
              : "text-castanho/70 hover:text-castanho"
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => setModo("registar")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            modo === "registar"
              ? "bg-castanho text-creme"
              : "text-castanho/70 hover:text-castanho"
          }`}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={submeter} className="space-y-4">
        {modo === "registar" && (
          <label className="block">
            <span className="block text-sm text-castanho/80 mb-1">Nome</span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-castanho/25 bg-white/60 focus:border-ocre focus:outline-none"
              placeholder="o teu primeiro nome"
            />
          </label>
        )}
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
        <label className="block">
          <span className="block text-sm text-castanho/80 mb-1">
            Palavra-passe
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-castanho/25 bg-white/60 focus:border-ocre focus:outline-none"
            placeholder="pelo menos 8 caracteres"
          />
        </label>

        {err && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </p>
        )}
        {msg && (
          <p className="text-sm text-castanho bg-creme border border-castanho/20 rounded px-3 py-2">
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={a}
          className="btn-ocre w-full disabled:opacity-60"
        >
          {a ? "A processar..." : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-castanho/50">
        <span className="flex-1 border-t border-castanho/15" />
        ou
        <span className="flex-1 border-t border-castanho/15" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => entrarComProvedor("google")}
          disabled={a}
          className="btn-quieto w-full disabled:opacity-60"
        >
          Continuar com Google
        </button>
        <button
          onClick={() => entrarComProvedor("facebook")}
          disabled={a}
          className="btn-quieto w-full disabled:opacity-60"
        >
          Continuar com Facebook
        </button>
        <p className="text-xs text-oliva text-center mt-2">
          (Google e Facebook ficam ativos assim que os provedores forem
          configurados no Supabase.)
        </p>
      </div>
    </div>
  );
}

function traduzirErro(m: string): string {
  const lower = m.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email ou palavra-passe incorretos.";
  }
  if (lower.includes("email not confirmed")) {
    return "O email ainda não foi confirmado. Verifica a tua caixa de entrada.";
  }
  if (lower.includes("user already registered")) {
    return "Já existe uma conta com este email. Escolhe entrar.";
  }
  if (lower.includes("provider is not enabled")) {
    return "Este provedor ainda não está ligado. Por agora, usa email.";
  }
  return m;
}
