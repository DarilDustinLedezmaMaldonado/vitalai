/**
 * VitalAI - Pantalla de Inicio (Dashboard)
 *
 * Pantalla principal tras el inicio de sesion. Resume el objetivo nutricional
 * y los indicadores calculados con el historial guardado del usuario.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import { useAuth } from '@/context/AuthContext';
import { useHistorialUsuario } from '@/hooks/useHistorialUsuario';
import { usePlanRestoDelDia } from '@/hooks/usePlanRestoDelDia';
import { alimentosUSDA } from '@/data/alimentosUSDA';
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
  const [entradaAsistente, setEntradaAsistente] = useState('');
  const [mensajesAsistente, setMensajesAsistente] = useState([
    { id: 'saludo', autor: 'asistente', texto: 'Hola. Soy tu asistente de VitalAI. Pregúntame sobre tu meta, alimentación o progreso.' },
  ]);
  const caloriasRegistradas = registroHoy?.caloriasConsumidas ?? 0;
  const restoDelDia = usePlanRestoDelDia(uid, requerimiento, registroHoy);
  const vasosAgua = registroHoy?.vasosAgua ?? 0;

  function preguntar(pregunta: string) {
    const texto = pregunta.toLowerCase();
    const restantes = requerimiento.caloriasObjetivo - caloriasRegistradas;
    let respuesta = `Tu meta de hoy es ${requerimiento.caloriasObjetivo} kcal. Te quedan aproximadamente ${restantes} kcal por registrar.`;
    if (texto.includes('prote') || texto.includes('musculo')) respuesta = `Para tu objetivo, tu referencia diaria es ${requerimiento.proteinasG} g de proteína. Distribúyela entre tus comidas con huevo, pollo, lenteja o quinua.`;
    if (texto.includes('agua') || texto.includes('hidrat')) respuesta = vasosAgua > 0 ? `Hoy llevas ${vasosAgua} de 8 vasos de agua. ${vasosAgua >= 8 ? '¡Meta cumplida!' : `Te faltan ${8 - vasosAgua}.`}` : `Aún no registras agua hoy. En Nutrición puedes llevar el control de tus 8 vasos diarios.`;
    if (/(que|qué) (como|ceno|meriendo)|recalcul|resto del d|hambre|me queda/.test(texto)) {
      const detalle = restoDelDia.comidas.map((c) => `${c.momento} (${c.aporte.calorias} kcal): ${c.alimentos.map((a) => `${alimentosUSDA.find((x) => x.id === a.alimentoId)?.nombre ?? a.alimentoId} ${a.gramos} g`).join(', ')}.`).join(' ');
      respuesta = `${restoDelDia.mensaje}${detalle ? ` ${detalle}` : ''}`;
    }
    if (texto.includes('progreso') || texto.includes('peso')) respuesta = resumen.diasRegistrados > 0 ? `Tu peso actual registrado es ${resumen.pesoActualKg} kg y tu adherencia es ${resumen.adherenciaPorcentaje}% en ${resumen.diasRegistrados} días registrados.` : `Aún no tienes días registrados. Registra tus comidas en Nutrición y tu peso en Progreso.`;
    setMensajesAsistente((actuales) => [...actuales, { id: `${Date.now()}u`, autor: 'usuario', texto: pregunta }, { id: `${Date.now()}a`, autor: 'asistente', texto: respuesta }].slice(-5));
    setEntradaAsistente('');
  }

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

        <Text style={styles.seccion}>Asistente VitalAI</Text>
        <Tarjeta estilo={styles.asistenteCard}>
          <View style={styles.asistenteEncabezado}><View style={styles.asistenteIcono}><Ionicons name="sparkles" size={19} color={Colors.textOnPrimary} /></View><View><Text style={styles.asistenteNombre}>Coach nutricional</Text><Text style={styles.asistenteEstado}>Disponible para ayudarte</Text></View></View>
          <View style={styles.chat}>{mensajesAsistente.map((mensaje) => <View key={mensaje.id} style={[styles.burbuja, mensaje.autor === 'usuario' ? styles.burbujaUsuario : styles.burbujaAsistente]}><Text style={[styles.burbujaTexto, mensaje.autor === 'usuario' && styles.burbujaTextoUsuario]}>{mensaje.texto}</Text></View>)}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.preguntas}>{['¿Qué como ahora?', '¿Cuál es mi meta?', '¿Cómo aumento proteína?', '¿Cómo va mi progreso?'].map((pregunta) => <Pressable key={pregunta} onPress={() => preguntar(pregunta)} style={styles.pregunta}><Text style={styles.preguntaTexto}>{pregunta}</Text></Pressable>)}</ScrollView>
          <View style={styles.chatEntrada}><TextInput value={entradaAsistente} onChangeText={setEntradaAsistente} onSubmitEditing={() => entradaAsistente.trim() && preguntar(entradaAsistente.trim())} placeholder="Escribe una pregunta..." placeholderTextColor={Colors.textMuted} style={styles.chatInput} /><Pressable onPress={() => entradaAsistente.trim() && preguntar(entradaAsistente.trim())} style={styles.enviarBoton}><Ionicons name="send" size={16} color={Colors.textOnPrimary} /></Pressable></View>
        </Tarjeta>

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
  asistenteEncabezado: { flexDirection: 'row', alignItems: 'center' },
  asistenteIcono: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  asistenteNombre: { ...Typography.bodyStrong, color: Colors.textPrimary },
  asistenteEstado: { ...Typography.caption, color: Colors.success, marginTop: 2 },
  chat: { gap: Spacing.sm, marginTop: Spacing.md },
  burbuja: { maxWidth: '88%', borderRadius: Radius.md, padding: Spacing.md },
  burbujaAsistente: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt },
  burbujaUsuario: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  burbujaTexto: { ...Typography.caption, color: Colors.textPrimary },
  burbujaTextoUsuario: { color: Colors.textOnPrimary },
  preguntas: { gap: Spacing.sm, paddingVertical: Spacing.md },
  pregunta: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  preguntaTexto: { ...Typography.caption, color: Colors.primary },
  chatEntrada: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingLeft: Spacing.md },
  chatInput: { flex: 1, height: 40, ...Typography.caption, color: Colors.textPrimary },
  enviarBoton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
});
