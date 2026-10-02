/**
 * VitalAI - Layout raiz de la aplicacion
 *
 * Carga la fuente Google Sans, envuelve la app con el proveedor de
 * autenticacion y enruta entre el grupo (auth) y el grupo (tabs)
 * segun el estado de sesion.
 */

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from '@expo-google-fonts/google-sans';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TemaProvider, useTema } from '@/context/TemaContext';
import Cargando from '@/components/Cargando';

/** Redirige al usuario segun su estado de autenticacion. */
function Enrutador() {
  useTema();
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
      <Stack.Screen name="asistente" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  // La paleta guardada se aplica antes de dibujar la app (sin parpadeo de color).
  const [temaListo, setTemaListo] = useState(false);

  return (
    <TemaProvider alCargar={() => setTemaListo(true)}>
      {!fuentesListas || !temaListo ? (
        <Cargando mensaje="Cargando recursos..." />
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <StatusBar style="dark" />
            <Enrutador />
          </AuthProvider>
        </GestureHandlerRootView>
      )}
    </TemaProvider>
  );
}
