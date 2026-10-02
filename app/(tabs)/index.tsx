/**
 * VitalAI - Pantalla de Inicio (Dashboard)
 *
 * Resume el dia del usuario al estilo Google Fit: anillos de calorias y agua,
 * macronutrientes consumidos frente a la meta, plan del resto del dia,
 * indicadores de progreso y acceso al coach.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tarjeta } from '@/components/Tarjeta';
import Presionable from '@/components/Presionable';
import AnilloProgreso from '@/components/AnilloProgreso';
import { useAuth } from '@/context/AuthContext';
import { useHistorialUsuario } from '@/hooks/useHistorialUsuario';
import { usePlanRestoDelDia } from '@/hooks/usePlanRestoDelDia';
import { calcularResumenProgreso } from '@/services/analisisService';
import { fechaLocal } from '@/services/datosService';
import { calcularRequerimiento } from '@/utils/calculoNutricional';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

const META_VASOS = 8;
const PREGUNTAS_RAPIDAS = ['¿Qué como ahora?', '¿Cómo voy hoy?', '¿Cómo va mi progreso?'];

export default function Inicio() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const { correo, uid, perfil } = useAuth();
  const router = useRouter();
  const { perfilActual, registros } = useHistorialUsuario();
  const resumen = calcularResumenProgreso(perfilActual, registros);
  const registroHoy = registros.find((registro) => registro.fecha === fechaLocal());
  const requerimiento = calcularRequerimiento(perfilActual);
  const restoDelDia = usePlanRestoDelDia(uid, requerimiento, registroHoy);

  const consumidas = registroHoy?.caloriasConsumidas ?? 0;
  const vasos = registroHoy?.vasosAgua ?? 0;
  const restantes = requerimiento.caloriasObjetivo - consumidas;
  // Primer nombre del perfil; el correo solo si no hay nombre (plan 01).
  const nombre = perfil?.nombre?.trim().split(/\s+/)[0] || correo || 'Usuario VitalAI';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.contenedor} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.encabezado}>
          <View style={styles.encabezadoTexto}>
            <Text style={styles.saludo}>{obtenerSaludo()}</Text>
            <Text style={styles.nombre} numberOfLines={1}>{nombre}</Text>
          </View>
          <Presionable onPress={() => router.push('/(tabs)/perfil')} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Ir a mi perfil">
            <Text style={styles.avatarTexto}>{inicial}</Text>
          </Presionable>
        </View>

        {/* Hoy: anillos de calorias (exterior) y agua (interior). */}
        <Tarjeta estilo={styles.hoy}>
          <View style={styles.hoyFila}>
            <AnilloProgreso
              tamano={148}
              grosor={13}
              anillos={[
                { valor: consumidas, meta: requerimiento.caloriasObjetivo, color: Colors.metrica.calorias, pista: Colors.accentContainer },
                { valor: vasos, meta: META_VASOS, color: Colors.metrica.agua, pista: Colors.aguaContainer },
              ]}
            >
              <Text style={styles.anilloValor}>{consumidas}</Text>
              <Text style={styles.anilloUnidad}>kcal</Text>
            </AnilloProgreso>
            <View style={styles.leyenda}>
              <Leyenda color={Colors.metrica.calorias} valor={`${consumidas} / ${requerimiento.caloriasObjetivo}`} etiqueta="Calorías" />
              <Leyenda color={Colors.metrica.agua} valor={`${vasos} / ${META_VASOS}`} etiqueta="Vasos de agua" />
              <Text style={styles.restantes}>
                {restantes >= 0 ? `Te quedan ${restantes} kcal` : `Superaste tu meta por ${-restantes} kcal`}
              </Text>
            </View>
          </View>
          <View style={styles.divisor} />
          <View style={styles.macros}>
            <BarraMacro etiqueta="Proteína" color={Colors.metrica.proteina} valor={registroHoy?.proteinasG ?? 0} meta={requerimiento.proteinasG} />
            <BarraMacro etiqueta="Carbos" color={Colors.metrica.carbohidratos} valor={registroHoy?.carbohidratosG ?? 0} meta={requerimiento.carbohidratosG} />
            <BarraMacro etiqueta="Grasas" color={Colors.metrica.grasas} valor={registroHoy?.grasasG ?? 0} meta={requerimiento.grasasG} />
          </View>
        </Tarjeta>

        {consumidas > 0 && restoDelDia.comidas.length > 0 && (
          <Presionable onPress={() => router.push('/(tabs)/nutricion')} style={styles.resto} accessibilityRole="button">
            <View style={styles.restoIcono}><Ionicons name="time" size={20} color={Colors.onPrimaryContainer} /></View>
            <View style={styles.flex}>
              <Text style={styles.restoTitulo}>Resto de tu día · {Math.max(0, restoDelDia.restante.calorias)} kcal</Text>
              <Text style={styles.restoTexto}>{restoDelDia.comidas.map((c) => `${c.momento} ${c.aporte.calorias} kcal`).join(' · ')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.onPrimaryContainer} />
          </Presionable>
        )}

        <Text style={styles.seccion}>Tu progreso</Text>
        <View style={styles.cuadricula}>
          <Metrica icono="scale-outline" valor={`${resumen.pesoActualKg} kg`} etiqueta="Peso actual" />
          <Metrica icono="checkmark-circle-outline" valor={`${resumen.adherenciaPorcentaje}%`} etiqueta="Adherencia" />
          <Metrica icono="calendar-outline" valor={`${resumen.diasRegistrados}`} etiqueta="Días registrados" />
          <Metrica icono="flame-outline" valor={`${resumen.caloriasPromedio}`} etiqueta="Kcal promedio" />
        </View>

        <Text style={styles.seccion}>Coach VitalAI</Text>
        <Presionable onPress={() => router.push('/asistente')} style={styles.coach} accessibilityRole="button" accessibilityLabel="Abrir el coach">
          <View style={styles.coachIcono}><Ionicons name="sparkles" size={20} color={Colors.textOnPrimary} /></View>
          <View style={styles.flex}>
            <Text style={styles.coachTitulo}>Habla con tu coach</Text>
            <Text style={styles.coachTexto}>Cuéntale qué comiste y él lo registra por ti</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Presionable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsFila} contentContainerStyle={styles.chips}>
          {PREGUNTAS_RAPIDAS.map((pregunta) => (
            <Presionable key={pregunta} onPress={() => router.push({ pathname: '/asistente', params: { q: pregunta } })} style={styles.chip}>
              <Text style={styles.chipTexto}>{pregunta}</Text>
            </Presionable>
          ))}
        </ScrollView>

        <View style={styles.nota}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
          <Text style={styles.notaTexto}>
            Tus indicadores se calculan con lo que registras en Nutrición, Entreno y Progreso.
            Registra cada día para mejorar tus recomendaciones.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Saludo según la hora del día. */
function obtenerSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function Leyenda({ color, valor, etiqueta }: { color: string; valor: string; etiqueta: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <View>
        <Text style={styles.leyendaValor}>{valor}</Text>
        <Text style={styles.leyendaEtiqueta}>{etiqueta}</Text>
      </View>
    </View>
  );
}

/** Macronutriente consumido frente a su meta, con barra de progreso. */
function BarraMacro({ etiqueta, valor, meta, color }: { etiqueta: string; valor: number; meta: number; color: string }) {
  const porcentaje = meta > 0 ? Math.min(100, (valor / meta) * 100) : 0;
  return (
    <View style={styles.macro}>
      <Text style={styles.macroEtiqueta}>{etiqueta}</Text>
      <View style={styles.barraFondo}><View style={[styles.barra, { width: `${porcentaje}%`, backgroundColor: color }]} /></View>
      <Text style={styles.macroValor}>{Math.round(valor)}<Text style={styles.macroMeta}> / {meta} g</Text></Text>
    </View>
  );
}

function Metrica({ icono, valor, etiqueta }: { icono: keyof typeof Ionicons.glyphMap; valor: string; etiqueta: string }) {
  return (
    <Tarjeta variante="tonal" estilo={styles.metrica}>
      <Ionicons name={icono} size={20} color={Colors.primaryDark} />
      <Text style={styles.metricaValor}>{valor}</Text>
      <Text style={styles.metricaEtiqueta}>{etiqueta}</Text>
    </Tarjeta>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  flex: { flex: 1 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  encabezadoTexto: { flex: 1 },
  saludo: { ...Typography.body, color: Colors.textSecondary },
  nombre: { ...Typography.title, color: Colors.textPrimary },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { ...Typography.sectionTitle, color: Colors.textOnPrimary },
  hoy: { padding: Spacing.xl },
  hoyFila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  anilloValor: { ...Typography.subtitle, color: Colors.textPrimary },
  anilloUnidad: { ...Typography.caption, color: Colors.textSecondary, marginTop: -2 },
  leyenda: { flex: 1, gap: Spacing.md },
  leyendaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 7 },
  leyendaValor: { ...Typography.bodyStrong, color: Colors.textPrimary },
  leyendaEtiqueta: { ...Typography.caption, color: Colors.textSecondary },
  restantes: { ...Typography.label, color: Colors.accentDark },
  divisor: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  macros: { flexDirection: 'row', gap: Spacing.md },
  macro: { flex: 1, gap: 6 },
  macroEtiqueta: { ...Typography.caption, color: Colors.textSecondary },
  barraFondo: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceContainer, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 3 },
  macroValor: { ...Typography.label, color: Colors.textPrimary },
  macroMeta: { fontFamily: Typography.caption.fontFamily, color: Colors.textMuted },
  resto: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primaryContainer, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.md },
  restoIcono: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  restoTitulo: { ...Typography.bodyStrong, color: Colors.onPrimaryContainer },
  restoTexto: { ...Typography.caption, color: Colors.onPrimaryContainer, opacity: 0.85 },
  seccion: { ...Typography.sectionTitle, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metrica: { width: '47.5%', flexGrow: 1, gap: Spacing.xs },
  metricaValor: { ...Typography.subtitle, color: Colors.textPrimary, marginTop: Spacing.sm },
  metricaEtiqueta: { ...Typography.caption, color: Colors.textSecondary },
  coach: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  coachIcono: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  coachTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary },
  // Plan 03: texto secundario, no el verde reservado para "meta cumplida".
  coachTexto: { ...Typography.caption, color: Colors.textSecondary },
  chipsFila: { flexGrow: 0, marginTop: Spacing.md, marginHorizontal: -Layout.screenPadding },
  chips: { gap: Spacing.sm, paddingHorizontal: Layout.screenPadding },
  chip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  chipTexto: { ...Typography.label, color: Colors.textSecondary },
  nota: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.infoContainer, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.xl },
  notaTexto: { ...Typography.caption, color: Colors.textPrimary, flex: 1 },
}));
