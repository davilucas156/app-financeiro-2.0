/**
 * Estado devolvido pela action de "Começar" (tarefa D7).
 *
 * Mora fora do arquivo `"use server"` porque esse arquivo só pode exportar
 * funções assíncronas; o tipo é apagado na compilação, então importá-lo do
 * cliente não custa nada.
 */
export type EstadoOnboarding = "erro" | null;
