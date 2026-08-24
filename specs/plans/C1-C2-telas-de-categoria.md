# Plano — C1 e C2 · As telas de categoria (protótipo)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** C1 e C2 de `specs/05-categorias-do-usuario.tarefas.md`
**Camada:** FRONT-VISUAL
**Arquivos:** `features/categorias/gerir-categorias/{categoriasNaTela.ts,CartaoDaCategoria.tsx,TelaDeCategorias.tsx,dadosFalsos.ts}`,
`features/categorias/nomear-categoria/FormularioDeCategoria.tsx`,
`app/(app)/categorias/page.tsx`, `proxy.ts`,
`classificacao/revisar-lancamento/{ListaDeCategorias.tsx,TelaDeRevisao.tsx}`

> ⛔ Termina no **portão visual do Davi**. Nada aqui grava.

## Duas telas, e elas não se parecem por acaso

`/categorias` é arrumação: você já sabe o que quer mudar e foi lá mudar.
O "+ Nova categoria" da revisão é urgência: você está olhando um lançamento que
não cabe em nada.

O formulário é **o mesmo componente** nas duas. Um nome, um emoji e um pote não
mudam de significado por causa de onde você está — e duas cópias divergiriam na
primeira vez que a validação mudasse.

## A proteção da rota não espera a D3

A D3 diz "`/categorias` está em `proxy.ts` e é alcançável da revisão e do
painel". A segunda metade é dela; **a primeira vem agora**.

O `proxy.ts` avisa em letras garrafais que rota interna nova não é protegida
automaticamente. Publicar um protótipo desprotegido para o Davi ver no celular
seria publicar uma rota aberta, e o motivo — "é só um protótipo" — não muda
nada para quem chegar nela.

Fora da barra de navegação, decisão dele na pendência 3.

## O protótipo diz que é protótipo

`/categorias` nasce lendo `dadosFalsos.ts` e com uma faixa dizendo isso na
primeira linha. Sem a faixa, a tela mostraria categorias que não são as dele
com números que não são os dele, e a primeira reação certa seria achar que o app
perdeu os dados.

A D1 troca a fonte e apaga a faixa junto — mesma mecânica do `/painel` da spec
04, que morreu inteiro quando o `/dashboard` ficou pronto.

## C1 — a tela de arrumação

### Os nove potes aparecem, inclusive os vazios

É a B5 do outro lado. Se a tela derivar os potes das categorias, o pote sem
categoria nenhuma some — e some **exatamente da única tela onde daria para criar
uma categoria dentro dele**. Ficaria inalcançável para sempre.

`agruparParaGerir(potes, categorias)` percorre os potes e distribui as
categorias, em vez de agrupar as categorias e descobrir os potes. Puro e
testado, porque a diferença entre as duas frases é o defeito inteiro.

### Cada categoria mostra o que está pendurado nela

"Nunca foi usada" é a informação que faz esta tela valer a pena, pela mesma
razão que "já classificou 8" fez a D9 valer: transforma uma lista de nomes numa
lista de consequências. Categoria com zero é candidata a sumir; categoria com 12
é onde pensar duas vezes.

### O número da lista não é o número da confirmação

A lista carrega contagens para **orientar**. A confirmação de apagar chama o
raio-X da B3 de novo, e não reaproveita o que está na tela.

Parece redundante e não é: o número da lista foi lido quando a página abriu e a
confirmação pode acontecer minutos depois. Um número velho na tela de uma
operação destrutiva é o mesmo problema do "12 voltam" que a B3 já consertou —
só que por outra causa.

O raio-X também traz os destinos na ordem certa (mesmo pote primeiro), e derivar
isso da lista seria reimplementar em JS uma regra que já existe no servidor.

### Quatro modos por cartão

Vendo, renomeando, movendo, apagando — a forma do `CartaoDaRegra` da D9, que já
provou caber em 360px.

**Mover só aparece quando a categoria está vazia.** A regra é do servidor (B2) e
a tela a repete em vez de esconder o motivo: com lançamentos dentro, o botão sai
e uma linha explica por quê. Esconder sem explicar faria a pessoa procurar um
botão que ela viu ontem.

### Apagar pede dois toques, e o segundo tem o destino junto

Um toque abre a confirmação com o raio-X e o seletor de destino, com **"mover
para outra categoria" pré-selecionado** — decisão do Davi na pendência 2:
devolver 12 lançamentos para a fila é trabalho real, e quem escolhe isso deve
estar escolhendo de propósito, não por ser o caminho de menor resistência.

A frase e o alerta vêm da A3, já testados. A tela não escreve texto de
consequência à mão.

## C2 — o "+ Nova categoria" na revisão

**No fim da lista, e isso é o controle de risco da spec inteira.** Criar
categoria é fácil e barato, e uma conta com 60 categorias tem um painel que não
diz nada — o método dos potes funciona porque a lista cabe na cabeça. A tela não
impede; ela faz você passar por todas as que já existem primeiro.

`ListaDeCategorias` ganha um `rodape` opcional. Um `children` genérico convidaria
qualquer coisa a morar ali; um nome diz onde é e para quê.

### O botão "Criar" nasce apagado, e é de propósito

Mesma decisão do "Voltar" na D4 da spec 03 e do "Trocar categoria" na B3 da spec
04: o formulário abre e mostra a forma inteira, e o botão que gravaria fica
apagado com uma linha dizendo quem o liga.

Fingir que funciona seria pior do que estar apagado — e no portão o Davi precisa
ver onde ele vai ficar.

## O que fica de fora

**Reordenar categoria.** `ordem` existe e é respeitada; arrastar é outra tela e
não muda cálculo nenhum. Se a lista incomodar, aí há motivo.

**Seletor de emoji.** Campo de texto com uns poucos sugeridos, como a spec
decidiu. Um seletor completo é uma biblioteca inteira para um campo.

**Qualquer gravação.** Fase D.

## Pronto quando

- `/categorias` mostra os nove potes com suas categorias, os vazios inclusive;
- cada categoria mostra quantos lançamentos e regras dependem dela;
- criar, renomear, mover e apagar têm a forma visível e nenhuma grava;
- a confirmação de apagar mostra o raio-X, o destino e o alerta da A3;
- a revisão mostra o "+ Nova categoria" no fim da lista, com o "Criar" apagado;
- a rota está protegida e fora da barra;
- legível em 360px, alvos ≥44px;
- publicado, para o Davi ver no celular.
