/**
 * VitalAI - Contexto global de autenticacion
 *
 * Provee el estado de sesion a toda la app y observa los cambios de
 * autenticacion. Funciona tanto en modo Firebase como en modo demo.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseConfigurado } from '@/services/firebase';
import { obtenerSesionDemo, cerrarSesion } from '@/services/authService';
import { actualizarPerfilDemo } from '@/services/authService';
import { guardarPerfil, obtenerPerfil } from '@/services/datosService';
import { EstadoAuth } from '@/types/auth';
import { PerfilUsuario } from '@/types/dataset';

interface AuthContextValor extends EstadoAuth {
  refrescar: () => Promise<void>;
  salir: () => Promise<void>;
  actualizarPerfil: (perfil: PerfilUsuario) => Promise<void>;
}

const estadoInicial: EstadoAuth = {
  cargando: true,
  autenticado: false,
  uid: null,
  correo: null,
  perfil: null,
};

const AuthContext = createContext<AuthContextValor>({
  ...estadoInicial,
  refrescar: async () => {},
  salir: async () => {},
  actualizarPerfil: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>(estadoInicial);

  /** Carga la sesion en modo demo desde AsyncStorage. */
  async function cargarDemo() {
    const sesion = await obtenerSesionDemo();
    if (sesion) {
      const perfilGuardado = await obtenerPerfil(sesion.uid).catch(() => null);
      setEstado({
        cargando: false,
        autenticado: true,
        uid: sesion.uid,
        correo: sesion.correo,
        perfil: perfilGuardado ?? sesion.perfil ?? null,
      });
    } else {
      setEstado({ ...estadoInicial, cargando: false });
    }
  }

  /** Carga el perfil del usuario de Firebase desde Firestore (usuarios/{uid}). */
  async function cargarFirebase(user: User) {
    let perfil = null;
    try {
      perfil = await obtenerPerfil(user.uid);
    } catch (e) {
      console.warn('[VitalAI] No se pudo leer el perfil de Firestore', e);
    }
    setEstado({
      cargando: false,
      autenticado: true,
      uid: user.uid,
      correo: user.email,
      perfil,
    });
  }

  useEffect(() => {
    if (firebaseConfigurado && auth) {
      // Modo Firebase: escucha cambios de sesion en tiempo real.
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          cargarFirebase(user);
        } else {
          setEstado({ ...estadoInicial, cargando: false });
        }
      });
      return unsub;
    }
    // Modo demo: carga unica desde almacenamiento local.
    cargarDemo();
  }, []);

  const refrescar = async () => {
    if (!firebaseConfigurado) {
      await cargarDemo();
      return;
    }
    // Tras el registro, el perfil se guarda despues de crear la cuenta.
    if (auth?.currentUser) await cargarFirebase(auth.currentUser);
  };

  const salir = async () => {
    try {
      await cerrarSesion();
    } finally {
      setEstado({ ...estadoInicial, cargando: false });
    }
  };

  const actualizarPerfil = async (perfil: PerfilUsuario) => {
    const uid = estado.uid ?? perfil.idUsuario;
    const perfilFinal: PerfilUsuario = {
      ...perfil,
      idUsuario: uid,
      correo: estado.correo ?? perfil.correo,
    };
    await guardarPerfil(uid, perfilFinal);
    if (!firebaseConfigurado) await actualizarPerfilDemo(perfilFinal);
    setEstado((actual) => ({ ...actual, perfil: perfilFinal }));
  };

  return (
    <AuthContext.Provider value={{ ...estado, refrescar, salir, actualizarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto de autenticacion. */
export function useAuth(): AuthContextValor {
  return useContext(AuthContext);
}
