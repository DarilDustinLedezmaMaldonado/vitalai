/**
 * VitalAI - Modelos de dominio y estructura del dataset
 *
 * Estos tipos reflejan la estructura del dataset descrita en el Anexo A del
 * perfil de proyecto: dos entidades relacionadas por id_usuario.
 *   - PerfilUsuario  -> Tabla 1: perfiles de los usuarios
 *   - RegistroDiario -> Tabla 2: registros historicos de seguimiento
 *
 * El dataset alimenta los modulos de nutricion adaptativa y analisis de datos.
 */

/** Objetivo principal del usuario respecto a su composicion corporal. */
export type ObjetivoComposicion =
  | 'perdida_grasa'
  | 'ganancia_muscular'
  | 'mantenimiento';

/** Nivel de actividad fisica habitual (factor de calculo calorico). */
export type NivelActividad =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'activo'
  | 'muy_activo';

export type Sexo = 'masculino' | 'femenino';

/**
 * Tabla 1 del dataset: perfil del usuario que requiere seguimiento nutricional.
 */
export interface PerfilUsuario {
  idUsuario: string;          // clave primaria, relaciona con RegistroDiario
  nombre: string;
  correo: string;
  sexo: Sexo;
  edad: number;               // anios
  alturaCm: number;           // centimetros
  pesoInicialKg: number;      // kilogramos al momento del registro
  porcentajeGrasaInicial: number | null; // %, opcional
  objetivo: ObjetivoComposicion;
  nivelActividad: NivelActividad;
  fechaRegistro: string;      // ISO 8601
}

/**
 * Tabla 2 del dataset: registro historico diario de seguimiento.
 * Cada fila representa un dia de un usuario.
 */
export interface RegistroDiario {
  idRegistro: string;         // clave primaria
  idUsuario: string;          // clave foranea -> PerfilUsuario.idUsuario
  fecha: string;              // ISO 8601 (YYYY-MM-DD)
  pesoKg: number;             // peso registrado ese dia
  caloriasConsumidas: number; // kcal ingeridas
  caloriasQuemadas: number;   // kcal por actividad (Google Fit)
  proteinasG: number;         // gramos de proteina
  carbohidratosG: number;     // gramos de carbohidratos
  grasasG: number;            // gramos de grasa
  pasos: number;              // pasos del dia
  vasosAgua: number;          // vasos de agua consumidos
  cumplioPlan: boolean;       // si el usuario cumplio el plan del dia
}

/**
 * Requerimiento nutricional calculado para un usuario.
 * Resultado de los algoritmos del modulo de nutricion adaptativa.
 */
export interface RequerimientoNutricional {
  caloriasObjetivo: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
}

/** Resumen de progreso para el dashboard del modulo de analisis. */
export interface ResumenProgreso {
  idUsuario: string;
  pesoActualKg: number;
  variacionPesoKg: number;        // diferencia respecto al peso inicial
  adherenciaPorcentaje: number;   // % de dias que cumplio el plan
  diasRegistrados: number;
  caloriasPromedio: number;
}
