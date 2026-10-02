/**
 * VitalAI - Plan para el resto del dia (lectura)
 *
 * Calcula el plan para las comidas pendientes a partir del registro de hoy y
 * del plan del usuario. Lo usan el dashboard y el asistente; la pantalla de
 * Nutricion lo calcula con su propio estado editable.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { alimentosUSDA } from '@/data/alimentosUSDA';
import { Comida, COMIDAS } from '@/data/planBase';
import { obtenerConfiguracion, RegistroDiarioDetalle } from '@/services/datosService';
import { planificarRestoDelDia, PlanRestoDia } from '@/utils/planificacionDia';
import { RequerimientoNutricional } from '@/types/dataset';

interface ConfigNutricion {
  planComidas?: Comida[];
  noDisponibles?: string[];
}

export function usePlanRestoDelDia(
  uid: string | null,
  requerimiento: RequerimientoNutricional,
  registroHoy: RegistroDiarioDetalle | undefined
): PlanRestoDia {
  const [config, setConfig] = useState<ConfigNutricion>({});

  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      obtenerConfiguracion<ConfigNutricion>(uid, 'nutricion')
        .then((datos) => setConfig(datos ?? {}))
        .catch((e) => console.warn('[VitalAI] No se pudo leer el plan', e));
    }, [uid])
  );

  const consumido = {
    calorias: registroHoy?.caloriasConsumidas ?? 0,
    proteinasG: registroHoy?.proteinasG ?? 0,
    carbohidratosG: registroHoy?.carbohidratosG ?? 0,
    grasasG: registroHoy?.grasasG ?? 0,
  };
  const hechas = [
    ...(registroHoy?.comidasCompletadas ?? []),
    ...(registroHoy?.alimentos ?? []).map((a) => a.comida),
  ];

  return planificarRestoDelDia(
    requerimiento,
    consumido,
    config.planComidas ?? COMIDAS,
    hechas,
    new Date().getHours(),
    alimentosUSDA,
    config.noDisponibles ?? []
  );
}
