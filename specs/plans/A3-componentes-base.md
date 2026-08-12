# Plano — A3 · Componentes base de UI

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A3 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** FRONT-VISUAL
**Depende de:** A2 (concluída, commit `55aaeeb`)

## Contexto lido antes de planejar

- `planejamento_anual_davi.html` — CSS original de `.vh-badge`, `.badge-*`,
  `.sc`, `.panel` e `.section-t`, que são a especificação visual real
- `references/design-system.md` — inventário de componentes e a coluna "Quando"
- `references/architecture.md` — `src/components/ui/` guarda o que é
  reutilizável e **sem regra de negócio**

## Reuso identificado

- A A2 já criou, **dentro da `page.tsx`**, dois componentes locais: `Titulo`
  (que é exatamente o `.section-t` do painel) e `Amostra`. O `Titulo` não deve
  ser reescrito: ele **sai da `page.tsx` e vira `SectionTitle`**. O `Amostra` é
  específico da página de tokens e continua local.
- Todos os componentes consomem os tokens da A2. Nenhum hex literal.
- Nenhuma dependência nova. Sem `clsx`/`cva`: um utilitário de 3 linhas resolve
  a junção de classes neste tamanho de projeto.

## Arquivos a criar

- `src/lib/cn.ts` — junta classes ignorando `false`/`undefined`. Único motivo de
  existir: permitir `className` opcional nos componentes sem trazer dependência.
- `src/components/ui/Card.tsx` — `--color-card` + borda `--color-border` +
  `rounded-card`. Prop `className` para ajuste de padding pelo consumidor.
- `src/components/ui/Badge.tsx` — pill uppercase em DM Mono, variantes
  `green` | `gold` | `blue` | `dim`. As três primeiras levam o ponto `●` do
  painel; `dim` não leva (é assim no CSS original).
- `src/components/ui/SectionTitle.tsx` — rótulo uppercase + régua horizontal
  ocupando o resto da linha.
- `src/components/ui/Button.tsx` — **não existe no painel** (o HTML é estático).
  Desenhado a partir dos tokens: variantes `primary` | `secondary`, estados
  normal / hover / desabilitado / carregando.

## Arquivos a modificar

- `src/app/page.tsx` — importar os quatro componentes, remover o `Titulo` local
  e acrescentar uma seção demonstrando as variantes e estados de `Badge` e
  `Button` (é a página de verificação visual; some na D6).
- `references/architecture.md` — registrar os componentes na lista de
  reutilizáveis.

## Arquivos a excluir

- `src/components/ui/.gitkeep` — a pasta ganhou arquivos de verdade.

## Decisões de implementação

**Nenhum `"use client"`.** Os quatro são apresentacionais e não usam hook nem
handler. Ficam compatíveis com Server Components; quem precisar de `onClick`
marca a si próprio como client. Isso evita empurrar árvore inteira para o
cliente sem necessidade.

**`Button` com `min-height` de 44px.** A spec exige alvo de toque ≥44px na
navegação (B4); adotar isso já no botão evita ter dois padrões de toque.

**Estado de carregando desabilita o botão.** `loading` implica `disabled` no
elemento, para o duplo toque não disparar duas vezes — é a mesma preocupação
que o onboarding tem na D7.

**Sem regra de negócio.** Os componentes não sabem o que é pote, transação ou
usuário. Recebem texto e classes.

## Caminho feliz

1. `cn.ts` e os quatro componentes criados.
2. `page.tsx` passa a consumi-los, sem `Titulo` local.
3. `build`, `tsc --noEmit` e `lint` limpos.
4. A raiz mostra as 4 variantes de badge e os 4 estados de botão.

## Edge cases

| Situação | Tratamento |
|---|---|
| Consumidor passa `className` conflitante | A classe do consumidor vem por último na string; em Tailwind 4 a ordem no arquivo CSS é que decide, então conflito real é possível. Documentado no componente: `className` serve para acrescentar (espaçamento, largura), não para repintar |
| `Button` dentro de `<form>` | `type` é prop, com `"button"` como padrão — evita submit acidental, que é o erro clássico |
| Botão com texto longo no mobile | Não trunca: quebra em duas linhas mantendo os 44px de altura mínima |
| `Badge` com variante inválida | TypeScript impede: o tipo é a união literal das quatro |
| Ícone `●` lido por leitor de tela | `aria-hidden`, é decorativo |
| Spinner com `prefers-reduced-motion` | Fora do escopo desta tarefa; anotado como dívida na página de verificação |

## Erros

| Erro | Resposta |
|---|---|
| Classe de opacidade (`bg-green/8`) não gerar a cor | Confiro no CSS servido, como fiz na A2. Se o Tailwind 4 não resolver sobre token customizado, caio para `color-mix` explícito e registro aqui |
| Build quebrar | Reporto a saída antes de mexer em outra coisa |

## Banco de dados

Não se aplica.

## Fora do escopo

- `PoteCard`, `SummaryCard`, `Tag`, `DataTable`, `InsightPanel`, `FonteBanner`
  → nascem junto com o dashboard, em spec própria
- Telas de login/cadastro/onboarding → fase B

## Critério de pronto (da Etapa 2)

- [ ] `Card`, `Badge` (4 variantes), `SectionTitle` e `Button` (primário/
      secundário, 4 estados) em `src/components/ui/`
- [ ] Batendo com o painel HTML
- [ ] Zero regra de negócio dentro deles
- [ ] Registrados na lista de reutilizáveis do `architecture.md`
