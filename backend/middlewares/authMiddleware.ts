/**
 * @file authMiddleware.ts
 * @description Middleware de autenticación y autorización basado en JWT con control de roles.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, TipoUsuario } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_find_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre: string;
    correo: string;
    tipo_usuario_id: number;
    rol: string;
  };
}

/**
 * Middleware para validar que el usuario cuente con un token JWT válido
 */
export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      mensaje: 'Acceso no autorizado: Token no proporcionado o formato inválido (debe ser Bearer <token>).',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      nombre: string;
      correo: string;
      tipo_usuario_id: number;
      rol: string;
    };

    // Verificar que el usuario todavía exista en la base de datos
    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
    });

    if (!usuario) {
      res.status(401).json({
        success: false,
        mensaje: 'Acceso no autorizado: El usuario asociado al token no existe.',
      });
      return;
    }

    const rolNombre = usuario.tipo_usuario ? usuario.tipo_usuario.nombre : decoded.rol;

    req.user = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      tipo_usuario_id: usuario.tipo_usuario_id,
      rol: rolNombre,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      mensaje: 'Acceso no autorizado: Token inválido o expirado.',
    });
  }
}

/**
 * Middleware para requerir rol de Administrador
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.rol !== 'administrador') {
    res.status(403).json({
      success: false,
      mensaje: 'Acceso denegado: Se requieren permisos de Administrador para realizar esta acción.',
    });
    return;
  }
  next();
}

/**
 * Middleware para requerir roles específicos
 */
export function requireRole(rolesPermitidos: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        mensaje: `Acceso denegado: Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}.`,
      });
      return;
    }
    next();
  };
}

export default {
  authenticateJWT,
  requireAdmin,
  requireRole,
};
