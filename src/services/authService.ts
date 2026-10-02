/**
 * VitalAI - Servicio de Autenticacion
 *
 * Encapsula el registro, inicio y cierre de sesion.
 *
 * Tiene dos modos de operacion:
 *  1. MODO FIREBASE: cuando hay credenciales en app.json -> usa Firebase Auth.
 *  2. MODO DEMO: cuando no hay credenciales -> simula la autenticacion con
 *     AsyncStorage local. Permite probar el flujo de la app sin backend.
 *
 * El modo se decide automaticamente segun firebaseConfigurado.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigurado } from './firebase';
import { guardarPerfil } from './datosService';
import { CredencialesLogin, DatosRegistro, ResultadoAuth } from '@/types/auth';
import { PerfilUsuario } from '@/types/dataset';

const CLAVE_SESION_DEMO = '@vitalai_sesion_demo';
const CLAVE_USUARIOS_DEMO = '@vitalai_usuarios_demo';

/** Traduce codigos de error de Firebase a mensajes en espaniol. */
function traducirError(codigo: string): string {
  const mapa: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya esta registrado.',
    'auth/invalid-email': 'El formato del correo no es valido.',
    'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'La contrasena es incorrecta.',
    'auth/invalid-credential': 'Correo o contrasena incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta mas tarde.',
    'auth/network-request-failed': 'Sin conexion a internet. Revisa tu red.',
    'auth/missing-email': 'Ingresa tu correo electronico.',
    'permission-denied': 'Firestore rechazo la operacion. Revisa las reglas de seguridad.',
  };
  return mapa[codigo] ?? 'Ocurrio un error. Intenta nuevamente.';
}

/* ----------------------------- MODO DEMO ------------------------------ */

interface UsuarioDemo {
  uid: string;
  nombre: string;
  correo: string;
  password: string;
  perfil?: DatosRegistro['perfil'];
}

async function leerUsuariosDemo(): Promise<UsuarioDemo[]> {
  const raw = await AsyncStorage.getItem(CLAVE_USUARIOS_DEMO);
  return raw ? (JSON.parse(raw) as UsuarioDemo[]) : [];
}

async function registroDemo(datos: DatosRegistro): Promise<ResultadoAuth> {
  const usuarios = await leerUsuariosDemo();
  if (usuarios.some((u) => u.correo === datos.correo.toLowerCase())) {
    return { exito: false, mensaje: 'Este correo ya esta registrado.' };
  }
  const uid = `demo_${Date.now()}`;
  const perfil = datos.perfil ? { ...datos.perfil, idUsuario: uid } : undefined;
  const nuevo: UsuarioDemo = {
    uid,
    nombre: datos.nombre,
    correo: datos.correo.toLowerCase(),
    password: datos.password,
    perfil,
  };
  usuarios.push(nuevo);
  await AsyncStorage.setItem(CLAVE_USUARIOS_DEMO, JSON.stringify(usuarios));
  await AsyncStorage.setItem(CLAVE_SESION_DEMO, JSON.stringify(nuevo));
  if (perfil) await guardarPerfil(uid, perfil);
  return { exito: true };
}

async function loginDemo(cred: CredencialesLogin): Promise<ResultadoAuth> {
  const usuarios = await leerUsuariosDemo();
  const u = usuarios.find((x) => x.correo === cred.correo.toLowerCase());
  if (!u) return { exito: false, mensaje: 'No existe una cuenta con este correo.' };
  if (u.password !== cred.password) {
    return { exito: false, mensaje: 'La contrasena es incorrecta.' };
  }
  await AsyncStorage.setItem(CLAVE_SESION_DEMO, JSON.stringify(u));
  return { exito: true };
}

/* --------------------------- API PUBLICA ------------------------------ */

/** Registra un nuevo usuario. */
export async function registrarUsuario(
  datos: DatosRegistro
): Promise<ResultadoAuth> {
  if (!firebaseConfigurado || !auth) return registroDemo(datos);
  try {
    const { user } = await createUserWithEmailAndPassword(auth, datos.correo, datos.password);
    await updateProfile(user, { displayName: datos.nombre });
    // El perfil biometrico (Tabla 1 del dataset) se guarda en usuarios/{uid}.
    if (datos.perfil) {
      await guardarPerfil(user.uid, {
        ...datos.perfil,
        idUsuario: user.uid,
        correo: (user.email ?? datos.correo).toLowerCase(),
      });
    }
    return { exito: true };
  } catch (e: any) {
    return { exito: false, mensaje: traducirError(e?.code ?? '') };
  }
}

/** Envia el correo de restablecimiento de contrasena (solo modo Firebase). */
export async function recuperarPassword(correo: string): Promise<ResultadoAuth> {
  if (!firebaseConfigurado || !auth) {
    return {
      exito: false,
      mensaje: 'La recuperacion por correo requiere Firebase. En modo demo crea una cuenta nueva.',
    };
  }
  try {
    await sendPasswordResetEmail(auth, correo.trim());
    return {
      exito: true,
      mensaje: 'Te enviamos un correo para restablecer tu contrasena. Revisa tambien la carpeta de spam.',
    };
  } catch (e: any) {
    return { exito: false, mensaje: traducirError(e?.code ?? '') };
  }
}

/** Inicia sesion con correo y contrasena. */
export async function iniciarSesion(
  cred: CredencialesLogin
): Promise<ResultadoAuth> {
  if (!firebaseConfigurado || !auth) return loginDemo(cred);
  try {
    await signInWithEmailAndPassword(auth, cred.correo, cred.password);
    return { exito: true };
  } catch (e: any) {
    return { exito: false, mensaje: traducirError(e?.code ?? '') };
  }
}

/** Cierra la sesion actual. */
export async function cerrarSesion(): Promise<void> {
  if (!firebaseConfigurado || !auth) {
    await AsyncStorage.removeItem(CLAVE_SESION_DEMO);
    return;
  }
  await fbSignOut(auth);
}

/** Actualiza el perfil de la cuenta demo y de la sesion activa. */
export async function actualizarPerfilDemo(perfil: PerfilUsuario): Promise<void> {
  const usuarios = await leerUsuariosDemo();
  const sesion = await obtenerSesionDemo();
  const actualizados = usuarios.map((usuario) =>
    usuario.uid === perfil.idUsuario || usuario.uid === sesion?.uid
      ? { ...usuario, nombre: perfil.nombre, perfil }
      : usuario
  );
  await AsyncStorage.setItem(CLAVE_USUARIOS_DEMO, JSON.stringify(actualizados));
  if (sesion) {
    await AsyncStorage.setItem(CLAVE_SESION_DEMO, JSON.stringify({ ...sesion, nombre: perfil.nombre, perfil }));
  }
}

/** Recupera la sesion demo guardada (solo modo demo). */
export async function obtenerSesionDemo(): Promise<{
  uid: string;
  correo: string;
  nombre: string;
  perfil?: DatosRegistro['perfil'];
} | null> {
  const raw = await AsyncStorage.getItem(CLAVE_SESION_DEMO);
  return raw ? JSON.parse(raw) : null;
}
