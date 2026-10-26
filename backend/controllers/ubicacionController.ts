/**
 * @file ubicacionController.ts
 * @description Controlador CRUD completo para ubicaciones físicas del campus universitario con búsqueda interactiva.
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Ubicacion, Objeto } from '../models';

/**
 * GET /api/ubicaciones?texto=&edificio=
 * Lista todas las ubicaciones registradas en el campus con filtrado interactivo
 */
export async function listarUbicaciones(req: Request, res: Response): Promise<void> {
  try {
    const { texto, edificio } = req.query;
    const where: any = {};

    if (edificio && edificio !== 'todos' && String(edificio).trim().length > 0) {
      where.edificio = String(edificio).trim();
    }

    if (texto && String(texto).trim().length > 0) {
      const termino = `%${String(texto).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: termino } },
        { edificio: { [Op.like]: termino } },
        { descripcion: { [Op.like]: termino } },
      ];
    }

    const ubicaciones = await Ubicacion.findAll({
      where,
      order: [
        ['edificio', 'ASC'],
        ['nombre', 'ASC'],
      ],
    });
    res.status(200).json({ success: true, total: ubicaciones.length, ubicaciones });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al listar ubicaciones.', error: error.message });
  }
}

/**
 * POST /api/ubicaciones
 * Agrega una nueva ubicación en el campus universitario validando formato
 */
export async function crearUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, edificio, descripcion, latitud, longitud } = req.body;

    if (!nombre || String(nombre).trim().length < 3 || String(nombre).trim().length > 100) {
      res.status(400).json({
        success: false,
        mensaje: 'El nombre de la ubicación es obligatorio y debe tener entre 3 y 100 caracteres.',
      });
      return;
    }

    if (!edificio || String(edificio).trim().length < 2 || String(edificio).trim().length > 50) {
      res.status(400).json({
        success: false,
        mensaje: 'El edificio o facultad es obligatorio y debe tener entre 2 y 50 caracteres.',
      });
      return;
    }

    const duplicada = await Ubicacion.findOne({
      where: {
        nombre: String(nombre).trim(),
        edificio: String(edificio).trim(),
      },
    });
    if (duplicada) {
      res.status(400).json({
        success: false,
        mensaje: 'Ya existe una ubicación con ese mismo nombre en el edificio indicado.',
      });
      return;
    }

    const latVal = latitud !== undefined && !isNaN(Number(latitud)) ? Number(latitud) : 13.3468;
    const lngVal = longitud !== undefined && !isNaN(Number(longitud)) ? Number(longitud) : -88.4205;

    const nuevaUbicacion = await Ubicacion.create({
      nombre: String(nombre).trim(),
      edificio: String(edificio).trim(),
      descripcion: descripcion ? String(descripcion).trim() : '',
      latitud: latVal,
      longitud: lngVal,
    });

    res.status(201).json({
      success: true,
      mensaje: 'Ubicación registrada exitosamente.',
      ubicacion: nuevaUbicacion,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al registrar ubicación.', error: error.message });
  }
}

/**
 * PUT /api/ubicaciones/:id
 * Actualiza una ubicación existente validando formatos
 */
export async function actualizarUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, edificio, descripcion, latitud, longitud } = req.body;

    const ubicacion = await Ubicacion.findByPk(id);
    if (!ubicacion) {
      res.status(404).json({ success: false, mensaje: 'Ubicación no encontrada.' });
      return;
    }

    if (nombre !== undefined) {
      if (String(nombre).trim().length < 3 || String(nombre).trim().length > 100) {
        res.status(400).json({
          success: false,
          mensaje: 'El nombre del lugar debe tener entre 3 y 100 caracteres.',
        });
        return;
      }
      ubicacion.nombre = String(nombre).trim();
    }

    if (edificio !== undefined) {
      if (String(edificio).trim().length < 2 || String(edificio).trim().length > 50) {
        res.status(400).json({
          success: false,
          mensaje: 'El nombre del edificio debe tener entre 2 y 50 caracteres.',
        });
        return;
      }
      ubicacion.edificio = String(edificio).trim();
    }

    if (descripcion !== undefined) {
      ubicacion.descripcion = String(descripcion).trim();
    }

    if (latitud !== undefined && !isNaN(Number(latitud))) {
      ubicacion.latitud = Number(latitud);
    }

    if (longitud !== undefined && !isNaN(Number(longitud))) {
      ubicacion.longitud = Number(longitud);
    }

    await ubicacion.save();

    res.status(200).json({
      success: true,
      mensaje: 'Ubicación actualizada correctamente.',
      ubicacion,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al actualizar ubicación.', error: error.message });
  }
}

/**
 * DELETE /api/ubicaciones/:id
 * Elimina una ubicación verificando integridad referencial 3FN con objetos reportados
 */
export async function eliminarUbicacion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ubicacion = await Ubicacion.findByPk(id);

    if (!ubicacion) {
      res.status(404).json({ success: false, mensaje: 'Ubicación no encontrada.' });
      return;
    }

    const objetosEnUbicacion = await Objeto.count({ where: { ubicacion_id: ubicacion.id } });
    if (objetosEnUbicacion > 0) {
      res.status(400).json({
        success: false,
        mensaje: `Integridad Referencial (3FN): No se puede eliminar "${ubicacion.edificio} - ${ubicacion.nombre}" porque existen ${objetosEnUbicacion} objeto(s) reportados en este lugar.`,
      });
      return;
    }

    await ubicacion.destroy();

    res.status(200).json({
      success: true,
      mensaje: 'Ubicación eliminada correctamente.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al eliminar ubicación.', error: error.message });
  }
}

export default {
  listarUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
};
