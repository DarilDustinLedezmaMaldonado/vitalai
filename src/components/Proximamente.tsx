/**
 * VitalAI - Componente Proximamente
 *
 * Estado placeholder para los modulos que aun no se desarrollan.
 * Este avance del 30% entrega la base, la autenticacion y la navegacion;
 * los modulos de nutricion adaptativa, entrenamiento y analisis se
 * implementan en fases posteriores.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Layout';

interface ProximamenteProps {
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  descripcion: string;
}

export default function Proximamente({
  titulo,
  icono,
  descripcion,
}: ProximamenteProps) {
  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.centro}>
        <View style={styles.iconoCaja}>
          <Ionicons name={icono} size={48} color={Colors.primary} />
        </View>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={styles.etiqueta}>
          <Ionicons
            name="construct-outline"
            size={14}
            color={Colors.accentDark}
          />
          <Text style={styles.etiquetaTexto}>En desarrollo</Text>
        </View>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconoCaja: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  titulo: {
    ...Typography.title,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
  },
  etiquetaTexto: {
    ...Typography.caption,
    color: Colors.accentDark,
    marginLeft: Spacing.xs,
  },
  descripcion: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
}));
