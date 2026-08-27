# Tarefas — CSV de vários bancos

**Etapa:** 2 (Break) do workflow `dev-workflow-davi`
**Spec de origem:** `specs/11-csv-de-varios-bancos.md`
**Status:** ✅ as cinco fases entregues. Duas coisas mudaram na execução e estão anotadas abaixo, nas tarefas D1 e D4.

Legenda de camada: `INFRA` · `FRONT-VISUAL` · `FRONT-INTEGRADO` · `BACK` · `BANCO`

---

## A decisão que a spec não fechou: onde o arquivo fica enquanto se ensina

A spec disse que o mapeamento começa **com o arquivo já carregado** — _"reenviar
seria a primeira desistência"_ — e que os bytes ficam **em memória, nunca
gravados**. As duas coisas juntas descrevem um problema que a spec não resolveu:
HTTP é sem estado, e entre "não reconheci" e "salvar mapeamento" há várias
idas ao servidor.

Três saídas, e a escolhida:

| Saída                                                    | Por que não / por que sim                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Gravar o CSV num storage temporário                      | ❌ Contraria a spec 02, C3, que decidiu **não** guardar o arquivo. Extrato tem número de conta e o gasto do mês inteiro            |
| Mandar o texto decodificado para o cliente               | ❌ Aí quem separa por `;` e acha o cabeçalho é o navegador — regra de negócio no front, contra `architecture.md`                   |
| ✅ **O `File` fica no navegador; cada prévia o reenvia** | O objeto `File` vive na memória da aba, e cada mudança de dialeto reposta os bytes para uma action que devolve **a grade já lida** |

⚠ **É a única das três que respeita Thin Client / Fat Server e a spec 02 ao mesmo
tempo.** O custo é reenviar até 2 MB por ajuste — e são poucos ajustes, cada um
deliberado, num arquivo que o limite já prende em 2 MB (`upload/limites.ts`).

Isso decide a forma da tela: **o mapeamento é um componente de cliente que
segura o `File`**, e não uma rota para onde se navega.

⚠ **Na execução, `/formatos/novo` deixou de existir.** O plano previa a rota
"para quem chega sem arquivo escolher um" — e isso é um segundo seletor de
arquivo que não serve a ninguém: quem tem o arquivo já está no `/upload`, e
quem não tem não vai mapear nada. O mapeamento abre **no lugar da mensagem de
erro**, e a `/formatos` ficou só para ver e apagar.

## A ordem: o vocabulário, o banco, o servidor, a tela

1. **Fase A — o que o leitor ainda não sabe fazer.** Hoje `paraDataISO` só lê
   `dd/mm/aaaa` e `paraCentavos` só lê pt-BR. Sem isso, "CSV de vários bancos"
   lê o formato de um banco só. ⚠ **A fase A não muda a tela**: o Inter continua
   passando pelos mesmos caminhos, e os testes de hoje provam isso.
2. **Fase B — a tabela.** Uma só, e nada nas existentes.
3. **Fase C — o servidor.** Reconhecer com os formatos do usuário, e gravá-los.
4. **Fase D — as telas.**
5. **Fase E — fechar.**

## O que **não** muda, e é o que torna isto barato

Descoberta 1 da spec: `formato.id` só aparece em teste. `transactions` e
`imports` não ganham coluna, o motor de classificação não é tocado, e
`importarExtrato.service.ts:324` — o mês que vem da data na conta e do mês
escolhido no cartão — continua certo para qualquer banco, porque é sobre
`origem`, não sobre instituição.

## Reuso antes de criação

| O que                                 | Onde                         | Para quê aqui                                                 |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `paraGrade`, `decodificar`            | `ler-arquivo/grade.ts`       | A prévia usa **a mesma** leitura do import de verdade         |
| `reconhecer`                          | `ler-arquivo/reconhecer.ts`  | Ganha um parâmetro, não um irmão                              |
| `paraLancamentos`                     | `ler-arquivo/lancamentos.ts` | A prévia da consequência sai dele, não de outra conta         |
| `prepararLancamentos`                 | `ler-arquivo/preparar.ts`    | Pares que se anulam já cobrem o banco sem `padroesDePassagem` |
| `escolhaValida`                       | `aparencia/preferencia/`     | Validar `origem` e `sinalNegativo` vindos do cliente          |
| `Card`, `SectionTitle`, `EstadoVazio` | `components/ui/`             | As duas telas novas                                           |
| `CampoDeArquivo`                      | `upload/enviar-extrato/`     | O arquivo na tela de mapeamento                               |

---

## Fase A — o que o leitor ainda não sabe fazer

### ✅ A1 · A data deixa de ser só `dd/mm/aaaa` `INFRA`

`paraDataISO` ganha um formato declarado. Hoje é uma expressão regular fixa.

⚠ **`dd/mm` contra `mm/dd` é o segundo erro caro desta spec.** `01/02/2026` é
1º de fevereiro ou 2 de janeiro, e **as duas leituras são plausíveis** — não há
como o app decidir sozinho. Diferente do sinal, aqui o erro não aparece num
total: ele move lançamentos de mês, e o mês é o eixo do produto inteiro.

**Pronto quando:** os quatro formatos (`dd/mm/aaaa`, `aaaa-mm-dd`,
`dd-mm-aaaa`, `mm/dd/aaaa`) são lidos; `31/02` continua recusado em todos; e o
teste do Inter passa **sem uma linha alterada**.

### ✅ A2 · O número deixa de ser só pt-BR `INFRA`

`paraCentavos` ganha o mesmo tratamento: `1.200,00` (pt-BR) e `1,200.00` (en-US).

⚠ **Sem ponto flutuante, como hoje.** A conta continua em texto — `19.90 * 100`
é `1989.9999999999998`, e é um centavo perdido por lançamento, em silêncio.

**Pronto quando:** as duas convenções são lidas; `1.200` em pt-BR continua sendo
mil e duzentos e em en-US é um e dois décimos — **recusado**, porque centavo tem
duas casas; e os testes de hoje passam sem alteração.

### ✅ A3 · `Formato` deixa de ser uma lista fechada `INFRA`

`id` é hoje a união `"inter-extrato" | "inter-fatura"`. Passa a aceitar formato
de usuário, e `Formato` ganha `formatoData` e `formatoNumero`.

⚠ **Os dois de código ganham os campos com o valor que já usam**, e é assim que
a fase A prova que não mudou nada.

**Pronto quando:** `tsc` limpo e a suíte inteira passa sem alteração.

### ✅ A4 · O palpite que pré-preenche a tela `INFRA`

Dada uma grade, propor: separador, aspas, linha do cabeçalho, e qual coluna é
data, descrição e valor — pelo **conteúdo das células**, não pelo nome.

⚠ **É a tarefa que decide se a tela é usável.** Sete perguntas técnicas em
branco fazem qualquer pessoa fechar a aba; sete respostas prontas para conferir,
não. Se a A4 for fraca, a fase D não salva.

O método: para cada dialeto candidato, ler a grade e pontuar — o separador que
dá mais colunas consistentes vence; a linha do cabeçalho é a primeira com várias
células não vazias e não numéricas; a coluna de data é a que mais casa com um
formato de data; a de valor, a que mais casa com número; a de descrição, a mais
larga em texto.

**Pronto quando:** o palpite acerta os **dois arquivos do Inter** — separador,
aspas, cabeçalho e os três papéis — partindo das amostras de `amostras.ts`,
sem consultar `FORMATOS`.

### ✅ A5 · A prévia da consequência, e a conferência do saldo `INFRA`

Dado um mapeamento candidato e uma grade: quantos lançamentos saem, quanto
entrou, quanto saiu, e quantas linhas seriam ignoradas.

⚠ **É a resposta ao erro do sinal, e ela não é uma pergunta melhor.** "O
negativo é entrada ou saída?" é convenção contábil perguntada a quem só queria
subir um extrato. A frase _"34 lançamentos: R$ 4.812,00 de gasto e R$ 0,00 de
entrada"_ é conferível por qualquer um — com o sinal trocado ela diz "R$ 4.812
de entrada" numa fatura, e o erro fica visível antes de gravar.

E **quando dá para provar, prova**: se a pessoa apontar a coluna de saldo, roda
a conferência da spec 02 — cada valor aplicado ao saldo anterior tem de dar o
seguinte — e diz "as 20 transições batem". Quando não dá, diz que não deu.

**Pronto quando:** a prévia bate com o que o import de verdade gravaria, medida
nas duas amostras do Inter; e a conferência do saldo reprova um mapeamento que
aponta a coluna errada.

---

## Fase B — a tabela

### ✅ B1 · `user_formats` `BANCO`

Uma tabela nova. ⚠ **Zero alteração nas existentes** — Descoberta 1 da spec.

`user_id` (com o índice de sempre), `nome`, `banco`, `origem` com o mesmo
`CHECK ... in ('csv_conta','csv_cartao')` das outras duas, `dialeto`,
`colunas`, `sinal_negativo`, `formato_data`, `formato_numero`,
`padroes_de_passagem`, `criado_em`. Único em `(user_id, nome)`.

**Pronto quando:** a migration gera e roda, e nenhuma tabela existente aparece
no diff.

---

## Fase C — o servidor

### ✅ C1 · `reconhecer` passa a conhecer os formatos do usuário `BACK`

Ela recebe a lista em vez de importar `FORMATOS` direto — continua pura,
continua testável com bytes na mão, e quem busca no banco é quem chama.

⚠ **No empate, o formato do usuário ganha do de código, e o mais recente ganha
entre os dele** (pendência 5). `formatos.ts` diz hoje que "a ordem importa só no
empate, que hoje não existe"; com formato de usuário ele passa a existir.

**Pronto quando:** um arquivo que bate com um formato de código continua sendo
lido por ele; um que bate com os dois é lido pelo do usuário.

### ✅ C2 · Gravar, editar e apagar um formato `BACK`

Actions com `garantirUsuario()`, `user_id` **sempre** do servidor.

⚠ **Tudo que vem do cliente é revalidado**, mesmo tipado: uma action é um
endpoint HTTP. `origem` e `sinalNegativo` passam por `escolhaValida`; o
separador é um caractere de uma lista; papel desconhecido é descartado.

**Pronto quando:** salvar com `origem: "<script>"` grava o padrão ou recusa,
nunca a string; e apagar formato de outro usuário não acha linha.

---

## Fase D — as telas

### ✅ D1 · A tela de mapeamento, visual `FRONT-VISUAL`

Prévia da grade, dialeto, linha do cabeçalho, colunas, "este arquivo é",
sinal com a frase da consequência, nome do banco.

⚠ **Toda resposta chega pré-preenchida.** A pessoa confere, não preenche. Se
ela só tocar em "Salvar", tem de dar certo no caso comum.

**Pronto quando:** cabe em 360px; salvar fica bloqueado nomeando a coluna que
falta, nunca "preencha os campos"; nenhum `text-[Npx]` (o teste da spec 10
reprova).

### ✅ D2 · O mapeamento com arquivo de verdade `FRONT-INTEGRADO`

Ligar a prévia à A5 pela action, com o `File` segurado no cliente.

**Pronto quando:** trocar o separador redesenha a grade; trocar o sinal inverte
a frase na hora; salvar grava e **importa o arquivo em seguida** — a pessoa veio
subir um extrato, não configurar um app.

### ✅ D3 · A saída no erro do `/upload` `FRONT-INTEGRADO`

A mensagem de "não reconheci" ganha o botão de ensinar, **com o arquivo já
escolhido**.

**Pronto quando:** o beco sem saída de hoje tem porta, e quem tem formato salvo
não vê nem o erro nem o botão.

### ✅ D4 · `/formatos`, o que o app aprendeu a ler `FRONT-INTEGRADO`

Lista, edição e remoção. ⚠ **Formato salvo errado envenena todo envio futuro
daquele banco, em silêncio** — sem esta tela o único conserto seria mexer no
banco de dados.

⚠ **Apagar formato não apaga lançamento.** Receita de leitura e comida são
coisas diferentes; desfazer importação já existe na `/upload` desde a spec 02.

⚠ **Na execução, a contagem de envios caiu.** Ela pedia uma coluna `formato_id`
em `imports` — contra a promessa desta spec, que era verificável e foi
verificada: a migration 0011 é um `CREATE TABLE` e nada mais. A confirmação diz
o que é verdade sem o número: os lançamentos ficam, e arquivos daquele banco
voltam a pedir para ser ensinados.

**Pronto quando:** apagar confirma dizendo o que **não** apaga, e os lançamentos
continuam lá depois.

### ✅ D5 · Proteger as rotas novas `INFRA`

⚠ **Rota interna nova NÃO é protegida automaticamente** (`architecture.md`).
`/formatos` e `/formatos/novo` entram à mão em `src/proxy.ts`.

**Pronto quando:** as duas respondem 307 para quem não tem sessão.

---

## Fase E — fechar

### ✅ E1 · O banco inventado que se ensina sozinho `INFRA`

Uma amostra em `amostras.ts` de um banco que não existe, em outro dialeto —
separador `,`, data `aaaa-mm-dd`, número en-US — que **não** casa com nenhum
formato de código, é mapeada, salva, e no segundo envio é reconhecida sozinha.

⚠ **Nomes inventados, sem número de conta**, como manda o
`references/formatos-de-extrato.md`.

**Pronto quando:** o ciclo inteiro passa em teste, e os testes do Inter passam
sem uma linha alterada.

### ✅ E2 · Os documentos `INFRA`

`references/formatos-de-extrato.md` ganha a seção do formato de usuário;
`references/architecture.md` ganha a tabela nova;
`references/estado-do-projeto.md` tira o multibanco de "decidido, sem spec".
