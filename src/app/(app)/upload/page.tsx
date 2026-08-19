import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FormularioDeEnvio } from "@/features/upload/enviar-extrato/FormularioDeEnvio";
import {
  MesesImportados,
  type EnvioExibido,
} from "@/features/upload/enviar-extrato/MesesImportados";
import { mesesDisponiveis } from "@/features/upload/enviar-extrato/SeletorDeMes";

export const metadata: Metadata = {
  title: "Enviar extrato · Painel Financeiro 6 Potes",
};

/**
 * Ainda falso — a D4 troca por uma consulta ao banco, filtrada pelo `user_id`
 * da sessão. Fica aqui para a tela não perder o pedaço enquanto isso.
 */
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
];

/**
 * A rota só compõe.
 *
 * O `?estado=` da fase B saiu: os estados agora acontecem de verdade, vindos
 * da server action.
 */
export default function UploadPage() {
  const meses = mesesDisponiveis();

  return (
    <>
      <SectionTitle>Enviar extrato</SectionTitle>

      <FormularioDeEnvio mes={meses[0]} meses={meses} />

      <MesesImportados envios={ENVIOS} />
    </>
  );
}
