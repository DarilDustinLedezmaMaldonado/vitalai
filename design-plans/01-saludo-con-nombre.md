# Plan 01 — Saludo con el nombre del usuario

- Estado: implementado (2026-10-02) · Commit base: a04f343
- Hallazgo: Inicio muestra el correo como título del saludo.
- Evidencia: `app/(tabs)/index.tsx:43` renderiza `correo`; el registro pide "Nombre completo" (`app/(auth)/registro.tsx:145`) y `PerfilUsuario.nombre` lo guarda.
- Cambio: mostrar el primer nombre de `perfil.nombre`; si no existe, el correo.
- Superficies afectadas: Inicio.
- Verificación: con perfil "Daril Ledezma" el saludo dice "Daril"; sin perfil muestra el correo.
