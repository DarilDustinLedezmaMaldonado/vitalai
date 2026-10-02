/**
 * VitalAI - Tema (paleta de colores elegida por el usuario)
 *
 * Carga la paleta guardada en el celular antes de mostrar la app (sin
 * parpadeo de colores) y avisa a las pantallas cuando cambia. Cada pantalla
 * llama a `useTema()` para volver a dibujarse con la nueva paleta.
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aplicarPaleta, paletaActiva, versionPaleta } from '@/constants/Colors';
import { IdPaleta, PALETAS } from '@/constants/Paletas';

const CLAVE_PALETA = '@vitalai_paleta';

interface TemaValor {
  paleta: IdPaleta;
  version: number;
  cambiarPaleta: (id: IdPaleta) => void;
}

const TemaContext = createContext<TemaValor>({
  paleta: paletaActiva(),
  version: 0,
  cambiarPaleta: () => {},
});

export function TemaProvider({ children, alCargar }: { children: ReactNode; alCargar?: () => void }) {
  const [estado, setEstado] = useState({ paleta: paletaActiva(), version: versionPaleta() });

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_PALETA)
      .then((guardada) => {
        if (guardada && guardada in PALETAS) aplicarPaleta(guardada as IdPaleta);
      })
      .catch(() => undefined)
      .finally(() => {
        setEstado({ paleta: paletaActiva(), version: versionPaleta() });
        alCargar?.();
      });
  }, []);

  const cambiarPaleta = (id: IdPaleta) => {
    aplicarPaleta(id);
    setEstado({ paleta: paletaActiva(), version: versionPaleta() });
    AsyncStorage.setItem(CLAVE_PALETA, id).catch(() => undefined);
  };

  return (
    <TemaContext.Provider value={{ ...estado, cambiarPaleta }}>
      {children}
    </TemaContext.Provider>
  );
}

/** Suscribe la pantalla a la paleta: se vuelve a dibujar cuando cambia. */
export function useTema(): TemaValor {
  return useContext(TemaContext);
}
