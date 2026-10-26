# Campus Find 🎓🔍
> Plataforma universitaria integral para la gestión, reporte y recuperación de objetos perdidos y encontrados.

---

## 📌 Descripción del Proyecto

**Campus Find** es una solución web full-stack profesional diseñada para campus universitarios. Permite a la comunidad estudiantil, cuerpo docente y personal administrativo reportar pertenencias extraviadas o halladas en instalaciones del campus, realizar búsquedas con filtros combinados, tramitar solicitudes de reclamación formal ("Creo que es mío") con validación de evidencias, y registrar la entrega final del objeto por parte del personal de seguridad o administración.

---

## 🛠️ Stack Tecnológico

- **Backend:** Node.js con Express siguiendo arquitectura en capas MVC (Modelos, Controladores, Rutas y Middlewares).
- **Base de Datos:** SQLite embebida (`.db`), sin necesidad de configurar servidores de base de datos externos.
- **ORM:** **Sequelize** (con dialecto `sqlite3`).
  > *Justificación de elección:* Sequelize ofrece portabilidad inmediata en contenedores y servidores Node.js sin depender de binarios nativos del sistema operativo (a diferencia del query-engine de Prisma). Brinda tipado robusto, hooks de ciclo de vida seguros (como hasheo con `bcryptjs`), y relaciones 3FN completamente integradas con SQLite.
- **Autenticación:** JSON Web Tokens (**JWT**) con control de acceso basado en roles (**RBAC**): `estudiante`, `docente`, `personal`, `administrador`.
- **Frontend:** React con Vite, TypeScript y **Tailwind CSS**.
- **Iconografía e Interacción:** Lucide React y Motion para microinteracciones fluidas.

---

## 🗄️ Estructura de Base de Datos (Normalización 3FN)

El sistema cuenta con un esquema relacional normalizado en Tercera Forma Normal (3FN), garantizando integridad referencial mediante claves foráneas y cascadas controladas:

1. **`tipos_usuario`** (`id`, `nombre`): Roles del sistema (`estudiante`, `docente`, `personal`, `administrador`).
2. **`usuarios`** (`id`, `nombre`, `correo`, `contraseña`, `telefono`, `tipo_usuario_id`, `creado_en`): Cuentas de usuario protegidas con contraseñas encriptadas mediante `bcrypt`.
3. **`categorias`** (`id`, `nombre`): Clasificación de objetos (`Electrónica`, `Documentos`, `Mochilas`, `Ropa`, etc.).
4. **`ubicaciones`** (`id`, `nombre`, `edificio`, `descripcion`): Espacios físicos del campus universitario.
5. **`estados`** (`id`, `nombre`): Ciclo de vida del objeto (`perdido`, `encontrado`, `recuperado`).
6. **`estados_reclamacion`** (`id`, `nombre`): Estado de la solicitud (`pendiente`, `aprobada`, `rechazada`).
7. **`objetos`** (`id`, `usuario_id`, `categoria_id`, `ubicacion_id`, `estado_id`, `titulo`, `descripcion`, `fecha_reporte`): Registro central de pertenencias reportadas.
8. **`reclamaciones`** (`id`, `objeto_id`, `usuario_id`, `descripcion`, `fecha`, `estado_reclamacion_id`): Peticiones de reclamo enviadas por usuarios con justificación/evidencias.
9. **`entregas`** (`id`, `reclamacion_id`, `fecha`, `observaciones`): Registro formal de la devolución del objeto tras aprobación administrativa.

Los scripts SQL independientes se encuentran en:
- `schema.sql`: Creación de tablas, claves foráneas e índices.
- `seed.sql`: Precarga de datos iniciales esenciales y registros de prueba realistas.

---

## 🚀 Instalación y Ejecución

### 1. Requisitos previos
- Node.js versión 18 o superior.
- Gestor de paquetes `npm`.

### 2. Configurar variables de entorno
Crea tu archivo `.env` tomando como base `.env.example`:
```bash
cp .env.example .env
```
Variables configurables:
```env
JWT_SECRET="campus_find_super_secret_jwt_key_2026"
SQLITE_DB_PATH="./backend/database/campus_find.db"
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar el Seed inicial de la Base de Datos
El servidor ejecuta el seed automáticamente si la base de datos está vacía al iniciar. También puedes ejecutarlo de forma manual en cualquier momento con:
```bash
npm run seed
```

### 5. Iniciar la aplicación
- **Modo Desarrollo (Full-Stack Integrado con Vite middleware):**
  ```bash
  npm run dev
  ```
  La aplicación estará disponible en `http://localhost:3000`.

- **Compilación para Producción:**
  ```bash
  npm run build
  npm start
  ```

---

## 👥 Credenciales de Prueba (Pre-cargadas)

Todas las cuentas de prueba comparten la contraseña: **`password123`**

| Rol | Correo Electrónico | Contraseña | Propósito |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@campusfind.edu` | `password123` | Acceso a métricas, aprobación de reclamos y registro de entregas. |
| **Estudiante** | `estudiante@campusfind.edu` | `password123` | Reportar pérdidas/hallazgos y enviar reclamaciones. |
| **Docente** | `docente@campusfind.edu` | `password123` | Reportar pertenencias halladas en aulas. |
| **Personal** | `personal@campusfind.edu` | `password123` | Vigilancia y seguridad del campus. |

*Nota: La interfaz incluye botones de acceso rápido "1-Click" en el diálogo de inicio de sesión para facilitar las pruebas del evaluador.*

---

## 📡 Documentación de Endpoints de la API

### Autenticación
- `POST /api/auth/registro`: Registra un nuevo usuario (`nombre`, `correo`, `contraseña`, `telefono`, `tipo_usuario_id`).
- `POST /api/auth/login`: Autentica credenciales y emite el token JWT.
- `GET /api/auth/perfil`: Retorna el usuario autenticado actual.
- `GET /api/auth/tipos`: Lista los tipos de usuario disponibles.

### Usuarios (Formulario CRUD #2 + Búsqueda Interactiva)
- `GET /api/usuarios?texto=&tipo_usuario_id=`: Lista y filtra usuarios interactivamente por nombre, correo, teléfono o rol.
- `POST /api/usuarios`: Crea un nuevo usuario con validación de formato (nombre alfabético, correo único, teléfono, contraseña encriptada con `bcrypt`).
- `PUT /api/usuarios/:id`: Actualiza datos de un usuario existente validando formato y unicidad.
- `DELETE /api/usuarios/:id`: Elimina un usuario verificando integridad referencial 3FN (`ON DELETE RESTRICT`).

### Objetos (Formulario CRUD #1 + Búsqueda Interactiva)
- `GET /api/objetos`: Lista todos los objetos con sus relaciones.
- `GET /api/objetos/buscar?categoria=&ubicacion=&estado=&texto=`: Búsqueda interactiva multicriterio en tiempo real.
- `GET /api/objetos/coincidencias?categoria_id=&ubicacion_id=&estado_id=&titulo=`: Detección SQL de posibles coincidencias entre objetos perdidos y encontrados.
- `GET /api/objetos/mis-reportes`: Lista los objetos reportados por el usuario en sesión.
- `GET /api/objetos/:id`: Detalle completo de un objeto y sus reclamaciones asociadas.
- `POST /api/objetos`: Crea un nuevo reporte con validación de formato y fecha (requiere token).
- `PUT /api/objetos/:id`: Actualiza cualquier campo de un reporte (dueño o admin).
- `DELETE /api/objetos/:id`: Elimina un reporte (dueño o admin).

### Ubicaciones y Categorías (Formulario CRUD #3 + Búsqueda Interactiva)
- `GET /api/ubicaciones?texto=&edificio=`: Listado y búsqueda interactiva de ubicaciones del campus universitario.
- `POST /api/ubicaciones`: Registrar nueva ubicación con edificio y descripción.
- `PUT /api/ubicaciones/:id`: Actualizar edificio, nombre o descripción de una ubicación.
- `DELETE /api/ubicaciones/:id`: Eliminar ubicación verificando integridad referencial 3FN.
- `GET /api/categorias?texto=`: Listado y filtrado de categorías.
- `POST /api/categorias`: Registrar nueva categoría.
- `PUT /api/categorias/:id`: Actualizar nombre de categoría.
- `DELETE /api/categorias/:id`: Eliminar categoría verificando integridad referencial 3FN.

### Reclamaciones y Entregas
- `GET /api/reclamaciones?texto=&estado_reclamacion_id=`: Listado y búsqueda interactiva de reclamaciones.
- `GET /api/reclamaciones/mis-reclamaciones`: Reclamaciones del usuario autenticado.
- `POST /api/reclamaciones`: Enviar solicitud "Creo que es mío" con evidencias.
- `PUT /api/reclamaciones/:id`: Actualizar evidencias o aprobar/rechazar reclamación.
- `DELETE /api/reclamaciones/:id`: Cancelar o eliminar una reclamación.
- `POST /api/entregas`: Registrar entrega oficial con observaciones y marcar objeto como recuperado.
- `GET /api/entregas`: Historial de entregas realizadas.

### Estadísticas y Esquema Normalizado 3FN
- `GET /api/stats`: Métricas generales del campus (objetos reportados, recuperados, pendientes, tasa de éxito).
- `GET /api/stats/esquema`: Inspección en vivo de las 9 tablas SQLite en 3FN, claves primarias (`PK`), claves foráneas (`FK`), conteo real de registros y jerarquía de clases POO (`EntidadBase`).

---

## 💡 Funcionalidad Extra: Sistema de Posibles Coincidencias

Al redactar un reporte en el formulario, el sistema analiza en tiempo real si existen objetos con el **estado opuesto** (ej. si reportas *perdido*, busca *encontrados*) que coincidan en:
1. Misma categoría universitaria.
2. Misma ubicación o edificio.
3. Coincidencia de palabras clave en el título o descripción mediante consultas `WHERE ... LIKE` directas en SQL (sin recurrir a IA).
Si se detecta una coincidencia probable, se alerta de inmediato al usuario con acceso directo al detalle del objeto para que pueda reclamarlo al instante.
