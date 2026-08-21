# Plano — D3 · `/revisao` lê os pendentes de verdade

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D3 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Arquivos:** `revisar-lancamento/pendentes.ts` (+ teste),
`listarPendentes.service.ts`, `categorias.ts`, os quatro componentes da fase B,
`app/(app)/revisao/page.tsx`

## O que é

A tela da fase B para de mostrar dado inventado e passa a ler o banco, filtrada
por `user_id`, com as sugestões reais da A4.

## O andaime sai junto

`dadosFalsos.ts` e `Andaime.tsx` foram apagados, e o `?estado=` da rota também.

Não é limpeza cosmética: deixar os dois convivendo garante que um dia alguém vê
o falso achando que é o real. O protótipo cumpriu o papel dele — o portão foi
aprovado — e agora ele é risco, não ferramenta.

## As categorias passam a vir do banco, e isso não é detalhe

Até agora a lista saía de `POTES_PADRAO`. Serve para um protótipo e **guardaria
o id errado**: o seed é o molde, e o que a D4 vai gravar é o `uuid` da linha da
conta do usuário.

A cor também sai do banco (`buckets.cor`) em vez do token do Tailwind, para a
fase 2 poder deixar o usuário mudá-la sem a tela parar de refletir.

## A consulta tem uma cláusula que é fácil esquecer

Dois tipos de pendência caem nesta tela:

- **sem categoria** — nenhuma regra bateu, você escolhe;
- **`revisao_pendente`** — par que se anula (spec 02) ou valor alto que uma
  regra classificou (D1), e você confirma.

Só que **excluído também tem categoria nula**. Sem uma terceira cláusula, o
pagamento de fatura entraria na fila de decisão — e ele não pede decisão
nenhuma, é justamente o que a spec 02 já resolveu.

## Dois tipos de pendência, duas perguntas diferentes

Um lançamento sem categoria pergunta **"onde isto vai?"**. Um com categoria
pergunta **"está certo?"**, mostra a categoria que a regra escolheu e o texto
que ela procurou, e só então oferece trocar.

Tratar os dois iguais perderia o trabalho que o motor fez e faria você escolher
categoria de novo para algo que já tem uma.

## A pergunta "sempre classificar assim?" **não** aparece ainda

Ela só faz sentido depois de você escolher, e escolher é a D4. Mostrá-la agora
diria "guardado em…" sem nada ter sido guardado — a tela mentindo de novo,
exatamente o que a D6 da spec 02 consertou.

O `trecho` e o `pegaJunto` já vêm calculados, prontos para a D5.

## O histórico das sugestões tem teto

A fonte "você já classificou assim" (A4) precisa de memória, não do arquivo
inteiro. Numa conta de dois anos, carregar tudo para sugerir três botões seria
caro e não melhoraria o palpite.

## Medido contra o banco de verdade

| | |
|---|---|
| Categorias oferecidas | 25 (22 de gasto + 3 de renda) |
| Pendentes na conta do Davi | 32 |
| Já classificados por regra | 0 — o seed é a D7 |
| Com alguma sugestão | 3 |
| **Sem trecho para virar regra** | **0** |
| Regras distintas que resolveriam os 32 | 22 |

Zero sem trecho confirma o que a A6 tinha medido: a pergunta da B3 sempre vai
poder aparecer.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nenhum pendente | Estado vazio com link para o painel |
| Categoria apagada mas ainda referida | A tela diz "categoria que não existe mais" em vez de quebrar |
| Conta sem regra nenhuma | Tudo pendente, tudo sem sugestão. É a verdade |
| Pagamento de fatura | Fora da fila |
| Descrição sem trecho | `trecho` nulo, `pegaJunto` zero |

## Fora do escopo

- Gravar a decisão e avançar → D4
- Criar a regra → D5
- "Voltar" desfazer → D6

## Critério de pronto (da Etapa 2)

- [ ] A tela lê do banco, filtrada por `user_id`
- [ ] Com as sugestões reais da A4
