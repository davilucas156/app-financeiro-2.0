# Tarefas — Comparativo anual

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/12-comparativo-anual.md`, aprovada pelo Davi
**Status:** ✅ as cinco fases entregues. Falta o Davi dizer se oito cartões antes das barras é resumo ou muro, e se o aviso de janeiro basta.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A ordem: primeiro o que se prova sem tela, depois a tela

A spec 12 não tem tarefa de banco e não tem tarefa de back-end nova. Ela tem
**duas contas** e **três mudanças de navegação**, e as duas contas se provam com
Vitest antes de existir pixel.

Daí as fases:

1. **Fase A — as duas contas.** Recortar o histórico por ano, e transformar o
   histórico de um ano em cartões. ⚠ **Nada da fase A muda a tela**: ela sobe com
   as funções escritas, testadas e **ainda não chamadas por ninguém**. Se ela
   estiver certa, o app fica idêntico — como a fase A da spec 10.
2. **Fase B — a fileira vira abas.** Extrair, acrescentar a aba, mostrar nas duas
   telas.
3. **Fase C — o ano na `/comparativo`.** O `?ano=`, o seletor e o aviso de janeiro.
4. **Fase D — os cartões na tela.**
5. **Fase E — a conferência entre as duas metades.**

⚠ **A fase B é conferível sozinha**, e é por isso que ela vem antes do ano: com
a aba entregue e o recorte ainda não ligado, a `/comparativo` continua a de hoje
e a única diferença visível é a aba nova. Erro de extração aparece ali, sem um
segundo assunto para confundir a leitura.

## Nenhuma migration, nenhuma consulta nova

A Descoberta 3 da spec: `historicoDosMeses` já devolve mês a mês por pote, que é
tudo que os cartões precisam. **Zero SQL novo, zero coluna, zero migration.**

⚠ **E nenhuma consulta a mais na `/comparativo`.** Ela já chama
`historicoDosMeses` e `dadosDoPainel`. As duas continuam sendo duas.

⚠ **`dashboard/page.tsx` continua proibida de chamar `historicoDosMeses`.** O
comentário lá é explícito — era metade do custo da página. O recorte por ano do
painel se faz sobre `coberturaDosMeses`, que é a consulta barata que ela já faz.

## Reuso antes de criação

| O que                          | Onde                             | Para quê aqui                                             |
| ------------------------------ | -------------------------------- | --------------------------------------------------------- |
| `compararMeses`                | `comparar-meses/comparativo.ts`  | **Não muda.** O recorte é filtrar o array antes de chamar |
| `mediaDoComparativo`           | `comparar-meses/comparativo.ts`  | **Não muda.** Mesmo motivo                                |
| `SeletorDeMeses`               | dentro de `TopoDoMes.tsx`        | É a fileira de abas; sai de lá inteira na B1              |
| `anoDoMes`                     | `lib/mes.ts`                     | Já existe, já testada. O recorte inteiro se apoia nela    |
| `nomeDoMes`                    | `lib/mes.ts`                     | A linha mês a mês do cartão                               |
| `emReais`                      | `lib/dinheiro.ts`                | Os dois números do cartão                                 |
| `estiloDoPote`                 | `aparencia/tema/estiloDoPote.ts` | A cor do cartão, como já faz a barra                      |
| `Card`, `SectionTitle`         | `components/ui/`                 | Os cartões e o título                                     |
| `grid-cols-3 divide-x` do topo | `TopoDoMes.tsx`                  | O molde da grade que cabe em 360px                        |

---

## Fase A — as duas contas

### ✅ A1 · Recortar o histórico por ano `INFRA`

Um módulo puro que responde três perguntas: **quais anos a conta tem**, **quais
meses são de um ano**, e **qual ano abrir por padrão**.

- Vive em `painel/comparar-meses/`, junto de quem vai usá-lo.
- Genérico sobre `MesComCobertura`, para servir tanto ao histórico caro
  (`MesNoHistorico`) quanto à cobertura barata do painel.
- O ano padrão é o do mês de referência; ano inválido ou inexistente na conta cai
  no padrão, **nunca em consulta vazia** — a mesma disciplina do `mes` da
  `dadosDoPainel`.

**Pronto quando:** os testes cobrem conta sem mês nenhum, conta de um ano só,
conta que atravessa a virada, `?ano=` inventado, `?ano=` de um ano sem mês, e
`?ano=<script>`.

### ✅ A2 · O cartão de um pote no ano `INFRA`

A função que transforma o histórico **já recortado** em um cartão por pote:
total do ano, média mensal, quantos meses entraram na média, e a série mês a mês
com a marca de confiável.

- Um por pote de gasto, **na ordem que o histórico entregou** — pote zerado
  aparece com R$ 0,00 e não some (lição da B5 da spec 05, já citada no
  `historicoDosMeses`).
- ⚠ **A média divide pelos meses com dado, não por 12** (pendência 3 da spec).
- ⚠ **Meses pouco classificados entram no total** — eles existem — **e vêm
  marcados**, para a tela poder dizer.

**Pronto quando:** os testes cobrem ano sem mês, ano com um mês, pote zerado o
ano inteiro, mês pouco classificado no meio, e um caso em que o total do cartão
tem de bater exatamente com a soma da série.

---

## Fase B — a fileira vira abas

### ✅ B1 · Extrair a fileira para pasta própria `FRONT-VISUAL`

`SeletorDeMeses` sai de dentro do `TopoDoMes.tsx` e vira
`painel/navegar-entre-meses/AbasDoPainel.tsx`, **sem mudar de aparência**.

⚠ Ela deixou de ser "o topo do painel" e virou navegação de duas telas. Deixá-la
onde está faria a `/comparativo` importar o componente que desenha
entrou/saiu/diferença para desenhar uma linha de abas.

**Pronto quando:** o painel está idêntico ao pixel, e `TopoDoMes.tsx` não
desenha mais aba nenhuma.

### ✅ B2 · A aba do comparativo entra na fileira `FRONT-VISUAL`

O último item da fileira é `📊 Comparativo`, visualmente distinto dos meses e
separado deles.

- ⚠ **Some quando a conta tem um mês só** — mesma decisão da
  `ChamadaDoComparativo`, e pelo mesmo motivo escrito lá.
- Ela leva o ano do mês que está sendo visto.
- O `aria-label` da `nav` deixa de ser "Mês do painel": ela não navega mais só
  entre meses.

**Pronto quando:** a aba aparece com dois meses, não aparece com um, e o mês
atual continua sendo o único marcado enquanto se está no painel.

### ✅ B3 · A fileira aparece na `/comparativo` `FRONT-INTEGRADO`

A mesma fileira, no topo da `/comparativo`, com a aba do comparativo marcada e
nenhum mês marcado.

⚠ **Aba que existe numa tela só é link, não aba** (pendência 7). É esta tarefa
que faz o pedido do Davi ser o que ele pediu.

**Pronto quando:** as duas telas mostram a mesma fileira; tocar num mês a partir
da `/comparativo` leva ao painel naquele mês; a `← Painel` continua ali.

---

## Fase C — o ano na `/comparativo`

### ✅ C1 · A tela passa a ser de um ano `FRONT-INTEGRADO`

A rota lê `?ano=`, valida pela A1 e recorta o histórico antes de chamar
`compararMeses`.

⚠ **`compararMeses` não muda** (Descoberta 2). Se ela precisar mudar, o desenho
está errado.

⚠ **A `ChamadaDoComparativo` do painel recorta junto**, filtrando `cobertura`
pelo ano de `dados.mes` antes de `mediaDoComparativo`. As duas compartilham a
função desde a spec 09 exatamente para não poderem divergir; recortar num lugar
só quebraria isso.

**Pronto quando:** as barras, a média e a frase são todas do ano escolhido, e as
etiquetas largam o `/26` sozinhas.

### ✅ C2 · O seletor de ano, e o aviso de janeiro `FRONT-VISUAL`

O seletor lista só anos que têm mês, e **não aparece quando há um ano só**
(pendência 8) — controle de uma opção promete escolha que não existe.

⚠ **O aviso de janeiro é o preço da spec, e ele é dito na tela.** Num ano com
menos de dois meses classificados, a média se cala e a tela diz **"2027 ainda tem
1 mês — veja 2026"**, com o link. Sem isso, quem virou o ano com um ano inteiro
de dado atrás vê uma tela que parece quebrada.

**Pronto quando:** conta de um ano não mostra seletor; conta de dois mostra os
dois e troca tudo de uma vez; o primeiro mês de um ano novo mostra o aviso com o
link para o ano anterior.

---

## Fase D — os cartões

### ✅ D1 · O cartão, visual `FRONT-VISUAL`

Grade de duas colunas a 360px. Cada cartão: emoji e nome do pote, **total do ano**
como número grande, **média mensal com quantos meses** embaixo, e a linha mês a
mês com ⚠ nos pouco classificados.

⚠ **Os dois números, sempre** (pendência 2). Não existe regra confiável para
escolher entre total e média, e não é preciso escolher.

⚠ **A linha mês a mês usa `text-3xs`, e ela vai apertar em "Maior".** É a mesma
lição da fase E da spec 10: medir em `em` desde já, e não descobrir depois.

**Pronto quando:** oito cartões cabem a 360px sem estourar; um cartão com valor
de seis dígitos não quebra a grade; nenhum `text-[Npx]` cravado (o teste da spec
10 reprova).

### ✅ D2 · Os cartões na tela, com dado de verdade `FRONT-INTEGRADO`

Ligar a A2 na `/comparativo`, acima das barras.

**Pronto quando:** os cartões aparecem com um mês só; um pote zerado no ano
aparece com R$ 0,00; trocar de ano troca os cartões junto com as barras.

---

## Fase E — a conferência

### ✅ E1 · Os cartões e as barras têm de contar a mesma história `INFRA`

Um teste que soma a série do cartão e a série da barra do mesmo pote no mesmo ano
e exige que batam.

⚠ **É a conferência que o `formatos-de-extrato.md` chama de independente.** Os
dois números saem do mesmo array, então nada garante que continuem saindo depois
de alguém mexer em um dos dois lados. Somar o que a própria função leu não prova
nada; comparar duas leituras diferentes do mesmo dado, prova.

**Pronto quando:** o teste passa, e `comparativo.test.ts` passa **sem uma linha
alterada** — a prova de que o recorte não tocou no que já funcionava.

### ✅ E2 · Fechar os documentos `INFRA`

`references/estado-do-projeto.md`: a linha da `/comparativo`, e **tirar do
backlog** os 6 cartões do Comparativo Anual, que estavam em "não está em spec
nenhuma, e talvez devesse" desde a spec 06.

**Pronto quando:** nenhum documento ainda promete os cartões como dívida.
