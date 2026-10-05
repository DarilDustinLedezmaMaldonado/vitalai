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
  fechaLocal,
  guardarConfiguracion,
  guardarSemanaEntrenamiento,
  inicioSemana,
  listarSemanasEntrenamiento,
  obtenerConfiguracion,
  obtenerSemanaEntrenamiento,
  SemanaEntrenamiento,
  SerieRegistrada,
} from '@/services/datosService';
import {
  compararEjercicios,
  describirSesion,
  formatoKg,
  medidaDeEjercicio,
  resumirSemana,
  sesionAnterior,
  seriesDelDia,
  Sugerencia,
  sugerirProgresion,
  UNIDAD_MEDIDA,
  variacionPorcentual,
} from '@/utils/entrenamiento';

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
  series: SerieRegistrada[];
}

/** Fila editable del registro de series (texto tal cual lo escribe el usuario). */
interface FilaSerie {
  carga: string;
  cantidad: string;
}

const SEMANAS_HISTORIAL = 6;

/** Ejercicios y planes creados por el usuario (usuarios/{uid}/configuracion/entrenamiento). */
interface Personalizados {
  ejerciciosPersonalizados: Ejercicio[];
  planesPersonalizados: PlanPersonalizado[];
}

const SEMANA_VACIA: AvanceSemana = { rutinasCompletadas: [], ejerciciosCompletados: [], series: [] };
const SIN_PERSONALIZADOS: Personalizados = { ejerciciosPersonalizados: [], planesPersonalizados: [] };

export default function Entrenamiento() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const { uid } = useAuth();
  const lunes = inicioSemana();
  const semana = useDatoPersistente<AvanceSemana>(
    uid ? `semana-${uid}-${lunes}` : null,
    async () => {
      const guardada = await obtenerSemanaEntrenamiento(uid!, lunes);
      return { rutinasCompletadas: guardada.rutinasCompletadas, ejerciciosCompletados: guardada.ejerciciosCompletados, series: guardada.series ?? [] };
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
  const { rutinasCompletadas, ejerciciosCompletados, series } = semana.valor;
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
  const hoy = fechaLocal();
  const [semanasAnteriores, setSemanasAnteriores] = useState<SemanaEntrenamiento[]>([]);
  const [ejercicioRegistro, setEjercicioRegistro] = useState<Ejercicio | null>(null);
  const [filasSerie, setFilasSerie] = useState<FilaSerie[]>([]);
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);
  const [ultimaSesion, setUltimaSesion] = useState('');

  useEffect(() => {
    if (!uid) return;
    let activo = true;
    listarSemanasEntrenamiento(uid)
      .then((semanas) => { if (activo) setSemanasAnteriores(semanas.filter((s) => s.inicioSemana < lunes)); })
      .catch((e) => console.warn('[VitalAI] Error al cargar el historial de entrenamiento', e));
    return () => { activo = false; };
  }, [uid, lunes]);
  const [rutinaAbierta, setRutinaAbierta] = useState<string | null>(RUTINAS[0].id);
  const [objetivo, setObjetivo] = useState<(typeof OPCIONES_OBJETIVO)[number]>('Todos');
  const [temporizador, setTemporizador] = useState(0);
  const [temporizadorActivo, setTemporizadorActivo] = useState(false);
  const [modal, setModal] = useState<'ejercicio' | 'plan' | 'series' | null>(null);
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

  /** Abre el registro de series: lo de hoy si ya existe, si no la sugerencia segun la ultima sesion. */
  function abrirRegistro(ejercicio: Ejercicio) {
    const medida = medidaDeEjercicio(ejercicio.repeticiones);
    const deHoy = seriesDelDia(series, ejercicio.id, hoy);
    const anterior = sesionAnterior([...semanasAnteriores, semana.valor], ejercicio.id, hoy);
    const propuesta = sugerirProgresion(anterior, medida);
    const filaBase: FilaSerie = {
      carga: propuesta && propuesta.cargaKg > 0 ? formatoKg(propuesta.cargaKg) : '',
      cantidad: String(propuesta?.cantidad || medida.objetivo || ''),
    };
    setFilasSerie(deHoy.length
      ? deHoy.map((serie) => ({ carga: serie.cargaKg > 0 ? formatoKg(serie.cargaKg) : '', cantidad: String(serie.cantidad) }))
      : Array.from({ length: Math.max(ejercicio.series, 1) }, () => ({ ...filaBase })));
    setSugerencia(propuesta);
    setUltimaSesion(anterior.length ? `${describirSesion(anterior, medida)} (${anterior[0].fecha.slice(8)}/${anterior[0].fecha.slice(5, 7)})` : '');
    setEjercicioRegistro(ejercicio);
    setModal('series');
  }

  function cambiarFila(indice: number, campo: keyof FilaSerie, texto: string) {
    setFilasSerie((actuales) => actuales.map((fila, i) => (i === indice ? { ...fila, [campo]: texto } : fila)));
  }

  function guardarSeries() {
    if (!ejercicioRegistro) return;
    const numero = (texto: string) => Number(texto.replace(',', '.'));
    const nuevas: SerieRegistrada[] = filasSerie
      .filter((fila) => numero(fila.cantidad) > 0)
      .map((fila, i) => ({
        ejercicioId: ejercicioRegistro.id,
        fecha: hoy,
        numero: i + 1,
        cargaKg: Math.max(0, numero(fila.carga) || 0),
        cantidad: numero(fila.cantidad),
      }));
    const id = ejercicioRegistro.id;
    semana.actualizar((actual) => ({
      ...actual,
      series: [...actual.series.filter((serie) => !(serie.ejercicioId === id && serie.fecha === hoy)), ...nuevas],
      ejerciciosCompletados: nuevas.length && !actual.ejerciciosCompletados.includes(id) ? [...actual.ejerciciosCompletados, id] : actual.ejerciciosCompletados,
    }));
    if (nuevas.length) hapticaExito();
    setModal(null);
    setEjercicioRegistro(null);
  }

  // Historial: la semana en curso sale del estado (se ve al instante) y las anteriores de la carga.
  const resumenes = [...semanasAnteriores, { inicioSemana: lunes, ...semana.valor, actualizado: '' }]
    .slice(-SEMANAS_HISTORIAL)
    .map(resumirSemana);
  const resumenActual = resumenes[resumenes.length - 1];
  const resumenPrevio = resumenes.length > 1 ? resumenes[resumenes.length - 2] : null;
  const usarVolumen = resumenes.some((resumen) => resumen.volumenKg > 0);
  const valorBarra = (resumen: (typeof resumenes)[number]) => (usarVolumen ? resumen.volumenKg : resumen.series);
  const maximoBarra = Math.max(...resumenes.map(valorBarra), 1);
  const variacion = resumenPrevio ? variacionPorcentual(valorBarra(resumenActual), valorBarra(resumenPrevio)) : null;
  const semanaPrevia = semanasAnteriores.find((s) => s.inicioSemana === resumenPrevio?.inicioSemana);
  const comparaciones = compararEjercicios(series, semanaPrevia?.series ?? []);
  const ejercicioPorId = new Map(todosLosEjercicios.map((ejercicio) => [ejercicio.id, ejercicio]));
  const medidaRegistro = ejercicioRegistro ? medidaDeEjercicio(ejercicioRegistro.repeticiones) : null;

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
            {abierta && <View style={styles.ejercicios}>{rutina.ejercicios.map((ejercicio) => { const hecho = ejerciciosCompletados.includes(ejercicio.id); const registroHoy = seriesDelDia(series, ejercicio.id, hoy); return <View key={ejercicio.id} style={styles.ejercicioFila}><Pressable onPress={() => alternarEjercicio(ejercicio.id)} style={styles.ejercicioCheck}><Ionicons name={hecho ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={hecho ? Colors.success : Colors.textMuted} /></Pressable><View style={styles.ejercicioInfo}><Text style={[styles.ejercicioNombre, hecho && styles.ejercicioHecho]}>{ejercicio.nombre}</Text><Text style={styles.ejercicioDetalle}>{ejercicio.series} series · {ejercicio.repeticiones}</Text>{registroHoy.length > 0 && <Text style={styles.ejercicioRegistro}>Hoy: {describirSesion(registroHoy, medidaDeEjercicio(ejercicio.repeticiones))}</Text>}</View><Pressable onPress={() => abrirRegistro(ejercicio)} hitSlop={8} style={styles.ejercicioAccion} accessibilityLabel={`Anotar series de ${ejercicio.nombre}`}><Ionicons name={registroHoy.length ? 'create-outline' : 'barbell-outline'} size={21} color={Colors.primary} /></Pressable><Pressable onPress={() => iniciarDescanso(ejercicio.descanso)} hitSlop={8} accessibilityLabel="Iniciar descanso"><Ionicons name="timer-outline" size={21} color={Colors.primary} /></Pressable></View>; })}<Pressable onPress={() => alternarRutina(rutina)} style={styles.completarBoton}><Ionicons name="checkmark-done-outline" size={18} color={Colors.primary} /><Text style={styles.completarTexto}>{completa ? 'Marcar como pendiente' : 'Completar sesión'}</Text></Pressable></View>}
          </Tarjeta>;
        })}

        <View style={styles.seccionFila}><Text style={styles.seccion}>Historial semanal</Text><Text style={styles.contador}>{usarVolumen ? 'Volumen (kg)' : 'Series'}</Text></View>
        <Tarjeta>
          {resumenActual.series === 0 && resumenes.every((resumen) => resumen.series === 0) ? (
            <Text style={styles.historialVacio}>Toca <Ionicons name="barbell-outline" size={14} color={Colors.primary} /> en un ejercicio para anotar la carga y las repeticiones de cada serie. Aquí verás cómo progresas semana a semana.</Text>
          ) : (
            <>
              <View style={styles.barras}>
                {resumenes.map((resumen, i) => {
                  const actual = i === resumenes.length - 1;
                  const valor = valorBarra(resumen);
                  return <View key={resumen.inicioSemana} style={styles.barraColumna} accessibilityLabel={`Semana del ${resumen.inicioSemana}: ${valor} ${usarVolumen ? 'kilos de volumen' : 'series'}`}>
                    <Text style={styles.barraValor}>{valor > 0 ? (valor >= 1000 ? `${formatoKg(Math.round(valor / 100) / 10)}k` : valor) : ''}</Text>
                    <View style={[styles.barra, { height: Math.max(4, (valor / maximoBarra) * 96) }, actual ? styles.barraActual : null]} />
                    <Text style={[styles.barraEtiqueta, actual && styles.barraEtiquetaActual]}>{actual ? 'Esta' : `${resumen.inicioSemana.slice(8)}/${resumen.inicioSemana.slice(5, 7)}`}</Text>
                  </View>;
                })}
              </View>
              <View style={styles.historialDatos}>
                <View style={styles.historialDato}><Text style={styles.historialNumero}>{resumenActual.sesiones}</Text><Text style={styles.historialEtiqueta}>sesiones</Text></View>
                <View style={styles.historialDato}><Text style={styles.historialNumero}>{resumenActual.series}</Text><Text style={styles.historialEtiqueta}>series</Text></View>
                <View style={styles.historialDato}><Text style={styles.historialNumero}>{resumenActual.volumenKg.toLocaleString('es-BO')}</Text><Text style={styles.historialEtiqueta}>kg de volumen</Text></View>
              </View>
              {variacion !== null && <Text style={[styles.historialVariacion, { color: variacion >= 0 ? Colors.success : Colors.textSecondary }]}>{variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion)} % {usarVolumen ? 'de volumen' : 'de series'} frente a la semana anterior</Text>}
              {comparaciones.length > 0 && <View style={styles.comparaciones}>
                {comparaciones.map((comparacion) => {
                  const ejercicio = ejercicioPorId.get(comparacion.ejercicioId);
                  if (!ejercicio) return null;
                  const medida = medidaDeEjercicio(ejercicio.repeticiones);
                  const conCarga = comparacion.cargaMaxActual > 0 || comparacion.cargaMaxAnterior > 0;
                  const actual = conCarga ? comparacion.cargaMaxActual : comparacion.mejorCantidadActual;
                  const anterior = conCarga ? comparacion.cargaMaxAnterior : comparacion.mejorCantidadAnterior;
                  const unidad = conCarga ? 'kg' : UNIDAD_MEDIDA[medida.tipo];
                  const mejora = anterior > 0 && actual > anterior;
                  return <View key={comparacion.ejercicioId} style={styles.comparacionFila}>
                    <Text style={styles.comparacionNombre} numberOfLines={1}>{ejercicio.nombre}</Text>
                    <Text style={styles.comparacionValor}>{anterior > 0 ? `${formatoKg(anterior)} → ` : ''}{formatoKg(actual)} {unidad}</Text>
                    {mejora && <Ionicons name="trending-up" size={16} color={Colors.success} />}
                  </View>;
                })}
              </View>}
            </>
          )}
        </Tarjeta>

        <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
          <View style={styles.modalFondo}>
            <View style={styles.modalCaja}>
              <View style={styles.modalEncabezado}>
                <Text style={styles.modalTitulo} numberOfLines={1}>{modal === 'series' ? ejercicioRegistro?.nombre : modal === 'ejercicio' ? 'Crear ejercicio' : 'Crear plan'}</Text>
                <Pressable onPress={() => setModal(null)}><Ionicons name="close" size={24} color={Colors.textSecondary} /></Pressable>
              </View>

              {modal === 'series' && medidaRegistro ? (
                <>
                  <Text style={styles.ejercicioDetalle}>Objetivo: {ejercicioRegistro?.series} series · {ejercicioRegistro?.repeticiones}{ultimaSesion ? `\nÚltima vez: ${ultimaSesion}` : ''}</Text>
                  {sugerencia && <View style={styles.sugerencia}><Ionicons name="trending-up" size={18} color={Colors.primary} /><Text style={styles.sugerenciaTexto}>{sugerencia.explicacion}</Text></View>}
                  <View style={styles.filaSerieEncabezado}>
                    <Text style={[styles.inputLabel, styles.filaSerieNumero]}>Serie</Text>
                    <Text style={[styles.inputLabel, styles.campoSerie]}>Carga (kg)</Text>
                    <Text style={[styles.inputLabel, styles.campoSerie]}>{medidaRegistro.tipo === 'repeticiones' ? 'Repeticiones' : medidaRegistro.tipo === 'segundos' ? 'Segundos' : 'Minutos'}</Text>
                    <View style={styles.filaSerieQuitar} />
                  </View>
                  <ScrollView style={styles.listaSeries} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {filasSerie.map((fila, i) => <View key={i} style={styles.filaSerie}>
                      <Text style={[styles.filaSerieNumero, styles.filaSerieNumeroTexto]}>{i + 1}</Text>
                      <TextInput value={fila.carga} onChangeText={(texto) => cambiarFila(i, 'carga', texto)} keyboardType="decimal-pad" placeholder="Peso corporal" placeholderTextColor={Colors.textMuted} style={[styles.modalInput, styles.campoSerie]} accessibilityLabel={`Carga de la serie ${i + 1}`} />
                      <TextInput value={fila.cantidad} onChangeText={(texto) => cambiarFila(i, 'cantidad', texto)} keyboardType="number-pad" placeholderTextColor={Colors.textMuted} style={[styles.modalInput, styles.campoSerie]} accessibilityLabel={`Cantidad de la serie ${i + 1}`} />
                      <Pressable onPress={() => setFilasSerie((actuales) => actuales.filter((_, j) => j !== i))} hitSlop={8} style={styles.filaSerieQuitar} accessibilityLabel={`Quitar serie ${i + 1}`}><Ionicons name="remove-circle-outline" size={22} color={Colors.textMuted} /></Pressable>
                    </View>)}
                  </ScrollView>
                  <Pressable onPress={() => setFilasSerie((actuales) => [...actuales, { ...(actuales[actuales.length - 1] ?? { carga: '', cantidad: '' }) }])} style={styles.agregarSerie}><Ionicons name="add" size={18} color={Colors.primary} /><Text style={styles.completarTexto}>Agregar serie</Text></Pressable>
                  {filasSerie.length > 0 && <Text style={styles.volumenPrevio}>Volumen: {Math.round(filasSerie.reduce((total, fila) => total + (Number(fila.carga.replace(',', '.')) || 0) * (medidaRegistro.tipo === 'repeticiones' ? Number(fila.cantidad) || 0 : 0), 0)).toLocaleString('es-BO')} kg</Text>}
                  <Pressable onPress={guardarSeries} style={styles.guardarBoton}><Text style={styles.guardarTexto}>Guardar series</Text></Pressable>
                </>
              ) : modal === 'ejercicio' ? (
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
  ejercicioRegistro: { ...Typography.caption, color: Colors.primary, marginTop: 2 },
  ejercicioAccion: { marginRight: Spacing.md },
  historialVacio: { ...Typography.caption, color: Colors.textSecondary },
  barras: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: Spacing.xs },
  barraColumna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barraValor: { ...Typography.caption, fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  barra: { width: '70%', maxWidth: 28, borderRadius: Radius.sm, backgroundColor: Colors.primaryContainer },
  barraActual: { backgroundColor: Colors.primary },
  barraEtiqueta: { ...Typography.caption, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.xs },
  barraEtiquetaActual: { color: Colors.primary },
  historialDatos: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.md, paddingTop: Spacing.md },
  historialDato: { flex: 1, alignItems: 'center' },
  historialNumero: { ...Typography.bodyStrong, color: Colors.textPrimary },
  historialEtiqueta: { ...Typography.caption, color: Colors.textSecondary },
  historialVariacion: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.sm },
  comparaciones: { borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Spacing.md, paddingTop: Spacing.sm },
  comparacionFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.xs },
  comparacionNombre: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  comparacionValor: { ...Typography.caption, color: Colors.textSecondary },
  sugerencia: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.primaryContainer, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  sugerenciaTexto: { ...Typography.caption, color: Colors.onPrimaryContainer, flex: 1 },
  filaSerieEncabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  filaSerie: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  filaSerieNumero: { width: 40 },
  filaSerieNumeroTexto: { ...Typography.bodyStrong, color: Colors.textSecondary, textAlign: 'center' },
  filaSerieQuitar: { width: 24 },
  campoSerie: { flex: 1, minWidth: 0 },
  listaSeries: { maxHeight: 240 },
  agregarSerie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm },
  volumenPrevio: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
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