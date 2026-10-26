/**
 * @file statsRoutes.ts
 * @description Rutas para métricas, estadísticas del campus y estado del esquema 3FN.
 */

import { Router } from 'express';
import { obtenerEstadisticas, obtenerEsquemaNormalizado } from '../controllers/statsController';

const router = Router();

// GET /api/stats
router.get('/', obtenerEstadisticas);

// GET /api/stats/esquema
router.get('/esquema', obtenerEsquemaNormalizado);

export default router;
