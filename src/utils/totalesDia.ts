/**
 * VitalAI - Calculos del registro diario
 *
 * Funciones compartidas por la pantalla de Nutricion y el asistente para que
 * una comida registrada por voz cuente exactamente igual que una registrada
 * a mano.
 */

import { AlimentoUSDA, alimentosUSDA } from '@/data/alimentosUSDA';
import { Comida } from '@/data/planBase';
import { AjusteComida, AlimentoRegistrado } from '@/services/datosService';
import { AportePorcion, calcularAportePorcion, sumarAportes } from './calculoNutricional';

/** Parte del registro diario que interviene en los totales. */
export interface DiaRegistro {
  alimentos: AlimentoRegistrado[];
  comidasCompletadas: string[];
  ajustesPlan: AjusteComida[];
}

export function buscarAlimento(id: string): AlimentoUSDA | undefined {
  return alimentosUSDA.find((item) => item.id === id);
}

export function aporteDeComida(comida: Comida): AportePorcion {
  return sumarAportes(comida.alimentos.flatMap((ingrediente) => {
    const alimento = buscarAlimento(ingrediente.alimentoId);
    return alimento ? [calcularAportePorcion(alimento, ingrediente.gramos)] : [];
  }));
}

/** Plan del dia: el plan base con las porciones recalculadas para hoy. */
export function aplicarAjustes(plan: Comida[], ajustes: AjusteComida[]): Comida[] {
  return plan.map((comida) => {
    const ajuste = ajustes.find((a) => a.comidaId === comida.id);
    return ajuste ? { ...comida, alimentos: ajuste.alimentos } : comida;
  });
}

/** Comidas ya comidas: marcadas o con alimentos registrados en ellas. */
export function comidasHechas(dia: Pick<DiaRegistro, 'alimentos' | 'comidasCompletadas'>): string[] {
  return [...new Set([...dia.comidasCompletadas, ...dia.alimentos.map((a) => a.comida)])];
}

/**
 * Totales del dia: alimentos registrados + comidas del plan marcadas como
 * hechas (con sus porciones ajustadas, si las hay).
 */
export function totalesDelDia(dia: DiaRegistro, planBase: Comida[]): AportePorcion {
  const plan = aplicarAjustes(planBase, dia.ajustesPlan);
  const hechas = plan.filter((comida) => dia.comidasCompletadas.includes(comida.id));
  return sumarAportes([...dia.alimentos, ...hechas.map(aporteDeComida)]);
}
