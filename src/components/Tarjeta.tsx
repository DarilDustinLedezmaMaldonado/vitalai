/**
 * VitalAI - Componentes basicos de presentacion: Tarjeta y Logo.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Typography, FontFamily } from '@/constants/Typography';
import { Radius, Spacing, Shadow } from '@/constants/Layout';

/** Contenedor de tarjeta con sombra suave. */
export function Tarjeta({
  children,
  estilo,
}: {
  children: ReactNode;
  estilo?: ViewStyle;
}) {
  return <View style={[styles.tarjeta, estilo]}>{children}</View>;
}

/** Logo de marca VitalAI con icono y texto. */
export function Logo({ tamano = 'md' }: { tamano?: 'sm' | 'md' | 'lg' }) {
  const dim = tamano === 'lg' ? 64 : tamano === 'sm' ? 36 : 48;
  const fuente = tamano === 'lg' ? 32 : tamano === 'sm' ? 18 : 24;

  return (
    <View style={styles.logoFila}>
      <View
        style={[
          styles.logoIcono,
          { width: dim, height: dim, borderRadius: dim / 3 },
        ]}
      >
        <Ionicons name="leaf" size={dim * 0.55} color={Colors.textOnPrimary} />
      </View>
      <Text style={[styles.logoTexto, { fontSize: fuente }]}>
        Vital<Text style={styles.logoAcento}>AI</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  logoFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcono: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoTexto: {
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  logoAcento: {
    color: Colors.primary,
  },
});

export default Tarjeta;
