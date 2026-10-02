/**
 * VitalAI - Pantalla de Registro de Usuario
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Tarjeta';
import CampoTexto from '@/components/CampoTexto';
import Boton from '@/components/Boton';
import { registrarUsuario } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { validarRegistro } from '@/utils/validaciones';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout } from '@/constants/Layout';
import { calcularCaloriasObjetivo, calcularGET, calcularTMB } from '@/utils/calculoNutricional';
import { NivelActividad, ObjetivoComposicion, Sexo, PerfilUsuario } from '@/types/dataset';

export default function Registro() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const router = useRouter();
  const { refrescar } = useAuth();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [paso, setPaso] = useState<1 | 2>(1);
  const [sexo, setSexo] = useState<Sexo>('femenino');
  const [edad, setEdad] = useState('25');
  const [alturaCm, setAlturaCm] = useState('165');
  const [pesoKg, setPesoKg] = useState('65');
  const [actividad, setActividad] = useState<NivelActividad>('moderado');
  const [objetivo, setObjetivo] = useState<ObjetivoComposicion>('perdida_grasa');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarRegistro() {
    if (cargando) return;
    const errorValidacion = validarRegistro(
      nombre,
      correo,
      password,
      confirmar
    );
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    if (paso === 1) {
      setError(null);
      setPaso(2);
      return;
    }

    const edadNumero = Number(edad);
    const alturaNumero = Number(alturaCm);
    const pesoNumero = Number(pesoKg);
    if (!Number.isFinite(edadNumero) || edadNumero < 13 || edadNumero > 100 || !Number.isFinite(alturaNumero) || alturaNumero < 100 || alturaNumero > 240 || !Number.isFinite(pesoNumero) || pesoNumero < 30 || pesoNumero > 300) {
      setError('Revisa edad, altura y peso. Ingresa valores válidos para continuar.');
      return;
    }

    const perfil: PerfilUsuario = {
      idUsuario: `usr_${Date.now()}`,
      nombre,
      correo: correo.toLowerCase(),
      sexo,
      edad: edadNumero,
      alturaCm: alturaNumero,
      pesoInicialKg: pesoNumero,
      porcentajeGrasaInicial: null,
      objetivo,
      nivelActividad: actividad,
      fechaRegistro: new Date().toISOString().slice(0, 10),
    };

    setError(null);
    setCargando(true);
    try {
      const resultado = await registrarUsuario({ nombre, correo, password, perfil });
      if (resultado.exito) {
        await refrescar();
        router.replace('/(tabs)');
      } else {
        setError(resultado.mensaje ?? 'No se pudo crear la cuenta.');
      }
    } catch {
      setError('No se pudo crear la cuenta. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }

  function volverPasoAnterior() {
    setError(null);
    setPaso(1);
  }

  const caloriasEstimadas = paso === 2
    ? calcularCaloriasFormulario(sexo, pesoKg, alturaCm, edad, actividad, objetivo)
    : 0;

  return (
    <SafeAreaView style={styles.contenedor}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.volver}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <Logo tamano="md" />

          <Text style={styles.titulo}>{paso === 1 ? 'Crea tu cuenta' : 'Conoce tu punto de partida'}</Text>
          <Text style={styles.subtitulo}>
            {paso === 1 ? 'Empieza hoy tu camino hacia una vida más saludable.' : 'Usaremos estos datos para estimar tus calorias y personalizar tu plan.'}
          </Text>

          <View style={styles.formulario}>
            {paso === 1 ? <>
              <CampoTexto
              etiqueta="Nombre completo"
              icono="person-outline"
              placeholder="Tu nombre"
              value={nombre}
              onChangeText={setNombre}
              />
              <CampoTexto
              etiqueta="Correo electrónico"
              icono="mail-outline"
              placeholder="tucorreo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
              />
              <CampoTexto
              etiqueta="Contraseña"
              icono="lock-closed-outline"
              placeholder="Mínimo 6 caracteres"
              esPassword
              value={password}
              onChangeText={setPassword}
              />
              <CampoTexto
              etiqueta="Confirmar contraseña"
              icono="lock-closed-outline"
              placeholder="Repite tu contraseña"
              esPassword
              value={confirmar}
              onChangeText={setConfirmar}
              />
            </> : <>
              <Text style={styles.etiqueta}>Sexo biológico</Text>
              <Selector opciones={[['femenino', 'Mujer'], ['masculino', 'Hombre']]} valor={sexo} onChange={(valor) => setSexo(valor as Sexo)} />
              <View style={styles.filaCampos}>
                <CampoTexto etiqueta="Edad" icono="calendar-outline" keyboardType="number-pad" value={edad} onChangeText={setEdad} contenedorStyle={styles.campoMitad} />
                <CampoTexto etiqueta="Altura (cm)" icono="resize-outline" keyboardType="number-pad" value={alturaCm} onChangeText={setAlturaCm} contenedorStyle={styles.campoMitad} />
              </View>
              <CampoTexto etiqueta="Peso actual (kg)" icono="scale-outline" keyboardType="decimal-pad" value={pesoKg} onChangeText={setPesoKg} />
              <Text style={styles.etiqueta}>Nivel de actividad física</Text>
              <Selector opciones={[['sedentario', 'Sedentario'], ['ligero', 'Ligero'], ['moderado', 'Moderado'], ['activo', 'Activo'], ['muy_activo', 'Muy activo']]} valor={actividad} onChange={(valor) => setActividad(valor as NivelActividad)} />
              <Text style={styles.etiqueta}>¿Qué quieres lograr?</Text>
              <Selector opciones={[['perdida_grasa', 'Perder grasa'], ['mantenimiento', 'Mantenerme'], ['ganancia_muscular', 'Ganar músculo']]} valor={objetivo} onChange={(valor) => setObjetivo(valor as ObjetivoComposicion)} />
              <View style={styles.caloriasPreview}><Ionicons name="flame-outline" size={20} color={Colors.primary} /><Text style={styles.caloriasPreviewTexto}>Meta estimada: <Text style={styles.caloriasPreviewNumero}>{caloriasEstimadas || '--'} kcal/día</Text></Text></View>
            </>}

            {error && <Text style={styles.error}>{error}</Text>}

            <Boton
              titulo={paso === 1 ? 'Continuar' : 'Crear cuenta'}
              onPress={manejarRegistro}
              cargando={cargando}
              estilo={{ marginTop: Spacing.sm }}
            />
            {paso === 2 && <TouchableOpacity onPress={volverPasoAnterior} style={styles.atrasPaso}><Text style={styles.atrasPasoTexto}>Volver a los datos de cuenta</Text></TouchableOpacity>}
          </View>

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.pieEnlace}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function calcularCaloriasFormulario(
  sexo: Sexo,
  peso: string,
  altura: string,
  edad: string,
  actividad: NivelActividad,
  objetivo: ObjetivoComposicion
): number {
  const pesoNumero = Number(peso.replace(',', '.'));
  const alturaNumero = Number(altura.replace(',', '.'));
  const edadNumero = Number(edad);
  if (!pesoNumero || !alturaNumero || !edadNumero) return 0;
  const tmb = calcularTMB(sexo, pesoNumero, alturaNumero, edadNumero);
  return calcularCaloriasObjetivo(calcularGET(tmb, actividad), objetivo);
}

function Selector({
  opciones,
  valor,
  onChange,
}: {
  opciones: string[][];
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <View style={styles.selector}>
      {opciones.map(([clave, etiqueta]) => (
        <TouchableOpacity
          key={clave}
          onPress={() => onChange(clave)}
          style={[styles.opcion, valor === clave && styles.opcionActiva]}
        >
          <Text style={[styles.opcionTexto, valor === clave && styles.opcionTextoActivo]}>{etiqueta}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  volver: {
    marginBottom: Spacing.lg,
  },
  titulo: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
  },
  subtitulo: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formulario: {
    marginTop: Spacing.xl,
  },
  etiqueta: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  filaCampos: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  campoMitad: {
    flex: 1,
  },
  selector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  opcion: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.inputHeight / 2,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  opcionActiva: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primary,
  },
  opcionTexto: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  opcionTextoActivo: {
    color: Colors.primary,
  },
  caloriasPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Layout.inputHeight / 4,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  caloriasPreviewTexto: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  caloriasPreviewNumero: {
    ...Typography.bodyStrong,
    color: Colors.primary,
  },
  atrasPaso: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  atrasPasoTexto: {
    ...Typography.caption,
    color: Colors.primary,
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  pieTexto: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  pieEnlace: {
    ...Typography.bodyStrong,
    color: Colors.primary,
  },
}));
