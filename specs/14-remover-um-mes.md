# Spec — Remover um mês importado errado, e a ordem das abas

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 02, que criou o envio, o `hash` como identidade do arquivo
e o desfazer por envio; spec 03, que criou o desfazer da revisão; spec 04, que
criou o painel, a renda declarada e a regra de qual mês abre sozinho; spec 12,
que mudou as abas de endereço
**Pedido do Davi:** _"adiciona pra mim a opção de no painel remover um mês que
importei errado e nas janelas dos meses organize da esquerda pra direita em
ordem de tempo as janelas"_
**Status:** ✅ **aprovada pelo Davi e entregue.** Pendências decididas por mim — ver o
fim do documento.

> ⚠ Nenhum dado real neste documento. Os meses citados são exemplos, e os
> números de lançamento são inventados para ilustrar a contagem.

## O que esta funcionalidade resolve

São dois pedidos, e é honesto dizer de saída que **um é uma linha e o outro é
uma funcionalidade**.

**A ordem das abas** está invertida: o mês mais novo aparece na esquerda, e o
tempo corre para trás conforme se lê. Isso é um defeito, não uma decisão — a
Descoberta 1 mostra que o componente foi escrito esperando o contrário.

**Remover um mês** não existe de forma nenhuma. Hoje, um mês importado errado
só se desfaz em `/upload`, envio por envio, e **só se o Davi souber qual envio
formou aquele mês** — que é exatamente o que ele não sabe quando o mês está
errado. A tela onde o erro aparece é o painel; a única saída fica em outra
tela, organizada por uma unidade (o arquivo) diferente da que ele está olhando
(o mês).

---

## O que eu medi antes de desenhar

### Descoberta 1 — a ordem está errada num lugar só, e o contrato já dizia o certo

O `AbasDoPainel` declara, na própria prop:

```ts
/** Todos os meses da conta, do mais antigo ao mais novo. */
meses: string[];
```

E quem a preenche, em `painel-do-mes/painelDoMes.service.ts`, faz:

```ts
.orderBy(desc(transactions.mesReferencia));
```

O componente foi escrito contra um contrato **que o produtor nunca cumpriu**.
Ele desenha `meses.map(...)` numa fileira da esquerda para a direita, então a
lista de trás para frente vira uma linha de trás para frente.

⚠ **Nenhum teste pegou porque nenhum teste olha a ordem das abas** — e nenhum
poderia, do jeito que está: a ordem nasce num `.service.ts`, e este projeto não
tem teste de banco.

### Descoberta 2 — a mesma lista decide qual mês abre, e ela precisa estar ao contrário

Três linhas abaixo, no mesmo arquivo:

```ts
const padrao = (porMes.find((m) => m.comMovimento > 0) ?? porMes[0]).mes;
```

"O primeiro da lista que tem movimento". Com a lista em `desc`, isso é **o mês
mais recente com movimento** — que é a regra da spec 04, encontrada contra o
banco real: uma conta tinha um mês com um único lançamento, e ele era um
pagamento de fatura, já excluído do cálculo. O painel abria ali e mostrava uma
tela zerada.

⚠ **Trocar `desc` por `asc` faria o painel abrir no mês mais antigo.** Sem
erro, sem teste vermelho, sem aviso: a tela abriria em dezembro e pareceria
funcionar. Dois leitores querem ordens opostas da mesma lista, e a correção tem
de separar as duas — não inverter uma delas.

### Descoberta 3 — "remover um mês" não é "desfazer um envio"

O mês de um lançamento não é o mês do envio. Está em
`importar-extrato/importarExtrato.service.ts`:

```ts
function mesDoLancamento(origem, data, mesEscolhido) {
  return origem === "csv_conta" ? data.slice(0, 7) : mesEscolhido;
}
```

O comentário em cima dela explica por quê, e é o mesmo motivo que cria o
problema aqui: **o extrato de conta de 02/06 a 02/07 traz lançamentos de
julho**, e empurrá-los para junho seria mentir sobre quando o dinheiro se
moveu. O cartão é o oposto: o mês é o da fatura, escolhido na tela.

Disso saem os dois fatos que desenham a funcionalidade:

1. **Um envio pode alimentar dois meses** — o de conta, sempre que o extrato
   cruza a virada.
2. **Um mês é normalmente alimentado por dois envios** — a conta e o cartão
   chegam no mesmo formulário.

⚠ **"O mês" não é uma unidade que o banco tenha.** É um filtro. Remover um mês
é sempre um corte que atravessa envios.

### Descoberta 4 — apagar só os lançamentos trancaria o conserto

Esta é a descoberta que decide o desenho. A tabela `imports` tem:

```ts
unique("imports_user_id_hash_unq").on(t.userId, t.hash);
```

e a importação filtra os hashes já conhecidos antes de gravar qualquer coisa.
O `hash` é do **conteúdo**, não do nome — foi decidido assim na spec 02 porque
todo banco chama o arquivo de `extrato.csv`.

Então, se remover um mês apagasse os lançamentos e deixasse as linhas de
`imports` vivas:

- **reenviar o arquivo corrigido seria recusado como repetido** — e reenviar é
  literalmente a próxima coisa que se quer fazer depois de tirar um mês errado;
- a lista de `/upload` continuaria mostrando "extrato.csv — 53 lançamentos" de
  um envio que não tem nenhum. Um número que era verdade e virou mentira em
  silêncio.

⚠ **Portanto: remover o mês é remover os envios que o formaram.** Não há
desenho intermediário que funcione.

### Descoberta 5 — o desfazer da revisão se limpa sozinho

`decision_undo.transaction_id` tem `on delete cascade`, e o schema já diz por
quê: _"apagar o envio apaga os lançamentos (spec 02), e não sobra desfazer
apontando para algo que não existe mais"_.

Não há trabalho aqui. Está escrito porque a próxima pessoa que ler esta spec vai
se perguntar, e porque alguém pode "consertar" isso um dia sem saber que já está
resolvido.

### Descoberta 6 — a renda declarada não vem do extrato, e ela viaja para a frente

`monthly_income` tem chave `(user_id, mes_referencia)` e é escrita pelo campo de
renda do painel — **digitada pelo Davi**, não lida de arquivo nenhum. E
`rendaDoMes` faz:

```ts
.where(lte(monthlyIncome.mesReferencia, mes))
.orderBy(desc(monthlyIncome.mesReferencia))
.limit(1)
```

Ou seja, ela **anda para a frente**: um mês sem renda própria usa a última
declarada antes dele.

⚠ **Apagar a renda de junho mudaria o painel de julho**, se julho nunca teve
renda própria — e julho é um mês que o Davi não pediu para mexer. Um mês
correto mudaria de veredito por causa da limpeza de outro.

### Descoberta 7 — o mecanismo de apagar já existe inteiro

`desfazer-envio/desfazerEnvio.service.ts` já faz, e faz certo:

- transação, com a **conferência de dono antes** de qualquer deleção (para não
  depender de `rollback` por exceção);
- deleção explícita dos lançamentos em vez de confiar no cascade, para ter o
  `returning` e poder dizer quantos saíram **de fato**;
- envio inexistente e envio de outro dono devolvem **a mesma frase**, para a
  resposta não virar um jeito de descobrir quais ids existem.

E a `LinhaDeEnvio` já é o botão de duas etapas que lembra se está pedindo
confirmação.

⚠ **O que é novo aqui não é apagar. É o agrupamento** ("quais envios formaram
este mês") **e o lugar** (o painel).

---

## Página: `/dashboard` — o mês tem uma saída

Nenhuma rota nova. Isso não é economia, é consequência: o painel já carrega o
mês, e o `proxy.ts` já protege `/dashboard`.

### Componentes

| Componente      | Onde                                    | O quê                                                               |
| --------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `AbasDoPainel`  | existe, `painel/navegar-entre-meses/`   | **não muda** — quem muda é quem a alimenta                           |
| `RemoverOMes`   | novo, `painel/remover-o-mes/`           | cliente; o pedido em duas etapas, com o que vai sair nomeado         |
| envios do mês   | novo, `painel/remover-o-mes/` (service) | quais envios formaram este mês, e quantos lançamentos cada um perde  |

### Onde ele fica na tela

**No pé do painel, depois dos potes e da chamada do comparativo.** ⚠ Não ao
lado das abas: um botão que apaga o mês encostado na aba que se toca todo dia
é um erro de dedo esperando acontecer. Quem quer remover um mês procura; quem
está navegando, não.

### Comportamentos do usuário

1. **Ver que existe saída.** No pé: _"Este mês entrou errado?"_ com o botão
   `Remover este mês`.
2. **Pedir.** O botão abre a confirmação — não apaga.
3. **Ler exatamente o que vai sair.** A confirmação nomeia os envios (arquivo,
   se é conta ou cartão) e conta os lançamentos **do banco, agora**, não o
   `lancamentos_importados` congelado no envio.
4. **Ser avisado do transbordo.** Se algum desses envios também alimenta outro
   mês, a confirmação diz qual e quantos: _"O extrato de junho também tem 4
   lançamentos em julho. Eles saem junto."_
5. **Confirmar ou desistir.** Desistir é a ação de fora do botão vermelho.
6. **Cair em pé.** Depois de remover, o painel abre no mês que sobrou, pela
   mesma regra de sempre. Sem nenhum mês, a tela vazia que já existe.

### O que a confirmação diz que **não** sai

Três linhas, porque as três são perguntas que ele faria depois:

- **As regras que você criou continuam.** O que o motor aprendeu na `/revisão`
  é conhecimento, não dado do mês — e reaprender tudo a cada correção seria a
  pior parte do conserto.
- **A renda declarada do mês continua.** Descoberta 6: ela foi digitada, não
  importada, e apagá-la mexeria no painel de meses que ninguém pediu para
  mexer.
- **Os formatos que você ensinou continuam** (spec 11).

### Dados envolvidos

**Nenhuma migration. Nenhuma coluna nova.** Duas consultas novas:

- os envios que têm ao menos um lançamento com `mes_referencia = M`, com a
  contagem por mês de cada um (é ela que produz o aviso de transbordo);
- a deleção, que é a que já existe, aplicada a um conjunto de envios dentro de
  **uma** transação — meia remoção deixaria um mês pela metade, que é pior do
  que o mês errado.

Para a ordem das abas, a correção não é no `orderBy`. A consulta continua
`desc` (Descoberta 2), e a lista das abas sai invertida **depois** de o mês
padrão ter sido escolhido. ⚠ E a escolha do par `{meses, padrao}` sai do
`.service.ts` para uma função pura ao lado, porque é a única forma de o Vitest
alcançar a regra: sem isso, a Descoberta 1 pode voltar do mesmo jeito, calada.

---

## Riscos

1. **O envio que atravessa a virada leva lançamentos de um mês correto.** É
   real e não tem desenho que evite — a Descoberta 4 fechou a alternativa. O que
   dá para fazer é **contar e mostrar antes**, o que a confirmação faz.
2. **Erro de dedo apagando um mês certo.** Duas etapas, no pé da tela, longe das
   abas, com o conteúdo nomeado. O texto do botão diz o mês.
3. **A ordem invertida volta.** Só não volta se houver teste, e só há teste se a
   regra sair do service. Está na spec por isso.
4. **A URL de um mês removido.** Já resolvido: `painelDoMes` confere
   `meses.includes(mesPedido)` e cai no padrão. Escrito aqui para ninguém
   "consertar" duas vezes.
5. **Remover um mês do meio.** Nada quebra — o comparativo já lida com meses
   ausentes (`coberturaDosMeses`), e o painel não assume sequência.

---

## Pendências — decididas

| #   | Pergunta                                     | Decisão                                                                                              |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Remover apaga os envios ou só os lançamentos? | **Os envios.** Descoberta 4: sem isso o reenvio é recusado como repetido                              |
| 2   | A renda declarada do mês vai junto?           | **Não.** Descoberta 6: ela foi digitada, e apagá-la mexeria em meses vizinhos                          |
| 3   | As regras criadas na revisão vão junto?       | **Não.** Regra é conhecimento; reaprender seria o pior do conserto                                     |
| 4   | O botão fica junto das abas?                  | **Não.** Pé da tela — ação destrutiva não encosta em ação diária                                       |
| 5   | Dá para remover só o cartão, ou só a conta?   | **Não nesta spec.** Isso já existe em `/upload`, por envio. Aqui a unidade é o mês, que é como o erro aparece |
| 6   | O mês some da fileira de abas?                | **Sim**, porque ele deixa de existir. Não há "mês vazio" a preservar                                   |

### A única que eu quero confirmar com você

**Pendência 1 tem um efeito que você vai sentir.** Remover junho pode levar
alguns lançamentos de julho junto, se o extrato de conta de junho cruzou a
virada — e pelo que o app faz com datas, ele cruza com frequência.

A tela vai **contar e avisar antes**. Mas quero que você saiba disso antes de
aprovar, porque a alternativa (deixar o envio vivo e apagar só as linhas de
junho) tem um preço pior: você não conseguiria reenviar o arquivo corrigido —
o app o recusaria como repetido, e o botão de remover viraria uma armadilha.

---

## O que fica de fora, e por quê

- **Desfazer a remoção.** O desfazer da spec 03 é de uma decisão, com a sombra
  das colunas guardada; guardar a sombra de um mês inteiro é outra tabela e
  outra spec. O que substitui isso aqui é a confirmação que **conta antes**.
- **Reimportar automaticamente depois de remover.** Remover e reenviar são dois
  gestos, e juntá-los esconderia qual dos dois falhou.
- **Remover um ano inteiro.** Não foi pedido, e o mês é a unidade em que o erro
  se percebe.
- **Mudar a ordem em `/upload`.** A lista de envios lá é vertical e mais nova em
  cima, que é o certo para um histórico. O pedido é sobre a fileira do painel.

---

## Como saber que funcionou

**O teste de aceitação é uma frase**, e ela é a Descoberta 4 virada do lado
certo:

> remover um mês importado errado e **reenviar o arquivo corrigido**, e o app
> aceitar — em vez de recusar como repetido.

Além dela:

- as abas leem da esquerda para a direita em ordem de tempo, e o painel continua
  abrindo no mês mais recente com movimento;
- a confirmação diz o número de lançamentos que existe **agora**, e ele bate com
  o que some;
- um envio que atravessa a virada é anunciado antes, com o mês e a contagem;
- a renda declarada e as regras continuam depois da remoção.
