# Plano — A3 · Camada 2: grade vira lançamentos

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A3 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK
**Spec:** `specs/02-upload-de-extrato.md`, "Ler o arquivo"
**Depende de:** A1 (`82d2336`) e A2 (`dc42591`)

## A descoberta que muda o desenho

Os dois arquivos usam o sinal do valor com **significados opostos**:

| Arquivo | `-318,19` | `15,00` |
|---|---|---|
| Extrato da conta | dinheiro **saiu** | dinheiro **entrou** |
| Fatura do cartão | crédito — **abate** a fatura | compra — dinheiro **vai sair** |

Na fatura, uma compra de R$ 15,00 é positiva e é gasto; o único negativo do
arquivo medido é o `PAGAMENTO ON LINE` de `-R$ 318,19`, que é o pagamento da
fatura, não uma despesa.

Ou seja: **`direcao` não sai do sinal sozinha — depende do formato.** Cada
formato passa a declarar o que o negativo significa nele. Se eu tivesse
assumido "negativo é saída" para os dois, todo gasto do cartão viraria receita,
e o mês fecharia com uma renda inventada de alguns milhares de reais.

Isso também encerra a dúvida entre guardar valor com sinal ou valor positivo
mais `direcao`: como o sinal não é interpretável sem saber a origem,
**`direcao` é informação de verdade**, não duplicação. Fica valor sempre
positivo em centavos, e a direção ao lado.

## Data é dia de calendário, não instante

Devolve `"2026-06-02"`, uma string, e não um `Date`.

Um `Date` é um instante no tempo, e um instante precisa de fuso. `02/06/2026`
não é um instante — é um dia. Convertido para `Date` no servidor da Vercel
(UTC) e lido no Brasil, `02/06/2026 00:00Z` vira `01/06` às 21h. O lançamento
muda de dia, e às vezes de mês — justo num produto cujo eixo é "mês de
referência".

`YYYY-MM-DD` como texto não tem fuso para errar, ordena alfabeticamente na
ordem certa, e é o que a coluna `date` do Postgres guarda (C1).

## Dinheiro é inteiro, e a conta é feita em texto

`parseFloat("1.200,00")` não existe em pt-BR, e mesmo o caminho
`parseFloat("1200.00") * 100` devolve erro de ponto flutuante — o clássico
`19.90 * 100 === 1989.9999999999998`. Um centavo perdido por lançamento, em
silêncio.

Então: separa a parte inteira da decimal **como texto** e monta
`inteiro * 100 + centavos`. Nunca passa por float.

Formatos aceitos, todos medidos ou triviais:

| Entrada | Centavos |
|---|---|
| `1.200,00` | 120000 |
| `-60,00` | -6000 |
| `R$ 15,00` | 1500 |
| `-R$ 318,19` | -31819 |
| `R$ -318,19` | -31819 |
| `1200` | 120000 |
| `1,5` | 150 |

**Leitura estritamente pt-BR:** a vírgula é decimal e o ponto é milhar. `1.200`
é mil e duzentos, não um e vinte. Aceitar as duas convenções obrigaria a
adivinhar, e adivinhar errado aqui erra por cem vezes.

## Linha ruim não derruba o arquivo

| Tipo de linha | O que acontece |
|---|---|
| Toda vazia | Ignorada **em silêncio** — é o rodapé do arquivo |
| Curta demais para ter as colunas | Contada como ignorada, com motivo |
| Data inválida (`31/02/2026`, `2026-06-02`) | Contada, com motivo |
| Valor ilegível | Contada, com motivo |
| Descrição vazia | Contada, com motivo |

O resultado traz `lancamentos` e `ignoradas`, e cada ignorada carrega **número
da linha, motivo e o conteúdo original**. É o que a tela de resumo (B2) vai
mostrar: "3 linhas ignoradas" sem dizer quais é uma mensagem que só gera
desconfiança.

## O que a fatura tem a mais

- **`parcela`** — de `Tipo`: `Parcela 4/12` vira `"4/12"`; `Compra à vista`
  vira `null`. O arquivo medido tem 1/2, 2/2, 2/6 e 4/12.
- **`categoriaDoBanco`** — de `Categoria`, guardada como veio. É palpite para a
  próxima spec, **nunca** verdade: no arquivo medido o Mercado Livre veio como
  `TRANSPORTE`.

## Descrição: só apara as pontas

Não junta espaços do meio. `"ALLPARK SHOPP MT CARMO Betim         BRA"` tem
colunas alinhadas por espaço, e essa estrutura pode servir para separar
estabelecimento de cidade depois. Normalizar para comparar é da A4, que faz uma
cópia; destruir aqui seria irreversível.

## Interface

```
paraLancamentos(r: Reconhecimento & { ok: true }): Leitura

type Lancamento = {
  data: string              // "2026-06-02"
  descricao: string
  valorCentavos: number     // sempre positivo
  direcao: "entrada" | "saida"
  parcela: string | null
  categoriaDoBanco: string | null
  linha: number             // linha no arquivo, para o resumo apontar
}

type Leitura = { lancamentos: Lancamento[]; ignoradas: LinhaIgnorada[] }
```

## Edge cases

| Situação | Tratamento |
|---|---|
| Valor `0,00` | Aceito. Direção vem do formato; zero não é erro |
| Valor com mais de 2 casas | Ignorado, com motivo — banco não faz isso, e arredondar em silêncio é pior |
| Valor com sinal `+` | Aceito como positivo |
| Espaço fino ou não separável dentro do valor | Removido antes de converter |
| Dia ou mês fora da faixa | Ignorado, com motivo |
| `29/02` em ano não bissexto | Ignorado — a checagem confere se a data existe, não só a faixa |
| Ano de 2 dígitos | Ignorado, com motivo. Adivinhar século é convite a erro |
| Coluna opcional ausente | `parcela` e `categoriaDoBanco` viram `null` |
| Célula a mais na linha | Ignorada — o acesso é por índice de papel |
| Nenhuma linha válida | `lancamentos` vazio, sem erro. Quem decide se isso é falha é a D2 |

## Fora do escopo

- Impressão digital, pagamento de fatura e par zero-a-zero → **A4**
- Decidir o `mes_referencia` de cada lançamento → **D2**
- Classificar → próxima spec

## Critério de pronto (da Etapa 2)

- [ ] Cada formato converte suas linhas em data, descrição, valor em centavos e direção
- [ ] Cobre `1.200,00`, `-60,00`, `R$ 15,00`, `-R$ 318,19`
- [ ] Linha inválida não derruba o arquivo: é contada e reportada
- [ ] Do cartão, guarda `parcela` e `categoria_do_banco`
