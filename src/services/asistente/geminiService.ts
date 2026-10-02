/**
 * VitalAI - Conexion con Gemini (Firebase AI Logic)
 *
 * Usa la API de Gemini a traves de Firebase AI Logic con el proveedor
 * "Gemini Developer API" (capa gratuita, sin servidor propio ni tarjeta).
 *
 * La capa gratuita es muy limitada (medido el 2026-10-02: 20 consultas al dia
 * por modelo y proyecto), asi que cada mensaje gasta UNA sola consulta:
 *  1. Se envia el mensaje con el historial. Gemini responde con texto, o pide
 *     herramientas (registrar comida, consultar el dia...).
 *  2. Si pide herramientas, la app las ejecuta EN ORDEN y redacta la respuesta
 *     con los resultados exactos (redaccion.ts), sin una segunda consulta.
 *  3. Los resultados se guardan como "pendientes" y viajan junto con el
 *     siguiente mensaje del usuario, para que Gemini conserve el contexto.
 *
 * Si un modelo esta saturado o sin cuota, se pasa al siguiente de la cadena
 * (cada modelo tiene su propia cuota diaria).
 */

import Constants from 'expo-constants';
import {
  Content,
  FunctionDeclaration,
  GenerativeModel,
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  Part,
} from 'firebase/ai';
import { app, firebaseConfigurado } from '@/services/firebase';
import {
  AccionRealizada,
  ContextoAsistente,
  crearEjecutorDeMensaje,
  definirHerramientas,
} from './herramientas';
import { construirInstrucciones } from './instrucciones';
import { LlamadaEjecutada, redactarRespuesta } from './redaccion';

/**
 * Cadena de modelos, del preferido al ultimo recurso. Medido el 2026-10-02:
 * gemini-3.5-flash ~4-6 s, flash-lite ~2-4 s, gemini-3.8-flash muy saturado.
 * Configurable en app.json -> extra.geminiModelo / geminiModeloRespaldo.
 */
const MODELO_POR_DEFECTO = 'gemini-3.5-flash';
const MODELO_RESPALDO_POR_DEFECTO = 'gemini-3.5-flash-lite';
const MODELO_ULTIMO_RECURSO = 'gemini-3.8-flash';

/** Turnos de historial que se reenvian (menos tokens por consulta). */
const MAX_TURNOS_HISTORIAL = 12;

export const asistenteIADisponible = firebaseConfigurado && app !== null;

export interface SesionAsistente {
  contexto: ContextoAsistente;
  historial: Content[];
  /** Resultados de herramientas que viajan con el siguiente mensaje. */
  pendientes: Part[];
  modelos: string[];
  /** Modelo en uso; avanza cuando uno se satura o agota su cuota. */
  indiceModelo: number;
  instancias: Map<string, GenerativeModel>;
}

export interface RespuestaAsistente {
  texto: string;
  acciones: AccionRealizada[];
}

const extra = () => Constants.expoConfig?.extra ?? {};

export function crearSesion(contexto: ContextoAsistente): SesionAsistente {
  const modelos = [
    extra().geminiModelo ?? MODELO_POR_DEFECTO,
    extra().geminiModeloRespaldo ?? MODELO_RESPALDO_POR_DEFECTO,
    MODELO_ULTIMO_RECURSO,
  ].filter((m, i, todos) => todos.indexOf(m) === i);
  return { contexto, historial: [], pendientes: [], modelos, indiceModelo: 0, instancias: new Map() };
}

function obtenerModelo(sesion: SesionAsistente, nombre: string): GenerativeModel {
  if (!app) throw new Error('Firebase no está configurado');
  let modelo = sesion.instancias.get(nombre);
  if (!modelo) {
    modelo = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      model: nombre,
      systemInstruction: construirInstrucciones(sesion.contexto),
      tools: [{ functionDeclarations: definirHerramientas(sesion.contexto) as unknown as FunctionDeclaration[] }],
      // El "pensamiento" del modelo consume tokens de salida: se limita para
      // que no corte la respuesta y para responder mas rapido.
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 256 } },
    });
    sesion.instancias.set(nombre, modelo);
  }
  return modelo;
}

/** El modelo esta saturado o sin cuota: vale la pena probar el siguiente. */
function esSaturacion(error: unknown): boolean {
  const texto = error instanceof Error ? error.message : String(error);
  return /high demand|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED|quota|\b(429|500|503)\b/i.test(texto);
}

/**
 * Pide la respuesta probando la cadena de modelos. Es seguro reintentar:
 * todavia no se ejecuto ninguna herramienta en este mensaje.
 */
async function generar(sesion: SesionAsistente, contents: Content[]) {
  let ultimoError: unknown;
  for (let i = sesion.indiceModelo; i < sesion.modelos.length; i++) {
    try {
      const resultado = await obtenerModelo(sesion, sesion.modelos[i]).generateContent({ contents });
      sesion.indiceModelo = i;
      return resultado;
    } catch (error) {
      ultimoError = error;
      if (!esSaturacion(error)) throw error;
    }
  }
  throw ultimoError;
}

/**
 * Recorta el historial sin dejar turnos huerfanos: debe empezar con un
 * mensaje del usuario que no sea una respuesta de herramienta.
 */
function recortar(historial: Content[]): Content[] {
  const recortado = historial.slice(-MAX_TURNOS_HISTORIAL);
  while (
    recortado.length > 0 &&
    (recortado[0].role !== 'user' || recortado[0].parts.some((p) => 'functionResponse' in p && p.functionResponse))
  ) {
    recortado.shift();
  }
  return recortado;
}

export async function enviarMensaje(
  sesion: SesionAsistente,
  texto: string
): Promise<RespuestaAsistente> {
  const turnoUsuario: Content = { role: 'user', parts: [...sesion.pendientes, { text: texto }] };
  const contents = [...sesion.historial, turnoUsuario];
  const resultado = await generar(sesion, contents);

  const contenidoModelo = resultado.response.candidates?.[0]?.content;
  if (!contenidoModelo) throw new Error('El modelo no devolvió una respuesta');
  // Se guarda tal cual (incluye las firmas internas de las llamadas a herramientas).
  sesion.historial = recortar([...contents, contenidoModelo]);
  sesion.pendientes = [];

  const llamadas = resultado.response.functionCalls() ?? [];
  if (llamadas.length === 0) {
    const respuesta = resultado.response.text().trim();
    return { texto: respuesta || 'No entendí bien, ¿puedes repetirlo?', acciones: [] };
  }

  // Herramientas en orden: dos registros seguidos no deben pisarse.
  const ejecutar = crearEjecutorDeMensaje(sesion.contexto);
  const acciones: AccionRealizada[] = [];
  const ejecutadas: LlamadaEjecutada[] = [];
  for (const llamada of llamadas) {
    const { resultado: salida, accion } = await ejecutar(llamada.name, (llamada.args ?? {}) as Record<string, unknown>);
    if (accion) acciones.push(accion);
    ejecutadas.push({ nombre: llamada.name, resultado: salida as Record<string, unknown> });
    sesion.pendientes.push({ functionResponse: { name: llamada.name, response: salida } });
  }
  return { texto: redactarRespuesta(ejecutadas), acciones };
}

/** Traduce los errores de la IA a un mensaje para el usuario. */
export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? `${(error as { code?: string }).code ?? ''} ${error.message}` : String(error);
  if (/PerDay|per day/i.test(texto)) {
    return 'Se agotaron las consultas gratuitas de IA de hoy. Mañana vuelven; mientras tanto puedes registrar desde Nutrición.';
  }
  if (/high demand|overloaded|UNAVAILABLE/i.test(texto)) {
    return 'El servicio de IA está con mucha demanda en este momento. Intenta en un minuto.';
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(texto)) {
    return 'Alcancé el límite de consultas gratuitas por ahora. Intenta en un minuto; mientras tanto puedes registrar desde Nutrición.';
  }
  if (/api-not-enabled|PERMISSION_DENIED|403/i.test(texto)) {
    return 'El asistente aún no está activado en Firebase (AI Logic). Revisa la configuración del proyecto.';
  }
  if (/App Check/i.test(texto)) {
    return 'Firebase rechazó la consulta por App Check. Revisa la configuración de AI Logic.';
  }
  if (/fetch|network|Network/i.test(texto)) {
    return 'No tengo conexión a internet. Revisa tu red e intenta de nuevo.';
  }
  return 'Tuve un problema para responder. Intenta de nuevo en un momento.';
}
