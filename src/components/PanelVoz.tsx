/**
 * VitalAI - Panel de conversacion por voz (manos libres)
 *
 * Reemplaza la barra de escritura mientras el coach escucha, piensa o habla.
 * El circulo crece con el volumen de la voz para que se note que escucha.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';
import { Duracion, EASE_OUT } from '@/constants/Motion';

export type FaseVoz = 'escuchando' | 'pensando' | 'hablando';

const TEXTO: Record<FaseVoz, string> = {
  escuchando: 'Te escucho… dime qué comiste o qué necesitas',
  pensando: 'Anotando…',
  hablando: 'Respondiendo…',
};

const ICONO: Record<FaseVoz, keyof typeof Ionicons.glyphMap> = {
  escuchando: 'mic',
  pensando: 'sparkles',
  hablando: 'volume-high',
};

interface Props {
  fase: FaseVoz;
  /** Volumen de la voz entre 0 y 1. */
  nivel: number;
  onListo: () => void;
  onTerminar: () => void;
}

export function PanelVoz({ fase, nivel, onListo, onTerminar }: Props) {
  const reducido = useReducedMotion();
  const escala = useSharedValue(1);

  useEffect(() => {
    const destino = fase === 'escuchando' && !reducido ? 1 + nivel * 0.5 : 1;
    escala.value = withTiming(destino, { duration: Duracion.presion, easing: EASE_OUT });
  }, [fase, nivel, reducido, escala]);

  const halo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <View style={styles.panel} accessibilityLiveRegion="polite">
      <View style={styles.circuloZona}>
        <Animated.View style={[styles.halo, halo]} />
        <View style={styles.circulo}>
          <Ionicons name={ICONO[fase]} size={28} color={Colors.textOnPrimary} />
        </View>
      </View>
      <Text style={styles.texto}>{TEXTO[fase]}</Text>
      <View style={styles.botones}>
        {fase === 'escuchando' && (
          <Pressable onPress={onListo} style={[styles.boton, styles.botonTonal]} accessibilityRole="button" accessibilityLabel="Ya terminé de hablar">
            <Ionicons name="checkmark" size={18} color={Colors.onPrimaryContainer} />
            <Text style={[styles.botonTexto, { color: Colors.onPrimaryContainer }]}>Listo</Text>
          </Pressable>
        )}
        <Pressable onPress={onTerminar} style={[styles.boton, styles.botonContorno]} accessibilityRole="button" accessibilityLabel="Terminar conversación por voz">
          <Ionicons name="stop" size={16} color={Colors.textPrimary} />
          <Text style={styles.botonTexto}>Terminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  panel: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.surface },
  circuloZona: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryContainer },
  circulo: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  botones: { flexDirection: 'row', gap: Spacing.sm },
  boton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, height: 44, paddingHorizontal: Spacing.lg, borderRadius: Radius.pill },
  botonTonal: { backgroundColor: Colors.primaryContainer },
  botonContorno: { borderWidth: 1, borderColor: Colors.border },
  botonTexto: { ...Typography.button, color: Colors.textPrimary },
}));
