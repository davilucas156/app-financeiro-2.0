# Spec — Categorias do usuário

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 03 (as categorias já são escolhidas, e regras apontam para elas)
**Paga uma dívida nomeada:** o comentário da C1 no `schema.ts`, que mandou esta
spec avisar antes de apagar aprendizado
**Status:** pendências resolvidas pelo Davi; aguardando aprovação para a Etapa 2
**Vem depois de:** spec 04 (o painel do mês) — decisão dele na pendência 4

> ⚠ Nenhum dado real neste documento. As medições são contagens feitas contra o
> Neon com conta descartável; os exemplos são inventados.

## O que esta funcionalidade resolve

As 25 categorias vêm de `POTES_PADRAO` e são as do painel estático do Davi. Elas
cobrem o passado dele — não o que aparecer amanhã.

Hoje, um lançamento que não cabe em nenhuma delas tem três saídas, e as três são
ruins: escolher a categoria mais ou menos parecida (o painel passa a mentir por
agregação), marcar "fora do cálculo" (o dinheiro some da conta) ou deixar
pendente para sempre (a fila nunca zera).

## O que eu medi antes de desenhar

Rodei as operações contra o Neon real, numa conta descartável. Duas coisas
mudaram o desenho inteiro.

### Descoberta 1 — apagar categoria **não funciona hoje**, e falha feio

Categoria com um lançamento classificado, `delete from categories`:

```
new row for relation "transactions" violates check constraint
"transactions_classificacao_ck"
```

O `on delete set null` de `transactions.categoria_id` zera a categoria e deixa
`classificado_por` preenchido. O check da C3 recusa esse estado — e está certo:
lançamento classificado tem de dizer **como**.

Resultado: o `delete` inteiro é rejeitado. A regra sobreviveu e o lançamento não
mudou **porque a operação toda falhou**, não porque algo a protegeu.

O check não é o defeito. O defeito é que "apagar categoria" nunca foi desenhado:
não dá para apagar antes de decidir o que acontece com o que estava dentro.

### Descoberta 2 — apagar categoria apaga aprendizado, e a dívida já tem dono

`classification_rules.categoria_id` é `cascade`, e o próprio schema escreveu, na
C1, quem deve o aviso:

> Sobra cascade, que tem um defeito real: apagar uma categoria apaga aprendizado
> em silêncio. O banco garante que não sobra lixo; **quem deve o aviso é a
> tela.** Quando a fase 2 permitir apagar categoria, ela tem de dizer "isto leva
> junto 4 regras" antes de confirmar.

Esta spec é essa fase. E o aviso não basta: uma regra que alimentava a categoria
apagada **para de classificar**, então no mês seguinte os mesmos lançamentos
voltam pendentes sem ninguém entender por quê. As regras precisam ir para algum
lugar, não só serem contadas antes de morrer.

### Descoberta 3 — a categoria tem duas identidades, e só uma pode mudar

`(bucket_id, slug)` e `(bucket_id, nome)` são únicos, e eles fazem coisas
diferentes:

| | Papel | Muda? |
|---|---|---|
| `slug` | **Identidade de dados.** A semente da A5 aponta para `pote/categoria` por slug; o `onConflictDoNothing` do onboarding também | **Não** |
| `nome` | Rótulo na tela | Sim |

Se renomear mudasse o slug, o reseed do onboarding (que é idempotente **pelo
slug**) recriaria a categoria original ao lado da renomeada. O Davi teria
"Gasolina" e "Combustível" no mesmo pote, e metade do histórico em cada.

**Slug nasce do nome e congela ali.** Renomear muda só o rótulo.

### Descoberta 4 — mover categoria de pote reescreve o passado

O painel vai somar por `bucket_id` da categoria; não existe histórico de "a que
pote esta categoria pertencia em julho". Mover "Gasolina" de Transporte para
Custos Fixos move o dinheiro de **todos os meses anteriores** junto, em silêncio.

Mas o caso legítimo existe e é chato: criar a categoria no pote errado e
descobrir dois toques depois.

**Mover só enquanto a categoria estiver vazia.** Zero lançamento, zero passado
para reescrever. Com lançamentos dentro, mover deixa de ser mudar um rótulo e
vira mexer no rateio — e isso pede o painel na tela para mostrar o efeito, que
é a spec seguinte.

## O desenho

### Criar

Nome, emoji e pote. O slug sai do nome; `ordem` é o último do pote mais um.

O **pote é obrigatório** porque `categories.bucket_id` é `not null`, e isso não é
detalhe de banco: é o método. Categoria fora de pote não entra em rateio nenhum,
e um gasto que não cai em pote é um gasto que o painel não conta.

Os nove potes aparecem, renda incluída — mesma decisão da C2 em
`agruparPorPote`: um Pix recebido precisa de destino, e esconder renda tornaria
toda entrada impossível de classificar.

### Renomear

Muda `nome` e `emoji`. Nome repetido dentro do mesmo pote bate no
`categories_bucket_id_nome_unq` e vira frase, não erro de banco — mesma tradução
que a D9 fez para o texto de regra repetido.

### Apagar — a operação que carrega o peso todo

Apagar não é um botão, é uma decisão em três partes, numa transação só:

**1. A tela mostra o tamanho do que está em jogo**

> Gasolina tem **12 lançamentos** e **2 regras** apontando para ela.

**2. Você escolhe o destino dos lançamentos**

| Escolha | O que acontece |
|---|---|
| **Mover para outra categoria** (padrão) | Os 12 vão para lá. O histórico continua somando; o painel não perde um mês. |
| **Devolver para a revisão** | Voltam para a fila sem categoria, e você decide um a um. |

**3. As regras seguem o mesmo destino**

Mover leva as 2 regras junto — elas passam a mandar para a categoria nova. Sem
isso, apagar a categoria desligaria a classificação em silêncio, e no mês
seguinte os mesmos lançamentos voltariam pendentes.

Devolver à revisão **apaga** as 2 regras, e a tela diz isso antes: regra sem
destino não tem para onde apontar.

**Mover é uma escolha sua, então a procedência passa a ser sua.** Os lançamentos
movidos ficam `classificado_por = 'manual'`, com `regra_id` e `regra_chave`
limpos. É a mesma decisão da D6: quando você troca a categoria, a resposta para
"como esta classificação surgiu?" passa a ser você, e manter a regra ali diria
que ela ainda explica algo que ela não explica mais.

### Onde isto aparece

**No momento da necessidade.** O lugar em que se descobre que falta uma
categoria é a `/revisao`, olhando um lançamento que não cabe em nada. Um
"+ Nova categoria" no fim da lista, que cria e já seleciona, resolve ali — em vez
de mandar você para outra tela, criar, voltar e reencontrar o lançamento.

Mais uma tela de gestão (`/categorias`) para renomear, reordenar e apagar, que é
trabalho de arrumação e não de decisão.

## O que fica de fora, e por quê

| Fora | Por quê |
|---|---|
| **Criar pote novo** | Os potes são a espinha do método, e os percentuais somam 100%. Criar um mexe no rateio de todos os outros. O `readme.md` já separa "metas por pote configuráveis" como item próprio da fase 2. |
| **Mudar percentual do pote** | Mesmo motivo. É outra funcionalidade, com outra tela. |
| **Mover categoria com lançamentos dentro** | Descoberta 4: reescreve o passado sem mostrar o efeito. Volta quando o painel existir para mostrá-lo. |
| **Seletor de emoji** | Um campo de texto que aceita um emoji, com uns poucos sugeridos. Um seletor completo é uma biblioteca inteira para um campo. |
| **Apagar categoria do seed em lote** | "Limpar as que não uso" é atraente e perigoso: cada uma leva regras junto. Uma de cada vez, com o número na frente. |

## Riscos

**O maior é a agregação silenciosa.** Criar categoria é fácil e barato, e uma
conta com 60 categorias tem um painel que não diz nada — o método dos potes
funciona porque a lista cabe na cabeça. A tela não deve impedir, mas também não
deve incentivar: o "+ Nova categoria" fica no **fim** da lista, depois de você
ter passado por todas as que já existem.

**O segundo é o slug congelado ficar estranho.** Renomear "Gasolina" para
"Combustível" deixa o slug `gasolina` para sempre. Ninguém vê o slug — mas quem
abrir o banco vai estranhar, e é melhor estar escrito aqui do que ser descoberto
lá.

---

## Pendências — respondidas

**1. Criar categoria durante a revisão, ou só numa tela de gestão?**
✅ **Os dois, com a criação inline sendo a principal.** É onde a falta aparece:
você está olhando um lançamento que não cabe em nada, cria ali e ele já fica
selecionável. Sem sair da fila e sem perder o lugar.

**2. Apagar categoria usada: exigir destino, ou permitir devolver à revisão?**
✅ **Os dois, com "mover para outra categoria" pré-selecionado.** Devolver 12
lançamentos para a fila é trabalho real, e quem escolhe isso deve estar
escolhendo de propósito — não por ser o caminho de menor resistência.

**3. `/categorias` entra na barra de navegação?**
✅ **Não.** A barra tem 4 itens desde a D9; a 360px um quinto deixaria 72px cada.
Linkada da `/revisao` e do painel, que é de onde a vontade de mexer em categoria
nasce.

**4. Esta spec vem antes ou depois do painel de verdade?**
✅ **Depois.** O painel é o produto; a tela de "trocar a categoria de algo já
classificado" — o buraco que a D9 expôs — nasce com ele; e a descoberta 4 mostra
que mover categoria só se desenha direito com o painel na frente para mostrar o
efeito.

Por isso esta spec virou a **05**, e a **04** é o painel do mês.
