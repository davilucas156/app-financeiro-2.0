import type { Metadata } from "next";
import {
  EnviarExtrato,
  type EstadoDaTela,
} from "@/features/upload/enviar-extrato/EnviarExtrato";
import {
  mesesDisponiveis,
} from "@/features/upload/enviar-extrato/SeletorDeMes";
import type { DadosDoResumo } from "@/features/upload/enviar-extrato/ResumoDaImportacao";
import type { EnvioExibido } from "@/features/upload/enviar-extrato/MesesImportados";

export const metadata: Metadata = {
  title: "Enviar extrato · Painel Financeiro 6 Potes",
};

const ESTADOS: EstadoDaTela[] = [
  "vazio",
  "escolhido",
  "enviando",
  "erro-de-arquivo",
  "sucesso",
  "ja-importado",
  "confirmando-desfazer",
];

/**
 * Números **medidos** nos arquivos reais do Davi, não inventados: 21
 * lançamentos no extrato, 33 na fatura, 3 pagamentos de fatura fora do cálculo
 * e 2 pares que se anulam (4 lançamentos).
 *
 * Revisão visual em maquete otimista de duas linhas não vale nada — o que
 * precisa ser julgado é como a tela se comporta na densidade verdadeira.
 *
 * As duas linhas ignoradas **são inventadas**: os arquivos reais não têm
 * nenhuma. Existem aqui só para o Davi ver esse pedaço da tela.
 */
const RESUMO: DadosDoResumo = {
  arquivos: [
    {
      rotulo: "Extrato da conta",
      entraram: 21,
      ignoradas: [],
    },
    {
      rotulo: "Fatura do cartão",
      entraram: 33,
      ignoradas: [
        {
          linha: 12,
          motivo: 'data não reconhecida: "31/02/2026"',
          conteudo: '"31/02/2026","LOJA EXEMPLO   BETIM  BRA","OUTROS","Compra à vista","R$ 42,00"',
        },
        {
          linha: 27,
          motivo: "descrição vazia",
          conteudo: '"03/06/2026","","OUTROS","Compra à vista","R$ 9,90"',
        },
      ],
    },
  ],
  excluidos: 3,
  revisao: 4,
};

const ENVIOS: EnvioExibido[] = [
  {
    id: "1",
    mes: "2026-06",
    rotuloDeOrigem: "conta",
    nomeArquivo: "Extrato-02-06-2026-a-02-07-2026-CSV.csv",
    lancamentos: 21,
    enviadoEm: "18/08 às 21h",
  },
  {
    id: "2",
    mes: "2026-06",
    rotuloDeOrigem: "cartão",
    nomeArquivo: "fatura-inter-2026-07.csv",
    lancamentos: 33,
    enviadoEm: "18/08 às 21h",
  },
  {
    id: "3",
    mes: "2026-05",
    rotuloDeOrigem: "conta",
    nomeArquivo: "Extrato-02-05-2026-a-02-06-2026-CSV.csv",
    lancamentos: 18,
    enviadoEm: "12/07 às 09h",
  },
];

/**
 * A rota só compõe.
 *
 * `?estado=` é andaime de revisão visual, como o `?estado=` da B3 na spec 01.
 * A D3 o substitui pelo estado real da server action.
 *
 * `?vazio=1` mostra o histórico sem nenhum envio — o estado que só existe uma
 * vez na vida da conta e por isso é o mais fácil de esquecer.
 */
export default async function UploadPage({
  searchParams,
}: PageProps<"/upload">) {
  const { estado, vazio } = await searchParams;
  const escolhido = ESTADOS.find((e) => e === estado) ?? "vazio";

  const meses = mesesDisponiveis();

  return (
    <EnviarExtrato
      estado={escolhido}
      mes={meses[0]}
      meses={meses}
      resumo={RESUMO}
      envios={vazio ? [] : ENVIOS}
    />
  );
}
