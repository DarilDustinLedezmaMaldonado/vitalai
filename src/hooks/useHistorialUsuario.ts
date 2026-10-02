/**
 * VitalAI - Historial de registros diarios del usuario
 *
 * Lee los registros guardados (Tabla 2 del dataset) y los vuelve a leer cada
 * vez que la pestana recibe el foco, para reflejar lo registrado en otras
 * pantallas (por ejemplo, comidas en Nutricion).
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { perfilesDemo } from '@/data/datasetDemo';
import { listarRegistros, RegistroDiarioDetalle } from '@/services/datosService';
import { PerfilUsuario } from '@/types/dataset';

export function useHistorialUsuario() {
  const { uid, correo, perfil } = useAuth();
  const [registros, setRegistros] = useState<RegistroDiarioDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sin perfil guardado (cuentas antiguas) se usa el de referencia, pero
  // siempre con el uid real para que los registros coincidan.
  const perfilActual: PerfilUsuario = {
    ...(perfil ?? perfilesDemo[0]),
    idUsuario: uid ?? perfil?.idUsuario ?? perfilesDemo[0].idUsuario,
    correo: correo ?? perfil?.correo ?? '',
  };

  const recargar = useCallback(async () => {
    if (!uid) {
      setRegistros([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      setRegistros(await listarRegistros(uid));
      setError(null);
    } catch (e) {
      console.warn('[VitalAI] Error al leer el historial', e);
      setError('No se pudo leer tu historial.');
    } finally {
      setCargando(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  return { perfilActual, registros, cargando, error, recargar, tienePerfil: perfil !== null };
}
