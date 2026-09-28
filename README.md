# VitalAI

**Sistema multiplataforma para la educacion nutricional y el seguimiento dietetico personalizado apoyado con Inteligencia Artificial en el contexto boliviano.**

Proyecto de Grado — Licenciatura en Ingenieria de Sistemas Informaticos
Universidad Privada del Valle (UNIVALLE) — Facultad de Informatica y Electronica

- **Postulante:** Daril Dustin Ledezma Maldonado
- **Tutor:** Ing. Ramiro Ramallo Rocha
- **Cochabamba, Bolivia — 2026**

---

## Estado del proyecto: avance del 70%

Este repositorio corresponde a una entrega funcional del **70% de avance** del
desarrollo de VitalAI. La aplicacion funciona en modo demo sin credenciales
externas y permite recorrer el flujo principal de seguimiento:

| Entregado en este 30% | Estado |
|---|---|
| Estructura base del proyecto (Expo + TypeScript) | Completo |
| Arquitectura de carpetas escalable | Completo |
| Sistema de tema (colores, tipografia, layout) | Completo |
| Navegacion completa (Expo Router + tabs) | Completo |
| Modulo de autenticacion y perfiles | Completo |
| Configuracion de Firebase (con modo demo) | Completo |
| Tipos y estructura del dataset (Anexo A) | Completo |
| Logica de calculo nutricional | Completo |
| Servicio de analisis del dataset | Completo |
| Dataset sintetico de validacion | Completo |
| Dashboard de inicio (vista previa) | Completo |
| Modulo de nutricion adaptativa con IA | Completo en modo demo |
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

1. **70-80%:** Persistencia remota de registros y catalogo ampliado de alimentos locales.
2. **80-90%:** Integracion con Google Fit y notificaciones de seguimiento.
3. **90-100%:** Asistente de voz (NLP), pruebas y validacion con usuarios.
