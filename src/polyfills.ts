/**
 * VitalAI - Polyfills para Hermes (motor de JavaScript de React Native)
 *
 * El SDK de IA de Firebase (firebase/ai, v12) usa APIs recientes de los
 * navegadores que Hermes de React Native 0.74 no trae:
 *  - AbortSignal.any: combina señales para cancelar una consulta.
 *  - DOMException: error que lanza cuando una consulta excede su tiempo.
 * Sin ellas, el coach falla en el celular con
 * "AbortSignal.any is not a function" (en el navegador si funcionaba).
 *
 * Se importa una sola vez, al inicio de app/_layout.tsx.
 */

type ConAny = typeof AbortSignal & { any?: (senales: AbortSignal[]) => AbortSignal };

const Senal = (globalThis as { AbortSignal?: ConAny }).AbortSignal;

if (Senal && typeof Senal.any !== 'function') {
  Senal.any = (senales: AbortSignal[]): AbortSignal => {
    const controlador = new AbortController();
    for (const senal of senales) {
      if (senal.aborted) {
        controlador.abort((senal as { reason?: unknown }).reason);
        return controlador.signal;
      }
      senal.addEventListener('abort', () => controlador.abort((senal as { reason?: unknown }).reason));
    }
    return controlador.signal;
  };
}

if (typeof (globalThis as { DOMException?: unknown }).DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    constructor(mensaje?: string, nombre = 'Error') {
      super(mensaje);
      this.name = nombre;
    }
  }
  (globalThis as { DOMException?: unknown }).DOMException = DOMExceptionPolyfill;
}

export {};
