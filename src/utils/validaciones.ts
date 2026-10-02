/**
 * VitalAI - Validaciones de formularios.
 * Funciones puras, faciles de cubrir con pruebas unitarias.
 */

/** Valida formato basico de correo electronico. */
export function esCorreoValido(correo: string): boolean {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patron.test(correo.trim());
}

/** Valida que la contrasena tenga la longitud minima requerida. */
export function esPasswordValida(password: string): boolean {
  return password.length >= 6;
}

/** Valida que un nombre no este vacio y tenga al menos 2 caracteres. */
export function esNombreValido(nombre: string): boolean {
  return nombre.trim().length >= 2;
}

/**
 * Valida un formulario de registro completo.
 * Devuelve el primer mensaje de error encontrado, o null si todo es valido.
 */
export function validarRegistro(
  nombre: string,
  correo: string,
  password: string,
  confirmar: string
): string | null {
  if (!esNombreValido(nombre)) return 'Ingresa tu nombre completo.';
  if (!esCorreoValido(correo)) return 'Ingresa un correo válido.';
  if (!esPasswordValida(password))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (password !== confirmar) return 'Las contraseñas no coinciden.';
  return null;
}

/** Valida un formulario de inicio de sesion. */
export function validarLogin(correo: string, password: string): string | null {
  if (!esCorreoValido(correo)) return 'Ingresa un correo válido.';
  if (password.length === 0) return 'Ingresa tu contraseña.';
  return null;
}
