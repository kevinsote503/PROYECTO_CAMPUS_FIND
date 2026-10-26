/**
 * @file entregaController.ts
 * @description Controlador para registrar y consultar entregas oficiales de objetos recuperados.
 */

import { Response } from 'express';
import { Entrega, Reclamacion, Objeto, Usuario, EstadoReclamacion } from '../models';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

/**
 * POST /api/entregas
 * Registra formalmente la entrega de un objeto tras la aprobación de la reclamación
 */
export async function registrarEntrega(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const { reclamacion_id, observaciones, fecha } = req.body;

    if (!reclamacion_id) {
      res.status(400).json({
        success: false,
        mensaje: 'Debe especificar el id de la reclamación aprobada.',
      });
      return;
    }

    const reclamacion = await Reclamacion.findByPk(reclamacion_id, {
      include: [{ model: Objeto, as: 'objeto' }],
    });

    if (!reclamacion) {
      res.status(404).json({ success: false, mensaje: 'Reclamación no encontrada.' });
      return;
    }

    // Verificar si ya existe una entrega registrada para esta reclamación
    const entregaExistente = await Entrega.findOne({ where: { reclamacion_id } });
    if (entregaExistente) {
      res.status(400).json({
        success: false,
        mensaje: 'Ya existe una entrega registrada para esta reclamación.',
      });
      return;
    }

    // Asegurar que la reclamación esté aprobada (estado 2)
    if (reclamacion.estado_reclamacion_id !== 2) {
      reclamacion.estado_reclamacion_id = 2; // Auto-aprobar si se está registrando la entrega
      await reclamacion.save();
    }

    // Crear registro de entrega
    const nuevaEntrega = await Entrega.create({
      reclamacion_id: Number(reclamacion_id),
      fecha: fecha ? new Date(fecha) : new Date(),
      observaciones: observaciones ? String(observaciones).trim() : 'Entrega realizada y verificada con el propietario legítimo.',
    });

    // Actualizar el estado del objeto a 'recuperado' (id 3)
    if (reclamacion.objeto_id) {
      await Objeto.update({ estado_id: 3 }, { where: { id: reclamacion.objeto_id } });
    }

    const entregaCompleta = await Entrega.findByPk(nuevaEntrega.id, {
      include: [
        {
          model: Reclamacion,
          as: 'reclamacion',
          include: [
            { model: Objeto, as: 'objeto' },
            { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'telefono'] },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      mensaje: 'Entrega registrada con éxito. El objeto ha sido marcado como recuperado.',
      entrega: entregaCompleta,
    });
  } catch (error: any) {
    console.error('Error al registrar entrega:', error);
    res.status(500).json({ success: false, mensaje: 'Error al registrar la entrega.', error: error.message });
  }
}

/**
 * GET /api/entregas
 * Lista el historial de entregas efectuadas
 */
export async function listarEntregas(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const entregas = await Entrega.findAll({
      include: [
        {
          model: Reclamacion,
          as: 'reclamacion',
          include: [
            { model: Objeto, as: 'objeto' },
            { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'telefono'] },
            { model: EstadoReclamacion, as: 'estado_reclamacion' },
          ],
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: entregas.length,
      entregas,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al listar entregas.', error: error.message });
  }
}

export default {
  registrarEntrega,
  listarEntregas,
};
