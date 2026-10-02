/**
 * VitalAI - Conexion con Gemini (Firebase AI Logic)
 *
 * Usa la API de Gemini a traves de Firebase AI Logic con el proveedor
 * "Gemini Developer API" (capa gratuita, sin servidor propio ni tarjeta).
 *
 * Flujo de un mensaje:
 *  1. Se envia el texto del usuario a la sesion de chat.
 *  2. Si Gemini pide herramientas, se ejecutan EN ORDEN (dos registros
 *     seguidos no deben pisarse) y se le devuelven los resultados.
 *  3. Se repite hasta que Gemini responde con texto (maximo 5 rondas).
 */

import Constants from 'expo-constants';
import {
  ChatSession,
  Content,
  FunctionDeclaration,
  FunctionResponsePart,
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';
import { app, firebaseConfigurado } from '@/services/firebase';
import {
  AccionRealizada,
  ContextoAsistente,
  crearEjecutorDeMensaje,
  definirHerramientas,
} from './herramientas';
import { construirInstrucciones } from './instrucciones';

/**
 * Modelos (configurables en app.json -> extra.geminiModelo / geminiModeloRespaldo).
 * Medido el 2026-10-02 en la capa gratuita: gemini-3.5-flash responde en ~6 s
 * con herramientas; gemini-3.8-flash tardaba >60 s o devolvia "alta demanda".
 * Si el principal esta saturado se usa el respaldo (flash-lite, ~4 s).
 */
const MODELO_POR_DEFECTO = 'gemini-3.5-flash';
const MODELO_RESPALDO_POR_DEFECTO = 'gemini-3.5-flash-lite';
const MAX_RONDAS_HERRAMIENTAS = 5;

export const asistenteIADisponible = firebaseConfigurado && app !== null;

export interface SesionAsistente {
  chat: ChatSession;
  contexto: ContextoAsistente;
  usandoRespaldo: boolean;
}

export interface RespuestaAsistente {
  texto: string;
  acciones: AccionRealizada[];
}

function crearChat(contexto: ContextoAsistente, nombreModelo: string, historial?: Content[]): ChatSession {
  if (!app) throw new Error('Firebase no está configurado');
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const modelo = getGenerativeModel(ai, {
    model: nombreModelo,
    systemInstruction: construirInstrucciones(contexto),
    tools: [{ functionDeclarations: definirHerramientas(contexto) as unknown as FunctionDeclaration[] }],
    // El "pensamiento" del modelo consume tokens de salida: se limita para
    // que no corte la respuesta y para responder mas rapido.
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 256 } },
  });
  return modelo.startChat(historial ? { history: historial } : undefined);
}

const extra = () => Constants.expoConfig?.extra ?? {};

export function crearSesion(contexto: ContextoAsistente): SesionAsistente {
  return { chat: crearChat(contexto, extra().geminiModelo ?? MODELO_POR_DEFECTO), contexto, usandoRespaldo: false };
}

/** El modelo esta saturado o con limite de uso: vale la pena probar el respaldo. */
function esSaturacion(error: unknown): boolean {
  const texto = error instanceof Error ? error.message : String(error);
  return /high demand|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED|\b(429|500|503)\b/i.test(texto);
}

/** Pasa la sesion al modelo de respaldo conservando la conversacion. */
async function cambiarARespaldo(sesion: SesionAsistente): Promise<void> {
  const historial = await sesion.chat.getHistory().catch(() => undefined);
  sesion.chat = crearChat(sesion.contexto, extra().geminiModeloRespaldo ?? MODELO_RESPALDO_POR_DEFECTO, historial);
  sesion.usandoRespaldo = true;
}

export async function enviarMensaje(
  sesion: SesionAsistente,
  texto: string
): Promise<RespuestaAsistente> {
  const acciones: AccionRealizada[] = [];
  const ejecutar = crearEjecutorDeMensaje(sesion.contexto);
  let resultado;
  try {
    resultado = await sesion.chat.sendMessage(texto);
  } catch (error) {
    // Todavia no se registro nada: es seguro reintentar con el respaldo.
    if (!esSaturacion(error) || sesion.usandoRespaldo) throw error;
    await cambiarARespaldo(sesion);
    resultado = await sesion.chat.sendMessage(texto);
  }

  for (let ronda = 0; ronda < MAX_RONDAS_HERRAMIENTAS; ronda++) {
    const llamadas = resultado.response.functionCalls();
    if (!llamadas || llamadas.length === 0) break;
    const respuestas: FunctionResponsePart[] = [];
    for (const llamada of llamadas) {
      const { resultado: salida, accion } = await ejecutar(
        llamada.name,
        (llamada.args ?? {}) as Record<string, unknown>
      );
      if (accion) acciones.push(accion);
      respuestas.push({ functionResponse: { name: llamada.name, response: salida } });
    }
    try {
      resultado = await sesion.chat.sendMessage(respuestas);
    } catch (error) {
      // Ya se registraron datos: NO se reintenta (duplicaria registros).
      // Se informa lo que si se hizo.
      if (acciones.length === 0) throw error;
      return {
        texto: 'Listo, lo registré. No pude redactar la respuesta completa, pero tus datos quedaron guardados.',
        acciones,
      };
    }
  }

  const respuesta = resultado.response.text().trim();
  return {
    texto: respuesta || (acciones.length > 0 ? 'Listo, ya lo registré.' : 'No entendí bien, ¿puedes repetirlo?'),
    acciones,
  };
}

/** Traduce los errores de la IA a un mensaje para el usuario. */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? `${(error as { code?: string }).code ?? ''} ${error.message}` : String(error);
  if (/high demand|overloaded|UNAVAILABLE/i.test(texto)) {
    return 'El servicio de IA está con mucha demanda en este momento. Intenta en un minuto.';
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(texto)) {
    return 'Alcancé el límite de consultas gratuitas por ahora. Intenta en un minuto; mientras tanto puedes registrar desde Nutrición.';
  }
  if (/api-not-enabled|PERMISSION_DENIED|403/i.test(texto)) {
    return 'El asistente aún no está activado en Firebase (AI Logic). Revisa la configuración del proyecto.';
  }
  if (/fetch|network|Network/i.test(texto)) {
    return 'No tengo conexión a internet. Revisa tu red e intenta de nuevo.';
  }
  return 'Tuve un problema para responder. Intenta de nuevo en un momento.';
}
