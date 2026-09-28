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

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#2B2118',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
  screenPadding: Spacing.xl,
  inputHeight: 52,
  buttonHeight: 54,
};

export default { Spacing, Radius, Shadow, Layout };
