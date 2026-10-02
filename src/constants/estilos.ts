/**
 * VitalAI - Estilos que siguen a la paleta activa
 *
 * `StyleSheet.create` fija los colores al cargar el archivo. `crearEstilos`
 * difiere esa creacion: la primera vez que se lee un estilo se crea la hoja
 * con los colores actuales, y se vuelve a crear solo cuando cambia la
 * paleta. En el uso normal no tiene costo extra.
 *
 *   const styles = crearEstilos(() => StyleSheet.create({ ... }));
 */

import { versionPaleta } from './Colors';

export function crearEstilos<T extends object>(fabrica: () => T): T {
  let cache: T | null = null;
  let versionCache = -1;
  const actual = (): T => {
    if (!cache || versionCache !== versionPaleta()) {
      cache = fabrica();
      versionCache = versionPaleta();
    }
    return cache;
  };
  return new Proxy({} as T, {
    get: (_, clave) => actual()[clave as keyof T],
    has: (_, clave) => clave in actual(),
    ownKeys: () => Reflect.ownKeys(actual()),
    getOwnPropertyDescriptor: (_, clave) => Reflect.getOwnPropertyDescriptor(actual(), clave),
  });
}
