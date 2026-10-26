/**
 * @file usuarioRoutes.ts
 * @description Rutas RESTful para el CRUD y búsqueda interactiva de usuarios (Exclusivo Administradores).
 */

import { Router } from 'express';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../controllers/usuarioController';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de gestión de directorio de usuarios requieren sesión de Administrador
router.get('/', authenticateJWT as any, requireAdmin as any, listarUsuarios as any);
router.post('/', authenticateJWT as any, requireAdmin as any, crearUsuario as any);
router.put('/:id', authenticateJWT as any, requireAdmin as any, actualizarUsuario as any);
router.delete('/:id', authenticateJWT as any, requireAdmin as any, eliminarUsuario as any);

export default router;
