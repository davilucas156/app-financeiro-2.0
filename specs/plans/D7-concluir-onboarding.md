# Plano — D7 · Concluir onboarding (gravação)

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D7 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BACK + FRONT-INTEGRADO
**Spec:** `specs/01-fundacao-e-acesso.md`, `/bem-vindo`, botão "Começar"
**Depende de:** C3 (tabelas), C4 (categorias), D5 (usuário garantido), D6 (destino)

## O que grava

| Tabela | Linhas |
|---|---|
| `buckets` | **8** — os 6 do rateio mais Manutenção e Outros/Repasses |
| `categories` | **22** |
| `users.onboarding_concluido_em` | marca o instante |

> A spec diz "os 6 potes" porque é o nome do método. São 8 linhas: os dois de
> fora do rateio (`percentual_meta` nulo) existem desde a C3 e aparecem na
> tela desde a B3. Criar só 6 deixaria gasto sem pote onde cair.

**`classification_rules` fica de fora.** A spec pede as regras do Davi junto,
mas isso é a C5, adiada para a spec do motor de classificação — a tabela não
existe. Criá-la aqui só para semear seria construir o consumidor depois do
consumido.

## Uma transação, sem meio-termo

`db.transaction()`. Falhar no meio das categorias não pode deixar 8 potes sem
categoria nenhuma e o onboarding marcado como concluído — o usuário cairia num
dashboard quebrado sem jeito de voltar, porque a D6 não o traria mais para cá.

É o motivo de a C1 ter escolhido o driver **WebSocket** do Neon em vez do HTTP:
o HTTP não tem transação interativa.

## Idempotência: duplo toque não duplica

Três camadas, e nenhuma delas sozinha basta:

1. **Botão desabilitado enquanto envia** — resolve o duplo toque comum, mas é
   cliente, e cliente não é garantia de nada.
2. **`on conflict do nothing`** nas duas tabelas — as restrições `(user_id,
   slug)` e `(bucket_id, slug)` da C3 existem exatamente para isto.
3. **Saída antecipada** se `onboarding_concluido_em` já estiver preenchido.

O `do nothing` é sem alvo declarado, de propósito: `buckets` tem **duas**
restrições de unicidade (`nome` e `slug`), e declarar só uma faria a outra
estourar em vez de ser absorvida.

**O id do pote não vem do `returning`.** `do nothing` não devolve linha que já
existia, então a segunda execução voltaria com a lista vazia e nenhuma
categoria acharia seu pote. Depois de inserir, a transação **lê** os potes do
usuário e monta o mapa `slug → id` a partir do banco.

## Arquivos

**Criar**
- `src/features/onboarding/concluir-onboarding/concluirOnboarding.action.ts`
  — server action.
- `src/features/onboarding/concluir-onboarding/seed.ts` — monta as linhas a
  partir de `POTES_PADRAO`. Separado da action para ser testável.
- `src/features/onboarding/concluir-onboarding/AcaoComecar.tsx` — client
  component com o botão, o estado de envio e o bloco de erro.

**Modificar**
- `ConcluirOnboarding.tsx` — perde a prop `estado` (andaime da B3) e passa a
  renderizar `<AcaoComecar />`. Continua Server Component: assim a lista dos
  potes não vai para o bundle do cliente.
- `src/app/bem-vindo/page.tsx` — perde o `?estado=`.

## Thin Client / Fat Server

O cliente manda um POST sem corpo — **nenhum dado da gravação sai dele**. O
`user_id` vem de `garantirUsuario()`, e os potes vêm do módulo no servidor. Um
cliente que enviasse a lista de potes poderia enviar qualquer outra.

## Caminho feliz

1. Toca em "Começar" → o botão desabilita.
2. A action pega o usuário da sessão (D5).
3. Numa transação: 8 potes, mapa `slug → id`, 22 categorias, marca a data.
4. Redireciona para `/dashboard`.
5. Reabrir `/bem-vindo` agora cai em `/dashboard` (D6).

## Edge cases

| Situação | Tratamento |
|---|---|
| Duplo toque | 3 camadas acima; a segunda chamada não grava nada |
| Já concluiu | Sai antes de abrir transação e redireciona |
| Falha no meio | `rollback`; nada gravado; a tela mostra o erro e o botão vira "Tentar de novo" |
| Sem sessão | `garantirUsuario()` manda para `/entrar` |
| Sessão sem convite | Idem — `obterUsuarioAtual()` devolve `null` |
| Concluiu numa aba e toca "Começar" na outra | A leitura do usuário é da requisição; a saída antecipada pega. Se as duas passarem, o `do nothing` absorve |
| Pote sem percentual | `percentual_meta` nulo, com `observacao` preenchida — nunca 0 |

## Erros

`redirect()` do Next funciona **lançando** uma exceção. Um `try/catch` largando
em volta da transação engoliria o redirecionamento e mostraria "erro" num
caminho que deu certo. O redirect fica **fora** do `try`.

## Fora do escopo

- `classification_rules` → C5 / spec do motor de classificação
- Editar potes e percentuais → fase 2
- Conteúdo do dashboard → outra spec

## Critério de pronto (da Etapa 2)

- [ ] Server action cria os potes e categorias numa **única transação**
- [ ] Falha não deixa nada pela metade
- [ ] Duplo toque não duplica potes
- [ ] `user_id` sempre de `auth()` no servidor, nunca do cliente
- [ ] Sucesso redireciona para `/dashboard`
