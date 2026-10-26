/**
 * @file statsController.ts
 * @description Controlador para proporcionar métricas, indicadores y el esquema normalizado 3FN + POO en vivo.
 */

import { Request, Response } from 'express';
import {
  Objeto,
  Reclamacion,
  Entrega,
  Categoria,
  Ubicacion,
  Usuario,
  TipoUsuario,
  Estado,
  EstadoReclamacion,
} from '../models';

export async function obtenerEstadisticas(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalObjetos,
      totalPerdidos,
      totalEncontrados,
      totalRecuperados,
      reclamacionesPendientes,
      reclamacionesAprobadas,
      totalEntregas,
      totalUsuarios,
    ] = await Promise.all([
      Objeto.count(),
      Objeto.count({ where: { estado_id: 1 } }),
      Objeto.count({ where: { estado_id: 2 } }),
      Objeto.count({ where: { estado_id: 3 } }),
      Reclamacion.count({ where: { estado_reclamacion_id: 1 } }),
      Reclamacion.count({ where: { estado_reclamacion_id: 2 } }),
      Entrega.count(),
      Usuario.count(),
    ]);

    const tasaRecuperacion = totalObjetos > 0 ? Math.round((totalRecuperados / totalObjetos) * 100) : 0;

    res.status(200).json({
      success: true,
      estadisticas: {
        totalObjetos,
        totalPerdidos,
        totalEncontrados,
        totalRecuperados,
        reclamacionesPendientes,
        reclamacionesAprobadas,
        totalEntregas,
        totalUsuarios,
        tasaRecuperacion,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, mensaje: 'Error al calcular estadísticas.', error: error.message });
  }
}

/**
 * GET /api/stats/esquema
 * Retorna el estado en vivo de las 9 tablas SQLite normalizadas en 3FN y su arquitectura POO.
 */
export async function obtenerEsquemaNormalizado(_req: Request, res: Response): Promise<void> {
  try {
    const [
      cTiposUsuario,
      cUsuarios,
      cCategorias,
      cUbicaciones,
      cEstados,
      cEstadosRec,
      cObjetos,
      cReclamaciones,
      cEntregas,
    ] = await Promise.all([
      TipoUsuario.count(),
      Usuario.count(),
      Categoria.count(),
      Ubicacion.count(),
      Estado.count(),
      EstadoReclamacion.count(),
      Objeto.count(),
      Reclamacion.count(),
      Entrega.count(),
    ]);

    const tablas = [
      {
        nombre: 'tipos_usuario',
        clasePOO: 'TipoUsuario extends Model',
        formaNormal: '3FN (Catálogo Atómico)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [],
        columnas: ['id', 'nombre (UNIQUE)'],
        registros: cTiposUsuario,
        descripcion: 'Separa los roles (estudiante, docente, personal, administrador) evitando repetir texto en usuarios.',
      },
      {
        nombre: 'usuarios',
        clasePOO: 'Usuario extends EntidadBase',
        formaNormal: '3FN (Sin dependencias transitivas)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: ['tipo_usuario_id -> tipos_usuario(id) ON DELETE RESTRICT'],
        columnas: ['id', 'nombre', 'correo (UNIQUE)', 'contraseña (Bcrypt)', 'telefono', 'tipo_usuario_id', 'creado_en'],
        registros: cUsuarios,
        descripcion: 'Entidad de miembros de la comunidad universitaria con encapsulamiento de contraseña.',
      },
      {
        nombre: 'categorias',
        clasePOO: 'Categoria extends EntidadBase',
        formaNormal: '3FN (Catálogo de Clasificación)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [],
        columnas: ['id', 'nombre (UNIQUE)'],
        registros: cCategorias,
        descripcion: 'Clasificación normalizada de pertenencias (Electrónica, Documentos, Mochilas, etc.).',
      },
      {
        nombre: 'ubicaciones',
        clasePOO: 'Ubicacion extends EntidadBase',
        formaNormal: '3FN (Entidad Espacial Geolocalizada Usulután)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [],
        columnas: ['id', 'nombre', 'edificio', 'descripcion', 'latitud', 'longitud'],
        registros: cUbicaciones,
        descripcion: 'Aísla los atributos del edificio, aula y coordenadas GPS de Usulután sin redundancia.',
      },
      {
        nombre: 'estados',
        clasePOO: 'Estado extends Model',
        formaNormal: '3FN (Catálogo de Ciclo de Vida)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [],
        columnas: ['id', 'nombre (UNIQUE)'],
        registros: cEstados,
        descripcion: 'Estados del objeto: 1 = perdido, 2 = encontrado, 3 = recuperado.',
      },
      {
        nombre: 'estados_reclamacion',
        clasePOO: 'EstadoReclamacion extends Model',
        formaNormal: '3FN (Catálogo de Dictamen)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [],
        columnas: ['id', 'nombre (UNIQUE)'],
        registros: cEstadosRec,
        descripcion: 'Estados de validación: 1 = pendiente, 2 = aprobada, 3 = rechazada.',
      },
      {
        nombre: 'objetos',
        clasePOO: 'Objeto extends EntidadBase',
        formaNormal: '3FN (Entidad Central Relacional)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [
          'usuario_id -> usuarios(id) ON DELETE RESTRICT',
          'categoria_id -> categorias(id) ON DELETE RESTRICT',
          'ubicacion_id -> ubicaciones(id) ON DELETE RESTRICT',
          'estado_id -> estados(id) ON DELETE RESTRICT',
        ],
        columnas: ['id', 'usuario_id', 'categoria_id', 'ubicacion_id', 'estado_id', 'titulo', 'descripcion', 'fecha_reporte', 'latitud', 'longitud'],
        registros: cObjetos,
        descripcion: 'Tabla maestra de objetos reportados vinculada mediante 4 claves foráneas indexadas.',
      },
      {
        nombre: 'reclamaciones',
        clasePOO: 'Reclamacion extends EntidadBase',
        formaNormal: '3FN (Transaccional de Solicitudes)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: [
          'objeto_id -> objetos(id) ON DELETE CASCADE',
          'usuario_id -> usuarios(id) ON DELETE RESTRICT',
          'estado_reclamacion_id -> estados_reclamacion(id) ON DELETE RESTRICT',
        ],
        columnas: ['id', 'objeto_id', 'usuario_id', 'descripcion', 'fecha', 'estado_reclamacion_id'],
        registros: cReclamaciones,
        descripcion: 'Registra solicitudes de propiedad con evidencias sin duplicar datos del objeto ni del usuario.',
      },
      {
        nombre: 'entregas',
        clasePOO: 'Entrega extends Model',
        formaNormal: '3FN (Acta Oficial 1:1)',
        pk: 'id (INTEGER PK AUTOINCREMENT)',
        fks: ['reclamacion_id (UNIQUE) -> reclamaciones(id) ON DELETE CASCADE'],
        columnas: ['id', 'reclamacion_id (UNIQUE)', 'fecha', 'observaciones'],
        registros: cEntregas,
        descripcion: 'Cierre formal de devolución vinculado 1 a 1 con una reclamación aprobada.',
      },
    ];

    res.status(200).json({
      success: true,
      motor: 'SQLite3 Embebido (PRAGMA foreign_keys = ON)',
      orm: 'Sequelize ORM + TypeScript POO',
      totalTablas: tablas.length,
      tablas,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener esquema normalizado.', error: error.message });
  }
}

export default {
  obtenerEstadisticas,
  obtenerEsquemaNormalizado,
};
