# Tarefas — Remover um mês importado errado, e a ordem das abas

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/14-remover-um-mes.md`, aprovada pelo Davi
**Status:** ⚠ **rascunho, não aprovado.**

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A ordem: primeiro o que se prova sem tela

Como nas specs 10, 12 e 13: o que vale teste sobe primeiro, escrito e **ainda
não chamado por ninguém**. Um erro ali aparece no Vitest, e não numa tela onde
ele se confunde com erro de layout.

1. **Fase A — a ordem das abas**, e a função pura que a segura. É a metade
   pequena do pedido, e sai inteira antes de a outra começar.
2. **Fase B — o que sai do mês**, calculado e consultado, sem apagar nada.
3. **Fase C — a remoção**, escrita e ainda sem botão.
4. **Fase D — a tela.**
5. **Fase E — a conferência e os documentos.**

⚠ **A fase A é entregável sozinha, e deve ser um commit só.** Ela conserta um
defeito que existe hoje; misturá-la com a funcionalidade nova faria o `git log`
dizer que a ordem das abas foi "parte de remover um mês", que é falso — e
faria o `git bisect` de uma regressão de ordem cair num commit gigante.

⚠ **A fase D1 é conferível sozinha.** Só a linha e o botão fechado, sem
confirmação e sem ação: um erro de layout no pé do painel a 360px aparece ali,
antes de existir texto de confirmação para confundir a leitura.

## Nenhuma migration, nenhuma rota, nenhum `proxy.ts`

**Zero coluna, zero migration, zero SQL de estrutura.** O que a fase C faz no
banco é `delete` em duas tabelas que já existem, com o mesmo `where` que o
desfazer da spec 02 já usa.

⚠ E **nenhuma rota nova**: tudo entra na `/dashboard`, que está no `proxy.ts`
desde a spec 04. Esta spec não toca naquele arquivo — o que também quer dizer
que a armadilha dele (rota interna nova não é protegida sozinha) não se aplica
desta vez.

## Reuso antes de criação

| O que                            | Onde                              | Para quê aqui                                                                                          |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `desfazerImportacao`             | `upload/desfazer-envio/`          | ⚠ **O precedente exato.** Dono conferido antes de apagar, deleção explícita pelo `returning`, mesma frase para "não existe" e "não é seu" — copiar a disciplina |
| `LinhaDeEnvio`                   | `upload/enviar-extrato/`          | O padrão do botão de duas etapas com `useState` de confirmação e `useActionState`                       |
| `AbasDoPainel`                   | `painel/navegar-entre-meses/`     | **Não muda.** Ela já documenta a ordem certa; quem muda é quem a alimenta                               |
| `rotuloDeMes`                    | `lib/mes.ts`                      | "junho de 2026" nas frases da confirmação — a mesma grafia das abas                                     |
| `exibirEnvio` / `rotuloDeOrigem` | `upload/enviar-extrato/`          | "Extrato da conta" / "Fatura do cartão" já tem tradução; não escrever a segunda                          |
| `Button`, `Card`                 | `components/ui/`                  | A moldura e o botão destrutivo, como em toda tela                                                        |
| `garantirUsuario`                | `autenticacao/garantir-usuario/`  | O `user_id` da sessão, nas duas actions                                                                  |

⚠ **`lancamentos_importados` não serve para a confirmação, e a tentação é
real.** Ele está a um `select` de distância e já vem com a lista de envios. Mas
é o número **congelado no instante do envio** (o schema diz isso na coluna), e a
tela precisa do que existe **agora** — depois de a revisão ter excluído
pagamento de fatura, por exemplo. Um número de dois meses atrás contado como se
fosse de hoje é o tipo de erro que ninguém nota.

---

## Fase A — a ordem das abas

### ✅ A1 · A regra de qual mês abre, fora do service `INFRA`

Uma função pura em `painel/navegar-entre-meses/mesesEPadrao.ts`, que recebe o
que a consulta devolve (`{ mes, comMovimento }[]`, do mais novo para o mais
velho) e devolve `{ meses, padrao }`.

⚠ **`meses` sai do mais antigo para o mais novo; `padrao` continua sendo o mais
recente com movimento.** É a Descoberta 2 inteira: dois leitores querem ordens
opostas da mesma lista, e é esta função que os separa.

Escrita e **não chamada por ninguém**.

**Testes:** a saída está em ordem crescente; o padrão é o mês mais recente com
movimento, mesmo com um mês mais novo sem movimento depois dele; sem nenhum mês
com movimento, o padrão é o mais recente de todos; com um mês só, os dois
concordam.

**Pronto quando:** existe, tem teste, e o app está idêntico.

> ✅ **Feito, e ela ordena por dentro em vez de confiar em quem chama.** O
> rascunho óbvio recebia a lista já ordenada e só invertia — e isso recriaria o
> defeito noutro arquivo: um parâmetro chamado `doMaisNovoAoMaisVelho` é a
> mesma promessa não verificada que causou o bug. Com a ordem imposta por
> dentro, existe o teste que entrega a lista **embaralhada**, e ele é o que
> impede a Descoberta 1 de voltar.

### ✅ A2 · Ligar, e a fileira virar `BACK`

`painelDoMes.service.ts` passa a usar a A1. ⚠ **O `orderBy(desc(...))` da
consulta não muda** — é dele que sai o padrão, e mexer ali é o erro que a
Descoberta 2 descreve.

**Pronto quando:** as abas leem da esquerda para a direita em ordem de tempo, e
o painel continua abrindo no mesmo mês de antes.

> ⚠ **Desvio: o `orderBy` não ficou — ele saiu.** A tarefa dizia "não muda",
> escrita quando eu ainda supunha que a função herdaria a ordem da consulta.
> Como a A1 ordena por dentro, a cláusula virou o pior tipo de linha: uma que
> **parece** sustentar a correção sem sustentar — exatamente a forma como a
> fileira ficou de trás para frente. Agora um lugar só decide a ordem, e ele
> tem teste. O `desc` era usado só ali e saiu do import.

---

## Fase B — o que sai do mês, sem apagar nada

### ✅ B1 · A conta do que sai, pura `INFRA`

`painel/remover-o-mes/oQueSaiDoMes.ts`: recebe as linhas cruas
(`{ importId, nomeArquivo, origem, mes, lancamentos }[]` — um envio pode
aparecer em mais de um mês) e o mês pedido, e devolve o que a confirmação
precisa dizer:

- os envios que serão removidos, com nome e origem;
- quantos lançamentos saem **deste** mês;
- o **transbordo**: para cada outro mês afetado, qual e quantos.

⚠ **O transbordo é o motivo desta função existir.** Ele é a única coisa da tela
que o Davi não consegue prever sozinho, e é a consequência que a Descoberta 3
tornou inevitável.

**Testes:** dois envios só neste mês (sem transbordo); um envio de conta que
também tem lançamentos no mês seguinte (transbordo com o mês certo e a contagem
certa); um envio que atravessa **dois** meses; mês sem envio nenhum. ⚠ E um que
a frase do transbordo não aparece quando não há transbordo — a ausência é o
caso comum, e uma frase vazia com "0 lançamentos" seria pior que nada.

**Pronto quando:** existe, tem teste, e não é chamada por ninguém.

> ✅ **Feito, e a frase precisou de um segundo parâmetro.** O plano previa
> `fraseDoTransbordo(atingido)`, e o primeiro teste reprovou por um motivo que
> valia a pena: `rotuloDeMes` é o rótulo da **aba** ("Julho / 2026"), ilegível
> no meio de uma frase. O certo é o `nomeDoMes`, que existe exatamente para
> isso — e ele pede o ano de referência, que aqui é o do mês removido. Ganhou
> teste: remover janeiro anuncia "dezembro **de 2025** perde 3 lançamentos", e
> não um "dezembro" que serviria para dois anos diferentes.

### ✅ B2 · Perguntar ao banco quem formou o mês `BACK`

`painel/remover-o-mes/enviosDoMes.service.ts`, `server-only`. Um `group by`
por envio e mês, contando os lançamentos que existem agora, restrito aos envios
que têm ao menos uma linha no mês pedido.

⚠ **`user_id` da sessão em todo `where`**, como toda consulta deste projeto.

**Pronto quando:** existe e não é chamada por ninguém.

---

## Fase C — a remoção, ainda sem botão

### ✅ C1 · Apagar os envios de um mês, numa transação `BACK`

`painel/remover-o-mes/removerOMes.service.ts`, `server-only`. Recebe `userId` e
o mês; descobre os envios (B2), apaga os lançamentos e depois as linhas de
`imports`, **tudo dentro de uma transação**.

Copia a disciplina do `desfazerImportacao`: dono conferido **antes** de
qualquer deleção, deleção explícita para ter o `returning`, e uma frase só para
qualquer recusa.

⚠ **Meia remoção é pior que o mês errado**: um envio apagado e outro não deixa
um mês que não é nem o antigo nem o novo, e a tela o mostraria como se fosse
escolha. É o mesmo motivo do onboarding (spec 01, D7) e do "voltar ao padrão"
(spec 13, D1).

⚠ **Mês sem envio nenhum não é erro** — é um mês que já saiu, ou um palpite de
URL. Devolve zero, como o "voltar ao padrão" faz com a conta vazia.

**Pronto quando:** existe e não é chamada por ninguém.

> ⚠ **Desvio: ela não descobre os envios antes de apagar — apaga com a pergunta
> dentro.** A tarefa dizia "descobre os envios (B2), apaga os lançamentos e
> depois as linhas de `imports`". Entre a descoberta e a transação cabe um
> envio novo (outra aba na `/upload`, um envio em voo), e sobraria meio mês.
> Com a subconsulta dentro do `delete`, o conjunto é decidido e apagado sem
> janela, e os `import_id` do `returning` são exatamente os envios a remover.
>
> ⚠ **E não há conferência de dono, ao contrário do `desfazerImportacao`.**
> Aquele recebe um `importId`, que é alça global. Um mês não é alça de nada: só
> vira linha depois de cruzar com o `user_id` da sessão. Uma consulta de dono
> aqui não protegeria nada e daria a impressão de que protege.

### ✅ C2 · As duas actions `BACK`

`painel/remover-o-mes/removerOMes.action.ts`, com **duas** exportações:

- `resumoDaRemocao(mes)` — B2 + B1, para a confirmação;
- `removerMes(mes)` — C1.

⚠ **O resumo é uma action e não uma consulta da rota**, e isso é decisão. A
`/dashboard` é a tela mais carregada do app; remover um mês acontece uma vez a
cada muitos meses. Pendurar essa consulta em todo carregamento do painel faria
todo mundo pagar pelo caso raro. A tela pergunta quando o dedo toca.

⚠ **A revalidação inclui `/revisao`.** Remover um mês pode levar lançamentos
que estavam esperando decisão — e o contador de pendências aparece no painel.
Também `/upload` (a lista de envios encolheu) e `/comparativo` (o ano perdeu um
mês). Do cliente vem **só o mês**; o `user_id` sai de `garantirUsuario()`.

**Pronto quando:** existem e não são chamadas por ninguém.

---

## Fase D — a tela

### D1 · A saída existe, e ainda não faz nada `FRONT-VISUAL`

`painel/remover-o-mes/RemoverOMes.tsx`, no **pé** do `TelaDoPainel`, depois dos
potes e da chamada do comparativo: a linha _"Este mês entrou errado?"_ e o botão
`Remover este mês`, que ainda não abre nada.

⚠ **Longe das abas, de propósito** — um botão que apaga o mês encostado na aba
que se toca todo dia é erro de dedo esperando acontecer.

**Pronto quando:** aparece no pé do painel, a 360px, e nada mais mudou.

### D2 · A confirmação, e o que ela promete `FRONT-INTEGRADO`

Tocar chama `resumoDaRemocao` e abre a confirmação, que mostra:

- os envios pelo nome do arquivo e a origem;
- quantos lançamentos saem deste mês;
- ⚠ o transbordo, quando houver, com o mês e a contagem;
- as três coisas que **não** saem: as regras aprendidas, a renda declarada e os
  formatos ensinados.

Confirmar chama `removerMes` e vai para `/dashboard` sem `?mes=`, que cai no
padrão pela regra da A1. Desistir é a ação de fora do botão destrutivo.

⚠ **Enquanto o resumo carrega, o botão de confirmar não existe** — não basta
estar desabilitado. Um botão vermelho presente antes de a tela saber o que vai
apagar convida a confirmar sem ler, que é o contrário do que estas duas etapas
existem para fazer.

**Pronto quando:** remover um mês tira ele da fileira, o painel abre no que
sobrou, e a `/upload` perdeu os envios correspondentes.

---

## Fase E — a conferência e os documentos

### E1 · O mês que sai, e a fileira depois dele `INFRA`

Um teste que liga as duas metades da spec: tirar um mês da lista e passar o que
sobrou pela `mesesEPadrao` — a fileira continua em ordem, e o padrão anda para o
mês certo.

⚠ **O critério de aceitação da spec não tem teste automático, e é melhor dizer
por quê.** "Remover e reenviar o arquivo corrigido, e o app aceitar" é
comportamento de banco: depende de a linha de `imports` ter sumido, e portanto
do `unique(user_id, hash)`. Este projeto não tem teste de banco — um com banco
fingido provaria que o dublê devolve o que eu mandei ele devolver. **Essa
conferência é do Davi**, e a fase E diz exatamente como fazer.

**Pronto quando:** o teste existe e a suíte passa inteira.

### E2 · Os documentos `INFRA`

- `references/estado-do-projeto.md`: a linha da `/dashboard` ganha a remoção do
  mês, e a da `/upload` continua sendo a do desfazer por envio — são duas
  unidades diferentes e a tabela deve mostrar isso.
- `references/architecture.md`: ⚠ **`imports` passa a ter dois caminhos de
  deleção** — por envio (`/upload`, spec 02) e por mês (`/dashboard`, esta). É
  o mesmo tipo de armadilha que a spec 13 registrou para `percentual_meta`:
  quem for atrás de "por que este envio sumiu" precisa saber que há dois lugares
  que apagam.
- As tarefas marcadas, com os desvios da execução anotados **no lugar**.

**Pronto quando:** os dois documentos descrevem o app que existe.

---

## O que o Davi confere no fim

1. ⚠ **O teste de aceitação**: remover um mês que entrou errado e **reenviar o
   arquivo corrigido**. O app tem de aceitar — se recusar como repetido, a
   Descoberta 4 não foi resolvida e a fase C está errada.
2. Se o transbordo apareceu quando devia, e com a contagem certa.
3. O pé do painel a 360px.
4. Se as abas leem na ordem que ele esperava.
