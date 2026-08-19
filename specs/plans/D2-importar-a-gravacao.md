# Plano — D2 · Importar: a gravação

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D2 de `specs/02-upload-de-extrato.tarefas.md`
**Camada:** BACK
**Spec:** `specs/02-upload-de-extrato.md`, `/upload` e "Não duplicar"
**Depende de:** fase A (`652dbb3`) e fase C (`5a7bdaa`)

## Fora de ordem, de propósito

A lista põe a D1 (Blob) antes. Faço a D2 primeiro porque a D1 depende de você
criar um Blob store no painel, e a D2 não depende de ninguém. A coluna
`url_no_blob` já nasceu **nula** para permitir exatamente esta ordem — quando a
D1 chegar, ela só preenche.

## O caminho inteiro

1. `garantirUsuario()` — `user_id` da sessão, nunca do cliente
2. Para cada arquivo: `reconhecer(bytes)` (A2)
3. Hash SHA-256 do **conteúdo** → esse arquivo já foi enviado?
4. `paraLancamentos` (A3) em cada um
5. `prepararLancamentos` (A4) nos dois **juntos**
6. Uma transação: grava `imports`, grava `transactions`, atualiza as contagens
7. Devolve o resumo que a B2 já sabe desenhar

O passo 5 recebe os dois arquivos numa chamada só porque o pagamento de fatura
e o par que se anula só aparecem olhando os dois — medido: os R$ 318,19 estão
num e noutro.

## Qual mês cada lançamento recebe

Resolve a pendência 3, com os números que a fase A mediu.

| Origem | `mes_referencia` | Por quê |
|---|---|---|
| `csv_conta` | o mês da **data do lançamento** | O extrato de 02/06 a 02/07 traz lançamentos de julho; empurrá-los para junho seria mentir sobre quando o dinheiro se moveu |
| `csv_cartao` | o mês **escolhido na tela** | A fatura de julho traz uma parcela de **março**. Pelo mês da compra, ela cairia num mês que você já fechou |

Nos dois casos a coluna `data` guarda a data real, então a outra leitura
continua possível depois sem migration.

## Idempotência: três portas, e nenhuma é `if`

| Porta | Onde |
|---|---|
| Arquivo já enviado | `unique (user_id, hash)` — consultado antes, e garantido pelo banco |
| Lançamento repetido | `unique (user_id, impressao)` + `on conflict do nothing` |
| Duplo toque | Botão desabilitado (B1) e as duas de cima |

**`entraram` conta o que o `returning` devolveu**, não o que foi tentado. Com
`on conflict do nothing`, a linha que colide não volta — então o número que
aparece na tela é o que de fato entrou, e não uma promessa.

## Arquivo no campo errado

A A2 reconhece pelo cabeçalho. Se o conteúdo não bate com o campo em que foi
posto, **nada é gravado** e a mensagem diz o que aconteceu: "o arquivo enviado
no campo do cartão é o extrato de conta". Importar errado e deixar o usuário
descobrir depois seria pior do que recusar.

Dois arquivos que resolvem para a mesma origem também recusam.

## Tudo ou nada

Uma transação só. Falhar no meio do segundo arquivo não pode deixar o primeiro
gravado e o resumo mentindo — o usuário reenviaria e o `on conflict` esconderia
metade.

## Limites no servidor

O cliente já recusa arquivo grande ou de tipo errado (D3), mas o servidor
recusa de novo: validação de cliente é conveniência, não defesa. **2 MB** é
folgado — o extrato real do Davi tem 1,7 KB e a fatura 3,1 KB.

## Thin Client / Fat Server

O cliente manda **bytes**, nunca lançamentos. Um cliente que pudesse enviar a
lista de lançamentos poderia inventar qualquer valor. Todo parsing é do
servidor, e o `user_id` vem de `auth()`.

## Arquivos

- `src/features/upload/importar-extrato/importarExtrato.service.ts`
- `src/features/upload/importar-extrato/importarExtrato.action.ts`

Separados pelo mesmo motivo da D4 da spec 01: a action precisa do ciclo de
requisição do Next para existir, o serviço só precisa de bytes e de um `userId`.

## Edge cases

| Situação | Tratamento |
|---|---|
| Nenhum arquivo | Erro, sem tocar no banco |
| Só a conta | Funciona; acha menos pares |
| Os dois já importados | Avisa e não grava nada |
| Um novo, um já importado | Grava o novo, avisa do outro |
| Arquivo não reconhecido | Recusa **os dois**, sem gravar — a transação é conjunta |
| Arquivo sem nenhuma linha válida | Grava o `import` com contagem zero. É informação: o envio aconteceu |
| Reimportar depois de desfazer | Funciona: o `import` sumiu, o hash está livre |
| Mesmo lançamento nos dois arquivos | O único deixa entrar uma vez |
| Banco fora do ar | Nada gravado; erro na tela |

## Fora do escopo

- Guardar o arquivo no Blob → **D1**
- Ligar a tela → **D3**
- Desfazer → **D5**

## Critério de pronto (da Etapa 2)

- [ ] Server action recebe o arquivo, roda a fase A e grava
- [ ] **Uma única transação**; falha não deixa nada pela metade
- [ ] Reenviar o mesmo arquivo não duplica
- [ ] `user_id` sempre de `auth()`
