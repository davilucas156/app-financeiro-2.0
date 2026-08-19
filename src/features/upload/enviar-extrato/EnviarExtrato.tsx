import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  CampoDeArquivo,
  type EstadoDoCampo,
} from "@/features/upload/enviar-extrato/CampoDeArquivo";
import {
  MesesImportados,
  ConfirmarDesfazer,
  type EnvioExibido,
} from "@/features/upload/enviar-extrato/MesesImportados";
import {
  ResumoDaImportacao,
  type DadosDoResumo,
} from "@/features/upload/enviar-extrato/ResumoDaImportacao";
import { SeletorDeMes } from "@/features/upload/enviar-extrato/SeletorDeMes";

/**
 * Tela de enviar extrato — **protótipo visual** (tarefas B1, B2 e B3).
 *
 * Não envia, não lê arquivo, não toca no banco. O estado vem por prop, e a
 * rota o escolhe por query string. Esse andaime some na D3.
 *
 * Nenhum arquivo é lido no cliente, nem agora nem depois: o parsing é do
 * servidor (`references/architecture.md`, Thin Client / Fat Server). O
 * `<input type="file">` só existe para o seletor do sistema abrir.
 */
export type EstadoDaTela =
  | "vazio"
  | "escolhido"
  | "enviando"
  | "erro-de-arquivo"
  | "sucesso"
  | "ja-importado"
  | "confirmando-desfazer";

export function EnviarExtrato({
  estado = "vazio",
  mes,
  meses,
  resumo,
  envios,
}: {
  estado?: EstadoDaTela;
  mes: string;
  meses: string[];
  resumo: DadosDoResumo;
  envios: EnvioExibido[];
}) {
  const enviando = estado === "enviando";
  const temArquivos = estado !== "vazio";
  const mostrarResumo = estado === "sucesso";

  const estadoDoCampo: EstadoDoCampo = enviando
    ? "enviando"
    : temArquivos
      ? "escolhido"
      : "vazio";

  return (
    <>
      <SectionTitle>Enviar extrato</SectionTitle>

      <Card>
        <SeletorDeMes valor={mes} opcoes={meses} desabilitado={enviando} />

        <div className="mt-5 space-y-3">
          <CampoDeArquivo
            rotulo="Extrato da conta"
            descricao="CSV do Inter, com Data Lançamento, Descrição, Valor e Saldo."
            estado={estado === "erro-de-arquivo" ? "erro" : estadoDoCampo}
            arquivo={{ nome: "Extrato-02-06-2026-a-02-07-2026-CSV.csv", tamanho: "1,7 KB" }}
            erro={
              estado === "erro-de-arquivo"
                ? 'O arquivo parece "Fatura do cartão do Inter", mas faltou a coluna Valor.'
                : undefined
            }
          />

          <CampoDeArquivo
            rotulo="Fatura do cartão"
            descricao="CSV da fatura. Dá para enviar só a conta e mandar o cartão depois."
            opcional
            estado={estadoDoCampo}
            arquivo={{ nome: "fatura-inter-2026-07.csv", tamanho: "3,1 KB" }}
          />
        </div>

        <Button
          type="submit"
          loading={enviando}
          disabled={!temArquivos}
          className="mt-5 w-full"
        >
          {enviando ? "Lendo o extrato…" : "Importar"}
        </Button>

        <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-dim2">
          O arquivo é lido no servidor. Nada é enviado para fora daqui.
        </p>
      </Card>

      {estado === "ja-importado" && (
        <Card role="alert" className="mt-3 border-blue/20 bg-blue/8">
          <p className="text-xs font-bold text-blue">
            Esse arquivo já tinha sido importado.
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            Reconheci pelo conteúdo, não pelo nome — então renomear não engana.
            Nada foi duplicado. Se quiser reimportar, desfaça o envio anterior
            primeiro.
          </p>
        </Card>
      )}

      {mostrarResumo && <ResumoDaImportacao dados={resumo} />}

      <MesesImportados envios={envios} />

      {estado === "confirmando-desfazer" && envios[0] && (
        <ConfirmarDesfazer envio={envios[0]} />
      )}

      <p className="mt-8 text-center font-mono text-[10px] text-dim2">
        Protótipo visual · o envio de verdade entra na fase D
      </p>
    </>
  );
}
