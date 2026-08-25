# Estado do projeto — o que o app é hoje

**Atualizado em:** 24/08/2026, com as specs 06, 07, 08 e 09 no ar
**Contra:** `readme.md`, o pedido original
**Para quê:** o `readme.md` é de antes de existir código. Seis specs depois,
várias decisões dele foram revistas **de propósito** e com motivo registrado.
Este documento é o mapa entre o que foi pedido e o que existe.

> Toda linha de "hoje" aponta para a spec que decidiu. Nenhuma divergência aqui
> é acidente: se não tem spec apontada, é bug de documentação.

---

## O MVP do `readme.md` §2, item a item

| Pedido | Hoje | Onde foi decidido |
|---|---|---|
| Login/cadastro via Clerk | ✅ | spec 01 |
| Onboarding com os 6 potes padrão | ✅ (são 9: 8 de gasto + 1 de renda) | spec 01, C2/C3 |
| Regras do Davi pré-carregadas | ✅ | spec 03, A5 e D7 |
| Upload manual de CSV (conta + cartão) | ✅ | spec 02 |
| Motor de regras determinístico | ✅ | spec 03 |
| **Fallback via LLM** | ⏸️ **adiado por decisão** | spec 03, decisão 1 |
| Tela de revisão + "criar regra" a partir da correção | ✅ | spec 03, D3–D5 |
| Dashboard do mês | ✅ | spec 04 |
| Comparativo anual simplificado | ✅ | spec 06 |
| Insights automáticos e veredito | ✅ | spec 06 |

**O MVP está fechado**, com uma exceção consciente: o LLM. A spec 03 decidiu
*"depois, quando o resíduo justificar"* — o motor determinístico cobre o mês
real, e cada correção manual vira regra, então o resíduo encolhe sozinho.

## Duas coisas da fase 2 chegaram cedo

| Item, listado como fase 2 no `readme.md` | Hoje |
|---|---|
| Edição de regras via interface | ✅ `/regras` — spec 03, D9 |
| Editar categorias sem mexer no banco | ✅ `/categorias` — spec 05 inteira |

A spec 05 não estava no `readme.md`. Ela nasceu de um defeito medido: criar
categoria era o único jeito de o motor aprender um gasto novo, e não existia
tela para isso.

---

## Onde a realidade diverge do `readme.md`, e por quê

### Stack (§4)

| `readme.md` | Hoje | Por quê |
|---|---|---|
| Storage dos CSVs em **Vercel Blob** | ❌ não usado | spec 02, C3: ao medir o que se perdia sem o arquivo, o que faltava eram as **linhas ignoradas**, não o CSV. Viraram `imports.ignoradas`, com motivo e conteúdo. A coluna `url_no_blob` existe e é nula em toda linha. |
| Gráficos com **Recharts** | ❌ não instalado | spec 06: o painel estático fazia as barras com `div` e `width` em porcentagem. O que não cabe em 360px é a biblioteca, não a barra. |
| Classificação com **fallback API Anthropic** | ⏸️ adiado | spec 03, decisão 1 |
| Deploy contínuo por **push no GitHub** (§12) | ❌ | decisão do Davi: deploy por `npx vercel deploy --prod --yes`. O projeto na Vercel **não** é ligado ao Git. O push para o GitHub é backup, não gatilho. |
| **RLS** no banco (§11) | ❌ não existe | Neon não tem o RLS do Supabase. O isolamento é manual: `user_id` de `garantirUsuario()` em **todo** `where`, nunca do cliente. Está em `references/architecture.md`. |

### Modelo de dados (§5)

| `readme.md` | Hoje | Por quê |
|---|---|---|
| `users`, `buckets`, `categories`, `classification_rules`, `transactions` | ✅ criadas | — |
| `accounts` | ❌ não criada | spec 02: `transactions.origem` (`csv_conta`/`csv_cartao`) resolve o MVP. Multi-conta é fase 2, e criar a tabela agora seria adivinhar colunas. |
| `monthly_snapshots` | ❌ não criada | O painel calcula ao vivo, e o comparativo também. **Não existe "confirmar o mês"** (§6, passo 7): reclassificar um lançamento corrige a tela na hora, e um snapshot congelado divergiria dela em silêncio. |

**Tabelas que o `readme.md` não previa:** `imports` (spec 02), `decision_undo`
(spec 03, o desfazer), `monthly_income` (spec 04, a renda declarada).

### Perguntas em aberto (§14)

| Pergunta | Resposta |
|---|---|
| 1. Onboarding de usuário não-Davi | Sem resposta, e sem urgência: acesso é por convite, e só a conta do Davi existe |
| 2. Limite de uso do LLM por conta | Sem efeito enquanto o LLM não entrar |
| 3. Convite fechado ou cadastro aberto | ✅ **Convite fechado.** Allowlist no servidor — spec 01, D3 |
| 4. Formato do extrato varia por banco? | ✅ **Medido**, e está em `references/formatos-de-extrato.md`. O reconhecimento é por cabeçalho — spec 02, A2 |

---

## O que ainda não existe

### Fase 2 do `readme.md`, intacta

- Parsing de fatura em **PDF**
- **Notificações/lembretes** mensais ("já subiu o extrato desse mês?")
- **Metas por pote configuráveis** — a renda virou editável na spec 04; o
  rateio entre os potes, não
- **Multi-conta** bancária
- **Exportação** (PDF/Excel) do relatório mensal

### Fora de escopo declarado (§13)

Open Finance, app nativo, múltiplos idiomas, painel compartilhado entre duas
pessoas.

### Decidido pelo Davi, ainda sem spec

- **CSV de vários bancos.** Dito em 24/08/2026: *"nossa proposta será receber
  diferentes csvs nao apenas do banco inter"*. Hoje `FORMATOS` tem **duas**
  entradas, as duas do Inter, e a régua de `references/formatos-de-extrato.md`
  é que **formato se mede em arquivo real antes de virar parser**.

  A spec 09 já preparou o terreno pelo lado da ajuda: `FORMATOS` ganhou o campo
  `banco` e a tela `/passos` deriva dali a lista do que o app entende — ela
  passa a listar um banco novo sozinha.

  O que a spec do multibanco vai ter de decidir, e ainda não está decidido:
  **medir cada banco (o que existe hoje, e não escala) ou ler CSV genérico com o
  usuário apontando as colunas** (que escala, e transfere para ele a chance de
  errar o sentido do sinal — o erro que faria todo gasto do cartão virar
  receita). Não dá para escolher sem um arquivo de outro banco na mão.

### Não está em spec nenhuma, e talvez devesse

- **Os 6 cartões de topo do Comparativo Anual** — investido acumulado, metas
  acumuladas, médias de gasolina/custos fixos/lazer, total de manutenção. São
  agregados por **categoria** e por **ano**; o histórico da spec 06 é por pote.
  Seriam outra consulta. Decisão registrada na spec 06, pendência 5.

---

## As telas que existem

| Rota | O quê | Spec |
|---|---|---|
| `/entrar`, `/cadastrar` | Acesso, com allowlist | 01 |
| `/bem-vindo` | Primeiro acesso, cria potes e categorias | 01 |
| `/upload` | Enviar extrato, histórico de envios, desfazer | 02 |
| `/revisao` | Decidir um lançamento por vez, com desfazer | 03 |
| `/regras` | Ver, corrigir e apagar o que o motor aprendeu | 03 |
| `/dashboard` | Veredito, potes com insight, comparativo | 04 e 06 |
| `/categorias` | Criar, renomear, mover e apagar categoria (recolhível por pote) | 05 e 09 |
| `/comparativo` | Os potes mês a mês, fora do painel | 09 |
| `/configuracoes` | Aparência: escuro, claro ou seguir o sistema | 08 |
| `/passos` | Como pegar o extrato no banco | 09 |

## Instalável no celular

✅ **spec 07.** Manifesto, ícone de seis potes na tela inicial, barra de status
escura e área segura tratada. **Sem service worker, de propósito**: cachear tela
autenticada de app financeiro troca um problema pequeno (abrir sem internet) por
um grande (número velho com cara de novo).

Isso destrava a **notificação push** da fase 2 — no iPhone ela exige o app
instalado.
