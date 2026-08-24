# Plano — A1, A2 e A3 · As frases que o app pode assinar

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1, A2 e A3 de `specs/06-veredito-e-insights.tarefas.md`
**Camada:** BACK (puro — sem banco, sem sessão, sem tela)

## Arquivos

| Arquivo | O quê |
|---|---|
| `features/painel/somar-o-mes/cobertura.ts` | **modificar** — ganha o limiar de confiança e `coberturaConfiavel()` |
| `features/painel/somar-o-mes/cobertura.test.ts` | modificar — os casos do limiar |
| `features/painel/veredito-do-mes/veredito.ts` | criar |
| `features/painel/veredito-do-mes/veredito.test.ts` | criar |
| `features/painel/veredito-do-mes/insightDoPote.ts` | criar |
| `features/painel/veredito-do-mes/insightDoPote.test.ts` | criar |
| `features/painel/comparar-meses/comparativo.ts` | criar |
| `features/painel/comparar-meses/comparativo.test.ts` | criar |
| `lib/mes.ts` | **criado na execução** — ver abaixo |
| `enviar-extrato/SeletorDeMes.tsx` + 4 telas | **modificados na execução** — só o `import` |

Nenhum `.tsx`, nenhum `server-only`, nenhum `import` de serviço. Tudo o que
entra nas três funções é argumento.

### O `lib/mes.ts` apareceu no caminho

A A3 precisa escrever "maio" dentro de uma frase. `rotuloDeMes` existia dentro
de `SeletorDeMes.tsx` — um **componente de cliente, na feature de upload** — e
já era importado por quatro telas, três delas fora do upload.

O comparativo seria o quinto consumidor e o primeiro puro: um `.ts` testado
pelo Vitest passando a depender de um `.tsx` de outra feature para escrever o
nome de um mês. Movido para `lib/`, com `nomeDoMes` e `anoDoMes` novos. Os
cinco arquivos mudaram só a linha do `import`.

## Por que as três juntas

São a fase inteira, e são a mesma decisão vista de três distâncias: o mês (A1),
o pote (A2) e a série de meses (A3). Planejar em separado repetiria três vezes
a discussão de qual número autoriza qual frase.

## A régua herdada, agora com o `emReais`

Toda frase sai daqui pronta, com o valor já formatado por `lib/dinheiro.ts` —
não `{ valor: 210000 }` para o componente montar a frase. É a mesma escolha do
`avisoDeApagar` da spec 05: se a frase se monta no `.tsx`, ela perde o teste no
mesmo instante.

---

## O limiar de cobertura mora em `cobertura.ts`, não no veredito

O degrau 1 da A1 e o corte da média da A3 fazem **a mesma pergunta**: dá para
confiar nos números deste mês? Escrita duas vezes, ela vira dois limiares que
divergem no primeiro ajuste — e o app passaria a mandar revisar um mês que ele
mesmo aceitou na média.

`cobertura.ts` já é o dono do conceito. Ganha:

```ts
export const COBERTURA_CONFIAVEL_PCT = 90;
export function coberturaConfiavel(cobertura: Cobertura): boolean;
```

⚠ **Olha só `saiuPct`.** A entrada é outro assunto: a spec 04 mediu cobertura
muito mais baixa no que entra do que no que sai, e a assimetria é estrutural —
renda quase não é classificada, e o veredito não fala de renda classificada,
fala de renda **declarada**. Exigir cobertura de entrada travaria todo mês no
degrau 1, para sempre.

⚠ **`saiuPct === null` (nada saiu) não é confiável nem inconfiável** — é um mês
sem gasto, e quem trata disso é a A1, devolvendo `null` antes de perguntar.
`coberturaConfiavel` devolve `false` para ele, e a A1 nunca chega a consultá-lo.

É a sétima vez neste projeto que uma regra escrita duas vezes vira código
próprio — aqui ela nem precisa de arquivo novo, só de morar no dono certo.

---

## A1 — `veredito.ts`

```ts
export type GrauDoVeredito = "revisar" | "renda" | "pote" | "dentro";
export type Veredito = { grau: GrauDoVeredito; frase: string };

export function vereditoDoMes(mes: {
  cobertura: Cobertura;
  rendaDeclaradaCentavos: number | null;
  saiuCentavos: number;
  potes: PoteNoVeredito[];
}): Veredito | null;
```

`PoteNoVeredito` é estrutural — `{ nome, emoji, totalCentavos, metaCentavos,
lancamentos }` —, satisfeito por `PoteNoPainel` + `MetaDoPote` sem `import`
nenhum, do mesmo jeito que `CategoriaComPote` em `somarOMes.ts`.

### Dois silêncios antes do primeiro degrau

**Sem renda declarada → `null`.** Está na spec: sem meta não há dentro nem fora,
e o `CampoDeRenda` já cobra isso no topo. Duas cobranças pela mesma coisa fazem
a pessoa ignorar as duas.

**Nada saiu no mês → `null`.** Não está na spec, e apareceu montando a ordem: um
mês sem gasto nenhum cairia no degrau 4 e o app diria *"o mês fechou dentro do
plano"*. Seria o app elogiando o Davi por um extrato que ele ainda não subiu.

### A ordem, que é a funcionalidade

| # | `grau` | Condição | Constante |
|---|---|---|---|
| 1 | `revisar` | `!coberturaConfiavel(cobertura)` | `COBERTURA_CONFIAVEL_PCT` |
| 2 | `renda` | `saiuCentavos > renda × fator` | `FATOR_DE_RENDA_DESTOANTE = 1.3` |
| 3 | `pote` | existe pote cujo excesso passa o piso | `EXCESSO_RELEVANTE_DA_RENDA = 0.05` |
| 4 | `dentro` | nenhum dos acima | — |

Constantes nomeadas e exportadas no topo do arquivo, como manda a tarefa: elas
vão ser ajustadas quando houver mais meses, e quem ajusta precisa achá-las.

### O degrau 2 pergunta — e o número que ele mostra não é o que se espera

Pendência 2, decidida: *"Saiu R$ 12.400 este mês, bem acima da renda declarada
de R$ 4.000. A renda mudou?"* — pergunta, não acusa.

⚠ **A frase mostra os dois números, nunca o múltiplo.** "3,1× a sua renda" é uma
frase de manchete: ela já carrega o julgamento que a pergunta estava tentando
evitar.

### O degrau 3 escolhe pelo dinheiro, não pela porcentagem

A descoberta 2 mediu um pote em várias vezes a meta. Escolhido por razão, o
vencedor seria sempre o pote de meta menor — e sete vezes uma meta pequena pode
ser menos dinheiro do que uma vez e pouco da maior. **O pote que destoa é o que
gastou mais reais acima da meta**, porque o veredito responde *"onde foi o
mês"*, e o mês vai embora em reais.

O piso é 5% **da renda declarada**, não um valor fixo em reais. Um piso fixo
seria certo para uma renda e ridículo para outra, e este app já é multiusuário.

### O degrau 4 tem duas frases, e é de propósito

*"Nenhum pote passou da meta"* é uma frase; *"o mês fechou perto do plano —
nenhum pote destoou"* é outra. Cair no degrau 4 com três potes 8% acima e dizer
a primeira seria mentira medida. O `grau` continua um só; o texto distingue.

### Casos do teste

- sem renda → `null`; nada saiu → `null`
- cobertura em 89 e em 90 (a fronteira exata, dos dois lados)
- cobertura baixa **com** pote estourado → sai `revisar`, e é a prova de que o
  degrau seguinte nunca é consultado
- gasto em 1,3× a renda exato → não dispara; 1,31× → dispara
- dois potes acima, e o de maior razão **não** é o escolhido
- pote acima da meta por menos de 5% da renda → cai para `dentro`
- pote `sem-meta` (`metaCentavos === null`) nunca é candidato — descoberta 3
- pote negativo nunca é candidato

---

## A2 — `insightDoPote.ts`

```ts
export function insightDoPote(
  pote: PoteComCategorias,
  meta: Pick<MetaDoPote, "metaCentavos">,
): string | null;
```

Duas metades, coladas por `" · "` quando as duas existirem:

1. **a distância da meta, em dinheiro** — `R$ 2.100 acima da meta` /
   `R$ 300 abaixo`. É a metade que existe porque 708% não cabe numa barra, mas
   cabe numa frase;
2. **a categoria que domina** — `Gasolina é 51% dele`, quando a maior categoria
   passa de `CONCENTRACAO_DOMINANTE = 0.5`.

   ⚠ **Mudou na execução.** O plano dizia `é mais da metade dele`. "Mais da
   metade" é verdade para 51% e para 84%, e as duas coisas não são a mesma:
   escondendo o número, a frase entregaria menos do que a barra ao lado dela.
   O limiar decide **se** a frase sai; o número decide **o que** ela diz.
   100% vira `tudo em Gasolina`, e 99,6% não vira 100 — mesma régua da
   cobertura.

### Os quatro `null`

| Quando | Por quê |
|---|---|
| `metaCentavos === null` | Descoberta 3. Não é um pote que fechou dentro; é um pote que não tem dentro |
| `lancamentos === 0` | A `legendaDoPote` já diz "nada caiu aqui" |
| `totalCentavos < 0` | Reembolso maior que o gasto. "R$ 400 abaixo da meta" seria verdade aritmética e mentira de sentido |
| meta `<= 0` | Renda declarada zerada — é o infinito por cento da descoberta 3 chegando por outro caminho |

⚠ **`estadoDoPote` não é chamado aqui.** Ele responde à barra, com cinco estados
e uma ordem própria; o insight tem quatro recusas, e uma delas (`meta <= 0`) ele
não conhece. Reusá-lo amarraria a frase à barra e faria as duas mudarem juntas
para sempre — o que a tarefa já proíbe para a `legendaDoPote`, pelo mesmo
motivo.

### O pote de renda inverte o sentido, não o texto

Num pote de gasto, acima da meta é ruim; num de renda, é bom. A frase não sabe
disso e não deve saber — *"R$ 800 acima do previsto"* serve aos dois. É a régua
da spec 04 outra vez: **sinal, não julgamento**. O que muda é a palavra `meta` →
`previsto` para `tipo: "renda"`, porque meta de renda soa a cobrança.

### Casos do teste

- concentração em 50% exato (não dispara) e em 51% (dispara) — a fronteira que a
  descoberta 4 mediu
- pote com uma categoria só: 100%, dispara
- as duas metades juntas, e cada uma sozinha
- empate na maior categoria: a primeira ganha, e o teste fixa isso para a frase
  não oscilar entre renders
- os quatro `null`

---

## A3 — `comparativo.ts`

```ts
export type MesNoHistorico = {
  mes: string;                       // "2026-06"
  coberturaSaiuPct: number | null;
  potes: { poteId: string; totalCentavos: number }[];
};

export type LinhaDoComparativo = {
  poteId: string;
  esteMesCentavos: number;
  mediaCentavos: number;
  diferencaCentavos: number;         // este mês − média
};

export type Comparativo =
  | { pode: false; motivo: "primeiro-mes" | "anteriores-descartados";
      descartados: number }
  | { pode: true; mesesNaMedia: number; frase: string;
      linhas: LinhaDoComparativo[] };

export function compararMeses(
  historico: MesNoHistorico[],
  mesAtual: string,
): Comparativo;
```

### `"anteriores-descartados"` é a razão de este tipo ter dois motivos

Com três meses no banco e todos os anteriores mal classificados, dizer *"volte
quando tiver dois meses"* seria falso — eles existem. A tela precisa poder dizer
*"há 2 meses aqui, e nenhum classificado o bastante para comparar"*, que é uma
frase **acionável**: ela manda para a `/revisao`, não para o `/upload`.

### A média ignora mês de cobertura baixa — e a frase diz quantos sobraram

`frase` sai daqui pronta: `"média de 3 meses"` e, no caso de um só,
**`"comparado com maio"` — a palavra "média" não aparece**. É o risco nomeado na
spec: com um mês anterior, "a média" é aquele mês, e chamar isso de média seria
a tela dando peso estatístico a uma amostra de um.

### Um pote sem gasto em nenhum mês continua na lista, com zero

Mesma lição da B5 da spec 05: a lista de potes não pode nascer dos dados, ou o
pote que ninguém usou some da comparação — e sumir é exatamente o que se quer
enxergar num comparativo. A lista sai da união dos `poteId` de todos os meses
considerados **mais** o mês atual, e ausente vira `0`.

### Casos do teste

- histórico com um mês só → `primeiro-mes`, `descartados: 0`
- dois anteriores, ambos abaixo do limiar → `anteriores-descartados`,
  `descartados: 2`
- um anterior confiável → `mesesNaMedia: 1`, e a frase **sem** a palavra "média"
- `coberturaSaiuPct: null` num anterior → descartado
- o mês atual sai da própria média mesmo aparecendo no histórico
- pote ausente num dos meses entra com zero e puxa a média para baixo
- média arredondada para inteiro (centavos são inteiros em todo o projeto)

---

## Riscos deste plano

**As três funções decidem texto sem ver tela.** É o ponto, e o custo é que uma
frase pode ficar tecnicamente certa e estranha de ler. É exatamente para isso
que a fase B mostra os quatro vereditos lado a lado antes de qualquer
integração.

**Os limiares são chutes honestos.** 90% de cobertura, 1,3× de renda, 5% de
excesso, 50% de concentração — nenhum deles saiu de dados, porque só há um mês
fechado. Estão nomeados, exportados e num lugar só; o segundo extrato do Davi é
que vai dizer se algum está errado.
