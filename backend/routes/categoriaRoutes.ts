/**
 * @file categoriaRoutes.ts
 * @description Rutas CRUD para categorías de objetos.
 */

import { Router } from 'express';
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../controllers/categoriaController';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/categorias?texto= (público para selectores y filtros)
router.get('/', listarCategorias);

// Operaciones de escritura restringidas a Administradores
router.post('/', authenticateJWT as any, requireAdmin as any, crearCategoria as any);
router.put('/:id', authenticateJWT as any, requireAdmin as any, actualizarCategoria as any);
router.delete('/:id', authenticateJWT as any, requireAdmin as any, eliminarCategoria as any);

export default router;
