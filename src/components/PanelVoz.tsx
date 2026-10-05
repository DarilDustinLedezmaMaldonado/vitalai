/**
 * VitalAI - Conversacion por voz a pantalla completa (estilo Gemini Live)
 *
 * - Cuatro puntos de colores (al estilo del Asistente de Google) que se
 *   convierten en barras y saltan con cada sonido mientras escucha.
 * - Un resplandor de colores en la parte inferior que crece con la voz.
 * - Pensando: los puntos ondulan. Hablando: laten como una voz.
 *
 * El volumen llega como valor compartido de Reanimated: la animacion corre en
 * el hilo de interfaz y no vuelve a dibujar la pantalla del chat.
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';
import { Duracion, EASE_OUT } from '@/constants/Motion';

export type FaseVoz = 'escuchando' | 'pensando' | 'hablando';

const TITULO: Record<FaseVoz, string> = {
  escuchando: 'Te escucho…',
  pensando: 'Anotando…',
  hablando: 'Tu coach',
};

const AYUDA_ESCUCHA = 'Dime qué comiste, cuánta agua tomaste o qué necesitas.';

const PUNTO = 16;
const ALTURA_MAXIMA = 84;
/** Cada barra responde distinto, como en un ecualizador. */
const SENSIBILIDAD = [0.7, 1, 0.85, 0.6];
const DOS_PI = Math.PI * 2;

interface Props {
  fase: FaseVoz;
  /** Volumen de la voz entre 0 y 1. */
  nivel: SharedValue<number>;
  /** Cambia en cada lectura del microfono. */
  pulso: SharedValue<number>;
  /** Ultima respuesta del coach (se muestra mientras la lee). */
  respuesta?: string;
  onListo: () => void;
  onTerminar: () => void;
}

function Punto({ indice, color, fase, nivel, pulso, tiempo, reducido }: {
  indice: number;
  color: string;
  fase: FaseVoz;
  nivel: SharedValue<number>;
  pulso: SharedValue<number>;
  tiempo: SharedValue<number>;
  reducido: boolean;
}) {
  const estilo = useAnimatedStyle(() => {
    if (reducido) return { height: PUNTO, transform: [{ translateY: 0 }] };
    if (fase === 'escuchando') {
      // Variacion pseudoaleatoria por barra para que no suban todas iguales.
      const variacion = 0.55 + 0.45 * Math.abs(Math.sin(pulso.value * 0.9 + indice * 1.7));
      const respiro = 3 * Math.sin(tiempo.value + indice * 0.9);
      const altura = PUNTO + Math.max(0, respiro) + nivel.value * (ALTURA_MAXIMA - PUNTO) * SENSIBILIDAD[indice] * variacion;
      return { height: withSpring(altura, { damping: 15, stiffness: 300, mass: 0.5 }), transform: [{ translateY: 0 }] };
    }
    if (fase === 'pensando') {
      return { height: PUNTO, transform: [{ translateY: -12 * Math.sin(tiempo.value * 2 - indice * 0.8) }] };
    }
    // Hablando: latido suave, desfasado entre puntos.
    const latido = Math.abs(Math.sin(tiempo.value * 2.4 + indice * 1.1));
    return { height: PUNTO + latido * 26, transform: [{ translateY: 0 }] };
  }, [fase, reducido, indice]);

  return <Animated.View style={[styles.punto, { backgroundColor: color }, estilo]} />;
}

export function PanelVoz({ fase, nivel, pulso, respuesta, onListo, onTerminar }: Props) {
  const reducido = useReducedMotion();
  const margenes = useSafeAreaInsets();
  /** Reloj continuo (0 a 2π) para respiraciones y ondas. */
  const tiempo = useSharedValue(0);

  useEffect(() => {
    if (reducido) return;
    tiempo.value = 0;
    tiempo.value = withRepeat(withTiming(DOS_PI, { duration: 1600, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(tiempo);
  }, [reducido, tiempo]);

  const resplandor = useAnimatedStyle(() => {
    const fuerza = fase === 'escuchando'
      ? nivel.value
      : 0.35 + 0.15 * Math.sin(tiempo.value * (fase === 'hablando' ? 2.4 : 1));
    return {
      opacity: withTiming(0.45 + 0.55 * fuerza, { duration: Duracion.presion }),
      transform: [{ scaleY: withTiming(0.85 + 0.6 * fuerza, { duration: Duracion.presion, easing: EASE_OUT }) }],
    };
  }, [fase]);

  const colores = [Colors.metrica.agua, Colors.metrica.calorias, Colors.metrica.carbohidratos, Colors.primary];

  return (
    <Animated.View style={styles.pantalla} entering={FadeIn.duration(Duracion.entrada)} exiting={FadeOut.duration(Duracion.estado)}>
      <Animated.View style={[styles.resplandor, resplandor]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="aura" cx="50%" cy="100%" rx="70%" ry="100%">
              <Stop offset="0" stopColor={Colors.metrica.agua} stopOpacity="0.55" />
              <Stop offset="0.45" stopColor={Colors.primary} stopOpacity="0.35" />
              <Stop offset="0.75" stopColor={Colors.metrica.proteina} stopOpacity="0.15" />
              <Stop offset="1" stopColor={Colors.background} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="200" cy="300" rx="320" ry="300" fill="url(#aura)" />
        </Svg>
      </Animated.View>

      <View style={[styles.barraSuperior, { paddingTop: margenes.top + Spacing.md }]}>
        <View style={styles.enVivo}>
          <View style={styles.enVivoPunto} />
          <Text style={styles.enVivoTexto}>Coach en vivo</Text>
        </View>
      </View>

      <View style={styles.centro} accessibilityLiveRegion="polite">
        <Text style={styles.titulo}>{TITULO[fase]}</Text>
        <Text style={styles.texto} numberOfLines={8}>
          {fase === 'hablando' && respuesta ? respuesta : fase === 'escuchando' ? AYUDA_ESCUCHA : ''}
        </Text>
      </View>

      <View style={styles.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {colores.map((color, i) => (
          <Punto key={i} indice={i} color={color} fase={fase} nivel={nivel} pulso={pulso} tiempo={tiempo} reducido={reducido} />
        ))}
      </View>

      <View style={[styles.controles, { paddingBottom: margenes.bottom + Spacing.lg }]}>
        {fase === 'escuchando' ? (
          <Pressable onPress={onListo} style={styles.botonListo} accessibilityRole="button" accessibilityLabel="Ya terminé de hablar">
            <Ionicons name="checkmark" size={20} color={Colors.onPrimaryContainer} />
            <Text style={styles.botonListoTexto}>Listo</Text>
          </Pressable>
        ) : <View style={styles.espacioBoton} />}
        <Pressable onPress={onTerminar} style={styles.botonCerrar} accessibilityRole="button" accessibilityLabel="Terminar conversación por voz">
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  pantalla: { ...StyleSheet.absoluteFill, backgroundColor: Colors.background, zIndex: 10 },
  resplandor: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', transformOrigin: 'bottom' },
  barraSuperior: { flexDirection: 'row', justifyContent: 'center', paddingTop: Spacing.lg, paddingHorizontal: Layout.screenPadding },
  enVivo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  enVivoPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  enVivoTexto: { ...Typography.caption, color: Colors.textSecondary },
  centro: { flex: 1, justifyContent: 'center', paddingHorizontal: Layout.screenPadding + Spacing.sm, gap: Spacing.md },
  titulo: { ...Typography.title, color: Colors.textPrimary },
  texto: { ...Typography.subtitle, fontWeight: undefined, color: Colors.textSecondary, lineHeight: 30 },
  puntos: { height: ALTURA_MAXIMA + Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  punto: { width: PUNTO, height: PUNTO, borderRadius: PUNTO / 2 },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPadding + Spacing.sm, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  espacioBoton: { width: 1 },
  botonListo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, height: 56, paddingHorizontal: Spacing.lg, borderRadius: Radius.pill, backgroundColor: Colors.primaryContainer },
  botonListoTexto: { ...Typography.button, color: Colors.onPrimaryContainer },
  botonCerrar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center' },
}));
