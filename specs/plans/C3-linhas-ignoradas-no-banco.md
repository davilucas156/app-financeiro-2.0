# Plano — C3 · Linhas ignoradas no banco

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C3 de `specs/02-upload-de-extrato.tarefas.md` (acrescentada depois da D5)
**Camada:** BANCO + FRONT-INTEGRADO

## De onde veio

Da conversa sobre o Blob. Decidimos **não** guardar o arquivo original — o
histórico do app do Inter cobre o caso de reprocessar, e um bucket com o
extrato inteiro é dado sensível parado à toa.

Mas ao medir o que exatamente se perdia sem o arquivo, apareceu um buraco que
o Blob estava escondendo: as linhas que o leitor **não conseguiu ler** eram
mostradas na tela uma vez e sumiam. No banco ficava só `linhas_ignoradas: 3`.

Dois meses depois o app sabe que ignorou três coisas em junho e não sabe dizer
quais — e é justamente o caso em que você não vai lembrar de ir procurar.

## A troca

`linhas_ignoradas` (integer) **sai**. Entra `ignoradas` (jsonb):

```json
[{ "linha": 12, "motivo": "data inválida", "conteudo": "31/02/2026;X;-10,00" }]
```

A contagem não desaparece — ela passa a sair de `.length`. Guardar o número
**e** a lista seria manter o mesmo fato em dois lugares, que é só uma forma de
eles divergirem (o mesmo raciocínio que tirou `TAMANHO_MAXIMO` de dentro do
serviço na D3).

São poucas linhas de texto, e não o arquivo inteiro: é o mínimo que responde
"o que eu perdi?" sem manter o extrato completo parado em algum lugar.

## Duas migrations para uma mudança

O `drizzle-kit` não tem como saber sozinho se `ignoradas` é um **rename** de
`linhas_ignoradas` ou uma coluna nova — os tipos nem batem — e para perguntar
ele exige terminal interativo, que o meu ambiente não tem.

Então a mudança saiu em dois passos, cada um sem ambiguidade:

| Migration | O quê |
|---|---|
| `0004` | `add column ignoradas jsonb not null default '[]'` |
| `0005` | `drop column linhas_ignoradas` |

Sem backfill: a tabela estava vazia.

## Onde aparece

O **motivo** é a informação; o número é consequência dele. Então as linhas
ignoradas passam a aparecer nos dois lugares:

| Onde | Quando |
|---|---|
| Resumo da importação | No instante do envio (já existia) |
| Histórico "Já importados" | Meses depois, num `<details>` fechado |

Um componente só (`LinhasIgnoradas.tsx`) para os dois. Duas cópias do mesmo
desenho divergiriam, e o histórico — que é o menos olhado — seria o que
ficaria para trás.

`<details>` nativo e não estado meu: abre e fecha sem JavaScript, e o leitor de
tela já anuncia que é seção expansível.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nenhuma linha ignorada | O `<details>` nem aparece |
| 1 linha | "1 linha ficou de fora", no singular |
| Linha sem espaço nenhum | `break-all`, para não estourar a largura em 360px |
| Duas linhas 12 com o mesmo motivo, de arquivos diferentes | Chave pelo índice; a lista nunca reordena |
| Acento no motivo | Verificado indo e voltando do `jsonb` |

## Critério de pronto

- [ ] `imports.ignoradas` guarda número, motivo e conteúdo de cada linha
- [ ] `linhas_ignoradas` deixa de existir; a contagem sai de `.length`
- [ ] O histórico mostra **o porquê**, não só quantas
