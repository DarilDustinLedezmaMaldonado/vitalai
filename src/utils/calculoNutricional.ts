/**
 * VitalAI - Calculo nutricional
 *
 * Implementa las formulas base que alimentan el modulo de nutricion adaptativa.
 * Funciones puras y deterministas (ideales para pruebas unitarias, ver el
 * apartado "Pruebas Unitarias" del perfil de proyecto).
 */

import {
  NivelActividad,
  ObjetivoComposicion,
  Sexo,
  PerfilUsuario,
  RequerimientoNutricional,
} from '@/types/dataset';

/** Factores de actividad fisica para la formula de gasto energetico. */
const FACTOR_ACTIVIDAD: Record<NivelActividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

/** Ajuste calorico segun el objetivo de composicion corporal. */
const AJUSTE_OBJETIVO: Record<ObjetivoComposicion, number> = {
  perdida_grasa: -0.18,   // deficit del 18%
  mantenimiento: 0,
  ganancia_muscular: 0.12, // superavit del 12%
};

/**
 * Calcula el Metabolismo Basal (TMB) con la ecuacion de Mifflin-St Jeor.
 */
export function calcularTMB(
  sexo: Sexo,
  pesoKg: number,
  alturaCm: number,
  edad: number
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad;
  return sexo === 'masculino' ? base + 5 : base - 161;
}

/**
 * Calcula el Gasto Energetico Total Diario (GET / TDEE).
 */
export function calcularGET(
  tmb: number,
  nivel: NivelActividad
): number {
  return tmb * FACTOR_ACTIVIDAD[nivel];
}

/**
 * Calcula las calorias objetivo segun el objetivo del usuario.
 */
export function calcularCaloriasObjetivo(
  get: number,
  objetivo: ObjetivoComposicion
): number {
  return Math.round(get * (1 + AJUSTE_OBJETIVO[objetivo]));
}

/**
 * Distribuye las calorias objetivo en macronutrientes.
 * Reparto: 30% proteina, 40% carbohidratos, 30% grasa.
 *   - 1 g proteina = 4 kcal
 *   - 1 g carbohidrato = 4 kcal
 *   - 1 g grasa = 9 kcal
 */
export function calcularMacros(caloriasObjetivo: number): {
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
} {
  return {
    proteinasG: Math.round((caloriasObjetivo * 0.3) / 4),
    carbohidratosG: Math.round((caloriasObjetivo * 0.4) / 4),
    grasasG: Math.round((caloriasObjetivo * 0.3) / 9),
  };
}

/**
 * Calcula el requerimiento nutricional completo a partir de un perfil.
 * Es la funcion de entrada del modulo de nutricion adaptativa.
 */
export function calcularRequerimiento(
  perfil: PerfilUsuario
): RequerimientoNutricional {
  const tmb = calcularTMB(
    perfil.sexo,
    perfil.pesoInicialKg,
    perfil.alturaCm,
    perfil.edad
  );
  const get = calcularGET(tmb, perfil.nivelActividad);
  const caloriasObjetivo = calcularCaloriasObjetivo(get, perfil.objetivo);
  const macros = calcularMacros(caloriasObjetivo);
  return { caloriasObjetivo, ...macros };
}

/**
 * Calcula el Indice de Masa Corporal (IMC).
 */
export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return Number((pesoKg / (alturaM * alturaM)).toFixed(1));
}

/** Aporte nutricional de una porcion de un alimento del catalogo. */
export interface AportePorcion {
  calorias: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
}

/**
 * Calcula el aporte de una porcion con regla de tres sobre los valores por
 * 100 g del catalogo: valor = valor_por_100_g * gramos / 100.
 */
export function calcularAportePorcion(
  alimento: {
    caloriasPor100g: number;
    proteinasPor100g: number;
    carbohidratosPor100g: number;
    grasasPor100g: number;
  },
  gramos: number
): AportePorcion {
  const factor = gramos / 100;
  return {
    calorias: Math.round(alimento.caloriasPor100g * factor),
    proteinasG: Number((alimento.proteinasPor100g * factor).toFixed(1)),
    carbohidratosG: Number((alimento.carbohidratosPor100g * factor).toFixed(1)),
    grasasG: Number((alimento.grasasPor100g * factor).toFixed(1)),
  };
}

/** Suma varios aportes nutricionales. */
export function sumarAportes(aportes: AportePorcion[]): AportePorcion {
  const total = aportes.reduce(
    (acc, a) => ({
      calorias: acc.calorias + a.calorias,
      proteinasG: acc.proteinasG + a.proteinasG,
      carbohidratosG: acc.carbohidratosG + a.carbohidratosG,
      grasasG: acc.grasasG + a.grasasG,
    }),
    { calorias: 0, proteinasG: 0, carbohidratosG: 0, grasasG: 0 }
  );
  return {
    calorias: Math.round(total.calorias),
    proteinasG: Number(total.proteinasG.toFixed(1)),
    carbohidratosG: Number(total.carbohidratosG.toFixed(1)),
    grasasG: Number(total.grasasG.toFixed(1)),
  };
}

/** Margen aceptado alrededor de la meta calorica para considerar el dia cumplido. */
export const MARGEN_CUMPLIMIENTO = 0.1;

/**
 * Un dia cumple el plan cuando las calorias consumidas quedan dentro de
 * +-10 % de la meta diaria. Este valor alimenta la adherencia del dataset.
 */
export function cumpleMetaCalorica(consumidas: number, objetivo: number): boolean {
  if (objetivo <= 0 || consumidas <= 0) return false;
  return Math.abs(consumidas - objetivo) / objetivo <= MARGEN_CUMPLIMIENTO;
}
