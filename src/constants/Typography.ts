/**
 * VitalAI - Sistema tipografico
 * Familia: Poppins (geometrica, amigable, alta legibilidad en movil).
 */

export const FontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
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
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
    lineHeight: 42,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xxl,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    lineHeight: 30,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: 26,
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
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
};

export default Typography;
