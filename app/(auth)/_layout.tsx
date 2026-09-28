/**
 * VitalAI - Layout del grupo de autenticacion.
 * Agrupa las pantallas de bienvenida, login y registro.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="bienvenida" />
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
    </Stack>
  );
}
