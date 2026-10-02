/**
 * VitalAI - Paleta "Fresca"
 *
 * Verde azulado (salud, frescura) con coral de acento, organizada con los
 * roles de color de Material 3. Cada metrica tiene su propio color, como en
 * Google Fit, para que el panel se lea de un vistazo.
 *
 * - `marca`: verde azulado vivo para logo, anillos y acentos graficos.
 * - `primary`: version profunda para fondos con texto blanco (contraste 5.2:1).
 * - `metrica.*`: solo para graficos (anillos, barras, puntos), nunca para texto:
 *   el coral y el ambar no alcanzan contraste suficiente como texto.
 */

export const Colors = {
  // Marca y primario
  marca: '#0E8C7A',            // Verde azulado VitalAI (logo, anillos, acentos)
  primary: '#0B7A6A',          // Fondos con texto blanco (botones, tarjeta principal)
  primaryDark: '#05665A',      // Texto de acento sobre fondos claros
  primaryLight: '#7FD1C3',     // Bordes suaves, pistas
  primaryContainer: '#D6F1EA', // Contenedor tonal (chips activos, indicador de pestaña)
  onPrimaryContainer: '#05453C',

  // Acento coral (energia, motivacion)
  accent: '#FF7A59',
  accentDark: '#C2410C',       // Coral para texto sobre claro (5.2:1)
  accentContainer: '#FFE8E1',

  // Colores por metrica (solo graficos)
  metrica: {
    calorias: '#FF7A59',       // coral
    agua: '#2F80ED',           // azul
    proteina: '#7C5CE0',       // violeta
    carbohidratos: '#F2B01E',  // ambar
    grasas: '#E8578A',         // rosa
  },
  aguaContainer: '#E3EEFD',

  // Estados / feedback
  success: '#1E8E3E',          // Meta cumplida
  successContainer: '#E3F4E8',
  warning: '#F2B01E',          // Alerta de hidratacion / recordatorio
  warningContainer: '#FFF4D6',
  danger: '#D93025',           // Error / fuera de balance
  info: '#2F80ED',             // Informacion neutra
  infoContainer: '#E3EEFD',

  // Superficies (fondo con leve tinte verde, no blanco plano)
  background: '#F2FAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#E6F5F0',       // Barra de navegacion, superficies suaves
  surfaceContainer: '#E1F3EE', // Metricas, entradas, pistas de barras

  // Texto
  textPrimary: '#13201D',
  textSecondary: '#4A5C57',    // 6.7:1
  textMuted: '#62746E',        // 4.7:1
  textOnPrimary: '#FFFFFF',

  // Bordes y divisores
  border: '#D5E8E2',
  divider: '#E4F1EC',

  // Velo detras de hojas modales
  velo: 'rgba(19, 32, 29, 0.4)',

  // Sombra
  shadow: '#13201D',
};

export default Colors;
