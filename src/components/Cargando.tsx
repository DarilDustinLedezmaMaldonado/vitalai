/**
 * VitalAI - Componente Cargando
 * Pantalla de carga con el logo de la app.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Tarjeta';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Layout';

export default function Cargando({ mensaje }: { mensaje?: string }) {
  return (
    <SafeAreaView style={styles.contenedor}>
      <Logo tamano="lg" />
      <ActivityIndicator
        color={Colors.primary}
        size="large"
        style={styles.spinner}
      />
      {mensaje && <Text style={styles.mensaje}>{mensaje}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: Spacing.xxl,
  },
  mensaje: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
