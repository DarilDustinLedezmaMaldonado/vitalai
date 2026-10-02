/**
 * VitalAI - Componente CampoTexto
 * Input reutilizable con etiqueta, icono opcional y soporte para contrasena.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Radius, Spacing, Layout } from '@/constants/Layout';

interface CampoTextoProps extends TextInputProps {
  etiqueta: string;
  icono?: keyof typeof Ionicons.glyphMap;
  esPassword?: boolean;
  contenedorStyle?: ViewStyle;
}

export default function CampoTexto({
  etiqueta,
  icono,
  esPassword = false,
  contenedorStyle,
  ...rest
}: CampoTextoProps) {
  const [oculto, setOculto] = useState(esPassword);
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[styles.contenedor, contenedorStyle]}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View
        style={[styles.caja, enfocado && styles.cajaEnfocada]}
      >
        {icono && (
          <Ionicons
            name={icono}
            size={20}
            color={enfocado ? Colors.primary : Colors.textMuted}
            style={styles.icono}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={oculto}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          {...rest}
        />
        {esPassword && (
          <TouchableOpacity onPress={() => setOculto((v) => !v)}>
            <Ionicons
              name={oculto ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: {
    marginBottom: Spacing.lg,
  },
  etiqueta: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  cajaEnfocada: {
    borderColor: Colors.primary,
  },
  icono: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
}));
