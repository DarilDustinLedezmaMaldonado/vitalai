/**
 * VitalAI - Asistente (coach nutricional conversacional)
 *
 * Chat con el coach: entiende lenguaje natural para registrar comidas, agua y
 * peso, responde sobre el dia y recalcula el plan. Usa Gemini (Firebase AI
 * Logic) cuando esta disponible y respuestas basicas sin IA en caso contrario.
 *
 * Modo voz (manos libres): el coach escucha, responde en voz alta y vuelve a
 * escuchar, hasta que el usuario deja de hablar o toca "Terminar". Se abre
 * directo con el enlace vitalai://asistente?voz=1.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { perfilesDemo } from '@/data/datasetDemo';
import { guardarConfiguracion, obtenerConfiguracion } from '@/services/datosService';
import { obtenerPlanUsuario } from '@/services/registroDiaService';
import { AccionRealizada, ContextoAsistente } from '@/services/asistente/herramientas';
import {
  asistenteIADisponible,
  crearSesion,
  EntradaVoz,
  enviarMensaje,
  mensajeDeError,
  SesionAsistente,
} from '@/services/asistente/geminiService';
import { respuestaLocal } from '@/services/asistente/respuestaLocal';
import { callar, hablar } from '@/services/asistente/voz';
import { AudioVoz, useEscuchaVoz } from '@/hooks/useEscuchaVoz';
import { FaseVoz, PanelVoz } from '@/components/PanelVoz';
import { hapticaSeleccion } from '@/utils/haptica';
import { calcularRequerimiento } from '@/utils/calculoNutricional';
import { useTema } from '@/context/TemaContext';
import { crearEstilos } from '@/constants/estilos';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Layout, Radius, Spacing } from '@/constants/Layout';

interface Mensaje {
  id: string;
  autor: 'usuario' | 'asistente';
  texto: string;
  acciones?: AccionRealizada[];
  error?: boolean;
  /** Mensaje hablado: se muestra como nota de voz. */
  voz?: boolean;
}

const SUGERENCIAS = [
  'Desayuné 2 huevos y una banana',
  'Tomé 2 vasos de agua',
  '¿Qué como ahora?',
  '¿Cómo voy hoy?',
];

const ICONO_ACCION: Record<AccionRealizada['tipo'], keyof typeof Ionicons.glyphMap> = {
  alimento: 'restaurant-outline',
  comida: 'checkmark-done-outline',
  agua: 'water-outline',
  peso: 'scale-outline',
  deshacer: 'arrow-undo-outline',
};

export default function Asistente() {
  useTema(); // se vuelve a dibujar al cambiar la paleta
  const router = useRouter();
  const { q, voz } = useLocalSearchParams<{ q?: string; voz?: string }>();
  const { uid, perfil } = useAuth();
  const [consentimiento, setConsentimiento] = useState<boolean | null>(asistenteIADisponible ? null : true);
  const [contexto, setContexto] = useState<ContextoAsistente | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: 'saludo',
      autor: 'asistente',
      texto: 'Hola, soy tu coach de VitalAI. Cuéntame qué comiste, cuánta agua tomaste o pregúntame qué comer para llegar a tu meta.',
    },
  ]);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const sesion = useRef<SesionAsistente | null>(null);
  const scroll = useRef<ScrollView>(null);
  const preguntaInicialEnviada = useRef(false);
  const escucha = useEscuchaVoz();
  const [faseVoz, setFaseVoz] = useState<FaseVoz | null>(null);
  /** Sigue en modo voz: se consulta dentro del ciclo escuchar-responder. */
  const modoVoz = useRef(false);
  const vozInicialLanzada = useRef(false);

  // Consentimiento para enviar datos a la IA (usuarios/{uid}/configuracion/asistente).
  useEffect(() => {
    if (!uid || !asistenteIADisponible) return;
    obtenerConfiguracion<{ consentimientoIA?: string }>(uid, 'asistente')
      .then((config) => setConsentimiento(Boolean(config?.consentimientoIA)))
      .catch(() => setConsentimiento(false));
  }, [uid]);

  // Contexto minimo para el asistente: metas y comidas del plan (sin nombre ni correo).
  useEffect(() => {
    if (!uid) return;
    const perfilActual = { ...(perfil ?? perfilesDemo[0]), idUsuario: uid };
    obtenerPlanUsuario(uid)
      .then(({ plan }) => setContexto({
        uid,
        perfil: perfilActual,
        requerimiento: calcularRequerimiento(perfilActual),
        comidas: plan.map((c) => ({ id: c.id, momento: c.momento })),
      }))
      .catch((e) => console.warn('[VitalAI] No se pudo preparar el asistente', e));
  }, [uid, perfil]);

  const listo = contexto !== null && consentimiento === true;

  // Pregunta enviada desde Inicio (?q=...).
  useEffect(() => {
    if (listo && q && !preguntaInicialEnviada.current) {
      preguntaInicialEnviada.current = true;
      enviar(q);
    }
  }, [listo, q]);

  // Abierto con ?voz=1 (por ejemplo desde un atajo): empieza escuchando.
  useEffect(() => {
    if (listo && voz === '1' && asistenteIADisponible && !vozInicialLanzada.current) {
      vozInicialLanzada.current = true;
      conversarPorVoz();
    }
  }, [listo, voz]);

  // Al salir de la pantalla se corta la voz.
  useEffect(() => () => { modoVoz.current = false; callar(); }, []);

  async function aceptarConsentimiento() {
    if (!uid) return;
    setConsentimiento(true);
    await guardarConfiguracion(uid, 'asistente', { consentimientoIA: new Date().toISOString() }).catch(() => undefined);
  }

  function agregar(mensaje: Omit<Mensaje, 'id'>) {
    setMensajes((actuales) => [...actuales, { ...mensaje, id: `${Date.now()}${actuales.length}` }]);
  }

  async function enviar(texto: string) {
    const limpio = texto.trim();
    if (!limpio || pensando || !contexto) return;
    setEntrada('');
    agregar({ autor: 'usuario', texto: limpio });
    await responder(limpio);
  }

  /** Pide la respuesta al coach (texto o audio) y la agrega al chat. */
  async function responder(entradaUsuario: string | EntradaVoz): Promise<Mensaje | null> {
    if (!contexto) return null;
    setPensando(true);
    let respuesta: Mensaje;
    try {
      if (asistenteIADisponible) {
        sesion.current ??= crearSesion(contexto);
        const r = await enviarMensaje(sesion.current, entradaUsuario);
        respuesta = { id: `${Date.now()}a`, autor: 'asistente', texto: r.texto, acciones: r.acciones };
      } else {
        const r = await respuestaLocal(String(entradaUsuario), contexto);
        respuesta = { id: `${Date.now()}a`, autor: 'asistente', texto: r.texto };
      }
    } catch (e) {
      console.warn('[VitalAI] Error del asistente', e);
      // Un error no modifica el historial de la sesion: se conserva (y con
      // ella el modelo que funciona) para el proximo mensaje.
      respuesta = { id: `${Date.now()}a`, autor: 'asistente', texto: mensajeDeError(e), error: true };
    } finally {
      setPensando(false);
    }
    setMensajes((actuales) => [...actuales, respuesta]);
    return respuesta;
  }

  /**
   * Conversacion manos libres: escuchar -> responder -> leer en voz alta ->
   * volver a escuchar. Termina si el usuario no habla, toca "Terminar" o
   * hay un error.
   */
  async function conversarPorVoz() {
    if (!listo || pensando || modoVoz.current) return;
    modoVoz.current = true;
    hapticaSeleccion();
    callar();
    while (modoVoz.current) {
      setFaseVoz('escuchando');
      const r = await escucha.escuchar();
      if (!modoVoz.current) break;
      if ('motivo' in r) {
        if (r.motivo === 'sin-permiso') {
          agregar({ autor: 'asistente', texto: 'Necesito permiso para usar el micrófono. Actívalo en los ajustes del teléfono para hablarme.', error: true });
        } else if (r.motivo === 'error') {
          agregar({ autor: 'asistente', texto: 'No pude usar el micrófono. Intenta de nuevo.', error: true });
        }
        break;
      }
      const audio: AudioVoz = r.audio;
      agregar({ autor: 'usuario', texto: `Mensaje de voz · ${Math.max(1, Math.round(audio.duracionMs / 1000))} s`, voz: true });
      setFaseVoz('pensando');
      const respuesta = await responder({ base64: audio.base64, mimeType: audio.mimeType });
      if (!modoVoz.current || !respuesta) break;
      setFaseVoz('hablando');
      await hablar(respuesta.texto);
      if (respuesta.error) break;
    }
    modoVoz.current = false;
    setFaseVoz(null);
  }

  function terminarVoz() {
    modoVoz.current = false;
    escucha.cancelar();
    callar();
    setFaseVoz(null);
  }

  return (
    <SafeAreaView style={styles.contenedor} edges={['top', 'bottom']}>
      <View style={styles.encabezado}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.avatar}><Ionicons name="sparkles" size={18} color={Colors.textOnPrimary} /></View>
        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>Coach VitalAI</Text>
          <Text style={styles.estado}>{asistenteIADisponible ? 'Con IA (Gemini)' : 'Modo básico sin IA'}</Text>
        </View>
      </View>

      {consentimiento === false ? (
        <ScrollView contentContainerStyle={styles.consentimiento}>
          <Ionicons name="shield-checkmark-outline" size={40} color={Colors.primary} />
          <Text style={styles.consentimientoTitulo}>Antes de empezar</Text>
          <Text style={styles.consentimientoTexto}>
            El coach usa inteligencia artificial (Gemini, de Google) para entender lo que escribes o dices.
          </Text>
          <Text style={styles.consentimientoTexto}>
            • Enviamos solo tus mensajes, tu objetivo y tus metas del día. Nunca tu nombre ni tu correo.{'\n'}
            • En la versión gratuita, Google puede usar los mensajes para mejorar sus servicios. No escribas datos personales sensibles.{'\n'}
            • El coach no reemplaza a un profesional de salud ni da diagnósticos médicos.
          </Text>
          <Pressable onPress={aceptarConsentimiento} style={styles.botonPrimario} accessibilityRole="button">
            <Text style={styles.botonPrimarioTexto}>Acepto, empezar</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.enlace}>Ahora no</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scroll}
            contentContainerStyle={styles.chat}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {mensajes.map((m) => (
              <View key={m.id} style={[styles.burbuja, m.autor === 'usuario' ? styles.burbujaUsuario : styles.burbujaAsistente, m.error && styles.burbujaError]}>
                {m.voz ? (
                  <View style={styles.notaVoz}>
                    <Ionicons name="mic" size={16} color={Colors.textOnPrimary} />
                    <Text style={[styles.burbujaTexto, styles.burbujaTextoUsuario]}>{m.texto}</Text>
                  </View>
                ) : (
                  <Text style={[styles.burbujaTexto, m.autor === 'usuario' && styles.burbujaTextoUsuario]}>{m.texto}</Text>
                )}
                {m.acciones?.map((accion, i) => (
                  <View key={i} style={styles.accion}>
                    <Ionicons name={ICONO_ACCION[accion.tipo]} size={14} color={Colors.success} />
                    <Text style={styles.accionTexto}>{accion.descripcion}</Text>
                  </View>
                ))}
              </View>
            ))}
            {pensando && !faseVoz && (
              <View style={[styles.burbuja, styles.burbujaAsistente, styles.pensando]}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.pensandoTexto}>Pensando...</Text>
              </View>
            )}
            {!listo && <ActivityIndicator style={styles.cargando} color={Colors.primary} />}
          </ScrollView>

          {faseVoz ? (
            <PanelVoz fase={faseVoz} nivel={escucha.nivel} onListo={escucha.enviarYa} onTerminar={terminarVoz} />
          ) : (<>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugerenciasFila} contentContainerStyle={styles.sugerencias} keyboardShouldPersistTaps="handled">
            {SUGERENCIAS.map((s) => (
              <Pressable key={s} onPress={() => enviar(s)} style={styles.sugerencia} disabled={!listo || pensando}>
                <Text style={styles.sugerenciaTexto}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.entradaFila}>
            <TextInput
              value={entrada}
              onChangeText={setEntrada}
              onSubmitEditing={() => enviar(entrada)}
              placeholder={asistenteIADisponible ? 'Ej. almorcé pollo con arroz' : 'Pregunta por tu meta o progreso'}
              placeholderTextColor={Colors.textMuted}
              style={styles.entrada}
              editable={listo}
              returnKeyType="send"
            />
            {asistenteIADisponible && !entrada.trim() ? (
              <Pressable
                onPress={conversarPorVoz}
                disabled={!listo || pensando}
                style={[styles.enviar, (!listo || pensando) && styles.enviarInactivo]}
                accessibilityRole="button"
                accessibilityLabel="Hablar con el coach"
              >
                <Ionicons name="mic" size={20} color={Colors.textOnPrimary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => enviar(entrada)}
                disabled={!listo || pensando || !entrada.trim()}
                style={[styles.enviar, (!listo || pensando || !entrada.trim()) && styles.enviarInactivo]}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje"
              >
                <Ionicons name="send" size={18} color={Colors.textOnPrimary} />
              </Pressable>
            )}
          </View>
          </>)}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = crearEstilos(() => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.surface },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  encabezadoTexto: { flex: 1 },
  titulo: { ...Typography.bodyStrong, color: Colors.textPrimary },
  estado: { ...Typography.caption, color: Colors.textSecondary },
  chat: { padding: Layout.screenPadding, gap: Spacing.sm, flexGrow: 1 },
  burbuja: { maxWidth: '88%', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  burbujaAsistente: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  burbujaUsuario: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  burbujaError: { borderColor: Colors.danger },
  burbujaTexto: { ...Typography.body, color: Colors.textPrimary },
  burbujaTextoUsuario: { color: Colors.textOnPrimary },
  notaVoz: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  accion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  accionTexto: { ...Typography.caption, color: Colors.success, flex: 1 },
  pensando: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pensandoTexto: { ...Typography.caption, color: Colors.textSecondary },
  cargando: { marginTop: Spacing.lg },
  sugerenciasFila: { flexGrow: 0, flexShrink: 0 },
  sugerencias: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm },
  sugerencia: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  sugerenciaTexto: { ...Typography.caption, color: Colors.textSecondary },
  entradaFila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Layout.screenPadding, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.surface },
  entrada: { flex: 1, minWidth: 0, height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, color: Colors.textPrimary, ...Typography.body },
  enviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  enviarInactivo: { opacity: 0.5 },
  consentimiento: { padding: Layout.screenPadding, alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxl },
  consentimientoTitulo: { ...Typography.subtitle, color: Colors.textPrimary },
  consentimientoTexto: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  botonPrimario: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  botonPrimarioTexto: { ...Typography.button, color: Colors.textOnPrimary },
  enlace: { ...Typography.body, color: Colors.primary, marginTop: Spacing.sm },
}));
