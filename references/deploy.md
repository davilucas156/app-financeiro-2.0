# Deploy

Como este projeto vai para produção, e o que um agente de IA precisa saber antes
de dizer que subiu.

Escrito depois de um deploy que **não aconteceu** e foi dado por feito — ver
"O caso de 02/10/2026", no fim.

---

## 1. O mecanismo: push na `main`, e nada mais

O deploy é a integração Git da Vercel. O `readme.md` já dizia, na linha 196:

> Deploy contínuo via Vercel (push no GitHub → deploy automático)

Então o comando de deploy é:

```
git push origin main
```

**Não há nenhum outro caminho em uso neste repositório.** Varrendo os
transcritos de todas as sessões, o único comando relacionado a publicação que
já foi rodado daqui é esse `git push`. A CLI da Vercel nunca foi usada.

| | estado nesta máquina |
| --- | --- |
| CLI da Vercel (`vercel`) | **não instalada** |
| Credencial da CLI (`com.vercel.cli/auth.json`) | **não existe** |
| `VERCEL_TOKEN` | **não existe** no `.env.local` |
| `VERCEL_OIDC_TOKEN` | existe, mas é de **runtime** — não serve para deploy |
| MCP `plugin:vercel:vercel` | instalado, **não autorizado** (OAuth) |

O `.vercel/project.json` identifica o projeto (`app-financeiro`,
`prj_KIV1b2SZcKDnWxUp3GU8ss8giRdQ`), e é só isso: um link, não uma credencial.

### ⚠ Um agente não tem como publicar fora do push

Com o quadro acima, um agente consegue **commitar e empurrar** — e nada além
disso. Em particular ele **não deve**:

- instalar a CLI (`npm i -g vercel`) por conta própria;
- rodar `vercel login`, que é interativo e termina num navegador;
- pedir token, código de autorização ou URL de callback ao usuário.

O que ele deve fazer é dizer que não consegue e oferecer os dois caminhos que
funcionam:

```
npx vercel login       # uma vez, pelo usuário
npx vercel --prod
```

…ou o painel: projeto → Deployments → o deploy do commit → **Redeploy** /
**Promote to Production**.

Se o usuário autorizar o MCP da Vercel numa sessão interativa (`/mcp`), o agente
passa a conseguir publicar e inspecionar deploys daqui. Até lá, não.

### ⚠ "Not authorized" na CLI quase nunca é permissão: é conta ou escopo errado

Aconteceu em 04/10/2026, e a mensagem engana — ela sugere pedir acesso a um
dono de time, quando o problema era estar logado na conta errada. A CLI guarda
credencial e escopo em arquivos separados, e os dois erram de formas
diferentes:

```
%APPDATA%/com.vercel.cli/Data/auth.json     # token — NUNCA imprimir o valor
%APPDATA%/com.vercel.cli/Data/config.json   # "currentTeam"
```

A sequência que diagnostica, em ordem, e sem escrever nada:

```
npx --yes vercel whoami                            # quem está logado
npx --yes vercel teams ls                           # times que a conta alcança
npx --yes vercel project ls --scope <slug-do-time>  # o projeto está nesse time?
cat .vercel/project.json                            # para qual orgId o repo aponta
```

Como ler o resultado:

- **`whoami` dá `forbidden` mas `teams ls` funciona** → o `currentTeam` do
  `config.json` está velho e aponta para um time inacessível. O `teams ls` passa
  porque é o único que não usa o escopo. Conserta com `vercel switch <time>`.
- **`project ls` lista projetos, e o seu não está lá** → a conta logada não é a
  dona. Foi este o caso: logado como uma conta cujo único escopo tinha três
  outros projetos, enquanto o `orgId` do `.vercel/project.json` apontava para um
  time que, dessa conta, respondia `The specified scope does not exist`.
- **O site está no ar servindo build antigo** → o projeto existe e funciona; o
  que falta é acesso, não deploy. Não conclua que o projeto foi apagado.

O conserto é `vercel logout` e `vercel login` com a conta certa — ou
`vercel link`, se o projeto estiver na conta atual com outro nome.

⚠ **Nada disso um agente faz sozinho.** `logout` descarta credencial do usuário e
`login` abre navegador. O agente diagnostica, nomeia a causa e entrega os
comandos; quem troca de conta é a pessoa.

⚠ **E o `auth.json` não se lê.** Conferir que o arquivo **existe** e quais
**chaves** ele tem é diagnóstico; imprimir o `token` ou o `refreshToken` é
vazar credencial num transcrito. Mesma regra para o `VERCEL_OIDC_TOKEN` do
`.env.local` — uma tentativa de decodificar as claims dele nesta sessão foi
barrada pelo classificador, e corretamente.

---

## 2. Antes do push: o que tem de estar verde

Os quatro primeiros são rápidos; o `build` é o que pega o que os outros não
pegam, e é exatamente o que a Vercel vai rodar.

```
npx prettier --check "src/**/*.{ts,tsx}" "scripts/*.mjs"
npx eslint src/
npx tsc --noEmit
npx vitest run
npm run build
```

Nenhum deles é opcional, e por motivos diferentes:

- **`tsc`** pega o que o Vitest não pega. Erro só de tipo passa pelos testes:
  import de tipo que não existe, assinatura mudada num chamador não testado.
- **`eslint`** já barrou commit por `react/no-unescaped-entities` em texto de
  JSX — coisa que não quebra teste nenhum e quebra o build da Vercel.
- **`build`** é o único que exercita o `import "server-only"`. Um componente de
  cliente importando um `.service.ts` só falha aqui.

### Commits separados, e cada um verde sozinho

A convenção deste repositório: um commit por mudança de comportamento, mensagem
**em português sem acento**, verbo primeiro, uma linha, depois linha em branco e
a atribuição. Exemplos reais:

```
Arquiva a compra do cartao no mes em que ela foi feita
Para de somar os dois lados de um repasse que se anula
Tira a moldura dobrada de volta do widget de entrar
```

⚠ **Separar só até onde cada commit compila.** Duas mudanças que tocam a mesma
função não viram dois commits: o primeiro deles não existiria em estado válido,
e um `git bisect` pararia nele sem poder rodar. Quando isso acontece, junte e
**diga ao usuário por que** são dois commits e não três — não invente um terceiro
que nunca passou.

---

## 3. ⚠ Push não é deploy, e "subiu" exige prova

Este é o erro que originou o documento. `git push` termina com sucesso, a Vercel
*em teoria* publica sozinha, e é tentador escrever "subiu para produção". O push
é prova de que o **GitHub** recebeu. Não é prova de que produção mudou.

Entre um e outro podem estar: build que falhou, projeto sem auto-promote no
push, integração Git desconectada, deploy enfileirado.

### Como conferir de fora, sem credencial

O `/entrar` é público — é a única janela para o build no ar sem fazer login.
Escolha um marcador no HTML **renderizado no servidor** que a sua mudança
alterou, e procure por ele:

```
curl -s -D - -o /tmp/entrar.html "https://app-financeiro-plum.vercel.app/entrar" \
  | grep -i "^HTTP/\|age:\|x-vercel-id"

grep -o 'class="[^"]*"' /tmp/entrar.html | sort -u
```

- **`Age: 0`** afasta a dúvida do cache: o que você está lendo é o build vivo.
- Marcador tem de ser **SSR**. O widget do Clerk monta no cliente, então as
  classes de `ELEMENTOS_DO_WIDGET` **não** aparecem no HTML — procurar por elas
  e não achar não prova nada. A moldura em volta dele aparece, e prova.

⚠ **Fora do `/entrar`, tudo é autenticado.** Painel, upload e revisão exigem
sessão do Clerk, e um agente não tem sessão. Se a sua mudança não toca uma rota
pública, **você não consegue verificar o deploy daqui** — diga isso em vez de
presumir, e peça ao usuário para olhar.

---

## 4. Dado e código têm de subir na ordem certa

O risco maior deste projeto não é o deploy falhar: é o deploy e o banco ficarem
em convenções diferentes. O `mes_referencia` é **gravado** na importação, não
calculado na leitura — então o código que grava e os dados já gravados precisam
concordar.

A ordem é sempre:

1. **medir** (o script roda sem escrever e mostra o antes e o depois);
2. **mostrar os números ao usuário** e esperar a palavra dele;
3. **publicar o código**;
4. **recalcular os dados**.

⚠ **3 antes de 4, e nunca 4 sozinho.** Com o banco convertido e produção na
regra antiga, qualquer envio novo grava a convenção velha dentro de dados novos
— as duas réguas misturadas, que é o estado que o recálculo existia para
desfazer. Foi exatamente onde este projeto ficou por dois dias.

O script de referência é
[`scripts/recalcular-mes-de-referencia.mjs`](../scripts/recalcular-mes-de-referencia.mjs):
sem argumento ele só mede, e `--aplicar` é o que grava. Todo script de escrita
em produção deste repositório deve seguir essa forma.

### Escrita em produção é sempre autorizada na hora

Um agente **não roda escrita no banco de produção** por iniciativa própria, nem
quando a mudança foi planejada e aprovada em princípio. Aprovar o desenho não é
aprovar o `update`. A sequência é: medir, mostrar, perguntar, e só então rodar —
e se o usuário pedir, ele mesmo roda.

Leitura em produção é mais branda, mas tem forma: **agregado, nunca linha
crua.** Contagem e soma por mês, origem, direção e status respondem quase toda
pergunta de diagnóstico e não trazem nome de pessoa nem descrição de
lançamento para o transcrito.

---

## 5. O que nunca entra no commit

- **Extrato, fatura e qualquer arquivo de banco.** O `.gitignore` cobre `*.csv`,
  `*.xls(x)`, `*.ofx` e `*.pdf`. Eles têm número de conta, nome de gente e o
  gasto do mês inteiro — repositório não é lugar para isso, nem sendo privado.
- **`.env.local`.** Quando precisar falar das variáveis, liste **só os nomes**
  (`grep -o '^[A-Za-z0-9_]*' .env.local`), nunca os valores.
- **Script temporário de diagnóstico.** Se precisar rodar um `.mjs` de uma vez
  só, ele vai para o diretório de scratchpad da sessão; se tiver de rodar da
  raiz para achar o `node_modules`, apague no mesmo comando (`node ./tmp.mjs;
  rm -f ./tmp.mjs`). O que merece ficar vai para `scripts/` com docblock, como o
  do recálculo.
- **O bloco do `AGENTS.md`/`CLAUDE.md`** é reescrito pelo `next dev` a cada
  execução. Tirá-lo de um diff só recria a mudança não comitada; se ele apareceu,
  comite junto.

Atribuição, ao fim de cada mensagem de commit:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

## 6. O caso de 02/10/2026

Vale como história porque todos os passos individuais estavam certos.

A regra do mês do cartão foi consertada, 771 testes passaram, `build`, `tsc`,
`eslint` e `prettier` limpos. Dois commits, mensagens na convenção, push
aceito: `efc23e2..cd06c41  main -> main`. Eu escrevi que a Vercel publicaria
sozinha a partir do push, e parei aí.

O usuário então rodou o recálculo e converteu as 321 linhas do banco para a
convenção nova — a decisão dele, com os números na mão.

Dois dias depois ele perguntou se estava no ar. Não estava: o `/entrar` em
produção ainda servia `rounded-card border border-border bg-card p-5 p-6` em
volta do widget do Clerk, que é a moldura que o commit `4eba5b8` apagou. O
GitHub tinha `cd06c41`; produção, não.

Então o estado real era o pior possível: **banco na régua nova, código no ar na
régua velha.** Um envio de extrato naquela janela teria misturado as duas.

Duas lições, e nenhuma é sobre a Vercel:

1. **Dizer "a Vercel publica a partir do push" é descrever uma expectativa como
   se fosse um fato.** Se você não pode verificar, diga que não pode.
2. **A ordem de 4 existe por isso.** O recálculo foi feito antes do deploy
   porque o deploy parecia feito.

**Como terminou:** dois dias depois, o `npx vercel --prod` devolveu
`Not authorized`. A causa era a conta logada na CLI, não permissão — ver o
alerta da seção 1. Trocada a conta, o deploy saiu, e o `/entrar` em produção
perdeu a moldura dobrada: `grep -c` da classe do `<Card>` passou de 1 para 0,
com `Age: 0`. Aí, e só aí, código e banco voltaram a falar a mesma língua.
