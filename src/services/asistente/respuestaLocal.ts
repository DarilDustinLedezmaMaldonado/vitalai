/**
 * VitalAI - Respuestas del asistente sin IA
 *
 * Se usan cuando la IA no esta disponible (modo demo, sin internet o sin
 * cuota). Reconocen preguntas frecuentes por palabras clave y responden con
 * las mismas herramientas que usa Gemini. No registran comidas: para eso se
 * necesita interpretar lenguaje natural.
 */

import { ContextoAsistente, ejecutarHerramienta } from './herramientas';
import { RespuestaAsistente } from './geminiService';

export async function respuestaLocal(texto: string, contexto: ContextoAsistente): Promise<RespuestaAsistente> {
  const t = texto.toLowerCase();

  if (/(que|qué) (como|ceno|meriendo)|recalcul|resto del d|hambre/.test(t)) {
    const { resultado } = await ejecutarHerramienta('plan_resto_del_dia', {}, contexto);
    const r = resultado as { explicacion: string; comidas: { momento: string; kcal: number; porciones: string[] }[] };
    const detalle = r.comidas.map((c) => `${c.momento}, ${c.kcal} kcal: ${c.porciones.join(', ')}.`).join(' ');
    return { texto: `${r.explicacion} ${detalle}`.trim(), acciones: [] };
  }

  // "¿Como voy hoy?" es sobre el dia; "¿como va mi progreso?", sobre la tendencia.
  if (/progreso|peso|adherencia/.test(t)) {
    const { resultado } = await ejecutarHerramienta('resumen_progreso', {}, contexto);
    const r = resultado as { peso_actual_kg: number; cambio_kg: number; adherencia_porcentaje: number; dias_registrados: number };
    return {
      texto: r.dias_registrados > 0
        ? `Tu peso actual es ${r.peso_actual_kg} kg (${r.cambio_kg >= 0 ? '+' : ''}${r.cambio_kg} kg) y cumpliste tu meta el ${r.adherencia_porcentaje}% de ${r.dias_registrados} días registrados.`
        : 'Aún no tienes días registrados. Registra tus comidas en Nutrición y tu peso en Progreso.',
      acciones: [],
    };
  }

  const { resultado } = await ejecutarHerramienta('estado_del_dia', {}, contexto);
  const r = resultado as { meta_kcal: number; consumido_kcal: number; restante_kcal: number; agua_vasos: number; proteina: { meta_g: number; consumido_g: number } };

  if (/agua|hidrat/.test(t)) {
    return { texto: `Hoy llevas ${r.agua_vasos} de 8 vasos de agua.${r.agua_vasos < 8 ? ` Te faltan ${8 - r.agua_vasos}.` : ' ¡Meta cumplida!'}`, acciones: [] };
  }
  if (/prote/.test(t)) {
    return { texto: `Llevas ${Math.round(r.proteina.consumido_g)} de ${r.proteina.meta_g} g de proteína. Huevo, pollo, tarwi, queso fresco o lentejas te ayudan a completarla.`, acciones: [] };
  }
  return {
    texto: `Tu meta de hoy es ${r.meta_kcal} kcal; llevas ${r.consumido_kcal} y te quedan ${Math.max(0, r.restante_kcal)}. (Sin conexión con la IA solo puedo responder consultas básicas.)`,
    acciones: [],
  };
}
