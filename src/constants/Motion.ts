/**
 * VitalAI - Movimiento
 *
 * Valores de la skill animate-expo (Emil Kowalski): duraciones cortas y una
 * curva ease-out fuerte. Las acciones frecuentes no se animan o lo hacen en
 * menos de 150 ms; el cambio de pestaña no se anima.
 */

import { Easing } from 'react-native-reanimated';

export const Duracion = {
  presion: 120,      // feedback al presionar
  estado: 180,       // chip, toggle, cambio pequeño
  entrada: 250,      // elementos que aparecen
};

/** Ease-out fuerte para UI (nunca ease-in en interfaz). */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
/** Movimiento dentro de la pantalla. */
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** Escala al presionar: tactil sin exagerar. */
export const ESCALA_PRESION = 0.97;
