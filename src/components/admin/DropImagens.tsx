"use client";

import { useState, useRef, useCallback } from "react";

type Estado = "calmo" | "a-subir" | "erro";

export function DropImagens({
  dia,
  imagensAtuais,
  onUpload,
}: {
  dia: number;
  imagensAtuais: string[];
  onUpload: (urls: string[]) => void;
}) {
  const [imagens, setImagens] = useState<string[]>(imagensAtuais);
  const [estado, setEstado] = useState<Estado>("calmo");
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subir = useCallback(
    async (files: FileList) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) return;
      setEstado("a-subir");

      const novasUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dia", String(dia));
        formData.append("indice", String(imagens.length + i));

        try {
          const r = await fetch("/api/admin/campanha/upload-imagem", {
            method: "POST",
            body: formData,
          });
          const j = await r.json();
          if (r.ok && j.url) novasUrls.push(j.url);
        } catch {
          // continua com as restantes
        }
      }

      if (novasUrls.length > 0) {
        const todas = [...imagens, ...novasUrls];
        setImagens(todas);
        onUpload(todas);
      }
      setEstado(novasUrls.length > 0 ? "calmo" : "erro");
    },
    [dia, imagens, onUpload]
  );

  function remover(idx: number) {
    const novas = imagens.filter((_, i) => i !== idx);
    setImagens(novas);
    onUpload(novas);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files.length) subir(e.dataTransfer.files);
  }

  return (
    <div>
      {imagens.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {imagens.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Slide ${i + 1}`}
                className="w-full aspect-[4/5] object-cover rounded border border-castanho/15"
              />
              <div className="absolute top-1 left-1 bg-castanho/70 text-creme text-[10px] px-1.5 py-0.5 rounded font-sans">
                {i + 1}
              </div>
              <button
                type="button"
                onClick={() => remover(i)}
                className="absolute top-1 right-1 bg-red-800/80 text-white text-[10px] w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors p-4 text-center ${
          arrastando
            ? "border-ocre bg-ocre/10"
            : "border-castanho/20 hover:border-ocre"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && subir(e.target.files)}
          className="hidden"
        />
        {estado === "a-subir" ? (
          <span className="text-sm text-castanho">A subir...</span>
        ) : (
          <>
            <span className="text-xs text-castanho/60 font-sans block">
              {imagens.length === 0
                ? "Arrasta imagens MJ aqui (várias de uma vez)"
                : "Arrasta mais imagens para adicionar"}
            </span>
            <span className="text-[10px] text-castanho/40 font-sans mt-1 block">
              Cada slide do carrossel recebe uma imagem diferente
            </span>
          </>
        )}
      </div>
      {estado === "erro" && (
        <p className="text-xs text-red-700 mt-1">Erro ao subir. Tenta de novo.</p>
      )}
    </div>
  );
}
