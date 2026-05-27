"use client";

import { useState, useRef, useCallback } from "react";

type Estado = "calmo" | "a-subir" | "ok" | "erro";

export function DropImagem({
  dia,
  imagemAtual,
  onUpload,
}: {
  dia: number;
  imagemAtual?: string | null;
  onUpload: (url: string) => void;
}) {
  const [estado, setEstado] = useState<Estado>("calmo");
  const [preview, setPreview] = useState<string | null>(imagemAtual ?? null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subir = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setEstado("a-subir");
      setPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("dia", String(dia));

      try {
        const r = await fetch("/api/admin/campanha/upload-imagem", {
          method: "POST",
          body: formData,
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.erro ?? "erro");
        setEstado("ok");
        onUpload(j.url);
      } catch {
        setEstado("erro");
      }
    },
    [dia, onUpload]
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (file) subir(file);
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) subir(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
        arrastando
          ? "border-ocre bg-ocre/10"
          : preview
            ? "border-castanho/20"
            : "border-castanho/20 hover:border-ocre"
      }`}
      style={{ minHeight: preview ? "auto" : "120px" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onSelect}
        className="hidden"
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={`Imagem dia ${dia}`}
            className="w-full rounded-lg"
            style={{ maxHeight: "240px", objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-castanho/0 hover:bg-castanho/30 transition-colors rounded-lg flex items-center justify-center">
            <span className="text-white text-xs opacity-0 hover:opacity-100 transition-opacity font-sans">
              Trocar imagem
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-castanho/40 mb-2"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="text-xs text-castanho/60 font-sans">
            Arrasta a imagem MJ aqui
          </span>
          <span className="text-[10px] text-castanho/40 font-sans mt-1">
            ou clica para escolher
          </span>
        </div>
      )}
      {estado === "a-subir" && (
        <div className="absolute inset-0 bg-creme/80 flex items-center justify-center rounded-lg">
          <span className="text-sm text-castanho font-sans">A subir...</span>
        </div>
      )}
      {estado === "erro" && (
        <p className="text-xs text-red-700 text-center py-1">
          Erro ao subir. Tenta de novo.
        </p>
      )}
    </div>
  );
}
