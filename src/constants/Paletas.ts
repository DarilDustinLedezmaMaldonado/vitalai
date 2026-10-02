/**
 * VitalAI - Paletas de color seleccionables
 *
 * Las tres comparten los mismos roles (Material 3), asi que cualquier
 * pantalla funciona con cualquiera. Contraste verificado: texto sobre fondo
 * y texto blanco sobre `primary` >= 4.5:1. Los colores de `metrica` son solo
 * para graficos (anillos, barras), nunca para texto.
 */

export type IdPaleta = 'fresca' | 'vibrante' | 'amanecer';

export interface Paleta {
  marca: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accent: string;
  accentDark: string;
  accentContainer: string;
  metrica: {
    calorias: string;
    agua: string;
    proteina: string;
    carbohidratos: string;
    grasas: string;
  };
  aguaContainer: string;
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  danger: string;
  info: string;
  infoContainer: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceContainer: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  divider: string;
  velo: string;
  shadow: string;
}

const ESTADOS = {
  success: '#1E8E3E',
  successContainer: '#E3F4E8',
  warning: '#F2B01E',
  warningContainer: '#FFF4D6',
  danger: '#D93025',
  textOnPrimary: '#FFFFFF',
  surface: '#FFFFFF',
};

/** A. Fresca: verde azulado + coral. */
const fresca: Paleta = {
  ...ESTADOS,
  marca: '#0E8C7A',
  primary: '#0B7A6A',            // blanco encima: 5.2:1
  primaryDark: '#05665A',
  primaryLight: '#7FD1C3',
  primaryContainer: '#D6F1EA',
  onPrimaryContainer: '#05453C',
  accent: '#FF7A59',
  accentDark: '#C2410C',
  accentContainer: '#FFE8E1',
  metrica: { calorias: '#FF7A59', agua: '#2F80ED', proteina: '#7C5CE0', carbohidratos: '#F2B01E', grasas: '#E8578A' },
  aguaContainer: '#E3EEFD',
  info: '#2F80ED',
  infoContainer: '#E3EEFD',
  background: '#F2FAF7',
  surfaceAlt: '#E6F5F0',
  surfaceContainer: '#E1F3EE',
  textPrimary: '#13201D',
  textSecondary: '#4A5C57',
  textMuted: '#62746E',
  border: '#D5E8E2',
  divider: '#E4F1EC',
  velo: 'rgba(19, 32, 29, 0.4)',
  shadow: '#13201D',
};

/** B. Vibrante: violeta + naranja de marca. */
const vibrante: Paleta = {
  ...ESTADOS,
  marca: '#6A55E6',
  primary: '#5B45D6',            // blanco encima: 6.4:1
  primaryDark: '#4532B8',
  primaryLight: '#B3A8F5',
  primaryContainer: '#ECE8FF',
  onPrimaryContainer: '#2A1C78',
  accent: '#FF7A1A',
  accentDark: '#C2410C',
  accentContainer: '#FFE7D6',
  metrica: { calorias: '#FF7A1A', agua: '#1FA9E0', proteina: '#6A55E6', carbohidratos: '#F5B21A', grasas: '#FF5C8A' },
  aguaContainer: '#DFF3FB',
  info: '#1F86C9',
  infoContainer: '#DFF3FB',
  background: '#F7F5FF',
  surfaceAlt: '#EFECFF',
  surfaceContainer: '#ECE8FF',
  textPrimary: '#1A1730',
  textSecondary: '#55516E',
  textMuted: '#6B6787',
  border: '#E1DCF7',
  divider: '#ECE9FA',
  velo: 'rgba(26, 23, 48, 0.4)',
  shadow: '#1A1730',
};

/** C. Amanecer: naranja intenso + turquesa + amarillo. */
const amanecer: Paleta = {
  ...ESTADOS,
  marca: '#F05A28',
  primary: '#C94A14',            // blanco encima: 4.7:1
  primaryDark: '#A63A0C',
  primaryLight: '#FFB08A',
  primaryContainer: '#FFE6D6',
  onPrimaryContainer: '#6A2200',
  accent: '#12A6B8',
  accentDark: '#0E7C8A',
  accentContainer: '#D9F4F6',
  metrica: { calorias: '#F05A28', agua: '#12A6B8', proteina: '#7B61FF', carbohidratos: '#F7B500', grasas: '#E8578A' },
  aguaContainer: '#D9F4F6',
  info: '#0E7C8A',
  infoContainer: '#D9F4F6',
  background: '#FFF7F0',
  surfaceAlt: '#FFEEE2',
  surfaceContainer: '#FFEBDD',
  textPrimary: '#231A14',
  textSecondary: '#5E5048',
  textMuted: '#7A6A60',
  border: '#F1E0D3',
  divider: '#F6EAE0',
  velo: 'rgba(35, 26, 20, 0.4)',
  shadow: '#231A14',
};

export const PALETAS: Record<IdPaleta, Paleta> = { fresca, vibrante, amanecer };

export const NOMBRE_PALETA: Record<IdPaleta, { nombre: string; descripcion: string }> = {
  fresca: { nombre: 'Fresca', descripcion: 'Verde azulado y coral' },
  vibrante: { nombre: 'Vibrante', descripcion: 'Violeta y naranja' },
  amanecer: { nombre: 'Amanecer', descripcion: 'Naranja, turquesa y amarillo' },
};

export const PALETA_POR_DEFECTO: IdPaleta = 'fresca';
