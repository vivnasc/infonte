// Presença da Vivianne no fim de cada etapa: uma imagem dela na postura
// daquela etapa, com uma palavra de acompanhamento na sua voz.
//
// As imagens são geradas no Midjourney (com --cref do rosto dela) e
// colocadas em /public/percurso/etapa-N.png. Enquanto `imagem` for null,
// o bloco não aparece (não parte nada). Basta pôr o caminho quando a
// imagem existir.

export type PresencaEtapa = {
  imagem: string | null;
  frase: string;
};

export const PRESENCA_ETAPAS: Record<number, PresencaEtapa> = {
  1: {
    imagem: null, // /percurso/etapa-1.png
    frase: "Largaste o que não era teu. Eu fico aqui, no espaço que abriste.",
  },
  2: {
    imagem: null,
    frase: "Já tens. Eu vejo-te bastar-te, e isso muda tudo.",
  },
  3: {
    imagem: null,
    frase: "Agora vês mais claro. Confia no que separaste.",
  },
  4: {
    imagem: null,
    frase: "Escolheste. Eu protejo essa escolha contigo.",
  },
  5: {
    imagem: null,
    frase: "Já existe. Deste o primeiro passo, e eu vi.",
  },
  6: {
    imagem: null,
    frase: "Volta a este encontro. Eu volto contigo, semana após semana.",
  },
  7: {
    imagem: null,
    frase: "Chegaste. Ocupa o teu lugar. Eu acompanho-te daqui.",
  },
};
