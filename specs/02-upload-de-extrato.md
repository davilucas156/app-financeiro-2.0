# Spec — Upload de extrato (CSV → lançamentos no banco)

**Etapa:** 1 (Spec) do workflow `dev-workflow-davi`
**Status:** ⏳ aguardando aprovação do Davi
**Origem:** `readme.md` seções 2, 5, 6 (passos 2, 3 e 5), 12 e pergunta 4 da seção 14
**Arquitetura:** `references/architecture.md`

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
| Formato do CSV | **Depende de amostra real** — ver Pendências | Muda o parser inteiro |
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
| Manda um CSV que não bate com o formato esperado | Recusa o arquivo **inteiro**, sem gravar nada, dizendo qual coluna faltou |
| Manda um CSV em que **algumas linhas** estão quebradas | Importa as boas, ignora as ruins e diz quantas e por quê |
| Manda o **mesmo arquivo** de novo | Reconhece e não duplica; avisa que já tinha sido importado |
| Manda um arquivo **diferente** para um mês já importado | Importa só o que é novo; lançamento repetido não entra duas vezes |
| Manda um CSV com lançamentos de outro mês | Ver Pendência 3 |
| Existe um par que se anula (mesmo valor, sentidos opostos, datas próximas) | Marca os dois como candidatos a revisão. **Não apaga nada** |
| A importação falha no meio | Nada fica pela metade; o mês volta ao estado anterior |
| Quer desfazer | Apaga os lançamentos daquele envio, com confirmação |
| Não tem lançamento nenhum ainda | Estado vazio explicando o que enviar |

### Dados envolvidos

- **Lê:** `user_id` da sessão; lançamentos já existentes do mês (para não duplicar)
- **Escreve:** `transactions`, `imports` (o registro de cada envio), arquivo no Blob

---

## Comportamentos sem tela (back-end)

### Ler o CSV

| Situação | Resposta do sistema |
|---|---|
| CSV com cabeçalho conhecido | Lê e devolve os lançamentos |
| Cabeçalho desconhecido | Recusa o arquivo inteiro, nomeando a coluna que faltou |
| Data em formato inesperado | Linha ignorada e contada no resumo |
| Valor com vírgula decimal e separador de milhar | Lido corretamente, convertido em centavos |
| Valor negativo, ou colunas separadas de débito e crédito | Vira `direcao` (`entrada` / `saida`) |
| Linha em branco ou de totalização | Ignorada silenciosamente |
| Descrição vazia | Linha ignorada e contada no resumo |
| Arquivo com BOM, ou acentuação em Latin-1 | Lido corretamente — extrato de banco brasileiro erra isso o tempo todo |

### Não duplicar

| Situação | Resposta do sistema |
|---|---|
| Mesmo arquivo enviado de novo | Detectado pelo **conteúdo** (hash), não pelo nome. Nome de arquivo repete demais |
| Mesmo lançamento vindo de dois arquivos diferentes | Detectado por data + valor + descrição + origem, dentro do mesmo usuário |
| Lançamento legítimo idêntico a outro no mesmo dia | ⚠ Ver Pendência 2 — dois cafés de R$12 no mesmo dia são reais |

### Isolamento por usuário

| Situação | Resposta do sistema |
|---|---|
| Qualquer leitura ou escrita | Filtra por `user_id` de `auth()` no servidor. **Nunca** por `user_id` vindo do cliente |
| Parsing do CSV | No **servidor**. O cliente manda o arquivo, não os lançamentos |

---

## Dados — tabelas tocadas

Detalhamento de tipos fica na Etapa 3 (Plan).

- **`transactions`** (nova) — `user_id`, `data`, `descricao_original`, `valor`
  em centavos, `direcao`, `categoria_id` (**nulo** até a próxima spec),
  `status`, `mes_referencia`, `origem`, `import_id`, `impressao` (a chave que
  detecta repetido)
- **`imports`** (nova, **não está no `readme.md`**) — um registro por arquivo
  enviado: `user_id`, `mes_referencia`, `origem`, `nome_arquivo`, `hash`,
  `url_no_blob`, contagens, `criado_em`.
  **Por que existe:** sem ela não há como responder "esse arquivo já foi
  enviado?" nem como desfazer uma importação sem adivinhar quais linhas vieram
  dela.

## Pendências — precisam de resposta antes da Etapa 2

1. ⛔ **Um extrato real.** Não existe nenhum CSV no repositório, e a pergunta 4
   do `readme.md` §14 continua sem resposta. Escrever o parser sem ver o
   arquivo é inventar nomes de coluna — e o parser é o coração desta
   funcionalidade. Preciso de **dois arquivos**: um da conta e um do cartão.
   Pode ser um mês antigo, e dá para trocar as descrições por texto qualquer
   desde que **o formato fique intacto**: mesmas colunas, mesmo separador,
   mesmo formato de data e de valor.

2. ❓ **Lançamento repetido de verdade.** Se dois lançamentos têm a mesma data,
   o mesmo valor e a mesma descrição, o segundo é duplicata do arquivo ou é
   uma segunda compra real? Recomendo **importar os dois e marcar para
   revisão** — perder um lançamento real é pior do que revisar um a mais.

3. ❓ **Um mês por vez?** Se o CSV trouxer lançamentos de mais de um mês,
   importo tudo distribuindo pelos meses, ou fico só no mês escolhido?
   Recomendo **distribuir**, avisando no resumo, porque fatura de cartão cruza
   mês por natureza.
