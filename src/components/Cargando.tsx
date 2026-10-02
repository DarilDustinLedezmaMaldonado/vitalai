/**
 * VitalAI - Componente Cargando
 * Pantalla de carga con el logo de la app.
 *
 * Con `fuenteSistema` usa la fuente del sistema: es la pantalla que se ve
 * mientras Google Sans todavia se esta cargando (si no, React Native avisa
 * "fontFamily ... has not been loaded through expo-font").
 */

import React from 'react';
import { Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from './Tarjeta';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Layout';

const FUENTE_SISTEMA = { fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) };

export default function Cargando({ mensaje, fuenteSistema = false }: { mensaje?: string; fuenteSistema?: boolean }) {
  return (
    <SafeAreaView style={styles.contenedor}>
      <Logo tamano="lg" fuenteSistema={fuenteSistema} />
      <ActivityIndicator
        color={Colors.primary}
        size="large"
        style={styles.spinner}
      />
      {mensaje && <Text style={[styles.mensaje, fuenteSistema && FUENTE_SISTEMA]}>{mensaje}</Text>}
    </SafeAreaView>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
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
}));
