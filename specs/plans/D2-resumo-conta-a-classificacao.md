# Plano — D2 · O resumo do upload conta a classificação

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D2 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `enviar-extrato/resumoDaImportacao.ts` (+ teste),
`ResumoDaImportacao.tsx`, `FormularioDeEnvio.tsx`

## O que é

Depois de enviar o extrato, o resumo passa a dizer o que o motor fez — e o que
sobrou para você.

## O número que a tarefa pedia estava incompleto

A Etapa 2 escreveu: *o resumo diz "30 classificados · 17 para decidir"*.

Só que **17 não é o que te espera em `/revisao`**. Contando o mês medido:

| | Quantos | Por quê |
|---|---|---|
| Nenhuma regra bateu | 17 | Você escolhe a categoria |
| Par que se anula | 4 | Da spec 02: você decide se anula mesmo |
| Classificado, mas valor alto | 2 | Da D1: a regra bateu, e você confirma |
| **Total que pede sua atenção** | **23** | |

Mostrar 17 e mandar você para uma tela com 23 é mentir por omissão — o mesmo
problema que a D6 da spec 02 acabou de consertar em duas telas. Então o número
grande é **23**, e a composição aparece logo abaixo.

## Os três números do topo

| Rótulo | Mês medido |
|---|---|
| Importados | 54 |
| Classificados | 30 |
| Para decidir | 23 |

Os dois últimos **se sobrepõem em 2** — os de valor alto foram classificados e
ainda assim pedem confirmação. Em vez de esconder isso escolhendo um dos dois,
o cartão de valor alto diz a sobreposição em palavras.

## Três cartões de explicação, um por tipo de pendência

Cada número que pede ação vem com uma frase que diz o que fazer com ele. "23
para decidir" sem dizer de quê é um número que gera desconfiança, não ação —
mesma régua das linhas ignoradas na spec 02.

## "Tudo classificado" não vira link

Quando não sobra nada, o resumo diz que acabou e **não** oferece o botão. Mandar
alguém para uma tela vazia depois de dizer "tudo pronto" é a definição de
caminho inútil.

## A conta fica num módulo puro

`ResumoDaImportacao.tsx` é componente, e o Vitest só olha `.ts`. A composição de
"para decidir" é exatamente o tipo de soma que ganha uma parcela nova daqui a
dois meses e ninguém percebe.

Mesmo movimento de `exibirEnvio.ts` na spec 02.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nada para decidir | "Tudo classificado", sem botão |
| Conta sem regra nenhuma (hoje) | 0 classificados, tudo para decidir. É a verdade |
| Arquivo já importado | O resumo não aparece — como antes |
| Só um dos dois arquivos | Os números são do que entrou, não do mês inteiro |

## Fora do escopo

- `/revisao` ler os pendentes → D3
- O painel parar de pedir classificação → D8

## Critério de pronto (da Etapa 2)

- [ ] O resumo diz quantos foram classificados e quantos faltam decidir
- [ ] Link para `/revisao`
- [ ] Mês em que tudo bateu diz "tudo classificado" e não manda para tela vazia
