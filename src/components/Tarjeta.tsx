/**
 * VitalAI - Componentes basicos de presentacion: Tarjeta y Logo.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Typography, FontFamily } from '@/constants/Typography';
import { Radius, Spacing, Shadow } from '@/constants/Layout';

type VarianteTarjeta = 'elevada' | 'tonal' | 'contorno';

/**
 * Contenedor de tarjeta estilo Material 3:
 * - elevada: superficie blanca con un realce minimo (por defecto);
 * - tonal: contenedor de color suave, sin sombra;
 * - contorno: borde fino, sin sombra.
 */
export function Tarjeta({
  children,
  estilo,
  variante = 'elevada',
}: {
  children: ReactNode;
  estilo?: ViewStyle;
  variante?: VarianteTarjeta;
}) {
  return <View style={[styles.tarjeta, styles[variante], estilo]}>{children}</View>;
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
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  elevada: {
    backgroundColor: Colors.surface,
    ...Shadow.card,
  },
  tonal: {
    backgroundColor: Colors.surfaceContainer,
  },
  contorno: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoFila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcono: {
    backgroundColor: Colors.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoTexto: {
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
  logoAcento: {
    color: Colors.marca,
  },
});

export default Tarjeta;
