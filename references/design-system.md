# Design System — Painel Financeiro 6 Potes

> Extraído de `planejamento_anual_davi.html` (o painel HTML atual), que é a
> fonte de verdade visual do produto. O app web deve manter esta identidade,
> adaptada para mobile-first.

## Tipografia

| Fonte | Uso | Pesos |
|---|---|---|
| **Syne** | Títulos, valores, corpo geral | 400, 600, 700, 800 (valores grandes usam 900) |
| **DM Mono** | Rótulos, tags, pills, cabeçalho de tabela, números "técnicos" | 300, 400, 500 |

Regra visual do painel: tudo que é **rótulo** (uppercase, letter-spacing alto,
tamanho 9–10px, cor `--dim`) é DM Mono. Tudo que é **conteúdo** é Syne.
Valores monetários grandes usam peso 800–900 com `letter-spacing` negativo.

No Next.js: carregar via `next/font/google` (não `<link>` pro Google Fonts),
expondo `--font-syne` e `--font-dm-mono` como CSS variables no `<html>`.

## Cores

Tema **dark único** (não há light mode no painel atual).

### Base

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#060608` | Fundo da página |
| `--surface` | `#0d0d10` | Superfície elevada |
| `--card` | `#111116` | Card padrão |
| `--card2` | `#16161c` | Card em hover |
| `--border` | `#1e1e26` | Borda padrão |
| `--border2` | `#28282f` | Borda de destaque |
| `--text` | `#e8e8f0` | Texto principal |
| `--dim` | `#7d7d96` | Texto secundário / rótulos — 5.06 `bg` · 4.70 `card` · 4.50 `card2` |
| `--dim2` | `#3a3a4a` | Texto **desabilitado** — 1.69, reprova de propósito |

⚠ **A regra dos dois cinzas, em uma frase: `dim` carrega texto; `dim2` não.**
É por isso que só um deles passa dos 4.5 do WCAG. O tema claro já nascia
assim (`--claro-dim` 5.19, `--claro-dim2` 2.38); o escuro só recebeu o mesmo
tratamento na **spec 15**, quando `--dim` era `#5a5a70` e dava 2.81 sobre o
card — o texto secundário do app inteiro, abaixo do mínimo de leitura. O
valor novo é o **mesmo matiz**, clareado até passar.

⚠ **`dim2` continua reprovando, e isso não é dívida.** Ele descreve o que
está desligado. Usá-lo para conteúdo é o erro — e era o que a `/comparativo`
fazia com a linha mês a mês dos cartões, a 9px.

### Semânticas

| Token | Hex | Uso |
|---|---|---|
| `--primary` | `#FF5000` | Cor da marca (laranja) |
| `--green` | `#00e5a0` | Positivo / dentro da meta |
| `--red` | `#ff4f4f` | Negativo / meta estourada |
| `--gold` | `#ffc94d` | Metas / destaque |
| `--blue` | `#3d8eff` | Informação |
| `--cyan` | `#00c8d4` | Reserva — o hex é o de 🚗 Transporte, servido por `--pote-tra` |
| `--pink` | `#e040a0` | Reserva — o hex é o de 📚 Conhecimento, servido por `--pote-con` |
| `--purple` | `#a78bfa` | Reserva — o hex é o de 💰 Renda, servido por `--pote-ren` |
| `--orange` | `#ff9a3c` | Reserva — **a única cor da paleta sem nenhum uso hoje** |

⚠ **As quatro "Reserva" ficam de propósito** (decisão do Davi, 30/08/2026).
Uma varredura de tokens sem uso vai reencontrá-las: não são sujeira, são
paleta. Três delas nem são cores paradas — o mesmo hex já pinta um pote, com
outro nome de token; o que não se usa é o **apelido semântico**. `--orange` é
a única cor que não aparece em lugar nenhum, e continua aqui para o dia em que
faltar uma cor livre.

### Cores dos potes

| Pote | Token | Hex |
|---|---|---|
| Liberdade Financeira | `--c-lib` | `#00e5a0` |
| Custos Fixos | `--c-fix` | `#FF5000` |
| Conforto & Lazer | `--c-laz` | `#3d8eff` |
| Metas / Sonhos | `--c-met` | `#ffc94d` |
| Transporte | `--c-tra` | `#00c8d4` |
| Conhecimento | `--c-con` | `#e040a0` |
| Manutenção | `--c-mec` | `#26c9a0` |
| Outros / Repasses | `--c-out` | `#5a5a70` |

## Os potes (seed do onboarding)

Os **6 potes** com meta percentual, mais 2 potes auxiliares sem percentual.
A soma das metas em reais (R$1.200) confirma os percentuais do `readme.md`.

| # | Nome | Emoji | Cor | % da renda | Meta de referência |
|---|---|---|---|---|---|
| 1 | Custos Fixos | 🏠 | `#FF5000` | **30%** | R$ 360/mês |
| 2 | Liberdade Financeira | 📈 | `#00e5a0` | **25%** | R$ 300/mês |
| 3 | Conforto & Lazer | 🎮 | `#3d8eff` | **15%** | R$ 180/mês |
| 4 | Metas / Sonhos | ★ | `#ffc94d` | **15%** | R$ 180/mês |
| 5 | Transporte | 🚗 | `#00c8d4` | **10%** | R$ 120/mês |
| 6 | Conhecimento | 📚 | `#e040a0` | **5%** | R$ 60/mês |
| — | Manutenção | 🔧 | `#26c9a0` | sem % (eventual) | R$ 80–100/mês |
| — | Outros / Repasses | · | `#5a5a70` | sem meta | — |

**Manutenção** e **Outros/Repasses** existem no painel como potes de fato
(têm cor, card e barra), mas ficam fora do rateio percentual: manutenção é
custo flutuante e "outros" é o balde de repasses/empréstimos. O seed deve
criá-los com `percentual_meta = null`.

## Componentes visuais do painel atual

Inventário do que existe hoje em HTML e vai virar componente React reutilizável.
Nem tudo é necessário na primeira funcionalidade (fundação/acesso) — a coluna
"Quando" indica em qual fatia ele aparece.

| Componente | Descrição | Quando |
|---|---|---|
| `Badge` | Pill uppercase DM Mono com bolinha (`●`), variantes green/gold/blue/dim | Fundação |
| `Card` | `--card` + borda `--border`, raio 14px, padding 20px | Fundação |
| `SectionTitle` | Rótulo uppercase + linha horizontal preenchendo o resto | Fundação |
| `Button` | Não existe no painel (é estático) — **criar** seguindo os tokens | Fundação |
| `PoteCard` | Card com faixa de 2px no topo na cor do pote, valor, barra de progresso, meta e nota | Dashboard |
| `SummaryCard` | Card clicável com hover elevado, glow colorido e "Ver transações →" | Dashboard |
| `FonteBanner` | Grid de fontes de renda com faixa colorida no topo de cada célula | Dashboard |
| `Tag` | Tag pequena por categoria, fundo escuro + borda na cor da categoria | Revisão / Dashboard |
| `DataTable` | Tabela com `th` em DM Mono uppercase e hover de linha | Dashboard |
| `InsightPanel` | Painel com gradiente escuro e borda laranja translúcida | Dashboard |

## Adaptação para mobile

O painel atual é desktop-first (grids de 4 colunas com media queries pra baixo).
No app, inverter: começar em 1 coluna e crescer.

- Potes: 1 coluna → 2 (≥520px) → 4 (≥980px)
- Cards de resumo: 1 coluna → 3 (≥680px)
- Navegação: o painel tem barra fixa no topo (62px). No app, **navegação
  inferior** no mobile (alvos de toque ≥44px) e topo no desktop.

## Regras

- Raio de borda: 12px (potes) / 14px (cards e painéis).
- Transições: `.25s` em hover de card, `translateY(-2px)`.
- Valores monetários sempre `R$ 1.234,56` (pt-BR), formatados na borda de
  exibição — no banco ficam em centavos inteiros (`references/architecture.md`).
- Não introduzir cor fora desta lista sem atualizar este arquivo.
