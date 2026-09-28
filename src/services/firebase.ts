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

import Constants from 'expo-constants';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey ?? '',
  authDomain: extra.firebaseAuthDomain ?? '',
  projectId: extra.firebaseProjectId ?? '',
  storageBucket: extra.firebaseStorageBucket ?? '',
  messagingSenderId: extra.firebaseMessagingSenderId ?? '',
  appId: extra.firebaseAppId ?? '',
};

/** Indica si Firebase tiene credenciales configuradas. */
export const firebaseConfigurado: boolean =
  firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigurado) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
