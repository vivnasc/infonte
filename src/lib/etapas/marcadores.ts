// Parser dos marcadores do conteúdo das etapas.
//
// Reconhece:
//   [ campo de texto, guardado em respostas, bloco_id "X" ]
//   [ Mostrar resposta "X" ]
//   [ Infonte ] / [ Vivianne dos Santos ] / [ Sete Ecos ]
//
// Tudo o resto fica como markdown puro.

export type No =
  | { tipo: "md"; conteudo: string }
  | { tipo: "campo"; bloco_id: string }
  | { tipo: "mostrar"; bloco_id: string }
  | { tipo: "assinatura"; valores: string[] };

const RE_CAMPO =
  /\[\s*campo\s+de\s+texto[^[\]]*?bloco_id\s*"([^"]+)"\s*\]/i;
const RE_MOSTRAR = /\[\s*Mostrar\s+resposta\s*"([^"]+)"\s*\]/i;
const RE_ASSINATURA_LINHA = /^\[\s*([^\]]+?)\s*\]\s*$/;

export function parseEtapa(corpo: string): No[] {
  const nos: No[] = [];
  const linhas = corpo.split(/\r?\n/);
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const texto = buffer.join("\n").trim();
    if (texto) nos.push({ tipo: "md", conteudo: texto });
    buffer = [];
  };

  let i = 0;
  while (i < linhas.length) {
    const linha = linhas[i];

    // Assinatura: várias linhas consecutivas, cada uma [ algo ]
    const matchSig = linha.match(RE_ASSINATURA_LINHA);
    if (matchSig && !RE_CAMPO.test(linha) && !RE_MOSTRAR.test(linha)) {
      const valores: string[] = [matchSig[1]];
      let j = i + 1;
      while (j < linhas.length) {
        const m2 = linhas[j].match(RE_ASSINATURA_LINHA);
        if (m2 && !RE_CAMPO.test(linhas[j]) && !RE_MOSTRAR.test(linhas[j])) {
          valores.push(m2[1]);
          j++;
        } else if (linhas[j].trim() === "") {
          j++;
          break;
        } else {
          break;
        }
      }
      // Considera assinatura se houver pelo menos 2 itens (Infonte / Vivianne / Sete Ecos)
      if (valores.length >= 2) {
        flush();
        nos.push({ tipo: "assinatura", valores });
        i = j;
        continue;
      }
    }

    // Marcadores in-line numa única linha
    // Suporta também linhas em blockquote: "> [Mostrar resposta "X"]"
    const linhaSemQuote = linha.replace(/^\s*>\s?/, "");
    const usaQuote = linhaSemQuote !== linha;
    const linhaCheck = usaQuote ? linhaSemQuote : linha;

    let mCampo = linhaCheck.match(RE_CAMPO);
    let mMostrar = linhaCheck.match(RE_MOSTRAR);

    if (mCampo) {
      const idx = linhaCheck.indexOf(mCampo[0]);
      const antes = linhaCheck.slice(0, idx);
      const depois = linhaCheck.slice(idx + mCampo[0].length);
      if (antes.trim()) buffer.push(antes);
      flush();
      nos.push({ tipo: "campo", bloco_id: mCampo[1] });
      if (depois.trim()) buffer.push(depois);
      i++;
      continue;
    }
    if (mMostrar) {
      const idx = linhaCheck.indexOf(mMostrar[0]);
      const antes = linhaCheck.slice(0, idx);
      const depois = linhaCheck.slice(idx + mMostrar[0].length);
      if (antes.trim()) buffer.push(antes);
      flush();
      nos.push({ tipo: "mostrar", bloco_id: mMostrar[1] });
      if (depois.trim()) buffer.push(depois);
      i++;
      continue;
    }

    buffer.push(linha);
    i++;
  }

  flush();
  return nos;
}
