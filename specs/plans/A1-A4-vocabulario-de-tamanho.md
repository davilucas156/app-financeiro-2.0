# Plano — A1 a A4: o vocabulário de tamanho

**Etapa:** 3 (Plan) do workflow `dev-workflow-davi`
**Tarefas:** A1, A2, A3 e A4 de `specs/10-tamanho-da-letra.tarefas.md`
**Regra que rege as quatro:** ⚠ **quando esta fase terminar, o app tem de estar
idêntico ao pixel.** Nenhuma configuração existe ainda; o que se entrega aqui é
só o vocabulário para ela poder existir depois.

---

## Arquivos a criar

- `src/features/aparencia/letra/escalaDaLetra.test.ts` — o teste-guarda da A4.
  Varre `src/**/*.tsx` por `text-[Npx]`, ignora N > 14, e falha listando arquivo,
  linha e o token que deveria estar ali.

## Arquivos a modificar

### A1 — `src/app/globals.css`

Dentro do `@theme` que já existe, **depois dos raios** e antes do bloco de tema
claro, uma seção nova:

```css
/* ── Tamanhos de letra (spec 10) ──────────────────────── */
--text-4xs: 9px;
--text-4xs--line-height: normal;
--text-3xs: 10px;
--text-3xs--line-height: normal;
--text-2xs: 11px;
--text-2xs--line-height: normal;

/* Não escala em tamanho nenhum — ver A3. */
--text-fixo: 14px;
--text-fixo--line-height: calc(1.25 / 0.875);
```

⚠ **`@theme` e não `@theme inline`.** O `inline` do topo do arquivo existe porque
`--font-sans` aponta para uma variável que o `next/font` injeta no `<html>` e
precisa ser resolvida no ponto de uso. Aqui é o contrário: o valor **tem** de
ficar numa variável para as fases C poderem redefini-lo sob `[data-letra]`. Com
`inline`, o Tailwind grava `9px` direto na classe e a configuração inteira morre.

⚠ **`line-height: normal` reproduz o hoje.** Medido na descoberta 3:
`text-[10px]` compila só com `font-size`, sem entrelinha, e o preflight do
Tailwind não declara nenhuma em `html`/`body` — aqueles 97 elementos estão em
`normal` neste momento. Inventar uma razão aqui moveria os 97 de uma vez e o
diff da A2 deixaria de ser conferível.

⚠ **`--text-fixo` herda a razão do `--text-sm`** (`calc(1.25 / .875)` = 1,4286),
porque é de `text-sm` que ele sai. Com `normal`, a A3 mudaria a entrelinha das
duas linhas que ela não pode mudar.

### A2 — os 39 `.tsx`, três trocas literais

`text-[11px]`→`text-2xs`, `text-[10px]`→`text-3xs`, `text-[9px]`→`text-4xs`.

| Arquivo (a partir de `src/`)                                       | 9px | 10px | 11px |
| ------------------------------------------------------------------ | --- | ---- | ---- |
| `app/(app)/upload/page.tsx`                                        |     |      | 1    |
| `app/(auth)/layout.tsx`                                            | 1   |      |      |
| `components/ui/Badge.tsx`                                          |     | 1    |      |
| `components/ui/SectionTitle.tsx`                                   | 1   |      |      |
| `features/ajuda/pegar-o-extrato/PassoAPasso.tsx`                   |     | 2    | 1    |
| `features/aparencia/escolher-tema/TelaDeConfiguracoes.tsx`         | 1   | 1    |      |
| `features/autenticacao/cadastrar-usuario/CadastrarUsuario.tsx`     |     |      | 2    |
| `features/categorias/gerir-categorias/CartaoDaCategoria.tsx`       | 1   | 1    | 4    |
| `features/categorias/gerir-categorias/TelaDeCategorias.tsx`        |     | 4    | 1    |
| `features/categorias/nomear-categoria/FormularioDeCategoria.tsx`   | 3   |      | 3    |
| `features/categorias/nomear-categoria/NovaCategoriaNaRevisao.tsx`  |     |      | 1    |
| `features/classificacao/gerir-regras/CartaoDaRegra.tsx`            | 3   |      | 3    |
| `features/classificacao/gerir-regras/TelaDeRegras.tsx`             |     |      | 1    |
| `features/classificacao/revisar-lancamento/AcaoDeDecidir.tsx`      |     |      | 1    |
| `features/classificacao/revisar-lancamento/AcaoDeVoltar.tsx`       |     |      | 1    |
| `features/classificacao/revisar-lancamento/CartaoDoLancamento.tsx` |     | 1    | 1    |
| `features/classificacao/revisar-lancamento/ListaDeCategorias.tsx`  | 2   | 1    |      |
| `features/classificacao/revisar-lancamento/PerguntaDeRegra.tsx`    |     |      | 2    |
| `features/classificacao/revisar-lancamento/ProgressoDaRevisao.tsx` |     | 1    |      |
| `features/classificacao/revisar-lancamento/Sugestoes.tsx`          | 1   |      | 1    |
| `features/classificacao/revisar-lancamento/TelaDeRevisao.tsx`      |     |      | 3    |
| `features/onboarding/concluir-onboarding/ConcluirOnboarding.tsx`   | 1   | 1    | 1    |
| `features/painel/comparar-meses/ChamadaDoComparativo.tsx`          | 1   |      |      |
| `features/painel/comparar-meses/SecaoDoComparativo.tsx`            |     | 7    |      |
| `features/painel/comparar-meses/TelaDoComparativo.tsx`             |     | 1    |      |
| `features/painel/painel-do-mes/CartaoDoPote.tsx`                   | 2   | 4    | 1    |
| `features/painel/painel-do-mes/TelaDoPainel.tsx`                   |     |      | 1    |
| `features/painel/painel-do-mes/TopoDoMes.tsx`                      | 1   |      |      |
| `features/painel/renda-do-mes/CampoDeRenda.tsx`                    | 2   |      | 3    |
| `features/painel/trocar-categoria/TrocarCategoria.tsx`             |     | 2    | 2    |
| `features/painel/veredito-do-mes/FaixaDoVeredito.tsx`              | 1   |      |      |
| `features/shell/CabecalhoApp.tsx`                                  | 1   |      |      |
| `features/shell/NavegacaoPrincipal.tsx`                            |     | 1    |      |
| `features/upload/enviar-extrato/CampoDeArquivo.tsx`                | 2   | 1    |      |
| `features/upload/enviar-extrato/FormularioDeEnvio.tsx`             |     | 1    |      |
| `features/upload/enviar-extrato/LinhaDeEnvio.tsx`                  | 1   | 1    | 2    |
| `features/upload/enviar-extrato/LinhasIgnoradas.tsx`               |     | 2    |      |
| `features/upload/enviar-extrato/ResumoDaImportacao.tsx`            | 1   |      | 1    |
| `features/upload/enviar-extrato/SeletorDeMes.tsx`                  | 1   |      |      |
| **Total**                                                          | 27  | 33   | 37   |

**Como executar:** `sed` nos 39 arquivos, nesta ordem exata — 11, depois 10,
depois 9. A ordem não importa para o resultado (os três padrões são disjuntos),
mas fixá-la torna o comando repetível se algo precisar ser refeito.

⚠ **`text-[7px]`, `text-[22px]` e `text-[28px]` ficam.** O primeiro é o pontinho
`●` do `Badge` (`aria-hidden`, não é letra); os outros dois estão acima da régua
de 14px.

⚠ **A ordem dos utilitários na `className` não muda nada.** O Tailwind resolve
por especificidade da folha, não por posição na string — o `text-3xs` entra no
lugar exato do `text-[10px]`, sem reordenar.

### A3 — `src/features/painel/painel-do-mes/CartaoDoPote.tsx`

Duas linhas, no cabeçalho do cartão:

```
<span className="text-sm font-bold break-words">           → text-fixo
<span className="… font-mono text-sm font-medium …">       → text-fixo
```

⚠ **Só essas duas.** Os `text-3xs` da legenda e do "meta …", os `text-xs` do
insight e das categorias, os `text-2xs`/`text-3xs` dos lançamentos **continuam
escalando** — é o que impede a configuração de parecer quebrada no painel.

⚠ **A A2 já vai ter passado por este arquivo** (2 × 9px, 4 × 10px, 1 × 11px). A3
mexe em `text-sm`, que a A2 não toca. Sem conflito.

**Comentário obrigatório no arquivo**, junto ao cabeçalho — a razão pela qual
aquelas duas letras são diferentes das outras cinco do mesmo componente. Sem
ele, a próxima pessoa uniformiza e a linha volta a quebrar em "Maior".

### A4 — o teste-guarda

```ts
// pseudo, o real vai ter a mensagem inteira
const PROIBIDO = /text-\[(\d+)px\]/g;
const TOKEN_DE = {
  9: "text-4xs",
  10: "text-3xs",
  11: "text-2xs",
  12: "text-xs",
  14: "text-sm",
};
// falha se N <= 14
```

⚠ **A mensagem tem de ensinar a saída.** `text-[10px]` → _"use `text-3xs`; px
cravado não obedece à configuração de tamanho (spec 10)"_. Um teste que só
reprova manda a pessoa procurar uma regra num documento que ela não sabe que
existe.

⚠ **Varre `src/**/*.tsx` com `fs`, sem depender de `glob` externo.** O
`vitest.config.mts` só inclui `src/**/*.test.ts` — este arquivo é `.ts` e roda; o
que ele **lê** são os `.tsx`, e ler arquivo não é o mesmo que importá-lo.

⚠ **Mora em `aparencia/letra/`, e não em `components/`.** É a regra da spec 10
sendo defendida, não um teste de componente. Fica ao lado do módulo que a B1 vai
criar.

## Reuso identificado

| O que                                  | Onde                                   | Para quê                                                              |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| O bloco `@theme` com cores e raios     | `app/globals.css`                      | Os quatro tokens entram nele, não num arquivo novo                    |
| `--text-sm--line-height`               | gerado pelo Tailwind                   | A razão que `--text-fixo` copia                                       |
| O padrão de teste que lê o repositório | `ajuda/pegar-o-extrato/passos.test.ts` | O molde da A4: teste que defende uma regra do projeto, não uma função |

**Nada novo em `components/ui/`.** Esta fase não cria componente; ela renomeia
tamanhos.

## Caminho feliz

1. A1 sobe. `npx next build` gera `.text-4xs{font-size:var(--text-4xs);…}` no CSS
   — conferir no chunk, como fiz para o `text-xs` na descoberta 3.
2. A2 sobe. `git diff --stat` mostra 39 arquivos e **só linhas de `className`**.
3. A3 sobe. Duas linhas a mais no diff.
4. A4 sobe e **passa** — se falhar, é porque a A2 deixou algo para trás.
5. `npx tsc --noEmit`, `npx eslint`, `npx vitest run`, `npx next build`: limpos.
6. **Conferência visual, tamanho Padrão**, nas oito telas: `/dashboard`,
   `/revisao`, `/upload`, `/categorias`, `/regras`, `/comparativo`, `/passos`,
   `/configuracoes`. **Nada pode ter se mexido.**

## Edge cases

- **Token com nome que colide com cor.** `--color-pote-lib` gera `text-pote-lib`
  (cor). `--text-fixo` gera `text-fixo` (tamanho). Não há `--color-fixo` nem
  `--color-2xs`, então não há colisão — mas **conferir no CSS gerado**, porque a
  colisão silenciosa produziria uma classe que muda a coisa errada.
- **`text-[10px]` dentro de string concatenada ou template.** O `sed` pega pelo
  texto, e o Tailwind também: se ele aparece numa `className` montada, a troca
  vale igual. ⚠ Mas se aparecer **partido** entre duas linhas, nem o `sed` nem o
  Tailwind o veem hoje — e a A4 também não. Conferir se `grep` acha algum
  `text-\[$` no fim de linha.
- **Um `.tsx` com `text-[13px]` ou `text-[14px]`** — não existe hoje, mas a A4 os
  proibiria e não haveria token para eles. Se aparecer, é caso de acrescentar
  token, não de afrouxar o teste.
- **A entrelinha `normal` em elemento com `leading-none`/`leading-relaxed`.** O
  Tailwind emite `var(--tw-leading, …)`, e o utilitário de `leading` ganha. Nada
  muda.

## Erros

- **`next build` quebra por variável indefinida:** não quebra — CSS com `var()`
  indefinida é inválido em tempo de cálculo, não em build. Por isso a conferência
  é visual. Se `--text-3xs--line-height` faltasse, a entrelinha viraria herdada,
  que é… exatamente o que já é. **Falha silenciosa e inofensiva neste caso, e é
  sorte, não desenho** — por isso o par é escrito junto.
- **`sed` do Git Bash e o `[`:** os colchetes são metacaracteres de regex. O
  padrão precisa escapá-los (`text-\[10px\]`). Errar isso não substitui nada, e o
  `grep` de conferência da A2 pega na hora.
- **OneDrive segurando arquivo durante o `sed` em massa:** já aconteceu nesta
  máquina com `.next`. Se um arquivo falhar, refazer só ele — os padrões são
  idempotentes.

## Banco de dados

Nenhum. Esta fase não toca Postgres, não lê `user_id` e não passa por
`garantirUsuario()`.
