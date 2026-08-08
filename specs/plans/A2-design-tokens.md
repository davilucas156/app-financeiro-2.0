# Plano — A2 · Design tokens

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A2 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** INFRA
**Depende de:** A1 (concluída, commit `b88895f`)

## Contexto lido antes de planejar

- `references/design-system.md` — paleta completa, regra tipográfica, raios
- `references/architecture.md` — árvore real pós-A1
- Estado atual: o scaffold ainda usa **Geist/Geist Mono** e um tema
  claro/escuro genérico em `globals.css`. Nada disso é o design do produto.

## Reuso identificado

- `next/font/google` já está em uso no `layout.tsx` (a A1 manteve o padrão do
  scaffold). Troco as fontes no mecanismo que já existe, sem introduzir
  `<link>` para o Google Fonts.
- Tailwind 4 com `@theme` em CSS — não existe `tailwind.config.ts` neste
  projeto e não vou criar um.

## Arquivos a modificar

- `src/app/layout.tsx` — trocar `Geist`/`Geist_Mono` por `Syne`/`DM_Mono`,
  expondo `--font-syne` e `--font-dm-mono` no `<html>`.
- `src/app/globals.css` — remover o tema padrão do scaffold e declarar todos os
  tokens de `references/design-system.md` em blocos `@theme`.
- `src/app/page.tsx` — substituir o placeholder por uma página de verificação
  dos tokens (as 8 cores de pote, as cores base, as semânticas e uma amostra
  tipográfica).

## Arquivos a excluir

- `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`,
  `public/window.svg` — assets de marketing do scaffold, sem referência no
  código desde que a A1 substituiu a `page.tsx`.

Nenhum arquivo novo. Nenhum outro arquivo existente é tocado.

## Nomenclatura dos tokens

O design system usa `--bg`, `--primary`, `--c-lib`. No Tailwind 4 um token só
vira classe utilitária se seguir o namespace da propriedade, então os nomes
mudam de forma previsível:

| Design system | Token no projeto | Classe gerada |
|---|---|---|
| `--bg` | `--color-bg` | `bg-bg`, `text-bg` |
| `--primary` | `--color-primary` | `bg-primary`, `text-primary` |
| `--c-lib` | `--color-pote-lib` | `bg-pote-lib`, `text-pote-lib` |

Os potes ganham o prefixo `pote-` para não se misturarem às cores semânticas
(`--c-lib` e `--green` são o mesmo hex, mas significam coisas diferentes:
"pote Liberdade Financeira" e "positivo"). Manter os dois separados evita que
uma mudança futura na cor de um pote mexa no verde de "dentro da meta".

Além das cores, dois raios: `--radius-pote: 12px` e `--radius-card: 14px`.

## Caminho feliz

1. `layout.tsx` carrega Syne e DM Mono via `next/font/google`.
2. `globals.css` declara os tokens; o `body` recebe `--color-bg`, `--color-text`
   e Syne como fonte padrão.
3. `page.tsx` mostra as amostras.
4. `npm run build` compila, `tsc --noEmit` e `lint` passam limpos.
5. `npm run dev` mostra a página escura, com as 8 cores corretas e as duas
   fontes visivelmente diferentes entre si.

## Edge cases

| Situação | Tratamento |
|---|---|
| **Syne é fonte variável, DM Mono não é** | Syne carrega sem `weight` (a faixa variável inteira). DM Mono exige lista explícita: `300`, `400`, `500` — são os únicos pesos que ela publica |
| **O painel HTML usa `font-weight: 900`** | Syne vai só até 800. O navegador já resolvia isso como 800 no painel original; nada muda visualmente, mas o código usa 800 e não 900 |
| `--color-border` colide com a classe `border` do Tailwind | Não colide: gera `border-border`, feio mas válido. Mantenho o nome do design system para o CSS e o Markdown continuarem batendo |
| Fonte não baixa no build (rede) | `next/font` baixa e auto-hospeda em build. Sem rede, o build falha — reporto em vez de cair para `<link>` externo, que violaria a auto-hospedagem |
| Acento em português faltando | `subsets: ["latin"]` cobre o português; confiro "ó" e "ã" na página de amostra |
| A página de amostra virar lixo no produto | Ela vive na `/`, que **já é** um placeholder temporário e será substituída pelo redirecionamento na D6. Não crio rota órfã |

## Erros

| Erro | Resposta |
|---|---|
| `next/font` reclamar de `weight` em fonte variável | Ajusto a assinatura conforme a mensagem e registro aqui qual das duas exigia peso explícito |
| Cor renderizar diferente do painel | Comparo o hex renderizado com `references/design-system.md`; a fonte de verdade é o painel HTML |
| Build quebrar | Reporto a saída antes de mexer em qualquer outra coisa |

## Banco de dados

Não se aplica.

## Fora do escopo

- `Card`, `Badge`, `Button`, `SectionTitle` → **A3**
- Qualquer tela de login/onboarding → fase B
- Navegação e shell → **B4**

## Critério de pronto (da Etapa 2)

- [ ] Syne e DM Mono carregadas via `next/font/google`
- [ ] Todas as cores do design system como CSS variables **e** cores do Tailwind
- [ ] `--bg` e `--text` aplicados no `<body>`
- [ ] Página de teste mostrando as 8 cores de pote corretas
