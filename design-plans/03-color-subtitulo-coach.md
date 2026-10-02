# Plan 03 — Color del subtítulo de la tarjeta del coach

- Estado: implementado (2026-10-02) · Commit base: a04f343
- Hallazgo: el subtítulo usa `Colors.success`, reservado para "Meta cumplida".
- Evidencia: `app/(tabs)/index.tsx:282` (`asistenteEstado`); `src/constants/Colors.ts:19`; la tarjeta vecina usa `Colors.textSecondary` (`index.tsx:271`).
- Cambio: usar el color de texto secundario del sistema.
- Superficies afectadas: Inicio.
