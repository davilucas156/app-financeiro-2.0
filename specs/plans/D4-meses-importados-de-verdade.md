# Plano — D4 · Meses importados, de verdade

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D4 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** FRONT-INTEGRADO
**Spec:** `specs/02-upload-de-extrato.md`, `/upload`
**Depende de:** C2 (tabela `imports`) e D2 (quem grava lá)

## O que muda

A lista "Já importados" hoje é uma constante `ENVIOS` dentro de
`src/app/(app)/upload/page.tsx`, com dois envios inventados. Depois da D3 isso
ficou pior do que inofensivo: você importa de verdade e a tela continua
mostrando os mesmos dois nomes falsos. Uma tela que mente logo depois de você
agir ensina a não confiar nela.

A D4 troca a constante por uma consulta. Só isso — **o visual aprovado na B3
não muda**.

## Onde o corte fica

| Arquivo | Papel | `server-only` |
|---|---|---|
| `exibirEnvio.ts` | Puro: linha do banco → o que aparece na tela | não |
| `listarImportacoes.service.ts` | A consulta, filtrada por `user_id` | **sim** |
| `MesesImportados.tsx` | Desenha (inalterado, fora o import do tipo) | não |

A formatação sai do serviço porque é a parte que dá para provar: o Vitest só
roda `src/**/*.test.ts`, e um módulo com `import "server-only"` não carrega
fora do Next — de propósito. Deixar o `Intl` junto da consulta seria escolher
não testar a única parte testável.

## `user_id` vem da sessão

`garantirUsuario()`, como em todo o resto. A página nem recebe um id de fora —
não existe parâmetro para passar. Um `listarImportacoes(userId)` que aceitasse
qualquer id seria uma forma de ler o histórico de outra pessoa, e a proteção
seria "ninguém chama errado" (`references/architecture.md`, Thin Client / Fat
Server).

## Fuso horário: São Paulo, explícito

O carimbo é `timestamptz` — o instante está certo no banco. Mas a **Vercel roda
em UTC**, e `new Intl.DateTimeFormat("pt-BR")` sem `timeZone` usa o fuso do
processo. Um envio às 21h de 18/08 apareceria como "19/08 às 00h" — data errada
para quem enviou.

Então o fuso é fixado em `America/Sao_Paulo`, no único lugar que formata.

> Nota: `src/app/(app)/layout.tsx` tem o mesmo problema latente no mês do
> cabeçalho. Não mexo nele aqui — vira uma linha na spec do dashboard, onde o
> mês deixa de ser "agora" e passa a ser escolhido.

## Ordem da lista

`mes_referencia` desc, depois `criado_em` desc, depois `origem` desc.

Os dois arquivos de um envio nascem na **mesma transação**, e `now()` no
Postgres é o instante de início da transação — os dois carimbos saem
idênticos. Sem o terceiro critério a ordem entre conta e cartão seria a que o
planner quisesse, e a lista trocaria de ordem sozinha entre dois carregamentos.
`origem` desc põe `csv_conta` antes de `csv_cartao`, que é a ordem dos campos
no formulário.

`limit 60`: 18 meses × 2 arquivos = 36. O teto existe para a consulta não
crescer sem fim, não porque 60 seja um número especial.

## Atualizar depois de importar

Já resolvido: a action da D2 chama `revalidatePath("/upload")` quando o
resultado é `ok`. Como a lista é server component, ela volta com os dados
novos na mesma resposta da server action. Nada de estado no cliente.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nunca importou nada | O estado vazio da B3, que já existe |
| Importou só a conta | Uma linha só. Nada indica que falta o cartão — não falta |
| Arquivo sem nenhuma linha válida | Aparece com "0 lançamentos". O envio aconteceu; escondê-lo faria o desfazer não ter alvo |
| Dois envios do mesmo mês | Duas linhas. Agrupar por mês esconderia qual arquivo desfazer |
| Banco fora do ar | A página inteira falha, como qualquer outra. Não invento lista vazia — dizer "nada importado" quando o banco caiu é mentira pior |

## Fora do escopo

- Fazer o botão Desfazer funcionar → **D5**
- Mostrar quantas linhas foram ignoradas em cada envio → não estava na B3
- Link para o arquivo original → **D1** (`url_no_blob` ainda é nulo)

## Critério de pronto (da Etapa 2)

- [ ] A lista da B3 lê do banco
- [ ] Filtrada por `user_id` da sessão
- [ ] A constante `ENVIOS` deixa de existir
