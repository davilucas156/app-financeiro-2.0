/**
 * Junta classes ignorando valores falsos.
 * Existe para permitir `className` opcional nos componentes de
 * `src/components/ui` sem trazer uma dependência para isso.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
