/**
 * VitalAI - Layout raiz de la aplicacion
 *
 * Carga las fuentes Poppins, envuelve la app con el proveedor de
 * autenticacion y enruta entre el grupo (auth) y el grupo (tabs)
 * segun el estado de sesion.
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Cargando from '@/components/Cargando';

/** Redirige al usuario segun su estado de autenticacion. */
function Enrutador() {
  const { cargando, autenticado } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    const enAuth = segmentos[0] === '(auth)';

    if (!autenticado && !enAuth) {
      router.replace('/(auth)/bienvenida');
    } else if (autenticado && enAuth) {
      router.replace('/(tabs)');
    }
  }, [cargando, autenticado, segmentos]);

  if (cargando) return <Cargando mensaje="Iniciando VitalAI..." />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fuentesListas) {
    return <Cargando mensaje="Cargando recursos..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Enrutador />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
