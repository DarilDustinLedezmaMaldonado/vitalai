/**
 * VitalAI - Respuestas del coach en voz alta
 *
 * Usa el sintetizador de voz del propio telefono (expo-speech): gratis, sin
 * internet y sin gastar consultas de IA. Se prefiere una voz en espanol
 * latinoamericano si el telefono la tiene.
 */

import * as Speech from 'expo-speech';

const PREFERIDOS = ['es-US', 'es-MX', 'es-419', 'es-BO', 'es-AR', 'es-CO'];

let idioma: Promise<string> | null = null;

function elegirIdioma(): Promise<string> {
  idioma ??= Speech.getAvailableVoicesAsync()
    .then((voces) => {
      const disponibles = new Set(voces.map((v) => v.language.replace('_', '-')));
      return PREFERIDOS.find((l) => disponibles.has(l))
        ?? voces.find((v) => v.language.toLowerCase().startsWith('es'))?.language
        ?? 'es-US';
    })
    .catch(() => 'es-US');
  return idioma;
}

/** Adapta el texto escrito para que suene natural al leerlo. */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/(\d+)\s?kcal\b/g, '$1 kilocalorías')
    .replace(/\bkcal\b/g, 'kilocalorías')
    .replace(/(\d+)\s?g\b/g, '$1 gramos')
    .replace(/(\d+)\s?kg\b/g, '$1 kilos')
    .replace(/(\d+)\s?ml\b/g, '$1 mililitros')
    .replace(/(\d+)%/g, '$1 por ciento')
    .replace(/[•·]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lee el texto en voz alta; la promesa se resuelve al terminar o al detenerse. */
export async function hablar(texto: string): Promise<void> {
  const language = await elegirIdioma();
  await Speech.stop();
  return new Promise((resolve) => {
    Speech.speak(textoParaVoz(texto), {
      language,
      rate: 1.05,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function callar(): void {
  Speech.stop().catch(() => undefined);
}
