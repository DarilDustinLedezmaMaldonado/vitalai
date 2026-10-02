/**
 * VitalAI - Constantes de layout
 * Espaciados, radios de borde y sombras unificados.
 * Mantener estos valores consistentes evita los problemas de interlineado
 * y espaciado dispar observados en el documento.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/**
 * Radios estilo Material 3 (formas redondeadas y amables). Para elementos
 * anidados: radio interior = radio exterior - padding (radios concentricos).
 */
export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
};

/**
 * Material 3 usa superficies casi planas: la profundidad viene del color
 * tonal, no de sombras grandes. `card` es apenas un realce.
 */
export const Shadow = {
  card: {
    shadowColor: '#2B2118',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  floating: {
    shadowColor: '#2B2118',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const Layout = {
  screenPadding: 20,
  inputHeight: 52,
  buttonHeight: 52,
};

export default { Spacing, Radius, Shadow, Layout };
