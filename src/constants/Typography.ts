/**
 * VitalAI - Sistema tipografico
 * Familia: Google Sans (la de los productos de Google, licencia OFL).
 * Escala basada en la tipografia de Material 3.
 */

export const FontFamily = {
  regular: 'GoogleSans_400Regular',
  medium: 'GoogleSans_500Medium',
  semiBold: 'GoogleSans_600SemiBold',
  bold: 'GoogleSans_700Bold',
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
};

/**
 * Estilos tipograficos predefinidos para uso consistente en toda la app.
 */
export const Typography = {
  display: {
    fontFamily: FontFamily.medium,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xxl,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xl,
    lineHeight: 28,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.lg,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  button: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};

export default Typography;
