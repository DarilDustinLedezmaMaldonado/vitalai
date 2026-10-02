/**
 * VitalAI - Recalculo del plan ante un ingrediente no disponible
 *
 * Cuando el usuario no tiene un ingrediente del plan, se busca en el catalogo
 * el alimento disponible mas parecido y se ajusta la porcion para conservar
 * las calorias de la comida (perfil, seccion 5.2: "recalculacion instantanea
 * de la dieta ante la ausencia de ingredientes especificos").
 *
 * Criterio de similitud:
 *  1. Se prefieren alimentos de la misma categoria (cereales, legumbres, ...);
 *     si no queda ninguno, se usa un grupo intercambiable (GRUPOS_ALTERNATIVOS).
 *  2. Entre ellos, gana el de distribucion de energia mas parecida: que
 *     porcentaje de sus calorias viene de proteina, carbohidrato y grasa.
 *  3. Los gramos del reemplazo se calculan para igualar las calorias del
 *     ingrediente original (regla de tres), redondeados a 5 g.
 *
 * Cada sustitucion devuelve una explicacion educativa (perfil, seccion 7.1.6).
 */

import { calcularAportePorcion } from './calculoNutricional';

export interface AlimentoCatalogo {
  id: string;
  nombre: string;
  categoria: string;
  caloriasPor100g: number;
  proteinasPor100g: number;
  carbohidratosPor100g: number;
  grasasPor100g: number;
  local?: boolean;
}

export interface Ingrediente {
  alimentoId: string;
  gramos: number;
}

export interface Sustitucion {
  original: Ingrediente;
  reemplazo: Ingrediente;
  /** Diferencia de calorias tras redondear la porcion. */
  diferenciaKcal: number;
  explicacion: string;
}

/**
 * Grupos a los que se recurre cuando no queda ningun alimento de la misma
 * categoria. Verduras y frutas no tienen alternativa: si faltan, se quitan
 * (aportan pocas calorias y no conviene cambiarlas por almidones).
 */
const GRUPOS_ALTERNATIVOS: Record<string, string[]> = {
  Cereales: ['Tuberculos'],
  Tuberculos: ['Cereales'],
  Proteinas: ['Legumbres', 'Lacteos'],
  Legumbres: ['Proteinas'],
  Lacteos: ['Proteinas'],
  Grasas: ['Frutos secos'],
  'Frutos secos': ['Grasas'],
};

/** Porcion maxima del reemplazo respecto a la original (evita 600 g de lechuga). */
const FACTOR_PORCION_MAXIMA = 3;

const CONSEJO_POR_CATEGORIA: Record<string, string> = {
  Proteinas: 'Mantener la proteína de la comida ayuda a conservar masa muscular y prolonga la saciedad.',
  Legumbres: 'Las legumbres combinan proteína vegetal y fibra; son una base económica del plato.',
  Cereales: 'Los cereales aportan la energía principal del día; conviene repartirlos en las comidas.',
  Tuberculos: 'Papa, yuca, camote y plátano son fuentes de almidón intercambiables si se respeta la porción.',
  Lacteos: 'Los lácteos aportan proteína y calcio; elige porciones moderadas si son altos en grasa.',
  Frutas: 'Las frutas aportan fibra, vitaminas y azucares naturales; varia los colores durante la semana.',
  Verduras: 'Las verduras aportan pocas calorias y mucho volumen; puedes aumentarlas con libertad.',
  'Frutos secos': 'Los frutos secos son muy energéticos: unos pocos gramos cubren la porción.',
  Grasas: 'Las grasas son necesarias, pero 1 cucharadita ya aporta unas 40 kcal.',
};

/** Porcentaje de las calorias que aporta cada macronutriente (4/4/9 kcal por g). */
function distribucionEnergia(alimento: AlimentoCatalogo): [number, number, number] {
  const p = alimento.proteinasPor100g * 4;
  const c = alimento.carbohidratosPor100g * 4;
  const g = alimento.grasasPor100g * 9;
  const total = p + c + g || 1;
  return [p / total, c / total, g / total];
}

function distancia(a: AlimentoCatalogo, b: AlimentoCatalogo): number {
  const [pa, ca, ga] = distribucionEnergia(a);
  const [pb, cb, gb] = distribucionEnergia(b);
  return Math.hypot(pa - pb, ca - cb, ga - gb);
}

function redondear5(valor: number): number {
  return Math.max(5, Math.round(valor / 5) * 5);
}

/**
 * Busca el mejor sustituto para un ingrediente.
 *
 * @param original   ingrediente que el usuario no tiene
 * @param catalogo   alimentos disponibles en la app
 * @param excluidos  ids que no deben proponerse (no disponibles o ya en la comida)
 * @returns la sustitucion, o null si no hay ningun candidato razonable
 */
export function buscarSustituto(
  original: Ingrediente,
  catalogo: AlimentoCatalogo[],
  excluidos: string[] = []
): Sustitucion | null {
  const alimentoOriginal = catalogo.find((a) => a.id === original.alimentoId);
  if (!alimentoOriginal || alimentoOriginal.caloriasPor100g <= 0) return null;

  const kcalObjetivo = calcularAportePorcion(alimentoOriginal, original.gramos).calorias;
  const disponibles = catalogo.filter(
    (a) => a.id !== original.alimentoId && !excluidos.includes(a.id) && a.caloriasPor100g > 0
  );

  // Misma categoria; si no queda ninguna, un grupo intercambiable.
  const mismaCategoria = disponibles.filter((a) => a.categoria === alimentoOriginal.categoria);
  const alternativos = GRUPOS_ALTERNATIVOS[alimentoOriginal.categoria] ?? [];
  const candidatos = mismaCategoria.length > 0
    ? mismaCategoria
    : disponibles.filter((a) => alternativos.includes(a.categoria));

  const ordenados = candidatos
    .map((a) => ({
      alimento: a,
      gramos: redondear5((kcalObjetivo * 100) / a.caloriasPor100g),
      distancia: distancia(alimentoOriginal, a),
    }))
    .filter((c) => c.gramos <= original.gramos * FACTOR_PORCION_MAXIMA)
    // A igual parecido, se prefiere el alimento local.
    .sort((x, y) => x.distancia - y.distancia || Number(!!y.alimento.local) - Number(!!x.alimento.local));

  const mejor = ordenados[0];
  if (!mejor) return null;

  const reemplazo: Ingrediente = { alimentoId: mejor.alimento.id, gramos: mejor.gramos };
  const aporteOriginal = calcularAportePorcion(alimentoOriginal, original.gramos);
  const aporteNuevo = calcularAportePorcion(mejor.alimento, mejor.gramos);
  const mismoGrupo = mejor.alimento.categoria === alimentoOriginal.categoria;

  const explicacion = [
    `Cambiamos ${alimentoOriginal.nombre} (${original.gramos} g) por ${mejor.alimento.nombre} (${mejor.gramos} g).`,
    mismoGrupo
      ? `Ambos pertenecen al grupo ${alimentoOriginal.categoria.toLowerCase()}.`
      : `No quedaba otro alimento del grupo ${alimentoOriginal.categoria.toLowerCase()}; usamos uno del grupo ${mejor.alimento.categoria.toLowerCase()}, que cumple una funcion parecida en el plato.`,
    `Energía: ${aporteOriginal.calorias} → ${aporteNuevo.calorias} kcal. Proteína: ${aporteOriginal.proteinasG} → ${aporteNuevo.proteinasG} g.`,
    CONSEJO_POR_CATEGORIA[mejor.alimento.categoria] ?? '',
  ].filter(Boolean).join(' ');

  return {
    original,
    reemplazo,
    diferenciaKcal: aporteNuevo.calorias - aporteOriginal.calorias,
    explicacion,
  };
}
