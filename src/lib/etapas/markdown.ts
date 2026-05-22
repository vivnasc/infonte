// Renderer mínimo de markdown, suficiente para o corpo das etapas:
// - # / ## / ### títulos
// - parágrafos
// - --- horizontal rule
// - **negrito**, *itálico*
// - listas com - ou 1.
//
// Não usamos uma lib porque o conteúdo é controlado pela autora.

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function inlines(s: string): string {
  let out = esc(s);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

export function renderMarkdown(src: string): string {
  const linhas = src.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];

    if (/^\s*---\s*$/.test(l)) {
      out.push("<hr />");
      i++;
      continue;
    }
    let m = l.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      const n = m[1].length;
      out.push(`<h${n}>${inlines(m[2])}</h${n}>`);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const itens: string[] = [];
      while (i < linhas.length && /^\s*[-*]\s+/.test(linhas[i])) {
        itens.push(linhas[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push(
        `<ul>${itens.map((it) => `<li>${inlines(it)}</li>`).join("")}</ul>`
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(l)) {
      const itens: string[] = [];
      while (i < linhas.length && /^\s*\d+\.\s+/.test(linhas[i])) {
        itens.push(linhas[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(
        `<ol>${itens.map((it) => `<li>${inlines(it)}</li>`).join("")}</ol>`
      );
      continue;
    }
    if (l.trim() === "") {
      i++;
      continue;
    }
    // Junta linhas até linha em branco e trata como parágrafo
    const para: string[] = [l];
    i++;
    while (i < linhas.length && linhas[i].trim() !== "") {
      if (
        /^#{1,6}\s/.test(linhas[i]) ||
        /^\s*---\s*$/.test(linhas[i]) ||
        /^\s*[-*]\s+/.test(linhas[i]) ||
        /^\s*\d+\.\s+/.test(linhas[i])
      ) {
        break;
      }
      para.push(linhas[i]);
      i++;
    }
    out.push(`<p>${inlines(para.join(" "))}</p>`);
  }
  return out.join("\n");
}
