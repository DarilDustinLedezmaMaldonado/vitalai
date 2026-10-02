/**
 * VitalAI - Servicio de Analisis de Datos
 *
 * Procesa los registros del dataset para producir resumenes de progreso.
 * Base del futuro modulo de analisis de datos (dashboard y reportes).
 */

import {
  PerfilUsuario,
  RegistroDiario,
  ResumenProgreso,
} from '@/types/dataset';

/**
 * Calcula un resumen de progreso para un usuario a partir de sus registros.
 *
 * @param perfil    perfil del usuario (Tabla 1 del dataset)
 * @param registros registros historicos del usuario (Tabla 2 del dataset)
 */
export function calcularResumenProgreso(
  perfil: PerfilUsuario,
  registros: RegistroDiario[]
): ResumenProgreso {
  const propios = registros
    .filter((r) => r.idUsuario === perfil.idUsuario)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (propios.length === 0) {
    return {
      idUsuario: perfil.idUsuario,
      pesoActualKg: perfil.pesoInicialKg,
      variacionPesoKg: 0,
      adherenciaPorcentaje: 0,
      diasRegistrados: 0,
      caloriasPromedio: 0,
    };
  }

  // No todos los dias tienen pesaje ni comidas registradas: se ignoran los ceros.
  const conPeso = propios.filter((r) => r.pesoKg > 0);
  const conCalorias = propios.filter((r) => r.caloriasConsumidas > 0);
  const pesoActualKg =
    conPeso.length > 0 ? conPeso[conPeso.length - 1].pesoKg : perfil.pesoInicialKg;
  const diasCumplidos = propios.filter((r) => r.cumplioPlan).length;
  const sumaCalorias = conCalorias.reduce(
    (acc, r) => acc + r.caloriasConsumidas,
    0
  );

  return {
    idUsuario: perfil.idUsuario,
    pesoActualKg,
    variacionPesoKg: Number(
      (pesoActualKg - perfil.pesoInicialKg).toFixed(1)
    ),
    adherenciaPorcentaje: Math.round(
      (diasCumplidos / propios.length) * 100
    ),
    diasRegistrados: propios.length,
    caloriasPromedio:
      conCalorias.length > 0 ? Math.round(sumaCalorias / conCalorias.length) : 0,
  };
}

/**
 * Calcula el balance calorico de un dia (consumidas - quemadas).
 * Valor negativo = deficit; positivo = superavit.
 */
export function calcularBalanceDiario(registro: RegistroDiario): number {
  return registro.caloriasConsumidas - registro.caloriasQuemadas;
}
