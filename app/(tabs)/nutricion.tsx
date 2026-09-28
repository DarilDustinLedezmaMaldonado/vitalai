/**
 * VitalAI - Modulo de nutricion adaptativa.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import Boton from '@/components/Boton';
import { perfilesDemo, registrosDemo } from '@/data/datasetDemo';
import { AlimentoUSDA, alimentosUSDA } from '@/data/alimentosUSDA';
import { calcularRequerimiento } from '@/utils/calculoNutricional';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

interface Comida {
  id: string;
  momento: string;
  titulo: string;
  detalle: string;
  calorias: number;
  icono: keyof typeof Ionicons.glyphMap;
  alimentos: IngredientePlan[];
}

interface IngredientePlan {
  alimentoId: string;
  gramos: number;
}

const COMIDAS: Comida[] = [
  { id: 'desayuno', momento: 'Desayuno', titulo: 'Avena, fruta y huevo', detalle: 'Avena, leche, banana y huevo', calorias: 0, icono: 'sunny-outline', alimentos: [{ alimentoId: 'avena-seca', gramos: 40 }, { alimentoId: 'leche-dos-por-ciento', gramos: 200 }, { alimentoId: 'banana-cruda', gramos: 100 }, { alimentoId: 'huevo-crudo', gramos: 50 }] },
  { id: 'almuerzo', momento: 'Almuerzo', titulo: 'Pollo, quinua y ensalada', detalle: 'Pechuga, quinua, tomate, lechuga y aceite de oliva', calorias: 0, icono: 'restaurant-outline', alimentos: [{ alimentoId: 'pollo-pechuga-cruda', gramos: 150 }, { alimentoId: 'quinua-cocida', gramos: 150 }, { alimentoId: 'tomate-crudo', gramos: 100 }, { alimentoId: 'lechuga-cruda', gramos: 60 }, { alimentoId: 'aceite-oliva', gramos: 5 }] },
  { id: 'merienda', momento: 'Merienda', titulo: 'Yogur, manzana y almendras', detalle: 'Yogur natural, manzana y almendras', calorias: 0, icono: 'cafe-outline', alimentos: [{ alimentoId: 'yogur-natural', gramos: 170 }, { alimentoId: 'manzana-cruda', gramos: 120 }, { alimentoId: 'almendra-cruda', gramos: 15 }] },
  { id: 'cena', momento: 'Cena', titulo: 'Trucha, papa y ensalada', detalle: 'Trucha, papa cocida, tomate y lechuga', calorias: 0, icono: 'moon-outline', alimentos: [{ alimentoId: 'trucha-cocida', gramos: 150 }, { alimentoId: 'papa-cocida', gramos: 150 }, { alimentoId: 'tomate-crudo', gramos: 100 }, { alimentoId: 'lechuga-cruda', gramos: 60 }] },
];

function caloriasDeComida(comida: Comida): number {
  return comida.alimentos.reduce((total, ingrediente) => {
    const alimento = alimentosUSDA.find((item) => item.id === ingrediente.alimentoId);
    return total + (alimento ? Math.round((alimento.caloriasPor100g * ingrediente.gramos) / 100) : 0);
  }, 0);
}

function porcionesDeComida(comida: Comida): string {
  return comida.alimentos.map((ingrediente) => {
    const alimento = alimentosUSDA.find((item) => item.id === ingrediente.alimentoId);
    return alimento ? `${alimento.nombre} ${ingrediente.gramos} g` : '';
  }).filter(Boolean).join(' · ');
}

const perfilDemo = perfilesDemo[0];

interface RegistroAlimento {
  id: string;
  alimento: AlimentoUSDA;
  gramos: number;
  calorias: number;
  comida: string;
}

export default function Nutricion() {
  const { perfil } = useAuth();
  const perfilActual = perfil ?? perfilDemo;
  const requerimiento = calcularRequerimiento(perfilActual);
  const registroInicial = registrosDemo.find((registro) => registro.idUsuario === perfilActual.idUsuario);
  const [comidasCompletadas, setComidasCompletadas] = useState<string[]>([]);
  const [planComidas, setPlanComidas] = useState<Comida[]>(COMIDAS);
  const [vasosAgua, setVasosAgua] = useState(registroInicial?.vasosAgua ?? 0);
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState(alimentosUSDA[0]);
  const [gramos, setGramos] = useState(String(alimentosUSDA[0].porcionSugeridaG));
  const [busqueda, setBusqueda] = useState('');
  const [comidaSeleccionada, setComidaSeleccionada] = useState(COMIDAS[0].id);
  const [alimentosAgregados, setAlimentosAgregados] = useState<RegistroAlimento[]>([]);
  const [modalPlan, setModalPlan] = useState(false);
  const [nombreNuevaComida, setNombreNuevaComida] = useState('');
  const [momentoNuevaComida, setMomentoNuevaComida] = useState('Colacion');
  const [gramosNuevaComida, setGramosNuevaComida] = useState('100');
  const [ingredientesNuevaComida, setIngredientesNuevaComida] = useState<string[]>([]);
  const caloriasAlimentos = alimentosAgregados.reduce((total, registro) => total + registro.calorias, 0);
  const caloriasComidas = planComidas.filter((comida) => comidasCompletadas.includes(comida.id)).reduce((total, comida) => total + caloriasDeComida(comida), 0);
  const caloriasPlan = planComidas.reduce((total, comida) => total + caloriasDeComida(comida), 0);
  const caloriasRegistradas = caloriasAlimentos + caloriasComidas;
  const porcentajeCalorias = Math.min(100, Math.round((caloriasRegistradas / requerimiento.caloriasObjetivo) * 100));

  function alternarComida(id: string) {
    setComidasCompletadas((actuales) => actuales.includes(id) ? actuales.filter((actual) => actual !== id) : [...actuales, id]);
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
    const calorias = Math.round((alimentoSeleccionado.caloriasPor100g * cantidad) / 100);
    setAlimentosAgregados((actuales) => [
      ...actuales,
      { id: `${alimentoSeleccionado.id}-${Date.now()}`, alimento: alimentoSeleccionado, gramos: cantidad, calorias, comida: comidaSeleccionada },
    ]);
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

  function eliminarComida(id: string) {
    setPlanComidas((actuales) => actuales.filter((comida) => comida.id !== id));
    setComidasCompletadas((actuales) => actuales.filter((comidaId) => comidaId !== id));
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
          <Macro etiqueta="Proteina" valor={`${requerimiento.proteinasG} g`} />
          <Macro etiqueta="Carbohidratos" valor={`${requerimiento.carbohidratosG} g`} />
          <Macro etiqueta="Grasas" valor={`${requerimiento.grasasG} g`} />
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
                {alimento.nombre}
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
                      <Ionicons name="checkmark-circle" size={19} color={Colors.success} />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.tituloFila}>
          <View><Text style={styles.seccion}>Plan de comidas</Text><Text style={styles.seccionAyuda}>Plan diario: {caloriasPlan} kcal · Marca una comida al completarla.</Text></View>
          <View style={styles.contadorColumna}><Text style={styles.contador}>{comidasCompletadas.length}/{planComidas.length}</Text><Pressable onPress={() => setModalPlan(true)}><Ionicons name="add-circle" size={25} color={Colors.primary} /></Pressable></View>
        </View>

        {planComidas.map((comida) => {
          const completada = comidasCompletadas.includes(comida.id);
          return (
            <Pressable key={comida.id} onPress={() => alternarComida(comida.id)}>
              <Tarjeta estilo={{ ...styles.comida, ...(completada ? styles.comidaCompleta : {}) }}>
                <View style={styles.comidaIcono}>
                  <Ionicons name={comida.icono} size={22} color={Colors.primary} />
                </View>
                <View style={styles.comidaInfo}>
                  <Text style={styles.momento}>{comida.momento}</Text>
                  <Text style={styles.comidaTitulo}>{comida.titulo}</Text>
                  <Text style={styles.comidaDetalle}>{comida.detalle}</Text>
                  <Text style={styles.planPorciones}>{porcionesDeComida(comida)}</Text>
                </View>
                <View style={styles.comidaMeta}>
                  <Text style={styles.comidaKcal}>{caloriasDeComida(comida)} kcal</Text>
                  <Ionicons
                    name={completada ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={completada ? Colors.success : Colors.textMuted}
                  />
                  <Pressable onPress={() => eliminarComida(comida.id)} style={styles.eliminarBoton}>
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
          onPress={() => setComidasCompletadas([])}
          estilo={styles.boton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return <View style={styles.macro}><Text style={styles.macroValor}>{valor}</Text><Text style={styles.macroEtiqueta}>{etiqueta}</Text></View>;
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  encabezado: { ...Typography.title, color: Colors.textPrimary },
  subencabezado: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
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
