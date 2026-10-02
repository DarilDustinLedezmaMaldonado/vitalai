/**
 * VitalAI - Elemento presionable con respuesta tactil
 *
 * Se encoge a 0.97 al apoyar el dedo (press-in) y vuelve al soltar, en
 * 120 ms con ease-out. La animacion corre en el hilo de UI (Reanimated), asi
 * que no se traba aunque la app este ocupada. Con "reducir movimiento"
 * activado en el sistema, solo cambia la opacidad.
 */

import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Duracion, EASE_OUT, ESCALA_PRESION } from '@/constants/Motion';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

interface PresionableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Sin escala (para elementos donde el movimiento distrae). */
  estatico?: boolean;
}

export default function Presionable({ style, estatico = false, onPressIn, onPressOut, disabled, ...props }: PresionableProps) {
  const presionado = useSharedValue(0);
  const reducido = useReducedMotion();

  const estiloAnimado = useAnimatedStyle(() => {
    if (estatico) return {};
    if (reducido) return { opacity: 1 - presionado.value * 0.15 };
    return { transform: [{ scale: 1 - presionado.value * (1 - ESCALA_PRESION) }] };
  });

  return (
    <PressableAnimado
      {...props}
      disabled={disabled}
      hitSlop={props.hitSlop ?? 4}
      pressRetentionOffset={props.pressRetentionOffset ?? 12}
      onPressIn={(e) => {
        presionado.value = withTiming(1, { duration: Duracion.presion, easing: EASE_OUT });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        presionado.value = withTiming(0, { duration: Duracion.presion, easing: EASE_OUT });
        onPressOut?.(e);
      }}
      style={[style, estiloAnimado, disabled ? { opacity: 0.5 } : null]}
    />
  );
}
