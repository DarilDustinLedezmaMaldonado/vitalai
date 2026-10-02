/**
 * VitalAI - Barra de navegacion inferior (estilo Material 3)
 *
 * Indicador en forma de pildora detras del icono activo; icono relleno si
 * esta activo y de contorno si no. Las pestañas son pares: el cambio entre
 * ellas no se anima (animate-expo: "tab switches never slide").
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

type NombreIcono = keyof typeof Ionicons.glyphMap;

const PESTANAS: { nombre: string; titulo: string; icono: NombreIcono; iconoActivo: NombreIcono }[] = [
  { nombre: 'index', titulo: 'Inicio', icono: 'home-outline', iconoActivo: 'home' },
  { nombre: 'nutricion', titulo: 'Nutrición', icono: 'restaurant-outline', iconoActivo: 'restaurant' },
  { nombre: 'entrenamiento', titulo: 'Entreno', icono: 'barbell-outline', iconoActivo: 'barbell' },
  { nombre: 'progreso', titulo: 'Progreso', icono: 'stats-chart-outline', iconoActivo: 'stats-chart' },
  { nombre: 'perfil', titulo: 'Perfil', icono: 'person-outline', iconoActivo: 'person' },
];

function IconoPestana({ activo, icono, iconoActivo }: { activo: boolean; icono: NombreIcono; iconoActivo: NombreIcono }) {
  return (
    <View style={[styles.indicador, activo && styles.indicadorActivo]}>
      <Ionicons name={activo ? iconoActivo : icono} size={22} color={activo ? Colors.onPrimaryContainer : Colors.textSecondary} />
    </View>
  );
}

export default function TabsLayout() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.textPrimary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.barra,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.etiqueta,
      }}
    >
      {PESTANAS.map((p) => (
        <Tabs.Screen
          key={p.nombre}
          name={p.nombre}
          options={{
            title: p.titulo,
            tabBarIcon: ({ focused }) => <IconoPestana activo={focused} icono={p.icono} iconoActivo={p.iconoActivo} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  barra: {
    backgroundColor: Colors.surfaceAlt,
    borderTopWidth: 0,
    elevation: 0,
    height: 76,
    paddingTop: 10,
    paddingBottom: 12,
  },
  item: {
    gap: 4,
  },
  etiqueta: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  indicador: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicadorActivo: {
    backgroundColor: Colors.primaryContainer,
  },
}));
