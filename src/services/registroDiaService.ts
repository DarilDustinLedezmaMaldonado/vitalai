/**
 * VitalAI - Acciones sobre el registro del dia
 *
 * Registrar alimentos, agua, peso o marcar comidas desde fuera de la pantalla
 * de Nutricion (por ejemplo, el asistente). Cada accion lee el registro del
 * dia, aplica el cambio, recalcula los totales y lo guarda, igual que la
 * pantalla de Nutricion.
 */

import { COMIDAS, Comida } from '@/data/planBase';
import { RequerimientoNutricional } from '@/types/dataset';
import { calcularAportePorcion, cumpleMetaCalorica, AportePorcion } from '@/utils/calculoNutricional';
import { buscarAlimento, totalesDelDia } from '@/utils/totalesDia';
import {
  AlimentoRegistrado,
  fechaLocal,
  guardarRegistroDia,
  obtenerConfiguracion,
  obtenerRegistroDia,
  RegistroDiarioDetalle,
} from './datosService';

export async function obtenerPlanUsuario(uid: string): Promise<{ plan: Comida[]; noDisponibles: string[] }> {
  const config = await obtenerConfiguracion<{ planComidas?: Comida[]; noDisponibles?: string[] }>(uid, 'nutricion');
  return { plan: config?.planComidas ?? COMIDAS, noDisponibles: config?.noDisponibles ?? [] };
}

/** Recalcula los totales del registro y lo guarda. Devuelve los totales nuevos. */
async function guardarConTotales(
  uid: string,
  registro: RegistroDiarioDetalle,
  meta: RequerimientoNutricional
): Promise<AportePorcion> {
  const { plan } = await obtenerPlanUsuario(uid);
  const totales = totalesDelDia(registro, plan);
  await guardarRegistroDia(uid, {
    alimentos: registro.alimentos,
    comidasCompletadas: registro.comidasCompletadas,
    caloriasConsumidas: totales.calorias,
    proteinasG: totales.proteinasG,
    carbohidratosG: totales.carbohidratosG,
    grasasG: totales.grasasG,
    cumplioPlan: cumpleMetaCalorica(totales.calorias, meta.caloriasObjetivo),
  }, registro.fecha);
  return totales;
}

export async function registrarAlimento(
  uid: string,
  alimentoId: string,
  gramos: number,
  comidaId: string,
  meta: RequerimientoNutricional
): Promise<{ registrado: AlimentoRegistrado; totales: AportePorcion }> {
  const alimento = buscarAlimento(alimentoId);
  if (!alimento) throw new Error(`Alimento desconocido: ${alimentoId}`);
  if (!Number.isFinite(gramos) || gramos <= 0 || gramos > 3000) throw new Error('Cantidad de gramos no valida');
  const registro = await obtenerRegistroDia(uid, fechaLocal());
  const registrado: AlimentoRegistrado = {
    id: `${alimentoId}-${Date.now()}`,
    alimentoId,
    gramos: Math.round(gramos),
    comida: comidaId,
    ...calcularAportePorcion(alimento, gramos),
  };
  registro.alimentos = [...registro.alimentos, registrado];
  const totales = await guardarConTotales(uid, registro, meta);
  return { registrado, totales };
}

export async function marcarComidaHecha(
  uid: string,
  comidaId: string,
  meta: RequerimientoNutricional
): Promise<AportePorcion> {
  const registro = await obtenerRegistroDia(uid, fechaLocal());
  if (!registro.comidasCompletadas.includes(comidaId)) {
    registro.comidasCompletadas = [...registro.comidasCompletadas, comidaId];
  }
  return guardarConTotales(uid, registro, meta);
}

/** Suma vasos de agua al dia (8 vasos es la meta). Devuelve el total. */
export async function sumarVasosAgua(uid: string, vasos: number): Promise<number> {
  const registro = await obtenerRegistroDia(uid, fechaLocal());
  const total = Math.max(0, Math.min(20, registro.vasosAgua + Math.round(vasos)));
  await guardarRegistroDia(uid, { vasosAgua: total }, registro.fecha);
  return total;
}

export async function registrarPesoHoy(uid: string, pesoKg: number): Promise<void> {
  if (!Number.isFinite(pesoKg) || pesoKg < 30 || pesoKg > 300) throw new Error('Peso fuera de rango (30-300 kg)');
  await guardarRegistroDia(uid, { pesoKg: Number(pesoKg.toFixed(1)) }, fechaLocal());
}
