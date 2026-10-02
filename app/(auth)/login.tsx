/**
 * VitalAI - Pantalla de Inicio de Sesion
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
import { iniciarSesion, recuperarPassword } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { validarLogin } from '@/utils/validaciones';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout } from '@/constants/Layout';

export default function Login() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const router = useRouter();
  const { refrescar } = useAuth();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function manejarRecuperacion() {
    setAviso(null);
    if (!correo.trim()) {
      setError('Escribe tu correo arriba y vuelve a tocar "Olvidaste tu contraseña".');
      return;
    }
    setError(null);
    const resultado = await recuperarPassword(correo);
    if (resultado.exito) setAviso(resultado.mensaje ?? null);
    else setError(resultado.mensaje ?? 'No se pudo enviar el correo.');
  }

  async function manejarLogin() {
    if (cargando) return;
    const errorValidacion = validarLogin(correo, password);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await iniciarSesion({ correo, password });
      if (resultado.exito) {
        await refrescar();
        router.replace('/(tabs)');
      } else {
        setError(resultado.mensaje ?? 'No se pudo iniciar sesión.');
      }
    } catch {
      setError('No se pudo conectar con el servicio. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }

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

          <Text style={styles.titulo}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitulo}>
            Ingresa para continuar tu progreso.
          </Text>

          <View style={styles.formulario}>
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
              placeholder="Tu contraseña"
              esPassword
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={manejarRecuperacion} style={styles.olvido}>
              <Text style={styles.olvidoTexto}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {error && <Text style={styles.error}>{error}</Text>}
            {aviso && <Text style={styles.aviso}>{aviso}</Text>}

            <Boton
              titulo="Iniciar sesión"
              onPress={manejarLogin}
              cargando={cargando}
              estilo={{ marginTop: Spacing.sm }}
            />
          </View>

          <View style={styles.pie}>
            <Text style={styles.pieTexto}>¿No tienes cuenta? </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/registro')}
            >
              <Text style={styles.pieEnlace}>Registrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginTop: Spacing.xxl,
  },
  subtitulo: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formulario: {
    marginTop: Spacing.xxl,
  },
  olvido: {
    alignSelf: 'flex-end',
  },
  olvidoTexto: {
    ...Typography.caption,
    color: Colors.primary,
  },
  aviso: {
    ...Typography.caption,
    color: Colors.success,
    textAlign: 'center',
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
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
