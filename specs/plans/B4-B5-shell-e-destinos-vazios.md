# Plano — B4 · Shell autenticado + B5 · Destinos vazios

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B4 e B5 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-VISUAL
**Spec:** `specs/01-fundacao-e-acesso.md`, página "Shell autenticado"
**Depende de:** B3 (concluída, commit `759a94d`)

## Por que as duas juntas

A B5 não é uma tarefa independente: ela existe só para a navegação da B4 ter
para onde ir. Separadas, a B4 ficaria com três links quebrados e não daria
para revisar. Juntas fecham a fase B de uma vez.

## Reuso identificado

- `Card`, `Button`, `SectionTitle` e `cn()` das fases A.
- **Nada da moldura `(auth)`**: aquela é para telas públicas, centrada e com a
  marca de apresentação. Esta é a moldura interna, com cabeçalho fixo e
  navegação. São contextos diferentes e não devem compartilhar layout.
- O estado vazio se repete nas três rotas → vira componente, não três cópias.

## O primeiro `"use client"` do projeto

Até aqui tudo é Server Component. A navegação precisa saber **qual item está
ativo**, e no App Router isso vem de `usePathname()` — que é hook, e portanto
exige `"use client"`.

Fica restrito ao componente de navegação. O cabeçalho, os layouts e as três
páginas continuam no servidor. Registrado no `architecture.md` para não virar
precedente de "componente novo já nasce client".

## Arquivos a criar

**Shell (B4):**
- `src/features/shell/rotas.ts` — as três rotas internas (href, rótulo, ícone).
  Um lugar só: a navegação e qualquer breadcrumb futuro leem daqui.
- `src/features/shell/CabecalhoApp.tsx` — nome do app, mês de referência e
  avatar. Server Component.
- `src/features/shell/NavegacaoPrincipal.tsx` — `"use client"`. Renderiza os
  itens de `rotas.ts` e destaca o ativo.
- `src/app/(app)/layout.tsx` — junta cabeçalho, conteúdo e navegação.

**Destinos (B5):**
- `src/components/ui/EstadoVazio.tsx` — ícone, título, explicação e ação
  opcional. Reutilizável muito além desta fase.
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/upload/page.tsx`
- `src/app/(app)/revisao/page.tsx`

## Arquivos a modificar

- `references/architecture.md` — registrar a moldura interna, o `EstadoVazio`,
  a regra do `"use client"` e a árvore real.

## Navegação: uma definição, duas apresentações

A spec pede navegação **inferior no mobile** e **no topo no desktop**. Em vez
de dois componentes, um só componente com prop de variante, renderizado duas
vezes e alternado por breakpoint (`md:hidden` / `hidden md:flex`). O item
inativo por `display:none` sai da árvore de acessibilidade, então o leitor de
tela não anuncia a navegação duas vezes.

Alvo de toque de 44px vem do `min-h-11`, o mesmo do `Button` da A3.

O conteúdo ganha espaçamento inferior no mobile para a navegação fixa não
cobrir o fim da página.

## O mês de referência força renderização dinâmica

O cabeçalho mostra o mês atual. Se a rota for pré-renderizada no build, o mês
congela na data do deploy — um deploy em agosto continuaria dizendo "agosto"
em setembro. Por isso o layout interno declara renderização dinâmica.

Isso é honesto **agora**; na fase de dashboard o mês passa a ser um estado
escolhido pelo usuário, e a decisão será revisitada ali.

## Caminho feliz

1. `/dashboard`, `/upload` e `/revisao` abrem dentro da mesma moldura.
2. A navegação destaca o item da rota atual e leva às outras duas.
3. As três mostram estado vazio coerente com o que a tela vai ser.
4. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| Navegação fixa cobrindo o fim do conteúdo | Espaçamento inferior no mobile, do tamanho da barra |
| Rótulo longo no item de navegação | Rótulos de uma palavra: Painel, Enviar, Revisar |
| Leitor de tela com a navegação duplicada | A variante escondida sai da árvore de acessibilidade; a ativa marca o item atual com `aria-current="page"` |
| Rota interna desconhecida | O 404 padrão do Next; a moldura não tenta adivinhar |
| Perfil sem foto | Iniciais no lugar do avatar, como a spec pede |
| Sem nome nem foto | Cai para um traço, sem quebrar o cabeçalho |
| Mês em pt-BR | `Intl.DateTimeFormat("pt-BR")`, primeira letra maiúscula |

## Erros

Não existe erro real: nada de rede, sessão ou banco. O avatar é falso e o
"Sair" ainda não sai de lugar nenhum — isso é a **D8**.

## Banco de dados

Não se aplica.

## Thin Client / Fat Server

Nenhuma decisão de acesso aqui. **A moldura não protege nada** — quem bloqueia
requisição sem sessão é o middleware, no servidor, na **D1**. Renderizar a
moldura não é evidência de que o usuário está autenticado, e nenhuma tarefa
futura deve tratá-la como se fosse.

## Fora do escopo

- `<UserButton />` real e "Sair" → **D8**
- Middleware de proteção → **D1**
- Conteúdo real das três telas → specs próprias (upload, revisão, dashboard)

## Critério de pronto (da Etapa 2)

**B4:**
- [ ] Cabeçalho com nome do app e mês
- [ ] Avatar (com fallback de iniciais)
- [ ] Navegação inferior de 3 itens, ativo destacado, toque ≥44px
- [ ] Vira topo no desktop

**B5:**
- [ ] `/dashboard`, `/upload` e `/revisao` existem dentro da moldura
- [ ] Cada uma com estado vazio
