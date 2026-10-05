/**
 * VitalAI - Escucha por voz para el coach
 *
 * Graba lo que dice el usuario y detecta solo cuando termina de hablar
 * (silencio), para usar el coach con las manos ocupadas mientras cocina.
 * El audio se envia tal cual a Gemini, que lo entiende directamente: no hace
 * falta un servicio aparte de transcripcion y se gasta una sola consulta.
 *
 * Deteccion de silencio: con el nivel de entrada (metering, en dBFS) se mide
 * el ruido de fondo los primeros instantes; se considera voz lo que lo supera
 * claramente. Tras hablar, ~1,5 s por debajo del umbral cierran la grabacion.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AudioQuality,
  IOSOutputFormat,
  RecordingOptions,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';

export interface AudioVoz {
  base64: string;
  mimeType: string;
  duracionMs: number;
}

export type EstadoEscucha = 'inactivo' | 'escuchando';

/** Motivo por el que una escucha termino sin audio util. */
export type FinSinAudio = 'sin-voz' | 'cancelado' | 'sin-permiso' | 'error';

/** AAC mono a 16 kHz: liviano (~4 KB/s) y un formato que Gemini acepta. */
const OPCIONES: RecordingOptions = {
  extension: '.aac',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
  android: { outputFormat: 'aac_adts', audioEncoder: 'aac' },
  ios: { extension: '.m4a', outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.MEDIUM },
  web: { mimeType: 'audio/webm' },
};

const MIME = { '.aac': 'audio/aac', '.m4a': 'audio/mp4', '.webm': 'audio/webm' } as const;

const INTERVALO_MS = 100;
/** Tiempo inicial para medir el ruido de fondo. */
const CALIBRACION_MS = 400;
/** Cuanto debe superar la voz al ruido de fondo (dB). */
const MARGEN_VOZ_DB = 10;
/** Umbral minimo: en una cocina silenciosa evita tomar susurros como voz. */
const UMBRAL_MINIMO_DB = -50;
const SILENCIO_FINAL_MS = 1500;
/** Si nadie habla en este tiempo se deja de escuchar. */
const ESPERA_MAXIMA_MS = 7000;
const DURACION_MAXIMA_MS = 30000;

type Resultado = { audio: AudioVoz } | { motivo: FinSinAudio };

export function useEscuchaVoz() {
  const grabadora = useAudioRecorder(OPCIONES);
  const estadoGrabadora = useAudioRecorderState(grabadora, INTERVALO_MS);
  const [estado, setEstado] = useState<EstadoEscucha>('inactivo');
  const [nivel, setNivel] = useState(0);

  const resolver = useRef<((r: Resultado) => void) | null>(null);
  const medicion = useRef({ inicio: 0, muestrasPiso: [] as number[], piso: -60, hablo: false, ultimaVoz: 0 });
  const terminando = useRef(false);

  const terminar = useCallback(async (enviar: boolean, motivo: FinSinAudio = 'cancelado') => {
    if (terminando.current || !resolver.current) return;
    terminando.current = true;
    const resolverActual = resolver.current;
    resolver.current = null;
    const duracionMs = Date.now() - medicion.current.inicio;
    let resultado: Resultado = { motivo };
    try {
      await grabadora.stop();
      const uri = grabadora.uri;
      if (enviar && uri) {
        const archivo = new File(uri);
        const extension = (Object.keys(MIME) as (keyof typeof MIME)[]).find((e) => uri.endsWith(e)) ?? '.aac';
        resultado = { audio: { base64: await archivo.base64(), mimeType: MIME[extension], duracionMs } };
      }
      if (uri) new File(uri).delete();
    } catch (e) {
      console.warn('[VitalAI] Error al cerrar la grabacion', e);
      resultado = { motivo: 'error' };
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      setEstado('inactivo');
      setNivel(0);
      terminando.current = false;
      resolverActual(resultado);
    }
  }, [grabadora]);

  // Analiza el nivel de entrada en cada lectura del estado de la grabadora.
  useEffect(() => {
    if (estado !== 'escuchando' || !estadoGrabadora.isRecording) return;
    const db = estadoGrabadora.metering ?? -160;
    const m = medicion.current;
    const ahora = Date.now();
    const transcurrido = ahora - m.inicio;

    if (transcurrido < CALIBRACION_MS) {
      m.muestrasPiso.push(db);
      return;
    }
    if (m.muestrasPiso.length) {
      m.piso = m.muestrasPiso.reduce((a, b) => a + b, 0) / m.muestrasPiso.length;
      m.muestrasPiso = [];
    }
    const umbral = Math.max(UMBRAL_MINIMO_DB, m.piso + MARGEN_VOZ_DB);
    setNivel(Math.min(1, Math.max(0, (db - m.piso) / 30)));

    if (db > umbral) {
      m.hablo = true;
      m.ultimaVoz = ahora;
    }
    if (m.hablo && ahora - m.ultimaVoz > SILENCIO_FINAL_MS) terminar(true);
    else if (!m.hablo && transcurrido > ESPERA_MAXIMA_MS) terminar(false, 'sin-voz');
    else if (transcurrido > DURACION_MAXIMA_MS) terminar(true);
  }, [estadoGrabadora, estado, terminar]);

  /** Empieza a escuchar; se resuelve con el audio cuando el usuario calla. */
  const escuchar = useCallback(async (): Promise<Resultado> => {
    if (resolver.current) return { motivo: 'cancelado' };
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) return { motivo: 'sin-permiso' };
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await grabadora.prepareToRecordAsync();
      medicion.current = { inicio: Date.now(), muestrasPiso: [], piso: -60, hablo: false, ultimaVoz: 0 };
      grabadora.record();
      setEstado('escuchando');
    } catch (e) {
      console.warn('[VitalAI] No se pudo iniciar la grabacion', e);
      return { motivo: 'error' };
    }
    return new Promise<Resultado>((resolve) => { resolver.current = resolve; });
  }, [grabadora]);

  /** Termina ya y envia lo grabado (boton "Listo"). */
  const enviarYa = useCallback(() => terminar(true), [terminar]);
  /** Descarta lo grabado. */
  const cancelar = useCallback(() => terminar(false, 'cancelado'), [terminar]);

  // Al salir de la pantalla no debe quedar el microfono abierto.
  useEffect(() => () => { if (resolver.current) terminar(false, 'cancelado'); }, [terminar]);

  return { estado, nivel, escuchar, enviarYa, cancelar };
}
