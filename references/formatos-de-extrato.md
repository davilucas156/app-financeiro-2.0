# Formatos de extrato — medidos, não supostos

Documento vivo. Cada formato aqui foi **medido em arquivo real** do Davi; os
arquivos em si nunca entram no repositório (`.gitignore`), porque carregam
número de conta, nomes de pessoas e o gasto do mês inteiro. As linhas de
exemplo abaixo são inventadas, seguindo o formato exato.

> Ao acrescentar um banco novo: meça o arquivo antes de escrever parser.
> Separador, decimal, aspas e codificação são as quatro coisas que todo mundo
> supõe e quase todo mundo erra.

---

## Banco Inter — Extrato de conta corrente

Baixado como "Extrato ... CSV".

| Propriedade               | Valor                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| Codificação               | UTF-8, **sem** BOM                                               |
| Separador                 | `;` (ponto e vírgula)                                            |
| Aspas nos campos          | **nenhuma**                                                      |
| Linhas antes do cabeçalho | 5 (4 de metadados + 1 em branco)                                 |
| Cabeçalho                 | `Data Lançamento;Descrição;Valor;Saldo`                          |
| Data                      | `dd/mm/aaaa`                                                     |
| Valor                     | `1.200,00` — milhar `.`, decimal `,`, negativo com `-` na frente |
| Sentido                   | pelo sinal do valor                                              |

```
Extrato Conta Corrente
Conta ;12345678
Período ;02/06/2026 a 02/07/2026
Saldo: ;665,25

Data Lançamento;Descrição;Valor;Saldo
02/06/2026;Pix recebido: "Cp :12345678-FULANO DE TAL";1.200,00;2.581,55
03/06/2026;Pix enviado: "Cp :00000000-Beltrana";-10,00;1.993,36
```

⚠ **Há aspas `"` no meio de campos que não são citados** — 21 das 21 linhas de
dados do arquivo medido. Um parser CSV estrito (RFC 4180) rejeita ou embaralha
isso, porque aspas só valem no início do campo. Aqui a separação é por `;`
puro, sem tratamento de aspas.

---

## Banco Inter — Fatura do cartão

| Propriedade               | Valor                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Codificação               | UTF-8 **com BOM** (`EF BB BF`)                                                                     |
| Separador                 | `,` (vírgula)                                                                                      |
| Aspas nos campos          | **todos** entre aspas                                                                              |
| Linhas antes do cabeçalho | 0                                                                                                  |
| Cabeçalho                 | `Data,Lançamento,Categoria,Tipo,Valor`                                                             |
| Data                      | `dd/mm/aaaa`                                                                                       |
| Valor                     | `"R$ 15,00"` — prefixo `R$ `, decimal `,`. Negativo: `"-R$ 318,19"`, com o sinal **antes** do `R$` |
| Sentido                   | quase tudo é saída; o negativo é o pagamento da fatura                                             |

```
"Data","Lançamento","Categoria","Tipo","Valor"
"27/06/2026","LOJA EXEMPLO           Betim         BRA","TRANSPORTE","Compra à vista","R$ 15,00"
"12/06/2026","OFICINA EXEMPLO        BETIM         BRA","OUTROS","Parcela 1/2","R$ 166,50"
"02/06/2026","PAGAMENTO ON LINE","OUTROS","Compra à vista","-R$ 318,19"
```

⚠ **Este arquivo exige tratamento de aspas, e o do extrato exige o contrário.**
Toda linha de dados tem uma vírgula **dentro** do campo de valor (`R$ 15,00`):
33 linhas com 5 vírgulas contra 4 no cabeçalho. Separar por `,` puro quebraria
todas. **Um mesmo parser não lê os dois arquivos** — são duas configurações.

### O que só este arquivo tem

- **`Tipo` traz parcelamento:** `Compra à vista`, `Parcela 1/2`, `Parcela 4/12`.
  A fatura de julho medida continha uma parcela de uma compra de **março**.
- **`Categoria` é a classificação do próprio banco:** TRANSPORTE, RESTAURANTES,
  PETSHOP, LIVRARIAS… Útil como **palpite**, nunca como verdade — no arquivo
  medido, uma compra no Mercado Livre veio como `TRANSPORTE` e uma oficina
  mecânica como `OUTROS`.

---

## O sinal significa o oposto em cada arquivo

|                  | Negativo                    | Positivo                      |
| ---------------- | --------------------------- | ----------------------------- |
| Extrato da conta | dinheiro **saiu**           | dinheiro **entrou**           |
| Fatura do cartão | crédito, **abate** a fatura | compra, dinheiro **vai sair** |

Na fatura, uma compra de 15,00 é positiva **e é gasto**. Assumir "negativo é
saída" para os dois faria todo gasto do cartão virar receita, e o mês fecharia
com uma renda inventada de milhares de reais. Cada formato declara isso em
`sinalNegativo` (`src/features/upload/ler-arquivo/formatos.ts`).

## Conferência cruzada — os dois arquivos se validam

Duas checagens independentes que o parser tem de passar, e passa:

1. **A coluna `Saldo` do extrato é testemunha.** Aplicando cada valor lido ao
   saldo da linha anterior, o resultado tem de dar exatamente o saldo da linha
   seguinte. No arquivo medido: **20 de 20 transições batem**, e o saldo final
   calculado é o mesmo do cabeçalho do arquivo.
2. **O total da fatura tem de aparecer na conta.** A soma das compras da
   fatura de julho deu **1.865,27** — o mesmo valor do lançamento
   `Pagamento efetuado: "Pagamento fatura cartao Inter"` de 01/07 no extrato.
   Dois arquivos, dois parsers, formatos opostos, e o número fecha.

Quando um formato novo entrar, procure uma conferência equivalente antes de
confiar no parser. Somar o que o próprio parser leu não prova nada.

## O par que se anula, entre os dois arquivos

O pagamento da fatura aparece **duas vezes**, uma em cada arquivo:

| Arquivo | Linha                                                 | Valor        |
| ------- | ----------------------------------------------------- | ------------ |
| Extrato | `Pagamento efetuado: "Pagamento fatura cartao Inter"` | `-318,19`    |
| Fatura  | `PAGAMENTO ON LINE`                                   | `-R$ 318,19` |

Importar os dois sem tratamento faz R$ 318,19 sair da conta **duas vezes**, e o
mês fecha errado para menos. O `readme.md` §7 já previa isso ("exclusões
automáticas: pagamento de fatura"); os textos exatos acima são o que permite
detectar.

---

## Formato que o usuário ensina (spec 11)

Os formatos acima foram **medidos por quem escreveu o app**. A spec 11
acrescentou o outro caminho: quando nenhum formato conhecido reconhece o
arquivo, a pessoa ensina o app a lê-lo, e o que ela ensinou vira uma linha em
`user_formats` — reconhecida sozinha a partir do envio seguinte.

> A régua deste documento continua valendo para o **código**: formato que entra
> em `FORMATOS` se mede em arquivo real antes de virar parser. O que muda é que
> deixou de ser o único jeito de o app ler um banco.

### O que um formato precisa declarar

|                                         | De onde sai                                                       |
| --------------------------------------- | ----------------------------------------------------------------- |
| Separador e tratamento de aspas         | proposto por `palpite.ts`, conferido na tela                      |
| Linha do cabeçalho                      | proposta: a primeira com a largura da tabela e nenhum dado dentro |
| Colunas (data, descrição, valor, saldo) | propostas **pelo conteúdo das células**, nunca pelo nome          |
| Formato de data                         | o que lê a coluna inteira                                         |
| Convenção de número                     | idem                                                              |
| O que o sinal negativo significa        | a leitura que deixa menos linhas como entrada                     |

⚠ **O formato é gravado com o _nome_ da coluna, não com o índice.** A pessoa
aponta a terceira coluna na tela; o que vai para o banco é `"Vlr"`. Índice
quebraria **em silêncio** no dia em que o banco acrescentasse uma coluna à
esquerda — o formato continuaria casando e passaria a ler a coluna errada. Por
nome ele deixa de casar, e a pessoa vê "não reconheci", que é falhar em voz alta.

### As duas armadilhas, e o que as segura

**O sinal.** Já documentado acima: na conta, negativo é saída; na fatura, uma
compra positiva é gasto. Lido ao contrário, todo gasto do cartão vira receita.

A defesa **não é uma pergunta melhor** — "o negativo é entrada ou saída?" é
convenção contábil perguntada a quem só queria subir um extrato, e ninguém sabe
conferir a própria resposta. A defesa é a tela mostrar a consequência:

> 34 lançamentos: R$ 4.812,00 de gasto e R$ 0,00 de entrada.

Com o sinal trocado, a mesma frase diz "R$ 4.812,00 de entrada" numa fatura.

**A data.** `01/02/2026` é 1º de fevereiro ou 2 de janeiro, e **as duas leituras
são plausíveis**. Só o arquivo desempata, e só quando tem algum dia acima de 12.

⚠ Este erro é pior que o do sinal de um jeito específico: sinal trocado aparece
num total, data trocada **move lançamentos de mês** — e o mês é o eixo do painel,
do comparativo e da média. Não tem sintoma. Por isso o palpite nunca propõe
`mm/dd` por preferência, e a prévia mostra as datas **já lidas**.

### A conferência, quando o arquivo permite

A régua deste documento — _"somar o que o próprio parser leu não prova nada"_ —
vale igual aqui. Quando o mapeamento aponta uma coluna de saldo, a tela roda a
mesma checagem do Inter: cada valor aplicado ao saldo da linha anterior tem de
dar o saldo da seguinte, e ela diz quantas transições batem.

⚠ **Fatura de cartão nunca traz saldo.** Para esses, a única defesa é a frase da
consequência, que é mais fraca — e a tela **diz isso**, em vez de fingir que
conferiu.

### O que o usuário não declara, e por quê

`padroesDePassagem` — o texto do pagamento de fatura — nasce **vazio**, e a tela
não pergunta. É a pergunta que ninguém sabe responder, e a falta dela não produz
o desastre do dinheiro saindo duas vezes: `prepararLancamentos` casa pares que se
anulam **por valor e data, sem olhar texto**, e marca os dois lados como
"revisão".

Sem configuração o app **pergunta**; ele não inventa.
