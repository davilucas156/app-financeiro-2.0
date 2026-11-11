import { extendTailwindMerge } from "tailwind-merge";

/*
 * Os tamanhos de texto e raios próprios do `globals.css` precisam ser
 * declarados: sem isso o merge trata `text-2xs` como cor e apaga `text-dim`
 * (ou o contrário) quando os dois aparecem juntos.
 */
const juntar = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["4xs", "3xs", "2xs", "fixo", "marca"] }],
      rounded: [{ rounded: ["pote", "card"] }],
    },
  },
});

/**
 * Junta classes ignorando valores falsos e resolve conflito do Tailwind: a
 * última vence, então `className` pode sobrescrever o padrão do componente
 * (`<Card className="p-0">` de fato tira o `p-5`).
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return juntar(classes.filter(Boolean).join(" "));
}
