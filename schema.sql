-- =============================================================================
-- CAMPUS FIND - Esquema de Base de Datos Relacional (3FN)
-- Motor: SQLite (compatible con PostgreSQL / MySQL adaptando tipos y autoincrement)
-- =============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Tipos de Usuario (Roles del sistema universitario)
CREATE TABLE IF NOT EXISTS tipos_usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabla de Usuarios (Estudiantes, docentes, personal y administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    tipo_usuario_id INTEGER NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Tabla de Categorías de Objetos
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 4. Tabla de Ubicaciones en el Campus Universitario
CREATE TABLE IF NOT EXISTS ubicaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    edificio VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- 5. Tabla de Estados del Objeto ('perdido', 'encontrado', 'recuperado')
CREATE TABLE IF NOT EXISTS estados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 6. Tabla de Estados de Reclamación ('pendiente', 'aprobada', 'rechazada')
CREATE TABLE IF NOT EXISTS estados_reclamacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 7. Tabla Principal de Objetos Reportados
CREATE TABLE IF NOT EXISTS objetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    ubicacion_id INTEGER NOT NULL,
    estado_id INTEGER NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_reporte DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 8. Tabla de Solicitudes de Reclamación de Objetos
CREATE TABLE IF NOT EXISTS reclamaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objeto_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_reclamacion_id INTEGER NOT NULL,
    FOREIGN KEY (objeto_id) REFERENCES objetos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (estado_reclamacion_id) REFERENCES estados_reclamacion(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 9. Tabla de Entregas Oficiales al Propietario
CREATE TABLE IF NOT EXISTS entregas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reclamacion_id INTEGER NOT NULL UNIQUE,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (reclamacion_id) REFERENCES reclamaciones(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para optimización de búsqueda y reportes
CREATE INDEX IF NOT EXISTS idx_objetos_categoria ON objetos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_objetos_ubicacion ON objetos(ubicacion_id);
CREATE INDEX IF NOT EXISTS idx_objetos_estado ON objetos(estado_id);
CREATE INDEX IF NOT EXISTS idx_objetos_fecha ON objetos(fecha_reporte);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_objeto ON reclamaciones(objeto_id);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_usuario ON reclamaciones(usuario_id);
