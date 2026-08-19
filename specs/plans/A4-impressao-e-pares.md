# Plano — A4 · Impressão digital e pares que se anulam

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** A4 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK
**Spec:** `specs/02-upload-de-extrato.md`, "Não duplicar" e pendências 2 e 4
**Depende de:** A3 (`8b9512c`)

## Três coisas, e a primeira decide as outras

## 1. Impressão digital — e o problema que ela quase cria

A C1 vai pôr um único em `(user_id, impressao)`. É o que torna reimportar um
arquivo inofensivo: mesma impressão, `on conflict do nothing`, nada duplica.

Só que uma impressão feita de `data + valor + descrição + origem` **quebra a
pendência 2**. Duas compras iguais no mesmo dia — dois cafés de R$ 12 — geram a
mesma impressão, e o banco engoliria a segunda. O usuário perderia um
lançamento real e não teria como saber.

A saída é acrescentar a **ordem da ocorrência** à impressão: a primeira linha
idêntica é `1`, a segunda é `2`, e assim por diante dentro do mesmo arquivo.

| Cenário | Impressões | Resultado |
|---|---|---|
| Dois cafés de R$ 12 no mesmo dia | `…\|1` e `…\|2` | **Os dois entram**, como manda a pendência 2 |
| O mesmo arquivo enviado de novo | `…\|1` e `…\|2` de novo | Colidem com as anteriores; nada duplica |
| Arquivo diferente com um dos dois | `…\|1` | Colide com a primeira; não entra de novo |

O mesmo campo resolve os dois casos porque a numeração é **determinística**:
depende só do conteúdo do arquivo, não da hora do envio.

### Por que hash e não texto legível

Texto composto (`csv_conta|2026-06-02|-6000|PIX RECEBIDO…|1`) seria mais fácil
de depurar, mas a coluna é indexada e única, e descrição de banco não tem
tamanho garantido — o índice btree do Postgres tem limite por entrada. SHA-256
em hexadecimal é sempre 64 caracteres.

### Normalização da descrição, só para a impressão

Caixa alta, sem acento, espaços repetidos juntados. `"LOJA    Betim   BRA"` e
`"Loja Betim BRA"` viram a mesma coisa.

É uma **cópia** — a `descricao` original continua intacta, com o alinhamento
por espaço que a A3 preservou de propósito. Normalizar aqui evita que uma
mudança de espaçamento na exportação do banco faça o mesmo lançamento parecer
novo no mês seguinte.

## 2. Pagamento de fatura

Aparece nos dois arquivos e, importado dos dois, tira o mesmo dinheiro duas
vezes (medido: `-318,19` em ambos, em 02/06).

Conforme a pendência 4, **entra e é marcado como excluído do cálculo**, com o
motivo registrado — não fica de fora. Você continua vendo que aconteceu, e o
total não conta duas vezes.

Os padrões vêm dos arquivos reais e ficam junto do formato, porque o texto
difere entre eles:

| Origem | Texto medido |
|---|---|
| `csv_conta` | `Pagamento efetuado: "Pagamento fatura cartao Inter"` |
| `csv_cartao` | `PAGAMENTO ON LINE` |

## 3. Par que se anula

Mesmo valor, direções opostas, datas próximas. **Nada é apagado** — os dois
lados são marcados para revisão, e quem decide é você.

O extrato real tem um caso limpo: em 09/06, `Aplicacao: "CDB Porq Obj"` de
`-435,29` e `Pix recebido` de `+435,29`. Dinheiro que saiu e voltou no mesmo
dia.

- **Janela de 3 dias.** Zero seria estreito demais (Pix devolvido costuma cair
  no dia seguinte) e uma semana começaria a casar coisas sem relação, num mês
  em que valores redondos se repetem.
- **Cada lançamento entra em um par só.** Sem isso, três valores iguais
  virariam três pares cruzados e a revisão viraria ruído.
- **Marcado é sugestão, não veredito.** É por isso que a marca é "revisão" e
  não "excluído": receber e devolver R$ 60 é anulação; receber salário e pagar
  aluguel do mesmo valor não é.

## Interface

```
prepararLancamentos(entradas: { origem, lancamentos }[]): LancamentoPreparado[]

type LancamentoPreparado = Lancamento & {
  origem: Origem
  impressao: string                  // sha-256 hex
  marcacao: "normal" | "excluido" | "revisao"
  motivo: string | null
  parDe: string | null               // impressão do outro lado do par
}
```

Recebe **uma lista de arquivos**, não um só: o pagamento de fatura e o par que
se anula só aparecem quando os dois arquivos são olhados juntos. Quem chama com
um arquivo só continua funcionando — só encontra menos.

## Edge cases

| Situação | Tratamento |
|---|---|
| Lista vazia | Devolve vazio |
| Um arquivo só | Funciona; acha menos pares |
| Três lançamentos iguais no mesmo dia | Ocorrências 1, 2, 3 — os três entram |
| Valor zero com direções opostas | Não vira par: casaria tudo com tudo |
| Par já marcado como pagamento de fatura | A marca de exclusão vence; não vira também "revisão" |
| Mesmo valor, mesma direção | Não é par |
| Datas a 4 dias | Fora da janela |
| Vários candidatos ao mesmo par | Vence o de data mais próxima; empate, o de linha menor |

## Fora do escopo

- Gravar no banco → **D2**
- Decidir o `mes_referencia` → **D2**
- Classificar em potes → próxima spec

## Critério de pronto (da Etapa 2)

- [ ] Existe a chave que identifica lançamento repetido
- [ ] Pagamento de fatura detectado nos dois arquivos
- [ ] Par zero-a-zero detectado
- [ ] Nada é apagado — os dois lados são marcados
