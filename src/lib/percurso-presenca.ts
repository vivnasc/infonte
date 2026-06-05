// Presença da Vivianne no fim de cada etapa: uma imagem dela na postura
// daquela etapa, com uma palavra de acompanhamento na sua voz.
//
// As imagens são geradas no Midjourney (com a referência do rosto dela) e
// vivem em /public/percurso/etapa-N. Enquanto `imagem` for null, o bloco
// não aparece (não parte nada).

export type PresencaEtapa = {
  imagem: string | null;
  frase: string;
};

export const PRESENCA_ETAPAS: Record<number, PresencaEtapa> = {
  1: {
    imagem: "/percurso/etapa-1.webp",
    frase: "Largaste o que não era teu. Eu fico aqui, no espaço que abriste.",
  },
  2: {
    imagem: "/percurso/etapa-2.webp",
    frase: "Já tens. Eu vejo-te bastar-te, e isso muda tudo.",
  },
  3: {
    imagem: "/percurso/etapa-3.webp",
    frase: "Agora vês mais claro. Confia no que separaste.",
  },
  4: {
    imagem: "/percurso/etapa-4.webp",
    frase: "Escolheste. Eu protejo essa escolha contigo.",
  },
  5: {
    imagem: "/percurso/etapa-5.webp",
    frase: "Já existe. Deste o primeiro passo, e eu vi.",
  },
  6: {
    imagem: "/percurso/etapa-6.jpeg",
    frase: "Volta a este encontro. Eu volto contigo, semana após semana.",
  },
  7: {
    imagem: "/percurso/etapa-7.webp",
    frase: "Chegaste. Ocupa o teu lugar. Eu acompanho-te daqui.",
  },
};
