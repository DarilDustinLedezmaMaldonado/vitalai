/**
 * VitalAI - Vibracion haptica
 *
 * Una vibracion por accion confirmada, en el mismo momento que el cambio
 * visual, y nunca como unica señal (muchos usuarios la tienen apagada).
 * En web no hace nada.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const disponible = Platform.OS === 'ios' || Platform.OS === 'android';

/** Un valor cambia de paso: seleccionar una opcion, marcar un vaso. */
export function hapticaSeleccion(): void {
  if (disponible) Haptics.selectionAsync().catch(() => undefined);
}

/** Algo se completo: comida hecha, sesion terminada, registro guardado. */
export function hapticaExito(): void {
  if (disponible) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
