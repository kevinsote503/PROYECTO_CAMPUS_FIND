/**
 * @file index.ts
 * @description Enrutador central que orquesta todos los módulos de la API RESTful de Campus Find.
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import usuarioRoutes from './usuarioRoutes';
import objetoRoutes from './objetoRoutes';
import categoriaRoutes from './categoriaRoutes';
import ubicacionRoutes from './ubicacionRoutes';
import reclamacionRoutes from './reclamacionRoutes';
import entregaRoutes from './entregaRoutes';
import statsRoutes from './statsRoutes';

const router = Router();

// Módulos de rutas API REST FULL
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/objetos', objetoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/ubicaciones', ubicacionRoutes);
router.use('/reclamaciones', reclamacionRoutes);
router.use('/entregas', entregaRoutes);
router.use('/stats', statsRoutes);

// Endpoint de verificación de salud
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', app: 'Campus Find API REST FULL', timestamp: new Date() });
});

export default router;
