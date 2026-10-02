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
  definirHerramientas,
  ejecutarHerramienta,
} from './herramientas';
import { construirInstrucciones } from './instrucciones';

/** Modelo por defecto; se puede cambiar en app.json -> extra.geminiModelo. */
const MODELO_POR_DEFECTO = 'gemini-3.8-flash';
const MAX_RONDAS_HERRAMIENTAS = 5;

export const asistenteIADisponible = firebaseConfigurado && app !== null;

export interface SesionAsistente {
  chat: ChatSession;
  contexto: ContextoAsistente;
}

export interface RespuestaAsistente {
  texto: string;
  acciones: AccionRealizada[];
}

export function crearSesion(contexto: ContextoAsistente): SesionAsistente {
  if (!app) throw new Error('Firebase no esta configurado');
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const modelo = getGenerativeModel(ai, {
    model: Constants.expoConfig?.extra?.geminiModelo ?? MODELO_POR_DEFECTO,
    systemInstruction: construirInstrucciones(contexto),
    tools: [{ functionDeclarations: definirHerramientas(contexto) as unknown as FunctionDeclaration[] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
  });
  return { chat: modelo.startChat(), contexto };
}

export async function enviarMensaje(
  sesion: SesionAsistente,
  texto: string
): Promise<RespuestaAsistente> {
  const acciones: AccionRealizada[] = [];
  let resultado = await sesion.chat.sendMessage(texto);

  for (let ronda = 0; ronda < MAX_RONDAS_HERRAMIENTAS; ronda++) {
    const llamadas = resultado.response.functionCalls();
    if (!llamadas || llamadas.length === 0) break;
    const respuestas: FunctionResponsePart[] = [];
    for (const llamada of llamadas) {
      const { resultado: salida, accion } = await ejecutarHerramienta(
        llamada.name,
        (llamada.args ?? {}) as Record<string, unknown>,
        sesion.contexto
      );
      if (accion) acciones.push(accion);
      respuestas.push({ functionResponse: { name: llamada.name, response: salida } });
    }
    resultado = await sesion.chat.sendMessage(respuestas);
  }

  const respuesta = resultado.response.text().trim();
  return {
    texto: respuesta || (acciones.length > 0 ? 'Listo, ya lo registre.' : 'No entendi bien, ¿puedes repetirlo?'),
    acciones,
  };
}

/** Traduce los errores de la IA a un mensaje para el usuario. */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? `${(error as { code?: string }).code ?? ''} ${error.message}` : String(error);
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(texto)) {
    return 'Alcance el limite de consultas gratuitas por ahora. Intenta en un minuto; mientras tanto puedes registrar desde Nutricion.';
  }
  if (/api-not-enabled|PERMISSION_DENIED|403/i.test(texto)) {
    return 'El asistente aun no esta activado en Firebase (AI Logic). Revisa la configuracion del proyecto.';
  }
  if (/fetch|network|Network/i.test(texto)) {
    return 'No tengo conexion a internet. Revisa tu red e intenta de nuevo.';
  }
  return 'Tuve un problema para responder. Intenta de nuevo en un momento.';
}
