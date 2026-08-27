# Spec — CSV de vários bancos

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Depende de:** spec 02, que construiu o leitor em quatro camadas e a tabela
`FORMATOS`; e spec 09, que fez a `/passos` derivar dali a lista de bancos que o
app entende
**Pedido do Davi:** _"nossa proposta será receber diferentes csvs nao apenas do
banco inter"_ (24/08/2026)
**Status:** ⚠ **rascunho, não aprovado.** Pendências decididas por mim — ver o
fim do documento. A bifurcação registrada em `references/estado-do-projeto.md`
está resolvida aqui, e a resolução é a única coisa desta spec que eu pediria
para o Davi ler antes de tudo.

> ⚠ Nenhum dado real neste documento.

## O que esta funcionalidade resolve

Hoje o app lê **dois arquivos**: o extrato de conta e a fatura do cartão do
Banco Inter. Quem tiver conta em outro lugar sobe o arquivo, recebe _"Não
reconheci este arquivo"_, e acabou — não há segundo caminho. O extrato dele não
entra, o mês dele não fecha, e o app não serve.

O `readme.md` §2 pedia "upload manual de CSV". Ele não disse de qual banco
porque, na época, só existia um usuário e ele só tinha um banco. As duas coisas
mudaram.

---

## O que eu medi antes de desenhar

### Descoberta 1 — o banco nunca chega ao banco de dados

Procurei onde a identidade do formato atravessa o app. `formato.id`
(`"inter-extrato"`, `"inter-fatura"`) aparece em **6 lugares, todos dentro de
`reconhecer.test.ts`**. Nenhum arquivo de produção pergunta de qual banco veio
um lançamento.

O que atravessa é outra coisa: **`Origem`** (`csv_conta` | `csv_cartao`).

| Onde `Origem` aparece                                                                   | O que ela decide                                    |
| --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `motor/sugestoes.ts`, `motor/trecho.ts`                                                 | como o motor recorta um trecho estável da descrição |
| `revisar-lancamento/criterioDaCorrecao.ts`, `pendentes.ts`                              | o critério de uma regra criada por correção         |
| `importarExtrato.service.ts:324`                                                        | de onde vem o mês do lançamento                     |
| `transactions.origem` e `imports.origem`, com `CHECK ... in ('csv_conta','csv_cartao')` | o esquema, em duas tabelas                          |

**Isto é a melhor notícia da spec.** A spec 02 separou "de que banco veio" de
"que tipo de papel é" — e a segunda é a única que o resto do app consome. Um
banco novo, portanto, **não toca** motor de classificação, painel, revisão,
comparativo, nem migração de banco de dados. Ele é uma entrada numa tabela.

⚠ E `importarExtrato.service.ts:324` merece ser lido em voz alta:

```ts
return origem === "csv_conta" ? data.slice(0, 7) : mesEscolhido;
```

O mês de um lançamento de conta vem da **data dele**; o de um cartão vem do
**mês escolhido pelo usuário**, porque a fatura de julho traz parcela de março.
Essa regra é sobre o papel do arquivo, não sobre o banco — ela continua certa
para qualquer instituição, de graça.

### Descoberta 2 — o reconhecimento já é por conteúdo, e já é uma tabela

`reconhecer()` não olha nome nem extensão: tenta **cada formato conhecido com o
dialeto dele** e vê de quem o cabeçalho bate. Acrescentar um banco é acrescentar
uma linha em `FORMATOS`.

E a spec 09 já ligou a ponta solta: a `/passos` deriva a lista de bancos de
`FORMATOS`, então **a tela de ajuda passa a citar o banco novo sozinha**, sem
ninguém lembrar de editá-la.

### Descoberta 3 — três coisas que só o arquivo real diz, e uma quarta que ninguém pensa em perguntar

Se acrescentar banco é uma linha, por que isto é uma spec e não uma tarde? Por
causa do que **não** se adivinha:

**1. O dialeto.** Separador, aspas e codificação. Os dois arquivos do Inter se
excluem: a fatura tem vírgula _dentro_ do campo de valor em 33 de 33 linhas, e o
extrato tem aspas soltas no meio de campo não citado em 21 de 21. Nenhuma
configuração única lê os dois. `references/formatos-de-extrato.md` abre com isso:
_"separador, decimal, aspas e codificação são as quatro coisas que todo mundo
supõe e quase todo mundo erra"_.

**2. O sinal.** O erro caro. No extrato, `-318,19` é dinheiro que saiu; na
fatura, uma compra de `R$ 15,00` é **positiva e é gasto**. Ler a fatura com a
convenção da conta transforma **todo gasto do cartão em receita**, e o mês fecha
com uma renda inventada de milhares de reais.

**3. O texto do pagamento de fatura.** É literal de cada banco: `Pagamento
efetuado: "Pagamento fatura cartao Inter"` na conta, `PAGAMENTO ON LINE` na
fatura. Sem ele, o mesmo dinheiro sai duas vezes.

**4. A conferência.** A régua do próprio `formatos-de-extrato.md`:

> Quando um formato novo entrar, procure uma conferência equivalente antes de
> confiar no parser. **Somar o que o próprio parser leu não prova nada.**

Para o Inter existem duas conferências independentes: a coluna `Saldo` como
testemunha (20 de 20 transições batem) e o total da fatura reaparecendo na
conta. Para um banco qualquer, **nenhuma das duas existe por padrão** — e essa é
a parte honestamente difícil desta spec.

### Descoberta 4 — a rede de segurança do item 3 já existe, e ela erra para o lado certo

`preparar.ts` marca **pares que se anulam** por valor igual, direções opostas e
até 3 dias de distância — e faz isso **sem olhar texto nenhum**, independente de
`padroesDePassagem`.

Então um banco novo com `padroesDePassagem` vazio não produz o desastre do item
3: o pagamento da fatura casa com a compra pelo valor, os **dois lados viram
`"revisao"`** e quem decide é o usuário. A marca não é "excluído" de propósito —
receber e devolver R$ 60 é anulação, receber salário e pagar aluguel do mesmo
valor não é.

**O padrão de degradação é o certo:** sem configuração, o app **pergunta**; ele
não inventa.

⚠ Com um limite real: o par só é detectado **dentro do mesmo envio**. Extrato do
banco A e fatura do banco B enviados separadamente não se encontram. Está nos
riscos.

---

## A bifurcação registrada, e por que ela é falsa

`references/estado-do-projeto.md` guardou a decisão em aberto assim:

> **medir cada banco** (o que existe hoje, e não escala) **ou ler CSV genérico
> com o usuário apontando as colunas** (que escala, e transfere para ele a chance
> de errar o sentido do sinal). Não dá para escolher sem um arquivo de outro
> banco na mão.

As duas são **a mesma operação em ordens diferentes**:

|        | Quem olha o arquivo | Onde o formato mora      | Quando                        |
| ------ | ------------------- | ------------------------ | ----------------------------- |
| Medir  | o Davi              | `formatos.ts`, no código | antes do usuário precisar     |
| Mapear | o usuário           | uma linha no banco       | no momento em que ele precisa |

Nos dois casos alguém olha um CSV e descreve dialeto, colunas e sinal. A
diferença é **quem**, e **quando**.

### A decisão: os dois, nessa ordem, e o segundo vira o primeiro

1. **`FORMATOS` continua sendo o caminho rápido.** Quando o arquivo bate, o app
   não pergunta nada — como hoje. Isso é estritamente melhor e não se abre mão.
2. **Quando nada bate, o beco sem saída vira uma porta.** Em vez de _"Não
   reconheci este arquivo"_ e ponto final, a pessoa ensina o app a ler aquele
   arquivo.
3. **O que ela ensinou vira um formato salvo.** Na próxima vez, `reconhecer()`
   acha sozinho, sem perguntar de novo.

O passo 3 é o que dissolve o "não escala". Escalar não é o Davi conseguir um CSV
de cada banco do Brasil — é **cada pessoa medir o dela uma vez, e o app
lembrar**. A opção B _vira_ a opção A, por usuário, sem o Davi precisar do
arquivo na mão.

E isso destrava a spec **hoje**: nada aqui depende de um CSV de outro banco
existir. Se um aparecer, ele entra em `FORMATOS` e passa na frente — o caminho
rápido não some por existir o caminho lento.

### O sinal não se resolve perguntando melhor. Resolve-se mostrando a consequência.

_"O valor negativo significa entrada ou saída?"_ é uma pergunta de convenção
contábil feita a quem só queria subir um extrato. Ninguém erra de propósito, e
ninguém sabe **conferir** a própria resposta.

O que a pessoa sabe conferir é o resultado:

> Com esta configuração, este arquivo tem **34 lançamentos**: R$ 4.812,00 de
> gasto e R$ 0,00 de entrada.

Com o sinal trocado, essa mesma frase diz _"R$ 4.812,00 de entrada"_ num arquivo
de fatura — e o erro fica visível **antes de gravar**, para alguém que não
precisa saber o que é convenção de sinal para saber que não recebeu R$ 4.812.

Sobre isso, duas ajudas:

- **O app propõe o palpite e diz por quê.** Numa fatura quase tudo é gasto: a
  leitura que deixa **menos linhas** como receita é quase sempre a certa. O
  palpite vem marcado, com a frase acima embaixo.
- **Quando dá para provar, prova.** Se o arquivo tiver coluna de saldo e a pessoa
  a apontar, o app roda a mesma conferência da spec 02 — aplicar cada valor ao
  saldo anterior tem de dar o saldo seguinte — e diz **"as 20 transições
  batem"**. Quando não dá, ele diz que não deu, em vez de fingir.

---

## Página: `/upload` — o que muda

**Propósito:** o mesmo de hoje. A mudança é uma saída onde antes havia parede.

### Componentes

| Componente                           | Estado inicial | Variações                                                            |
| ------------------------------------ | -------------- | -------------------------------------------------------------------- |
| `FormularioDeEnvio` (os dois campos) | inalterado     | inalterado                                                           |
| Mensagem de arquivo não reconhecido  | não aparece    | **nova variação:** traz o botão _"Ensinar o app a ler este arquivo"_ |

⚠ **Os dois campos continuam sendo `conta` e `cartão`, e isso não é preguiça.**
Eles são o **papel** do arquivo, não o banco. Enviar o extrato do banco A e o do
banco B são dois envios do campo "conta" — já funciona hoje, sem uma linha de
código, porque a impressão digital deduplica e `imports` guarda cada envio
separado. Trocar os campos por "um bloco por banco" seria refazer a tela para
resolver um problema que ela não tem.

### Comportamentos do usuário

| Ação do usuário                                 | Resposta do sistema                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Envia arquivo que bate com um formato conhecido | Idêntico a hoje. **Nenhuma pergunta nova.**                                                   |
| Envia arquivo que bate com um formato **dele**  | Idêntico a hoje. O formato salvo é indistinguível de um de código                             |
| Envia arquivo que não bate com nada             | A mensagem de hoje (com o candidato mais próximo, quando houver) **mais** o botão de ensinar  |
| Toca em "Ensinar o app a ler este arquivo"      | Vai para o mapeamento, **com o arquivo já carregado** — reenviar seria a primeira desistência |

### Dados envolvidos

- **Lê:** os formatos de código **e** os formatos salvos do usuário
- **Escreve:** nada de novo

---

## Página: `/formatos/novo` — ensinar um arquivo

**Propósito:** transformar um CSV que o app não conhece num formato que ele
conhece, sem que a pessoa precise saber o que é dialeto, separador ou sinal.

⚠ **É a tela mais difícil do app**, e o risco dela é conhecido: sete perguntas
técnicas seguidas fazem qualquer pessoa fechar a aba. **Toda resposta chega
pré-preenchida com um palpite**; a pessoa confere, não preenche. Se ela só tocar
em "Salvar", tem de dar certo no caso comum.

### Componentes

| Componente           | Estado inicial                                                   | Variações                                                                        |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Prévia da grade      | primeiras ~10 linhas, como o app leu, com a do cabeçalho marcada | **ilegível:** uma coluna só → o dialeto está errado, e a tela diz isso           |
| Dialeto              | separador e aspas propostos pela leitura que dá mais colunas     | erro de codificação (`AlimentaÃ§Ã£o` visível na prévia)                          |
| Linha do cabeçalho   | proposta: a primeira que parece cabeçalho                        | nenhuma parece → a pessoa escolhe na prévia                                      |
| Colunas obrigatórias | data, descrição, valor — propostas pelo conteúdo das células     | **faltando:** salvar fica bloqueado, nomeando qual falta                         |
| Colunas opcionais    | saldo, categoria, tipo — vazias                                  | saldo apontado → liga a conferência                                              |
| Este arquivo é       | extrato de conta / fatura de cartão                              | —                                                                                |
| Sinal                | palpite marcado, com a frase da consequência embaixo             | **a frase muda ao vivo** quando a pessoa troca a marcação                        |
| Conferência do saldo | não aparece                                                      | **bate:** "as N transições batem" · **não bate:** diz em qual linha desencontrou |
| Nome do banco        | vazio                                                            | nome repetido → aproveita o mesmo `banco`                                        |

### Comportamentos do usuário

| Ação do usuário                         | Resposta do sistema                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Chega na tela                           | O app já leu o arquivo e propôs **tudo**. A prévia mostra o resultado do palpite                                                |
| Troca o separador                       | A prévia se redesenha na hora. É o único jeito de a pessoa saber que acertou                                                    |
| Aponta a coluna de valor                | A frase da consequência aparece: quantos lançamentos, quanto entrou, quanto saiu                                                |
| Troca a marcação do sinal               | A mesma frase **inverte na hora**. É aqui que o erro caro fica visível                                                          |
| Aponta a coluna de saldo                | A conferência roda e diz se bate — ou em qual linha desencontrou                                                                |
| Tenta salvar sem uma coluna obrigatória | Salvar bloqueado, nomeando a que falta. Nunca "preencha os campos"                                                              |
| Salva                                   | Grava o formato, volta para a `/upload` e **importa o arquivo na hora** — a pessoa veio subir um extrato, não configurar um app |
| Desiste                                 | Nada é gravado. O arquivo nunca chegou ao banco de dados                                                                        |

### Dados envolvidos

- **Lê:** os bytes do arquivo (**em memória, nunca gravados** — spec 02, C3: o
  que se perde sem o CSV são as linhas ignoradas, e essas já viram
  `imports.ignoradas`)
- **Escreve:** uma linha em `user_formats`

---

## Página: `/formatos` — o que o app aprendeu a ler

**Propósito:** um formato salvo errado envenena **todo envio futuro** daquele
banco, em silêncio. Ele precisa ser visível, editável e apagável. Sem esta tela,
o único conserto seria mexer no banco de dados.

### Componentes

| Componente               | Estado inicial               | Variações                                       |
| ------------------------ | ---------------------------- | ----------------------------------------------- |
| Lista de formatos salvos | um cartão cada               | **vazio:** explica que ainda não ensinou nenhum |
| Formatos de código       | listados à parte, sem editar | —                                               |

### Comportamentos do usuário

| Ação do usuário    | Resposta do sistema                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Toca em um formato | Abre o mesmo mapeamento, agora com os valores salvos                                                        |
| Apaga um formato   | Confirma primeiro, dizendo **quantos envios usaram aquele formato**. Os lançamentos já importados **ficam** |
| Não tem nenhum     | A tela explica que o app já entende Inter e que os outros se ensinam do `/upload`                           |

⚠ **Apagar formato não apaga lançamento.** São coisas diferentes: o formato é a
receita de leitura, o lançamento é o que foi lido. Desfazer importação já existe
na `/upload` desde a spec 02, e é lá que continua.

### Dados envolvidos

- **Lê:** `user_formats` do usuário, e a contagem de `imports` por formato
- **Escreve:** altera e apaga `user_formats`

---

## Dados — a tabela nova

`user_formats`, uma linha por formato ensinado:

| Coluna                           | O quê                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| `id`, `user_id`                  | como todas. `user_id` de `garantirUsuario()`, nunca do cliente |
| `nome`, `banco`                  | como aparece em erro e na `/passos`                            |
| `origem`                         | `csv_conta` \| `csv_cartao` — o mesmo CHECK das outras         |
| `dialeto`                        | separador e aspas                                              |
| `colunas`                        | papel → nome da coluna                                         |
| `sinal_negativo`                 | `entrada` \| `saida`                                           |
| `formato_data`, `formato_numero` | o que a prévia confirmou                                       |
| `padroes_de_passagem`            | vazio por padrão — a Descoberta 4 cobre o caso comum           |

⚠ **`transactions` e `imports` não ganham coluna nenhuma.** Pela Descoberta 1, o
formato não atravessa: o que se grava é `origem`, que já existe e já tem CHECK. A
migração é **uma tabela nova, zero alteração nas existentes** — nada do que já
está no banco se mexe.

`reconhecer()` passa a **receber** a lista de formatos, em vez de importar
`FORMATOS` direto. Ela continua sem `import "server-only"` e continua testável
com bytes na mão: quem busca no banco é quem chama.

---

## Riscos

**A tela de mapeamento é onde esta spec morre, se morrer.** Sete perguntas
técnicas. O palpite pré-preenchido não é conforto — é a funcionalidade. Se a
prévia não redesenhar ao vivo, ninguém tem como saber se acertou, e a tela vira
um formulário chutado.

**Um formato salvo errado é pior que um arquivo recusado.** Recusado, a pessoa
sabe. Salvo errado, ele importa com convicção todo mês. É por isso que a
`/formatos` existe na mesma spec, e não depois.

**Dois formatos podem empatar.** `formatos.ts` diz hoje: _"a ordem importa só no
empate, que hoje não existe"_. Com formatos de usuário ele passa a existir — dois
bancos com cabeçalho `Data,Descrição,Valor` são plausíveis. **Decisão: formato do
usuário ganha do de código, e entre dois dele ganha o mais recente** — quem
ensinou por último ensinou sabendo do anterior. Se empatar, a `/formatos` é onde
se conserta.

**O par que se anula não atravessa envios.** A Descoberta 4 vale dentro de um
envio. Extrato do banco A e fatura do banco B mandados separadamente não se
encontram, e o pagamento da fatura conta duas vezes. Isso **já é verdade hoje** e
não piora — mas com vários bancos fica mais provável, porque os arquivos deixam
de vir aos pares.

**A conferência do saldo depende de o banco mandar saldo.** Fatura de cartão
nunca manda. Para esses, a única prova é a frase da consequência — que é fraca,
e a spec não deve fingir o contrário.

**A `/passos` vai citar bancos que ela não sabe explicar.** Ela deriva a lista de
`FORMATOS` e ensina o passo a passo do Inter. Um banco ensinado pelo usuário
entra na lista sem passo a passo. A tela precisa distinguir "o app lê" de "o app
sabe te ensinar a baixar".

---

## Pendências — decididas

⚠ **Decisões minhas, todas derrubáveis.** A primeira é a única que muda a spec
inteira.

**1. Medir cada banco ou mapeamento genérico?** ➡️ **Os dois, e o mapeamento
salvo vira medição.** É a seção "A bifurcação é falsa". Destrava a spec sem
depender de um CSV de outro banco existir.

**2. Como evitar o erro do sinal?** ➡️ **Não se pergunta melhor: mostra-se a
consequência.** Palpite proposto + a frase de quanto entrou e quanto saiu,
mudando ao vivo. Mais a conferência do saldo quando o arquivo permitir.

**3. Os campos da `/upload` viram "um por banco"?** ➡️ **Não.** Eles são papéis,
não bancos. Vários bancos já funcionam como vários envios.

**4. `transactions` ganha coluna de formato?** ➡️ **Não.** Descoberta 1: o
formato não atravessa. Uma tabela nova, zero alteração nas existentes.

**5. Quem ganha no empate de reconhecimento?** ➡️ **O formato do usuário, e entre
os dele o mais recente.**

**6. Apagar formato apaga o que ele importou?** ➡️ **Não.** Receita de leitura e
comida são coisas diferentes. Desfazer importação já existe na `/upload`.

**7. XLSX/OFX entram nesta spec?** ➡️ **Não.** A camada `grade.ts` foi feita para
receber XLSX mexendo só nela — está escrito lá desde a spec 02 — mas misturar
"outro banco" com "outro tipo de arquivo" faz uma spec que não fecha. CSV
primeiro.

**8. `padroesDePassagem` na tela de mapeamento?** ➡️ **Não.** É a pergunta que
ninguém sabe responder, e a Descoberta 4 mostra que a falta dela manda o caso
para revisão em vez de errar o mês. Fica vazio, e a `/formatos` pode ganhar isso
depois se doer.

---

## O que fica de fora, e por quê

| Fora                                  | Por quê                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| PDF de fatura                         | Fase 2 do `readme.md`, e é outro problema — extrair tabela de PDF não é ler CSV                                                                  |
| XLSX e OFX                            | Pendência 7                                                                                                                                      |
| Open Finance                          | Fora de escopo declarado, `readme.md` §13                                                                                                        |
| Compartilhar formato entre usuários   | Um formato salvo é a leitura de um arquivo, e chega com o nome do banco escrito por uma pessoa só. Compartilhar erro é pior que repetir trabalho |
| Detectar o banco pelo nome do arquivo | `reconhecer.ts` já explica: o nome mente. Os dois arquivos do Davi foram renomeados por gente                                                    |

---

## Como saber que funcionou

1. **Nada do que existe muda.** Os testes de `reconhecer`, `lancamentos` e
   `preparar` passam **sem uma linha alterada** — é a prova de que o caminho
   rápido não foi tocado. Como o `tema.test.ts` foi na spec 10.
2. **Um CSV inventado de um banco que não existe** é ensinado, salvo, e
   reconhecido sozinho no segundo envio.
3. **O sinal trocado é visível na tela** antes de gravar, e a frase inverte ao
   vivo quando a marcação muda.
4. **A conferência do saldo reprova** um mapeamento que aponta a coluna errada.
