/**
 * @file objetoController.ts
 * @description Controlador para operaciones CRUD, búsqueda multicriterio y algoritmo de posibles coincidencias.
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Objeto, Categoria, Ubicacion, Estado, Usuario, Reclamacion } from '../models';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

/**
 * GET /api/objetos
 * Lista todos los objetos con sus relaciones (ordenados por fecha de reporte descendente)
 */
export async function listarObjetos(req: Request, res: Response): Promise<void> {
  try {
    const { limite = 50, estado } = req.query;

    const whereClause: any = {};
    if (estado) {
      // Si se filtra por nombre de estado o id
      if (!isNaN(Number(estado))) {
        whereClause.estado_id = Number(estado);
      }
    }

    const objetos = await Objeto.findAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
      ],
      order: [['fecha_reporte', 'DESC']],
      limit: Number(limite),
    });

    res.status(200).json({
      success: true,
      total: objetos.length,
      objetos,
    });
  } catch (error: any) {
    console.error('Error al listar objetos:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener los objetos.', error: error.message });
  }
}

/**
 * GET /api/objetos/buscar?categoria=&ubicacion=&estado=&texto=
 * Búsqueda avanzada con filtros combinables
 */
export async function buscarObjetos(req: Request, res: Response): Promise<void> {
  try {
    const { categoria, ubicacion, estado, texto } = req.query;

    const where: any = {};

    if (categoria && categoria !== 'todas' && !isNaN(Number(categoria))) {
      where.categoria_id = Number(categoria);
    }

    if (ubicacion && ubicacion !== 'todas' && !isNaN(Number(ubicacion))) {
      where.ubicacion_id = Number(ubicacion);
    }

    if (estado && estado !== 'todos' && !isNaN(Number(estado))) {
      where.estado_id = Number(estado);
    }

    if (texto && String(texto).trim().length > 0) {
      const termino = `%${String(texto).trim()}%`;
      where[Op.or] = [
        { titulo: { [Op.like]: termino } },
        { descripcion: { [Op.like]: termino } },
      ];
    }

    const objetos = await Objeto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
      ],
      order: [['fecha_reporte', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: objetos.length,
      objetos,
    });
  } catch (error: any) {
    console.error('Error al buscar objetos:', error);
    res.status(500).json({ success: false, mensaje: 'Error en la búsqueda de objetos.', error: error.message });
  }
}

/**
 * GET /api/objetos/mis-reportes
 * Obtiene los objetos reportados por el usuario autenticado
 */
export async function misReportes(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const objetos = await Objeto.findAll({
      where: { usuario_id: req.user.id },
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        {
          model: Reclamacion,
          as: 'reclamaciones',
          include: ['estado_reclamacion', 'usuario'],
        },
      ],
      order: [['fecha_reporte', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: objetos.length,
      objetos,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener mis reportes.', error: error.message });
  }
}

/**
 * GET /api/objetos/coincidencias
 * Detecta coincidencias probables entre objetos perdidos y encontrados
 * usando comparación de categoría, ubicación y palabras clave del título.
 */
export async function buscarCoincidencias(req: Request, res: Response): Promise<void> {
  try {
    const { categoria_id, ubicacion_id, estado_id, titulo } = req.query;

    if (!categoria_id || !estado_id) {
      res.status(400).json({
        success: false,
        mensaje: 'Se requieren al menos categoria_id y estado_id para calcular coincidencias.',
      });
      return;
    }

    // Identificar el estado opuesto:
    // Si el estado enviado es 1 (perdido), buscar 2 (encontrado).
    // Si el estado enviado es 2 (encontrado), buscar 1 (perdido).
    const estadoActual = Number(estado_id);
    let estadoBuscado = 0;
    if (estadoActual === 1) estadoBuscado = 2; // de perdido a encontrado
    else if (estadoActual === 2) estadoBuscado = 1; // de encontrado a perdido
    else {
      res.status(200).json({ success: true, coincidencias: [] });
      return;
    }

    // Cláusula WHERE con SQL tradicional
    const whereConditions: any[] = [
      { estado_id: estadoBuscado },
      { categoria_id: Number(categoria_id) },
    ];

    // Si coincide la ubicación se da prioridad, o coincidencia en texto
    const orConditions: any[] = [];
    if (ubicacion_id && !isNaN(Number(ubicacion_id))) {
      orConditions.push({ ubicacion_id: Number(ubicacion_id) });
    }

    if (titulo && String(titulo).trim().length > 2) {
      // Extraer palabras clave de más de 3 letras
      const palabras = String(titulo)
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter((p) => p.length >= 4);

      palabras.forEach((p) => {
        orConditions.push({ titulo: { [Op.like]: `%${p}%` } });
        orConditions.push({ descripcion: { [Op.like]: `%${p}%` } });
      });
    }

    const finalWhere: any = {
      [Op.and]: whereConditions,
    };

    if (orConditions.length > 0) {
      finalWhere[Op.or] = orConditions;
    }

    const coincidencias = await Objeto.findAll({
      where: finalWhere,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
      ],
      order: [['fecha_reporte', 'DESC']],
      limit: 6,
    });

    res.status(200).json({
      success: true,
      total: coincidencias.length,
      coincidencias,
    });
  } catch (error: any) {
    console.error('Error al buscar coincidencias:', error);
    res.status(500).json({ success: false, mensaje: 'Error al buscar coincidencias.', error: error.message });
  }
}

/**
 * GET /api/objetos/:id
 * Obtiene el detalle de un objeto específico
 */
export async function obtenerObjetoPorId(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const objeto = await Objeto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'telefono'] },
        {
          model: Reclamacion,
          as: 'reclamaciones',
          include: ['estado_reclamacion', 'usuario', 'entrega'],
        },
      ],
    });

    if (!objeto) {
      res.status(404).json({ success: false, mensaje: 'Objeto no encontrado.' });
      return;
    }

    res.status(200).json({
      success: true,
      objeto,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener el objeto.', error: error.message });
  }
}

/**
 * POST /api/objetos
 * Crea un nuevo reporte de objeto (perdido o encontrado)
 */
export async function crearObjeto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'Debe iniciar sesión para reportar un objeto.' });
      return;
    }

    const { categoria_id, ubicacion_id, estado_id, titulo, descripcion, fecha_reporte, latitud, longitud } = req.body;

    if (!categoria_id || !ubicacion_id || !estado_id || !titulo || !descripcion) {
      res.status(400).json({
        success: false,
        mensaje: 'Todos los campos requeridos deben ser completados (categoria, ubicacion, estado, titulo, descripcion).',
      });
      return;
    }

    const tituloLimpio = String(titulo).trim();
    const descripcionLimpia = String(descripcion).trim();

    if (tituloLimpio.length < 4 || tituloLimpio.length > 150) {
      res.status(400).json({
        success: false,
        mensaje: 'El título del objeto debe contener entre 4 y 150 caracteres.',
      });
      return;
    }

    if (descripcionLimpia.length < 10) {
      res.status(400).json({
        success: false,
        mensaje: 'La descripción detallada debe contener al menos 10 caracteres.',
      });
      return;
    }

    // Validar que la fecha de reporte sea válida y no sea futura
    let fechaValidada = new Date();
    if (fecha_reporte) {
      const parsed = new Date(fecha_reporte);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({
          success: false,
          mensaje: 'El formato de la fecha de reporte no es válido.',
        });
        return;
      }
      const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);
      mañana.setHours(23, 59, 59, 999);
      if (parsed > mañana) {
        res.status(400).json({
          success: false,
          mensaje: 'La fecha del reporte no puede ser una fecha futura.',
        });
        return;
      }
      fechaValidada = parsed;
    }

    // Validar existencia de categoría, ubicación y estado
    const [cat, ubi, est] = await Promise.all([
      Categoria.findByPk(categoria_id),
      Ubicacion.findByPk(ubicacion_id),
      Estado.findByPk(estado_id),
    ]);

    if (!cat || !ubi || !est) {
      res.status(400).json({
        success: false,
        mensaje: 'Categoría, ubicación o estado seleccionado no válido.',
      });
      return;
    }

    const latFinal =
      latitud !== undefined && latitud !== null && !isNaN(Number(latitud))
        ? Number(latitud)
        : ubi.latitud ?? 13.3468;
    const lngFinal =
      longitud !== undefined && longitud !== null && !isNaN(Number(longitud))
        ? Number(longitud)
        : ubi.longitud ?? -88.4205;

    const nuevoObjeto = await Objeto.create({
      usuario_id: req.user.id,
      categoria_id: Number(categoria_id),
      ubicacion_id: Number(ubicacion_id),
      estado_id: Number(estado_id),
      titulo: tituloLimpio,
      descripcion: descripcionLimpia,
      fecha_reporte: fechaValidada,
      latitud: latFinal,
      longitud: lngFinal,
    });

    const objetoCompleto = await Objeto.findByPk(nuevoObjeto.id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
      ],
    });

    res.status(201).json({
      success: true,
      mensaje: 'Objeto reportado exitosamente.',
      objeto: objetoCompleto,
    });
  } catch (error: any) {
    console.error('Error al crear objeto:', error);
    res.status(500).json({ success: false, mensaje: 'Error al registrar el reporte.', error: error.message });
  }
}

/**
 * PUT /api/objetos/:id
 * Actualiza los datos de un objeto (sólo por su creador o un administrador)
 */
export async function actualizarObjeto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { id } = req.params;
    const objeto = await Objeto.findByPk(id);

    if (!objeto) {
      res.status(404).json({ success: false, mensaje: 'Objeto no encontrado.' });
      return;
    }

    // Verificar permisos: creador o administrador
    if (objeto.usuario_id !== req.user.id && req.user.rol !== 'administrador') {
      res.status(403).json({
        success: false,
        mensaje: 'No cuenta con permisos para modificar este objeto.',
      });
      return;
    }

    const { categoria_id, ubicacion_id, estado_id, titulo, descripcion, fecha_reporte, latitud, longitud } = req.body;

    if (titulo !== undefined) {
      const t = String(titulo).trim();
      if (t.length < 4 || t.length > 150) {
        res.status(400).json({
          success: false,
          mensaje: 'El título debe tener entre 4 y 150 caracteres.',
        });
        return;
      }
      objeto.titulo = t;
    }

    if (descripcion !== undefined) {
      const d = String(descripcion).trim();
      if (d.length < 10) {
        res.status(400).json({
          success: false,
          mensaje: 'La descripción debe tener al menos 10 caracteres.',
        });
        return;
      }
      objeto.descripcion = d;
    }

    if (categoria_id) objeto.categoria_id = Number(categoria_id);
    if (ubicacion_id) objeto.ubicacion_id = Number(ubicacion_id);
    if (estado_id) objeto.estado_id = Number(estado_id);
    if (latitud !== undefined && !isNaN(Number(latitud))) objeto.latitud = Number(latitud);
    if (longitud !== undefined && !isNaN(Number(longitud))) objeto.longitud = Number(longitud);
    if (fecha_reporte) {
      const parsed = new Date(fecha_reporte);
      if (!isNaN(parsed.getTime())) {
        objeto.fecha_reporte = parsed;
      }
    }

    await objeto.save();

    const objetoActualizado = await Objeto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Ubicacion, as: 'ubicacion' },
        { model: Estado, as: 'estado' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
      ],
    });

    res.status(200).json({
      success: true,
      mensaje: 'Objeto actualizado correctamente.',
      objeto: objetoActualizado,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al actualizar el objeto.', error: error.message });
  }
}

/**
 * DELETE /api/objetos/:id
 * Elimina un objeto reportado (sólo por su creador o un administrador)
 */
export async function eliminarObjeto(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { id } = req.params;
    const objeto = await Objeto.findByPk(id);

    if (!objeto) {
      res.status(404).json({ success: false, mensaje: 'Objeto no encontrado.' });
      return;
    }

    // Permisos
    if (objeto.usuario_id !== req.user.id && req.user.rol !== 'administrador') {
      res.status(403).json({
        success: false,
        mensaje: 'No cuenta con permisos para eliminar este objeto.',
      });
      return;
    }

    await objeto.destroy();

    res.status(200).json({
      success: true,
      mensaje: 'Objeto eliminado correctamente.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al eliminar el objeto.', error: error.message });
  }
}

export default {
  listarObjetos,
  buscarObjetos,
  misReportes,
  buscarCoincidencias,
  obtenerObjetoPorId,
  crearObjeto,
  actualizarObjeto,
  eliminarObjeto,
};
