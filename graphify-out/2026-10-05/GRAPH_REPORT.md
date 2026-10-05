# Graph Report - vitalai  (2026-10-05)

## Corpus Check
- 67 files · ~42,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .rules 1)

## Summary
- 562 nodes · 1481 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `39383b98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- perfil.tsx
- Registro
- package.json
- expo
- Requisitos del Perfil de Proyecto de Grado — VitalAI
- datosService.ts
- Entrenamiento
- dependencies
- index.tsx
- tsconfig.json
- 01-saludo-con-nombre.md
- nutricion.tsx
- asistente.tsx
- 02-ortografia-textos.md
- 03-color-subtitulo-coach.md
- useEscuchaVoz.ts
- app/_layout.tsx
- scripts
- devDependencies
- polyfills.ts
- expo-router

## God Nodes (most connected - your core abstractions)
1. `Nutricion()` - 36 edges
2. `react` - 28 edges
3. `useTema()` - 24 edges
4. `Asistente()` - 22 edges
5. `react-native` - 22 edges
6. `crearEstilos()` - 21 edges
7. `ejecutarHerramienta()` - 20 edges
8. `useAuth()` - 19 edges
9. `Colors` - 18 edges
10. `PerfilUsuario` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Componentes` --references--> `Boton()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/Boton.tsx
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `crearEstilos()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/constants/estilos.ts
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `TemaProvider()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/context/TemaContext.tsx
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `useTema()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/context/TemaContext.tsx
- `Donde se guardan los datos` --references--> `PerfilUsuario`  [INFERRED]
  README.md → src/types/dataset.ts

## Import Cycles
- None detected.

## Communities (22 total, 6 thin omitted)

### Community 0 - "perfil.tsx"
Cohesion: 0.06
Nodes (83): BENEFICIOS, Bienvenida(), styles, styles, styles, AvanceSemana, Ejercicio, OPCIONES_OBJETIVO (+75 more)

### Community 1 - "Registro"
Cohesion: 0.31
Nodes (8): Registro(), manejarRegistro(), Selector(), esCorreoValido(), esNombreValido(), esPasswordValida(), validarLogin(), validarRegistro()

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): description, main, name, private, version, @babel/core, babel-plugin-module-resolver, expo (+13 more)

### Community 3 - "expo"
Cohesion: 0.06
Nodes (34): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, typedRoutes, expo, android (+26 more)

### Community 4 - "Requisitos del Perfil de Proyecto de Grado — VitalAI"
Cohesion: 0.06
Nodes (34): App graphic assets (icon, splash, adaptive-icon, favicon), Orange/yellow project palette, 10. Cronograma (Figura 10.1 del perfil), 11. Prioridades sugeridas para cerrar la brecha, 1. Problema que resuelve, 2. Objetivo general, 3. Objetivos específicos, 4.1 Módulo de gestión de usuarios y perfiles (perfil §5.1) (+26 more)

### Community 5 - "datosService.ts"
Cohesion: 0.08
Nodes (46): Login(), manejarLogin(), manejarRecuperacion(), Sobre el dataset (observacion de la tutoria), firebase, @react-native-async-storage/async-storage, AuthContext, AuthContextValor (+38 more)

### Community 6 - "Entrenamiento"
Cohesion: 0.14
Nodes (13): Entrenamiento(), alternarEjercicio(), alternarRutina(), alternarComida(), Habito(), Metrica(), Progreso(), registrarPeso() (+5 more)

### Community 7 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, expo, expo-audio, expo-camera, expo-constants, expo-file-system, expo-font, @expo-google-fonts/google-sans (+22 more)

### Community 8 - "index.tsx"
Cohesion: 0.09
Nodes (28): BarraMacro(), Inicio(), Leyenda(), Metrica(), obtenerSaludo(), PREGUNTAS_RAPIDAS, styles, OpcionPaleta() (+20 more)

### Community 9 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

### Community 12 - "nutricion.tsx"
Cohesion: 0.05
Nodes (83): calcularCaloriasFormulario(), caloriasDeComida(), DIA_VACIO, DiaNutricion, Macro(), Nutricion(), agregarAlimento(), aplicarRestoDelDia() (+75 more)

### Community 13 - "asistente.tsx"
Cohesion: 0.06
Nodes (54): Asistente(), aceptarConsentimiento(), agregar(), conversarPorVoz(), enviar(), responder(), terminarVoz(), ICONO_ACCION (+46 more)

### Community 16 - "useEscuchaVoz.ts"
Cohesion: 0.20
Nodes (9): expo-audio, expo-file-system, AudioVoz, EscuchaVoz, EstadoEscucha, FinSinAudio, MIME, OPCIONES (+1 more)

### Community 17 - "app/_layout.tsx"
Cohesion: 0.36
Nodes (7): Enrutador(), RootLayout(), expo-font, @expo-google-fonts/google-sans, expo-status-bar, react-native-gesture-handler, Cargando()

### Community 18 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, ios, lint, start, web

### Community 19 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, @babel/core, babel-plugin-module-resolver, @types/react, typescript

## Knowledge Gaps
- **213 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 241 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VitalAI` connect `Requisitos del Perfil de Proyecto de Grado — VitalAI` to `datosService.ts`, `asistente.tsx`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `PerfilUsuario` connect `datosService.ts` to `perfil.tsx`, `nutricion.tsx`, `asistente.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `Sobre el dataset (observacion de la tutoria)` connect `datosService.ts` to `Requisitos del Perfil de Proyecto de Grado — VitalAI`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `perfil.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.061721611721611724 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._