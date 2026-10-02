/** VitalAI - Planificador y seguimiento de entrenamiento. */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import { hapticaExito, hapticaSeleccion } from '@/utils/haptica';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import { useDatoPersistente } from '@/hooks/useDatoPersistente';
import {
  guardarConfiguracion,
  guardarSemanaEntrenamiento,
  inicioSemana,
  obtenerConfiguracion,
  obtenerSemanaEntrenamiento,
} from '@/services/datosService';

interface Ejercicio {
  id: string;
  nombre: string;
  series: number;
  repeticiones: string;
  descanso: number;
}

interface Rutina {
  id: string;
  dia: string;
  foco: string;
  nivel: 'Inicial' | 'Intermedio';
  objetivo: 'Fuerza' | 'Cardio' | 'Movilidad';
  duracion: number;
  icono: keyof typeof Ionicons.glyphMap;
  ejercicios: Ejercicio[];
}

interface PlanPersonalizado extends Rutina {}

const RUTINAS: Rutina[] = [
  { id: 'lunes', dia: 'Lunes', foco: 'Fuerza de tren inferior', nivel: 'Inicial', objetivo: 'Fuerza', duracion: 35, icono: 'body-outline', ejercicios: [{ id: 'sentadilla', nombre: 'Sentadilla', series: 3, repeticiones: '12 repeticiones', descanso: 60 }, { id: 'puente', nombre: 'Puente de glúteo', series: 3, repeticiones: '15 repeticiones', descanso: 45 }, { id: 'zancadas', nombre: 'Zancadas', series: 3, repeticiones: '10 por pierna', descanso: 60 }] },
  { id: 'miercoles', dia: 'Miércoles', foco: 'Fuerza de tren superior', nivel: 'Inicial', objetivo: 'Fuerza', duracion: 30, icono: 'barbell-outline', ejercicios: [{ id: 'flexiones', nombre: 'Flexiones', series: 3, repeticiones: '8 repeticiones', descanso: 60 }, { id: 'remo', nombre: 'Remo con banda', series: 3, repeticiones: '12 repeticiones', descanso: 45 }, { id: 'plancha', nombre: 'Plancha', series: 3, repeticiones: '30 segundos', descanso: 45 }] },
  { id: 'viernes', dia: 'Viernes', foco: 'Cardio y movilidad', nivel: 'Inicial', objetivo: 'Cardio', duracion: 28, icono: 'walk-outline', ejercicios: [{ id: 'caminata', nombre: 'Caminata activa', series: 1, repeticiones: '15 minutos', descanso: 30 }, { id: 'cadera', nombre: 'Movilidad de cadera', series: 2, repeticiones: '8 minutos', descanso: 30 }, { id: 'estiramiento', nombre: 'Estiramiento', series: 1, repeticiones: '5 minutos', descanso: 30 }] },
];

const OPCIONES_OBJETIVO = ['Todos', 'Fuerza', 'Cardio', 'Movilidad'] as const;
const CONFIG_ENTRENAMIENTO = 'entrenamiento';

/** Avance de la semana en curso (usuarios/{uid}/entrenamientoSemanal/{lunes}). */
interface AvanceSemana {
  rutinasCompletadas: string[];
  ejerciciosCompletados: string[];
}

/** Ejercicios y planes creados por el usuario (usuarios/{uid}/configuracion/entrenamiento). */
interface Personalizados {
  ejerciciosPersonalizados: Ejercicio[];
  planesPersonalizados: PlanPersonalizado[];
}

const SEMANA_VACIA: AvanceSemana = { rutinasCompletadas: [], ejerciciosCompletados: [] };
const SIN_PERSONALIZADOS: Personalizados = { ejerciciosPersonalizados: [], planesPersonalizados: [] };

export default function Entrenamiento() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const { uid } = useAuth();
  const lunes = inicioSemana();
  const semana = useDatoPersistente<AvanceSemana>(
    uid ? `semana-${uid}-${lunes}` : null,
    async () => {
      const guardada = await obtenerSemanaEntrenamiento(uid!, lunes);
      return { rutinasCompletadas: guardada.rutinasCompletadas, ejerciciosCompletados: guardada.ejerciciosCompletados };
    },
    (avance) => guardarSemanaEntrenamiento(uid!, avance, lunes),
    SEMANA_VACIA
  );
  const personalizados = useDatoPersistente<Personalizados>(
    uid ? `entreno-${uid}` : null,
    async () => ({ ...SIN_PERSONALIZADOS, ...(await obtenerConfiguracion<Personalizados>(uid!, CONFIG_ENTRENAMIENTO)) }),
    (datos) => guardarConfiguracion(uid!, CONFIG_ENTRENAMIENTO, datos),
    SIN_PERSONALIZADOS
  );
  const { rutinasCompletadas, ejerciciosCompletados } = semana.valor;
  const { ejerciciosPersonalizados, planesPersonalizados } = personalizados.valor;
  const setRutinasCompletadas = (cambio: (actuales: string[]) => string[]) =>
    semana.actualizar((actual) => ({ ...actual, rutinasCompletadas: cambio(actual.rutinasCompletadas) }));
  const setEjerciciosCompletados = (cambio: (actuales: string[]) => string[]) =>
    semana.actualizar((actual) => ({ ...actual, ejerciciosCompletados: cambio(actual.ejerciciosCompletados) }));
  const setEjerciciosPersonalizados = (cambio: (actuales: Ejercicio[]) => Ejercicio[]) =>
    personalizados.actualizar((actual) => ({ ...actual, ejerciciosPersonalizados: cambio(actual.ejerciciosPersonalizados) }));
  const setPlanesPersonalizados = (cambio: (actuales: PlanPersonalizado[]) => PlanPersonalizado[]) =>
    personalizados.actualizar((actual) => ({ ...actual, planesPersonalizados: cambio(actual.planesPersonalizados) }));
  const errorGuardado = semana.error ?? personalizados.error;
  const [rutinaAbierta, setRutinaAbierta] = useState<string | null>(RUTINAS[0].id);
  const [objetivo, setObjetivo] = useState<(typeof OPCIONES_OBJETIVO)[number]>('Todos');
  const [temporizador, setTemporizador] = useState(0);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);
  const [modal, setModal] = useState<'ejercicio' | 'plan' | null>(null);
  const [nombreEjercicio, setNombreEjercicio] = useState('');
  const [seriesEjercicio, setSeriesEjercicio] = useState('3');
  const [repeticionesEjercicio, setRepeticionesEjercicio] = useState('10 repeticiones');
  const [descansoEjercicio, setDescansoEjercicio] = useState('60');
  const [nombrePlan, setNombrePlan] = useState('');
  const [diaPlan, setDiaPlan] = useState('Sábado');
  const [objetivoPlan, setObjetivoPlan] = useState<'Fuerza' | 'Cardio' | 'Movilidad'>('Fuerza');
  const [ejerciciosPlan, setEjerciciosPlan] = useState<string[]>([]);

  const todasLasRutinas = [...RUTINAS, ...planesPersonalizados];
  const todosLosEjercicios = [...RUTINAS.flatMap((rutina) => rutina.ejercicios), ...ejerciciosPersonalizados];
  const rutinasVisibles = useMemo(() => objetivo === 'Todos' ? todasLasRutinas : todasLasRutinas.filter((rutina) => rutina.objetivo === objetivo), [objetivo, planesPersonalizados]);
  const totalEjercicios = rutinasVisibles.reduce((total, rutina) => total + rutina.ejercicios.length, 0);
  const minutosTotales = RUTINAS.reduce((total, rutina) => total + rutina.duracion, 0);
  const minutos = Math.floor(temporizador / 60).toString().padStart(2, '0');
  const segundos = (temporizador % 60).toString().padStart(2, '0');

  useEffect(() => {
    if (!temporizadorActivo || temporizador <= 0) return;
    const intervalo = setInterval(() => setTemporizador((actual) => actual - 1), 1000);
    return () => clearInterval(intervalo);
  }, [temporizadorActivo, temporizador]);

  useEffect(() => {
    if (temporizador === 0) setTemporizadorActivo(false);
  }, [temporizador]);

  function alternarRutina(rutina: Rutina) {
    const completada = rutinasCompletadas.includes(rutina.id);
    if (!completada) hapticaExito();
    setRutinasCompletadas((actuales) => completada ? actuales.filter((id) => id !== rutina.id) : [...actuales, rutina.id]);
    if (!completada) setEjerciciosCompletados((actuales) => [...new Set([...actuales, ...rutina.ejercicios.map((ejercicio) => ejercicio.id)])]);
  }

  function alternarEjercicio(id: string) {
    hapticaSeleccion();
    setEjerciciosCompletados((actuales) => actuales.includes(id) ? actuales.filter((actual) => actual !== id) : [...actuales, id]);
  }

  function iniciarDescanso(segundosDescanso: number) {
    setTemporizador(segundosDescanso);
    setTemporizadorActivo(true);
  }

  function guardarEjercicio() {
    const nombre = nombreEjercicio.trim();
    const series = Number(seriesEjercicio);
    const descanso = Number(descansoEjercicio);
    if (!nombre || !Number.isFinite(series) || series < 1 || !Number.isFinite(descanso) || descanso < 0) return;
    setEjerciciosPersonalizados((actuales) => [...actuales, { id: `custom-${Date.now()}`, nombre, series, repeticiones: repeticionesEjercicio.trim() || '10 repeticiones', descanso }]);
    setNombreEjercicio('');
    setModal(null);
  }

  function guardarPlan() {
    const seleccionados = todosLosEjercicios.filter((ejercicio) => ejerciciosPlan.includes(ejercicio.id));
    if (!nombrePlan.trim() || seleccionados.length === 0) return;
    setPlanesPersonalizados((actuales) => [...actuales, { id: `plan-${Date.now()}`, dia: diaPlan, foco: nombrePlan.trim(), nivel: 'Inicial', objetivo: objetivoPlan, duracion: seleccionados.length * 8, icono: 'clipboard-outline', ejercicios: seleccionados }]);
    setNombrePlan('');
    setEjerciciosPlan([]);
    setModal(null);
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.encabezado}>Mi entrenamiento</Text>
        <Text style={styles.subencabezado}>Planifica, ejecuta y registra cada sesión.</Text>
        {errorGuardado ? <Text style={styles.estadoError}>{errorGuardado}</Text> : null}

        <Tarjeta estilo={styles.resumen}>
          <View style={styles.resumenIcono}><Ionicons name="fitness-outline" size={28} color={Colors.primary} /></View>
          <View style={styles.resumenTexto}><Text style={styles.resumenTitulo}>Semana en curso</Text><Text style={styles.resumenDetalle}>{rutinasCompletadas.length} de {RUTINAS.length} sesiones completadas</Text></View>
          <Text style={styles.resumenNumero}>{ejerciciosCompletados.length}<Text style={styles.resumenUnidad}> ejercicios</Text></Text>
        </Tarjeta>

        <View style={styles.editorAcciones}>
          <Pressable onPress={() => setModal('ejercicio')} style={styles.editorBoton}>
            <Ionicons name="add-circle-outline" size={21} color={Colors.primary} />
            <Text style={styles.editorTexto}>Nuevo ejercicio</Text>
          </Pressable>
          <Pressable onPress={() => setModal('plan')} style={styles.editorBoton}>
            <Ionicons name="create-outline" size={21} color={Colors.primary} />
            <Text style={styles.editorTexto}>Nuevo plan</Text>
          </Pressable>
        </View>

        <Text style={styles.seccion}>Objetivo del entrenamiento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {OPCIONES_OBJETIVO.map((opcion) => <Pressable key={opcion} onPress={() => setObjetivo(opcion)} style={[styles.filtro, objetivo === opcion && styles.filtroActivo]}><Text style={[styles.filtroTexto, objetivo === opcion && styles.filtroTextoActivo]}>{opcion}</Text></Pressable>)}
        </ScrollView>

        <Tarjeta estilo={styles.temporizadorCard}>
          <View><Text style={styles.temporizadorTitulo}>Descanso entre series</Text><Text style={styles.temporizadorValor}>{minutos}:{segundos}</Text></View>
          <View style={styles.temporizadorAcciones}><Pressable onPress={() => iniciarDescanso(30)} style={styles.descansoBoton}><Text style={styles.descansoTexto}>30 s</Text></Pressable><Pressable onPress={() => iniciarDescanso(60)} style={styles.descansoBoton}><Text style={styles.descansoTexto}>60 s</Text></Pressable><Pressable onPress={() => { setTemporizadorActivo(false); setTemporizador(0); }}><Ionicons name={temporizadorActivo ? 'pause-circle' : 'refresh-circle'} size={34} color={Colors.primary} /></Pressable></View>
        </Tarjeta>

        <View style={styles.seccionFila}><Text style={styles.seccion}>Plan semanal</Text><Text style={styles.contador}>{ejerciciosCompletados.length}/{totalEjercicios}</Text></View>
        {rutinasVisibles.map((rutina) => {
          const abierta = rutinaAbierta === rutina.id;
          const completa = rutinasCompletadas.includes(rutina.id);
          return <Tarjeta key={rutina.id} estilo={{ ...styles.rutina, ...(completa ? styles.rutinaCompleta : {}) }}>
            <Pressable onPress={() => setRutinaAbierta(abierta ? null : rutina.id)} style={styles.rutinaCabecera}>
              <View style={styles.rutinaIcono}><Ionicons name={rutina.icono} size={22} color={Colors.primary} /></View>
              <View style={styles.rutinaInfo}><Text style={styles.rutinaDia}>{rutina.dia} · {rutina.nivel}</Text><Text style={styles.rutinaFoco}>{rutina.foco}</Text><Text style={styles.rutinaDetalle}>{rutina.duracion} min · {rutina.ejercicios.length} ejercicios</Text></View>
              <Ionicons name={abierta ? 'chevron-up' : 'chevron-down'} size={22} color={Colors.textMuted} />
            </Pressable>
            {abierta && <View style={styles.ejercicios}>{rutina.ejercicios.map((ejercicio) => { const hecho = ejerciciosCompletados.includes(ejercicio.id); return <View key={ejercicio.id} style={styles.ejercicioFila}><Pressable onPress={() => alternarEjercicio(ejercicio.id)} style={styles.ejercicioCheck}><Ionicons name={hecho ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={hecho ? Colors.success : Colors.textMuted} /></Pressable><View style={styles.ejercicioInfo}><Text style={[styles.ejercicioNombre, hecho && styles.ejercicioHecho]}>{ejercicio.nombre}</Text><Text style={styles.ejercicioDetalle}>{ejercicio.series} series · {ejercicio.repeticiones}</Text></View><Pressable onPress={() => iniciarDescanso(ejercicio.descanso)}><Ionicons name="timer-outline" size={21} color={Colors.primary} /></Pressable></View>; })}<Pressable onPress={() => alternarRutina(rutina)} style={styles.completarBoton}><Ionicons name="checkmark-done-outline" size={18} color={Colors.primary} /><Text style={styles.completarTexto}>{completa ? 'Marcar como pendiente' : 'Completar sesión'}</Text></Pressable></View>}
          </Tarjeta>;
        })}

        <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
          <View style={styles.modalFondo}>
            <View style={styles.modalCaja}>
              <View style={styles.modalEncabezado}>
                <Text style={styles.modalTitulo}>{modal === 'ejercicio' ? 'Crear ejercicio' : 'Crear plan'}</Text>
                <Pressable onPress={() => setModal(null)}><Ionicons name="close" size={24} color={Colors.textSecondary} /></Pressable>
              </View>

              {modal === 'ejercicio' ? (
                <>
                  <Text style={styles.inputLabel}>Nombre del ejercicio</Text>
                  <TextInput value={nombreEjercicio} onChangeText={setNombreEjercicio} placeholder="Ej. Press de hombros" placeholderTextColor={Colors.textMuted} style={styles.modalInput} />
                  <View style={styles.dosCampos}>
                    <View style={styles.campoModal}><Text style={styles.inputLabel}>Series</Text><TextInput value={seriesEjercicio} onChangeText={setSeriesEjercicio} keyboardType="number-pad" style={styles.modalInput} /></View>
                    <View style={styles.campoModal}><Text style={styles.inputLabel}>Descanso (s)</Text><TextInput value={descansoEjercicio} onChangeText={setDescansoEjercicio} keyboardType="number-pad" style={styles.modalInput} /></View>
                  </View>
                  <Text style={styles.inputLabel}>Repeticiones o tiempo</Text>
                  <TextInput value={repeticionesEjercicio} onChangeText={setRepeticionesEjercicio} placeholder="Ej. 12 repeticiones" placeholderTextColor={Colors.textMuted} style={styles.modalInput} />
                  <Pressable onPress={guardarEjercicio} style={styles.guardarBoton}><Text style={styles.guardarTexto}>Guardar ejercicio</Text></Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Nombre del plan</Text>
                  <TextInput value={nombrePlan} onChangeText={setNombrePlan} placeholder="Ej. Rutina de espalda" placeholderTextColor={Colors.textMuted} style={styles.modalInput} />
                  <Text style={styles.inputLabel}>Día</Text>
                  <View style={styles.opcionesFila}>{['Lunes', 'Miércoles', 'Viernes', 'Sábado'].map((dia) => <Pressable key={dia} onPress={() => setDiaPlan(dia)} style={[styles.opcionModal, diaPlan === dia && styles.opcionModalActiva]}><Text style={[styles.opcionModalTexto, diaPlan === dia && styles.opcionModalTextoActivo]}>{dia}</Text></Pressable>)}</View>
                  <Text style={styles.inputLabel}>Objetivo</Text>
                  <View style={styles.opcionesFila}>{(['Fuerza', 'Cardio', 'Movilidad'] as const).map((opcion) => <Pressable key={opcion} onPress={() => setObjetivoPlan(opcion)} style={[styles.opcionModal, objetivoPlan === opcion && styles.opcionModalActiva]}><Text style={[styles.opcionModalTexto, objetivoPlan === opcion && styles.opcionModalTextoActivo]}>{opcion}</Text></Pressable>)}</View>
                  <Text style={styles.inputLabel}>Selecciona ejercicios</Text>
                  <ScrollView style={styles.listaEjerciciosModal} nestedScrollEnabled>
                    {todosLosEjercicios.map((ejercicio) => { const seleccionado = ejerciciosPlan.includes(ejercicio.id); return <Pressable key={ejercicio.id} onPress={() => setEjerciciosPlan((actuales) => seleccionado ? actuales.filter((id) => id !== ejercicio.id) : [...actuales, ejercicio.id])} style={styles.ejercicioModal}><Ionicons name={seleccionado ? 'checkbox' : 'square-outline'} size={22} color={seleccionado ? Colors.success : Colors.textMuted} /><Text style={styles.ejercicioModalTexto}>{ejercicio.nombre}</Text></Pressable>; })}
                  </ScrollView>
                  <Pressable onPress={guardarPlan} style={styles.guardarBoton}><Text style={styles.guardarTexto}>Crear plan ({ejerciciosPlan.length})</Text></Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        <View style={styles.tip}><Ionicons name="bulb-outline" size={20} color={Colors.accentDark} /><Text style={styles.tipTexto}>Prioriza una técnica controlada. El temporizador te ayuda a respetar el descanso de cada ejercicio.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  encabezado: { ...Typography.title, color: Colors.textPrimary },
  subencabezado: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  estadoError: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  resumen: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xl, backgroundColor: Colors.surfaceAlt },
  resumenIcono: { width: 50, height: 50, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  resumenTexto: { flex: 1, marginLeft: Spacing.md },
  resumenTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary },
  resumenDetalle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  resumenNumero: { ...Typography.subtitle, color: Colors.primary },
  resumenUnidad: { ...Typography.caption, color: Colors.primary },
  editorAcciones: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  editorBoton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, backgroundColor: Colors.surface, paddingVertical: Spacing.md },
  editorTexto: { ...Typography.caption, color: Colors.primary },
  seccion: { ...Typography.sectionTitle, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contador: { ...Typography.caption, color: Colors.primary },
  filtros: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  filtro: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  filtroActivo: { borderColor: Colors.primary, backgroundColor: Colors.surfaceAlt },
  filtroTexto: { ...Typography.caption, color: Colors.textSecondary },
  filtroTextoActivo: { color: Colors.primary },
  temporizadorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl, backgroundColor: Colors.surfaceAlt },
  temporizadorTitulo: { ...Typography.caption, color: Colors.textSecondary },
  temporizadorValor: { ...Typography.subtitle, color: Colors.textPrimary, marginTop: Spacing.xs },
  temporizadorAcciones: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  descansoBoton: { borderRadius: Radius.sm, backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  descansoTexto: { ...Typography.caption, color: Colors.primary },
  rutina: { marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  rutinaCompleta: { borderColor: Colors.success, backgroundColor: Colors.successContainer },
  rutinaCabecera: { flexDirection: 'row', alignItems: 'center' },
  rutinaIcono: { width: 42, height: 42, borderRadius: Radius.sm, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rutinaInfo: { flex: 1, marginLeft: Spacing.md },
  rutinaDia: { ...Typography.caption, color: Colors.primary },
  rutinaFoco: { ...Typography.bodyStrong, color: Colors.textPrimary, marginTop: 2 },
  rutinaDetalle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  ejercicios: { borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.md, paddingTop: Spacing.md },
  ejercicioFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  ejercicioCheck: { marginRight: Spacing.sm },
  ejercicioInfo: { flex: 1 },
  ejercicioNombre: { ...Typography.bodyStrong, color: Colors.textPrimary },
  ejercicioHecho: { textDecorationLine: 'line-through', color: Colors.textMuted },
  ejercicioDetalle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  completarBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.sm, paddingTop: Spacing.md, gap: Spacing.xs },
  completarTexto: { ...Typography.caption, color: Colors.primary },
  tip: { flexDirection: 'row', backgroundColor: Colors.warningContainer, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  tipTexto: { ...Typography.caption, color: Colors.textPrimary, flex: 1 },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.velo },
  modalCaja: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, maxHeight: '88%' },
  modalEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitulo: { ...Typography.subtitle, color: Colors.textPrimary },
  inputLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  modalInput: { height: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, backgroundColor: Colors.surface, color: Colors.textPrimary, paddingHorizontal: Spacing.md, ...Typography.body },
  dosCampos: { flexDirection: 'row', gap: Spacing.md },
  campoModal: { flex: 1 },
  guardarBoton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.lg },
  guardarTexto: { ...Typography.button, color: Colors.textOnPrimary },
  opcionesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  opcionModal: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  opcionModalActiva: { borderColor: Colors.primary, backgroundColor: Colors.surfaceAlt },
  opcionModalTexto: { ...Typography.caption, color: Colors.textSecondary },
  opcionModalTextoActivo: { color: Colors.primary },
  listaEjerciciosModal: { maxHeight: 150, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  ejercicioModal: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  ejercicioModalTexto: { ...Typography.body, color: Colors.textPrimary },
}));