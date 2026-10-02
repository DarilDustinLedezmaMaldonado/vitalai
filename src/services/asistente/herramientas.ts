/**
 * VitalAI - Herramientas del asistente
 *
 * Acciones que el modelo de lenguaje puede pedir ejecutar (function calling).
 * El modelo solo interpreta y conversa: las calorias y los registros los
 * calcula la app con el catalogo y el motor nutricional, nunca el modelo.
 *
 * Esta capa no depende del proveedor de IA: Gemini, un modelo local u otro
 * servicio pueden usar las mismas herramientas.
 */

import { alimentosUSDA } from '@/data/alimentosUSDA';
import { calcularResumenProgreso } from '@/services/analisisService';
import { fechaLocal, guardarRegistroDia, listarRegistros, obtenerRegistroDia } from '@/services/datosService';
import {
  marcarComidaHecha,
  obtenerPlanUsuario,
  registrarAlimento,
  registrarPesoHoy,
  sumarVasosAgua,
} from '@/services/registroDiaService';
import { PerfilUsuario, RequerimientoNutricional } from '@/types/dataset';
import { cumpleMetaCalorica } from '@/utils/calculoNutricional';
import { planificarRestoDelDia } from '@/utils/planificacionDia';
import { buscarAlimento, comidasHechas, totalesDelDia } from '@/utils/totalesDia';

export interface ContextoAsistente {
  uid: string;
  perfil: PerfilUsuario;
  requerimiento: RequerimientoNutricional;
  /** Comidas del plan del usuario (id y momento), para elegir donde registrar. */
  comidas: { id: string; momento: string }[];
}

/** Accion realizada, para mostrarla en el chat como confirmacion. */
export interface AccionRealizada {
  tipo: 'alimento' | 'comida' | 'agua' | 'peso' | 'deshacer';
  descripcion: string;
}

/* ------------------------- Definicion (esquema) ------------------------- */

type Propiedad =
  | { type: 'string'; description: string; enum?: string[] }
  | { type: 'number' | 'integer'; description: string };

export interface DefinicionHerramienta {
  name: string;
  description: string;
  parameters?: { type: 'object'; properties: Record<string, Propiedad>; required: string[] };
}

/** Definiciones en formato JSON Schema (compatible con Gemini y otros modelos). */
export function definirHerramientas(contexto: ContextoAsistente): DefinicionHerramienta[] {
  const idsComida = contexto.comidas.map((c) => c.id);
  return [
    {
      name: 'registrar_alimento',
      description: 'Registra un alimento que el usuario comió hoy. Llámala una vez por cada alimento. Solo alimentos del catálogo.',
      parameters: {
        type: 'object',
        properties: {
          alimento_id: { type: 'string', enum: alimentosUSDA.map((a) => a.id), description: 'Id del alimento en el catálogo.' },
          gramos: { type: 'number', description: 'Cantidad en gramos. Convierte unidades (1 huevo, 1 taza) con las porciones del catálogo.' },
          comida: { type: 'string', enum: idsComida, description: 'Comida del plan a la que pertenece. Si el usuario no lo dice, usa la hora.' },
        },
        required: ['alimento_id', 'gramos', 'comida'],
      },
    },
    {
      name: 'marcar_comida_del_plan',
      description: 'Marca como comida una comida completa del plan del usuario (cuando dice que comió lo del plan).',
      parameters: {
        type: 'object',
        properties: { comida: { type: 'string', enum: idsComida, description: 'Comida del plan.' } },
        required: ['comida'],
      },
    },
    {
      name: 'registrar_agua',
      description: 'Suma vasos de agua (250 ml cada uno) al día. La meta es 8 vasos.',
      parameters: {
        type: 'object',
        properties: { vasos: { type: 'integer', description: 'Vasos a sumar (negativo para corregir).' } },
        required: ['vasos'],
      },
    },
    {
      name: 'registrar_peso',
      description: 'Guarda el peso del usuario de hoy en kilogramos.',
      parameters: {
        type: 'object',
        properties: { kg: { type: 'number', description: 'Peso en kilogramos.' } },
        required: ['kg'],
      },
    },
    {
      name: 'deshacer_ultimo_alimento',
      description: 'Quita el último alimento registrado hoy (si el usuario dice que hubo un error).',
    },
    {
      name: 'estado_del_dia',
      description: 'Devuelve la meta, lo consumido, lo que falta, el agua y las comidas hechas y pendientes de hoy.',
    },
    {
      name: 'plan_resto_del_dia',
      description: 'Devuelve el plan recalculado para las comidas que faltan hoy, para llegar a la meta sin pasar hambre.',
    },
    {
      name: 'resumen_progreso',
      description: 'Devuelve peso actual, cambio de peso, adherencia y días registrados del usuario.',
    },
  ];
}

/* ------------------------------ Ejecucion ------------------------------ */

function nombreComida(contexto: ContextoAsistente, id: string): string {
  return contexto.comidas.find((c) => c.id === id)?.momento ?? id;
}

/**
 * Ejecuta una herramienta y devuelve el resultado (para el modelo) y la
 * accion realizada (para mostrarla en el chat).
 */
export async function ejecutarHerramienta(
  nombre: string,
  args: Record<string, unknown>,
  contexto: ContextoAsistente
): Promise<{ resultado: object; accion?: AccionRealizada }> {
  const { uid, requerimiento } = contexto;
  try {
    switch (nombre) {
      case 'registrar_alimento': {
        const alimentoId = String(args.alimento_id);
        const comida = String(args.comida);
        const { registrado, totales } = await registrarAlimento(uid, alimentoId, Number(args.gramos), comida, requerimiento);
        const nombreAlimento = buscarAlimento(alimentoId)?.nombre ?? alimentoId;
        return {
          resultado: {
            ok: true,
            registrado: `${nombreAlimento} ${registrado.gramos} g`,
            calorias: registrado.calorias,
            proteinas_g: registrado.proteinasG,
            total_hoy_kcal: totales.calorias,
            restante_kcal: requerimiento.caloriasObjetivo - totales.calorias,
          },
          accion: { tipo: 'alimento', descripcion: `${nombreAlimento} ${registrado.gramos} g · ${registrado.calorias} kcal (${nombreComida(contexto, comida)})` },
        };
      }
      case 'marcar_comida_del_plan': {
        const comida = String(args.comida);
        const totales = await marcarComidaHecha(uid, comida, requerimiento);
        return {
          resultado: { ok: true, total_hoy_kcal: totales.calorias, restante_kcal: requerimiento.caloriasObjetivo - totales.calorias },
          accion: { tipo: 'comida', descripcion: `${nombreComida(contexto, comida)} del plan marcada como hecha` },
        };
      }
      case 'registrar_agua': {
        const total = await sumarVasosAgua(uid, Number(args.vasos));
        return { resultado: { ok: true, vasos_hoy: total, meta_vasos: 8 }, accion: { tipo: 'agua', descripcion: `Agua: ${total} de 8 vasos` } };
      }
      case 'registrar_peso': {
        const kg = Number(args.kg);
        await registrarPesoHoy(uid, kg);
        return { resultado: { ok: true, peso_kg: kg }, accion: { tipo: 'peso', descripcion: `Peso de hoy: ${kg} kg` } };
      }
      case 'deshacer_ultimo_alimento': {
        const registro = await obtenerRegistroDia(uid, fechaLocal());
        const ultimo = registro.alimentos[registro.alimentos.length - 1];
        if (!ultimo) return { resultado: { ok: false, motivo: 'No hay alimentos registrados hoy.' } };
        const alimentos = registro.alimentos.slice(0, -1);
        const { plan } = await obtenerPlanUsuario(uid);
        const totales = totalesDelDia({ ...registro, alimentos }, plan);
        await guardarRegistroDia(uid, {
          alimentos,
          caloriasConsumidas: totales.calorias,
          proteinasG: totales.proteinasG,
          carbohidratosG: totales.carbohidratosG,
          grasasG: totales.grasasG,
          cumplioPlan: cumpleMetaCalorica(totales.calorias, requerimiento.caloriasObjetivo),
        }, registro.fecha);
        const nombreAlimento = buscarAlimento(ultimo.alimentoId)?.nombre ?? ultimo.alimentoId;
        return {
          resultado: { ok: true, quitado: `${nombreAlimento} ${ultimo.gramos} g`, total_hoy_kcal: totales.calorias },
          accion: { tipo: 'deshacer', descripcion: `Quitado: ${nombreAlimento} ${ultimo.gramos} g` },
        };
      }
      case 'estado_del_dia': {
        const registro = await obtenerRegistroDia(uid, fechaLocal());
        const { plan } = await obtenerPlanUsuario(uid);
        const hechas = comidasHechas(registro);
        return {
          resultado: {
            hora: new Date().getHours(),
            meta_kcal: requerimiento.caloriasObjetivo,
            consumido_kcal: registro.caloriasConsumidas,
            restante_kcal: requerimiento.caloriasObjetivo - registro.caloriasConsumidas,
            proteina: { meta_g: requerimiento.proteinasG, consumido_g: registro.proteinasG },
            carbohidratos: { meta_g: requerimiento.carbohidratosG, consumido_g: registro.carbohidratosG },
            grasas: { meta_g: requerimiento.grasasG, consumido_g: registro.grasasG },
            agua_vasos: registro.vasosAgua,
            comidas_hechas: plan.filter((c) => hechas.includes(c.id)).map((c) => c.momento),
            comidas_pendientes: plan.filter((c) => !hechas.includes(c.id)).map((c) => c.momento),
            alimentos_registrados: registro.alimentos.map((a) => `${buscarAlimento(a.alimentoId)?.nombre ?? a.alimentoId} ${a.gramos} g`),
          },
        };
      }
      case 'plan_resto_del_dia': {
        const registro = await obtenerRegistroDia(uid, fechaLocal());
        const { plan, noDisponibles } = await obtenerPlanUsuario(uid);
        const consumido = {
          calorias: registro.caloriasConsumidas,
          proteinasG: registro.proteinasG,
          carbohidratosG: registro.carbohidratosG,
          grasasG: registro.grasasG,
        };
        const resto = planificarRestoDelDia(requerimiento, consumido, plan, comidasHechas(registro), new Date().getHours(), alimentosUSDA, noDisponibles);
        return {
          resultado: {
            estado: resto.estado,
            explicacion: resto.mensaje,
            restante_kcal: resto.restante.calorias,
            comidas: resto.comidas.map((c) => ({
              momento: c.momento,
              kcal: c.aporte.calorias,
              proteina_g: c.aporte.proteinasG,
              porciones: c.alimentos.map((a) => `${buscarAlimento(a.alimentoId)?.nombre ?? a.alimentoId} ${a.gramos} g`),
            })),
          },
        };
      }
      case 'resumen_progreso': {
        const registros = await listarRegistros(uid);
        const resumen = calcularResumenProgreso({ ...contexto.perfil, idUsuario: uid }, registros);
        return {
          resultado: {
            peso_inicial_kg: contexto.perfil.pesoInicialKg,
            peso_actual_kg: resumen.pesoActualKg,
            cambio_kg: resumen.variacionPesoKg,
            adherencia_porcentaje: resumen.adherenciaPorcentaje,
            dias_registrados: resumen.diasRegistrados,
            calorias_promedio: resumen.caloriasPromedio,
            objetivo: contexto.perfil.objetivo,
          },
        };
      }
      default:
        return { resultado: { ok: false, motivo: `Herramienta desconocida: ${nombre}` } };
    }
  } catch (e) {
    return { resultado: { ok: false, motivo: e instanceof Error ? e.message : 'Error al ejecutar la acción' } };
  }
}
