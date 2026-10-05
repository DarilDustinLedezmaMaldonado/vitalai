/**
 * VitalAI - Servicio de persistencia de datos
 *
 * Guarda y lee los datos del usuario con la misma estructura en los dos modos:
 *  1. MODO FIREBASE: documentos en Cloud Firestore.
 *  2. MODO DEMO: los mismos documentos en AsyncStorage (solo en el celular).
 *
 * Estructura (rutas de Firestore):
 *   usuarios/{uid}                                -> PerfilUsuario (Tabla 1 del dataset)
 *   usuarios/{uid}/registrosDiarios/{YYYY-MM-DD}  -> RegistroDiario + detalle del dia (Tabla 2)
 *   usuarios/{uid}/entrenamientoSemanal/{lunes}   -> sesiones completadas y series (carga y repeticiones) de la semana
 *   usuarios/{uid}/configuracion/{nombre}         -> planes personalizados del usuario
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db, firebaseConfigurado } from './firebase';
import { PerfilUsuario, RegistroDiario } from '@/types/dataset';

const PREFIJO_DEMO = '@vitalai_datos/';

/* ------------------------- Tipos de documentos ------------------------- */

/** Alimento registrado en el dia (se guarda solo la referencia al catalogo). */
export interface AlimentoRegistrado {
  id: string;
  alimentoId: string;
  gramos: number;
  calorias: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
  comida: string;
}

/** Porciones de una comida recalculadas para un dia concreto. */
export interface AjusteComida {
  comidaId: string;
  alimentos: { alimentoId: string; gramos: number }[];
}

/** Documento diario: fila del dataset (Tabla 2) mas el detalle de la app. */
export interface RegistroDiarioDetalle extends RegistroDiario {
  alimentos: AlimentoRegistrado[];
  comidasCompletadas: string[];
  /**
   * Porciones del plan recalculadas solo para este dia. Es una lista (no un
   * mapa) porque Firestore combina mapas al guardar con merge y no borraria
   * los ajustes que se quitan; las listas se reemplazan completas.
   */
  ajustesPlan: AjusteComida[];
  actualizado: string;
}

/**
 * Una serie realizada. `cantidad` son repeticiones, o segundos/minutos en los
 * ejercicios por tiempo (plancha, caminata). `cargaKg` es 0 con peso corporal.
 */
export interface SerieRegistrada {
  ejercicioId: string;
  fecha: string;
  numero: number;
  cargaKg: number;
  cantidad: number;
}

/** Progreso de entrenamiento de una semana (clave: fecha del lunes). */
export interface SemanaEntrenamiento {
  inicioSemana: string;
  rutinasCompletadas: string[];
  ejerciciosCompletados: string[];
  /** Lista (no mapa) para que el guardado con merge la reemplace completa. */
  series: SerieRegistrada[];
  actualizado: string;
}

/* ----------------------------- Utilidades ------------------------------ */

/** Fecha local en formato YYYY-MM-DD (no UTC: en Bolivia son UTC-4). */
export function fechaLocal(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Fecha (YYYY-MM-DD) del lunes de la semana de la fecha dada. */
export function inicioSemana(fecha: Date = new Date()): string {
  const copia = new Date(fecha);
  const diasDesdeLunes = (copia.getDay() + 6) % 7;
  copia.setDate(copia.getDate() - diasDesdeLunes);
  return fechaLocal(copia);
}

/** Firestore no acepta `undefined`; JSON elimina esos campos. */
function limpiar<T>(datos: T): T {
  return JSON.parse(JSON.stringify(datos)) as T;
}

/* ---------------------- Almacen generico (2 modos) --------------------- */

async function leerDocumento<T>(ruta: string): Promise<T | null> {
  if (firebaseConfigurado && db) {
    const snap = await getDoc(doc(db, ruta));
    return snap.exists() ? (snap.data() as T) : null;
  }
  const raw = await AsyncStorage.getItem(PREFIJO_DEMO + ruta);
  return raw ? (JSON.parse(raw) as T) : null;
}

/** Escribe un documento combinando los campos con los existentes. */
async function escribirDocumento<T extends object>(
  ruta: string,
  datos: Partial<T>
): Promise<void> {
  const limpios = limpiar(datos);
  if (firebaseConfigurado && db) {
    await setDoc(doc(db, ruta), limpios, { merge: true });
    return;
  }
  // En modo demo la combinacion es leer + escribir: se encola por documento
  // para que dos guardados simultaneos no se pisen.
  const anterior = escriturasDemo.get(ruta) ?? Promise.resolve();
  const escritura = anterior
    .catch(() => undefined)
    .then(async () => {
      const actual = await leerDocumento<T>(ruta);
      await AsyncStorage.setItem(
        PREFIJO_DEMO + ruta,
        JSON.stringify({ ...(actual ?? {}), ...limpios })
      );
    });
  escriturasDemo.set(ruta, escritura);
  try {
    await escritura;
  } finally {
    if (escriturasDemo.get(ruta) === escritura) escriturasDemo.delete(ruta);
  }
}

/** Escrituras demo en curso por ruta (ver escribirDocumento). */
const escriturasDemo = new Map<string, Promise<void>>();

/** Lista los documentos directos de una coleccion. */
async function listarColeccion<T>(rutaColeccion: string): Promise<T[]> {
  if (firebaseConfigurado && db) {
    const snap = await getDocs(collection(db, rutaColeccion));
    return snap.docs.map((d) => d.data() as T);
  }
  const prefijo = `${PREFIJO_DEMO}${rutaColeccion}/`;
  const claves = (await AsyncStorage.getAllKeys()).filter(
    (clave) => clave.startsWith(prefijo) && !clave.slice(prefijo.length).includes('/')
  );
  const pares = await AsyncStorage.multiGet(claves);
  return pares.flatMap(([, valor]) => (valor ? [JSON.parse(valor) as T] : []));
}

/* --------------------------- Perfil (Tabla 1) -------------------------- */

export function obtenerPerfil(uid: string): Promise<PerfilUsuario | null> {
  return leerDocumento<PerfilUsuario>(`usuarios/${uid}`);
}

export function guardarPerfil(uid: string, perfil: PerfilUsuario): Promise<void> {
  return escribirDocumento<PerfilUsuario>(`usuarios/${uid}`, { ...perfil, idUsuario: uid });
}

/* ----------------------- Registro diario (Tabla 2) --------------------- */

function registroVacio(uid: string, fecha: string): RegistroDiarioDetalle {
  return {
    idRegistro: `${uid}_${fecha}`,
    idUsuario: uid,
    fecha,
    pesoKg: 0,
    caloriasConsumidas: 0,
    caloriasQuemadas: 0,
    proteinasG: 0,
    carbohidratosG: 0,
    grasasG: 0,
    pasos: 0,
    vasosAgua: 0,
    cumplioPlan: false,
    alimentos: [],
    comidasCompletadas: [],
    ajustesPlan: [],
    actualizado: new Date().toISOString(),
  };
}

/** Devuelve el registro del dia; si no existe, uno vacio (sin guardarlo). */
export async function obtenerRegistroDia(
  uid: string,
  fecha: string = fechaLocal()
): Promise<RegistroDiarioDetalle> {
  const guardado = await leerDocumento<RegistroDiarioDetalle>(
    `usuarios/${uid}/registrosDiarios/${fecha}`
  );
  return { ...registroVacio(uid, fecha), ...(guardado ?? {}) };
}

/** Actualiza solo los campos indicados del registro del dia. */
export function guardarRegistroDia(
  uid: string,
  cambios: Partial<RegistroDiarioDetalle>,
  fecha: string = fechaLocal()
): Promise<void> {
  return escribirDocumento<RegistroDiarioDetalle>(
    `usuarios/${uid}/registrosDiarios/${fecha}`,
    {
      ...cambios,
      idRegistro: `${uid}_${fecha}`,
      idUsuario: uid,
      fecha,
      actualizado: new Date().toISOString(),
    }
  );
}

/** Historial completo del usuario ordenado por fecha (dataset real). */
export async function listarRegistros(uid: string): Promise<RegistroDiarioDetalle[]> {
  const registros = await listarColeccion<RegistroDiarioDetalle>(
    `usuarios/${uid}/registrosDiarios`
  );
  return registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ---------------------------- Entrenamiento ---------------------------- */

export async function obtenerSemanaEntrenamiento(
  uid: string,
  lunes: string = inicioSemana()
): Promise<SemanaEntrenamiento> {
  const guardada = await leerDocumento<SemanaEntrenamiento>(
    `usuarios/${uid}/entrenamientoSemanal/${lunes}`
  );
  return {
    inicioSemana: lunes,
    rutinasCompletadas: [],
    ejerciciosCompletados: [],
    series: [],
    actualizado: new Date().toISOString(),
    ...(guardada ?? {}),
  };
}

export function guardarSemanaEntrenamiento(
  uid: string,
  cambios: Partial<SemanaEntrenamiento>,
  lunes: string = inicioSemana()
): Promise<void> {
  return escribirDocumento<SemanaEntrenamiento>(
    `usuarios/${uid}/entrenamientoSemanal/${lunes}`,
    { ...cambios, inicioSemana: lunes, actualizado: new Date().toISOString() }
  );
}

export async function listarSemanasEntrenamiento(uid: string): Promise<SemanaEntrenamiento[]> {
  const semanas = await listarColeccion<SemanaEntrenamiento>(
    `usuarios/${uid}/entrenamientoSemanal`
  );
  return semanas
    .map((semana) => ({ ...semana, series: semana.series ?? [] }))
    .sort((a, b) => a.inicioSemana.localeCompare(b.inicioSemana));
}

/* ---------------------- Configuracion del usuario ---------------------- */

/** Planes personalizados (comidas, ejercicios, rutinas) del usuario. */
export function obtenerConfiguracion<T extends object>(
  uid: string,
  nombre: string
): Promise<T | null> {
  return leerDocumento<T>(`usuarios/${uid}/configuracion/${nombre}`);
}

export function guardarConfiguracion<T extends object>(
  uid: string,
  nombre: string,
  datos: Partial<T>
): Promise<void> {
  return escribirDocumento<T>(`usuarios/${uid}/configuracion/${nombre}`, datos);
}
