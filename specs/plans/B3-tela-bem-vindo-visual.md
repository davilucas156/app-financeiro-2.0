# Plano — B3 · Tela Bem-vindo (visual)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** B3 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-VISUAL
**Spec:** `specs/01-fundacao-e-acesso.md`, página `/bem-vindo`
**Depende de:** B2 (concluída, commit `7145d88`)

## Reuso identificado

- `Card`, `Button`, `Badge` e `SectionTitle` das fases A.
- **A lista dos 8 potes já existe duplicada** dentro de `src/app/page.tsx`
  (a página de verificação de tokens da A2). Esta tarefa precisa da mesma
  lista. Ver a seção seguinte.

## A definição dos potes sai da C4 e vem para cá

A tarefa **C4** ("Definição dos potes e categorias padrão") previa um módulo
**server-only** com os 8 potes, para o seed do onboarding gravar no banco.

Isso não sobrevive ao contato com esta tela: `/bem-vindo` **mostra a lista de
potes para o usuário** antes de gravar qualquer coisa. Se o módulo fosse
server-only, o visual teria que duplicar os dados — e aí teríamos três cópias
da mesma lista (página de tokens, tela de onboarding e seed), garantidamente
divergindo com o tempo.

Então: crio o módulo **agora**, como dado compartilhado e não server-only, e a
C4 passa a ser "reutilizar este módulo no seed" em vez de "criar um módulo".

Isso **não viola o Thin Client / Fat Server**: nome, emoji, cor e percentual
dos potes padrão não são segredo nem regra de negócio sensível — são
exatamente o que a tela precisa exibir. O que continua sendo exclusividade do
servidor é a **gravação** (D7) e o `user_id` da sessão.

Cada pote carrega o hex **e** a classe Tailwind: o hex serve ao seed no banco,
a classe serve à renderização. Um lugar só, dois consumidores.

## Arquivos a criar

- `src/features/onboarding/potes-padrao.ts` — os 8 potes (slug, nome, emoji,
  hex, classe, percentual, meta de referência em **centavos**, ordem).
  Centavos porque é assim que o dinheiro vive no banco
  (`references/architecture.md`).
- `src/features/onboarding/concluir-onboarding/ConcluirOnboarding.tsx` — a
  tela e seus estados.
- `src/app/bem-vindo/page.tsx` — só compõe.

## Arquivos a modificar

- `src/app/page.tsx` — trocar o array local de potes pelo módulo novo. É a
  eliminação da duplicata, não um enfeite.
- `specs/01-fundacao-e-acesso.tarefas.md` — reescrever a C4 para refletir que
  o módulo já existe.
- `references/architecture.md` — registrar o módulo como reutilizável.

## Estados

Mesmo andaime das B1/B2, com um eixo a mais (o nome):

| URL | Resultado |
|---|---|
| `/bem-vindo` | "Olá, Davi!" (nome de exemplo), botão pronto |
| `/bem-vindo?nome=` | "Olá!" — variação "sem nome no perfil" da spec |
| `/bem-vindo?estado=enviando` | botão com spinner, desabilitado |
| `/bem-vindo?estado=erro` | "Não conseguimos preparar sua conta." + "Tentar de novo" |

Sai na D7, quando o nome vem do Clerk e o estado vem da server action.

## Conteúdo da tela

- Saudação com o primeiro nome.
- 2–3 frases explicando o método dos 6 potes.
- Lista dos 8 potes: faixa na cor do pote, emoji, nome e percentual. Os dois
  sem percentual (Manutenção e Outros/Repasses) aparecem com o rótulo do
  motivo, não com "0%" — senão parecem meta zerada.
- Botão "Começar".
- Nota de que os percentuais poderão ser editados depois (fase 2), para a tela
  não parecer uma imposição definitiva.

## Caminho feliz

1. `/bem-vindo` abre com saudação, explicação, os 8 potes e o botão.
2. As variações de nome e estado renderizam pela query string.
3. A página de tokens continua idêntica, agora lendo do módulo.
4. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| Perfil sem nome | "Olá!", sem vírgula solta nem "Olá, undefined" |
| Nome completo longo | Só o primeiro nome; `break-words` para não estourar a coluna |
| Nome com espaços em volta | `trim()` antes de cortar o primeiro nome |
| Potes sem percentual | Rótulo "eventual" / "sem meta", nunca "0%" |
| `?estado=` inválido | Cai em "pronto" |
| Duplo toque em "Começar" | Visualmente coberto: o `loading` do `Button` desabilita. A idempotência **de verdade** é da D7, no servidor |
| Tela de 360px | Lista em coluna única |

## Erros

Não existe erro real nesta tarefa. O estado de erro é maquete; o tratamento
verdadeiro (transação que não grava pela metade) é da **D7**.

## Banco de dados

Não se aplica **nesta tarefa**. Mas o módulo criado aqui é a fonte do seed da
C3/D7, e por isso já usa centavos e traz o percentual como `null` nos dois
potes auxiliares — o mesmo que a coluna `percentual_meta` nullable espera.

## Fora do escopo

- Gravar os potes → **D7**
- Nome real do Clerk → **D7**
- Redirecionar quem já concluiu → **D6**

## Critério de pronto (da Etapa 2)

- [ ] Saudação com nome, e variação sem nome
- [ ] Explicação do modelo dos 6 potes
- [ ] Lista dos 8 potes com emoji, nome e % nas cores do design system
- [ ] Botão "Começar" com estados normal / enviando / erro
