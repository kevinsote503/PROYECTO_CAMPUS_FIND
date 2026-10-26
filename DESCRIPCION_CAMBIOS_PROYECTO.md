# Informe de Cambios, Arquitectura y Actualizaciones del Proyecto: Campus Find

**Asignatura / Proyecto:** Sistema Web de Gestión y Geolocalización de Objetos Perdidos  
**Ubicación de Implementación:** Usulután, El Salvador (Campus Universitario UGB y alrededores)  
**Tecnologías:** HTML5 Semántico, CSS3, JavaScript Vanilla (ES6+ Modular), Node.js, Express, SQLite (Modelo 3FN)  
**Autor:** kevinsote503

---

## 1. Resumen Ejecutivo
Se presenta la reestructuración integral del sistema **Campus Find**, optimizando su arquitectura para cumplir con las directrices académicas de desarrollo web estándar: **separación modular de archivos HTML, CSS y JavaScript organizados por carpetas**, integración de un motor de **geolocalización interactiva en tiempo real para Usulután**, y un esquema de persistencia relacional que cumple rigurosamente con la **Tercera Forma Normal (3FN)**.

---

## 2. Reestructuración de Arquitectura: Frontend Modular (HTML, CSS y JS Puro)
A petición de los requerimientos de la cátedra, se eliminó la dependencia de frameworks de renderizado monolíticos o SPAs complejas, transicionando a una **arquitectura web estándar desacoplada**:

* **Separación física por carpetas funcionales:** Cada vista cuenta con su propio directorio dedicado y su respectivo archivo `index.html`, evitando código amontonado:
  * `/` (Página principal e inicio rápido con estadísticas y accesos directos).
  * `/pages/mapa/` (Centro de geolocalización interactiva y filtrado espacial en Usulután).
  * `/pages/buscar/` (Buscador avanzado con filtros por estado, categoría y fecha).
  * `/pages/reportar/` (Formulario de publicación con selector de punto GPS en el mapa).
  * `/pages/mis-reportes/` (Gestión personal, edición y cancelación de reportes propios).
  * `/pages/mis-reclamaciones/` (Historial, seguimiento de aprobación y evidencia).
  * `/pages/admin/` (Panel de resolución de reclamos y generación de actas de entrega).
  * `/pages/crud/` (Mantenimiento de tablas maestras del sistema y visualizador 3FN).
* **Capa de Estilos (`/css/`):** Estilos compilados y optimizados con soporte responsive, paleta cromática original (azul marino, índigo y toques de acento) y animaciones fluidas (`animations.css`) para transiciones, diálogos y tarjetas.
* **Capa de Controladores y Servicios (`/js/`):**
  * `js/services/api.js`: Cliente HTTP centralizado que maneja todas las peticiones al backend (REST API) y utilidades matemáticas como la fórmula de Haversine para cálculo de distancias geográficas.
  * `js/components/layout.js`: Componente reutilizable que inyecta la barra de navegación superior, pie de página, modales de autenticación rápida por roles y visores de detalle con mini-mapas.

---

## 3. Implementación del Sistema de Geolocalización en Usulután
Se implementó un mapa cartográfico interactivo de alta precisión utilizando la librería **Leaflet** y tiles vectoriales de **OpenStreetMap**, enfocado geográficamente en **Usulután, El Salvador**:

* **Coordenadas de Referencia:** Centrado en las coordenadas `13.3466, -88.4208` (Campus Universitario) y casco urbano de Usulután (`13.3444, -88.4385`).
* **Marcadores Dinámicos con Código de Colores:**
  * 🟡 **Amarillo / Ámbar:** Objetos en estado *Perdido*.
  * 🟢 **Verde Esmeralda:** Objetos en estado *Encontrado*.
  * 🔵 **Azul:** Puntos de interés y ubicaciones oficiales del campus (Biblioteca, Cafetería, Edificios de Aulas, Canchas, etc.).
* **Fórmula de Haversine Integrada:** Cálculo matemático en el cliente que determina a cuántos metros o kilómetros se encuentra un objeto respecto al usuario o a una ubicación seleccionada.
* **Selector Geográfico en Reportes:** Al reportar un objeto, el usuario puede dar clic sobre el mapa para registrar la latitud y longitud exacta del hallazgo o extravío.

---

## 4. Normalización de Base de Datos y Modelo Relacional (3FN)
La base de datos relacional (SQLite) fue actualizada para soportar georreferenciación sin violar los principios de diseño de bases de datos:

1. **Primera Forma Normal (1FN):** Todos los atributos son atómicos e indivisibles. Se agregaron las columnas `latitud` (FLOAT) y `longitud` (FLOAT) tanto en la tabla `Ubicaciones` como de forma opcional en `Objetos` para registrar coordenadas precisas fuera de los puntos fijos.
2. **Segunda Forma Normal (2FN):** Todas las tablas poseen una clave primaria explícita (`id`) y todos los atributos no clave tienen dependencia funcional completa de dicha clave.
3. **Tercera Forma Normal (3FN):** Se eliminaron dependencias transitivas:
   * Categorías, Ubicaciones, Usuarios, Objetos, Reclamaciones, Entregas y Logs de Auditoría se encuentran estrictamente separados en tablas independientes con integridad referencial (`FOREIGN KEY`).
   * No existen datos redundantes o calculados almacenados de forma estática.

---

## 5. Control de Acceso y Roles de Usuario (RBAC)
Se conservó e integró en la interfaz HTML/JS el sistema de seguridad basado en 4 roles:
* **Estudiante:** Búsqueda, reporte y reclamo de pertenencias.
* **Docente:** Reporte y seguimiento de objetos en aulas y laboratorios.
* **Seguridad / Vigilancia:** Verificación física y recepción en casetas.
* **Administrador:** Aprobación de reclamos, emisión de actas oficiales de entrega y auditoría completa.
* *Acceso Rápido de Prueba:* Botones de 1 solo clic en el modal de inicio de sesión para que el docente/evaluador pueda alternar entre los 4 perfiles sin necesidad de recordar contraseñas.

---

## 6. Estructura de Directorios
```text
campus-find/
├── index.html                   # Portada principal e inicio del sistema
├── DESCRIPCION_CAMBIOS_PROYECTO.md # Documento de entrega para el docente
├── pages/
│   ├── mapa/index.html          # Vista de geolocalización y mapa de Usulután
│   ├── buscar/index.html        # Catálogo general y filtros de búsqueda
│   ├── reportar/index.html      # Publicación con captura de punto GPS
│   ├── mis-reportes/index.html  # Panel de reportes del usuario
│   ├── mis-reclamaciones/index.html # Seguimiento de pertenencias reclamadas
│   ├── admin/index.html         # Panel administrativo y actas de entrega
│   └── crud/index.html          # Gestión de catálogos y visor del esquema 3FN
├── css/
│   ├── main.css                 # Estilos principales del sitio
│   ├── animations.css           # Animaciones de modales, alertas y transiciones
│   └── tailwind-compiled.css    # Sistema visual, espaciados y diseño responsivo
├── js/
│   ├── components/layout.js     # Menú de navegación, footer y modales globales
│   ├── services/api.js          # Conexión con endpoints REST y utilidades GPS
│   └── pages/                   # Lógica JavaScript propia de cada vista
├── backend/                     # API REST en Node.js/Express + SQLite (3FN)
└── package.json
```
