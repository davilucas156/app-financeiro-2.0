import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { CategoriaEscolhivel } from "@/features/classificacao/revisar-lancamento/categorias";
import { CartaoDaRegra } from "./CartaoDaRegra";
import type { RegraNaTela } from "./regrasNaTela";

/**
 * `/regras` — o raio-X do motor (tarefa D9).
 *
 * Pedido do Davi no portão visual da fase B, e a razão dele continua sendo a
 * boa: motor que aprende sozinho e nunca desaprende é motor em que se para de
 * confiar no dia em que ele erra.
 *
 * ## Não dá para cadastrar regra do zero, e é de propósito
 *
 * É a descoberta 3 da spec: regra escrita de memória erra. Eu mesmo escrevi
 * `apple.com` para uma descrição que é `APPLE COM BILL`. Regra nasce de
 * correção sobre descrição real, na `/revisao`, onde o texto está na tela.
 */
export function TelaDeRegras({
  regras,
  categorias,
}: {
  regras: RegraNaTela[];
  categorias: CategoriaEscolhivel[];
}) {
  if (regras.length === 0) {
    return (
      <>
        <SectionTitle>Regras</SectionTitle>
        <EstadoVazio
          emoji="🎛️"
          titulo="Nenhuma regra ainda"
          descricao="Regras nascem quando você classifica um lançamento e responde “Sempre”. A partir daí o app repete a sua decisão sozinho."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/revisao">
            <Button>Ir para a revisão</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle>Regras</SectionTitle>

      <Card className="border-blue/20 bg-blue/8">
        <p className="text-xs leading-relaxed text-dim">
          <strong className="font-bold text-blue">
            {regras.length === 1
              ? "1 regra classificando por você."
              : `${regras.length} regras classificando por você.`}
          </strong>{" "}
          Mexer aqui vale <strong className="text-text">daqui para frente</strong> —
          o que uma regra já classificou fica como está, e continua explicado
          pelo texto que o pegou.
        </p>
      </Card>

      {regras.map((regra) => (
        <CartaoDaRegra key={regra.id} regra={regra} categorias={categorias} />
      ))}

      <p className="mt-6 text-2xs leading-relaxed text-dim">
        Não dá para criar regra do zero aqui, e é de propósito: regra escrita de
        memória erra. Elas nascem na{" "}
        <Link href="/revisao" className="underline underline-offset-4">
          revisão
        </Link>
        , sobre a descrição de verdade.
      </p>
    </>
  );
}
