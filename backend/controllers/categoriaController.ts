/**
 * @file categoriaController.ts
 * @description Controlador CRUD completo para categorías de objetos con búsqueda interactiva.
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Categoria, Objeto } from '../models';

/**
 * GET /api/categorias?texto=
 * Obtiene todas las categorías disponibles con filtrado interactivo
 */
export async function listarCategorias(req: Request, res: Response): Promise<void> {
  try {
    const { texto } = req.query;
    const where: any = {};

    if (texto && String(texto).trim().length > 0) {
      where.nombre = { [Op.like]: `%${String(texto).trim()}%` };
    }

    const categorias = await Categoria.findAll({
      where,
      order: [['nombre', 'ASC']],
    });
    res.status(200).json({ success: true, total: categorias.length, categorias });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener categorías.', error: error.message });
  }
}

/**
 * POST /api/categorias
 * Crea una nueva categoría validando su formato
 */
export async function crearCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { nombre } = req.body;

    if (!nombre || String(nombre).trim().length < 3 || String(nombre).trim().length > 50) {
      res.status(400).json({
        success: false,
        mensaje: 'El nombre de la categoría debe tener entre 3 y 50 caracteres.',
      });
      return;
    }

    const categoriaExistente = await Categoria.findOne({ where: { nombre: String(nombre).trim() } });
    if (categoriaExistente) {
      res.status(400).json({ success: false, mensaje: 'Ya existe una categoría con ese nombre.' });
      return;
    }

    const nuevaCategoria = await Categoria.create({ nombre: String(nombre).trim() });
    res.status(201).json({ success: true, mensaje: 'Categoría creada exitosamente.', categoria: nuevaCategoria });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al registrar categoría.', error: error.message });
  }
}

/**
 * PUT /api/categorias/:id
 * Actualiza una categoría existente
 */
export async function actualizarCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      res.status(404).json({ success: false, mensaje: 'Categoría no encontrada.' });
      return;
    }

    if (!nombre || String(nombre).trim().length < 3 || String(nombre).trim().length > 50) {
      res.status(400).json({
        success: false,
        mensaje: 'El nombre de la categoría debe tener entre 3 y 50 caracteres.',
      });
      return;
    }

    const duplicada = await Categoria.findOne({
      where: {
        nombre: String(nombre).trim(),
        id: { [Op.ne]: categoria.id },
      },
    });
    if (duplicada) {
      res.status(400).json({ success: false, mensaje: 'Ya existe otra categoría con ese nombre.' });
      return;
    }

    categoria.nombre = String(nombre).trim();
    await categoria.save();

    res.status(200).json({
      success: true,
      mensaje: 'Categoría actualizada correctamente.',
      categoria,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al actualizar categoría.', error: error.message });
  }
}

/**
 * DELETE /api/categorias/:id
 * Elimina una categoría verificando integridad referencial 3FN
 */
export async function eliminarCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      res.status(404).json({ success: false, mensaje: 'Categoría no encontrada.' });
      return;
    }

    const objetosAsociados = await Objeto.count({ where: { categoria_id: categoria.id } });
    if (objetosAsociados > 0) {
      res.status(400).json({
        success: false,
        mensaje: `Integridad Referencial (3FN): No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${objetosAsociados} objeto(s) asociados.`,
      });
      return;
    }

    await categoria.destroy();
    res.status(200).json({ success: true, mensaje: 'Categoría eliminada correctamente.' });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al eliminar categoría.', error: error.message });
  }
}

export default {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};
