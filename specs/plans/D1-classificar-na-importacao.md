# Plano — D1 · Classificar dentro da importação

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D1 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK
**Arquivos:** `classificacao/classificar-importacao/classificarImportacao.ts`
(+ teste) e `upload/importar-extrato/importarExtrato.service.ts`

## O que é

O motor da fase A passa a rodar **dentro da transação da importação**, depois do
preparo da spec 02. Quem bate regra nasce classificado; o resto nasce pendente.

## A parte que decide fica **fora** do `server-only`

`importarExtrato.service.ts` é `server-only` — o Vitest não chega nele. Se a
decisão de classificação morasse lá dentro, ela seria a única peça do motor sem
teste, justamente a que junta todas as outras.

Então a decisão sai num módulo puro, como `exibirEnvio.ts` fez na spec 02. O
serviço lê as regras, chama, e grava.

**E o harness da A6 passa a usar esse mesmo módulo.** Hoje ele reimplementa o
que a D1 faz — as duas versões podiam divergir e a medição continuaria verde,
medindo código que ninguém executa. Depois desta tarefa, a medição contra os
arquivos reais mede o caminho de produção.

## O valor alto entra aqui, e a Etapa 2 tinha esquecido dele

A spec resolveu a pendência 4 — "valor alto passa pela sua vista mesmo quando
uma regra bateu, R$ 200" — mas a quebra em tarefas **não deu tarefa nenhuma a
isso**. Falha minha na Etapa 2.

O lugar dele é aqui: é o motor rodando na importação. Represento reusando o
que já existe, sem inventar coluna:

- `categoria_id` preenchido (a regra bateu mesmo)
- `status = 'revisao_pendente'`
- `motivo` dizendo por quê

`/revisao` já vai ter de lidar com `revisao_pendente` por causa dos pares que
se anulam (spec 02). São dois tipos de pendência, e a diferença é visível: um
não tem categoria e pede escolha, o outro tem categoria e pede confirmação.

## Falha no motor derruba a importação inteira

A alternativa seria importar mesmo assim, tudo pendente. Parece gentil e é pior:
**motor quebrado fica idêntico a motor sem regras.** Você veria 54 pendentes e
concluiria que não tem regra cadastrada, quando na verdade tem um bug.

Tudo na mesma transação, tudo ou nada. Erro barulhento, como o resto.

## O motor só roda no que a spec 02 deixou como `normal`

Excluído (pagamento de fatura) e par que se anula já foram resolvidos antes, e
não são decisão de categoria. É exatamente o recorte da medição da A6 — o que
faz o número da D1 poder ser comparado com o dela.

## Hoje o resultado vai ser 0 classificados, e está certo

A conta do Davi ainda não tem regra nenhuma: o seed é a **D7**. Até lá, a D1
funciona e classifica zero.

Por isso a verificação de verdade é o harness da A6, que injeta as regras da A5
e mede contra os arquivos reais. Se a D1 estiver certa, ele continua dando
**30 classificados e 17 pendentes** — agora medindo o código de produção.

## Colunas gravadas quando uma regra bate

| Coluna | Valor |
|---|---|
| `categoria_id` | o destino da regra |
| `classificado_por` | `regra` |
| `regra_id` | qual |
| `regra_chave` | o texto que ela procurava, **congelado** |
| `classificado_em` | agora |

A chave congelada é o que faz a resposta sobreviver ao apagar da regra (C3).

## Edge cases

| Situação | Tratamento |
|---|---|
| Conta sem regra nenhuma | Tudo pendente. É o normal de quem começou ontem |
| Regra apontando para categoria apagada | Não existe: a C1 cascateia |
| Duas regras batem | A A1 desempata: prioridade, depois termo mais longo, depois id |
| Lançamento excluído ou par | Motor não roda nele |
| Valor ≥ R$ 200 com regra batendo | Classificado **e** marcado para conferir |
| Motor lança exceção | Transação inteira volta atrás |

## Fora do escopo

- O resumo dizer "30 classificados · 17 para decidir" → D2
- `/revisao` ler os pendentes → D3
- Semear as regras do Davi → D7

## Critério de pronto (da Etapa 2)

- [ ] O motor roda na mesma transação, depois do preparo
- [ ] Quem bate regra nasce classificado; o resto nasce pendente
- [ ] Falha no motor não deixa a importação pela metade
