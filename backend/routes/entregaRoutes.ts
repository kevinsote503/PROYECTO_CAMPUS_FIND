/**
 * @file entregaRoutes.ts
 * @description Rutas para el registro y consulta de entregas oficiales.
 */

import { Router } from 'express';
import { registrarEntrega, listarEntregas } from '../controllers/entregaController';
import { authenticateJWT, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// GET /api/entregas
router.get('/', authenticateJWT as any, listarEntregas as any);

// POST /api/entregas (registrar entrega formal, admin o personal de seguridad)
router.post('/', authenticateJWT as any, requireAdmin as any, registrarEntrega as any);

export default router;
