# Plano — B1 e B2 · Criar, renomear e mover categoria

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** B1 e B2 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** BACK
**Arquivos:** `features/categorias/gerir-categorias/mexerNaCategoria.service.ts`,
`lib/erroDoPostgres.ts` (novo), `gerir-regras/mexerNaRegra.service.ts` (refatorado)

## Por que as duas juntas

São três escritas na mesma tabela, com as mesmas conferências de dono e a mesma
tradução de erro de unicidade. Separá-las produziria dois arquivos que se
importam ou dois que repetem o mesmo `select` de posse.

Apagar fica de fora **de propósito**: ela é a operação que carrega o peso, tem
transação própria, e merece a B4 inteira.

## A regra que já valeu quatro vezes nesta base

Uma regra escrita duas vezes vira arquivo. A leitura de código de erro do
Postgres está prestes a ser a segunda: `ehChaveDuplicada` mora dentro de
`mexerNaRegra.service.ts`, e a B1 precisa dela — mas precisa de **mais**.

Sai para `lib/erroDoPostgres.ts`, com `mexerNaRegra` passando a importar de lá.
Precedente direto: `criterioDaCorrecao.ts` (D5), `chaveDaRegra.ts` (D7),
`filaDeRevisao.ts` (D8), `troca.ts` (D4 da spec 04).

### E precisa de mais porque "duplicado" não basta aqui

`classification_rules` tem **um** único, então saber que foi `23505` já diz qual.
`categories` tem **dois** — `(bucket_id, nome)` e `(bucket_id, slug)` — e eles
falham por motivos diferentes que exigem frases diferentes:

| Restrição | Quando estoura | O que o Davi precisa ler |
|---|---|---|
| `..._nome_unq` | Ele digitou um nome que já existe no pote | "Já existe uma categoria com esse nome neste pote." |
| `..._slug_unq` | **Mover** levou `gasolina` para um pote que já tem `gasolina` | Outra frase — os nomes podem ser diferentes |

Traduzir as duas como "nome repetido" faria o Davi ler *"já existe uma com esse
nome"* olhando para dois nomes visivelmente diferentes. Então o helper devolve
**qual** restrição estourou, e não só que estourou.

## B1 — criar

`criarCategoria(userId, { nome, emoji, poteId })` valida pela A2, resolve o slug
pela A1 e insere.

⚠ **O `poteId` vem do cliente e é conferido contra o `userId`.** Mesma regra da
D4 da spec 04, e pelo mesmo motivo: o `user_id` no `where` protege a linha, não o
destino dela. Uma categoria criada dentro do pote de outra conta vazaria por
leitura — apareceria no painel de quem não pediu.

**`ordem` = a maior do pote mais um.** Categoria nova entra no fim, onde a pessoa
espera achar o que acabou de criar. Não há reordenar nesta tarefa.

**Devolve a categoria pronta para ser escolhida** (`CategoriaEscolhivel`, o tipo
que a revisão já usa), porque a D2 vai criar e classificar no mesmo toque — e
uma segunda consulta para reler o que acabou de inserir seria uma segunda
verdade sobre a mesma linha.

### A corrida existe e o único a resolve

Dois toques quase simultâneos calculariam o mesmo slug e a mesma `ordem`. O
`(bucket_id, slug)` único derruba o segundo e a tradução responde. `ordem`
repetida não tem único e não precisa: duas categorias empatadas na ordem
aparecem em alguma ordem, e nenhuma some.

Tentar prevenir isso com um `select ... for update` no pote seria serializar
toda criação de categoria da conta para evitar um empate visual.

## B2 — renomear, e mover só quando vazia

### Renomear não toca no slug

Descoberta 3, e é o ponto inteiro dela. Se renomear mudasse o slug, o
`onConflictDoNothing` do onboarding — idempotente **pelo slug** — recriaria a
categoria original ao lado da renomeada no próximo reseed, e metade do histórico
ficaria em cada.

Só `(bucket_id, nome)` pode estourar aqui, porque o slug não se mexeu.

### Mover exige a categoria vazia, e "vazia" conta os excluídos

Descoberta 4: não existe histórico de "a que pote esta categoria pertencia em
julho". Mover reescreve todos os meses anteriores em silêncio.

⚠ **A contagem que autoriza mover não filtra `status`.** Um lançamento marcado
fora do cálculo continua com a categoria e continua sendo passado — se ele
voltar, o rateio já terá sido reescrito. Filtrar excluídos aqui seria decidir que
uma parte do passado não conta.

A recusa carrega o número: "tem 12 lançamentos dentro" explica; "não é possível
mover" só frustra.

### Mover para o mesmo pote não é erro

É o toque repetido, o botão pressionado duas vezes, o formulário reenviado.
Responder "ok" sem escrever nada é o comportamento certo — recusar seria inventar
um erro para uma operação que já está no estado pedido.

## O que fica de fora

**Reordenar.** É arrumação visual, não tem consequência em cálculo nenhum, e a
tela da C1 vai mostrar se ela é mesmo necessária. `ordem` já existe e já é
respeitada.

**Apagar.** B4.

**As actions e a tela.** As três funções recebem `userId` e são chamadas por
quem já o tem. Nada aqui sabe de requisição.

## Pronto quando

- criar grava com slug único e `ordem` no fim, devolvendo a categoria escolhível;
- pote de outra conta é recusado;
- nome repetido no pote vira frase;
- renomear muda nome e emoji e **não** muda o slug;
- mover recusa com o número quando há lançamento, inclusive excluído;
- colisão de slug ao mover tem frase própria, diferente da de nome;
- verificado contra o Neon real com conta descartável.
