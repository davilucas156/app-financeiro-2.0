# Spec — Upload de extrato (CSV → lançamentos no banco)

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Status:** ✅ aprovada pelo Davi
**Origem:** `readme.md` seções 2, 5, 6 (passos 2, 3 e 5), 12 e pergunta 4 da seção 14
**Arquitetura:** `references/architecture.md` · `references/formatos-de-extrato.md`

## Escopo desta funcionalidade

Tirar o usuário de "tenho o CSV do banco no celular" e levar até "os
lançamentos do mês estão no banco, ainda sem pote, prontos para classificar".

**Está dentro:**
- Escolher o mês de referência
- Enviar o CSV da conta e o da fatura do cartão
- Guardar o arquivo original
- Ler o CSV e transformar em lançamentos
- Detectar reenvio do mesmo arquivo e lançamento repetido
- Detectar o par "zero a zero" (mesmo valor, sentidos opostos, datas próximas)
- Mostrar o resultado da importação
- Ver e desfazer o que foi importado num mês

**Está fora (vira spec própria):**
- **Classificar** — pôr cada lançamento num pote. Aqui todo lançamento nasce
  sem categoria. É a próxima spec, junto com a C5 (`classification_rules`).
- Tela de revisão um a um (`/revisao`), fechar o mês, `monthly_snapshots`
- Dashboard com dados reais
- PDF de fatura — o próprio `readme.md` põe na fase 2
- Multi-conta bancária — fase 2

## Decisões que esta spec precisa tomar

| Questão | Proposta | Consequência se mudar |
|---|---|---|
| Formato do CSV | **Medido** em arquivo real — `references/formatos-de-extrato.md` | — |
| XLSX / XLS | **Não agora**, mas o parser nasce em duas camadas para caber depois sem reescrita | Ver "Sobre planilhas" |
| Onde fica o arquivo original | Vercel Blob (privado) | Já previsto no `.env.example` |
| Tabela `accounts` | **Não criar agora.** `transactions.origem` (`csv_conta` / `csv_cartao`) resolve o MVP | Multi-conta é fase 2; criar a tabela agora seria adivinhar colunas |
| Parsing síncrono ou em fila | **Síncrono**, como o `readme.md` §12 pede para até ~200 transações | Acima disso, vira fila numa spec futura |
| Valor | Centavos inteiros, como o resto do produto | — |

---

## Página: Enviar extrato (`/upload`)

**Propósito:** subir o mês inteiro em poucos toques, no celular, e entender o
que entrou.

### Componentes

| Componente | Estado inicial | Variações |
|---|---|---|
| Seletor de mês de referência | Mês atual | Meses futuros bloqueados |
| Campo do CSV da **conta** | Vazio | Selecionado (nome + tamanho) · Enviando · Erro |
| Campo do CSV do **cartão** | Vazio | Idem. **Opcional** — dá para subir só a conta |
| Botão "Importar" | Desabilitado até ter ao menos um arquivo | Enviando (spinner, sem duplo toque) · Erro |
| Resumo da importação | Some até existir | Quantos entraram, quantos foram ignorados e por quê |
| Lista dos meses já importados | Vazia no primeiro acesso | Cada linha com mês, contagem e data do envio |

### Comportamentos do usuário

| Ação do usuário | Resposta do sistema |
|---|---|
| Abre `/upload` | Mês atual pré-selecionado; lista dos meses já importados |
| Escolhe um arquivo que não é CSV | Recusa **antes de enviar**, dizendo o formato aceito |
| Escolhe um CSV grande demais | Recusa antes de enviar, dizendo o limite |
| Toca em "Importar" | Envia, lê, grava e mostra o resumo. Sem sair da tela |
| Toca em "Importar" duas vezes | Não importa duas vezes |
| Manda um CSV que não bate com nenhum formato conhecido | Recusa o arquivo **inteiro**, sem gravar nada, dizendo qual coluna faltou |
| Manda um CSV em que **algumas linhas** estão quebradas | Importa as boas, ignora as ruins e diz quantas e por quê |
| Manda o **mesmo arquivo** de novo | Reconhece e não duplica; avisa que já tinha sido importado |
| Manda um arquivo **diferente** para um mês já importado | Importa só o que é novo; lançamento repetido não entra duas vezes |
| Manda o extrato da conta no campo do cartão (ou o contrário) | Detecta pelo cabeçalho e avisa, em vez de importar errado |
| A fatura traz lançamento de outro mês | Ver Pendência 3 |
| Existe um par que se anula (mesmo valor, sentidos opostos, datas próximas) | Marca os dois como candidatos a revisão. **Não apaga nada** |
| A importação falha no meio | Nada fica pela metade; o mês volta ao estado anterior |
| Quer desfazer | Apaga os lançamentos daquele envio, com confirmação |
| Não tem lançamento nenhum ainda | Estado vazio explicando o que enviar |

### Dados envolvidos

- **Lê:** `user_id` da sessão; lançamentos já existentes do mês (para não duplicar)
- **Escreve:** `transactions`, `imports` (o registro de cada envio), arquivo no Blob

---

## Comportamentos sem tela (back-end)

### Ler o arquivo

| Situação | Resposta do sistema |
|---|---|
| Cabeçalho reconhecido | Escolhe o parser daquele formato e lê |
| Cabeçalho desconhecido | Recusa o arquivo inteiro, nomeando a coluna que faltou |
| Linhas de metadados antes do cabeçalho | Puladas — o extrato da conta tem cinco |
| BOM no início do arquivo | Removido antes de ler o cabeçalho |
| Data em formato inesperado | Linha ignorada e contada no resumo |
| Valor `1.200,00` | Milhar `.`, decimal `,` → centavos |
| Valor `R$ 15,00` e `-R$ 318,19` | Prefixo removido; o sinal vem **antes** do símbolo |
| Sinal do valor | Vira `direcao` (`entrada` / `saida`) |
| Linha em branco, ou de totalização | Ignorada silenciosamente |
| Descrição vazia | Linha ignorada e contada no resumo |
| Aspas **dentro** de campo não citado (extrato) | Lido como texto comum, sem tratamento de aspas |
| Vírgula **dentro** de campo citado (fatura) | Tratamento de aspas obrigatório, senão toda linha quebra |

### Não duplicar

| Situação | Resposta do sistema |
|---|---|
| Mesmo arquivo enviado de novo | Detectado pelo **conteúdo** (hash), não pelo nome. Nome de arquivo repete demais |
| Mesmo lançamento vindo de dois arquivos diferentes | Detectado por data + valor + descrição + origem, dentro do mesmo usuário |
| Lançamento legítimo idêntico a outro no mesmo dia | ⚠ Ver Pendência 2 |

### Isolamento por usuário

| Situação | Resposta do sistema |
|---|---|
| Qualquer leitura ou escrita | Filtra por `user_id` de `auth()` no servidor. **Nunca** por `user_id` vindo do cliente |
| Parsing do arquivo | No **servidor**. O cliente manda o arquivo, não os lançamentos |

---

## Dados — tabelas tocadas

Detalhamento de tipos fica na Etapa 3 (Plan).

- **`transactions`** (nova) — `user_id`, `data`, `descricao_original`, `valor`
  em centavos, `direcao`, `categoria_id` (**nulo** até a próxima spec),
  `status`, `mes_referencia`, `origem`, `import_id`, `impressao` (a chave que
  detecta repetido), e do cartão: `parcela` e `categoria_do_banco`
- **`imports`** (nova, **não está no `readme.md`**) — um registro por arquivo
  enviado: `user_id`, `mes_referencia`, `origem`, `nome_arquivo`, `hash`,
  `url_no_blob`, contagens, `criado_em`.
  **Por que existe:** sem ela não há como responder "esse arquivo já foi
  enviado?" nem como desfazer uma importação sem adivinhar quais linhas vieram
  dela.

---

## Sobre planilhas (XLSX)

A variação entre bancos **não está no formato do arquivo**, está nas colunas e
nas convenções. Os dois arquivos do Inter provam: mesmo banco, mesmo mês, e
mesmo assim um usa ponto e vírgula sem aspas e o outro vírgula com aspas, BOM
e símbolo de moeda grudado no valor. Um XLSX do Inter teria exatamente as
mesmas divergências de coluna, data e valor — só dentro de outra embalagem.

Ainda assim, XLSX **vai** fazer falta: há banco que exporta só planilha, e
Excel é onde se conserta uma linha à mão. Então o parser nasce em duas camadas:

| Camada | Responsabilidade | Muda com XLSX? |
|---|---|---|
| 1 — leitura | arquivo → grade de células (linhas × colunas) | **sim**, uma implementação nova |
| 2 — interpretação | grade → lançamentos: achar o cabeçalho, mapear colunas, converter data e valor, decidir o sentido | **não** |

Toda a parte difícil e específica de banco vive na camada 2 e é compartilhada.
Acrescentar XLSX depois é escrever só a camada 1 — não é reescrita.

**Por que não agora:** o Inter dá CSV para os dois arquivos, então hoje seria
construir para um banco que não temos. Além disso, XLSX é um zip binário —
carrega uma biblioteca de ~1 MB e uma superfície de ataque que CSV não tem.

⚠ **Cuidado com o caminho "salvar como CSV no Excel".** O Excel em português
grava com ponto e vírgula, não vírgula. Quem exportar uma planilha por ali cai
num terceiro formato — mais um motivo para o reconhecimento ser por cabeçalho,
e não por extensão de arquivo.

---

## Pendências

1. ✅ ~~Um extrato real.~~ Recebido e medido em
   `references/formatos-de-extrato.md`. Responde a pergunta 4 do `readme.md`
   §14: **o formato varia**, e varia até dentro do mesmo banco. São dois
   parsers, não um.

2. ❓ **Lançamento repetido de verdade.** Mesma data, mesmo valor, mesma
   descrição: é duplicata do arquivo ou uma segunda compra real? Recomendo
   **importar os dois e marcar para revisão** — perder um lançamento real é
   pior do que revisar um a mais.

   > O arquivo medido mostra por que isso importa: três estacionamentos de
   > R$ 15,00 em 06, 13 e 14 de junho. Datas diferentes, então não colidem —
   > mas valor redondo repetido é a norma, não a exceção.

3. ❓ **Qual mês é o mês da parcela.** A fatura de julho medida traz uma
   parcela 4/12 de uma compra de **março**. O dinheiro sai em julho, a compra
   é de março.

   Recomendo: **o `mes_referencia` do cartão é o mês da fatura**, e o do
   extrato é a data do lançamento. A coluna `data` guarda sempre a data real,
   então a outra visão continua possível depois. Sem isso, uma parcela de
   março apareceria num mês que você já fechou.

4. ❓ **Pagamento de fatura.** Aparece nos dois arquivos e, importado dos dois,
   tira o mesmo dinheiro duas vezes. Recomendo **importar e marcar como
   excluído do cálculo**, com o motivo registrado, em vez de não importar —
   você continua vendo que aconteceu, e o total não conta duas vezes.

5. ❓ **A coluna `Categoria` do cartão.** O Inter já classifica cada compra.
   Guardo a coluna para a próxima spec usar como palpite? Recomendo
   **guardar**: não custa nada agora e pode poupar chamadas de LLM depois. Mas
   nunca como verdade — no arquivo medido, o Mercado Livre veio como
   `TRANSPORTE` e uma oficina mecânica como `OUTROS`.
