# Estado do projeto — o que o app é hoje

**Atualizado em:** 27/08/2026, com as specs 06 a 12 no ar
**Contra:** `readme.md`, o pedido original
**Para quê:** o `readme.md` é de antes de existir código. Seis specs depois,
várias decisões dele foram revistas **de propósito** e com motivo registrado.
Este documento é o mapa entre o que foi pedido e o que existe.

> Toda linha de "hoje" aponta para a spec que decidiu. Nenhuma divergência aqui
> é acidente: se não tem spec apontada, é bug de documentação.

---

## O MVP do `readme.md` §2, item a item

| Pedido                                               | Hoje                                | Onde foi decidido  |
| ---------------------------------------------------- | ----------------------------------- | ------------------ |
| Login/cadastro via Clerk                             | ✅                                  | spec 01            |
| Onboarding com os 6 potes padrão                     | ✅ (são 9: 8 de gasto + 1 de renda) | spec 01, C2/C3     |
| Regras do Davi pré-carregadas                        | ✅                                  | spec 03, A5 e D7   |
| Upload manual de CSV (conta + cartão)                | ✅                                  | spec 02            |
| Motor de regras determinístico                       | ✅                                  | spec 03            |
| **Fallback via LLM**                                 | ⏸️ **adiado por decisão**           | spec 03, decisão 1 |
| Tela de revisão + "criar regra" a partir da correção | ✅                                  | spec 03, D3–D5     |
| Dashboard do mês                                     | ✅                                  | spec 04            |
| Comparativo anual simplificado                       | ✅                                  | spec 06            |
| Insights automáticos e veredito                      | ✅                                  | spec 06            |

**O MVP está fechado**, com uma exceção consciente: o LLM. A spec 03 decidiu
_"depois, quando o resíduo justificar"_ — o motor determinístico cobre o mês
real, e cada correção manual vira regra, então o resíduo encolhe sozinho.

## Duas coisas da fase 2 chegaram cedo

| Item, listado como fase 2 no `readme.md` | Hoje                               |
| ---------------------------------------- | ---------------------------------- |
| Edição de regras via interface           | ✅ `/regras` — spec 03, D9         |
| Editar categorias sem mexer no banco     | ✅ `/categorias` — spec 05 inteira |

A spec 05 não estava no `readme.md`. Ela nasceu de um defeito medido: criar
categoria era o único jeito de o motor aprender um gasto novo, e não existia
tela para isso.

---

## Onde a realidade diverge do `readme.md`, e por quê

### Stack (§4)

| `readme.md`                                  | Hoje             | Por quê                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage dos CSVs em **Vercel Blob**          | ❌ não usado     | spec 02, C3: ao medir o que se perdia sem o arquivo, o que faltava eram as **linhas ignoradas**, não o CSV. Viraram `imports.ignoradas`, com motivo e conteúdo. A coluna `url_no_blob` existe e é nula em toda linha. |
| Gráficos com **Recharts**                    | ❌ não instalado | spec 06: o painel estático fazia as barras com `div` e `width` em porcentagem. O que não cabe em 360px é a biblioteca, não a barra.                                                                                   |
| Classificação com **fallback API Anthropic** | ⏸️ adiado        | spec 03, decisão 1                                                                                                                                                                                                    |
| Deploy contínuo por **push no GitHub** (§12) | ❌               | decisão do Davi: deploy por `npx vercel deploy --prod --yes`. O projeto na Vercel **não** é ligado ao Git. O push para o GitHub é backup, não gatilho.                                                                |
| **RLS** no banco (§11)                       | ❌ não existe    | Neon não tem o RLS do Supabase. O isolamento é manual: `user_id` de `garantirUsuario()` em **todo** `where`, nunca do cliente. Está em `references/architecture.md`.                                                  |

### Modelo de dados (§5)

| `readme.md`                                                              | Hoje          | Por quê                                                                                                                                                                                                    |
| ------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`, `buckets`, `categories`, `classification_rules`, `transactions` | ✅ criadas    | —                                                                                                                                                                                                          |
| `accounts`                                                               | ❌ não criada | spec 02: `transactions.origem` (`csv_conta`/`csv_cartao`) resolve o MVP. Multi-conta é fase 2, e criar a tabela agora seria adivinhar colunas.                                                             |
| `monthly_snapshots`                                                      | ❌ não criada | O painel calcula ao vivo, e o comparativo também. **Não existe "confirmar o mês"** (§6, passo 7): reclassificar um lançamento corrige a tela na hora, e um snapshot congelado divergiria dela em silêncio. |

**Tabelas que o `readme.md` não previa:** `imports` (spec 02), `decision_undo`
(spec 03, o desfazer), `monthly_income` (spec 04, a renda declarada).

### Perguntas em aberto (§14)

| Pergunta                               | Resposta                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1. Onboarding de usuário não-Davi      | Sem resposta, e sem urgência: acesso é por convite, e só a conta do Davi existe                              |
| 2. Limite de uso do LLM por conta      | Sem efeito enquanto o LLM não entrar                                                                         |
| 3. Convite fechado ou cadastro aberto  | ✅ **Convite fechado.** Allowlist no servidor — spec 01, D3                                                  |
| 4. Formato do extrato varia por banco? | ✅ **Medido**, e está em `references/formatos-de-extrato.md`. O reconhecimento é por cabeçalho — spec 02, A2 |

---

## O que ainda não existe

### Fase 2 do `readme.md` — menos um item

> **Metas por pote configuráveis saiu daqui na spec 13.** A renda já era
> editável desde a spec 04; o rateio passou a ser, na `/categorias`. Custou
> zero migration: `percentual_meta` existia desde a spec 03 e só o seed
> escrevia nela.


- Parsing de fatura em **PDF**
- **Notificações/lembretes** mensais ("já subiu o extrato desse mês?")
- **Multi-conta** bancária
- **Exportação** (PDF/Excel) do relatório mensal

### Fora de escopo declarado (§13)

Open Finance, app nativo, múltiplos idiomas, painel compartilhado entre duas
pessoas.

### Não está em spec nenhuma, e talvez devesse

- **Fixar uma categoria como cartão do comparativo.** A spec 12 entregou os
  cartões de topo, mas **por pote** — e o painel original tinha um de categoria,
  o ⛽ Média Mensal Gasolina. Ele ficou de fora (spec 12, pendência 4) porque é o
  único dos seis que não é pote e seria a única consulta nova da spec. Se fizer
  falta, o pedido real é _"fixar uma categoria como cartão"_, que é
  funcionalidade e não cartão.

> ⚠ **Os 6 cartões de topo do Comparativo Anual saíram daqui.** Eram dívida
> aberta desde a spec 06 (pendência 5), com a justificativa de que _"seriam outra
> consulta"_. A spec 12 conferiu: **cinco dos seis são potes**, e os emojis batem
> um a um com o `potes-padrao.ts`. `historicoDosMeses` já respondia — foram
> entregues sem uma linha de SQL nova.

---

## As telas que existem

| Rota                    | O quê                                                           | Spec    |
| ----------------------- | --------------------------------------------------------------- | ------- |
| `/entrar`, `/cadastrar` | Acesso, com allowlist                                           | 01      |
| `/bem-vindo`            | Primeiro acesso, cria potes e categorias                        | 01      |
| `/upload`               | Enviar extrato, histórico de envios, desfazer                   | 02      |
| `/formatos`             | O que o app lê, e o que você ensinou a ele                      | 11      |
| `/revisao`              | Decidir um lançamento por vez, com desfazer                     | 03      |
| `/regras`               | Ver, corrigir e apagar o que o motor aprendeu                   | 03      |
| `/dashboard`            | Veredito, potes com insight, comparativo                        | 04 e 06 |
| `/categorias`           | Criar, renomear, mover e apagar categoria (recolhível por pote), e **a meta de cada pote** | 05, 09 e 13 |
| `/comparativo`          | Os potes mês a mês num ano, com os cartões de topo              | 09 e 12 |
| `/configuracoes`        | Aparência (escuro/claro/sistema) e tamanho da letra             | 08 e 10 |
| `/passos`               | Como pegar o extrato no banco                                   | 09      |

## Instalável no celular

✅ **spec 07.** Manifesto, ícone de seis potes na tela inicial, barra de status
escura e área segura tratada. **Sem service worker, de propósito**: cachear tela
autenticada de app financeiro troca um problema pequeno (abrir sem internet) por
um grande (número velho com cara de novo).

Isso destrava a **notificação push** da fase 2 — no iPhone ela exige o app
instalado.
