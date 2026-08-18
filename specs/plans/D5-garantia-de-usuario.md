# Plano — D5 · Garantia de usuário na primeira requisição

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** D5 de `specs/01-fundacao-e-acesso.tarefas.md`
**Camada:** BACK
**Spec:** `specs/01-fundacao-e-acesso.md`, "usuário autentica mas o webhook ainda não chegou"
**Depende de:** D4 (commit `b828209`)

## O problema que esta tarefa resolve

O webhook da D4 é **assíncrono e externo**. Entre o Google devolver a sessão e
o Clerk entregar `user.created`, existe uma janela — normalmente de
milissegundos, mas que vira infinita se o webhook estiver mal configurado,
fora do ar ou se o deploy tiver acabado de trocar de URL.

Nessa janela o usuário está autenticado e **não existe no nosso banco**.
Qualquer rota interna que consulte dados por `user_id` quebra por chave
estrangeira ou devolve vazio. A D5 é a rede de segurança: nenhuma rota interna
lê o banco sem antes ter certeza de que a linha existe.

## Reuso identificado

- `getDb()` e o schema `users` (C1/C2).
- `estaConvidado()` da D3 — **o mesmo portão**, pela terceira vez (proxy,
  webhook, aqui). Sem ele, esta função viraria a porta dos fundos que cria no
  banco exatamente quem a D3 barrou.
- `auth()` e `currentUser()` do `@clerk/nextjs/server`.
- O mesmo `on conflict (id) do update` da D4.

## Arquivos a criar

- `src/features/autenticacao/garantir-usuario/garantirUsuario.service.ts`

## Duas funções, de propósito

| Função | Sem sessão / sem convite | Quem usa |
|---|---|---|
| `obterUsuarioAtual()` | devolve `null` | D6, que precisa **decidir** o destino a partir disso |
| `garantirUsuario()` | `redirect("/entrar")` | rotas internas, que não têm decisão a tomar |

Uma só função não serve às duas: a D6 precisa da ausência como resposta, e uma
rota interna precisa da ausência como desvio. Fundir as duas obrigaria toda
rota interna a repetir o mesmo `if (!usuario) redirect(...)` — e é justamente
o tipo de repetição que uma hora alguém esquece.

## Caminho quente: uma consulta, não uma chamada de API

O caso comum é a linha **já existir**. Então:

1. `auth()` — lê o `userId` do cookie de sessão, sem rede.
2. `SELECT` por chave primária em `users`.
3. Achou → devolve. **Fim.** Nenhuma chamada ao Clerk.

Só quando a linha falta é que se paga uma ida ao Clerk (`currentUser()`) para
descobrir e-mail e nome. Isso acontece uma vez na vida da conta, ou enquanto o
webhook estiver quebrado.

**Consequência assumida:** se o usuário trocar o nome no Google e o webhook
estiver fora do ar, o nome aqui fica velho. Sincronizar em toda requisição
custaria uma chamada de API por página carregada para corrigir algo que o
webhook corrige sozinho — troca ruim.

## `cache()` do React

A função é embrulhada em `cache()`: num mesmo render, layout e página chamam
`garantirUsuario()` cada um por conta própria, e sem isso seriam duas consultas
idênticas ao banco. O `cache()` é por requisição, então não há risco de um
usuário ver o outro.

## Linha marcada como removida

Se a linha existe com `removido_em` preenchido **e** a sessão é válida, isso é
uma contradição: o `removido_em` só é escrito por `user.deleted`, e conta
apagada no Clerk não tem sessão viva. A linha está velha — a sessão prova que
a conta existe. Então a marca é **limpa**, e o log registra.

## Caminho feliz

1. Usuário entra com Google pela primeira vez, webhook atrasado.
2. Abre `/dashboard`; o proxy já confirmou sessão e convite.
3. `garantirUsuario()` não acha a linha → consulta o Clerk → confirma a
   allowlist → insere → devolve.
4. Quando o webhook finalmente chegar, o `on conflict do update` só atualiza.

## Edge cases

| Situação | Tratamento |
|---|---|
| Sem sessão | `obterUsuarioAtual()` → `null`; `garantirUsuario()` → `/entrar` |
| Sessão válida, e-mail fora da allowlist | **Nada é criado.** `null` / redireciona. Terceiro portão da D3 |
| Duas requisições simultâneas na primeira visita | `on conflict do update` — as duas convergem para a mesma linha |
| Webhook chega **depois** da criação por aqui | `on conflict do update`, sem duplicar |
| Conta do Clerk sem e-mail primário | Tratada como não convidada |
| `currentUser()` falha (rede/Clerk fora) | Erro sobe. Não inventamos linha sem confirmar o e-mail — criar sem checar a allowlist seria abrir a porta num momento de falha |
| Linha com `removido_em` e sessão viva | Limpa a marca (ver acima) |
| E-mail já em `users` com outro `id` | Viola o `unique` do e-mail e o erro sobe. É um estado que não deveria existir; mascarar esconderia o bug |

## Thin Client / Fat Server

`import "server-only"`. O `userId` **sempre** vem de `auth()`, nunca de
parâmetro — uma função que aceitasse `userId` de fora viraria, no primeiro
descuido, um jeito de ler a conta alheia.

## Fora do escopo

- Decidir para onde mandar o usuário conforme `onboarding_concluido_em` → **D6**
- Criar potes e categorias → **D7**

## Critério de pronto (da Etapa 2)

- [ ] Existe função server-side que devolve o usuário do banco e o cria se faltar
- [ ] Usada por toda rota interna
- [ ] O app funciona com o webhook fora do ar
