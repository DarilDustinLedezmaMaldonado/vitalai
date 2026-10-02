# Plan 02 — Ortografía consistente en los textos visibles

- Estado: implementado (2026-10-02) · Commit base: a04f343
- Hallazgo: en una misma pantalla conviven textos con y sin tilde ("Dias registrados" junto a "Resto de tu día").
- Evidencia: `app/(tabs)/index.tsx:47,54,96,109,134` sin tilde vs `:70,112,119` con tilde; pestaña `title: 'Nutricion'`.
- Cambio: corregir tildes y eñes solo en textos visibles (JSX y mensajes al usuario).
- No tocar: identificadores, claves de datos y rutas (`'nutricion'` como clave de configuración, `'Colacion'` como momento guardado, categorías del catálogo usadas por la lógica).
- Superficies afectadas: todas las pantallas y mensajes de servicios que llegan al usuario.
- Verificación: `tsc` sin errores y recorrido visual de todas las pestañas.
