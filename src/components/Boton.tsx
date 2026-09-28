/**
 * VitalAI - Componente Boton
 * Boton reutilizable con variantes de estilo y estado de carga.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Radius, Layout } from '@/constants/Layout';

type Variante = 'primary' | 'secondary' | 'ghost';

interface BotonProps {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  estilo?: ViewStyle;
}

export default function Boton({
  titulo,
  onPress,
  variante = 'primary',
  cargando = false,
  deshabilitado = false,
  estilo,
}: BotonProps) {
  const inactivo = deshabilitado || cargando;

  const estilosContenedor = [
    styles.base,
    variante === 'primary' && styles.primary,
    variante === 'secondary' && styles.secondary,
    variante === 'ghost' && styles.ghost,
    inactivo && styles.inactivo,
    estilo,
  ];

  const colorTexto =
    variante === 'primary'
      ? Colors.textOnPrimary
      : variante === 'secondary'
        ? Colors.primary
        : Colors.textSecondary;

  return (
    <TouchableOpacity
      style={estilosContenedor}
      onPress={onPress}
      disabled={inactivo}
      activeOpacity={0.85}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Text style={[styles.texto, { color: colorTexto }]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: Layout.buttonHeight,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  inactivo: {
    opacity: 0.5,
  },
  texto: {
    ...Typography.button,
  },
});
