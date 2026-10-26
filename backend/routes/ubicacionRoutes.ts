/**
 * @file ubicacionRoutes.ts
 * @description Rutas CRUD para ubicaciones del campus universitario.
 */

import { Router } from 'express';
import {
  listarUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
} from '../controllers/ubicacionController';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/ubicaciones?texto=&edificio= (público para selectores de reporte y búsqueda)
router.get('/', listarUbicaciones);

// Operaciones de escritura restringidas a Administradores
router.post('/', authenticateJWT as any, requireAdmin as any, crearUbicacion as any);
router.put('/:id', authenticateJWT as any, requireAdmin as any, actualizarUbicacion as any);
router.delete('/:id', authenticateJWT as any, requireAdmin as any, eliminarUbicacion as any);

export default router;
