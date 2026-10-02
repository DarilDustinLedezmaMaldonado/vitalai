/**
 * VitalAI - Pantalla de Bienvenida
 * Primera pantalla que ve el usuario. Presenta la propuesta de valor
 * y da acceso al registro o al inicio de sesion.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Tarjeta';
import Boton from '@/components/Boton';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout } from '@/constants/Layout';

/** Lista de beneficios mostrados en la bienvenida. */
const BENEFICIOS = [
  { icono: 'restaurant-outline', texto: 'Planes alimenticios adaptados a Bolivia' },
  { icono: 'mic-outline', texto: 'Registro asistido por voz, sin fricciones' },
  { icono: 'trending-up-outline', texto: 'Seguimiento inteligente de tu progreso' },
] as const;

export default function Bienvenida() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const router = useRouter();

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Logo tamano="lg" />
      </View>

      <View style={styles.centro}>
        <Text style={styles.titulo}>
          Tu acompanante de salud{'\n'}inteligente
        </Text>
        <Text style={styles.subtitulo}>
          Construye hábitos sostenibles con un asistente que aprende de ti
          y te motiva cada día.
        </Text>

        <View style={styles.lista}>
          {BENEFICIOS.map((b) => (
            <View key={b.texto} style={styles.item}>
              <View style={styles.itemIcono}>
                <Ionicons name={b.icono} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.itemTexto}>{b.texto}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.acciones}>
        <Boton
          titulo="Crear cuenta"
          onPress={() => router.push('/(auth)/registro')}
        />
        <Boton
          titulo="Ya tengo cuenta"
          variante="secondary"
          onPress={() => router.push('/(auth)/login')}
          estilo={{ marginTop: Spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.screenPadding,
  },
  cabecera: {
    paddingTop: Spacing.xl,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
  },
  titulo: {
    ...Typography.display,
    color: Colors.textPrimary,
  },
  subtitulo: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  lista: {
    marginTop: Spacing.xxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  itemIcono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemTexto: {
    ...Typography.bodyStrong,
    color: Colors.textPrimary,
    flex: 1,
  },
  acciones: {
    paddingBottom: Spacing.xl,
  },
}));
