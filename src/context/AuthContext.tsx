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
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigurado } from '@/services/firebase';
import { obtenerSesionDemo, cerrarSesion } from '@/services/authService';
import { actualizarPerfilDemo } from '@/services/authService';
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
      setEstado({
        cargando: false,
        autenticado: true,
        uid: sesion.uid,
        correo: sesion.correo,
        perfil: sesion.perfil ?? null,
      });
    } else {
      setEstado({ ...estadoInicial, cargando: false });
    }
  }

  useEffect(() => {
    if (firebaseConfigurado && auth) {
      // Modo Firebase: escucha cambios de sesion en tiempo real.
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          setEstado({
            cargando: false,
            autenticado: true,
            uid: user.uid,
            correo: user.email,
            perfil: null,
          });
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
    if (!firebaseConfigurado) await cargarDemo();
  };

  const salir = async () => {
    try {
      await cerrarSesion();
    } finally {
      setEstado({ ...estadoInicial, cargando: false });
    }
  };

  const actualizarPerfil = async (perfil: PerfilUsuario) => {
    if (!firebaseConfigurado) await actualizarPerfilDemo(perfil);
    setEstado((actual) => ({ ...actual, perfil }));
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
