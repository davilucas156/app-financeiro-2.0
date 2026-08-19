import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { EnvioExibido } from "@/features/upload/enviar-extrato/exibirEnvio";
import { LinhaDeEnvio } from "@/features/upload/enviar-extrato/LinhaDeEnvio";

/**
 * Histórico de envios (tarefas B3, D4 e D5).
 *
 * Continua **no servidor**: não consulta, não guarda estado, só distribui as
 * linhas que a rota buscou. O único pedaço de cliente é a `LinhaDeEnvio`, que
 * precisa lembrar se está pedindo confirmação.
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
          {envios.map((envio) => (
            <LinhaDeEnvio key={envio.id} envio={envio} />
          ))}
        </ul>
      )}
    </section>
  );
}
