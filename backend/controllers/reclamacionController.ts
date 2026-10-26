/**
 * @file reclamacionController.ts
 * @description Controlador CRUD completo para gestionar solicitudes de reclamación sobre objetos perdidos/encontrados.
 */

import { Response } from 'express';
import { Op } from 'sequelize';
import { Reclamacion, Objeto, Usuario, EstadoReclamacion, Entrega, Estado, Categoria, Ubicacion } from '../models';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

/**
 * GET /api/reclamaciones?texto=&estado_reclamacion_id=
 * Lista reclamaciones con búsqueda interactiva. Si es administrador, lista todas; si es usuario normal, lista sólo las suyas.
 */
export async function listarReclamaciones(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { texto, estado_reclamacion_id } = req.query;
    const esAdmin = req.user.rol === 'administrador';
    const whereClause: any = esAdmin ? {} : { usuario_id: req.user.id };

    if (estado_reclamacion_id && estado_reclamacion_id !== 'todos' && !isNaN(Number(estado_reclamacion_id))) {
      whereClause.estado_reclamacion_id = Number(estado_reclamacion_id);
    }

    if (texto && String(texto).trim().length > 0) {
      whereClause.descripcion = { [Op.like]: `%${String(texto).trim()}%` };
    }

    const reclamaciones = await Reclamacion.findAll({
      where: whereClause,
      include: [
        {
          model: Objeto,
          as: 'objeto',
          include: [
            { model: Categoria, as: 'categoria' },
            { model: Ubicacion, as: 'ubicacion' },
            { model: Estado, as: 'estado' },
          ],
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'correo', 'telefono'],
        },
        {
          model: EstadoReclamacion,
          as: 'estado_reclamacion',
        },
        {
          model: Entrega,
          as: 'entrega',
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: reclamaciones.length,
      reclamaciones,
    });
  } catch (error: any) {
    console.error('Error al listar reclamaciones:', error);
    res.status(500).json({ success: false, mensaje: 'Error al obtener reclamaciones.', error: error.message });
  }
}

/**
 * GET /api/reclamaciones/mis-reclamaciones
 * Lista exclusivamente las reclamaciones enviadas por el usuario en sesión
 */
export async function misReclamaciones(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const reclamaciones = await Reclamacion.findAll({
      where: { usuario_id: req.user.id },
      include: [
        {
          model: Objeto,
          as: 'objeto',
          include: [
            { model: Categoria, as: 'categoria' },
            { model: Ubicacion, as: 'ubicacion' },
            { model: Estado, as: 'estado' },
          ],
        },
        {
          model: EstadoReclamacion,
          as: 'estado_reclamacion',
        },
        {
          model: Entrega,
          as: 'entrega',
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: reclamaciones.length,
      reclamaciones,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al consultar mis reclamaciones.', error: error.message });
  }
}

/**
 * POST /api/reclamaciones
 * Envía una solicitud indicando "Creo que este objeto es mío"
 */
export async function crearReclamacion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'Debe iniciar sesión para reclamar un objeto.' });
      return;
    }

    const { objeto_id, descripcion } = req.body;

    if (!objeto_id || !descripcion || String(descripcion).trim().length < 10) {
      res.status(400).json({
        success: false,
        mensaje: 'Debe proporcionar el objeto y una descripción detallada que demuestre que el objeto le pertenece (mínimo 10 caracteres).',
      });
      return;
    }

    // Verificar si el objeto existe
    const objeto = await Objeto.findByPk(objeto_id);
    if (!objeto) {
      res.status(404).json({ success: false, mensaje: 'El objeto especificado no existe.' });
      return;
    }

    // El usuario no puede reclamar un objeto que él mismo reportó como encontrado o perdido (salvo admin en pruebas CRUD)
    if (objeto.usuario_id === req.user.id && req.user.rol !== 'administrador') {
      res.status(400).json({
        success: false,
        mensaje: 'No puedes enviar una reclamación sobre un objeto que tú mismo reportaste.',
      });
      return;
    }

    // Verificar si ya tiene una reclamación pendiente para este objeto
    const reclamacionExistente = await Reclamacion.findOne({
      where: {
        objeto_id,
        usuario_id: req.user.id,
        estado_reclamacion_id: 1, // pendiente
      },
    });

    if (reclamacionExistente) {
      res.status(400).json({
        success: false,
        mensaje: 'Ya tienes una solicitud de reclamación pendiente de revisión para este objeto.',
      });
      return;
    }

    const nuevaReclamacion = await Reclamacion.create({
      objeto_id: Number(objeto_id),
      usuario_id: req.user.id,
      descripcion: String(descripcion).trim(),
      estado_reclamacion_id: 1, // 1 = pendiente
      fecha: new Date(),
    });

    const reclamacionCompleta = await Reclamacion.findByPk(nuevaReclamacion.id, {
      include: [
        { model: Objeto, as: 'objeto' },
        { model: EstadoReclamacion, as: 'estado_reclamacion' },
      ],
    });

    res.status(201).json({
      success: true,
      mensaje: 'Tu solicitud de reclamación ha sido enviada. El administrador revisará las evidencias.',
      reclamacion: reclamacionCompleta,
    });
  } catch (error: any) {
    console.error('Error al crear reclamación:', error);
    res.status(500).json({ success: false, mensaje: 'Error al enviar la reclamación.', error: error.message });
  }
}

/**
 * PUT /api/reclamaciones/:id
 * Actualiza el estado o la descripción de una reclamación.
 */
export async function actualizarEstadoReclamacion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { id } = req.params;
    const { estado_reclamacion_id, descripcion } = req.body;

    const reclamacion = await Reclamacion.findByPk(id, {
      include: [{ model: Objeto, as: 'objeto' }],
    });

    if (!reclamacion) {
      res.status(404).json({ success: false, mensaje: 'Reclamación no encontrada.' });
      return;
    }

    const esAdmin = req.user.rol === 'administrador';
    const esDueño = reclamacion.usuario_id === req.user.id;

    if (!esAdmin && !esDueño) {
      res.status(403).json({
        success: false,
        mensaje: 'No tienes permisos para modificar esta reclamación.',
      });
      return;
    }

    if (descripcion !== undefined) {
      if (String(descripcion).trim().length < 10) {
        res.status(400).json({
          success: false,
          mensaje: 'La descripción de evidencias debe tener al menos 10 caracteres.',
        });
        return;
      }
      reclamacion.descripcion = String(descripcion).trim();
    }

    if (estado_reclamacion_id !== undefined) {
      if (!esAdmin) {
        res.status(403).json({
          success: false,
          mensaje: 'Solo un administrador puede cambiar el dictamen de la reclamación.',
        });
        return;
      }
      if (![1, 2, 3].includes(Number(estado_reclamacion_id))) {
        res.status(400).json({
          success: false,
          mensaje: 'Estado de reclamación inválido (1: pendiente, 2: aprobada, 3: rechazada).',
        });
        return;
      }
      reclamacion.estado_reclamacion_id = Number(estado_reclamacion_id);

      // Si la reclamación fue aprobada, marcar objeto como recuperado
      if (Number(estado_reclamacion_id) === 2 && reclamacion.objeto) {
        await Objeto.update({ estado_id: 3 }, { where: { id: reclamacion.objeto_id } });
      }
    }

    await reclamacion.save();

    const actualizada = await Reclamacion.findByPk(id, {
      include: [
        { model: Objeto, as: 'objeto' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'telefono'] },
        { model: EstadoReclamacion, as: 'estado_reclamacion' },
        { model: Entrega, as: 'entrega' },
      ],
    });

    res.status(200).json({
      success: true,
      mensaje: 'Reclamación actualizada exitosamente.',
      reclamacion: actualizada,
    });
  } catch (error: any) {
    console.error('Error al actualizar reclamación:', error);
    res.status(500).json({ success: false, mensaje: 'Error al actualizar reclamación.', error: error.message });
  }
}

/**
 * DELETE /api/reclamaciones/:id
 * Elimina una reclamación (por su creador si está pendiente, o por el administrador)
 */
export async function eliminarReclamacion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { id } = req.params;
    const reclamacion = await Reclamacion.findByPk(id);

    if (!reclamacion) {
      res.status(404).json({ success: false, mensaje: 'Reclamación no encontrada.' });
      return;
    }

    const esAdmin = req.user.rol === 'administrador';
    const esDueño = reclamacion.usuario_id === req.user.id;

    if (!esAdmin && !esDueño) {
      res.status(403).json({
        success: false,
        mensaje: 'No tienes permisos para eliminar esta reclamación.',
      });
      return;
    }

    await reclamacion.destroy();

    res.status(200).json({
      success: true,
      mensaje: 'Reclamación eliminada correctamente.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al eliminar reclamación.', error: error.message });
  }
}

export default {
  listarReclamaciones,
  misReclamaciones,
  crearReclamacion,
  actualizarEstadoReclamacion,
  eliminarReclamacion,
};
