import { Button } from "@/components/ui/Button";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { EnvioExibido } from "@/features/upload/enviar-extrato/exibirEnvio";
import { rotuloDeMes } from "@/features/upload/enviar-extrato/SeletorDeMes";

/**
 * Histórico de envios e o desfazer (tarefas B3 e D4).
 *
 * Os envios agora vêm do banco. O **desfazer continua desligado** — é a D5
 * que liga o botão.
 *
 * O componente segue burro: não consulta nada, recebe pronto. Quem busca é a
 * rota, com o `user_id` da sessão.
 */

export function MesesImportados({ envios }: { envios: EnvioExibido[] }) {
  return (
    <section aria-labelledby="meses-importados">
      <SectionTitle>
        <span id="meses-importados">Já importados</span>
      </SectionTitle>

      {envios.length === 0 ? (
        <EstadoVazio
          emoji="🗂"
          titulo="Nada importado ainda"
          descricao="Quando você enviar o primeiro extrato, ele aparece aqui — e dá para desfazer se algo sair errado."
        />
      ) : (
        <ul className="space-y-2">
          {envios.map((e) => (
            <li
              key={e.id}
              className="rounded-card border border-border bg-card px-4 py-3.5"
            >
              {/* Empilha no celular: mês, arquivo e botão lado a lado em 360px
                  espremeriam o nome do arquivo até sumir. */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-bold">{rotuloDeMes(e.mes)}</span>
                <span className="font-mono text-[9px] tracking-[1px] text-dim2 uppercase">
                  {e.rotuloDeOrigem}
                </span>
              </div>

              <p className="mt-1 truncate font-mono text-[10px] text-dim2">
                {e.nomeArquivo}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-dim">
                  {e.lancamentos} lançamentos · {e.enviadoEm}
                </span>

                {/*
                  A confirmação diz **o que** vai sumir, com número e mês. Um
                  "tem certeza?" genérico não dá ao usuário a informação de que
                  ele precisa para ter certeza.
                */}
                <Button
                  variant="secondary"
                  className="shrink-0 px-3.5 text-xs"
                  aria-label={`Desfazer a importação de ${rotuloDeMes(e.mes)}, ${e.lancamentos} lançamentos`}
                >
                  Desfazer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * O aviso de confirmação, renderizado inline no protótipo para o Davi ver o
 * texto. Na D5 vira diálogo de verdade.
 */
export function ConfirmarDesfazer({ envio }: { envio: EnvioExibido }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-card border border-red/20 bg-red/8 p-4"
    >
      <p className="text-xs font-bold text-red">
        Apagar {envio.lancamentos} lançamentos de {rotuloDeMes(envio.mes)}?
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">
        Vieram de {envio.nomeArquivo}, enviado em {envio.enviadoEm}. Só estes
        somem — o que veio de outros arquivos fica. Dá para enviar o mesmo
        arquivo de novo depois.
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="text-xs">
          Cancelar
        </Button>
        <Button className="bg-red text-bg enabled:hover:bg-red/80 text-xs">
          Apagar
        </Button>
      </div>
    </div>
  );
}
