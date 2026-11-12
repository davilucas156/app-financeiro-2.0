# Revisão de Arquitetura — 2026-11-11 (rodada 29)

Arquivos pedidos: 10 · Escopo executado: 10 arquivos × 4 checagens (40 chamadas de worker, todas responderam)

Esta rodada continua as anteriores. Já revisados e não repetidos: `importarExtrato.service.ts`, `decidirLancamento.service.ts` (2026-10-05); `painelDoMes.service.ts`, `mexerNaCategoria.service.ts`, `ensinarFormato.action.ts` (2026-10-06); `schema.ts`, `lancamentos.ts`, `preparar.ts` (rodada 1); `regras.ts`, `somarOMes.ts`, `formatoDoUsuario.ts` (rodada 2); `palpite.ts`, `apagarCategoria.service.ts`, `pendentes.ts` (rodada 3); `desfazerDecisao.service.ts`, `definirMeta.service.ts` (rodada 4); `reconhecer.ts`, `sugestoes.ts`, `potes-padrao.ts` (rodada 5); `metasDoPadrao.ts`, `seed.ts` (rodada 6); `concluirOnboarding.service.ts`, `criterioDaCorrecao.ts` (rodada 7); `linhasDeRegras.ts`, `chaveDaRegra.ts` (rodada 8); `regrasNaTela.ts`, `mexerNaRegra.service.ts`, `quemRecebe.ts` (rodada 9); `allowlist.ts`, `semente.ts`, `erroDoPostgres.ts` (rodada 10); `proxy.ts`, `salvar-usuario.ts`, `pessoa.ts` (rodada 11); `trecho.ts`, `garantirUsuario.service.ts`, `sincronizarUsuario.service.ts` (rodada 12); `webhooks/clerk/route.ts`, `rendaDoMes.service.ts`, `listarPendentes.service.ts` (rodada 13); `filaDeRevisao.ts`, `formatosDoUsuario.service.ts`, `desfazer.ts` (rodada 14); `enviosDoMes.service.ts`, `historicoDosMeses.service.ts`, `coberturaDosMeses.service.ts` (rodada 15); `removerOMes.service.ts`, `cobertura.ts`, `oQueSaiDoMes.ts` (rodada 16); `categoriasNaTela.ts`, `veredito.ts`, `comparativo.ts` (rodada 17); `aviso.ts`, `insightDoPote.ts`, `poteNoPainel.ts` (rodada 18); `CartaoDoPote.tsx`, `CartaoDaCategoria.tsx`, `gerirCategorias.action.ts` (rodada 19); `meta.ts`, `CartaoDaRegra.tsx`, `CampoDeMeta.tsx` (rodada 20); `RemoverOMes.tsx`, `LinhaDeEnvio.tsx`, `TelaDeCategorias.tsx` (rodada 21); `ResumoDasMetas.tsx`, `FormularioDeCategoria.tsx`, `Card.tsx` (rodada 22); `evento.ts`, `listaDeEmails.ts`, `db.ts` (rodada 23); `dinheiro.ts`, `transacaoDoBanco.ts`, `importarExtrato.action.ts` (rodada 24); `declararRenda.action.ts`, `desfazerEnvio.service.ts`, `decidirLancamento.action.ts` (rodada 25); `trazerDeVolta.service.ts`, `raioX.service.ts`, `criarEClassificar.service.ts` (rodada 26); `listarRegras.service.ts`, `listarParaGerir.service.ts`, `removerOMes.action.ts`, `restaurarMetas.service.ts`, `definirMeta.action.ts`, `mexerNaRegra.action.ts`, `classificarImportacao.ts`, `PainelDeMapeamento.tsx`, `TelaDeRevisao.tsx`, `previa.ts` (rodada 27); `FormularioDeEnvio.tsx` (rodada 28). `foraDaConta.ts`, `SecaoDoComparativo.tsx`, `AbasDoPainel.tsx`, `PerguntaDeRegra.tsx`, `formatos.ts`, `grade.ts`, `mes.ts`, `emCentavos.ts`, `ListaDeCategorias.tsx`, `validar.ts` (rodada 29). **Cobertura acumulada: 101 de ~201 arquivos (~50%).** (O cabeçalho da rodada 28 dizia 90 e não contava o `FormularioDeEnvio.tsx`; a lista acima agora o inclui.)

**Dívida registrada (não é achado novo):** o teste de regressão do `desfazerEnvio.service.ts` (rodada 25, item 3) está em `references/estado-do-projeto.md`.

**Verificação:** os números de linha são dos workers. **Conferido** = o orquestrador leu ou buscou por grep; o resto é afirmação de worker (todos marcaram "conferido" o que verificaram com Grep/Read).

## Arquivos revisados e por quê

- `src/features/painel/fora-da-conta/foraDaConta.ts` — cálculo de dinheiro (entrada/saída anuladas); nunca revisado.
- `src/features/painel/comparar-meses/SecaoDoComparativo.tsx` — 309 linhas de tela de comparação com lógica de escala dentro do `.tsx`.
- `src/features/painel/navegar-entre-meses/AbasDoPainel.tsx` — maior arquivo sem revisão (329 linhas), único `"use client"` de navegação do painel.
- `src/features/classificacao/revisar-lancamento/PerguntaDeRegra.tsx` — cria regras que reclassificam em massa; já tinha pendência aberta (rodada 27, item 3).
- `src/features/upload/ler-arquivo/formatos.ts` — catálogo de formatos de extrato, importado por 10+ arquivos.
- `src/features/upload/ler-arquivo/grade.ts` — porta de entrada do arquivo do usuário (bytes → grade).
- `src/lib/mes.ts` — hub: 19 arquivos o importam; "mes aceita 2026-13" já tinha sido apontado.
- `src/features/painel/renda-do-mes/emCentavos.ts` — texto digitado → dinheiro.
- `src/features/classificacao/revisar-lancamento/ListaDeCategorias.tsx` — seletor de categorias, origem do "select de potes duplicado".
- `src/features/categorias/nomear-categoria/validar.ts` — validação do que se grava em `categories`.

## Resultado por arquivo (resumo das 40 checagens; nenhum worker falhou)

### `foraDaConta.ts`
- **Acoplamento:** limpo. Função pura, só `import type`. `Direcao` vem de `upload/ler-arquivo/lancamentos.ts` (padrão do projeto, 8 arquivos) — Baixa, sistêmico.
- **Tipagem:** só Baixas. `outro!` (`:127`) depende da ordenação anterior; comparadores `a.data < b.data ? -1 : 1` nunca devolvem 0 (`:113`, `:139`), então a `chave` ("lado mais antigo") depende da ordem de entrada em caso de empate de data, e o teste "chave estável" só usa datas diferentes; `LadoDoPar` não carrega `valorCentavos` e a soma usa o valor de `l` nos dois lados (vale só enquanto os valores forem iguais).
- **Thin/Fat:** limpo — roda só no servidor (`painelDoMes.service.ts:280`), cliente importa só tipos.
- **Duplicação:** Baixa — a regra "excluído com `parDe` = par anulado; sem `parDe` = passagem" está inline em 4 lugares (`foraDaConta.ts:96,134`, `trazerDeVolta.service.ts:65,75`, `importarExtrato.service.ts:229-232`, `preparar.ts:51`). `painelDoMes.service.ts:289` escreve `"entrada" | "saida"` em vez de `Direcao`.

### `SecaoDoComparativo.tsx`
- **Acoplamento — Média:** `maiorValor`, `anos`, `ultimoMes` e a largura de barra (`Math.round(x/teto*100)` + clamp, escrita 4×: `:212-213,230,259,269`) são lógica pura sem teste dentro do `.tsx`. Os testes existentes cobrem `comparativo.linhas`, não a escala.
- **Tipagem:** sem `any`/cast; união `MediaDoComparativo` discriminada corretamente. Baixas: `mes` é `string` solta com `slice(2,4)` manual (`:221`); `cor` entra em `estiloDoPote` sem validar hex (dado vem do servidor, não é vetor).
- **Thin/Fat:** limpo (Server Component, cadeia inteira no servidor).
- **Duplicação — Média/Baixa:** abreviação `nomeDoMes(...).slice(0,3)` copiada em `CartoesDoAno.tsx:210`; `slice(0,4)` em vez de `anoDoMes`; `w-[5.6em]`/`w-[8em]` repetidos (o comentário diz que precisam andar juntos).

### `AbasDoPainel.tsx`
- **Acoplamento:** sem achado de camada. Baixas: rolagem (DOM puro, sem teste) misturada com navegação; URLs `/dashboard?mes=` e `/comparativo?ano=` montadas à mão (o contrato `?ano=` mora em 3 arquivos: `AbasDoPainel:317`, `SeletorDeAno:34`, `TelaDoComparativo:167`).
- **Tipagem:** só Baixas — `as HTMLElement | null` (`:175`) silencia o compilador; a união `"painel" | "comparativo"` escrita 2× (`:92`, `:309`).
- **Thin/Fat:** limpo. O `"use client"` se justifica (`useRef`, `ResizeObserver`); mês da URL é conferido contra os meses da conta no servidor.
- **Duplicação — Média:** o docblock (`:286-290`) diz que a aba do comparativo toma "a mesma decisão" que `ChamadaDoComparativo`, mas a aba usa `meses.length < 2` e a chamada usa `media.pode` — as regras divergem (conta com 2 meses e o anterior descartado: mostra a aba, esconde a chamada). Pode ser intencional; o comentário é que está errado. Classes da "pílula" copiadas 3× no arquivo + `SeletorDeAno`.
- **Fora da lente:** `architecture.md:538-540` diz que `NavegacaoPrincipal` é o único `"use client"` do projeto; está desatualizado.

### `PerguntaDeRegra.tsx`
- **Acoplamento:** limpo (props prontas, `import type` do motor). Baixa: `frasePegaJunto` (0/1/n) é lógica pura de texto sem teste.
- **Tipagem:** chamada à action **bem tratada** (`try/catch` → `FALHA_DE_CONEXAO`; isso resolve este arquivo no item 3 da rodada 27). Baixas: `fonteDaSugestao` é `FonteDeSugestao` no componente mas `string` na action (`decidirLancamento.action.ts:25`, revalidada em runtime pelo `find`); `conflito` é tipo anônimo inline.
- **Thin/Fat:** **limpo e exemplar** — ids validados como UUID, `userId` da sessão, posse da categoria e do lançamento conferida no service, valor da regra "só neste valor" vem do banco, trecho recalculado no servidor.
- **Duplicação — Média:** o `Botao` local (`:233-261`) reimplementa `components/ui/Button.tsx` e já diverge: `hover:` sem `enabled:`, então o botão desabilitado reage ao mouse (bug que o `Button` documenta em `:16-17`), sem `loading`/spinner. Cartão vermelho copiado com `/25` onde as outras cópias usam `/20`.

### `formatos.ts`
- **Acoplamento — Média:** `Origem` mora em `upload/ler-arquivo/formatos.ts` mas é conceito transversal (importada por `classificacao/...`: `pendentes.ts:16`, `criterioDaCorrecao.ts:9`, `sugestoes.ts:1`, `trecho.ts:1`) e o literal `"csv_conta" | "csv_cartao"` se repete em `schema.ts:249,372,833`, `formatosDoUsuario.service.ts:20`, `exibirEnvio.ts:31`, `oQueSaiDoMes.ts:39`.
- **Tipagem — Média:** `Papel` é união escrita à mão e `PAPEIS` está repetido em `formatoDoUsuario.ts:54-61`; um papel novo quebra `ROTULOS_DO_PAPEL` mas **não** `PAPEIS`, e a validação o descarta em silêncio (força casts `as Papel` em `formatoDoUsuario.ts:200,208`, `reconhecer.ts:183`). Baixa: `FORMATOS` e `obrigatorias` mutáveis e compartilhados por referência.
- **Thin/Fat:** o arquivo está limpo, mas há um efeito vizinho — `PainelDeMapeamento.tsx` (`"use client"`) importa **por valor** `formatoDoUsuario.ts`, que importa `SEPARADORES_VALIDOS` de `palpite.ts`, que importa `grade.ts` e `lancamentos.ts`: o leitor de CSV vai para o bundle do navegador só para carregar uma constante de 4 itens (não medido com build). Sem risco de segurança (o servidor revalida).
- **Duplicação:** normalização NFD/acento repetida 4× (`formatos.ts:168-178`, `preparar.ts:95-102`, `slug.ts:25`, `ListaDeCategorias.tsx:20`).

### `grade.ts`
- **Acoplamento:** limpo, zero imports. Baixa: `schema.ts:21` importa o tipo `Dialeto` desta camada (db → feature; padrão do `schema.ts`, que já faz isso em 4 imports).
- **Tipagem — Média:** `Dialeto.separador` é `string` solta; com `""` a grade vira uma célula por caractere. `formatoDoUsuario.ts:129-133` valida contra `SEPARADORES_VALIDOS`, mas `ensinarFormato.action.ts:208-221` (`comoPalpite`) só confere `typeof === "string"` e repassa a `paraGrade` (`:185`). Baixas: sem limite próprio de linhas; `decodificar` nunca falha (binário vira lixo em iso-8859-1).
- **Thin/Fat:** limpo — parse e limite (`TAMANHO_MAXIMO`) rodam no servidor. Baixa: a extensão `.csv` só é conferida no cliente (`limites.ts:32`); `importarExtrato.action.ts:41` lê `arrayBuffer()` antes de checar o tamanho (o `bodySizeLimit` de 4 MB já limita).
- **Duplicação:** sem achados. A frase "limite é 2 MB" escrita à mão em 3 lugares (fora do alvo).

### `mes.ts`
- **Acoplamento:** saudável (folha pura, sem imports, 19 importadores no sentido certo).
- **Tipagem — Média — conferido pelos workers:** `formatoDeMesValido` (`mes.ts:100-102`) usa `/^\d{4}-\d{2}$/` e aceita `2026-13`, `2026-00`, `0000-99`; o comentário assume isso porque espelha o `check` do schema (`schema.ts:307,474,784`), que também não valida o intervalo. Quem herda: `importarExtrato.service.ts:95`, `removerOMes.service.ts:57`, `removerOMes.action.ts:39`, `declararRenda.action.ts:29` — um POST forjado grava mês 13. Impacto: sujeira nos dados do próprio usuário (sem vazamento entre usuários). Baixas: `mes` é `string` solta; `rotuloDeMes("lixo")` devolve `"undefined / lixo"` (`:37`).
- **Thin/Fat:** nenhum caminho de escrita confia no mês do cliente sem validar (conferido caminho a caminho); `dashboard` usa allowlist contra os meses da conta (`painelDoMes.service.ts:115`).
- **Duplicação:** `mesesDisponiveis` (`SeletorDeMes.tsx:27-40`) refaz `YYYY-MM` à mão (`:35`); `upload/page.tsx:8` importa essa função de um `.tsx` de componente — exatamente o que o comentário de `mes.ts:4-12` diz já ter sido tirado dali. `(app)/layout.tsx:24-31` usa `Intl.DateTimeFormat` com o fuso do processo, contra a regra UTC do `mes.ts:14,107`.

### `emCentavos.ts`
- **Acoplamento:** limpo, puro, um único importador (`CampoDeRenda.tsx`).
- **Tipagem:** sem `any`/cast; 20 testes. Achados: sem `Number.isSafeInteger` na saída (`:44`; `"9"×400` vira `Infinity`); o `replace` do `R$` (`:22`, flags `i`+`g`) remove "R", "r" e "$" em qualquer posição (`"1r2"` → 12); `"0,005"` vira R$ 5,00 (`agrupamentoPlausivel` aceita grupo inicial "0" seguido de 3 dígitos); `paraOCampo` não valida negativo/não inteiro.
- **Thin/Fat:** limpo — `declararRenda.action.ts:33,44` revalida (inteiro, `>= 0`, teto de R$ 10 mi) e o banco tem `check`. Baixa: a action lança `TypeError` se `entrada`/`mes` não forem o esperado (cai no `catch` genérico).
- **Duplicação — Média:** dois parsers "texto → centavos" com regras diferentes (`emCentavos` adivinha pelo último separador; `lancamentos.ts:paraCentavos` exige convenção declarada e tem `isSafeInteger`). A divergência é escolha de UX documentada, mas uma correção feita num não chega ao outro. `paraOCampo` tem o mesmo nome em `definir-meta/percentual.ts:85`.

### `ListaDeCategorias.tsx`
- **Acoplamento — Média:** o filtro de busca (`comparavel` + `useMemo`, `:19-20,87-96`) é lógica pura presa ao `.tsx`; `agruparPorPote` (já em `categorias.ts`, 3 consumidores) e o filtro não têm `categorias.test.ts`. Baixa: `painel/trocar-categoria` e `gerir-regras` importam desta pasta (arquivos compartilhados deveriam ficar no pai `classificacao/`).
- **Tipagem:** limpo (sem `any`/cast, chaves estáveis). Baixa: regex com caracteres combinantes **literais invisíveis** (`:20`).
- **Thin/Fat:** limpo — o servidor revalida a categoria (`decidirLancamento.service.ts:131-142`, `mexerNaRegra.service.ts:69-72`).
- **Duplicação — Média:** a divergência real do "select de potes" está em `CartaoDaRegra.tsx:125`, que fixa `agruparPorPote(categorias, "saida")` ("não há lançamento para dar a direção"): regra de entrada abre com a renda no fim da lista, ao contrário da revisão. Seletores planos de pote em `FormularioDeCategoria.tsx:140-151` e `CartaoDaCategoria.tsx:179-191` repetem as classes do `<select>`.

### `validar.ts`
- **Acoplamento:** limpo e bem separado (puro, sem imports; cliente e servidor usam a mesma função). Baixa: `nomear-categoria` ↔ `gerir-categorias` dependem um do outro (`import type`).
- **Tipagem — Média:** o tipo `string` some em runtime (`entrada.nome.trim()`, `:37-38`); `criarEClassificar.action.ts:24` e `gerirCategorias.action.ts:89` só validam ids. `nome`/`emoji` ausente lança `TypeError`, vira "Não conseguimos criar" e o log registra erro falso. Baixas: sem normalização NFC nem remoção de largura zero; limite de 40 usa `.length` (UTF-16).
- **Thin/Fat:** limpo — os 5 caminhos de escrita em `categories` foram mapeados; os 3 que gravam nome/emoji passam por `validarCategoria` no servidor.
- **Duplicação — Média (lógica):** `validar.ts:59` aceita qualquer `\p{L}\p{N}`; `slugificar` (`slug.ts:37`) só mantém `[a-z0-9]`. "日本" ou "Ж" passa e gera slug `""` → fallback `categoria` + sufixo. Não colide, mas o comentário "a mesma regra vista de dois lados" (`validar.ts:52-58`) é inexato. `"nome" | "emoji"` repetido em 3 serviços.

## Resumo e prioridade de ação

1. **`formatoDeMesValido` aceita mês fora de 01–12 e o servidor grava (4 caminhos) — Média.** Correção de uma regex + teste; o `check` do schema exige migration (fica para decisão).
2. **`comoPalpite` (`ensinarFormato.action.ts:208-221`) não valida o separador** e o repassa a `paraGrade` — Média. Um separador vazio vira uma célula por caractere. O resto da cadeia já valida via `SEPARADORES_VALIDOS`.
3. **Tipos que divergem em silêncio: `Papel`/`PAPEIS`, `Origem` (6+ cópias), `Direcao` em `schema`/`painelDoMes`, `"nome" | "emoji"`** — Média. `PAPEIS as const` é pequeno; `Origem` toca `schema.ts` (decisão).
4. **`emCentavos` sem `isSafeInteger`, `R$` removido em qualquer posição e `"0,005"` = R$ 5,00** — Baixa/Média (o servidor barra o pior caso).
5. **Lógica pura sem teste dentro de `.tsx`:** escala das barras (`SecaoDoComparativo`), filtro de busca (`ListaDeCategorias`), `frasePegaJunto`, `mesesDisponiveis` em componente.
6. **`validarCategoria` não confere o tipo em runtime** e o comentário contradiz o comportamento com letras não latinas — Média/Baixa.
7. **Resultado positivo:** Thin Client / Fat Server conforme nos 10 arquivos (nenhum segredo, nenhuma validação que sozinha garanta segurança no front; `userId` sempre da sessão). `PerguntaDeRegra` é o melhor exemplo de contrato server-first desta rodada, e a chamada à action nele **já está tratada** (resolve parte do item 3 da rodada 27).

## Resolvido nesta rodada (delegado a modelos Haiku, conferido pelo orquestrador)

Verificação final: `tsc --noEmit` sem erros, `eslint src` sem avisos, `vitest run` **852 testes passando** (linha de base antes das correções: 802). Nada foi commitado.

- **Mês fora de 01–12 (prioridade 1).** `formatoDeMesValido` agora usa `/^\d{4}-(0[1-9]|1[0-2])$/` (`src/lib/mes.ts`), com testes para `2026-13`, `2026-00`, `0000-99`. Nenhum outro teste dependia de mês inválido. Novos helpers `mesDeData` (usado por `mesAtual` e por `SeletorDeMes.tsx`) e `abreviacaoDoMes` (usado em `CartoesDoAno.tsx` e `SecaoDoComparativo.tsx`).
- **Separador do formato do usuário (prioridade 2).** `comoPalpite` (`ensinarFormato.action.ts`) agora recusa separador fora de `SEPARADORES_VALIDOS`. A constante foi para `dialetos.ts`; `formatoDoUsuario.ts` não importa mais nenhum valor de `palpite.ts`, então o leitor de CSV sai do bundle do cliente (a cadeia vem da leitura dos imports; **não medi com `next build`**).
- **`Papel` como fonte única.** `PAPEIS as const` e `ehPapel()` em `formatos.ts`; a cópia em `formatoDoUsuario.ts` e os casts `as Papel` (`formatoDoUsuario.ts`, `reconhecer.ts`) saíram.
- **`emCentavos`.** `Number.isSafeInteger` na saída; o prefixo `R$` só é removido no começo (`"1r2"` e `"12R$34"` agora dão `null`); `"0,005"` deixou de virar R$ 5,00; `paraOCampo` recusa negativo/não inteiro. Mais ~15 testes. `declararRenda.action.ts` devolve o erro de mês inválido em vez de lançar `TypeError` quando `entrada.mes` não é string.
- **`validarCategoria`.** `nome`/`emoji` não-string viram vazio e caem nas mensagens normais (a ordem "nome antes de emoji" foi mantida; o worker desviou de "early return" justamente por isso). Comentário sobre letras não latinas corrigido (a regra **não** mudou). `CampoInvalido` exportado e usado em `mexerNaCategoria.service.ts` e `criarEClassificar.service.ts`.
- **`ListaDeCategorias`.** Filtro de busca movido para `categorias.ts` (`comparavel`, `filtrarCategorias`) com o primeiro `categorias.test.ts` da pasta (agrupar por pote nas duas direções, busca com acento, por nome do pote, vazia). Novo `src/lib/semAcento.ts` (+ teste), já usado por `ListaDeCategorias`, `formatos.ts` e `preparar.ts`; `slug.ts` ficou de fora de propósito (usa `\p{M}`, com justificativa no comentário).
- **`SecaoDoComparativo`.** Escala das barras extraída para `escalaDasBarras.ts` (+ teste: teto zero, clamp em 100, série de um ano e de dois anos).
- **`foraDaConta.ts`.** Sem `outro!`; desempate por `id` nos comparadores; teste com datas iguais nas duas ordens de entrada. `painelDoMes.service.ts` usa `Direcao`.
- **`AbasDoPainel.tsx`.** `instanceof HTMLElement` no lugar do cast; `TelaDasAbas`; docblock da aba do comparativo corrigido (as regras da aba e da chamada são diferentes); novo `hrefs.ts` (`hrefDoMes`, `hrefDoComparativo`, + teste) usado nos 3 arquivos que montavam a URL à mão.
- **`decidirLancamento.action.ts`.** `fonteDaSugestao?: FonteDeSugestao` (o `find` em runtime continua como defesa).
- **`references/architecture.md`.** A frase "único `"use client"`" foi reescrita como regra (client só com hook de verdade).

**Dois deslizes dos workers, já corrigidos:** (1) `semAcento.ts` foi gravado com os caracteres combinantes **literais** invisíveis, apesar de o worker relatar escape, o que reintroduzia o problema que o arquivo existe para eliminar; reescrevi com o escape de faixa U+0300–U+036F e conferi os bytes (`slug.ts` ainda tem o literal, mas só dentro de um comentário). (2) Cinco arquivos saíram do Prettier e foram reformatados (`formatos.ts`, `preparar.ts`, `SecaoDoComparativo.tsx`, `emCentavos.ts`, `escalaDasBarras.ts`). `decidirLancamento.action.ts` já estava fora do Prettier no `HEAD` e não foi mexido.

## Pendentes para você decidir (não apliquei de propósito)

1. **`check` do banco aceita `2026-13`** (`schema.ts:307,474,784`). A aplicação agora barra, mas apertar o `check` exige migration e passa por dados já gravados. Decisão: migrar ou deixar só na aplicação.
2. **`Origem` repetida em 6+ lugares** (`schema.ts:249,372,833`, `formatosDoUsuario.service.ts:20`, `exibirEnvio.ts:31`, `oQueSaiDoMes.ts:39`) e checks SQL; **`Direcao`** e **`Dialeto`** moram em `upload/ler-arquivo` e o `schema.ts` os importa (db → feature, já são 4 imports). Proposta: `src/lib/origem.ts` (+ `ORIGENS`) e `direcao.ts`; mexe no `schema.ts` e nos 8 importadores de `Direcao`.
3. **`Botao` local de `PerguntaDeRegra.tsx:233-261` → `Button`.** Remove o bug de hover no botão desabilitado e traz spinner, mas **muda o visual** (padding, spinner) e precisa de olho na tela. O cartão vermelho dali usa `/25` onde as outras cópias usam `/20`.
4. **`CartaoDaRegra.tsx:125` fixa `agruparPorPote(categorias, "saida")`.** Regra de entrada abre com a renda no fim da lista. Falta saber se a regra carrega direção (não verifiquei o tipo); pode exigir campo novo.
5. **`(app)/layout.tsx:24-31` usa `Intl.DateTimeFormat`** com o fuso do processo, contra a regra UTC do `mes.ts`. Trocar por `rotuloDeMes(mesAtual())` muda o texto de "Junho de 2026" para "Junho / 2026" — decisão de produto.
6. **`validar.ts` e o que é gravado:** NFC e remoção de largura zero mudam o que vai para o banco; e nomes só com letras não latinas ("日本") passam e geram slug `categoria-N`. Decidir se aceita (hoje) ou restringe.
7. **Aba do comparativo × `ChamadaDoComparativo`:** a aba usa `meses.length < 2` e a chamada usa `media.pode`. Só corrigi o comentário; se a divergência é intencional ou deve virar um predicado único, é com você.
8. **Dois parsers texto → centavos** (`emCentavos` adivinha o separador; `paraCentavos` exige a convenção declarada). A divergência é UX documentada; fundir exigiria `src/lib/dinheiro.ts` e uma política de entrada.
9. **Cartão de aviso feito à mão em ~16 lugares** (`tom` no `Card` ou componente `Aviso`) — segue aberto da rodada 27/28.
10. **Predicado nomeado para "par anulado / passagem"** (`eParAnulado`/`ePassagem`), hoje inline em 4 arquivos; e mover `ListaDeCategorias` + `categorias.ts` para o pai `classificacao/`, já que `painel/trocar-categoria` e `gerir-regras` os importam.
11. **Sem teste automático** para a validação do separador em `ensinarFormato.action.ts` (`comoPalpite` nem é exportada; testar exige mock de `next/cache` e `garantirUsuario`).
12. **Baixas não aplicadas:** `valorCentavos` em `LadoDoPar` (`foraDaConta.ts`); `FORMATOS`/`obrigatorias` como `readonly`; `Dialeto.separador` como união de literais (hoje `string` + `readonly string[]`); `decodificar` aceita binário (rejeitar `\0` no chamador); limite próprio de linhas em `paraGrade`; extensão `.csv` e tamanho conferidos no servidor **antes** do `arrayBuffer()` (`importarExtrato.action.ts:36-41`); `frasePegaJunto` e `ConflitoDeRegra` como módulo/tipo; classes da "pílula" (3× em `AbasDoPainel` + `SeletorDeAno`); constantes `COLUNA_ROTULO`/`COLUNA_VALOR` (`SecaoDoComparativo`); renomear `paraOCampo` de `emCentavos` (colide de nome com `percentual.ts:85`); contar o limite de 40 de `validar.ts` com `Intl.Segmenter`; helper `capitalizar` interno de `mes.ts`; `rotuloDeMes("lixo")` devolve `"undefined / lixo"`.

## Pendentes herdados das rodadas 27 e 28 (continuam abertos, salvo a nota)

Rodada 28 (`FormularioDeEnvio.tsx`): `podeEnsinar` decide pelo texto da mensagem de erro (regex `/reconheci|faltar/i` falha com "faltou" e dá falso positivo com arquivo `faltar.csv`) — **o único bug visível daquela rodada**; o contrato `ResultadoImportacao` precisa de `motivo` e `campo` (e `importarExtrato.types.ts`); `garantirUsuario()` e `arrayBuffer()` antes do `try` da action, sem `error.tsx`; `erros`/`escolhidos` paralelos; `ROTULO` duplicado. O relatório completo da rodada 28 está em `C:\Users\davil\AppData\Local\Temp\REVISAO_rodada28_backup.md`.

Rodada 27 (**nota da rodada 29:** no item 3, `PerguntaDeRegra.tsx` já trata a falha da action com `try/catch` → `FALHA_DE_CONEXAO`):

1. Entrada das Server Actions sem validação em runtime em ~6 actions (`mexerNaRegra`, `definirMeta`, `removerOMes`, `criarEClassificar`, `trazerDeVolta`, `gerirCategorias`); um guard compartilhado em `src/lib` corrige todas.
2. `decidirNaTransacao` sem filtro de status (`decidirLancamento.service.ts:208-244`, conferido).
3. Chamadas a actions no cliente sem tratamento de falha (`PainelDeMapeamento.tsx`, conferido; `AcaoDeDecidir`, `AcaoDeVoltar`, `PerguntaDeRegra`, `RemoverOMes` segundo os workers).
4. ~~Limite de corpo das Server Actions~~ — tratado em `next.config.ts` (não commitado); resta o caso residual acima.
5. `removerOMes`: mês inexistente volta `ok:true` (3 workers, não reconferido).
6. Motor de classificação: `criterio` sem validação e `Decisao` não discriminada.
7. Duplicações que divergem em silêncio (valor alto, separadores, select de potes, união de status, `obrigatorias`).
8. Precisão do dinheiro na prévia (`Number(...)*100` sem `isSafeInteger`).
9. Bundle do cliente: `VoltarAoPadrao` puxa a semente inteira (não conferido).
10. Lógica pura dentro de `.tsx`/service sem teste.
11. Defesa em profundidade: `innerJoin` sem `userId` no `on`; `percentual_meta` sem `check`.
