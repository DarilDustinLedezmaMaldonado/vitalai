# Plan 04 — Estética moderna y fluida al estilo Google (Material 3)

- Estado: implementado en Inicio, componentes base y barra de navegación (2026-10-02). Pedido por el usuario. Decisión de producto: alinear la app
  con la estética limpia y rápida de los productos de Google (Google Fit), dado que
  se integrará con Google Fit.
- Se conserva la identidad: naranja de marca, tono cálido y nombre VitalAI.

## Sistema de diseño (src/constants)
- Tipografía: Google Sans (OFL, @expo-google-fonts/google-sans) en lugar de Poppins.
- Color: roles tonales de Material 3 derivados del naranja de marca
  (primaryContainer, onPrimaryContainer, secondaryContainer, surfaceContainer...).
- Superficies planas: tarjetas sin sombra pesada, contenedores tonales, radio 24 (L) / 16 (M).
  Radios concéntricos: radio interior = radio exterior − padding (better-ui).
- Movimiento: tokens de duración y curvas de animate-expo
  (presión 120 ms, ease-out bezier(0.23, 1, 0.32, 1)); sin animación en cambio de pestaña.

## Componentes
- `Presionable`: escala 0.97 al presionar (feedback en press-in), respeta reducir movimiento.
- `Tarjeta` y `Boton` (estilo M3: botón lleno, tonal y de texto, en forma de píldora).
- `AnilloProgreso`: anillos concéntricos al estilo Google Fit (react-native-svg).
- Barra de navegación M3: indicador en píldora tras el ícono activo; ícono relleno
  si está activo y de contorno si no.
- Háptica (expo-haptics): una vibración por acción confirmada (comida hecha, vaso de agua).

## Pantallas
- Inicio: saludo con nombre y avatar; anillos de calorías y agua del día con macros;
  resto del día; métricas en contenedores tonales; coach.
- Resto de pantallas: heredan tokens y componentes; rediseño específico por pantalla
  en planes posteriores.
