# Requisitos del Perfil de Proyecto de Grado — VitalAI

Documento de referencia extraído del **perfil aprobado**
([perfil-proyecto-grado.pdf](perfil-proyecto-grado.pdf)). Sirve como lista de
control de todo lo que el sistema debe cumplir para que el producto final
coincida con lo comprometido en el perfil.

- **Título:** Sistema multiplataforma para la educación nutricional y el
  seguimiento dietético personalizado apoyado con inteligencia artificial
- **Universidad:** Universidad Privada del Valle — Facultad de Informática y Electrónica
- **Carrera:** Licenciatura en Ingeniería de Sistemas Informáticos
- **Postulante:** Daril Dustin Ledezma Maldonado
- **Tutor:** Ing. Ramiro Ramallo Rocha
- **Lugar y año:** Cochabamba – Bolivia, 2026

> **Leyenda de estado** (revisión del código al 2026-10-02):
> ✅ Implementado · 🟡 Parcial / solo en modo demo · ❌ Pendiente
>
> El estado es una evaluación sobre el código actual del repositorio. Actualízalo
> a medida que avances.

---

## 1. Problema que resuelve

**Formulación (perfil §2.2):** ¿De qué manera la ausencia de herramientas
digitales personalizadas y adaptadas al contexto boliviano limita la adherencia
nutricional y el cumplimiento de objetivos de composición corporal en usuarios
en Bolivia?

Causas que el sistema debe atacar:

- **Fatiga de registro:** anotar a mano cada caloría y ejercicio provoca abandono
  (más del 70 % tras el primer mes, Lister et al., 2014).
- **Falta de guía personalizada y motivación proactiva:** las apps no reaccionan
  cuando el ánimo del usuario decae ni ajustan los planes dinámicamente.
- **Falta de herramientas localizadas:** las apps extranjeras no consideran la
  oferta alimentaria ni la realidad económica de Bolivia.

## 2. Objetivo general

Desarrollar un sistema multiplataforma de seguimiento dietético y educación
nutricional personalizada, apoyado con inteligencia artificial, que permita
**generar planes alimenticios adaptativos** y **facilitar el registro diario de
consumo calórico** en el contexto boliviano.

## 3. Objetivos específicos

| # | Objetivo específico | Estado | Observación |
|---|---|---|---|
| OE1 | Módulo de **autenticación** para acceso seguro y **gestión de perfiles** de usuario | 🟡 | Login, registro, perfil (con % grasa) y recuperación de contraseña; el perfil se guarda en Firestore. Falta pantalla de privacidad y cargar las credenciales en `app.json` |
| OE2 | Estructurar un **dataset** con registros biométricos e históricos para entrenar y validar los algoritmos de nutrición adaptativa | 🟡 | Tablas 1 y 2 se guardan con datos reales en `usuarios/{uid}` y `registrosDiarios`; falta exportarlo (CSV) y recolectar datos de los participantes |
| OE3 | Módulo de **nutrición adaptativa con IA** que genere y **recalcule** planes alimenticios según la disponibilidad del usuario | 🟡 | Meta Mifflin-St Jeor + macros, plan de comidas y **recálculo por ingrediente faltante** con justificación educativa (`utils/sustitucion.ts`). Falta un modelo de IA entrenado con el dataset |
| OE4 | Módulo de **reconocimiento de imágenes** (visión por computadora) para identificar alimentos por foto y calcular calorías | ❌ | `expo-camera` y `expo-image-picker` instalados pero sin uso; falta el modelo (TensorFlow Lite / CNN) |
| OE5 | Módulo de **planificación de entrenamiento** con control de cargas y visualización del progreso temporal | 🟡 | Rutinas, ejercicios y planes personalizados y temporizador de descanso; falta registrar cargas y peso por sesión y el historial semanal |
| OE6 | Módulo de **asistencia de voz proactiva** con NLP para motivar y reducir la omisión de registros | ❌ | Solo existe un chat de texto con reglas fijas en Inicio (`preguntar()`); sin voz ni NLP |
| OE7 | Módulo de **integración pasiva** con ecosistemas de salud externos (actividad física automática) | ❌ | Google Fit no integrado |
| OE8 | **Interfaz intuitiva** con visión clara del avance hacia los objetivos de composición corporal | ✅ | Tema, navegación por pestañas y pantallas de Inicio y Progreso |
| OE9 | Módulo de **análisis de datos** y métricas de rendimiento para decisiones de estilo de vida | 🟡 | Inicio y Progreso usan el historial real (peso, adherencia, calorías, hábitos); faltan reportes semanales, predicción y notificaciones |

---

## 4. Alcance — funcionalidades comprometidas por módulo

### 4.1 Módulo de gestión de usuarios y perfiles (perfil §5.1)

- [x] Registro e inicio de sesión con autenticación segura
- [x] Perfil con datos biométricos iniciales: **peso, altura y % de grasa corporal**
- [x] Metas personalizadas: **pérdida de tejido adiposo, ganancia muscular o mantenimiento**
- [x] **Recuperación de cuenta** (restablecer contraseña por correo, modo Firebase)
- [ ] **Gestión de privacidad** de datos personales según normativa vigente
      *(en Ajustes figura como "Próximamente")*
- [~] **Dataset base** con perfiles e historial (peso, calorías, macros, actividad)
      que alimente la nutrición adaptativa y el análisis *(se guarda en Firestore;
      la actividad física llegará con Google Fit)*

### 4.2 Módulo de nutrición adaptativa con IA (perfil §5.2)

- [~] **Planes alimenticios dinámicos** basados en requerimientos calóricos y de
      macronutrientes calculados por **algoritmos de IA**
      *(hoy es una fórmula determinista, no un modelo de IA)*
- [x] **Recálculo instantáneo** de la dieta ante la falta de un ingrediente
      *(botón ⇄ en cada comida; conserva las calorías y recuerda lo que no tienes)*
- [x] **Registro diario** de alimentos con desglose de **proteínas, carbohidratos y grasas**
- [~] **Catálogo de alimentos y recetas** adaptados al **mercado local boliviano**
      *(28 alimentos, 10 locales: tarwi, habas, amaranto, mote, choclo, yuca, camote,
      plátano, queso fresco y charque, con valores USDA. Faltan recetas típicas y
      valores de la Tabla Boliviana de Composición de Alimentos)*
- [~] Cada recomendación debe ir acompañada de una **justificación educativa**
      (perfil §7.1.6) *(hecho en las sustituciones; falta en la meta y el plan diario)*
- [x] **Persistencia** de registros diarios y plan personalizado (Firestore / modo demo)

### 4.3 Módulo de planificación de entrenamiento (perfil §5.3)

- [x] **Rutinas semanales** por grupo muscular o nivel de intensidad
- [ ] Registro de **cargas, repeticiones y volumen total** por sesión
- [~] **Historial de entrenamiento** comparando con semanas anteriores (sobrecarga progresiva)
      *(el avance ya se guarda por semana; falta la vista comparativa y las cargas)*
- [~] **Cronómetro integrado** *(temporizador de descanso hecho)* y **guías visuales**
      de ejecución de ejercicios *(pendiente)*

### 4.4 Módulo de asistente de voz y motivación (perfil §5.4)

- [ ] **Saludos personalizados y recordatorios proactivos** por **síntesis de voz**
- [ ] **Interacción conversacional** para registrar comidas o pesajes por voz
- [ ] **Retroalimentación positiva** y felicitaciones automáticas al cumplir hitos diarios o semanales
- [ ] **Alertas de voz** de hidratación y de meta de pasos diarios
- Tecnología comprometida (§7.1.4 y §7.1.10): **OpenAI Whisper** (transcripción) +
  **Llama 3.2 3B** (interpretación de intenciones), ejecutados **localmente** en el dispositivo
- Solo en **español** (límite del perfil)
- El tono debe adaptarse a la etapa de adherencia del usuario (modelo transteórico, §7.1.7)

### 4.5 Módulo de integración pasiva — ecosistema de salud (perfil §5.5)

- [ ] **Sincronización automática con Google Fit**: pasos, distancia y calorías quemadas
- [ ] **Captura en segundo plano** sin que el usuario abra la app
- [ ] **Consolidación** de la actividad externa en el **balance calórico diario**

### 4.6 Módulo de análisis de datos (perfil §5.6)

- [~] **Dashboard** con métricas clave: **% de grasa actual** y **progreso hacia la meta**
      *(peso, cambio, adherencia y hábitos con datos reales; falta % de grasa en el tiempo)*
- [ ] **Reportes semanales** de adherencia con sugerencias de ajuste
- [ ] **Calendario predictivo** con la fecha estimada de logro según el ritmo real
- [ ] **Notificaciones inteligentes** sobre tendencias de peso y recomendaciones

### 4.7 Reconocimiento de alimentos por imagen (objetivo específico OE4, §7.1.3 y §7.1.9)

- [ ] Captura o selección de foto del alimento
- [ ] Clasificación con una **CNN** ejecutada con **TensorFlow Lite** en el dispositivo
- [ ] Cálculo automático del **aporte calórico y de macronutrientes** del alimento reconocido
- [ ] Funcionamiento sin enviar fotos a servidores externos (privacidad y conectividad intermitente)

### 4.8 Modelo de negocio Freemium (perfil §3.2 y §7.1.8)

- **Gratis:** seguimiento calórico y planificación básica
- **Premium:** nutrición adaptativa con IA, asistente de voz y análisis predictivo
- [ ] Diferenciar en la app las funciones gratuitas y premium (al menos a nivel de diseño o maqueta)

---

## 5. Límites (lo que el sistema NO hará)

- No da diagnósticos médicos ni prescripciones farmacológicas; solo recomendaciones
  de hábitos saludables y nutrición general.
- No vende suplementos, alimentos ni equipos.
- La precisión de los datos pasivos depende de los sensores del celular y de Google Fit.
- Sin facturación electrónica ni cobros por servicios externos en esta versión.
- Usa software libre como base, pero el código final **no** se distribuye como código abierto.
- Sin integración con redes sociales ni con sistemas gubernamentales de salud.
- No se responsabiliza por la información nutricional de terceros.
- El asistente de voz funciona **solo en español**.
- No hace análisis químico de alimentos; usa bases públicas y etiquetas.

> Recomendación: muestra en la app un **aviso legal** (disclaimer) que deje claros
> estos límites, sobre todo el de "no es diagnóstico médico".

---

## 6. Stack tecnológico comprometido

| Ámbito | Tecnología del perfil | Estado en el repo |
|---|---|---|
| Lenguaje y framework | JavaScript + React Native | ✅ (TypeScript, superconjunto de JS) |
| Herramientas móviles | Expo | ✅ |
| Backend (BaaS) | Firebase (Authentication y almacenamiento de datos) | 🟡 código listo (Auth + Firestore + reglas); faltan las credenciales en `app.json` |
| Analítica de uso | Firebase Analytics | ❌ |
| Visión por computadora | TensorFlow Lite (CNN) | ❌ |
| Voz y NLP | OpenAI Whisper + Llama 3.2 (3B), en el dispositivo | ❌ |
| Actividad física | Google Fit API | ❌ |
| Control de versiones | Git + GitHub | 🟡 Git local; falta el remoto en GitHub |
| Diseño UI/UX | Figma | — fuera del repo |
| Gestión | Scrum + Kanban (Trello) | — fuera del repo |

> ⚠️ **Riesgo técnico:** ejecutar Whisper y Llama 3.2 3B localmente y usar
> TensorFlow Lite requiere módulos nativos que **no funcionan en Expo Go**. Hará
> falta un *development build* (`npx expo prebuild` / EAS Build) o justificar en
> el informe una alternativa (por ejemplo, un modelo más pequeño o un servicio en
> la nube), dejando constancia del cambio respecto al perfil.

---

## 7. Pruebas comprometidas (perfil §7.4 y Capítulo III)

- [ ] **Unitarias:** cálculo de calorías, registro de usuarios y filtros de búsqueda
      *(no hay framework de pruebas instalado; se sugiere Jest + jest-expo)*
- [ ] **Integración:** visión por computadora + asistente + notificaciones; Firebase; Google Fit
- [ ] **Usabilidad:** navegación y uso del asistente de voz con usuarios reales
- [ ] **Rendimiento:** tiempo de respuesta, memoria y tasa de errores con varios usuarios a la vez
- [ ] **Plan de contingencia** y respuesta a incidentes

## 8. Metodología de validación

- Enfoque **mixto** (cualitativo + cuantitativo), investigación **aplicada** de alcance **descriptivo**.
- **Muestra:** 70 participantes de Cochabamba (no probabilística, por conveniencia).
- [ ] **Encuesta diagnóstica** (Google Forms) **antes** del desarrollo: línea base de adherencia
- [ ] **Encuesta de satisfacción** (escala de Likert y preguntas abiertas) **después** de probar el prototipo
- [ ] **Guía de observación** durante las pruebas: asistente de voz, registro por foto y dashboard
- [ ] **Firebase Analytics:** frecuencia de uso, funciones más usadas y tiempo de navegación

## 9. Índice tentativo del informe final

- **Cap. I – Marco teórico:** conceptual, técnico, metodologías ágiles, pruebas
- **Cap. II – Ingeniería del proyecto:** requerimientos (funcionales y no
  funcionales), arquitectura y base de datos, UI/UX y flujos, entrenamiento de IA
  (nutrición y visión), asistente de voz, integración con Google Fit
- **Cap. III – Pruebas y calidad:** unitarias, integración y sistema; usabilidad; plan de contingencia
- **Cap. IV – Estimación de costos:** esfuerzo y tiempo; herramientas y recursos
- **Cap. V – Plan de negocios:** Freemium y propuesta de valor; monetización y marketing; proyección financiera y punto de equilibrio
- **Cap. VI – Conclusiones y recomendaciones**, referencias y anexos

## 10. Cronograma (Figura 10.1 del perfil)

| # | Actividad | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | Revisión bibliográfica y fundamentación teórica | ● | ● | | | | | | |
| 2 | Determinación y especificación de requerimientos | | ● | | | | | | |
| 3 | Diseño de arquitectura, BD e interfaces (UI/UX) | | ● | ● | | | | | |
| 4 | Desarrollo de módulos (perfiles, nutrición, voz) | | | ● | ● | ● | | | |
| 5 | Entrenamiento del modelo de IA (nutrición y visión) | | | | ● | ● | | | |
| 6 | Integración con ecosistemas de salud (Google Fit) | | | | | ● | ● | | |
| 7 | Pruebas unitarias, integración y usabilidad con usuarios | | | | | | ● | ● | |
| 8 | Estimación de costos y plan de negocios | | | | | | | ● | |
| 9 | Conclusiones, recomendaciones y documentación final | | | | | | | | ● |

> 📅 Al **2 de octubre de 2026** el cronograma ubica al proyecto en **pruebas
> (actividad 7)** y **costos y plan de negocios (actividad 8)**. Las actividades
> 4, 5 y 6 (voz, entrenamiento de IA y visión, Google Fit) siguen pendientes en el
> código, así que van con retraso respecto al plan.

---

## 11. Prioridades sugeridas para cerrar la brecha

Ordenadas por peso en el perfil (cada objetivo específico se evalúa) y por esfuerzo:

1. ~~**Persistencia real** (Firestore) de perfiles, registros de comidas, entrenamientos
   y pesajes.~~ ✅ Hecho (2026-10-02).
2. ~~**Recuperación de contraseña**~~ ✅ Hecho. Falta una pantalla de **privacidad** para cerrar el OE1.
3. ~~**Recálculo del plan** por ingrediente no disponible~~ ✅ Hecho (2026-10-02).
   Alimentos bolivianos: 10 agregados; faltan **recetas típicas** (OE3).
4. **Entrenamiento:** registro de carga, repeticiones y volumen por sesión, más un
   historial semanal (OE5).
5. **Reconocimiento de alimentos por foto** con TensorFlow Lite (OE4). Requiere un
   development build.
6. **Google Fit:** pasos, distancia y calorías integrados al balance diario (OE7).
7. **Asistente de voz:** como mínimo, síntesis de voz para recordatorios y
   felicitaciones (`expo-speech`) y reconocimiento de voz para registrar (OE6).
8. **Análisis:** reporte semanal, calendario predictivo y notificaciones (`expo-notifications`) (OE9).
9. **Pruebas:** Jest para `calculoNutricional`, `validaciones` y `analisisService`,
   más las encuestas y la guía de observación con los 70 participantes.
