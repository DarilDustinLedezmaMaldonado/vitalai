/**
 * VitalAI - Colores activos
 *
 * `Colors` contiene la paleta elegida por el usuario (ver Paletas.ts). Es un
 * objeto mutable: al cambiar de paleta se copian los nuevos valores y se
 * incrementa `versionPaleta`, que invalida los estilos creados con
 * `crearEstilos` (src/constants/estilos.ts).
 */

import { IdPaleta, Paleta, PALETAS, PALETA_POR_DEFECTO } from './Paletas';

export const Colors: Paleta = {
  ...PALETAS[PALETA_POR_DEFECTO],
  metrica: { ...PALETAS[PALETA_POR_DEFECTO].metrica },
};

let version = 0;
let activa: IdPaleta = PALETA_POR_DEFECTO;

/** Version actual de la paleta; cambia cada vez que se aplica una nueva. */
export function versionPaleta(): number {
  return version;
}

export function paletaActiva(): IdPaleta {
  return activa;
}

/** Copia la paleta elegida en `Colors` e invalida los estilos cacheados. */
export function aplicarPaleta(id: IdPaleta): void {
  if (id === activa) return;
  const paleta = PALETAS[id];
  Object.assign(Colors, paleta, { metrica: { ...paleta.metrica } });
  activa = id;
  version += 1;
}

export default Colors;
