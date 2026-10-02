# VitalAI

**Sistema multiplataforma para la educacion nutricional y el seguimiento dietetico personalizado apoyado con Inteligencia Artificial en el contexto boliviano.**

Proyecto de Grado — Licenciatura en Ingenieria de Sistemas Informaticos
Universidad Privada del Valle (UNIVALLE) — Facultad de Informatica y Electronica

- **Postulante:** Daril Dustin Ledezma Maldonado
- **Tutor:** Ing. Ramiro Ramallo Rocha
- **Cochabamba, Bolivia — 2026**

> 📄 **Perfil aprobado:** [docs/perfil-proyecto-grado.pdf](docs/perfil-proyecto-grado.pdf) ·
> **Requisitos a cumplir y estado de avance:** [docs/REQUISITOS_PERFIL.md](docs/REQUISITOS_PERFIL.md)

---

## Estado del proyecto: avance del 70%

Este repositorio corresponde a una entrega funcional del **70% de avance** del
desarrollo de VitalAI. La aplicacion funciona en modo demo sin credenciales
externas y permite recorrer el flujo principal de seguimiento:

| Modulo | Estado |
|---|---|
| Estructura base del proyecto (Expo + TypeScript) | Completo |
| Arquitectura de carpetas escalable | Completo |
| Sistema de tema (colores, tipografia, layout) | Completo |
| Navegacion completa (Expo Router + tabs) | Completo |
| Modulo de autenticacion y perfiles | Completo |
| Configuracion de Firebase (con modo demo) | Completo |
| Persistencia en Firestore (perfil, registros diarios, entrenamiento, planes) | Completo |
| Recuperacion de contrasena por correo | Completo (modo Firebase) |
| Tipos y estructura del dataset (Anexo A) | Completo |
| Logica de calculo nutricional | Completo |
| Servicio de analisis del dataset | Completo |
| Dataset sintetico de validacion | Completo |
| Dashboard de inicio (vista previa) | Completo |
| Modulo de nutricion adaptativa con IA | Recalculo por ingrediente faltante; falta modelo IA |
| Cuestionario inicial y perfil nutricional | Completo en modo demo |
| Modulo de planificacion de entrenamiento | Completo en modo demo |
| Seguimiento de progreso y habitos | Completo en modo demo |
| Modulo de asistente de voz (NLP) | Fase posterior |
| Modulo de integracion pasiva (Google Fit) | Fase posterior |

---

## Tecnologias

- **Frontend movil:** React Native + Expo (TypeScript)
- **Navegacion:** Expo Router
- **Backend (BaaS):** Firebase (Authentication + Firestore)
- **Tipografia:** Poppins (`@expo-google-fonts/poppins`)
- **Almacenamiento local:** AsyncStorage

---

## Requisitos previos

- Node.js 18 o superior
- Aplicacion **Expo Go** instalada en un celular Android, o un emulador
- Cuenta de Firebase (opcional para esta fase, ver "Modo demo")

---

## Instalacion y ejecucion

1. Descomprime el proyecto y entra a la carpeta:

   ```bash
   cd vitalai
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:

   ```bash
   npx expo start
   ```

4. Escanea el codigo QR con la app **Expo Go** en tu celular Android.

---

## Modo demo y modo Firebase

La app funciona **sin necesidad de configurar Firebase** gracias a un
**modo demo**: el registro y el inicio de sesion se simulan localmente con
AsyncStorage. Esto permite probar todo el flujo de la app de inmediato.

Para activar el **modo Firebase real**, completa los campos del objeto
`extra` en `app.json` con las credenciales de tu proyecto:

```json
"extra": {
  "firebaseApiKey": "TU_API_KEY",
  "firebaseAuthDomain": "tu-proyecto.firebaseapp.com",
  "firebaseProjectId": "tu-proyecto",
  "firebaseStorageBucket": "tu-proyecto.appspot.com",
  "firebaseMessagingSenderId": "TU_SENDER_ID",
  "firebaseAppId": "TU_APP_ID"
}
```

Estos valores se obtienen en:
Firebase Console -> Configuracion del proyecto -> Tus apps -> Config (web).

En Firebase Console tambien debes:

1. **Authentication -> Metodo de inicio de sesion:** habilitar *Correo/contrasena*.
2. **Firestore Database:** crear la base de datos.
3. **Firestore -> Reglas:** pegar el contenido de [`firestore.rules`](firestore.rules)
   y publicar (cada usuario solo puede leer y escribir sus propios datos).

### Donde se guardan los datos

Ambos modos usan la misma estructura (`src/services/datosService.ts`). En modo
Firebase son documentos de Firestore; en modo demo se guardan en el celular.

| Ruta | Contenido |
|---|---|
| `usuarios/{uid}` | Perfil biometrico (Tabla 1 del dataset, `PerfilUsuario`) |
| `usuarios/{uid}/registrosDiarios/{YYYY-MM-DD}` | Registro del dia (Tabla 2, `RegistroDiario`): calorias, macros, agua, peso, cumplimiento, alimentos y comidas marcadas |
| `usuarios/{uid}/entrenamientoSemanal/{lunes}` | Rutinas y ejercicios completados en la semana |
| `usuarios/{uid}/configuracion/nutricion` | Plan de comidas personalizado |
| `usuarios/{uid}/configuracion/entrenamiento` | Ejercicios y planes de entrenamiento personalizados |

Un dia cuenta como **plan cumplido** cuando las calorias consumidas quedan
dentro de +-10 % de la meta diaria; ese valor alimenta la adherencia.

Durante el registro, VitalAI solicita sexo, edad, altura, peso, nivel de
actividad y objetivo. Con esos datos calcula una meta calorica inicial mediante
Mifflin-St Jeor, factor de actividad y ajuste por objetivo.

La app detecta automaticamente si hay credenciales y cambia de modo.

## Fuente de datos nutricionales

El registro de alimentos utiliza un catalogo local basado en **USDA FoodData
Central, base SR Legacy**. Cada alimento conserva su nombre, categoria, valores
por 100 g, porcion sugerida y enlace de consulta oficial. La aplicacion calcula
la energia de la porcion ingresada con la formula:

`calorias = calorias_por_100_g * gramos / 100`

Fuente y documentacion oficial: https://fdc.nal.usda.gov/api-guide.html

El catalogo incluye alimentos del mercado boliviano (tarwi, habas, amaranto,
mote, choclo, yuca, camote, platano, queso fresco y charque) marcados como
`local: true`. Cuando la ficha USDA es solo la referencia mas cercana (por
ejemplo, lupino para el tarwi), el campo `nota` lo aclara y se muestra en la app.

### Recalculo del plan

Si al usuario le falta un ingrediente, el boton de intercambio de cada comida
lo reemplaza por el alimento disponible mas parecido (`src/utils/sustitucion.ts`):
mismo grupo de alimentos, distribucion de energia (proteina/carbohidrato/grasa)
mas cercana y porcion ajustada para conservar las calorias. Cada cambio muestra
una explicacion educativa.

### Plan para el resto del dia

`src/utils/planificacionDia.ts` recalcula las comidas pendientes segun lo que
el usuario ya comio. Parte de su propio plan y ajusta porciones: primero cubre
la proteina que falta (lo que mas sacia), mantiene o aumenta verduras y frutas,
y reparte el resto entre almidones y grasas. Si la meta ya se alcanzo propone
opciones ligeras sin sugerir ayunos; si falta mucho y es tarde, limita la porcion.
El ajuste se guarda solo para ese dia y no modifica el plan base.

### Modo demo forzado

Para pruebas o presentaciones sin internet se puede ignorar Firebase:

```bash
EXPO_PUBLIC_MODO_DEMO=1 npx expo start
```

Los valores corresponden a alimentos de referencia, no a marcas comerciales ni
a preparaciones con aceite, azucar o ingredientes adicionales. Para comparar
resultados correctamente se debe registrar el alimento en el mismo estado que
indica su ficha, por ejemplo, crudo o cocido.

---

## Estructura del proyecto

```
vitalai/
├── app/                       # Rutas y pantallas (Expo Router)
│   ├── (auth)/                # Bienvenida, login, registro
│   ├── (tabs)/                # Inicio, nutricion, entreno, progreso, perfil
│   └── _layout.tsx            # Layout raiz (fuentes + enrutado por sesion)
├── src/
│   ├── components/            # Boton, CampoTexto, Tarjeta, Logo, etc.
│   ├── constants/             # Colores, tipografia, layout
│   ├── context/               # AuthContext (estado global de sesion)
│   ├── data/                  # Dataset sintetico de validacion
│   ├── services/              # Firebase, autenticacion, analisis
│   ├── types/                 # Tipos del dataset y de autenticacion
│   └── utils/                 # Validaciones, calculo nutricional
├── assets/                    # Imagenes y fuentes
├── app.json                   # Configuracion de Expo
├── package.json
└── tsconfig.json
```

---

## Sobre el dataset (observacion de la tutoria)

Atendiendo la observacion sobre incorporar el dataset como eje del estudio,
esta fase ya define su estructura formal:

- `src/types/dataset.ts` — modela las dos tablas del Anexo A
  (`PerfilUsuario` y `RegistroDiario`), relacionadas por `idUsuario`.
- `src/data/datasetDemo.ts` — dataset sintetico de ejemplo para validar
  el prototipo antes de contar con datos reales de usuarios.
- `src/services/analisisService.ts` — procesa el dataset para producir
  resumenes de progreso (base del modulo de analisis de datos).

---

## Proximas fases

1. **70-80%:** Catalogo ampliado de alimentos locales y recalculo del plan por ingrediente faltante.
2. **80-90%:** Integracion con Google Fit y notificaciones de seguimiento.
3. **90-100%:** Asistente de voz (NLP), pruebas y validacion con usuarios.
