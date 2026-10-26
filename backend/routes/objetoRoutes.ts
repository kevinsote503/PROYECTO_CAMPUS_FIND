/**
 * @file objetoRoutes.ts
 * @description Rutas para el CRUD de objetos, búsqueda y coincidencias.
 */

import { Router } from 'express';
import {
  listarObjetos,
  buscarObjetos,
  misReportes,
  buscarCoincidencias,
  obtenerObjetoPorId,
  crearObjeto,
  actualizarObjeto,
  eliminarObjeto,
} from '../controllers/objetoController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Endpoints de búsqueda y filtros
// GET /api/objetos/buscar?categoria=&ubicacion=&estado=&texto=
router.get('/buscar', buscarObjetos);

// GET /api/objetos/coincidencias?categoria_id=&ubicacion_id=&estado_id=&titulo=
router.get('/coincidencias', buscarCoincidencias);

// GET /api/objetos/mis-reportes (requiere autenticación)
router.get('/mis-reportes', authenticateJWT as any, misReportes as any);

// GET /api/objetos (listado general)
router.get('/', listarObjetos);

// GET /api/objetos/:id (detalle de un objeto)
router.get('/:id', obtenerObjetoPorId);

// POST /api/objetos (crear nuevo reporte, protegido)
router.post('/', authenticateJWT as any, crearObjeto as any);

// PUT /api/objetos/:id (actualizar reporte, protegido)
router.put('/:id', authenticateJWT as any, actualizarObjeto as any);

// DELETE /api/objetos/:id (eliminar reporte, protegido)
router.delete('/:id', authenticateJWT as any, eliminarObjeto as any);

export default router;
