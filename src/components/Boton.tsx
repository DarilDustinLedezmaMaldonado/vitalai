/**
 * VitalAI - Componente Boton
 *
 * Botones con las variantes de Material 3, en forma de pildora:
 * - primary: lleno (accion principal de la pantalla);
 * - secondary: tonal (accion secundaria);
 * - ghost: de texto (accion de menor peso).
 * Se encoge levemente al presionar (ver Presionable).
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import Presionable from './Presionable';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

type Variante = 'primary' | 'secondary' | 'ghost';

interface BotonProps {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  estilo?: ViewStyle;
}

const COLOR_TEXTO: Record<Variante, string> = {
  primary: Colors.textOnPrimary,
  secondary: Colors.onPrimaryContainer,
  ghost: Colors.primaryDark,
};

export default function Boton({
  titulo,
  onPress,
  variante = 'primary',
  cargando = false,
  deshabilitado = false,
  estilo,
}: BotonProps) {
  const inactivo = deshabilitado || cargando;

  return (
    <Presionable
      style={[styles.base, styles[variante], estilo]}
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
    >
      {cargando ? (
        <ActivityIndicator color={COLOR_TEXTO[variante]} />
      ) : (
        <Text style={[styles.texto, { color: COLOR_TEXTO[variante] }]}>{titulo}</Text>
      )}
    </Presionable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: Layout.buttonHeight,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryContainer,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  texto: {
    ...Typography.button,
  },
});
