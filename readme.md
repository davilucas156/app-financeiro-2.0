# Requisitos — App Mobile "Painel Financeiro 6 Potes" (Multiusuário)

**Versão:** rascunho v1 para revisão do Davi
**Destino:** repassar para Claude Code executar a implementação
**Origem:** derivado do painel HTML atual (`planejamento_anual_davi.html`) e das regras de classificação já validadas ao longo de Dez/2025–Jun/2026

---

## 1. Visão Geral

Transformar o painel financeiro pessoal (hoje uma SPA HTML estática, montada manualmente mês a mês com ajuda do Claude) em um **aplicativo web mobile-first**, hospedado na **Vercel**, com:

- Login/cadastro de usuário (multiusuário — cada pessoa só vê seus próprios dados)
- Upload de extratos (conta corrente + fatura de cartão) em CSV
- **Classificação automática** das transações nos 6 Potes, com base em regras configuráveis pelo próprio usuário
- Revisão manual apenas do que ficar ambíguo
- Dashboard equivalente ao atual: cards de resumo, tabela de categorias, potes com barra de progresso, insights, comparativo anual

O grande salto em relação ao modelo atual: hoje **eu (Claude) sou o motor de classificação**, lendo o CSV manualmente a cada mês. No app, esse motor de classificação precisa virar **código determinístico + regras configuráveis no banco de dados**, para funcionar sem um humano/LLM no loop todo mês (ou usando um LLM via API de forma controlada — isso é uma decisão em aberto, ver seção 14).

---

## 2. MVP vs Visão de longo prazo

**MVP (fase 1) — já multiusuário completo:**
- Login/cadastro via Clerk (qualquer pessoa pode criar conta)
- Onboarding: usuário novo começa com os 6 potes padrão (percentuais do Davi como sugestão inicial) e nenhuma regra cadastrada — a conta do Davi é a única pré-carregada com as regras já existentes (Giulia, Cadillac, etc.), as demais contas começam do zero e vão treinando o motor híbrido conforme usam
- Upload manual de CSV (conta + cartão) por mês
- Motor de regras determinístico + fallback via LLM para o que não bater regra (seção 7.1)
- Tela de revisão de transações candidatas antes de confirmar o mês, incluindo sugestões do LLM com opção de "criar regra" a partir da correção
- Dashboard do mês (potes, categorias, resumo) — versão mobile do que já existe
- Comparativo anual simplificado

**Fase 2 (depois do MVP validado):**
- Parsing de fatura em PDF (não só CSV)
- Notificações/lembretes mensais ("já subiu o extrato desse mês?")
- Edição de regras via interface (sem precisar mexer em JSON/banco)
- Metas por pote configuráveis por usuário (hoje fixo: 25/30/15/15/10/5%)
- Multi-conta bancária (hoje: Inter + Itaú + XP + Nubank)
- Exportação (PDF/Excel) do relatório mensal

**Fora de escopo por enquanto:** integração via Open Finance/API bancária direta (conexão automática com o banco) — fica para uma fase futura, se fizer sentido.

---

## 3. Multiusuário — o que muda

O painel atual tem regras **hardcoded para o Davi** (ex: "Pix para Giulia Ferreira Costa na conta Nubank = Metas"). Isso não escala para outro usuário.

Proposta: separar em duas camadas —

1. **Motor genérico de classificação**, com tipos de regra reutilizáveis:
   - por nome/CNPJ do favorecido (contém texto X → categoria Y)
   - por valor + direção (Pix recebido/enviado, débito/crédito)
   - por conta de destino (ex: "Pix para pessoa X, conta Nubank" vs "conta corrente")
   - por recorrência (mesmo valor, mesmo dia do mês → custo fixo)
2. **Regras específicas de cada usuário**, cadastradas por ele mesmo (ex: Davi cadastra "Giulia Ferreira Costa" + regra de conta Nubank = Metas). No onboarding, as regras atuais do Davi são pré-carregadas como dele (dado que já existem e estão validadas).

Isso significa que a tabela de regras (seção 5) é **por usuário**, não global.

---

## 4. Stack técnica (decidido)

| Camada | Escolha |
|---|---|
| Frontend | Next.js (App Router) + Tailwind, mobile-first |
| Hospedagem | Vercel |
| Auth | **Clerk** |
| Banco de dados | **Vercel Postgres / Neon** |
| Storage dos CSVs originais | Vercel Blob |
| Parsing de CSV | papaparse (server action) |
| Classificação automática | motor de regras determinístico + fallback via API Anthropic (ver seção 7) |
| Gráficos | Recharts |

**Observação de integração:** como Auth (Clerk) e DB (Neon/Vercel Postgres) são serviços separados, o `user_id` das tabelas deve referenciar o `user.id` do Clerk (via webhook do Clerk gravando/atualizando o usuário na tabela `users` no primeiro login, ou verificação do JWT do Clerk em cada request). Isso fica registrado como tarefa explícita de setup para o Claude Code, já que não tem o RLS nativo que o Supabase teria — o isolamento por usuário precisa ser garantido manualmente em toda query (sempre filtrar por `user_id` vindo da sessão autenticada, nunca do client).

---

## 5. Modelo de dados (rascunho de entidades)

**users**
`id, nome, email, criado_em`

**accounts** (contas bancárias do usuário)
`id, user_id, nome ("Inter Débito", "Inter Crédito", "Nubank Caixinha"...), tipo (corrente/cartão/investimento/poupança)`

**buckets** (os "6 potes" — configurável por usuário na fase 2, fixo no MVP)
`id, user_id, nome, emoji, percentual_meta, valor_meta, cor`

**categories** (subcategorias dentro dos potes — gasolina, ônibus, manutenção, etc.)
`id, bucket_id, nome, tag_visual`

**classification_rules**
`id, user_id, tipo_regra (nome_contem / valor_direcao / conta_destino / recorrencia), criterio (json), categoria_id, prioridade`

**transactions**
`id, user_id, account_id, data, descricao_original, valor, direcao (entrada/saida), categoria_id, status (auto/confirmada/revisao_pendente/excluida), motivo_exclusao, mes_referencia, origem (csv_conta/csv_cartao)`

**monthly_snapshots** (equivalente ao `MONTHLY_DATA` atual)
`id, user_id, mes_referencia, totais_por_pote (json), renda_total, insights (json ou texto), veredito`

Isso é um rascunho — Claude Code pode ajustar o schema durante a implementação.

---

## 6. Fluxo principal: Upload → Classificação → Lançamento

1. Usuário faz login
2. Usuário seleciona o mês e faz upload dos CSVs (conta corrente + cartão)
3. Sistema faz parsing das transações
4. Motor de regras classifica automaticamente o que conseguir (baseado nas `classification_rules` do usuário)
5. Sistema detecta possíveis duplicatas/zero-a-zero (mesmo valor, sentidos opostos, datas próximas) e marca para revisão
6. Usuário revisa: confirma o que está auto-classificado, corrige o que estiver errado, decide o que estiver pendente
7. Ao confirmar o mês, sistema gera o `monthly_snapshot` e atualiza o dashboard + comparativo anual
8. Toda correção manual pode opcionalmente **virar uma nova regra** ("sempre classificar assim de novo?") — isso reduz revisão manual nos meses seguintes

---

## 7. Motor de Classificação — regras herdadas do painel atual

Estas regras (hoje aplicadas manualmente por mim) devem virar as regras-base pré-cadastradas do Davi no onboarding:

- Transporte: Gasolina (Premmia, Petrobras, postos), Ônibus (Pagar Me, Transfacil, BHBus), Apps (Uber, 99), Estacionamento (Allpark, Epar)
- Manutenção veicular como tag própria dentro de Transporte (Edson, Ferauto, oficinas)
- Custos fixos: Total Pass, Vivo, Johns Barbearia (recorrência mensal ~R$40)
- Lazer/Conforto: Spotify, Prime, iCloud, Shopee, MercadoLivre, sorveterias/padarias
- Conhecimento: Vindi/Investidor10, Udemy, cursos
- Giulia: regra de duas camadas (conta destino Nubank → Metas; outra conta → dia a dia)
- Cadillac Monte Carmo: Pix recebido → Renda Extra; compra no cartão para Cadillac → pendente de revisão manual
- Exclusões automáticas: pagamento de fatura (evitar dupla contagem), pass-throughs, zero-a-zero

O sistema deve marcar como **"candidata a revisão"** qualquer transação que:
- não bata com nenhuma regra existente
- tenha valor alto (configurável, hoje > R$200) mesmo que bata com uma regra fraca
- pareça duplicata/zero-a-zero

### 7.1 Classificação híbrida (regras + LLM)

Fluxo de duas camadas, na ordem:

1. **Motor determinístico primeiro** — aplica as `classification_rules` do usuário (nome contém, valor+direção, conta destino, recorrência). É rápido, previsível, sem custo de API, e cobre a maioria dos casos recorrentes (Uber, Vivo, Total Pass, etc.).
2. **Fallback via API Anthropic** apenas para o que sobrar sem match nas regras. Nesse caso:
   - Envia para a API a descrição da transação, valor, direção, e o **contexto das regras/categorias já existentes do usuário** (não o histórico financeiro inteiro, só a lista de potes/categorias e alguns exemplos de classificações passadas semelhantes, para não estourar contexto nem custo).
   - A resposta da API deve vir em formato estruturado (JSON: categoria sugerida + nível de confiança + justificativa curta).
   - **Nunca lançar automaticamente uma classificação vinda do LLM sem passar pela tela de revisão** — o LLM só *sugere*, quem confirma é o usuário. Isso evita que um erro de classificação passe direto pro dashboard.
   - Toda sugestão do LLM confirmada pelo usuário deve gerar automaticamente uma proposta de nova regra determinística (ex: "Cadillac Monte Carmo apareceu no cartão 2x classificado como Lazer → criar regra?"), para que o mesmo caso não precise de LLM de novo no mês seguinte. Isso mantém o custo de API baixo ao longo do tempo.
   - Chave de API: fica armazenada como variável de ambiente no servidor (nunca exposta no client); a chamada acontece via server action/route handler, nunca direto do browser.

---

## 8. Revisão manual / Ambiguidades

Tela dedicada, mobile-first, no estilo "swipe/tap para confirmar categoria" — lista as transações pendentes uma a uma (ou em lote) com sugestão de categoria e opção de trocar. Ao final, dá para revisar o resumo antes de confirmar o mês.

---

## 9. Dashboard (adaptado do painel atual)

Mantém a essência visual e funcional do HTML atual, adaptado para mobile:
- Banner de fontes de renda
- Cards de resumo clicáveis → abrem lista filtrada de transações
- 6 potes com barra de progresso
- Insights automáticos (mesmos 10 pontos já usados: gasolina, metas, custos fixos, manutenção, lazer, aporte, renda extra, alerta futuro, fora do planejamento, pontos de atenção)
- Veredito final do mês
- Comparativo anual (gráfico de barras + tabela)

Design system: manter a mesma identidade (dark mode, `Syne` + `DM Mono`, paleta de cores atual) — ver seção do painel original.

---

## 10. Potes e Metas

No MVP: os 6 potes fixos, com os mesmos percentuais/metas do Davi (25/30/15/15/10/5%), mas associados ao `user_id` — ou seja, tecnicamente já preparado para ser configurável por usuário, mesmo que a interface de edição só chegue na fase 2.

---

## 11. Autenticação e Segurança

- Cada usuário só acessa seus próprios dados (row-level security no banco, se Supabase)
- CSVs enviados ficam armazenados de forma privada, vinculados ao `user_id`
- Sem dados de cartão/senha de banco trafegando — apenas os extratos (CSV) que o próprio usuário exporta e envia

---

## 12. Requisitos não-funcionais

- Mobile-first (mas funcional em desktop também)
- Deploy contínuo via Vercel (push no GitHub → deploy automático)
- Tempo de resposta do parsing/classificação: idealmente síncrono para extratos de até ~200 transações
- Idioma: português (BR), formato de moeda R$

---

## 13. Fora de escopo (v1)

- Conexão automática com banco (Open Finance)
- App nativo (iOS/Android) — será PWA/responsivo primeiro
- Múltiplos idiomas
- Colaboração entre usuários (ex: casal compartilhando um painel) — cada login é isolado no MVP

---

## 14. Perguntas em aberto (restantes)

Decisões já batidas: stack (Vercel Postgres/Neon + Clerk), classificação híbrida (regras + LLM fallback), MVP multiusuário completo desde o início.

Ainda em aberto, valem uma resposta rápida antes de repassar ao Claude Code:

1. **Onboarding de novo usuário (não-Davi):** ele cadastra as próprias regras manualmente na interface desde o dia 1, ou o app oferece um "modo aprendizado" onde as primeiras semanas passam mais transações pelo LLM até o motor de regras ficar treinado? (isso afeta o design da tela de revisão)
2. **Custo da API Anthropic por usuário:** como o app passa a ter usuários além de você, faz sentido pensar em algum limite de uso do LLM por conta (ex: X transações/mês no fallback) para não gerar custo de API imprevisível? Ou não é uma preocupação agora, por ser só uso pessoal/pequeno grupo?
3. **Convite fechado ou cadastro aberto:** o cadastro fica aberto para qualquer pessoa (link público), ou você quer controlar quem entra (ex: lista de convidados) enquanto valida o produto?
4. **Formato do extrato do cartão:** hoje você processa o CSV do cartão junto com o débito do Inter — os dois bancos/fontes sempre vêm em CSV com a mesma estrutura de colunas, ou o formato varia por banco (o que exigiria um parser por banco em vez de um genérico)?
