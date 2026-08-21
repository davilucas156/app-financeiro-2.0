# Plano — D5 · A correção vira regra

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D5 de `specs/03-motor-de-classificacao.tarefas.md`
**Camada:** BACK + FRONT-INTEGRADO

## A pergunta vem **antes** de gravar, e não depois

A spec dizia "grava, avança, e pergunta se vira regra". Implementando, isso dá
errado: no instante em que a categoria é gravada o `revalidatePath` tira o
lançamento da fila, e a pergunta passaria a ser sobre algo que já saiu da tela.

Inverti: tocar numa categoria abre um passo de confirmação que mostra o destino,
**o texto exato que a regra vai procurar** e quantos outros ela pega junto. Aí
os dois botões — "Sempre" e "Só desta vez" — gravam.

Três ganhos, e nenhum deles é estético:

1. **Uma escrita só, atômica.** A tarefa pede "na mesma transação"; com a
   pergunta depois seriam duas, e a segunda podia falhar deixando a categoria
   gravada e a regra não.
2. **Você vê o trecho antes de se comprometer**, que é a razão de a B3 existir.
3. Não existe estado intermediário "categoria salva, pergunta pendente" para
   dessincronizar entre dois aparelhos.

## O que a regra herda do lançamento

| Campo | De onde |
|---|---|
| `criterio` | `pessoa` quando é transferência (A3); `descricao_contem` com o trecho estável (A2) no resto |
| `chave` | `tipo:texto` — a mesma forma que a A5 usa, para o seed e a correção não se duplicarem |
| `prioridade` | **10** — a faixa que a A5 reservou. Correção de quem olhou o lançamento ganha do que foi semeado de longe |
| `origem` | `correcao` |

## Responder "sempre" de novo para o mesmo trecho **atualiza** a regra

O único `(user_id, chave)` da C1 impede duplicata. Em cima dele, uma escolha:
recusar ou atualizar.

Atualizar. Se você acabou de dizer "sempre classifique assim como X" e existia
uma regra dizendo Y, você mudou de ideia — a instrução mais nova vence. Recusar
te obrigaria a ir apagar a regra antiga antes, para dizer de novo o que já
disse.

## Aplicar aos irmãos: em JS, não em SQL

O casamento de regra normaliza acento e caixa e compara substring. Reproduzir
isso num `where` seria uma segunda implementação do motor — e regra criada com
uma e casada com a outra deixa de bater sem ninguém entender por quê, que é
exatamente o erro que a A1 evita reusando `normalizarDescricao`.

Então: leio os pendentes do mês, caso com `casarRegra`, atualizo por id. Dentro
da mesma transação.

## O irmão de valor alto ainda pede confirmação

Mesma régua da D1, e aqui ela vale mais: você acabou de ver "isto pega mais 4"
e confirmou — mas **o aviso de "pega mais 4" é justamente o alerta de que a
regra pode estar larga demais**. Um irmão de R$ 500 apanhado por engano é o erro
mais caro que existe aqui.

Então ele nasce classificado e volta para a fila pedindo "está certo?".

## "Só desta vez" não cria nada

Nem regra, nem rascunho, nem lembrete. É a resposta que a A4 conta como
histórico: da próxima vez a sugestão "você já classificou assim" aparece, sem
nunca ter virado automatismo.

## Edge cases

| Situação | Tratamento |
|---|---|
| Descrição sem trecho estável | A pergunta não aparece; grava e segue |
| Regra já existe com outra categoria | Atualiza — a instrução mais nova vence |
| Nenhum irmão casa | Grava só este; o "pega mais 0" já tinha avisado |
| Irmão de valor alto | Classificado, e de volta à fila para confirmação |
| Categoria de outra conta | Recusada antes de tudo, como na D4 |
| Falha no meio | Transação inteira volta atrás: sem regra órfã nem categoria solta |

## Fora do escopo

- "Voltar" desfazer → D6
- Ver e apagar regras → D9

## Critério de pronto (da Etapa 2)

- [ ] "Sempre" cria a regra a partir do trecho da A2
- [ ] E aplica aos outros pendentes do mesmo mês, na mesma transação
- [ ] "Só desta vez" não cria nada
