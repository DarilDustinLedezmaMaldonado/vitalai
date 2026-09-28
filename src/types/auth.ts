/**
 * VitalAI - Tipos del modulo de autenticacion y perfiles.
 */

import { PerfilUsuario } from './dataset';

/** Estado de la sesion del usuario dentro de la app. */
export interface EstadoAuth {
  cargando: boolean;
  autenticado: boolean;
  uid: string | null;
  correo: string | null;
  perfil: PerfilUsuario | null;
}

/** Credenciales para inicio de sesion. */
export interface CredencialesLogin {
  correo: string;
  password: string;
}

/** Datos para el registro de un nuevo usuario. */
export interface DatosRegistro {
  nombre: string;
  correo: string;
  password: string;
  perfil?: PerfilUsuario;
}

/** Resultado estandar de una operacion de autenticacion. */
export interface ResultadoAuth {
  exito: boolean;
  mensaje?: string;
}
