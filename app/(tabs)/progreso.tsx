/** VitalAI - Seguimiento y analisis de progreso. */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import { perfilesDemo, registrosDemo } from '@/data/datasetDemo';
import { calcularResumenProgreso } from '@/services/analisisService';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

const perfilDemo = perfilesDemo[0];

export default function Progreso() {
  const { perfil } = useAuth();
  const perfilActual = perfil ?? perfilDemo;
  const [vista, setVista] = useState<'peso' | 'habitos'>('peso');
  const resumen = useMemo(() => calcularResumenProgreso(perfilActual, registrosDemo), [perfilActual]);
  const registros = registrosDemo.filter((registro) => registro.idUsuario === perfilActual.idUsuario);
  const pesos = registros.map((registro) => registro.pesoKg);
  const pesoMinimo = (pesos.length > 0 ? Math.min(...pesos) : perfilActual.pesoInicialKg) - 0.2;
  const pesoMaximo = (pesos.length > 0 ? Math.max(...pesos) : perfilActual.pesoInicialKg) + 0.2;

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.encabezado}>Mi progreso</Text>
        <Text style={styles.subencabezado}>Tus datos convierten el esfuerzo en señales claras.</Text>
        <View style={styles.metricas}>
          <Metrica icono="scale-outline" valor={`${resumen.pesoActualKg} kg`} etiqueta="Peso actual" />
          <Metrica icono="trending-down-outline" valor={`${Math.abs(resumen.variacionPesoKg)} kg`} etiqueta="Cambio" positivo={resumen.variacionPesoKg <= 0} />
          <Metrica icono="checkmark-circle-outline" valor={`${resumen.adherenciaPorcentaje}%`} etiqueta="Adherencia" />
        </View>
        <Tarjeta estilo={styles.graficoCard}>
          <View style={styles.tituloFila}><View><Text style={styles.cardTitulo}>Tendencia de seguimiento</Text><Text style={styles.cardSubtitulo}>Abril 2026</Text></View><Ionicons name="analytics-outline" size={24} color={Colors.primary} /></View>
          <View style={styles.segmentos}><Segmento titulo="Peso" activo={vista === 'peso'} onPress={() => setVista('peso')} /><Segmento titulo="Habitos" activo={vista === 'habitos'} onPress={() => setVista('habitos')} /></View>
          {vista === 'peso' ? (
            <View style={styles.grafico}>{registros.map((registro) => { const altura = ((registro.pesoKg - pesoMinimo) / (pesoMaximo - pesoMinimo)) * 86 + 18; return <View key={registro.idRegistro} style={styles.puntoColumna}><View style={[styles.punto, { marginTop: 120 - altura }]} /><View style={styles.lineaBase} /><Text style={styles.etiquetaGrafico}>{registro.fecha.slice(8)}</Text><Text style={styles.valorGrafico}>{registro.pesoKg}</Text></View>; })}</View>
          ) : (
            <View style={styles.habitos}><Habito icono="water-outline" titulo="Hidratacion" valor="6 / 8 vasos" porcentaje={75} color={Colors.info} /><Habito icono="walk-outline" titulo="Actividad" valor="6.200 pasos" porcentaje={62} color={Colors.primary} /><Habito icono="restaurant-outline" titulo="Plan nutricional" valor="1 de 2 dias" porcentaje={50} color={Colors.success} /></View>
          )}
        </Tarjeta>
        <Text style={styles.seccion}>Resumen del periodo</Text>
        <Tarjeta estilo={styles.resumenCard}><ResumenFila etiqueta="Dias registrados" valor={`${resumen.diasRegistrados} dias`} /><ResumenFila etiqueta="Promedio calorico" valor={`${resumen.caloriasPromedio} kcal`} /><ResumenFila etiqueta="Objetivo actual" valor="Perdida de grasa" /><ResumenFila etiqueta="Lectura" valor={resumen.variacionPesoKg <= 0 ? 'Tendencia favorable' : 'Revisa tu plan'} ultimo /></Tarjeta>
        <View style={styles.insight}><Ionicons name="sparkles-outline" size={20} color={Colors.primary} /><Text style={styles.insightTexto}>Tu adherencia es el indicador mas importante. Registra tus datos cada dia para recibir recomendaciones mas precisas.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metrica({ icono, valor, etiqueta, positivo = true }: { icono: keyof typeof Ionicons.glyphMap; valor: string; etiqueta: string; positivo?: boolean }) {
  return <Tarjeta estilo={styles.metrica}><Ionicons name={icono} size={20} color={positivo ? Colors.primary : Colors.danger} /><Text style={styles.metricaValor}>{valor}</Text><Text style={styles.metricaEtiqueta}>{etiqueta}</Text></Tarjeta>;
}

function Segmento({ titulo, activo, onPress }: { titulo: string; activo: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.segmento, activo && styles.segmentoActivo]}><Text style={[styles.segmentoTexto, activo && styles.segmentoTextoActivo]}>{titulo}</Text></Pressable>;
}

function Habito({ icono, titulo, valor, porcentaje, color }: { icono: keyof typeof Ionicons.glyphMap; titulo: string; valor: string; porcentaje: number; color: string }) {
  return <View style={styles.habito}><Ionicons name={icono} size={20} color={color} /><View style={styles.habitoInfo}><View style={styles.habitoFila}><Text style={styles.habitoTitulo}>{titulo}</Text><Text style={styles.habitoValor}>{valor}</Text></View><View style={styles.progresoFondo}><View style={[styles.progresoBarra, { width: `${porcentaje}%`, backgroundColor: color }]} /></View></View></View>;
}

function ResumenFila({ etiqueta, valor, ultimo = false }: { etiqueta: string; valor: string; ultimo?: boolean }) {
  return <View style={[styles.resumenFila, !ultimo && styles.resumenBorde]}><Text style={styles.resumenEtiqueta}>{etiqueta}</Text><Text style={styles.resumenValor}>{valor}</Text></View>;
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  encabezado: { ...Typography.title, color: Colors.textPrimary },
  subencabezado: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  metricas: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  metrica: { flex: 1, padding: Spacing.md },
  metricaValor: { ...Typography.bodyStrong, color: Colors.textPrimary, marginTop: Spacing.sm },
  metricaEtiqueta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  graficoCard: { marginTop: Spacing.lg },
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary },
  cardSubtitulo: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  segmentos: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: Radius.sm, padding: 3, marginTop: Spacing.lg },
  segmento: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.sm },
  segmentoActivo: { backgroundColor: Colors.surface },
  segmentoTexto: { ...Typography.caption, color: Colors.textSecondary },
  segmentoTextoActivo: { color: Colors.primary },
  grafico: { height: 170, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: Spacing.lg },
  puntoColumna: { alignItems: 'center', width: 70 },
  punto: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.primaryLight },
  lineaBase: { height: 100, width: 2, backgroundColor: Colors.primaryLight, marginTop: -7 },
  etiquetaGrafico: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
  valorGrafico: { ...Typography.caption, color: Colors.textPrimary, marginTop: 2 },
  habitos: { marginTop: Spacing.lg, gap: Spacing.lg },
  habito: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  habitoInfo: { flex: 1 },
  habitoFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  habitoTitulo: { ...Typography.caption, color: Colors.textPrimary },
  habitoValor: { ...Typography.caption, color: Colors.textSecondary },
  progresoFondo: { height: 7, borderRadius: 4, backgroundColor: Colors.background, overflow: 'hidden' },
  progresoBarra: { height: '100%', borderRadius: 4 },
  seccion: { ...Typography.sectionTitle, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  resumenCard: { paddingVertical: Spacing.sm },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  resumenBorde: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  resumenEtiqueta: { ...Typography.body, color: Colors.textSecondary },
  resumenValor: { ...Typography.bodyStrong, color: Colors.textPrimary },
  insight: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm },
  insightTexto: { ...Typography.caption, color: Colors.primaryDark, flex: 1 },
});