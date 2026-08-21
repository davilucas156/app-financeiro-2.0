# Plano — D7 · Seed das regras do Davi

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D7 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK
**Arquivos:** `motor/chaveDaRegra.ts` (novo), `motor/semente.ts`,
`classificacao/semear-regras/` (novo), `concluirOnboarding.service.ts`,
`criterioDaCorrecao.ts`, `decidirLancamento.service.ts`

## O que é

As 25 regras da A5 entram na conta do Davi. Sem isto, a D1 classifica **zero** —
o motor inteiro das fases A a D existe e não tem uma regra para aplicar.

## Um defeito de encaixe que só aparece agora

A C1 diz, no schema, que `(user_id, chave)` único **"impede o seed e a correção
de criarem duas regras para a mesma coisa"**. A D5 diz o mesmo do outro lado:
a chave é `descricao_contem:PETROBRAS`, *"na mesma forma que a A5 usa no seed"*.

Não é. A A5 gera `semente:descricao_contem:PETROBRAS:transporte/gasolina`.

São dois formatos, então a restrição de unicidade nunca dispara entre eles. Na
prática: corrigir um PETROBRAS respondendo "sempre" criaria uma **segunda**
regra para PETROBRAS, com destino diferente da primeira. As duas ficariam vivas,
as duas apareceriam na `/regras` da D9, e qual vence sairia do desempate da A1 —
prioridade, depois termo mais longo. Funciona por acidente, e é impossível de
explicar para quem está olhando a tela.

Duas coisas saem daí:

1. **A chave passa a ser uma só**, e ela é a identidade do critério: `tipo:texto`.
   A categoria **sai** da chave de propósito. Ela dentro permitiria duas regras
   com o mesmo critério e destinos diferentes — o "empate impossível de
   explicar" que o próprio schema da C1 avisa.
2. **`chaveDoCriterio` muda de casa.** Hoje mora em `revisar-lancamento/`, que é
   uma tela; ela é conceito do motor. Vai para `motor/chaveDaRegra.ts`, e o seed
   e a correção passam a chamar a mesma função — não duas iguais.

É a mesma lição da D5, uma camada abaixo: duas implementações do mesmo texto
divergem, e a divergência é silenciosa.

## Reseed não pode desfazer correção

`on conflict do nothing`, e **não** `do update`.

Se o Davi corrigiu uma regra semeada — pela D5, ou editando na D9 — rodar o
onboarding de novo não pode devolvê-la ao que eu escrevi. Seed é ponto de
partida, não autoridade: quem olhou o lançamento foi ele.

É o oposto da escolha da D5, que **atualiza** de propósito, e os dois estão
certos pelo mesmo critério: a instrução mais recente do Davi vence. Na D5 a mais
recente é a correção; aqui a mais recente é a correção também.

Junto vai um ajuste na D5: corrigir uma regra semeada passa a marcar
`origem = 'correcao'`. A pergunta que a coluna responde é "de onde saiu essa
regra?", e a resposta deixou de ser "veio pronta".

## Quem recebe

**Só a conta do Davi**, como a tarefa manda — e não por formalidade.

22 das 25 regras são comerciante brasileiro genérico e serviriam para qualquer
um. Mas `EDSON` é o mecânico dele e `CADILLAC MONTE CARMO` é uma contraparte
real. Semear isso em outra conta seria mostrar gente da vida do Davi na tela de
regras de um estranho — dado dele vazando por conveniência minha.

**A lista é própria, e não a do convite.** Seria fácil reusar
`EMAILS_CONVIDADOS`, e estaria errado: aquilo responde "quem pode entrar", outra
pergunta. No dia em que ele convidar alguém, essa pessoa herdaria o mecânico
dele sem que ninguém tivesse decidido isso.

Nova variável `EMAILS_COM_REGRAS_BASE`, sem `NEXT_PUBLIC_`, mesma forma da
allowlist. Lista vazia = ninguém recebe, que é o lado seguro para errar.

## O nome do titular

A regra de transferência para si mesmo precisa do nome como o **extrato** o
escreve. Vem de `users.nome`, que veio do Clerk.

Pode não bater — o banco escreve nome completo em caixa alta, o Clerk guarda o
que a pessoa digitou. Se não bater, a regra simplesmente não casa e o lançamento
vai para a revisão. É a falha certa: nunca classifica errado, no máximo pergunta.

## Onde roda

Dentro da transação do `concluirOnboarding`, depois das categorias — as regras
precisam do `categoria_id`, que só existe depois delas.

A conta do Davi já concluiu o onboarding, então o seed não rodaria sozinho. Roda
uma vez por rota temporária, como a C2 fez com o pote de renda; a idempotência é
o que torna isso seguro.

## Pronto quando

- a conta do Davi tem as 25 regras, com `origem = 'seed'`;
- rodar duas vezes continua dando 25;
- uma correção sobre regra semeada **atualiza** aquela regra, não cria a segunda;
- reseed depois da correção **não** desfaz a correção;
- conta fora da lista nasce com a tabela vazia;
- verificado contra o Neon real.
