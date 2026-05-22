"use client";

import { useState } from "react";

type Post = {
  id: string;
  dia: number;
  semana: number;
  tema: string;
  formato: string | null;
  texto_imagem: string | null;
  legenda: string | null;
  pergunta: string | null;
  hashtags: string | null;
  link: string | null;
  imagem_url: string | null;
  redes: string[] | null;
  data_publicacao: string | null;
  estado: string | null;
  notas: string | null;
};

const REDES_DISPONIVEIS = [
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "twitter",
  "youtube",
  "pinterest",
];

const HASHTAGS_SUGERIDAS =
  "#clareza #foco #bastarse #infonte #desenvolvimentopessoal #mulheres #propósito #mentefocada";

export function EditorPost({ post }: { post: Post }) {
  const [form, setForm] = useState({
    tema: post.tema,
    formato: post.formato ?? "",
    texto_imagem: post.texto_imagem ?? "",
    legenda: post.legenda ?? "",
    pergunta: post.pergunta ?? "",
    hashtags: post.hashtags ?? "",
    link: post.link ?? "",
    imagem_url: post.imagem_url ?? "",
    redes: post.redes ?? ["instagram", "tiktok"],
    data_publicacao: post.data_publicacao
      ? toLocalDatetime(post.data_publicacao)
      : "",
    estado: post.estado ?? "rascunho",
    notas: post.notas ?? "",
  });
  const [estado, setEstado] = useState<"calmo" | "a-guardar" | "guardado" | "erro">("calmo");
  const [mensagem, setMensagem] = useState<string | null>(null);

  function setCampo<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
  }

  function alternarRede(r: string) {
    const tem = form.redes.includes(r);
    setCampo("redes", tem ? form.redes.filter((x) => x !== r) : [...form.redes, r]);
  }

  async function guardar() {
    setEstado("a-guardar");
    setMensagem(null);
    try {
      const r = await fetch(`/api/admin/campanha/${post.dia}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          data_publicacao: form.data_publicacao
            ? new Date(form.data_publicacao).toISOString()
            : null,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt);
      }
      setEstado("guardado");
      setMensagem("Guardado.");
      setTimeout(() => setEstado("calmo"), 2000);
    } catch (e: unknown) {
      setEstado("erro");
      setMensagem(e instanceof Error ? e.message : "erro a guardar");
    }
  }

  const textoCompleto = composarTextoFinal(form);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-10">
      <div className="space-y-6">
        <Linha label="formato">
          <select
            value={form.formato}
            onChange={(e) => setCampo("formato", e.target.value)}
            className="input"
          >
            <option value="">--</option>
            <option value="carrossel">carrossel</option>
            <option value="reel">reel / vídeo</option>
            <option value="post-unico">post único</option>
          </select>
        </Linha>

        <Linha label="texto na imagem (arte)">
          <textarea
            value={form.texto_imagem}
            onChange={(e) => setCampo("texto_imagem", e.target.value)}
            rows={5}
            className="input font-serif"
          />
        </Linha>

        <Linha label="legenda">
          <textarea
            value={form.legenda}
            onChange={(e) => setCampo("legenda", e.target.value)}
            rows={6}
            className="input font-serif"
          />
        </Linha>

        <Linha label="pergunta (no fim, convida comentário)">
          <input
            type="text"
            value={form.pergunta}
            onChange={(e) => setCampo("pergunta", e.target.value)}
            className="input font-serif"
          />
        </Linha>

        <Linha label="hashtags">
          <textarea
            value={form.hashtags}
            onChange={(e) => setCampo("hashtags", e.target.value)}
            rows={2}
            className="input text-sm"
            placeholder={HASHTAGS_SUGERIDAS}
          />
          <button
            type="button"
            onClick={() => setCampo("hashtags", HASHTAGS_SUGERIDAS)}
            className="text-xs text-ocre hover:underline mt-1"
          >
            usar conjunto base
          </button>
        </Linha>

        <Linha label="link (opcional, p. ex. lista de espera)">
          <input
            type="url"
            value={form.link}
            onChange={(e) => setCampo("link", e.target.value)}
            className="input"
            placeholder="https://infonte.vivannedossantos.com/lista"
          />
        </Linha>

        <Linha label="URL da imagem ou vídeo">
          <input
            type="url"
            value={form.imagem_url}
            onChange={(e) => setCampo("imagem_url", e.target.value)}
            className="input"
            placeholder="https://..."
          />
          <p className="text-xs text-castanho/60 mt-1">
            O Metricool aceita ligações públicas. Em alternativa, fazes upload
            direto na interface deles após importar o CSV.
          </p>
        </Linha>

        <Linha label="notas internas">
          <textarea
            value={form.notas}
            onChange={(e) => setCampo("notas", e.target.value)}
            rows={2}
            className="input text-sm"
            placeholder="lembretes, referências, ideias..."
          />
        </Linha>
      </div>

      <aside className="space-y-6">
        <div className="p-4 rounded-lg border border-castanho/15 bg-creme/50">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-oliva mb-3">
            agendar
          </h3>
          <label className="block text-sm">
            <span className="block text-xs text-castanho/70 mb-1">redes</span>
            <div className="flex flex-wrap gap-2">
              {REDES_DISPONIVEIS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => alternarRede(r)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.redes.includes(r)
                      ? "border-ocre bg-ocre/10 text-castanho"
                      : "border-castanho/20 text-castanho/60 hover:border-castanho/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>

          <label className="block text-sm mt-4">
            <span className="block text-xs text-castanho/70 mb-1">
              data e hora
            </span>
            <input
              type="datetime-local"
              value={form.data_publicacao}
              onChange={(e) => setCampo("data_publicacao", e.target.value)}
              className="input"
            />
          </label>

          <label className="block text-sm mt-4">
            <span className="block text-xs text-castanho/70 mb-1">estado</span>
            <select
              value={form.estado}
              onChange={(e) => setCampo("estado", e.target.value)}
              className="input"
            >
              <option value="rascunho">rascunho</option>
              <option value="pronto">pronto</option>
              <option value="agendado">agendado</option>
              <option value="publicado">publicado</option>
            </select>
          </label>
        </div>

        <div className="p-4 rounded-lg border border-castanho/15 bg-creme/50">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-oliva mb-3">
            pré-visualização da legenda
          </h3>
          <pre className="whitespace-pre-wrap font-serif text-sm text-terra-texto/90 leading-relaxed">
            {textoCompleto || "(vazio)"}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(textoCompleto)}
            className="text-xs text-ocre hover:underline mt-3"
          >
            copiar
          </button>
        </div>

        <div className="sticky bottom-4">
          <button onClick={guardar} className="btn-ocre w-full" disabled={estado === "a-guardar"}>
            {estado === "a-guardar" ? "a guardar..." : "guardar"}
          </button>
          {mensagem && (
            <p
              className={`text-xs mt-2 text-center ${
                estado === "erro" ? "text-red-700" : "text-oliva"
              }`}
            >
              {mensagem}
            </p>
          )}
        </div>
      </aside>

      <style>{`
        .input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid rgba(92,61,36,0.25);
          border-radius: 0.4rem;
          background: rgba(255,253,248,0.6);
          font-size: 0.95rem;
        }
        .input:focus {
          outline: none;
          border-color: #B8843D;
          background: rgba(255,253,248,0.95);
        }
      `}</style>
    </div>
  );
}

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-oliva mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function composarTextoFinal(f: {
  legenda: string;
  pergunta: string;
  hashtags: string;
  link: string;
}): string {
  const partes: string[] = [];
  if (f.legenda?.trim()) partes.push(f.legenda.trim());
  if (f.pergunta?.trim()) partes.push("Pergunta: " + f.pergunta.trim());
  if (f.link?.trim()) partes.push(f.link.trim());
  if (f.hashtags?.trim()) partes.push("\n" + f.hashtags.trim());
  return partes.join("\n\n");
}

function toLocalDatetime(iso: string): string {
  // Converte ISO para o formato aceite por <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
