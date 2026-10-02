/**
 * VitalAI - Configuracion de Firebase (BaaS)
 *
 * Inicializa la conexion con Firebase para Autenticacion y Firestore.
 *
 * IMPORTANTE: Las llaves NO se escriben aqui directamente. Se leen desde
 * app.json (campo "extra") mediante expo-constants. Para que la app conecte,
 * completa esos valores con los de tu proyecto en Firebase Console:
 *   Firebase Console -> Configuracion del proyecto -> Tus apps -> Config web.
 *
 * Mientras los campos esten vacios, la app funciona en MODO DEMO
 * (ver authService.ts) para poder navegar sin backend configurado.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth, Persistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey ?? '',
  authDomain: extra.firebaseAuthDomain ?? '',
  projectId: extra.firebaseProjectId ?? '',
  storageBucket: extra.firebaseStorageBucket ?? '',
  messagingSenderId: extra.firebaseMessagingSenderId ?? '',
  appId: extra.firebaseAppId ?? '',
  // Reservado para Firebase Analytics (metricas de uso, perfil §8.3.3).
  measurementId: extra.firebaseMeasurementId ?? undefined,
};

/**
 * EXPO_PUBLIC_MODO_DEMO=1 fuerza el modo demo aunque haya credenciales
 * (pruebas o presentaciones sin internet):
 *   EXPO_PUBLIC_MODO_DEMO=1 npx expo start
 */
const modoDemoForzado = process.env.EXPO_PUBLIC_MODO_DEMO === '1';

/** Indica si Firebase tiene credenciales configuradas. */
export const firebaseConfigurado: boolean =
  !modoDemoForzado &&
  firebaseConfig.apiKey.length > 0 &&
  firebaseConfig.projectId.length > 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * En Android/iOS la sesion de Firebase Auth se guarda en AsyncStorage para
 * que el usuario no tenga que iniciar sesion cada vez que abre la app.
 * getReactNativePersistence solo existe en el build de React Native del SDK,
 * por eso se obtiene con require y no aparece en los tipos web.
 */
function crearAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') return getAuth(firebaseApp);
  try {
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth falla si Auth ya fue creado (recarga en caliente).
    return getAuth(firebaseApp);
  }
}

if (firebaseConfigurado) {
  const yaIniciada = getApps().length > 0;
  app = yaIniciada ? getApps()[0] : initializeApp(firebaseConfig);
  auth = yaIniciada ? getAuth(app) : crearAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
