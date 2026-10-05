# Graph Report - vitalai  (2026-10-02)

## Corpus Check
- 63 files · ~34,641 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .rules 1)

## Summary
- 522 nodes · 1392 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1ad1add`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- nutricion.tsx
- validaciones.ts
- package.json
- expo
- Requisitos del Perfil de Proyecto de Grado — VitalAI
- datosService.ts
- perfil.tsx
- dependencies
- Paletas.ts
- tsconfig.json
- 01-saludo-con-nombre.md
- herramientas.ts
- asistente.tsx
- 02-ortografia-textos.md
- 03-color-subtitulo-coach.md
- index.tsx
- app/_layout.tsx
- TemaContext.tsx
- scripts
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `Nutricion()` - 36 edges
2. `react` - 26 edges
3. `useTema()` - 24 edges
4. `react-native` - 21 edges
5. `crearEstilos()` - 20 edges
6. `ejecutarHerramienta()` - 20 edges
7. `useAuth()` - 19 edges
8. `PerfilUsuario` - 18 edges
9. `Colors` - 17 edges
10. `expo` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Componentes` --references--> `Boton()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/Boton.tsx
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `TemaProvider()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/context/TemaContext.tsx
- `Donde se guardan los datos` --references--> `PerfilUsuario`  [INFERRED]
  README.md → src/types/dataset.ts
- `Donde se guardan los datos` --references--> `RegistroDiario`  [INFERRED]
  README.md → src/types/dataset.ts
- `Componentes` --references--> `AnilloProgreso()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/AnilloProgreso.tsx

## Import Cycles
- None detected.

## Communities (21 total, 4 thin omitted)

### Community 0 - "nutricion.tsx"
Cohesion: 0.07
Nodes (65): BENEFICIOS, Bienvenida(), styles, Login(), manejarLogin(), styles, Registro(), Selector() (+57 more)

### Community 1 - "validaciones.ts"
Cohesion: 0.60
Nodes (5): esCorreoValido(), esNombreValido(), esPasswordValida(), validarLogin(), validarRegistro()

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (18): description, main, name, private, version, @babel/core, babel-plugin-module-resolver, expo (+10 more)

### Community 3 - "expo"
Cohesion: 0.05
Nodes (38): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, typedRoutes, expo, android (+30 more)

### Community 4 - "Requisitos del Perfil de Proyecto de Grado — VitalAI"
Cohesion: 0.06
Nodes (34): App graphic assets (icon, splash, adaptive-icon, favicon), Orange/yellow project palette, 10. Cronograma (Figura 10.1 del perfil), 11. Prioridades sugeridas para cerrar la brecha, 1. Problema que resuelve, 2. Objetivo general, 3. Objetivos específicos, 4.1 Módulo de gestión de usuarios y perfiles (perfil §5.1) (+26 more)

### Community 5 - "datosService.ts"
Cohesion: 0.07
Nodes (44): manejarRecuperacion(), manejarRegistro(), Entrenamiento(), alternarEjercicio(), alternarRutina(), setVasosAgua(), Sobre el dataset (observacion de la tutoria), AuthContext (+36 more)

### Community 6 - "perfil.tsx"
Cohesion: 0.14
Nodes (21): calcularCaloriasFormulario(), calcularCaloriasPerfil(), OPCIONES, OpcionPaleta(), Perfil(), Selector(), styles, perfilesDemo (+13 more)

### Community 7 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, expo, expo-camera, expo-constants, expo-font, @expo-google-fonts/google-sans, @expo-google-fonts/poppins, expo-haptics (+16 more)

### Community 8 - "Paletas.ts"
Cohesion: 0.22
Nodes (8): amanecer, ESTADOS, fresca, NOMBRE_PALETA, Paleta, PALETA_POR_DEFECTO, PALETAS, vibrante

### Community 9 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): expo/tsconfig.base, compilerOptions, baseUrl, paths, strict, extends, include

### Community 12 - "herramientas.ts"
Cohesion: 0.06
Nodes (68): caloriasDeComida(), DiaNutricion, Macro(), Nutricion(), agregarAlimento(), alternarComida(), aplicarRestoDelDia(), marcarNoDisponible() (+60 more)

### Community 13 - "asistente.tsx"
Cohesion: 0.08
Nodes (40): Asistente(), aceptarConsentimiento(), enviar(), ICONO_ACCION, Mensaje, styles, SUGERENCIAS, Donde se guardan los datos (+32 more)

### Community 16 - "index.tsx"
Cohesion: 0.08
Nodes (38): BarraMacro(), Inicio(), Leyenda(), Metrica(), obtenerSaludo(), PREGUNTAS_RAPIDAS, styles, Habito() (+30 more)

### Community 17 - "app/_layout.tsx"
Cohesion: 0.36
Nodes (7): Enrutador(), RootLayout(), expo-font, @expo-google-fonts/google-sans, expo-status-bar, react-native-gesture-handler, Cargando()

### Community 18 - "TemaContext.tsx"
Cohesion: 0.36
Nodes (7): @react-native-async-storage/async-storage, aplicarPaleta(), paletaActiva(), IdPaleta, TemaContext, TemaProvider(), TemaValor

### Community 19 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, android, ios, lint, start, web

### Community 20 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, @babel/core, babel-plugin-module-resolver, @types/react, typescript

## Knowledge Gaps
- **195 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VitalAI` connect `Requisitos del Perfil de Proyecto de Grado — VitalAI` to `datosService.ts`, `asistente.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `PerfilUsuario` connect `datosService.ts` to `nutricion.tsx`, `perfil.tsx`, `herramientas.ts`, `asistente.tsx`, `index.tsx`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `Sobre el dataset (observacion de la tutoria)` connect `datosService.ts` to `Requisitos del Perfil de Proyecto de Grado — VitalAI`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `nutricion.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07324244854317027 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `expo` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._