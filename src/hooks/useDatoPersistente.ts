/**
 * VitalAI - Hook de estado persistente
 *
 * Funciona como useState, pero:
 *  - carga el valor guardado cuando cambia `clave` (usuario, fecha, etc.);
 *  - guarda automaticamente cada cambio hecho por el usuario (con un
 *    pequeno retardo para agrupar toques seguidos en una sola escritura).
 *
 * Los valores que llegan desde la carga no se vuelven a guardar.
 */

import { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

const RETARDO_GUARDADO_MS = 500;

export function useDatoPersistente<T>(
  clave: string | null,
  cargar: () => Promise<T>,
  guardar: (valor: T) => Promise<void>,
  valorInicial: T
) {
  const [valor, setValor] = useState<T>(valorInicial);
  const [cargando, setCargando] = useState(clave !== null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const cambiadoPorUsuario = useRef(false);
  const pendiente = useRef<{ valor: T } | null>(null);
  const cargarRef = useRef(cargar);
  const guardarRef = useRef(guardar);
  cargarRef.current = cargar;
  guardarRef.current = guardar;

  const ejecutarGuardado = useCallback(async (datos: T) => {
    try {
      await guardarRef.current(datos);
      setError(null);
    } catch (e) {
      console.warn('[VitalAI] Error al guardar', e);
      setError('No se pudo guardar. Revisa tu conexión.');
    }
  }, []);

  useEffect(() => {
    if (!clave) {
      setCargando(false);
      return;
    }
    let activo = true;
    // Un guardado pendiente de otra clave (otro usuario u otro dia) no debe
    // escribirse sobre la nueva.
    pendiente.current = null;
    cambiadoPorUsuario.current = false;
    setCargando(true);
    cargarRef.current()
      .then((datos) => {
        if (activo) setValor(datos);
      })
      .catch((e) => {
        console.warn('[VitalAI] Error al cargar', e);
        if (activo) setError('No se pudieron cargar tus datos.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [clave, version]);

  useEffect(() => {
    if (!clave || cargando || !cambiadoPorUsuario.current) return;
    pendiente.current = { valor };
    const temporizador = setTimeout(() => {
      pendiente.current = null;
      ejecutarGuardado(valor);
    }, RETARDO_GUARDADO_MS);
    return () => clearTimeout(temporizador);
  }, [valor, cargando, clave, ejecutarGuardado]);

  // Si la pantalla se desmonta con un guardado en espera, se guarda igual.
  useEffect(
    () => () => {
      if (pendiente.current) ejecutarGuardado(pendiente.current.valor);
    },
    [ejecutarGuardado]
  );

  const actualizar = useCallback((cambio: SetStateAction<T>) => {
    cambiadoPorUsuario.current = true;
    setValor(cambio);
  }, []);

  /**
   * Vuelve a leer el valor guardado (por ejemplo, al volver a la pantalla
   * despues de que otra parte de la app lo modifico). No hace nada si hay
   * un guardado pendiente, para no perder cambios del usuario.
   */
  const recargar = useCallback(() => {
    if (pendiente.current) return;
    setVersion((v) => v + 1);
  }, []);

  return { valor, actualizar, cargando, error, recargar };
}
