# Plano — B1 a E2, as abas e a tela anual

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1–B3 (a fileira vira abas), C1–C2 (o ano), D1–D2 (os cartões),
E1–E2 (a conferência e os documentos)
**Spec:** `specs/12-comparativo-anual.md`
**Depende de:** A1 e A2 entregues

---

## Arquivos a criar

### `src/features/painel/navegar-entre-meses/AbasDoPainel.tsx` `FRONT-VISUAL`

A fileira, movida inteira de dentro do `TopoDoMes.tsx` e com a aba do
comparativo no fim.

```tsx
export function AbasDoPainel({
  meses,
  mes,
  aqui,
}: {
  /** Todos os meses da conta, do mais antigo ao mais novo. */
  meses: string[];
  /** O mês de referência. No painel é o que se vê; no comparativo, o mais recente. */
  mes: string;
  aqui: "painel" | "comparativo";
});
```

- Os meses continuam idênticos: `min-h-11`, `rounded-card`, `text-xs`, marcado
  com `border-primary/40 bg-primary/10 text-primary`, `aria-current="page"`.
- ⚠ **`aria-current` é do item onde se está.** No painel, o mês. No comparativo,
  **a aba do comparativo, e nenhum mês** — senão o leitor de tela anuncia duas
  páginas atuais.
- A aba do comparativo aponta para `/comparativo?ano=${anoDoMes(mes)}`.
- ⚠ **Some quando `meses.length < 2`**, mesma decisão da `ChamadaDoComparativo`.
- ⚠ **Visualmente distinta**, com o emoji 📊 e separada dos meses por um `ml-auto`
  quando couber — se ela parecer mais um mês, vira o mês que ninguém acha.
- O `aria-label` da `nav` deixa de ser `"Mês do painel"`: ela não navega mais só
  entre meses.

⚠ **Servidor, sem `"use client"`.** São `Link`s; o `SeletorDeMeses` de hoje também
é, e transformar navegação em componente de cliente é a troca que a spec 02 já
recusou.

### `src/features/painel/comparar-meses/SeletorDeAno.tsx` `FRONT-VISUAL`

- ⚠ **Devolve `null` com um ano só** (pendência 8).
- Mesma forma dos meses, menor: é um recorte, não o assunto da tela.

### `src/features/painel/comparar-meses/CartoesDoAno.tsx` `FRONT-VISUAL`

Grade `grid-cols-2 gap-2`, um cartão por pote, na ordem que a A2 entregou.

Cada cartão:

```
[bolinha da cor]  🔧 Manutenção
R$ 1.378,91          ← text-sm font-mono, o número grande
no ano
R$ 275,78/mês · 5 meses   ← text-3xs text-dim
mar R$0 · abr R$541 · mai R$140 ⚠ · jun R$352 · jul R$0
```

- ⚠ **Os dois números, sempre** (pendência 2).
- ⚠ **`w-[Nem]` e não `w-N` na linha mês a mês** — a lição da fase E da spec 10:
  ela é `text-3xs`, vai a 14px em "Maior", e apertar depois é mais caro do que
  medir agora.
- ⚠ **Nenhum `text-[Npx]`**: o teste da spec 10 reprova, e com razão.
- A cor vem de `estiloDoPote`, como já fazem as bolinhas de `/categorias`.

---

## Arquivos a modificar

### `src/features/painel/painel-do-mes/TopoDoMes.tsx` `FRONT-VISUAL` — B1

- **Sai** a função `SeletorDeMeses` inteira, com o docblock dela (ele conta a
  história do defeito mudo do `<span>` que não era link — vai junto).
- **Sai** a prop `meses`.
- O componente passa a começar no `<Card>` de entrou/saiu/diferença.

### `src/features/painel/painel-do-mes/TelaDoPainel.tsx` `FRONT-VISUAL` — B1

- `<AbasDoPainel meses={meses} mes={mes} aqui="painel" />` entra **entre** o
  `<SectionTitle>` e o `<TopoDoMes>` — exatamente onde a fileira era desenhada
  antes, para o painel sair idêntico ao pixel.
- `meses` deixa de ser repassado ao `TopoDoMes`.

### `src/features/painel/comparar-meses/TelaDoComparativo.tsx` `FRONT-INTEGRADO` — B3, C2, D2

- Recebe `meses`, `anos`, `ano` e `cartoes`.
- `<AbasDoPainel … aqui="comparativo" />` no topo, **acima** do `← Painel`.
- `<SeletorDeAno>` ao lado do título.
- `<CartoesDoAno>` **entre a frase e as barras** — o resumo antes do detalhe.
- ⚠ **O aviso de janeiro** (C2): quando o ano tem menos de dois meses
  classificados **e existe ano anterior na conta**, uma linha diz
  _"2027 ainda tem 1 mês — veja 2026"_ com o link. Sem ela, quem virou o ano com
  um ano inteiro de dado atrás vê uma tela que parece quebrada.
- O `← Painel` fica: a rota continua fora da barra de navegação, e no app
  instalado não existe botão de voltar.

### `src/app/(app)/comparativo/page.tsx` `FRONT-INTEGRADO` — C1

```ts
export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
});
```

- `anoEscolhido(historico, mesMaisRecente, ano)` → `mesesDoAno(historico, ano)` →
  `compararMeses(recorte, mesMaisRecente)` → `cartoesDoAno(comparativo.linhas)`.
- ⚠ **`compararMeses` não muda.** Se ela precisar mudar, o desenho está errado
  (Descoberta 2).
- ⚠ **Continuam sendo duas consultas.** `dadosDoPainel` e `historicoDosMeses`, as
  mesmas de hoje. `dados.meses` já traz a lista para a fileira — nenhuma terceira.

### `src/app/(app)/dashboard/page.tsx` `FRONT-INTEGRADO` — C1

```ts
media={mediaDoComparativo(mesesDoAno(cobertura, anoDoMes(dados.mes)), dados.mes)}
```

⚠ **É uma linha, e é a mais importante do plano.** As duas telas compartilham
`mediaDoComparativo` desde a spec 09 justamente para não poderem divergir:

> _"se a frase do painel e a da `/comparativo` fossem calculadas em lugares
> diferentes, um dia o painel diria 'média de 3 meses' e a tela ao lado diria
> 'comparado com maio' — e quem lesse não teria como saber qual das duas
> mentiu."_

Recortar por ano só na `/comparativo` reintroduziria exatamente essa divergência.

⚠ **`historicoDosMeses` continua proibida aqui.** O recorte é sobre `cobertura`,
que é a consulta barata que a página já faz.

### `references/estado-do-projeto.md` `INFRA` — E2

- A linha da `/comparativo` na tabela de telas.
- **Tirar do backlog** os 6 cartões do Comparativo Anual — dívida aberta desde a
  spec 06, pendência 5.

---

## Reuso identificado

| O que                      | Onde                      | Uso aqui                               |
| -------------------------- | ------------------------- | -------------------------------------- |
| `SeletorDeMeses`           | dentro de `TopoDoMes.tsx` | **É** a fileira. Movida, não reescrita |
| `estiloDoPote`             | `aparencia/tema/`         | A cor do cartão                        |
| `emReais`                  | `lib/dinheiro.ts`         | Os dois números                        |
| `rotuloDeMes`, `nomeDoMes` | `lib/mes.ts`              | Abas e linha mês a mês                 |
| `Card`, `SectionTitle`     | `components/ui/`          | Cartões e títulos                      |
| `grid-cols-3 divide-x`     | `TopoDoMes.tsx`           | O molde de grade que cabe em 360px     |

---

## Caminho feliz

Conta com `2025-11` a `2026-02`, painel em `2026-02`.

O painel mostra quatro abas de mês e `📊 Comparativo`. Tocar nela abre
`/comparativo?ano=2026`: a fileira aparece com a aba marcada, o seletor mostra
`2025 2026`, os cartões somam janeiro e fevereiro, e as barras desenham os dois.
Trocar para `2025` troca cartões, barras, média e frase de uma vez.

## Edge cases

| Caso                                     | Comportamento                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Conta com um mês                         | A aba não aparece. A `/comparativo` continua alcançável pela URL e mostra o que já mostra hoje |
| Conta sem mês nenhum                     | O `EstadoVazio` de hoje, e **sem fileira** — não há mês para listar                            |
| Conta com um ano                         | Sem seletor de ano                                                                             |
| Primeiro mês de um ano novo              | Cartões saem; média se cala; o aviso aponta o ano anterior                                     |
| `?ano=` inventado, ou `?ano=<script>`    | Cai no ano do mês de referência pela A1. **Nunca vira consulta**                               |
| Ano com todos os meses mal classificados | A frase `anteriores-descartados` de hoje, que manda para a `/revisao`                          |
| Oito cartões a 360px                     | Duas colunas; valor de seis dígitos quebra dentro do cartão, não a grade                       |
| Tamanho de letra "Maior"                 | A linha mês a mês foi medida em `em` — spec 10, fase E                                         |

## Erros

Nenhum caminho de erro novo. Não há action, não há escrita, não há rede: as duas
rotas são leitura, e o `garantirUsuario()` já é o mesmo de hoje.

⚠ **`/comparativo` já está protegida** no `src/proxy.ts` — rota interna nova não
é protegida automaticamente, mas esta não é nova.

## Banco de dados

**Nenhuma alteração.** Nenhuma tabela, coluna, migration ou consulta nova.

---

## E1 — a conferência, e o que ela realmente guarda

`src/features/painel/comparar-meses/cartaoEbarra.test.ts`: soma a série do cartão
e a série da barra do mesmo pote, no mesmo ano, e exige que batam.

⚠ **Por construção elas não podem divergir** — `cartoesDoAno` lê
`comparativo.linhas`, o mesmo array que a barra desenha. O teste não persegue uma
coincidência: ele **guarda a estrutura**, e reprova quem um dia fizer o cartão
buscar os próprios números. É a régua do `formatos-de-extrato.md` aplicada aqui:
somar o que a própria função leu não prova nada; conferir duas leituras do mesmo
dado, prova.

E `comparativo.test.ts` tem de passar **sem uma linha alterada** — a prova de que
o recorte por ano não tocou no que já funcionava. Foi assim que o `tema.test.ts`
provou a spec 10.
