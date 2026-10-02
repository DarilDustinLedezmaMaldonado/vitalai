/**
 * VitalAI - Plan para el resto del dia
 *
 * Recalcula las comidas que faltan segun lo que el usuario ya comio, para
 * llegar a su meta sin pasar hambre (nutricion adaptativa, perfil 5.2).
 *
 * Metodo (parte del plan del propio usuario, no inventa combinaciones):
 *  1. Lo que falta = meta del dia - lo consumido (calorias y macronutrientes).
 *  2. Se reparte entre las comidas pendientes con el peso habitual de cada
 *     comida (el almuerzo pesa mas que la merienda).
 *  3. En cada comida, segun el papel de cada ingrediente:
 *     - proteina (proteinas, legumbres, lacteos): se ajusta para cubrir la
 *       proteina que falta, porque es lo que mas sacia;
 *     - volumen (verduras, frutas): se mantiene o aumenta, llena con pocas kcal;
 *     - energia (cereales, tuberculos) y grasas: se ajustan con lo que sobra.
 *  4. Casos especiales:
 *     - meta ya alcanzada: opciones ligeras, sin proponer ayunos ni compensar;
 *     - mucho por comer tarde: tope por comida, no se fuerza a comer de golpe.
 */

import { calcularAportePorcion, sumarAportes, AportePorcion } from './calculoNutricional';
import { AlimentoCatalogo, buscarSustituto, Ingrediente } from './sustitucion';

export interface ComidaPlan {
  id: string;
  momento: string;
  titulo: string;
  alimentos: Ingrediente[];
}

export interface Meta {
  caloriasObjetivo: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
}

export type EstadoDia = 'en_curso' | 'meta_alcanzada' | 'tarde_con_deficit' | 'sin_comidas';

export interface ComidaAjustada {
  comidaId: string;
  momento: string;
  titulo: string;
  alimentos: Ingrediente[];
  aporte: AportePorcion;
  presupuestoKcal: number;
}

export interface PlanRestoDia {
  estado: EstadoDia;
  restante: AportePorcion;
  comidas: ComidaAjustada[];
  mensaje: string;
}

/** Hora habitual (0-23) de cada momento; la colacion no tiene hora fija. */
export const HORA_MOMENTO: Record<string, number | null> = {
  Desayuno: 8,
  Almuerzo: 13,
  Merienda: 17,
  Cena: 20,
  Colacion: null,
};

/** Peso relativo de cada momento en el reparto de calorias. */
const PESO_MOMENTO: Record<string, number> = {
  Desayuno: 0.25,
  Almuerzo: 0.35,
  Merienda: 0.15,
  Cena: 0.25,
  Colacion: 0.1,
};

/** Horas tras la ultima comida del dia en que esta se da por pasada. */
const MARGEN_ULTIMA_COMIDA = 3;
/** Energia minima de una comida ligera. */
const KCAL_COMIDA_LIGERA = 150;
/** Una comida no recibe mas de 1.5 veces su parte normal de la meta. */
const FACTOR_TOPE_COMIDA = 1.5;

type Papel = 'proteina' | 'volumen' | 'energia' | 'grasa';

const PAPEL_POR_CATEGORIA: Record<string, Papel> = {
  Proteinas: 'proteina',
  Legumbres: 'proteina',
  Lacteos: 'proteina',
  Verduras: 'volumen',
  Frutas: 'volumen',
  Cereales: 'energia',
  Tuberculos: 'energia',
  Grasas: 'grasa',
  'Frutos secos': 'grasa',
};

function redondear5(gramos: number): number {
  return Math.round(gramos / 5) * 5;
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

/**
 * Comidas que aun se pueden comer hoy segun la hora. Una comida se da por
 * pasada cuando llega la hora de la siguiente (la merienda deja de contar a
 * la hora de la cena); la ultima, unas horas despues de su hora.
 */
export function comidasPendientes<T extends ComidaPlan>(
  plan: T[],
  hechas: string[],
  horaActual: number
): T[] {
  const horas = Object.values(HORA_MOMENTO).filter((h): h is number => h !== null).sort((a, b) => a - b);
  return plan.filter((comida) => {
    if (hechas.includes(comida.id)) return false;
    const hora = HORA_MOMENTO[comida.momento];
    if (hora === null || hora === undefined) return true;
    const siguiente = horas.find((h) => h > hora);
    const limite = siguiente ?? hora + MARGEN_ULTIMA_COMIDA;
    return horaActual < limite;
  });
}

/**
 * Ajusta las porciones de una comida a un presupuesto de calorias y proteina.
 * Los gramos de cada ingrediente se mueven dentro de un rango razonable
 * respecto a la porcion original del plan.
 */
function ajustarComida(
  comida: ComidaPlan,
  catalogo: AlimentoCatalogo[],
  presupuestoKcal: number,
  proteinaObjetivoG: number,
  ligera: boolean
): Ingrediente[] {
  const items = comida.alimentos.flatMap((ingrediente) => {
    const alimento = catalogo.find((a) => a.id === ingrediente.alimentoId);
    if (!alimento) return [];
    const papel = PAPEL_POR_CATEGORIA[alimento.categoria] ?? 'energia';
    return [{ ingrediente, alimento, papel, gramos: ingrediente.gramos }];
  });
  const kcalDe = (item: (typeof items)[number], gramos = item.gramos) =>
    calcularAportePorcion(item.alimento, gramos).calorias;

  // 1. Proteina: escalar para cubrir el objetivo (entre 0.5x y 2x).
  const proteicos = items.filter((i) => i.papel === 'proteina');
  const proteinaActual = proteicos.reduce(
    (t, i) => t + calcularAportePorcion(i.alimento, i.gramos).proteinasG,
    0
  );
  if (proteicos.length > 0 && proteinaActual > 0) {
    const factor = limitar(proteinaObjetivoG / proteinaActual, ligera ? 0.5 : 0.75, 2);
    proteicos.forEach((i) => (i.gramos = i.ingrediente.gramos * factor));
  }

  // 2. Volumen: se mantiene; si hay presupuesto de sobra, se aumenta hasta 1.5x.
  const volumen = items.filter((i) => i.papel === 'volumen');

  // 3. Energia y grasa: reciben lo que queda del presupuesto.
  const flexibles = items.filter((i) => i.papel === 'energia' || i.papel === 'grasa');
  const kcalFijas = () =>
    [...proteicos, ...volumen].reduce((t, i) => t + kcalDe(i), 0);
  const kcalFlexOriginal = flexibles.reduce((t, i) => t + kcalDe(i, i.ingrediente.gramos), 0);

  if (ligera) {
    // Comida ligera: sin almidones ni grasas añadidas.
    flexibles.forEach((i) => (i.gramos = 0));
  } else if (kcalFlexOriginal > 0) {
    const disponible = presupuestoKcal - kcalFijas();
    const factor = limitar(disponible / kcalFlexOriginal, 0, 2);
    // Las grasas bajan primero: con poco presupuesto se quitan antes que el almidon.
    flexibles.forEach((i) => {
      const f = i.papel === 'grasa' ? Math.min(factor, factor * factor, 1) : factor;
      i.gramos = i.ingrediente.gramos * f;
    });
  }

  // Si aun sobra presupuesto, mas volumen (llena con pocas calorias).
  const sobrante = presupuestoKcal - items.reduce((t, i) => t + kcalDe(i), 0);
  if (sobrante > 0 && volumen.length > 0) {
    const kcalVolumen = volumen.reduce((t, i) => t + kcalDe(i), 0) || 1;
    const factor = limitar(1 + sobrante / kcalVolumen, 1, 1.5);
    volumen.forEach((i) => (i.gramos = i.ingrediente.gramos * factor));
  }

  // Si se paso del presupuesto, se reduce la proteina hasta su minimo.
  const exceso = items.reduce((t, i) => t + kcalDe(i), 0) - presupuestoKcal;
  if (exceso > 0 && proteicos.length > 0) {
    const kcalProteicos = proteicos.reduce((t, i) => t + kcalDe(i), 0) || 1;
    const factor = limitar(1 - exceso / kcalProteicos, 0.5, 1);
    proteicos.forEach((i) => (i.gramos = Math.max(i.gramos * factor, i.ingrediente.gramos * 0.5)));
  }

  return items
    .map((i) => ({ alimentoId: i.ingrediente.alimentoId, gramos: redondear5(i.gramos) }))
    .filter((i) => i.gramos > 0);
}

/**
 * Calcula el plan para el resto del dia.
 *
 * @param meta          requerimiento diario del usuario
 * @param consumido     lo que ya comio hoy
 * @param plan          comidas del plan del usuario
 * @param hechas        ids de comidas ya comidas (marcadas o con alimentos registrados)
 * @param horaActual    hora local (0-23)
 * @param catalogo      alimentos disponibles
 * @param noDisponibles alimentos que el usuario no tiene
 */
export function planificarRestoDelDia(
  meta: Meta,
  consumido: AportePorcion,
  plan: ComidaPlan[],
  hechas: string[],
  horaActual: number,
  catalogo: AlimentoCatalogo[],
  noDisponibles: string[] = []
): PlanRestoDia {
  const restante: AportePorcion = {
    calorias: Math.round(meta.caloriasObjetivo - consumido.calorias),
    proteinasG: Math.max(0, Math.round(meta.proteinasG - consumido.proteinasG)),
    carbohidratosG: Math.max(0, Math.round(meta.carbohidratosG - consumido.carbohidratosG)),
    grasasG: Math.max(0, Math.round(meta.grasasG - consumido.grasasG)),
  };
  const pendientes = comidasPendientes(plan, hechas, horaActual);

  if (pendientes.length === 0) {
    return {
      estado: 'sin_comidas',
      restante,
      comidas: [],
      mensaje: restante.calorias > 0
        ? `No quedan comidas en tu plan de hoy. Te faltaron ${restante.calorias} kcal; si tienes hambre, elige una fruta o un yogur. Mañana retomas el plan.`
        : 'Ya completaste tu plan de hoy. ¡Buen trabajo!',
    };
  }

  // Ingredientes que el usuario no tiene: se sustituyen antes de ajustar.
  const comidasDisponibles = pendientes.map((comida) => ({
    ...comida,
    alimentos: comida.alimentos.flatMap((ingrediente) => {
      if (!noDisponibles.includes(ingrediente.alimentoId)) return [ingrediente];
      const enLaComida = comida.alimentos.map((a) => a.alimentoId);
      const s = buscarSustituto(ingrediente, catalogo, [...noDisponibles, ...enLaComida]);
      return s ? [s.reemplazo] : [];
    }),
  }));

  const pesoTotal = comidasDisponibles.reduce((t, c) => t + (PESO_MOMENTO[c.momento] ?? 0.2), 0);
  const metaAlcanzada = restante.calorias < KCAL_COMIDA_LIGERA * pendientes.length;

  let tarde = false;
  const comidas: ComidaAjustada[] = comidasDisponibles.map((comida) => {
    const peso = PESO_MOMENTO[comida.momento] ?? 0.2;
    const parte = peso / pesoTotal;
    const tope = meta.caloriasObjetivo * peso * FACTOR_TOPE_COMIDA;
    let presupuesto = metaAlcanzada ? KCAL_COMIDA_LIGERA : restante.calorias * parte;
    if (presupuesto > tope) {
      presupuesto = tope;
      tarde = true;
    }
    const proteinaObjetivo = metaAlcanzada
      ? 0
      : restante.proteinasG * parte;
    const alimentos = ajustarComida(comida, catalogo, presupuesto, proteinaObjetivo, metaAlcanzada);
    const aporte = sumarAportes(alimentos.flatMap((ing) => {
      const alimento = catalogo.find((a) => a.id === ing.alimentoId);
      return alimento ? [calcularAportePorcion(alimento, ing.gramos)] : [];
    }));
    return {
      comidaId: comida.id,
      momento: comida.momento,
      titulo: comida.titulo,
      alimentos,
      aporte,
      presupuestoKcal: Math.round(presupuesto),
    };
  });

  const nombres = comidas.map((c) => c.momento.toLowerCase()).join(' y ');
  const totalPlan = comidas.reduce((t, c) => t + c.aporte.calorias, 0);
  let estado: EstadoDia = 'en_curso';
  let mensaje = `Te quedan ${restante.calorias} kcal y ${restante.proteinasG} g de proteina para ${nombres}. ` +
    'Ajustamos las porciones priorizando proteina y verduras: son lo que mas sacia con menos calorias.';

  if (metaAlcanzada) {
    estado = 'meta_alcanzada';
    mensaje = restante.calorias <= 0
      ? `Hoy ya llegaste a tu meta (te pasaste por ${-restante.calorias} kcal). No hace falta compensar dejando de comer: si tienes hambre, elige opciones ligeras como estas. Un dia no define tu progreso.`
      : `Estas muy cerca de tu meta. Para ${nombres} te sugerimos opciones ligeras con proteina y verduras, que sacian sin pasarte.`;
  } else if (tarde) {
    estado = 'tarde_con_deficit';
    mensaje = `Te faltan ${restante.calorias} kcal, pero no es recomendable comerlas todas de golpe. ` +
      `Ajustamos ${nombres} a una porcion razonable (${totalPlan} kcal). Mañana intenta repartir mejor tus comidas.`;
  }

  return { estado, restante, comidas, mensaje };
}
