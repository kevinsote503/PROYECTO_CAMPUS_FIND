-- =============================================================================
-- CAMPUS FIND - Script de Inicialización (Seed Data)
-- Contiene datos iniciales esenciales y registros de prueba realistas
-- =============================================================================

-- Tipos de usuario
INSERT OR IGNORE INTO tipos_usuario (id, nombre) VALUES
(1, 'estudiante'),
(2, 'docente'),
(3, 'personal'),
(4, 'administrador');

-- Categorías
INSERT OR IGNORE INTO categorias (id, nombre) VALUES
(1, 'Electrónica'),
(2, 'Documentos e Identificaciones'),
(3, 'Mochilas y Bolsos'),
(4, 'Ropa y Accesorios'),
(5, 'Libros y Cuadernos'),
(6, 'Llaves y Llaveros'),
(7, 'Botellas y Termos'),
(8, 'Otros');

-- Ubicaciones universitarias
INSERT OR IGNORE INTO ubicaciones (id, nombre, edificio, descripcion) VALUES
(1, 'Biblioteca Central - Sala de Estudio', 'Edificio B', 'Segundo piso, cubículos de lectura individual'),
(2, 'Cafetería Principal', 'Edificio C', 'Área de mesas exteriores y barra de servicio'),
(3, 'Laboratorio de Cómputo 102', 'Facultad de Ingeniería', 'Primer nivel, pasillo norte de informática'),
(4, 'Gimnasio Polideportivo', 'Complejo Deportivo', 'Gradas y vestidores de cancha múltiple'),
(5, 'Auditorio Mayor', 'Rectoría', 'Asientos centrales de conferencias magnas'),
(6, 'Plaza Central de Estudiantes', 'Área Libre', 'Bancas y jardineras frente a la fuente'),
(7, 'Edificio Aulas 3 - Salón 304', 'Edificio A3', 'Tercer piso, aula de clases teóricas');

-- Estados de objetos
INSERT OR IGNORE INTO estados (id, nombre) VALUES
(1, 'perdido'),
(2, 'encontrado'),
(3, 'recuperado');

-- Estados de reclamación
INSERT OR IGNORE INTO estados_reclamacion (id, nombre) VALUES
(1, 'pendiente'),
(2, 'aprobada'),
(3, 'rechazada');

-- Usuarios semilla (contraseña por defecto para todos: 'password123' con bcrypt hash)
-- Hash: $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5eJ6wX9x6Qy2R2D7JvE.Qj2p0uW
INSERT OR IGNORE INTO usuarios (id, nombre, correo, contraseña, telefono, tipo_usuario_id) VALUES
(1, 'Admin Campus', 'admin@campusfind.edu', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5eJ6wX9x6Qy2R2D7JvE.Qj2p0uW', '555-0100', 4),
(2, 'Valeria Morales', 'estudiante@campusfind.edu', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5eJ6wX9x6Qy2R2D7JvE.Qj2p0uW', '555-0101', 1),
(3, 'Prof. Carlos Méndez', 'docente@campusfind.edu', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5eJ6wX9x6Qy2R2D7JvE.Qj2p0uW', '555-0102', 2),
(4, 'Marta Gómez (Seguridad)', 'personal@campusfind.edu', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5eJ6wX9x6Qy2R2D7JvE.Qj2p0uW', '555-0103', 3);

-- Objetos de muestra
INSERT OR IGNORE INTO objetos (id, usuario_id, categoria_id, ubicacion_id, estado_id, titulo, descripcion, fecha_reporte) VALUES
(1, 2, 1, 1, 1, 'Calculadora Texas Instruments TI-84 Plus', 'Calculadora gráfica color negro con funda gris clara. Olvidada sobre mesa 14 cerca de la ventana.', datetime('now', '-2 days')),
(2, 4, 1, 3, 2, 'Auriculares Inalámbricos Sony WH-CH520', 'Auriculares de diadema color azul marino, encontrados sobre el escritorio de la terminal 12.', datetime('now', '-1 day')),
(3, 2, 2, 2, 1, 'Credencial Universitaria y Tarjeta de Transporte', 'Portacredencial de acrílico con cinta azul que dice Facultad de Ciencias. A nombre de Valeria M.', datetime('now', '-3 days')),
(4, 3, 3, 7, 2, 'Mochila Jansport Color Verde Oliva', 'Contiene libreta de apuntes de Cálculo y cartuchera con bolígrafos. Encontrada al final del salón 304.', datetime('now', '-4 hours')),
(5, 4, 6, 6, 2, 'Llavero con 3 llaves y figura metálica de búho', 'Llavero metálico hallado en una de las bancas de la Plaza Central.', datetime('now', '-1 day')),
(6, 2, 7, 4, 3, 'Termo Hydro Flask 32oz Azul Cielo', 'Termo de acero inoxidable con calcomanía de la mascota universitaria.', datetime('now', '-5 days'));

-- Reclamaciones de muestra
INSERT OR IGNORE INTO reclamaciones (id, objeto_id, usuario_id, descripcion, fecha, estado_reclamacion_id) VALUES
(1, 2, 2, 'Creo que los auriculares son míos. Son marca Sony modelo azul, tienen una pequeña marca en el auricular izquierdo y la almohadilla derecha está ligeramente desgastada.', datetime('now', '-18 hours'), 1),
(2, 6, 2, 'El termo tiene mi nombre grabado en la base con marcador permanente y la calcomanía del búho deportivo.', datetime('now', '-4 days'), 2);

-- Entregas de muestra (para el objeto 6 que ya fue recuperado)
INSERT OR IGNORE INTO entregas (id, reclamacion_id, fecha, observaciones) VALUES
(1, 2, datetime('now', '-3 days'), 'Entrega realizada en caseta de seguridad central previa verificación de identidad de la estudiante.');
