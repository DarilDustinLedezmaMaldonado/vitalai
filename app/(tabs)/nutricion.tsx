/**
 * VitalAI - Modulo de nutricion adaptativa.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import Boton from '@/components/Boton';
import { perfilesDemo } from '@/data/datasetDemo';
import { AlimentoUSDA, alimentosUSDA } from '@/data/alimentosUSDA';
import {
  AportePorcion,
  calcularAportePorcion,
  calcularRequerimiento,
  cumpleMetaCalorica,
  sumarAportes,
} from '@/utils/calculoNutricional';
import { useAuth } from '@/context/AuthContext';
import { useDatoPersistente } from '@/hooks/useDatoPersistente';
import { buscarSustituto } from '@/utils/sustitucion';
import { planificarRestoDelDia } from '@/utils/planificacionDia';
import { Comida, COMIDAS, IngredientePlan } from '@/data/planBase';
import {
  AjusteComida,
  AlimentoRegistrado,
  fechaLocal,
  guardarConfiguracion,
  guardarRegistroDia,
  obtenerConfiguracion,
  obtenerRegistroDia,
} from '@/services/datosService';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';


function buscarAlimento(id: string): AlimentoUSDA | undefined {
  return alimentosUSDA.find((item) => item.id === id);
}

function aporteDeComida(comida: Comida): AportePorcion {
  return sumarAportes(comida.alimentos.flatMap((ingrediente) => {
    const alimento = buscarAlimento(ingrediente.alimentoId);
    return alimento ? [calcularAportePorcion(alimento, ingrediente.gramos)] : [];
  }));
}

function caloriasDeComida(comida: Comida): number {
  return aporteDeComida(comida).calorias;
}

function porcionesDeComida(comida: Comida): string {
  return comida.alimentos.map((ingrediente) => {
    const alimento = buscarAlimento(ingrediente.alimentoId);
    return alimento ? `${alimento.nombre} ${ingrediente.gramos} g` : '';
  }).filter(Boolean).join(' · ');
}

const perfilDemo = perfilesDemo[0];

interface RegistroAlimento extends AlimentoRegistrado {
  alimento: AlimentoUSDA;
}

/** Datos del dia que el usuario edita en esta pantalla. */
interface DiaNutricion {
  alimentos: AlimentoRegistrado[];
  comidasCompletadas: string[];
  vasosAgua: number;
  ajustesPlan: AjusteComida[];
}

const DIA_VACIO: DiaNutricion = { alimentos: [], comidasCompletadas: [], vasosAgua: 0, ajustesPlan: [] };

/** Plan del dia: el plan base con las porciones recalculadas para hoy. */
function aplicarAjustes(plan: Comida[], ajustes: AjusteComida[]): Comida[] {
  return plan.map((comida) => {
    const ajuste = ajustes.find((a) => a.comidaId === comida.id);
    return ajuste ? { ...comida, alimentos: ajuste.alimentos } : comida;
  });
}

/** Comidas ya comidas: marcadas o con alimentos registrados en ellas. */
function comidasHechas(dia: DiaNutricion): string[] {
  return [...new Set([...dia.comidasCompletadas, ...dia.alimentos.map((a) => a.comida)])];
}
const CONFIG_NUTRICION = 'nutricion';

export default function Nutricion() {
  const { uid, perfil } = useAuth();
  const perfilActual = perfil ?? perfilDemo;
  const requerimiento = calcularRequerimiento(perfilActual);
  const fecha = fechaLocal();

  // Plan de comidas personalizado del usuario (usuarios/{uid}/configuracion/nutricion).
  const plan = useDatoPersistente<Comida[]>(
    uid ? `plan-${uid}` : null,
    async () => (await obtenerConfiguracion<{ planComidas: Comida[] }>(uid!, CONFIG_NUTRICION))?.planComidas ?? COMIDAS,
    (planComidas) => guardarConfiguracion(uid!, CONFIG_NUTRICION, { planComidas }),
    COMIDAS
  );
  const planComidas = plan.valor;
  const setPlanComidas = plan.actualizar;

  // Registro del dia (usuarios/{uid}/registrosDiarios/{fecha}).
  const dia = useDatoPersistente<DiaNutricion>(
    uid ? `dia-${uid}-${fecha}` : null,
    async () => {
      const registro = await obtenerRegistroDia(uid!, fecha);
      return { alimentos: registro.alimentos, comidasCompletadas: registro.comidasCompletadas, vasosAgua: registro.vasosAgua, ajustesPlan: registro.ajustesPlan ?? [] };
    },
    (datos) => {
      const totales = totalesDelDia(datos, aplicarAjustes(planComidas, datos.ajustesPlan));
      return guardarRegistroDia(uid!, {
        ...datos,
        caloriasConsumidas: totales.calorias,
        proteinasG: totales.proteinasG,
        carbohidratosG: totales.carbohidratosG,
        grasasG: totales.grasasG,
        cumplioPlan: cumpleMetaCalorica(totales.calorias, requerimiento.caloriasObjetivo),
      }, fecha);
    },
    DIA_VACIO
  );
  const { comidasCompletadas, vasosAgua } = dia.valor;
  const alimentosAgregados: RegistroAlimento[] = dia.valor.alimentos.flatMap((registro) => {
    const alimento = buscarAlimento(registro.alimentoId);
    return alimento ? [{ ...registro, alimento }] : [];
  });

  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState(alimentosUSDA[0]);
  const [gramos, setGramos] = useState(String(alimentosUSDA[0].porcionSugeridaG));
  const [busqueda, setBusqueda] = useState('');
  const [comidaSeleccionada, setComidaSeleccionada] = useState(COMIDAS[0].id);
  const [modalPlan, setModalPlan] = useState(false);
  const [nombreNuevaComida, setNombreNuevaComida] = useState('');
  const [momentoNuevaComida, setMomentoNuevaComida] = useState('Colacion');
  const [gramosNuevaComida, setGramosNuevaComida] = useState('100');
  const [ingredientesNuevaComida, setIngredientesNuevaComida] = useState<string[]>([]);
  const planDeHoy = aplicarAjustes(planComidas, dia.valor.ajustesPlan);
  const consumido = totalesDelDia(dia.valor, planDeHoy);
  const caloriasPlan = planDeHoy.reduce((total, comida) => total + caloriasDeComida(comida), 0);
  const caloriasRegistradas = consumido.calorias;
  const porcentajeCalorias = Math.min(100, Math.round((caloriasRegistradas / requerimiento.caloriasObjetivo) * 100));
  // Ingredientes que el usuario no tiene; se excluyen de las sustituciones.
  const disponibilidad = useDatoPersistente<string[]>(
    uid ? `nodisp-${uid}` : null,
    async () => (await obtenerConfiguracion<{ noDisponibles: string[] }>(uid!, CONFIG_NUTRICION))?.noDisponibles ?? [],
    (noDisponibles) => guardarConfiguracion(uid!, CONFIG_NUTRICION, { noDisponibles }),
    []
  );
  const noDisponibles = disponibilidad.valor;
  const [comidaAjuste, setComidaAjuste] = useState<string | null>(null);
  const [explicaciones, setExplicaciones] = useState<string[]>([]);
  const errorGuardado = plan.error ?? dia.error ?? disponibilidad.error;

  // Plan para el resto del dia: se recalcula desde el plan base con lo ya comido.
  const hechas = comidasHechas(dia.valor);
  const restoDelDia = planificarRestoDelDia(requerimiento, consumido, planComidas, hechas, new Date().getHours(), alimentosUSDA, noDisponibles);
  const ajustesPendientes = dia.valor.ajustesPlan.filter((a) => !hechas.includes(a.comidaId));
  const nuevosAjustes: AjusteComida[] = restoDelDia.comidas.map((c) => ({ comidaId: c.comidaId, alimentos: c.alimentos }));
  const ajusteAplicado = JSON.stringify(ajustesPendientes) === JSON.stringify(nuevosAjustes);

  /** Aplica el recalculo solo a las comidas pendientes; las ya comidas no cambian. */
  function aplicarRestoDelDia() {
    dia.actualizar((actual) => {
      const hechasAhora = comidasHechas(actual);
      return { ...actual, ajustesPlan: [...actual.ajustesPlan.filter((a) => hechasAhora.includes(a.comidaId)), ...nuevosAjustes] };
    });
  }

  function quitarAjustesPendientes() {
    dia.actualizar((actual) => {
      const hechasAhora = comidasHechas(actual);
      return { ...actual, ajustesPlan: actual.ajustesPlan.filter((a) => hechasAhora.includes(a.comidaId)) };
    });
  }

  function alternarComida(id: string) {
    dia.actualizar((actual) => ({
      ...actual,
      comidasCompletadas: actual.comidasCompletadas.includes(id)
        ? actual.comidasCompletadas.filter((comidaId) => comidaId !== id)
        : [...actual.comidasCompletadas, id],
    }));
  }

  function setVasosAgua(vasos: number) {
    dia.actualizar((actual) => ({ ...actual, vasosAgua: vasos }));
  }

  function seleccionarAlimento(alimento: AlimentoUSDA) {
    setAlimentoSeleccionado(alimento);
    setGramos(String(alimento.porcionSugeridaG));
  }

  const resultados = alimentosUSDA.filter((alimento) => {
    const termino = busqueda.trim().toLowerCase();
    return !termino || `${alimento.nombre} ${alimento.categoria}`.toLowerCase().includes(termino);
  });

  function agregarAlimento() {
    const cantidad = Number(gramos.replace(',', '.'));
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;
    const nuevo: AlimentoRegistrado = {
      id: `${alimentoSeleccionado.id}-${Date.now()}`,
      alimentoId: alimentoSeleccionado.id,
      gramos: cantidad,
      comida: comidaSeleccionada,
      ...calcularAportePorcion(alimentoSeleccionado, cantidad),
    };
    dia.actualizar((actual) => ({ ...actual, alimentos: [...actual.alimentos, nuevo] }));
  }

  function quitarAlimento(id: string) {
    dia.actualizar((actual) => ({ ...actual, alimentos: actual.alimentos.filter((registro) => registro.id !== id) }));
  }

  function crearComida() {
    const gramos = Number(gramosNuevaComida.replace(',', '.'));
    if (!nombreNuevaComida.trim() || ingredientesNuevaComida.length === 0 || !Number.isFinite(gramos) || gramos <= 0) return;
    const nueva: Comida = {
      id: `comida-${Date.now()}`,
      momento: momentoNuevaComida,
      titulo: nombreNuevaComida.trim(),
      detalle: 'Plan personalizado con alimentos seleccionados',
      calorias: 0,
      icono: 'restaurant-outline',
      alimentos: ingredientesNuevaComida.map((alimentoId) => ({ alimentoId, gramos })),
    };
    setPlanComidas((actuales) => [...actuales, nueva]);
    setNombreNuevaComida('');
    setIngredientesNuevaComida([]);
    setModalPlan(false);
  }

  /**
   * Marca un ingrediente como no disponible y recalcula todas las comidas
   * del plan que lo usan, conservando sus calorias (ver utils/sustitucion.ts).
   */
  function marcarNoDisponible(alimentoId: string) {
    const excluidosBase = [...noDisponibles, alimentoId];
    const textos: string[] = [];
    const nuevoPlan = planComidas.map((comida) => {
      const ingrediente = comida.alimentos.find((item) => item.alimentoId === alimentoId);
      if (!ingrediente) return comida;
      const enLaComida = comida.alimentos.map((item) => item.alimentoId);
      const sustitucion = buscarSustituto(ingrediente, alimentosUSDA, [...excluidosBase, ...enLaComida]);
      const nombre = buscarAlimento(alimentoId)?.nombre ?? 'el ingrediente';
      textos.push(sustitucion
        ? `${comida.momento}: ${sustitucion.explicacion}`
        : `${comida.momento}: quitamos ${nombre} porque no queda otro alimento parecido disponible. Las verduras y frutas aportan pocas calorias, asi que tu meta casi no cambia.`);
      return {
        ...comida,
        detalle: 'Ajustado segun los alimentos que tienes',
        alimentos: sustitucion
          ? comida.alimentos.map((item) => (item.alimentoId === alimentoId ? sustitucion.reemplazo : item))
          : comida.alimentos.filter((item) => item.alimentoId !== alimentoId),
      };
    });
    setPlanComidas(nuevoPlan);
    disponibilidad.actualizar((actuales) => (actuales.includes(alimentoId) ? actuales : [...actuales, alimentoId]));
    setExplicaciones(textos);
  }

  function marcarDisponible(alimentoId: string) {
    disponibilidad.actualizar((actuales) => actuales.filter((id) => id !== alimentoId));
  }

  function restaurarPlan() {
    setPlanComidas(COMIDAS);
    disponibilidad.actualizar([]);
    setExplicaciones([]);
  }

  function eliminarComida(id: string) {
    setPlanComidas((actuales) => actuales.filter((comida) => comida.id !== id));
    dia.actualizar((actual) => ({ ...actual, comidasCompletadas: actual.comidasCompletadas.filter((comidaId) => comidaId !== id) }));
    if (comidaSeleccionada === id) setComidaSeleccionada(planComidas.find((comida) => comida.id !== id)?.id ?? '');
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.encabezado}>Nutricion adaptativa</Text>
        <Text style={styles.subencabezado}>
          Un plan sencillo para avanzar hacia tu objetivo.
        </Text>
        {dia.cargando || plan.cargando ? <Text style={styles.estadoDatos}>Cargando tus datos...</Text> : null}
        {errorGuardado ? <Text style={styles.estadoError}>{errorGuardado}</Text> : null}

        <Tarjeta estilo={styles.metaCard}>
          <View style={styles.metaEncabezado}>
            <View>
              <Text style={styles.metaEtiqueta}>Meta diaria estimada</Text>
              <Text style={styles.metaCalorias}>
                {requerimiento.caloriasObjetivo} <Text style={styles.unidad}>kcal</Text>
              </Text>
            </View>
            <View style={styles.metaIcono}>
              <Ionicons name="sparkles-outline" size={24} color={Colors.primary} />
            </View>
          </View>
          <View style={styles.barraFondo}>
            <View style={[styles.barra, { width: `${porcentajeCalorias}%` }]} />
          </View>
          <View style={styles.metaResumenFila}>
            <Text style={styles.progresoTexto}>Registrado: {caloriasRegistradas} kcal</Text>
            <Text style={styles.progresoTexto}>{Math.max(0, requerimiento.caloriasObjetivo - caloriasRegistradas)} kcal restantes</Text>
          </View>
        </Tarjeta>

        <View style={styles.filaMacros}>
          <Macro etiqueta="Proteina" valor={`${Math.round(consumido.proteinasG)}/${requerimiento.proteinasG} g`} />
          <Macro etiqueta="Carbohidratos" valor={`${Math.round(consumido.carbohidratosG)}/${requerimiento.carbohidratosG} g`} />
          <Macro etiqueta="Grasas" valor={`${Math.round(consumido.grasasG)}/${requerimiento.grasasG} g`} />
        </View>

        <Text style={styles.seccion}>Agregar alimento</Text>
        <Text style={styles.fuenteIntro}>
          Valores oficiales USDA FoodData Central por 100 g de parte comestible.
        </Text>
        <View style={styles.buscador}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar alimento..."
            placeholderTextColor={Colors.textMuted}
            style={styles.buscadorInput}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Text style={styles.resultadosTexto}>{resultados.length} alimentos disponibles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catalogo}>
          {resultados.map((alimento) => (
            <Pressable
              key={alimento.id}
              onPress={() => seleccionarAlimento(alimento)}
              style={[styles.alimentoChip, alimento.id === alimentoSeleccionado.id && styles.alimentoChipActivo]}
            >
              <Text style={[styles.alimentoChipTexto, alimento.id === alimentoSeleccionado.id && styles.alimentoChipTextoActivo]}>
                {alimento.nombre}{alimento.local ? ' · BO' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.comidaDestinoLabel}>Agregar a</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catalogo}>
          {planComidas.map((comida) => (
            <Pressable
              key={comida.id}
              onPress={() => setComidaSeleccionada(comida.id)}
              style={[styles.comidaDestino, comida.id === comidaSeleccionada && styles.comidaDestinoActivo]}
            >
              <Ionicons name={comida.icono} size={16} color={comida.id === comidaSeleccionada ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.comidaDestinoTexto, comida.id === comidaSeleccionada && styles.comidaDestinoTextoActivo]}>{comida.momento}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Tarjeta estilo={styles.selectorCard}>
          <View style={styles.selectorTitulo}>
            <View style={styles.comidaIcono}>
              <Ionicons name="nutrition-outline" size={22} color={Colors.primary} />
            </View>
            <View style={styles.selectorInfo}>
              <Text style={styles.comidaTitulo}>{alimentoSeleccionado.nombre}</Text>
              <Text style={styles.comidaDetalle}>{alimentoSeleccionado.caloriasPor100g} kcal por 100 g</Text>
            </View>
            <Text style={styles.caloriasExactas}>{Math.round((alimentoSeleccionado.caloriasPor100g * (Number(gramos.replace(',', '.')) || 0)) / 100)} kcal</Text>
          </View>
          <View style={styles.gramosFila}>
            <Text style={styles.gramosLabel}>Cantidad (g)</Text>
            <TextInput
              value={gramos}
              onChangeText={setGramos}
              keyboardType="decimal-pad"
              style={styles.gramosInput}
              selectTextOnFocus
            />
            <Pressable onPress={agregarAlimento} style={styles.agregarBoton}>
              <Ionicons name="add" size={22} color={Colors.textOnPrimary} />
            </Pressable>
          </View>
          <Text style={styles.fuenteTexto}>{alimentoSeleccionado.fuente}</Text>
          {alimentoSeleccionado.nota ? <Text style={styles.notaTexto}>{alimentoSeleccionado.nota}</Text> : null}
        </Tarjeta>

        {alimentosAgregados.length > 0 && (
          <View style={styles.registrosLista}>
            <View style={styles.tituloFila}>
              <Text style={styles.seccion}>Registro de hoy</Text>
              <Text style={styles.contador}>{caloriasRegistradas} kcal</Text>
            </View>
            {planComidas.map((comida) => {
              const registrosComida = alimentosAgregados.filter((registro) => registro.comida === comida.id);
              if (registrosComida.length === 0) return null;
              const subtotal = registrosComida.reduce((total, registro) => total + registro.calorias, 0);
              return (
                <View key={comida.id} style={styles.comidaRegistro}>
                  <View style={styles.comidaRegistroTitulo}><Text style={styles.momento}>{comida.momento}</Text><Text style={styles.subtotal}>{subtotal} kcal</Text></View>
                  {registrosComida.map((registro) => (
                    <View key={registro.id} style={styles.registroFila}>
                      <View style={styles.registroInfo}><Text style={styles.registroNombre}>{registro.alimento.nombre}</Text><Text style={styles.registroDetalle}>{registro.gramos} g · {registro.calorias} kcal</Text></View>
                      <Pressable onPress={() => quitarAlimento(registro.id)} hitSlop={8}><Ionicons name="close-circle-outline" size={20} color={Colors.danger} /></Pressable>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {consumido.calorias > 0 && (
          <Tarjeta estilo={styles.restoCard}>
            <View style={styles.explicacionTitulo}>
              <Ionicons name={restoDelDia.estado === 'meta_alcanzada' ? 'leaf-outline' : 'time-outline'} size={20} color={Colors.primary} />
              <Text style={styles.restoTitulo}>Plan para el resto de tu día</Text>
              <Text style={styles.contador}>{Math.max(0, restoDelDia.restante.calorias)} kcal</Text>
            </View>
            <Text style={styles.restoMensaje}>{restoDelDia.mensaje}</Text>
            {restoDelDia.comidas.map((c) => (
              <View key={c.comidaId} style={styles.restoComida}>
                <Text style={styles.restoMomento}>{c.momento} · {c.aporte.calorias} kcal · {Math.round(c.aporte.proteinasG)} g proteína</Text>
                <Text style={styles.planPorciones}>{c.alimentos.map((a) => `${buscarAlimento(a.alimentoId)?.nombre ?? a.alimentoId} ${a.gramos} g`).join(' · ')}</Text>
              </View>
            ))}
            {restoDelDia.comidas.length > 0 && (
              ajusteAplicado ? (
                <Pressable onPress={quitarAjustesPendientes}><Text style={styles.restaurarTexto}>Aplicado a tu plan de hoy · Volver a las porciones originales</Text></Pressable>
              ) : (
                <Pressable onPress={aplicarRestoDelDia} style={styles.aplicarBoton} accessibilityRole="button"><Text style={styles.guardarTexto}>Aplicar a mi plan de hoy</Text></Pressable>
              )
            )}
          </Tarjeta>
        )}

        <View style={styles.tituloFila}>
          <View><Text style={styles.seccion}>Plan de comidas</Text><Text style={styles.seccionAyuda}>Plan diario: {caloriasPlan} kcal · Marca una comida al completarla. Toca ⇄ si te falta un ingrediente.</Text></View>
          <View style={styles.contadorColumna}><Text style={styles.contador}>{comidasCompletadas.length}/{planComidas.length}</Text><Pressable onPress={() => setModalPlan(true)}><Ionicons name="add-circle" size={25} color={Colors.primary} /></Pressable></View>
        </View>

        {explicaciones.length > 0 && (
          <View style={styles.explicacionCard}>
            <View style={styles.explicacionTitulo}><Ionicons name="school-outline" size={18} color={Colors.primaryDark} /><Text style={styles.explicacionEncabezado}>Por que cambiamos tu plan</Text><Pressable onPress={() => setExplicaciones([])} hitSlop={8}><Ionicons name="close" size={18} color={Colors.textMuted} /></Pressable></View>
            {explicaciones.map((texto) => <Text key={texto} style={styles.explicacionTexto}>{texto}</Text>)}
          </View>
        )}

        {noDisponibles.length > 0 && (
          <View style={styles.noDisponibles}>
            <Text style={styles.noDisponiblesTitulo}>No tienes ahora (toca para marcar como disponible):</Text>
            <View style={styles.opcionesFila}>
              {noDisponibles.map((id) => (
                <Pressable key={id} onPress={() => marcarDisponible(id)} style={styles.noDisponibleChip}>
                  <Text style={styles.noDisponibleTexto}>{buscarAlimento(id)?.nombre ?? id}</Text>
                  <Ionicons name="close" size={14} color={Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
            <Pressable onPress={restaurarPlan}><Text style={styles.restaurarTexto}>Restaurar plan original</Text></Pressable>
          </View>
        )}

        {planDeHoy.map((comida) => {
          const completada = comidasCompletadas.includes(comida.id);
          const ajustadaHoy = dia.valor.ajustesPlan.some((ajuste) => ajuste.comidaId === comida.id);
          return (
            <Pressable key={comida.id} onPress={() => alternarComida(comida.id)}>
              <Tarjeta estilo={{ ...styles.comida, ...(completada ? styles.comidaCompleta : {}) }}>
                <View style={styles.comidaIcono}>
                  <Ionicons name={comida.icono} size={22} color={Colors.primary} />
                </View>
                <View style={styles.comidaInfo}>
                  <Text style={styles.momento}>{comida.momento}</Text>
                  <Text style={styles.comidaTitulo}>{comida.titulo}</Text>
                  <Text style={styles.comidaDetalle}>{ajustadaHoy ? 'Porciones ajustadas para hoy' : comida.detalle}</Text>
                  <Text style={styles.planPorciones}>{porcionesDeComida(comida)}</Text>
                </View>
                <View style={styles.comidaMeta}>
                  <Text style={styles.comidaKcal}>{caloriasDeComida(comida)} kcal</Text>
                  <Ionicons
                    name={completada ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={completada ? Colors.success : Colors.textMuted}
                  />
                  <Pressable onPress={() => setComidaAjuste(comida.id)} style={styles.eliminarBoton} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Cambiar ingrediente de ${comida.momento}`}>
                    <Ionicons name="swap-horizontal-outline" size={19} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => eliminarComida(comida.id)} style={styles.eliminarBoton} accessibilityRole="button" accessibilityLabel={`Eliminar ${comida.momento}`}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              </Tarjeta>
            </Pressable>
          );
        })}

        <Tarjeta estilo={styles.aguaCard}>
          <View style={styles.aguaEncabezado}>
            <View>
              <Text style={styles.seccionInterna}>Hidratacion</Text>
              <Text style={styles.aguaTexto}>{vasosAgua} de 8 vasos registrados</Text>
            </View>
            <Ionicons name="water-outline" size={28} color={Colors.info} />
          </View>
          <View style={styles.vasos}>
            {Array.from({ length: 8 }, (_, indice) => (
              <Pressable
                key={indice}
                onPress={() => setVasosAgua(indice + 1 === vasosAgua ? indice : indice + 1)}
                style={[styles.vaso, indice < vasosAgua && styles.vasoActivo]}
              >
                <Ionicons name="water" size={17} color={indice < vasosAgua ? Colors.info : Colors.textMuted} />
              </Pressable>
            ))}

            <Modal visible={comidaAjuste !== null} transparent animationType="slide" onRequestClose={() => setComidaAjuste(null)}>
              <View style={styles.modalFondo}>
                <View style={styles.modalCaja}>
                  <View style={styles.modalEncabezado}>
                    <Text style={styles.modalTitulo}>¿Te falta algún ingrediente?</Text>
                    <Pressable onPress={() => setComidaAjuste(null)}><Ionicons name="close" size={24} color={Colors.textSecondary} /></Pressable>
                  </View>
                  <Text style={styles.modalAyuda}>Marca lo que no tienes. Lo reemplazamos por un alimento parecido, con las mismas calorias, en todas tus comidas.</Text>
                  {planComidas.find((comida) => comida.id === comidaAjuste)?.alimentos.map((ingrediente) => {
                    const alimento = buscarAlimento(ingrediente.alimentoId);
                    if (!alimento) return null;
                    return (
                      <View key={ingrediente.alimentoId} style={styles.ingredienteFila}>
                        <View style={styles.registroInfo}>
                          <Text style={styles.registroNombre}>{alimento.nombre}</Text>
                          <Text style={styles.registroDetalle}>{ingrediente.gramos} g · {calcularAportePorcion(alimento, ingrediente.gramos).calorias} kcal</Text>
                        </View>
                        <Pressable onPress={() => { marcarNoDisponible(ingrediente.alimentoId); setComidaAjuste(null); }} style={styles.noTengoBoton}>
                          <Text style={styles.noTengoTexto}>No lo tengo</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Modal>

            <Modal visible={modalPlan} transparent animationType="slide" onRequestClose={() => setModalPlan(false)}>
              <View style={styles.modalFondo}>
                <View style={styles.modalCaja}>
                  <View style={styles.modalEncabezado}>
                    <Text style={styles.modalTitulo}>Crear comida</Text>
                    <Pressable onPress={() => setModalPlan(false)}><Ionicons name="close" size={24} color={Colors.textSecondary} /></Pressable>
                  </View>
                  <Text style={styles.inputLabel}>Nombre de la comida</Text>
                  <TextInput value={nombreNuevaComida} onChangeText={setNombreNuevaComida} placeholder="Ej. Ensalada de atun" placeholderTextColor={Colors.textMuted} style={styles.modalInput} />
                  <Text style={styles.inputLabel}>Momento del día</Text>
                  <View style={styles.opcionesFila}>{['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Colacion'].map((momento) => <Pressable key={momento} onPress={() => setMomentoNuevaComida(momento)} style={[styles.opcionModal, momentoNuevaComida === momento && styles.opcionModalActiva]}><Text style={[styles.opcionModalTexto, momentoNuevaComida === momento && styles.opcionModalTextoActivo]}>{momento}</Text></Pressable>)}</View>
                  <Text style={styles.inputLabel}>Alimentos de la comida</Text>
                  <ScrollView style={styles.listaAlimentosModal} nestedScrollEnabled>
                    {alimentosUSDA.map((alimento) => {
                      const seleccionado = ingredientesNuevaComida.includes(alimento.id);
                      return <Pressable key={alimento.id} onPress={() => setIngredientesNuevaComida((actuales) => seleccionado ? actuales.filter((id) => id !== alimento.id) : [...actuales, alimento.id])} style={styles.alimentoModal}><Ionicons name={seleccionado ? 'checkbox' : 'square-outline'} size={21} color={seleccionado ? Colors.success : Colors.textMuted} /><Text style={styles.alimentoModalTexto}>{alimento.nombre}</Text><Text style={styles.alimentoModalKcal}>{alimento.caloriasPor100g} kcal/100 g</Text></Pressable>;
                    })}
                  </ScrollView>
                  <View style={styles.gramosNuevaFila}><Text style={styles.inputLabel}>Gramos por alimento</Text><TextInput value={gramosNuevaComida} onChangeText={setGramosNuevaComida} keyboardType="decimal-pad" style={styles.gramosNuevaInput} /></View>
                  <Pressable onPress={crearComida} style={styles.guardarBoton}><Text style={styles.guardarTexto}>Agregar al plan ({ingredientesNuevaComida.length})</Text></Pressable>
                </View>
              </View>
            </Modal>
          </View>
        </Tarjeta>

        <Boton
          titulo="Reiniciar plan del dia"
          variante="secondary"
          onPress={() => dia.actualizar((actual) => ({ ...actual, comidasCompletadas: [] }))}
          estilo={styles.boton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Totales del dia: alimentos registrados + comidas del plan marcadas como hechas. */
function totalesDelDia(dia: DiaNutricion, planComidas: Comida[]): AportePorcion {
  const comidasHechas = planComidas.filter((comida) => dia.comidasCompletadas.includes(comida.id));
  return sumarAportes([...dia.alimentos, ...comidasHechas.map(aporteDeComida)]);
}

function Macro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <View style={styles.macro}><Text style={styles.macroValor}>{valor}</Text><Text style={styles.macroEtiqueta}>{etiqueta}</Text></View>;
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  encabezado: { ...Typography.title, color: Colors.textPrimary },
  subencabezado: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  estadoDatos: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs },
  estadoError: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.xs },
  metaCard: { backgroundColor: Colors.primary, marginTop: Spacing.xl },
  metaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaEtiqueta: { ...Typography.label, color: Colors.textOnPrimary, opacity: 0.9 },
  metaCalorias: { ...Typography.display, color: Colors.textOnPrimary, marginTop: Spacing.xs },
  unidad: { ...Typography.bodyStrong, color: Colors.textOnPrimary },
  metaIcono: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: Spacing.lg, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 4, backgroundColor: Colors.accent },
  progresoTexto: { ...Typography.caption, color: Colors.textOnPrimary, marginTop: Spacing.sm, opacity: 0.9 },
  metaResumenFila: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  filaMacros: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, marginTop: Spacing.md, padding: Spacing.md, elevation: 1 },
  macro: { flex: 1, alignItems: 'center' },
  macroValor: { ...Typography.bodyStrong, color: Colors.textPrimary },
  macroEtiqueta: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  tituloFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  contadorColumna: { alignItems: 'center', gap: Spacing.xs },
  seccion: { ...Typography.sectionTitle, color: Colors.textPrimary },
  seccionAyuda: { ...Typography.caption, color: Colors.textSecondary, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  contador: { ...Typography.caption, color: Colors.primary },
  comida: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  comidaCompleta: { borderColor: Colors.success, backgroundColor: '#F1FBF4' },
  comidaIcono: { width: 42, height: 42, borderRadius: Radius.sm, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  comidaInfo: { flex: 1 },
  momento: { ...Typography.caption, color: Colors.primary },
  comidaTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary, marginTop: 2 },
  comidaDetalle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  planPorciones: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs, lineHeight: 16 },
  comidaMeta: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  comidaKcal: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  eliminarBoton: { marginTop: Spacing.sm, padding: 2 },
  aguaCard: { marginTop: Spacing.lg },
  aguaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionInterna: { ...Typography.bodyStrong, color: Colors.textPrimary },
  aguaTexto: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  vasos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg },
  vaso: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  vasoActivo: { backgroundColor: '#EAF1FF', borderColor: Colors.info },
  boton: { marginTop: Spacing.lg },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(43,33,24,0.35)' },
  modalCaja: { backgroundColor: Colors.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, maxHeight: '88%' },
  modalEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitulo: { ...Typography.subtitle, color: Colors.textPrimary },
  inputLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  modalInput: { height: 46, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, backgroundColor: Colors.surface, color: Colors.textPrimary, paddingHorizontal: Spacing.md, ...Typography.body },
  opcionesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  opcionModal: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  opcionModalActiva: { borderColor: Colors.primary, backgroundColor: Colors.surfaceAlt },
  opcionModalTexto: { ...Typography.caption, color: Colors.textSecondary },
  opcionModalTextoActivo: { color: Colors.primary },
  listaAlimentosModal: { maxHeight: 190, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  alimentoModal: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  alimentoModalTexto: { ...Typography.caption, color: Colors.textPrimary, flex: 1 },
  alimentoModalKcal: { ...Typography.caption, color: Colors.textMuted },
  gramosNuevaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gramosNuevaInput: { width: 80, height: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, backgroundColor: Colors.surface, color: Colors.textPrimary, textAlign: 'center', ...Typography.body },
  guardarBoton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.lg },
  guardarTexto: { ...Typography.button, color: Colors.textOnPrimary },
  restoCard: { marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.primaryLight, gap: Spacing.sm },
  restoTitulo: { ...Typography.bodyStrong, color: Colors.textPrimary, flex: 1 },
  restoMensaje: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  restoComida: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: Spacing.sm },
  restoMomento: { ...Typography.caption, color: Colors.primary },
  aplicarBoton: { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  notaTexto: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xs, fontStyle: 'italic' },
  explicacionCard: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  explicacionTitulo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  explicacionEncabezado: { ...Typography.bodyStrong, color: Colors.primaryDark, flex: 1 },
  explicacionTexto: { ...Typography.caption, color: Colors.textPrimary, lineHeight: 18 },
  noDisponibles: { marginBottom: Spacing.md },
  noDisponiblesTitulo: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  noDisponibleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  noDisponibleTexto: { ...Typography.caption, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  restaurarTexto: { ...Typography.caption, color: Colors.primary },
  modalAyuda: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  ingredienteFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: Spacing.sm },
  noTengoBoton: { borderWidth: 1, borderColor: Colors.danger, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  noTengoTexto: { ...Typography.caption, color: Colors.danger },
  fuenteIntro: { ...Typography.caption, color: Colors.textSecondary, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
  buscador: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  buscadorInput: { flex: 1, ...Typography.body, color: Colors.textPrimary, marginLeft: Spacing.sm },
  resultadosTexto: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
  catalogo: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  alimentoChip: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  alimentoChipActivo: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.primary },
  alimentoChipTexto: { ...Typography.caption, color: Colors.textSecondary },
  alimentoChipTextoActivo: { color: Colors.primary, fontWeight: '600' },
  comidaDestinoLabel: { ...Typography.label, color: Colors.textSecondary, marginTop: Spacing.md },
  comidaDestino: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  comidaDestinoActivo: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.primary },
  comidaDestinoTexto: { ...Typography.caption, color: Colors.textSecondary },
  comidaDestinoTextoActivo: { color: Colors.primary, fontWeight: '600' },
  selectorCard: { marginTop: Spacing.md },
  selectorTitulo: { flexDirection: 'row', alignItems: 'center' },
  selectorInfo: { flex: 1, marginLeft: Spacing.md },
  caloriasExactas: { ...Typography.bodyStrong, color: Colors.primary },
  gramosFila: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.sm },
  gramosLabel: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  gramosInput: { width: 76, height: 42, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, textAlign: 'center', color: Colors.textPrimary, ...Typography.body },
  agregarBoton: { width: 42, height: 42, borderRadius: Radius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  fuenteTexto: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.md },
  registrosLista: { marginTop: Spacing.sm },
  comidaRegistro: { marginBottom: Spacing.md },
  comidaRegistroTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  subtotal: { ...Typography.caption, color: Colors.primary },
  registroFila: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingVertical: Spacing.md },
  registroInfo: { flex: 1 },
  registroNombre: { ...Typography.bodyStrong, color: Colors.textPrimary },
  registroDetalle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  registroCalorias: { ...Typography.bodyStrong, color: Colors.primary, marginLeft: Spacing.sm },
});
