# Plano — C4 · Categorias padrão de cada pote

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefa:** C4 de `specs/01-fundacao-e-acesso.tarefas.md` (reescrita na B3)
**Camada:** BACK + BANCO
**Depende de:** C3 (concluída, commit `518ff09`)

## Fonte dos dados

Não inventei categoria nenhuma. Cada uma sai de dois lugares que já existem:

1. **As tags do `planejamento_anual_davi.html`** — extraí todas as ocorrências
   de `<span class="tag t-*">` dos meses já fechados. São as categorias que
   você usou de verdade entre Dez/2025 e Jun/2026.
2. **A seção 7 do `readme.md`** — as regras herdadas, que nomeiam os
   estabelecimentos de cada categoria (Premmia, Transfacil, Uber, Vivo,
   Ferauto, Udemy…).

## Reuso identificado

- `src/features/onboarding/potes-padrao.ts` (B3) — as categorias entram
  **dentro** de cada pote, no mesmo módulo. Um lugar só continua sendo a
  regra.
- `tag_visual` reaproveita as classes do painel (`t-gas`, `t-fix`…), então a
  identidade visual das tags atravessa para o app sem retrabalho.

## Uma mudança de schema que este plano precisa

A C3 criou `categories` **sem coluna de emoji**. Ao extrair os dados do painel
ficou claro que isso é um erro: lá as categorias aparecem como "⛽ Gasolina",
"🚌 Ônibus", "📱 Telefonia" — o emoji é parte do rótulo, não enfeite do pote.

Sem a coluna, o app teria que embutir o emoji dentro do `nome` (sujando o dado
que o usuário edita) ou perder a identidade visual do painel.

Então a C4 acrescenta `emoji` a `categories`. **Este é o momento mais barato
possível para fazer isso**: as tabelas estão vazias, então a migration é uma
adição de coluna sem dado para converter. Descoberto uma semana depois, seria
migration com backfill.

## Arquivos a modificar

- `src/db/schema.ts` — `categories.emoji`.
- `src/features/onboarding/potes-padrao.ts` — tipo `CategoriaPadrao` e as
  categorias de cada um dos 8 potes.
- `references/architecture.md` — registrar a origem dos dados.

## Arquivos gerados

- `src/db/migrations/0002_*.sql` + snapshot.

## As categorias

| Pote | Categorias |
|---|---|
| Custos Fixos | Telefonia · Academia · Assinaturas · Barbearia |
| Liberdade Financeira | Aportes · Reserva |
| Conforto & Lazer | Assinaturas · Compras online · Alimentação fora · Saídas e eventos |
| Metas / Sonhos | Giulia |
| Transporte | Gasolina · Ônibus · Apps · Estacionamento |
| Conhecimento | Cursos · Conteúdo e ferramentas |
| Manutenção | Manutenção veicular · Peças |
| Outros / Repasses | Repasses e empréstimos · Avulsos · Multas |

**Renda Extra não vira categoria.** O `readme.md` cita "Cadillac → Renda
Extra", mas renda não é pote de gasto — no painel ela vive no banner de fontes
de renda, que é outra coisa. Fica para a spec do dashboard.

## Caminho feliz

1. Coluna `emoji` no schema; `db:generate`, **leio o SQL**, `db:migrate`.
2. Categorias declaradas no módulo, com `slug` estável.
3. Verifico no banco que a coluna existe.
4. Verifico no código que todo `slug` é único dentro do seu pote e que a
   contagem bate — é o dado que a D7 vai gravar, e um `slug` repetido só
   apareceria como falha de inserção lá na frente.
5. `build`, `tsc --noEmit` e `lint` limpos.

## Edge cases

| Situação | Tratamento |
|---|---|
| `slug` repetido dentro do mesmo pote | O único `(bucket_id, slug)` da C3 barraria na D7. Verifico **antes**, no dado |
| Categoria que não existe mais | O usuário poderá arquivar na fase 2; o seed não decide isso |
| Pote sem categoria | Nenhum fica sem. **Metas / Sonhos recebe uma só** (Giulia), porque é o que existe no painel — inventar uma segunda para ficar simétrico seria criar dado que o Davi não usa |
| `tag_visual` sem correspondência no CSS | Só uso classes que existem no painel |

## Erros

Sem chamada de rede além da migration. Se o `db:migrate` falhar, reporto sem
remendar à mão.

## Thin Client / Fat Server

Igual à B3: nome e emoji de categoria padrão não são segredo — são o que a
tela exibe. A **gravação** continua exclusiva do servidor (D7).

## Fora do escopo

- Gravar as categorias no banco → **D7**
- `classification_rules` e os estabelecimentos (Premmia, Uber…) → **C5**,
  que continuo recomendando adiar
- Fontes de renda → spec do dashboard

## Critério de pronto (da Etapa 2)

- [ ] Categorias padrão de cada pote definidas em `potes-padrao.ts`
