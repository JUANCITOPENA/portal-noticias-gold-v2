# ✨ AURUM NEWS V2 — THE GOLD STANDARD IN GLOBAL JOURNALISM
## Portal Editorial de Noticias de Alta Gama (Versión 2.0.0-PRO)

> **Proyecto Oficial:** AURUM NEWS V2 — The Gold Standard in Global Journalism  
> **Autoría & Arquitectura:** Ing. Juancito Peña Vizcaíno (Data Analyst, Full Stack Dev & Líder I+D+i)  
> **Versión:** 2.0.0-PRO (Puerto 3001)  
> **Repositorio Oficial:** [https://github.com/JUANCITOPENA/portal-noticias-gold-v2](https://github.com/JUANCITOPENA/portal-noticias-gold-v2)  
> **Despliegue Global en Vercel:** [https://portal-noticias-gold-v2.vercel.app](https://portal-noticias-gold-v2.vercel.app)  
> **Nuevas Características V2:** Marcadores / Favoritos persistentes, Zoom Tipográfico accesible, TTS con velocidad variable (0.8x a 1.5x), Impresión limpia a PDF, Modal de Telemetría en vivo y Vercel Edge Cache.  
> **Canal Educativo:** [@JuancitoDevV](https://www.youtube.com/@JuancitoDevV)  
> **Licencia:** MIT License

---

## 📑 ÍNDICE GENERAL DE LA DOCUMENTACIÓN V2

1. [🏛️ Novedades y Evolución de AURUM NEWS V2](#️-1-novedades-y-evolución-de-aurum-news-v2)
2. [👨‍💻 Autoría Oficial y Ficha del Ingeniero](#-2-autoría-oficial-y-ficha-del-ingeniero)
3. [🏗️ Arquitectura Técnica del Sistema V2](#️-3-arquitectura-técnica-del-sistema-v2)
4. [🔗 Links de Instalación y Prerrequisitos](#-4-links-de-instalación-y-prerrequisitos)
5. [⚙️ Variables de Entorno y Configuración](#️-5-variables-de-entorno-y-configuración)
6. [📡 Documentación Completa de Endpoints (API Reference)](#-6-documentación-completa-de-endpoints-api-reference)
7. [🛠️ Paso a Paso Detallado de Construcción de V2](#️-7-paso-a-paso-detallado-de-construcción-de-v2)
8. [🚀 Guía de Ejecución Local (1-Clic en Windows o Terminal)](#-8-guía-de-ejecución-local-1-clic-en-windows-o-terminal)
9. [☁️ Guía de Despliegue en Producción (GitHub + Vercel)](#️-9-guía-de-despliegue-en-producción-github--vercel)
10. [🎙️ Motor de Narración por Voz Humana con Selector de Velocidad](#️-10-motor-de-narración-por-voz-humana-con-selector-de-velocidad)
11. [📌 Sistema de Marcadores y Lectura Offline](#-11-sistema-de-marcadores-y-lectura-offline)
12. [🛡️ Gobernanza de Calidad, FinOps y Cero Cobros No Autorizados](#️-12-gobernanza-de-calidad-finops-y-cero-cobros-no-autorizados)

---

## 🏛️ 1. NOVEDADES Y EVOLUCIÓN DE AURUM NEWS V2

La **Versión 2.0.0-PRO** introduce mejoras sustanciales sobre la arquitectura original:

| Característica | Versión 1.0 | Versión 2.0 (Nueva) |
| :--- | :---: | :---: |
| **Puerto Local Predeterminado** | `3000` | `3001` *(Permite ejecutar V1 y V2 en paralelo sin conflictos)* |
| **Sistema de Marcadores / Favoritos** | No disponible | ✅ Botón de bookmark en cards y modal, persistencia en `localStorage`, vista dedicada *"Guardadas"* y badge numérico en el header. |
| **Zoom Tipográfico Accesible** | Tamaño fijo | ✅ Escalador en 3 niveles (`A-` 0.95rem, `A` 1.08rem, `A+` 1.25rem) para accesibilidad WCAG 2.2 AAA. |
| **Velocidad de Síntesis de Voz (TTS)** | Fija (1.0x) | ✅ Selector dinámico de velocidad (`0.8x`, `1.0x`, `1.2x`, `1.5x`) con entonación fluida. |
| **Exportación Limpia / Impresión** | Básica de navegador | ✅ Botón `[Imprimir / PDF]` con estilos `@media print` optimizados (oculta cabeceras, menús y botones, dejando el texto limpio y legible). |
| **Modal de Telemetría en Vivo** | Solo `/api/health` JSON | ✅ Modal visual con métricas de aciertos de caché, llamadas remotas, uptime del servidor y cuota ahorrada. |
| **Capacidad del Extractor** | Hasta 15 párrafos | ✅ Hasta 18 párrafos significativos y estimación dinámica de lectura (`~N min`). |

---

## 👨‍💻 2. AUTORÍA OFICIAL Y FICHA DEL INGENIERO

* **Nombre Oficial:** Ing. Juancito Peña Vizcaíno
* **Título Profesional:** Ingeniero en Sistemas y Computación | Postgrado en Ingeniería de Software | Maestría en Sistemas Mención Gerencial (*Universidad Dominicana O&M*).
* **Trayectoria:** Más de 15 años de experiencia en ingeniería de software, arquitectura de bases de datos relacionales/NoSQL y liderazgo de I+D+i (Investigación, Desarrollo e Innovación en IA Generativa, RAG, LLMs y Agentes Autónomos).
* **Rol Educativo:** Docente Universitario y Creador del Canal Educativo **@JuancitoDevV**.
* **Avatar Oficial:** `https://avatars.githubusercontent.com/u/38921558?v=4`
* **Badges Oficiales:**
  * `Data Analyst` (Fondo Negro `#000000`)
  * `Full Stack Dev` (Fondo Rojo `#DA291C`)
  * `AI & API Expert` (Fondo Azul `#0D6EFD`)
  * `Líder I+D+i` (Fondo Amarillo `#FFC107`)

### 🌐 Canales Oficiales y Redes:
* **LinkedIn Oficial:** [linkedin.com/in/juancitopeña](https://www.linkedin.com/in/juancitope%C3%B1a/)
* **YouTube Educativo:** [@JuancitoDevV](https://www.youtube.com/@JuancitoDevV) *(Algoritmos, SQL, IA & .NET)*
* **GitHub Oficial:** [@JUANCITOPENA](https://github.com/JUANCITOPENA)
* **X (Twitter):** [@JuancitoPenaV](https://twitter.com/JuancitoPenaV)
* **Correo Electrónico:** juancito.pena@gmail.com

---

## 🏗️ 3. ARQUITECTURA TÉCNICA DEL SISTEMA V2

```mermaid
flowchart TD
    User["👤 Lector / Usuario"]
    Frontend["📱 Frontend Modular ES6+ (Public/)"]
    Bookmarks["📌 Storage Favoritos (localStorage)"]
    CacheManager["⚡ NewsCacheManager (sessionStorage + RAM)"]
    Express["🚀 Servidor Express (Puerto 3001)"]
    VercelEdge["☁️ Vercel Edge Serverless"]
    NewsDataAPI["🌐 NewsData.io (Últimas Noticias)"]
    ArticleExtractor["📰 Extractor de Reportaje Completo"]
    OriginSite["🌐 Portal de Origen (HTML Limpio)"]
    TTS["🎙️ Motor TTS con Velocidad Variable"]

    User -->|Navegación / Filtros / Búsqueda| Frontend
    Frontend <-->|Guardar / Leer Favoritos| Bookmarks
    Frontend -->|Solicitar 16 Noticias| CacheManager
    CacheManager -->|Caché Activa (0 créditos)| Frontend
    CacheManager -->|Petición de Red| Express
    Express -->|Proxy Seguro| NewsDataAPI
    VercelEdge -->|Proxy Serverless| NewsDataAPI
    Frontend -->|Abrir Modal Lector| ArticleExtractor
    ArticleExtractor -->|Descarga y Sanitización| OriginSite
    Frontend -->|Escuchar Noticia| TTS
```

---

## 🔗 4. LINKS DE INSTALACIÓN Y PRERREQUISITOS

| Herramienta / Servicio | Enlace Oficial de Descarga / Registro | Propósito |
| :--- | :--- | :--- |
| **Node.js (LTS)** | [https://nodejs.org/](https://nodejs.org/) | Entorno de ejecución de JavaScript para el backend local (Node 18 o superior). |
| **Git** | [https://git-scm.com/](https://git-scm.com/) | Control de versiones y sincronización con GitHub. |
| **NewsData.io** | [https://newsdata.io/register](https://newsdata.io/register) | Proveedor de la API de noticias. Cuenta gratuita con 200 créditos diarios. |
| **Vercel** | [https://vercel.com/](https://vercel.com/) | Plataforma cloud serverless para despliegue en producción con 1-clic. |
| **Vercel CLI** | `npm install -g vercel` | Interfaz de línea de comandos para despliegues directos desde la terminal. |

---

## ⚙️ 5. VARIABLES DE ENTORNO Y CONFIGURACIÓN

### 📄 Archivo `.env` (Local)
Ubicado en la raíz de `portal-noticias-gold_V2/`:

```env
# ===============================================================================
# AURUM NEWS V2 — VARIABLES DE ENTORNO LOCALES
# ===============================================================================

# Puerto de ejecución del servidor Express V2 (3001 por defecto)
PORT=3001

# API Key de NewsData.io (Obtenida en https://newsdata.io/register)
# Si se deja en blanco, el portal opera en MODO DEMOSTRACIÓN con 32 noticias curadas.
NEWSDATA_API_KEY=tu_api_key_aqui
```

### 🛡️ Configuración en Vercel (Producción)
En el panel de control de Vercel:
1. Vaya a: **Project Settings > Environment Variables**.
2. Agregue la variable: `NEWSDATA_API_KEY`.
3. Ingrese el valor de su API Key de NewsData.io.
4. Seleccione los entornos: **Production**, **Preview**, **Development**.
5. Haga clic en **Save** y re-despliegue el proyecto.

---

## 📡 6. DOCUMENTACIÓN COMPLETA DE ENDPOINTS (API REFERENCE)

### 1. `GET /api/health`
Devuelve el estado del servidor, versión 2.0.0-PRO, tiempo de actividad (uptime) y telemetría de caché.

* **Respuesta Exitosa (HTTP 200):**
```json
{
  "status": "ok",
  "version": "2.0.0-PRO",
  "service": "AURUM NEWS V2 — The Gold Standard in Global Journalism",
  "timestamp": "2026-11-23T23:45:00.000Z",
  "uptimeSeconds": 320,
  "hasApiKey": true,
  "cacheEntries": 4,
  "stats": {
    "totalRequests": 18,
    "apiHits": 2,
    "cacheHits": 16,
    "articleExtractions": 5,
    "cacheHitRate": "88.9%"
  }
}
```

---

### 2. `GET /api/news`
Proxy seguro que consulta la API de NewsData.io (`https://newsdata.io/api/1/latest`), previene CORS, gestiona caché con TTL de 15 minutos y filtra según los parámetros del usuario.

* **Parámetros Query:**
  * `category` *(opcional)*: `top`, `business`, `technology`, `science`, `health`, `sports`, `entertainment`, `world` o `all`.
  * `q` *(opcional)*: Término de búsqueda textual.
  * `country` *(opcional)*: Código ISO del país (`es`, `mx`, `us`, `co`, `ar`, `all`).
  * `language` *(opcional)*: Código de idioma (`es`, `en`, `all`).
  * `image` *(opcional)*: `1` para exigir noticias con foto.
  * `page` *(opcional)*: Cursor devuelto por NewsData.io (`nextPage`).

---

### 3. `GET /api/article-full`
Extractor de reportajes que descarga el HTML original, filtra scripts, estilos, publicidad y cookies, y extrae hasta 18 párrafos significativos, conteo de palabras y autor.

* **Parámetros Query:**
  * `url` *(obligatorio)*: URL completa de la noticia original.

* **Respuesta Exitosa (HTTP 200):**
```json
{
  "status": "success",
  "url": "https://fuente.com/noticia-1",
  "author": "Redacción Central",
  "paragraphCount": 12,
  "paragraphs": [
    "Párrafo 1 con el hecho principal...",
    "Párrafo 2 con contexto y detalles..."
  ],
  "wordCount": 740,
  "cached": false
}
```

---

## 🛠️ 7. PASO A PASO DETALLADO DE CONSTRUCCIÓN DE V2

1. **Aislamiento de la Versión 2**: Creación de la carpeta `portal-noticias-gold_V2` con subcarpetas `api`, `public/assets`, `public/css`, `public/js`.
2. **Configuración de Dependencias**: Configuración de `package.json` con nombre `aurum-news-portal-v2`, versión `2.0.0` y dependencias de producción (`express`, `dotenv`).
3. **Servidor Express y Telemetría (`server.js`)**: Configuración en el puerto `3001` con contadores de peticiones, aciertos de caché y porcentaje de tasa de acierto (*cache hit rate*).
4. **Serverless Functions para Vercel (`api/`)**: `api/news.js` y `api/article-full.js` con cabeceras `Cache-Control: s-maxage=600` para cachear respuestas en el Edge de Vercel.
5. **Ampliación del Gestor de Caché (`cacheManager.js`)**: Integración del almacenamiento local de marcadores (`aurum_bookmarks_v2`), método `toggleBookmark` y manejo de la categoría especial `bookmarks`.
6. **Diseño de Controles Pro en CSS (`styles.css`)**: Botón de marcadores en cards con animación de hover dorado, toolbar de lectura con zoom de tipografía, selector de velocidad TTS y reglas de impresión limpia `@media print`.
7. **Controlador del Frontend (`app.js`)**: Lógica para guardar/quitar favoritos, modal de telemetría de salud de la API, selector de velocidad de reproducción TTS (0.8x, 1.0x, 1.2x, 1.5x) y zoom de tipografía.
8. **Lanzador 1-Clic (`INICIAR_PORTAL_NOTICIAS_V2.bat`)**: Script por lotes configurado en el puerto 3001 con auto-detección de Node.js e instalación preventiva de paquetes.

---

## 🚀 8. GUÍA DE EJECUCIÓN LOCAL (1-CLIC EN WINDOWS O TERMINAL)

### Opción A: Lanzador 1-Clic (Recomendado en Windows)
1. Navegue a la carpeta de la versión 2:
   `C:\Users\User\Desktop\CARPETA DE TRABAJO DE ANTIGRAVITY CLI-JPV\portal-noticias-gold_V2`
2. Haga doble clic en el archivo:
   **`INICIAR_PORTAL_NOTICIAS_V2.bat`**
3. El lanzador arrancará el servidor en el puerto 3001 y abrirá su navegador en:
   **`http://localhost:3001`**

### Opción B: Ejecución Manual desde la Terminal
```bash
cd "C:\Users\User\Desktop\CARPETA DE TRABAJO DE ANTIGRAVITY CLI-JPV\portal-noticias-gold_V2"
npm start
```
Abra su navegador en: `http://localhost:3001`.

---

## ☁️ 9. GUÍA DE DESPLIEGUE EN PRODUCCIÓN (GITHUB + VERCEL)

### Paso 1: Subida a GitHub
```bash
cd "C:\Users\User\Desktop\CARPETA DE TRABAJO DE ANTIGRAVITY CLI-JPV\portal-noticias-gold_V2"
git init
git add .
git commit -m "feat: Lanzamiento de AURUM NEWS V2 (Bookmarks, TTS Pro y Telemetria)"
git branch -M main
git remote add origin https://github.com/JUANCITOPENA/portal-noticias-gold-v2.git
git push -u origin main
```

### Paso 2: Importar en Vercel
1. Ingrese a [vercel.com](https://vercel.com/) y haga clic en **Add New... > Project**.
2. Seleccione el repositorio `portal-noticias-gold-v2`.
3. Configure la variable de entorno: `NEWSDATA_API_KEY`.
4. Haga clic en **Deploy**.

---

## 🎙️ 10. MOTOR DE NARRACIÓN POR VOZ HUMANA CON SELECTOR DE VELOCIDAD

El motor TTS de V2 permite ajustar la velocidad de lectura en tiempo real:
* **`0.8x` (Lenta)**: Ideal para dicción pausada, notas técnicas o aprendizaje de idiomas.
* **`1.0x` (Normal)**: Entonación estándar del español con ritmo editorial.
* **`1.2x` (Fluida)**: Lectura rápida para profesionales y ejecutivos con poco tiempo.
* **`1.5x` (Rápida)**: Consumo veloz de contenidos largos.
* **Controles Integrados**: Botones táctiles Play, Pause, Resume, Stop, consola de volumen interactiva y ecualizador verde pulsante animado.

---

## 📌 11. SISTEMA DE MARCADORES Y LECTURA OFFLINE

1. **Guardar en 1 Clic**: Cada tarjeta de noticia y la barra de herramientas del modal disponen de un botón con icono de estrella/marcador (`bi-bookmark-plus` / `bi-bookmark-star-fill`).
2. **Persistencia Local**: Los artículos guardados se conservan en el `localStorage` del navegador con metadatos completos y fecha de guardado.
3. **Pestaña "Guardadas" en el Header**: Un botón con badge numérico en la barra superior permite conmutar en cualquier momento para ver únicamente las noticias marcadas.

---

## 🛡️ 12. GOBERNANZA DE CALIDAD, FINOPS Y CERO COBROS NO AUTORIZADOS

En estricto apego al marco ético y profesional del **Ing. Juancito Peña Vizcaíno**:

* **Estándar FinOps "Jamás Cobrar Sin Mi Aprobación"**: Cero dependencias de servicios de pago, cero compras automáticas y consumo estrictamente acotado a la capa gratuita de NewsData.io.
* **Ahorro de Cuota**: La combinación de caché en memoria, `sessionStorage` y Vercel Edge Cache garantiza que volver a consultar noticias ya descargadas consuma **0 créditos de API**.
* **Cumplimiento WCAG 2.2 AAA**: Ratios de contraste superiores a 7:1 en textos principales, estados de foco visibles y fuentes de alta legibilidad.

---

### 🏛️ AURUM NEWS V2 — The Gold Standard in Global Journalism
*Desarrollado, ampliado y certificado por el **Ing. Juancito Peña Vizcaíno**.*
