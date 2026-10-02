/** VitalAI - Seguimiento y analisis de progreso. */

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import GraficoLinea from '@/components/GraficoLinea';
import { calcularResumenProgreso } from '@/services/analisisService';
import { fechaLocal, guardarRegistroDia } from '@/services/datosService';
import { useHistorialUsuario } from '@/hooks/useHistorialUsuario';
import { ObjetivoComposicion } from '@/types/dataset';
import { hapticaExito } from '@/utils/haptica';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

const DIAS_GRAFICO = 7;
const META_VASOS = 8;
const META_PASOS = 8000;

const NOMBRE_OBJETIVO: Record<ObjetivoComposicion, string> = {
  perdida_grasa: 'Pérdida de grasa',
  ganancia_muscular: 'Ganancia muscular',
  mantenimiento: 'Mantenimiento',
};

export default function Progreso() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const { perfilActual, registros, cargando, error, recargar } = useHistorialUsuario();
  const [vista, setVista] = useState<'peso' | 'habitos'>('peso');
  const [pesoHoy, setPesoHoy] = useState('');
  const [mensajePeso, setMensajePeso] = useState('');
  const [guardandoPeso, setGuardandoPeso] = useState(false);
  const resumen = useMemo(() => calcularResumenProgreso(perfilActual, registros), [perfilActual.idUsuario, perfilActual.pesoInicialKg, registros]);

  const pesajes = registros.filter((registro) => registro.pesoKg > 0).slice(-DIAS_GRAFICO);

  // Habitos de los ultimos 7 dias con registro.
  const recientes = registros.slice(-DIAS_GRAFICO);
  const promedio = (valores: number[]) => (valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0);
  const vasosPromedio = promedio(recientes.map((registro) => registro.vasosAgua));
  const pasosPromedio = promedio(recientes.map((registro) => registro.pasos));
  const diasCumplidos = recientes.filter((registro) => registro.cumplioPlan).length;

  async function registrarPeso() {
    const valor = Number(pesoHoy.replace(',', '.'));
    if (!Number.isFinite(valor) || valor < 30 || valor > 300) {
      setMensajePeso('Ingresa un peso válido entre 30 y 300 kg.');
      return;
    }
    setGuardandoPeso(true);
    try {
      await guardarRegistroDia(perfilActual.idUsuario, { pesoKg: valor }, fechaLocal());
      setPesoHoy('');
      setMensajePeso('Peso de hoy guardado.');
      hapticaExito();
      await recargar();
    } catch {
      setMensajePeso('No se pudo guardar el peso. Revisa tu conexión.');
    } finally {
      setGuardandoPeso(false);
    }
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.encabezado}>Mi progreso</Text>
        <Text style={styles.subencabezado}>Tus datos convierten el esfuerzo en señales claras.</Text>
        {error ? <Text style={styles.estadoError}>{error}</Text> : null}
        <View style={styles.metricas}>
          <Metrica icono="scale-outline" valor={`${resumen.pesoActualKg} kg`} etiqueta="Peso actual" />
          <Metrica icono={resumen.variacionPesoKg <= 0 ? 'trending-down-outline' : 'trending-up-outline'} valor={`${Math.abs(resumen.variacionPesoKg)} kg`} etiqueta="Cambio" positivo={perfilActual.objetivo === 'ganancia_muscular' ? resumen.variacionPesoKg >= 0 : resumen.variacionPesoKg <= 0} />
          <Metrica icono="checkmark-circle-outline" valor={`${resumen.adherenciaPorcentaje}%`} etiqueta="Adherencia" />
        </View>

        <Tarjeta estilo={styles.pesoCard}>
          <Text style={styles.cardTitulo}>Registrar peso de hoy</Text>
          <View style={styles.pesoFila}>
            <TextInput value={pesoHoy} onChangeText={setPesoHoy} keyboardType="decimal-pad" placeholder="Ej. 68.5" placeholderTextColor={Colors.textMuted} style={styles.pesoInput} />
            <Text style={styles.pesoUnidad}>kg</Text>
            <Pressable onPress={registrarPeso} disabled={guardandoPeso} style={[styles.pesoBoton, guardandoPeso && styles.pesoBotonInactivo]}>
              <Ionicons name="save-outline" size={20} color={Colors.textOnPrimary} />
            </Pressable>
          </View>
          {mensajePeso ? <Text style={styles.pesoMensaje}>{mensajePeso}</Text> : null}
        </Tarjeta>

        <Tarjeta estilo={styles.graficoCard}>
          <View style={styles.tituloFila}><View><Text style={styles.cardTitulo}>Tendencia de seguimiento</Text><Text style={styles.cardSubtitulo}>{cargando ? 'Cargando...' : `Últimos ${DIAS_GRAFICO} registros`}</Text></View><Ionicons name="analytics-outline" size={24} color={Colors.primary} /></View>
          <View style={styles.segmentos}><Segmento titulo="Peso" activo={vista === 'peso'} onPress={() => setVista('peso')} /><Segmento titulo="Hábitos" activo={vista === 'habitos'} onPress={() => setVista('habitos')} /></View>
          {vista === 'peso' ? (
            pesajes.length === 0 ? (
              <Text style={styles.vacio}>Aún no registras tu peso. Hazlo arriba para ver tu tendencia.</Text>
            ) : (
              <View style={styles.graficoContenedor}>
                <GraficoLinea unidad="kg" puntos={pesajes.map((registro) => ({ etiqueta: `${registro.fecha.slice(8)}/${registro.fecha.slice(5, 7)}`, valor: registro.pesoKg }))} />
              </View>
            )
          ) : recientes.length === 0 ? (
            <Text style={styles.vacio}>Registra comidas e hidratación en Nutrición para ver tus hábitos.</Text>
          ) : (
            <View style={styles.habitos}>
              <Habito icono="water-outline" titulo="Hidratación (promedio)" valor={`${vasosPromedio.toFixed(1)} / ${META_VASOS} vasos`} porcentaje={Math.min(100, (vasosPromedio / META_VASOS) * 100)} color={Colors.info} />
              <Habito icono="walk-outline" titulo="Actividad (promedio)" valor={pasosPromedio > 0 ? `${Math.round(pasosPromedio).toLocaleString('es-BO')} pasos` : 'Disponible con Google Fit'} porcentaje={Math.min(100, (pasosPromedio / META_PASOS) * 100)} color={Colors.primary} />
              <Habito icono="restaurant-outline" titulo="Meta calórica cumplida" valor={`${diasCumplidos} de ${recientes.length} días`} porcentaje={(diasCumplidos / recientes.length) * 100} color={Colors.success} />
            </View>
          )}
        </Tarjeta>
        <Text style={styles.seccion}>Resumen del periodo</Text>
        <Tarjeta estilo={styles.resumenCard}><ResumenFila etiqueta="Días registrados" valor={`${resumen.diasRegistrados} días`} /><ResumenFila etiqueta="Promedio calórico" valor={`${resumen.caloriasPromedio} kcal`} /><ResumenFila etiqueta="Objetivo actual" valor={NOMBRE_OBJETIVO[perfilActual.objetivo]} /><ResumenFila etiqueta="Lectura" valor={resumen.diasRegistrados === 0 ? 'Sin datos aún' : resumen.adherenciaPorcentaje >= 70 ? 'Tendencia favorable' : 'Revisa tu plan'} ultimo /></Tarjeta>
        <View style={styles.insight}><Ionicons name="sparkles-outline" size={20} color={Colors.primary} /><Text style={styles.insightTexto}>Tu adherencia es el indicador más importante. Un día cuenta como cumplido cuando tus calorias quedan dentro de ±10 % de tu meta.</Text></View>
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

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  encabezado: { ...Typography.title, color: Colors.textPrimary },
  subencabezado: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  estadoError: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  pesoCard: { marginTop: Spacing.lg },
  pesoFila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  pesoInput: { flex: 1, minWidth: 0, width: '100%', height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, color: Colors.textPrimary, ...Typography.body },
  pesoUnidad: { ...Typography.bodyStrong, color: Colors.textSecondary },
  pesoBoton: { width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  pesoBotonInactivo: { opacity: 0.6 },
  pesoMensaje: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
  vacio: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' },
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
  graficoContenedor: { marginTop: Spacing.lg },
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
}));