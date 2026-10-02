/**
 * VitalAI - Pestana de Perfil
 * Muestra los datos de la cuenta y permite cerrar sesion.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tarjeta } from '@/components/Tarjeta';
import Boton from '@/components/Boton';
import { useAuth } from '@/context/AuthContext';
import { firebaseConfigurado } from '@/services/firebase';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout, Radius } from '@/constants/Layout';
import CampoTexto from '@/components/CampoTexto';
import { perfilesDemo } from '@/data/datasetDemo';
import { calcularCaloriasObjetivo, calcularGET, calcularTMB } from '@/utils/calculoNutricional';
import { NivelActividad, ObjetivoComposicion, PerfilUsuario, Sexo } from '@/types/dataset';

/** Opciones del menu de perfil (en su mayoria pendientes). */
const OPCIONES = [
  { icono: 'person-outline', texto: 'Datos biometricos', disponible: false },
  { icono: 'flag-outline', texto: 'Mi objetivo', disponible: false },
  { icono: 'notifications-outline', texto: 'Notificaciones', disponible: false },
  { icono: 'shield-checkmark-outline', texto: 'Privacidad', disponible: false },
] as const;

export default function Perfil() {
  const { correo, perfil, salir, actualizarPerfil } = useAuth();
  const [cerrando, setCerrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const perfilBase = perfil ?? perfilesDemo[0];
  const [nombre, setNombre] = useState(perfilBase.nombre);
  const [edad, setEdad] = useState(String(perfilBase.edad));
  const [altura, setAltura] = useState(String(perfilBase.alturaCm));
  const [peso, setPeso] = useState(String(perfilBase.pesoInicialKg));
  const [grasa, setGrasa] = useState(perfilBase.porcentajeGrasaInicial?.toString() ?? '');
  const [sexo, setSexo] = useState<Sexo>(perfilBase.sexo);
  const [actividad, setActividad] = useState<NivelActividad>(perfilBase.nivelActividad);
  const [objetivo, setObjetivo] = useState<ObjetivoComposicion>(perfilBase.objetivo);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setNombre(perfilBase.nombre);
    setEdad(String(perfilBase.edad));
    setAltura(String(perfilBase.alturaCm));
    setPeso(String(perfilBase.pesoInicialKg));
    setGrasa(perfilBase.porcentajeGrasaInicial?.toString() ?? '');
    setSexo(perfilBase.sexo);
    setActividad(perfilBase.nivelActividad);
    setObjetivo(perfilBase.objetivo);
  }, [perfil?.idUsuario]);

  const caloriasEstimadas = calcularCaloriasPerfil(sexo, peso, altura, edad, actividad, objetivo);

  async function guardarPerfil() {
    const pesoNumero = Number(peso.replace(',', '.'));
    const alturaNumero = Number(altura);
    const edadNumero = Number(edad);
    if (!nombre.trim() || edadNumero < 13 || edadNumero > 100 || alturaNumero < 100 || alturaNumero > 240 || pesoNumero < 30 || pesoNumero > 300) {
      setMensaje('Revisa nombre, edad, altura y peso antes de guardar.');
      return;
    }
    const grasaNumero = grasa.trim() ? Number(grasa.replace(',', '.')) : null;
    if (grasaNumero !== null && (!Number.isFinite(grasaNumero) || grasaNumero < 3 || grasaNumero > 60)) {
      setMensaje('El porcentaje de grasa debe estar entre 3 y 60 %, o dejarse vacio.');
      return;
    }
    const perfilActualizado: PerfilUsuario = { ...perfilBase, nombre: nombre.trim(), edad: edadNumero, alturaCm: alturaNumero, pesoInicialKg: pesoNumero, porcentajeGrasaInicial: grasaNumero, sexo, nivelActividad: actividad, objetivo };
    setGuardando(true);
    setMensaje('');
    try {
      await actualizarPerfil(perfilActualizado);
      setMensaje('Perfil actualizado correctamente.');
    } catch {
      setMensaje('No se pudo guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarSalida() {
    if (cerrando) return;
    setCerrando(true);
    try {
      await salir();
    } finally {
      setCerrando(false);
    }
  }

  const inicial = (correo ?? 'V').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.encabezado}>Mi Perfil</Text>

        {/* Tarjeta de identidad */}
        <Tarjeta estilo={styles.tarjetaIdentidad}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{inicial}</Text>
          </View>
          <View style={styles.identidadInfo}>
            <Text style={styles.identidadCorreo}>
              {correo ?? 'Usuario VitalAI'}
            </Text>
            <View style={styles.modoEtiqueta}>
              <Ionicons
                name={firebaseConfigurado ? 'cloud-done-outline' : 'flask-outline'}
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.modoTexto}>
                {firebaseConfigurado ? 'Cuenta Firebase' : 'Modo demo local'}
              </Text>
            </View>
          </View>
        </Tarjeta>

        <Text style={styles.seccion}>Datos personales y objetivos</Text>
        <Tarjeta estilo={styles.editorCard}>
          <CampoTexto etiqueta="Nombre" icono="person-outline" value={nombre} onChangeText={setNombre} />
          <View style={styles.filaCampos}>
            <CampoTexto etiqueta="Edad" icono="calendar-outline" keyboardType="number-pad" value={edad} onChangeText={setEdad} contenedorStyle={styles.campoMitad} />
            <CampoTexto etiqueta="Altura (cm)" icono="resize-outline" keyboardType="number-pad" value={altura} onChangeText={setAltura} contenedorStyle={styles.campoMitad} />
          </View>
          <View style={styles.filaCampos}>
            <CampoTexto etiqueta="Peso inicial (kg)" icono="scale-outline" keyboardType="decimal-pad" value={peso} onChangeText={setPeso} contenedorStyle={styles.campoMitad} />
            <CampoTexto etiqueta="% grasa (opcional)" icono="body-outline" keyboardType="decimal-pad" value={grasa} onChangeText={setGrasa} contenedorStyle={styles.campoMitad} />
          </View>
          <Text style={styles.etiqueta}>Sexo biologico</Text>
          <Selector opciones={[['femenino', 'Mujer'], ['masculino', 'Hombre']]} valor={sexo} onChange={(valor) => setSexo(valor as Sexo)} />
          <Text style={styles.etiqueta}>Actividad fisica</Text>
          <Selector opciones={[['sedentario', 'Sedentario'], ['ligero', 'Ligero'], ['moderado', 'Moderado'], ['activo', 'Activo'], ['muy_activo', 'Muy activo']]} valor={actividad} onChange={(valor) => setActividad(valor as NivelActividad)} />
          <Text style={styles.etiqueta}>Objetivo</Text>
          <Selector opciones={[['perdida_grasa', 'Perder grasa'], ['mantenimiento', 'Mantenerme'], ['ganancia_muscular', 'Ganar musculo']]} valor={objetivo} onChange={(valor) => setObjetivo(valor as ObjetivoComposicion)} />
          <View style={styles.caloriasCard}><Ionicons name="flame-outline" size={22} color={Colors.primary} /><Text style={styles.caloriasTexto}>Meta estimada{`\n`}<Text style={styles.caloriasNumero}>{caloriasEstimadas || '--'} kcal/dia</Text></Text></View>
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
          <Boton titulo="Guardar cambios" onPress={guardarPerfil} cargando={guardando} />
        </Tarjeta>

        <Text style={styles.seccion}>Ajustes</Text>

        {OPCIONES.map((op) => (
          <View key={op.texto} style={styles.opcion}>
            <View style={styles.opcionIcono}>
              <Ionicons name={op.icono} size={20} color={Colors.primary} />
            </View>
            <Text style={styles.opcionTexto}>{op.texto}</Text>
            <Text style={styles.opcionEstado}>Proximamente</Text>
          </View>
        ))}

        <Boton
          titulo="Cerrar sesion"
          variante="secondary"
          onPress={manejarSalida}
          cargando={cerrando}
          deshabilitado={cerrando}
          estilo={{ marginTop: Spacing.xl }}
        />

        <Text style={styles.version}>VitalAI v0.3.0 - Avance 70%</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function calcularCaloriasPerfil(sexo: Sexo, peso: string, altura: string, edad: string, actividad: NivelActividad, objetivo: ObjetivoComposicion): number {
  const pesoNumero = Number(peso.replace(',', '.'));
  const alturaNumero = Number(altura);
  const edadNumero = Number(edad);
  if (!pesoNumero || !alturaNumero || !edadNumero) return 0;
  return calcularCaloriasObjetivo(calcularGET(calcularTMB(sexo, pesoNumero, alturaNumero, edadNumero), actividad), objetivo);
}

function Selector({ opciones, valor, onChange }: { opciones: string[][]; valor: string; onChange: (valor: string) => void }) {
  return <View style={styles.selector}>{opciones.map(([clave, etiqueta]) => <Pressable key={clave} onPress={() => onChange(clave)} style={[styles.opcionSelector, valor === clave && styles.opcionSelectorActiva]}><Text style={[styles.opcionSelectorTexto, valor === clave && styles.opcionTextoActivo]}>{etiqueta}</Text></Pressable>)}</View>;
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
  encabezado: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  tarjetaIdentidad: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarTexto: {
    ...Typography.title,
    color: Colors.textOnPrimary,
  },
  identidadInfo: {
    flex: 1,
  },
  identidadCorreo: {
    ...Typography.bodyStrong,
    color: Colors.textPrimary,
  },
  modoEtiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  modoTexto: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  editorCard: {
    marginTop: Spacing.sm,
  },
  filaCampos: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  campoMitad: {
    flex: 1,
  },
  etiqueta: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  opcionSelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  opcionSelectorActiva: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceAlt,
  },
  opcionSelectorTexto: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  opcionTextoActivo: {
    color: Colors.primary,
  },
  caloriasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  caloriasTexto: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  caloriasNumero: {
    ...Typography.bodyStrong,
    color: Colors.primary,
  },
  mensaje: {
    ...Typography.caption,
    color: Colors.success,
    marginBottom: Spacing.md,
  },
  seccion: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opcionIcono: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  opcionTexto: {
    ...Typography.bodyStrong,
    color: Colors.textPrimary,
    flex: 1,
  },
  opcionEstado: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  version: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
