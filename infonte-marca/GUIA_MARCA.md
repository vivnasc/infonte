# MARCA INFONTE

## Símbolo
A gota de luz invertida com um ponto no centro. É a fonte que vem de dentro, dita de forma abstracta, sem desenhar nada literal. Funciona bem em tamanho pequeno (ícone de app) e grande (landing).

Ficheiros:
- infonte-simbolo.svg, símbolo em fundo terra (uso principal).
- infonte-simbolo-claro.svg, símbolo em fundo creme (para fundos claros).
- infonte-horizontal.svg, símbolo mais o nome "infonte" em serif (uso em cabeçalhos, assinaturas).
- favicons/, o símbolo nos tamanhos 16, 32, 48, 64, 180, 192, 256, 512.

## Cores
- Terra profundo  #2E1D12  (fundo escuro, base da marca)
- Ocre            #B8843D  (cor de marca, destaques em fundo claro)
- Âmbar luz       #EBAE4A  (o traço da gota, a luz)
- Âmbar claro     #F4C56A  (o ponto central, brilhos)
- Creme           #F2E8DC  (fundo claro, texto sobre escuro)
- Castanho médio  #5C3D24  (texto sobre claro, acentos)

A paleta é própria do Infonte, da família terra mas mais dourada e luminosa que os Sete Ecos. Não precisa de ser fiel a outra marca.

## Tipografia
- Nome e títulos: serif elegante (Georgia, ou EB Garamond na web).
- O nome "infonte" escreve-se em minúsculas, sereno, sem maiúscula inicial.
- Corpo e interface: sans limpo.

## Tom visual
Calmo, luminoso, com espaço para respirar. A luz parece vir de dentro do escuro. Nada de urgência, nada de néon, nada de guru. Classe sóbria.

## Regra de escrita
Sem travessões em nenhum texto da marca (vírgula, ponto, dois pontos ou parênteses). Minúsculas no nome.

## Favicon, como instalar na app (Next.js)
Coloca favicon-32.png e favicon-16.png em /public, e favicon-180.png como apple-touch-icon. favicon-192.png e favicon-512.png entram no manifest da PWA (icons). O símbolo em fundo terra é o ícone; o manifest pode usar "theme_color": "#2E1D12" e "background_color": "#2E1D12".
