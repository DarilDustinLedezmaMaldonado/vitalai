/**
 * VitalAI - Dataset sintetico de ejemplo
 *
 * Datos ficticios elaborados con fines de validacion del prototipo, conforme
 * al Anexo A del perfil de proyecto. Estructura de dos tablas relacionadas
 * por idUsuario:
 *   - perfilesDemo  -> Tabla 1: perfiles de usuario
 *   - registrosDemo -> Tabla 2: registros historicos diarios
 *
 * Este dataset alimenta los modulos de nutricion adaptativa y analisis de
 * datos durante el desarrollo, antes de contar con datos reales de usuarios.
 */

import { PerfilUsuario, RegistroDiario } from '@/types/dataset';

/** Tabla 1: perfiles de usuario sinteticos. */
export const perfilesDemo: PerfilUsuario[] = [
  {
    idUsuario: 'usr_001',
    nombre: 'Carla Mendoza',
    correo: 'carla.demo@vitalai.bo',
    sexo: 'femenino',
    edad: 27,
    alturaCm: 162,
    pesoInicialKg: 68.5,
    porcentajeGrasaInicial: 31,
    objetivo: 'perdida_grasa',
    nivelActividad: 'ligero',
    fechaRegistro: '2026-04-01',
  },
  {
    idUsuario: 'usr_002',
    nombre: 'Jorge Quispe',
    correo: 'jorge.demo@vitalai.bo',
    sexo: 'masculino',
    edad: 23,
    alturaCm: 175,
    pesoInicialKg: 64.0,
    porcentajeGrasaInicial: 15,
    objetivo: 'ganancia_muscular',
    nivelActividad: 'moderado',
    fechaRegistro: '2026-04-01',
  },
  {
    idUsuario: 'usr_003',
    nombre: 'Daniela Rojas',
    correo: 'daniela.demo@vitalai.bo',
    sexo: 'femenino',
    edad: 34,
    alturaCm: 168,
    pesoInicialKg: 60.2,
    porcentajeGrasaInicial: 24,
    objetivo: 'mantenimiento',
    nivelActividad: 'activo',
    fechaRegistro: '2026-04-02',
  },
];

/** Tabla 2: registros historicos diarios sinteticos. */
export const registrosDemo: RegistroDiario[] = [
  {
    idRegistro: 'reg_0001',
    idUsuario: 'usr_001',
    fecha: '2026-04-02',
    pesoKg: 68.5,
    caloriasConsumidas: 1620,
    caloriasQuemadas: 280,
    proteinasG: 118,
    carbohidratosG: 165,
    grasasG: 52,
    pasos: 6200,
    vasosAgua: 6,
    cumplioPlan: true,
  },
  {
    idRegistro: 'reg_0002',
    idUsuario: 'usr_001',
    fecha: '2026-04-03',
    pesoKg: 68.3,
    caloriasConsumidas: 1780,
    caloriasQuemadas: 190,
    proteinasG: 102,
    carbohidratosG: 198,
    grasasG: 61,
    pasos: 4100,
    vasosAgua: 4,
    cumplioPlan: false,
  },
  {
    idRegistro: 'reg_0003',
    idUsuario: 'usr_002',
    fecha: '2026-04-02',
    pesoKg: 64.0,
    caloriasConsumidas: 2740,
    caloriasQuemadas: 420,
    proteinasG: 165,
    carbohidratosG: 320,
    grasasG: 78,
    pasos: 9800,
    vasosAgua: 8,
    cumplioPlan: true,
  },
  {
    idRegistro: 'reg_0004',
    idUsuario: 'usr_003',
    fecha: '2026-04-03',
    pesoKg: 60.1,
    caloriasConsumidas: 2050,
    caloriasQuemadas: 510,
    proteinasG: 130,
    carbohidratosG: 210,
    grasasG: 66,
    pasos: 11200,
    vasosAgua: 7,
    cumplioPlan: true,
  },
];
