/**
 * VitalAI - Paleta de colores
 *
 * Tema calido (naranja de marca) organizado con los roles de color de
 * Material 3, la estetica de los productos de Google (Google Fit):
 * superficies limpias, contenedores tonales y un acento fuerte.
 *
 * - `marca` es el naranja vivo de VitalAI: logo, anillos de progreso, acentos.
 * - `primary` es la version profunda para fondos con texto blanco encima
 *   (contraste 3.4:1 frente a 2.6:1 del naranja de marca).
 */

export const Colors = {
  // Marca y primario
  marca: '#FF7A1A',            // Naranja VitalAI (logo, anillos, acentos)
  primary: '#E8600C',          // Fondos con texto blanco (botones, tarjeta principal)
  primaryDark: '#B84A00',      // Presionado / texto naranja sobre claro
  primaryLight: '#FFB37A',     // Pista de anillos, bordes suaves
  primaryContainer: '#FFE3D1', // Contenedor tonal (chips activos, indicador de pestaña)
  onPrimaryContainer: '#5A2300',

  // Secundario
  accent: '#FFC727',           // Amarillo motivacional (logros, hitos)
  accentDark: '#E0A800',

  // Estados / feedback (tonos Google)
  success: '#1E8E3E',          // Meta cumplida
  successContainer: '#E6F4EA',
  warning: '#F9AB00',          // Alerta de hidratacion / recordatorio
  danger: '#D93025',           // Error / fuera de balance
  info: '#1A73E8',             // Informacion neutra, agua
  infoContainer: '#E8F0FE',

  // Superficies
  background: '#FFFAF6',       // Fondo general (blanco calido)
  surface: '#FFFFFF',          // Tarjetas
  surfaceAlt: '#FFF1E8',       // Superficie tonal suave
  surfaceContainer: '#F7EFE9', // Contenedor neutro (metricas, entradas)

  // Texto
  textPrimary: '#1F1A16',      // Texto principal
  textSecondary: '#5C4F45',    // Texto secundario
  textMuted: '#857469',        // Texto tenue / placeholder (4.3:1)
  textOnPrimary: '#FFFFFF',    // Texto sobre primario

  // Bordes y divisores
  border: '#EADFD6',
  divider: '#F2E9E2',

  // Sombra
  shadow: '#2B2118',
};

export default Colors;
