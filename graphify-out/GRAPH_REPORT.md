# Graph Report - vitalai  (2026-10-05)

## Corpus Check
- 68 files · ~44,573 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .rules 1)

## Summary
- 585 nodes · 1545 edges · 22 communities (17 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `39383b98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- registro.tsx
- perfil.tsx
- package.json
- expo
- Requisitos del Perfil de Proyecto de Grado — VitalAI
- datosService.ts
- entrenamiento.tsx
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
- TemaContext.tsx

## God Nodes (most connected - your core abstractions)
1. `Nutricion()` - 36 edges
2. `Entrenamiento()` - 30 edges
3. `react` - 28 edges
4. `useTema()` - 24 edges
5. `Asistente()` - 22 edges
6. `react-native` - 22 edges
7. `crearEstilos()` - 21 edges
8. `ejecutarHerramienta()` - 20 edges
9. `useAuth()` - 19 edges
10. `Colors` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Componentes` --references--> `Boton()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/Boton.tsx
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `crearEstilos()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/constants/estilos.ts
- `Actualización 2026-10-02 — Paleta elegible por el usuario` --references--> `useTema()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/context/TemaContext.tsx
- `Componentes` --references--> `AnilloProgreso()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/AnilloProgreso.tsx
- `Componentes` --references--> `Presionable()`  [INFERRED]
  design-plans/04-estetica-material-google.md → src/components/Presionable.tsx

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "registro.tsx"
Cohesion: 0.07
Nodes (69): BENEFICIOS, Bienvenida(), styles, Login(), manejarLogin(), manejarRecuperacion(), styles, Registro() (+61 more)

### Community 1 - "perfil.tsx"
Cohesion: 0.11
Nodes (26): calcularCaloriasFormulario(), calcularCaloriasPerfil(), OPCIONES, OpcionPaleta(), Perfil(), Selector(), styles, Donde se guardan los datos (+18 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (21): description, main, name, private, version, @babel/core, babel-plugin-module-resolver, expo (+13 more)

### Community 3 - "expo"
Cohesion: 0.06
Nodes (34): backgroundColor, foregroundImage, adaptiveIcon, package, permissions, typedRoutes, expo, android (+26 more)

### Community 4 - "Requisitos del Perfil de Proyecto de Grado — VitalAI"
Cohesion: 0.05
Nodes (35): App graphic assets (icon, splash, adaptive-icon, favicon), Orange/yellow project palette, 10. Cronograma (Figura 10.1 del perfil), 11. Prioridades sugeridas para cerrar la brecha, 1. Problema que resuelve, 2. Objetivo general, 3. Objetivos específicos, 4.1 Módulo de gestión de usuarios y perfiles (perfil §5.1) (+27 more)

### Community 5 - "datosService.ts"
Cohesion: 0.11
Nodes (30): firebase, @react-native-async-storage/async-storage, AuthContext, AuthContextValor, AuthProvider(), cargarDemo(), cargarFirebase(), estadoInicial (+22 more)

### Community 6 - "entrenamiento.tsx"
Cohesion: 0.08
Nodes (39): AvanceSemana, Ejercicio, Entrenamiento(), abrirRegistro(), alternarEjercicio(), alternarRutina(), guardarSeries(), FilaSerie (+31 more)

### Community 7 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, expo, expo-audio, expo-camera, expo-constants, expo-file-system, expo-font, @expo-google-fonts/google-sans (+22 more)

### Community 8 - "index.tsx"
Cohesion: 0.13
Nodes (26): BarraMacro(), Inicio(), Leyenda(), Metrica(), obtenerSaludo(), PREGUNTAS_RAPIDAS, styles, Habito() (+18 more)

### Community 9 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

### Community 12 - "nutricion.tsx"
Cohesion: 0.06
Nodes (77): caloriasDeComida(), DIA_VACIO, DiaNutricion, Macro(), Nutricion(), agregarAlimento(), alternarComida(), aplicarRestoDelDia() (+69 more)

### Community 13 - "asistente.tsx"
Cohesion: 0.07
Nodes (51): Asistente(), aceptarConsentimiento(), agregar(), conversarPorVoz(), enviar(), responder(), terminarVoz(), ICONO_ACCION (+43 more)

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

### Community 21 - "TemaContext.tsx"
Cohesion: 0.11
Nodes (19): Actualización 2026-10-02 — Paleta elegible por el usuario, Actualización 2026-10-02 — Paleta "Fresca" (elegida por el usuario), Pantallas, Plan 04 — Estética moderna y fluida al estilo Google (Material 3), Sistema de diseño (src/constants), aplicarPaleta(), paletaActiva(), amanecer (+11 more)

## Knowledge Gaps
- **217 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+212 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 245 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VitalAI` connect `Requisitos del Perfil de Proyecto de Grado — VitalAI` to `perfil.tsx`, `asistente.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `Sobre el dataset (observacion de la tutoria)` connect `perfil.tsx` to `Requisitos del Perfil de Proyecto de Grado — VitalAI`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `PerfilUsuario` connect `perfil.tsx` to `registro.tsx`, `nutricion.tsx`, `datosService.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _217 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `registro.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06984126984126984 - nodes in this community are weakly interconnected._
- **Should `perfil.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._