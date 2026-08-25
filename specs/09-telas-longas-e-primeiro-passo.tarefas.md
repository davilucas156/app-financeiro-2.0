# Tarefas — Telas longas e o primeiro passo

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/09-telas-longas-e-primeiro-passo.md`
**Status:** as três partes entregues e no ar. Falta o Davi dizer se o painel
mais curto melhorou, ou se ele sente falta do comparativo ali embaixo.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## Três partes independentes, e a ordem é a do risco de arrependimento

Nada aqui depende de nada. As três podem subir separadas, e é bom que possam:
se a Parte 1 ficar ruim, ela volta sem levar as outras junto.

A ordem abaixo é a do **risco**, não a do esforço:

1. **A Parte 1 mexe no que o Davi já usa.** Tirar o comparativo do painel é a
   única mudança desta spec que pode piorar a vida de alguém — ele acabou de
   ganhar aquilo. Vai primeiro, para ele reclamar cedo.
2. **A Parte 2 mexe numa tela que ele visita pouco.** Errar ali custa um toque
   a mais.
3. **A Parte 3 não mexe em nada** — é tela nova. Vai por último porque é a que
   mais depende de texto, e texto se escreve melhor depois que o resto está no ar.

## Nenhuma migration, nenhuma consulta nova

As três partes são front-end. O `historicoDosMeses.service.ts` já devolve a
conta inteira, a `listarParaGerir` já devolve os nove potes com as categorias, e
o passo a passo é texto.

⚠ **A única exceção é a `dashboard/page.tsx`**, que hoje busca o histórico para
desenhar o comparativo. Quando ele sair, a busca sai junto — e é isso que faz o
painel ficar **mais rápido**, não só mais curto.

## Reuso antes de criação

| O que | Onde | Para quê aqui |
|---|---|---|
| `SecaoDoComparativo` | `painel/comparar-meses/` | Vai inteira para a tela nova, sem reescrever |
| `compararMeses`, `historicoDosMeses` | idem | A tela nova chama os mesmos dois |
| O `← Painel` da `/categorias` | `categorias/gerir-categorias/TelaDeCategorias.tsx` | O mesmo padrão de volta nas duas telas novas |
| `agruparParaGerir` | `categorias/gerir-categorias/categoriasNaTela.ts` | O agrupamento por pote já existe; a Parte 2 só o recolhe |
| `Card`, `SectionTitle`, `EstadoVazio` | `components/ui/` | As duas telas novas |
| `references/formatos-de-extrato.md` | — | **A fonte da Parte 3.** O passo a passo descreve o arquivo que está medido ali, e não um que eu imagine |

⚠ **`/comparativo` e `/passos` não entram em `shell/rotas.ts`** — pendência 1. E
**entram** no `src/proxy.ts`: rota interna nova não é protegida sozinha.

---

## Parte 1 — O comparativo vira tela

### A1 ✅ · A rota `/comparativo`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `app/(app)/comparativo/page.tsx`, `src/proxy.ts`
**Pronto quando:** a tela existe, lê o histórico de verdade e tem o "← Painel".

⚠ **Sem seletor de mês** (pendência 2). O painel é sobre um mês; esta tela é
sobre todos.

⚠ **`compararMeses` precisa de um "mês atual" para recortar a série.** Aqui ele
não vem da URL: é o **mês mais recente da conta**, e a tela diz qual é. Sem
dizer, "este mês contra a média" vira uma comparação sem sujeito.

### A2 ✅ · O painel encolhe, e o caminho fica onde estava
**Camada:** FRONT-INTEGRADO
**Arquivos:** `painel/painel-do-mes/TelaDoPainel.tsx`,
`app/(app)/dashboard/page.tsx`
**Pronto quando:** o painel termina nos potes, com um bloco curto levando ao
comparativo — e **não busca mais o histórico**.

⚠ **O bloco não é só um link.** Ele leva a frase que a `compararMeses` já
produz ("comparado com maio", "a média de 3 meses"), porque uma linha de
resultado é o que faz alguém tocar. Um "Ver comparativo →" sozinho é um botão
que ninguém aperta.

✅ **Resolvido assim:** `mediaDoComparativo` virou export próprio de
`comparativo.ts`, e pede só `{ mes, coberturaSaiuPct }`. O painel a chama com o
`coberturaDosMeses.service.ts` — uma consulta sem `join` nenhum, que já existia
dentro do `historicoDosMeses` e agora é chamada pelos dois. A soma por pote,
que era a parte cara, saiu do painel.

⚠ **A frase mudou de texto junto.** Era "média de 3 meses"; virou "comparado
com a média de 3 meses", porque agora ela é lida depois do nome de um mês nos
dois lugares. "Julho/2026 média de 3 meses" não é uma frase.

### A3 ✅ · O estado de um mês só
**Camada:** FRONT-VISUAL
**Pronto quando:** com um mês na conta, o painel **não** mostra o bloco e a
`/comparativo` explica por quê.

Hoje a `SecaoDoComparativo` já tem os três estados. O que muda é que um deles
passa a decidir se o bloco do painel aparece: oferecer "ver comparativo" para
quem tem um mês só é oferecer uma tela vazia.

---

## Parte 2 — As categorias se recolhem

### B1 ✅ · O pote vira um botão que abre e fecha
**Camada:** FRONT-VISUAL
**Arquivo:** `categorias/gerir-categorias/TelaDeCategorias.tsx`
**Pronto quando:** os nove potes aparecem recolhidos, com a contagem, e abrem
ao toque.

⚠ **Recolher não é esconder** — descoberta 2. Os nove continuam listados,
inclusive os vazios, e o pote sem categoria nenhuma diz isso na própria linha.
Derivar a lista das categorias faria o pote vazio sumir da única tela onde daria
para criar uma dentro dele. É a B5 da spec 05, e ela não expira.

⚠ **A contagem fica no cabeçalho.** Recolhido, ele é a única informação que
sobra — e "4 categorias" é o que decide se vale abrir.

### B2 ✅ · Criar categoria continua funcionando com o pote recolhido
**Camada:** FRONT-INTEGRADO
**Pronto quando:** criar uma categoria dentro de um pote **abre** aquele pote e
mostra a categoria nova.

✅ **Não havia o que quebrar, e vale registrar por quê.** O "+ Nova categoria"
mora **dentro** do corpo recolhível, então só é alcançável com o pote aberto. E o
`useState` do aberto/fechado mora no `PoteRecolhivel`, com `key={pote.id}`: a
revalidação do servidor depois de criar **não** remonta o componente, e o pote
continua aberto mostrando a categoria nova.

---

## Parte 3 — O primeiro passo

### C1 ✅ · A tela "Como pegar o extrato"
**Camada:** FRONT-VISUAL
**Arquivos:** `app/(app)/passos/page.tsx`,
`features/ajuda/pegar-o-extrato/PassoAPasso.tsx`, `src/proxy.ts`
**Pronto quando:** o passo a passo existe, numerado, e diz **Banco Inter antes
do passo 1**.

⚠ **A primeira linha é a ressalva, não o primeiro passo** — descoberta 3 e
pendência 6. O app entende dois formatos, os dois do Inter. Quem tem outro banco
precisa saber disso **antes** de ir buscar o arquivo, não depois de levar a
recusa.

⚠ **Os dois arquivos, e o porquê.** Extrato da conta **e** fatura do cartão. Sem
a fatura, o pagamento dela aparece como um gasto único de mil e poucos reais e
os gastos que ele representa não aparecem em lugar nenhum — o painel fica certo
na soma e mentiroso nos potes. É o que a conferência cruzada de
`formatos-de-extrato.md` mede, dito em uma frase.

⚠ **Sem captura de tela.** O app do banco muda de layout sozinho, e uma imagem
desatualizada é pior que texto: ela parece atual.

✅ **Desenhada já para o multibanco**, que o Davi anunciou junto com o "pode
seguir". `FORMATOS` ganhou um campo `banco`, e a lista de bancos da tela é
**derivada** dele — há teste afirmando isso. Consequências:

- escrever "aceitamos Inter" à mão viraria mentira nos dois sentidos: calada
  quando entrasse um banco, mentirosa quando saísse um;
- quando o primeiro formato novo entrar, o banco aparece na tela **sozinho**, e
  o que faltará é só escrever os passos dele;
- um banco sem passos escritos **não some**: aparece dizendo que o app lê o
  arquivo e que o caminho ainda não foi descrito. Silêncio ali faria a pessoa
  concluir que o banco dela não serve.

### C2 ✅ · Os três caminhos até ela
**Camada:** FRONT-INTEGRADO
**Arquivos:** `onboarding/concluir-onboarding/`, `app/(app)/dashboard/page.tsx`,
`app/(app)/upload/page.tsx`
**Pronto quando:** dá para chegar lá do primeiro acesso, do painel vazio e da
`/upload`.

⚠ **O terceiro é o que importa mais, e é o menos óbvio.** O gesto se repete uma
vez por mês; onze meses depois ninguém lembra o menu do banco. Um tutorial que
só existe no primeiro acesso não está lá na hora em que se precisa dele.

---

## Fase D — Deploy

### D1 ✅ · Publicar
**Camada:** INFRA
**Pronto quando:** `npx vercel deploy --prod --yes`, e o Davi diz se o painel
mais curto melhorou ou se ele sente falta do comparativo ali embaixo.

---

## Resumo

| Parte | Tarefas | Depende de |
|---|---|---|
| 1 — O comparativo vira tela | A1–A3 | nada |
| 2 — As categorias se recolhem | B1–B2 | nada |
| 3 — O primeiro passo | C1–C2 | nada |
| D — Deploy | D1 | o que estiver pronto |

A Etapa 3 (Plan) é feita **tarefa por tarefa**, não tudo de uma vez.

---

## A lição do defeito que veio junto

O seletor de meses ficou quebrado desde a spec 04 porque **a fase visual desenha
elementos que a fase de integração precisa promover, e ninguém anotou quais**.
Um `<span>` com borda, hover e alvo de toque de 44px parece pronto.

Não é uma tarefa desta spec; é uma coisa a lembrar na próxima fase B: **todo
elemento que parece clicável no protótipo tem de virar item da fase D, por
escrito.** Foi assim que o `?estado=` de protótipo virou tarefa própria na D1 da
spec 06 — a mesma disciplina, aplicada ao que fica.
