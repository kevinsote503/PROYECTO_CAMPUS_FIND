/**
 * @file reclamacionRoutes.ts
 * @description Rutas CRUD para el flujo de reclamaciones de objetos.
 */

import { Router } from 'express';
import {
  listarReclamaciones,
  misReclamaciones,
  crearReclamacion,
  actualizarEstadoReclamacion,
  eliminarReclamacion,
} from '../controllers/reclamacionController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/reclamaciones/mis-reclamaciones
router.get('/mis-reclamaciones', authenticateJWT as any, misReclamaciones as any);

// GET /api/reclamaciones (admin ve todas, usuario regular ve las suyas)
router.get('/', authenticateJWT as any, listarReclamaciones as any);

// POST /api/reclamaciones (crear reclamación sobre un objeto)
router.post('/', authenticateJWT as any, crearReclamacion as any);

// PUT /api/reclamaciones/:id (actualizar descripción o estado)
router.put('/:id', authenticateJWT as any, actualizarEstadoReclamacion as any);

// DELETE /api/reclamaciones/:id (eliminar reclamación)
router.delete('/:id', authenticateJWT as any, eliminarReclamacion as any);

export default router;
