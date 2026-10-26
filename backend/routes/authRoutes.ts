/**
 * @file authRoutes.ts
 * @description Rutas para autenticación y gestión de usuarios.
 */

import { Router } from 'express';
import { registro, login, perfil, getTiposUsuario } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint público: Registro de nuevo usuario
router.post('/registro', registro);

// Endpoint público: Login con email y contraseña
router.post('/login', login);

// Endpoint público: Listado de tipos de usuario para el registro
router.get('/tipos', getTiposUsuario);

// Endpoint protegido: Obtener perfil del usuario en sesión
router.get('/perfil', authenticateJWT as any, perfil as any);

export default router;
