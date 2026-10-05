/**
 * VitalAI - Control de cargas y sobrecarga progresiva
 *
 * Funciones puras sobre las series registradas (SerieRegistrada):
 *  - volumen de carga = suma de (carga x repeticiones) de cada serie;
 *  - resumen por semana para comparar con las anteriores;
 *  - sugerencia para la proxima sesion segun la ultima (sobrecarga progresiva):
 *    si se completaron todas las repeticiones objetivo se sube un poco la
 *    carga; si no, se mantiene hasta lograrlas.
 */

import { SemanaEntrenamiento, SerieRegistrada } from '@/services/datosService';

export type TipoMedida = 'repeticiones' | 'segundos' | 'minutos';

export interface Medida {
  tipo: TipoMedida;
  /** Repeticiones, segundos o minutos objetivo por serie (0 si no se indica). */
  objetivo: number;
}

/** Interpreta el texto del plan: "12 repeticiones", "30 segundos", "10 por pierna". */
export function medidaDeEjercicio(texto: string): Medida {
  const numero = Number(texto.match(/\d+/)?.[0] ?? 0);
  if (/seg/i.test(texto)) return { tipo: 'segundos', objetivo: numero };
  if (/min/i.test(texto)) return { tipo: 'minutos', objetivo: numero };
  return { tipo: 'repeticiones', objetivo: numero };
}

export const UNIDAD_MEDIDA: Record<TipoMedida, string> = {
  repeticiones: 'rep.',
  segundos: 's',
  minutos: 'min',
};

/** Volumen de carga en kg (solo cuenta series con peso y por repeticiones). */
export function volumenKg(series: SerieRegistrada[]): number {
  return series.reduce((total, serie) => total + serie.cargaKg * serie.cantidad, 0);
}

/** Series de un ejercicio en una fecha, en orden. */
export function seriesDelDia(series: SerieRegistrada[], ejercicioId: string, fecha: string): SerieRegistrada[] {
  return series
    .filter((serie) => serie.ejercicioId === ejercicioId && serie.fecha === fecha)
    .sort((a, b) => a.numero - b.numero);
}

/** Ultima sesion registrada de un ejercicio antes de `fecha` (en cualquier semana). */
export function sesionAnterior(
  semanas: Pick<SemanaEntrenamiento, 'series'>[],
  ejercicioId: string,
  fecha: string
): SerieRegistrada[] {
  const todas = semanas.flatMap((semana) => semana.series).filter(
    (serie) => serie.ejercicioId === ejercicioId && serie.fecha < fecha
  );
  if (todas.length === 0) return [];
  const ultimaFecha = todas.reduce((max, serie) => (serie.fecha > max ? serie.fecha : max), '');
  return seriesDelDia(todas, ejercicioId, ultimaFecha);
}

/** Texto corto de una sesion: "3 × 12 · 20 kg" o "3 × 30 s". */
export function describirSesion(series: SerieRegistrada[], medida: Medida): string {
  if (series.length === 0) return '';
  const cantidades = [...new Set(series.map((serie) => serie.cantidad))];
  const cargas = [...new Set(series.map((serie) => serie.cargaKg))];
  const unidad = medida.tipo === 'repeticiones' ? '' : ` ${UNIDAD_MEDIDA[medida.tipo]}`;
  const cantidad = cantidades.length === 1 ? `${series.length} × ${cantidades[0]}${unidad}` : `${series.map((serie) => serie.cantidad).join('/')}${unidad}`;
  const cargaMax = Math.max(...cargas);
  if (cargaMax === 0) return cantidad;
  const carga = cargas.length === 1 ? `${formatoKg(cargaMax)} kg` : `hasta ${formatoKg(cargaMax)} kg`;
  return `${cantidad} · ${carga}`;
}

export function formatoKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace('.', ',');
}

export interface Sugerencia {
  cargaKg: number;
  cantidad: number;
  /** Justificacion educativa que se muestra al usuario. */
  explicacion: string;
}

/**
 * Propuesta para la proxima sesion a partir de la anterior.
 * Incrementos pequenos (2,5 kg con cargas de 20 kg o mas, 1 kg con menos)
 * para progresar sin sacrificar la tecnica.
 */
export function sugerirProgresion(anterior: SerieRegistrada[], medida: Medida): Sugerencia | null {
  if (anterior.length === 0) return null;
  const cargaKg = Math.max(...anterior.map((serie) => serie.cargaKg));
  const conEsaCarga = anterior.filter((serie) => serie.cargaKg === cargaKg);
  const minimo = Math.min(...conEsaCarga.map((serie) => serie.cantidad));
  const objetivo = medida.objetivo || minimo;
  const completo = minimo >= objetivo;

  if (medida.tipo !== 'repeticiones') {
    const paso = medida.tipo === 'segundos' ? 5 : 1;
    return completo
      ? { cargaKg, cantidad: minimo + paso, explicacion: `La última vez sostuviste ${minimo} ${UNIDAD_MEDIDA[medida.tipo]} en cada serie. Súmale ${paso} ${UNIDAD_MEDIDA[medida.tipo]}: aumentar poco a poco la duración mejora la resistencia sin sobrecargarte.` }
      : { cargaKg, cantidad: objetivo, explicacion: `Apunta a ${objetivo} ${UNIDAD_MEDIDA[medida.tipo]} en todas las series antes de alargar el tiempo.` };
  }

  if (!completo) {
    return {
      cargaKg,
      cantidad: objetivo,
      explicacion: cargaKg > 0
        ? `Mantén ${formatoKg(cargaKg)} kg hasta completar ${objetivo} repeticiones en todas las series. Subir de peso antes de dominarlo suele romper la técnica.`
        : `Busca completar ${objetivo} repeticiones en todas las series antes de hacerlo más difícil.`,
    };
  }
  if (cargaKg === 0) {
    return {
      cargaKg: 0,
      cantidad: minimo + 2,
      explicacion: `Completaste todas las series. Con tu propio peso, la sobrecarga progresiva se logra sumando repeticiones: prueba ${minimo + 2}.`,
    };
  }
  const incremento = cargaKg >= 20 ? 2.5 : 1;
  return {
    cargaKg: cargaKg + incremento,
    cantidad: objetivo,
    explicacion: `Completaste ${objetivo} repeticiones con ${formatoKg(cargaKg)} kg en todas las series. Sube ${formatoKg(incremento)} kg: aumentar la carga de a poco (sobrecarga progresiva) es lo que hace que el músculo siga adaptándose.`,
  };
}

export interface ResumenSemana {
  inicioSemana: string;
  sesiones: number;
  series: number;
  volumenKg: number;
}

/** Totales de una semana (sesion = dia distinto con al menos una serie). */
export function resumirSemana(semana: SemanaEntrenamiento): ResumenSemana {
  const series = semana.series ?? [];
  return {
    inicioSemana: semana.inicioSemana,
    sesiones: Math.max(new Set(series.map((serie) => serie.fecha)).size, semana.rutinasCompletadas.length),
    series: series.length,
    volumenKg: Math.round(volumenKg(series)),
  };
}

/** Variacion porcentual entre dos valores (null si no hay base para comparar). */
export function variacionPorcentual(actual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export interface ComparacionEjercicio {
  ejercicioId: string;
  cargaMaxActual: number;
  cargaMaxAnterior: number;
  mejorCantidadActual: number;
  mejorCantidadAnterior: number;
}

/** Mejor carga y mejor serie de cada ejercicio: esta semana frente a la anterior. */
export function compararEjercicios(actual: SerieRegistrada[], anterior: SerieRegistrada[]): ComparacionEjercicio[] {
  const ids = [...new Set([...actual, ...anterior].map((serie) => serie.ejercicioId))];
  const mejor = (series: SerieRegistrada[], id: string) => {
    const delEjercicio = series.filter((serie) => serie.ejercicioId === id);
    const cargaMax = delEjercicio.length ? Math.max(...delEjercicio.map((serie) => serie.cargaKg)) : 0;
    const conCargaMax = delEjercicio.filter((serie) => serie.cargaKg === cargaMax);
    return { cargaMax, cantidad: conCargaMax.length ? Math.max(...conCargaMax.map((serie) => serie.cantidad)) : 0 };
  };
  return ids
    .filter((id) => actual.some((serie) => serie.ejercicioId === id))
    .map((id) => {
      const a = mejor(actual, id);
      const b = mejor(anterior, id);
      return { ejercicioId: id, cargaMaxActual: a.cargaMax, cargaMaxAnterior: b.cargaMax, mejorCantidadActual: a.cantidad, mejorCantidadAnterior: b.cantidad };
    });
}
