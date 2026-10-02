/**
 * VitalAI - Pantalla de Inicio (Dashboard)
 *
 * Pantalla principal tras el inicio de sesion. Resume el objetivo nutricional
 * y los indicadores calculados con el historial guardado del usuario.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import { useAuth } from '@/context/AuthContext';
import { useHistorialUsuario } from '@/hooks/useHistorialUsuario';
import { usePlanRestoDelDia } from '@/hooks/usePlanRestoDelDia';
import { useRouter } from 'expo-router';
import { calcularResumenProgreso } from '@/services/analisisService';
import { fechaLocal } from '@/services/datosService';
import { calcularRequerimiento } from '@/utils/calculoNutricional';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout, Radius } from '@/constants/Layout';

export default function Inicio() {
  const { correo, uid } = useAuth();
  const router = useRouter();
  const { perfilActual, registros } = useHistorialUsuario();
  const resumen = calcularResumenProgreso(perfilActual, registros);
  const registroHoy = registros.find((registro) => registro.fecha === fechaLocal());
  const requerimiento = calcularRequerimiento(perfilActual);
  const caloriasRegistradas = registroHoy?.caloriasConsumidas ?? 0;
  const restoDelDia = usePlanRestoDelDia(uid, requerimiento, registroHoy);

  const saludo = obtenerSaludo();

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.saludo}>{saludo}</Text>
        <Text style={styles.correo}>{correo ?? 'Usuario VitalAI'}</Text>

        {/* Tarjeta de objetivo calorico */}
        <Tarjeta estilo={styles.tarjetaPrincipal}>
          <Text style={styles.tarjetaEtiqueta}>Objetivo calorico diario</Text>
          <Text style={styles.calorias}>
            {requerimiento.caloriasObjetivo}
            <Text style={styles.caloriasUnidad}> kcal</Text>
          </Text>
          <View style={styles.macros}>
            <Macro
              etiqueta="Proteina"
              valor={`${requerimiento.proteinasG} g`}
            />
            <Macro
              etiqueta="Carbos"
              valor={`${requerimiento.carbohidratosG} g`}
            />
            <Macro etiqueta="Grasa" valor={`${requerimiento.grasasG} g`} />
          </View>
        </Tarjeta>

        {caloriasRegistradas > 0 && restoDelDia.comidas.length > 0 && (
          <Pressable onPress={() => router.push('/(tabs)/nutricion')}>
            <Tarjeta estilo={styles.restoCard}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
              <View style={styles.restoInfo}>
                <Text style={styles.restoTitulo}>Resto de tu día: {Math.max(0, restoDelDia.restante.calorias)} kcal</Text>
                <Text style={styles.restoTexto}>{restoDelDia.comidas.map((c) => `${c.momento} ${c.aporte.calorias} kcal`).join(' · ')} — toca para ver tu plan ajustado</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Tarjeta>
          </Pressable>
        )}

        <Text style={styles.seccion}>Tu progreso</Text>

        <View style={styles.fila}>
          <TarjetaMetrica
            icono="scale-outline"
            valor={`${resumen.pesoActualKg} kg`}
            etiqueta="Peso actual"
          />
          <TarjetaMetrica
            icono="checkmark-circle-outline"
            valor={`${resumen.adherenciaPorcentaje}%`}
            etiqueta="Adherencia"
          />
        </View>
        <View style={styles.fila}>
          <TarjetaMetrica
            icono="calendar-outline"
            valor={`${resumen.diasRegistrados}`}
            etiqueta="Dias registrados"
          />
          <TarjetaMetrica
            icono="flame-outline"
            valor={`${resumen.caloriasPromedio}`}
            etiqueta="Kcal promedio"
          />
        </View>

        <Text style={styles.seccion}>Coach VitalAI</Text>
        <Pressable onPress={() => router.push('/asistente')} accessibilityRole="button" accessibilityLabel="Abrir el coach">
          <Tarjeta estilo={styles.asistenteCard}>
            <View style={styles.asistenteEncabezado}>
              <View style={styles.asistenteIcono}><Ionicons name="sparkles" size={19} color={Colors.textOnPrimary} /></View>
              <View style={styles.asistenteInfo}>
                <Text style={styles.asistenteNombre}>Habla con tu coach</Text>
                <Text style={styles.asistenteEstado}>Cuéntale qué comiste y él lo registra por ti</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </Tarjeta>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.preguntas}>
          {['¿Qué como ahora?', '¿Cómo voy hoy?', '¿Cómo va mi progreso?'].map((pregunta) => (
            <Pressable key={pregunta} onPress={() => router.push({ pathname: '/asistente', params: { q: pregunta } })} style={styles.pregunta}>
              <Text style={styles.preguntaTexto}>{pregunta}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.nota}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.info}
          />
          <Text style={styles.notaTexto}>
            Tus indicadores se calculan con lo que registras en Nutricion,
            Entreno y Progreso. Registra cada dia para mejorar tus recomendaciones.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Devuelve un saludo segun la hora del dia. */
function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos dias';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Item de macronutriente dentro de la tarjeta principal. */
function Macro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValor}>{valor}</Text>
      <Text style={styles.macroEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

/** Tarjeta compacta de metrica del dashboard. */
function TarjetaMetrica({
  icono,
  valor,
  etiqueta,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  valor: string;
  etiqueta: string;
}) {
  return (
    <Tarjeta estilo={styles.metrica}>
      <Ionicons name={icono} size={22} color={Colors.primary} />
      <Text style={styles.metricaValor}>{valor}</Text>
      <Text style={styles.metricaEtiqueta}>{etiqueta}</Text>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  saludo: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  correo: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  tarjetaPrincipal: {
    backgroundColor: Colors.primary,
    marginTop: Spacing.xl,
  },
  tarjetaEtiqueta: {
    ...Typography.label,
    color: Colors.textOnPrimary,
    opacity: 0.9,
  },
  calorias: {
    ...Typography.display,
    color: Colors.textOnPrimary,
    marginTop: Spacing.xs,
  },
  caloriasUnidad: {
    ...Typography.subtitle,
    color: Colors.textOnPrimary,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    paddingTop: Spacing.md,
  },
  macro: {
    alignItems: 'center',
    flex: 1,
  },
  macroValor: {
    ...Typography.bodyStrong,
    color: Colors.textOnPrimary,
  },
  macroEtiqueta: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    opacity: 0.85,
  },
  seccion: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metrica: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricaValor: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  metricaEtiqueta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  nota: {
    flexDirection: 'row',
    backgroundColor: '#EAF1FF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  restoCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.primaryLight },
  restoInfo: { flex: 1 },
  restoTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary },
  restoTexto: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  notaTexto: {
    ...Typography.caption,
    color: Colors.info,
    flex: 1,
  },
  asistenteCard: { borderWidth: 1, borderColor: Colors.primaryLight },
  asistenteInfo: { flex: 1 },
  asistenteEncabezado: { flexDirection: 'row', alignItems: 'center' },
  asistenteIcono: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  asistenteNombre: { ...Typography.bodyStrong, color: Colors.textPrimary },
  asistenteEstado: { ...Typography.caption, color: Colors.success, marginTop: 2 },
  preguntas: { gap: Spacing.sm, paddingVertical: Spacing.md },
  pregunta: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  preguntaTexto: { ...Typography.caption, color: Colors.primary },
});
