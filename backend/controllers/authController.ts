/**
 * @file authController.ts
 * @description Controlador de autenticación: registro, inicio de sesión y gestión de perfil.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, TipoUsuario } from '../models';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_find_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/registro
 * Registra un nuevo usuario en la plataforma
 */
export async function registro(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, correo, telefono, tipo_usuario_id } = req.body;
    const contraseña = req.body.contraseña || req.body.contrasena || req.body.password;

    // Validaciones de entrada
    if (!nombre || !correo || !contraseña || !tipo_usuario_id) {
      res.status(400).json({
        success: false,
        mensaje: 'Todos los campos requeridos deben completarse (nombre, correo, contraseña, tipo_usuario_id).',
      });
      return;
    }

    if (contraseña.length < 6) {
      res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe contener al menos 6 caracteres.',
      });
      return;
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ where: { correo: correo.toLowerCase().trim() } });
    if (usuarioExistente) {
      res.status(400).json({
        success: false,
        mensaje: 'El correo electrónico ya está registrado en el sistema.',
      });
      return;
    }

    // Verificar tipo de usuario válido
    const tipoValido = await TipoUsuario.findByPk(tipo_usuario_id);
    if (!tipoValido) {
      res.status(400).json({
        success: false,
        mensaje: 'El tipo de usuario seleccionado no es válido.',
      });
      return;
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      correo: correo.toLowerCase().trim(),
      contraseña,
      telefono: telefono ? telefono.trim() : '',
      tipo_usuario_id: Number(tipo_usuario_id),
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        tipo_usuario_id: nuevoUsuario.tipo_usuario_id,
        rol: tipoValido.nombre,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado exitosamente en Campus Find.',
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        telefono: nuevoUsuario.telefono,
        tipo_usuario_id: nuevoUsuario.tipo_usuario_id,
        rol: tipoValido.nombre,
      },
    });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor al procesar el registro.',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/login
 * Inicia sesión con correo y contraseña, emitiendo un token JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { correo } = req.body;
    const contraseña = req.body.contraseña || req.body.contrasena || req.body.password;

    if (!correo || !contraseña) {
      res.status(400).json({
        success: false,
        mensaje: 'Debe ingresar correo y contraseña.',
      });
      return;
    }

    // Buscar usuario incluyendo su rol
    const usuario = await Usuario.findOne({
      where: { correo: correo.toLowerCase().trim() },
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
    });

    if (!usuario) {
      res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas: correo no registrado o contraseña incorrecta.',
      });
      return;
    }

    // Validar contraseña
    const esValida = await usuario.verificarContraseña(contraseña);
    if (!esValida) {
      res.status(401).json({
        success: false,
        mensaje: 'Credenciales inválidas: correo no registrado o contraseña incorrecta.',
      });
      return;
    }

    const rol = usuario.tipo_usuario ? usuario.tipo_usuario.nombre : 'estudiante';

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo_usuario_id: usuario.tipo_usuario_id,
        rol,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      mensaje: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        tipo_usuario_id: usuario.tipo_usuario_id,
        rol,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor al iniciar sesión.',
      error: error.message,
    });
  }
}

/**
 * GET /api/auth/perfil
 * Obtiene los datos del usuario autenticado
 */
export async function perfil(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, mensaje: 'No autenticado.' });
      return;
    }

    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
    });

    if (!usuario) {
      res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
      return;
    }

    res.status(200).json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        tipo_usuario_id: usuario.tipo_usuario_id,
        rol: usuario.tipo_usuario?.nombre || req.user.rol,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener perfil.', error: error.message });
  }
}

/**
 * GET /api/auth/tipos
 * Retorna los tipos de usuario disponibles en el sistema
 */
export async function getTiposUsuario(_req: Request, res: Response): Promise<void> {
  try {
    const tipos = await TipoUsuario.findAll();
    res.status(200).json({ success: true, tipos });
  } catch (error: any) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener roles.', error: error.message });
  }
}

export default {
  registro,
  login,
  perfil,
  getTiposUsuario,
};
