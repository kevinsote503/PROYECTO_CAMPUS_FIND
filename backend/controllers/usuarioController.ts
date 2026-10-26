/**
 * @file usuarioController.ts
 * @description Controlador CRUD completo para Usuarios con búsqueda interactiva y validación estricta de formato.
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Usuario, TipoUsuario, Objeto, Reclamacion } from '../models';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.()'-]{3,100}$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const REGEX_TELEFONO = /^[0-9+\-\s()]{7,20}$/;

/**
 * GET /api/usuarios?texto=&tipo_usuario_id=
 * Lista usuarios con búsqueda interactiva por nombre, correo, teléfono o rol.
 */
export async function listarUsuarios(req: Request, res: Response): Promise<void> {
  try {
    const { texto, tipo_usuario_id } = req.query;
    const where: any = {};

    if (tipo_usuario_id && tipo_usuario_id !== 'todos' && !isNaN(Number(tipo_usuario_id))) {
      where.tipo_usuario_id = Number(tipo_usuario_id);
    }

    if (texto && String(texto).trim().length > 0) {
      const termino = `%${String(texto).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: termino } },
        { correo: { [Op.like]: termino } },
        { telefono: { [Op.like]: termino } },
      ];
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ['contraseña'] },
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
      order: [['id', 'DESC']],
    });

    res.status(200).json({
      success: true,
      total: usuarios.length,
      usuarios,
    });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al consultar los usuarios.',
      error: error.message,
    });
  }
}

/**
 * POST /api/usuarios
 * Inserta un nuevo usuario validando el formato de cada campo.
 */
export async function crearUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, correo, telefono, tipo_usuario_id } = req.body;
    const contraseña = req.body.contraseña || req.body.contrasena || req.body.password;

    if (!nombre || !REGEX_NOMBRE.test(String(nombre).trim())) {
      res.status(400).json({
        success: false,
        mensaje: 'Formato de nombre inválido: debe contener solo letras y espacios (entre 3 y 100 caracteres).',
      });
      return;
    }

    if (!correo || !REGEX_CORREO.test(String(correo).trim())) {
      res.status(400).json({
        success: false,
        mensaje: 'Formato de correo electrónico inválido (ejemplo: usuario@campusfind.edu).',
      });
      return;
    }

    const passwordFinal = contraseña && String(contraseña).trim().length > 0 ? String(contraseña) : 'password123';
    if (passwordFinal.length < 6) {
      res.status(400).json({
        success: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (telefono && String(telefono).trim().length > 0 && !REGEX_TELEFONO.test(String(telefono).trim())) {
      res.status(400).json({
        success: false,
        mensaje: 'Formato de teléfono inválido: use entre 7 y 20 dígitos o signos telefónicos (+, -, paréntesis).',
      });
      return;
    }

    const tipoValido = await TipoUsuario.findByPk(Number(tipo_usuario_id));
    if (!tipoValido) {
      res.status(400).json({
        success: false,
        mensaje: 'El rol / tipo de usuario seleccionado no existe en la base de datos.',
      });
      return;
    }

    const existente = await Usuario.findOne({
      where: { correo: String(correo).toLowerCase().trim() },
    });
    if (existente) {
      res.status(400).json({
        success: false,
        mensaje: 'Ya existe un usuario registrado con ese correo electrónico.',
      });
      return;
    }

    const nuevo = await Usuario.create({
      nombre: String(nombre).trim(),
      correo: String(correo).toLowerCase().trim(),
      contraseña: passwordFinal,
      telefono: telefono ? String(telefono).trim() : '',
      tipo_usuario_id: Number(tipo_usuario_id),
    });

    const usuarioCompleto = await Usuario.findByPk(nuevo.id, {
      attributes: { exclude: ['contraseña'] },
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
    });

    res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado correctamente.',
      usuario: usuarioCompleto,
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al registrar el usuario.',
      error: error.message,
    });
  }
}

/**
 * PUT /api/usuarios/:id
 * Actualiza un usuario existente validando formato y unicidad de correo.
 */
export async function actualizarUsuario(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono, tipo_usuario_id } = req.body;
    const contraseña = req.body.contraseña || req.body.contrasena || req.body.password;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
      return;
    }

    if (nombre !== undefined) {
      if (!REGEX_NOMBRE.test(String(nombre).trim())) {
        res.status(400).json({
          success: false,
          mensaje: 'Formato de nombre inválido: solo se permiten letras y espacios (3 a 100 caracteres).',
        });
        return;
      }
      usuario.nombre = String(nombre).trim();
    }

    if (correo !== undefined) {
      const correoLimpio = String(correo).toLowerCase().trim();
      if (!REGEX_CORREO.test(correoLimpio)) {
        res.status(400).json({
          success: false,
          mensaje: 'Formato de correo electrónico inválido.',
        });
        return;
      }
      const duplicado = await Usuario.findOne({
        where: {
          correo: correoLimpio,
          id: { [Op.ne]: usuario.id },
        },
      });
      if (duplicado) {
        res.status(400).json({
          success: false,
          mensaje: 'Ese correo electrónico ya pertenece a otro usuario registrado.',
        });
        return;
      }
      usuario.correo = correoLimpio;
    }

    if (telefono !== undefined) {
      const telLimpio = String(telefono).trim();
      if (telLimpio.length > 0 && !REGEX_TELEFONO.test(telLimpio)) {
        res.status(400).json({
          success: false,
          mensaje: 'Formato de teléfono inválido (debe tener entre 7 y 20 caracteres numéricos/telefónicos).',
        });
        return;
      }
      usuario.telefono = telLimpio;
    }

    if (tipo_usuario_id !== undefined) {
      const tipoValido = await TipoUsuario.findByPk(Number(tipo_usuario_id));
      if (!tipoValido) {
        res.status(400).json({
          success: false,
          mensaje: 'El rol seleccionado no es válido.',
        });
        return;
      }
      usuario.tipo_usuario_id = Number(tipo_usuario_id);
    }

    if (contraseña && String(contraseña).trim().length > 0) {
      if (String(contraseña).trim().length < 6) {
        res.status(400).json({
          success: false,
          mensaje: 'Si desea actualizar la contraseña, debe tener mínimo 6 caracteres.',
        });
        return;
      }
      usuario.contraseña = String(contraseña).trim();
    }

    await usuario.save();

    const actualizado = await Usuario.findByPk(usuario.id, {
      attributes: { exclude: ['contraseña'] },
      include: [{ model: TipoUsuario, as: 'tipo_usuario' }],
    });

    res.status(200).json({
      success: true,
      mensaje: 'Usuario actualizado exitosamente.',
      usuario: actualizado,
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar los datos del usuario.',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/usuarios/:id
 * Elimina un usuario respetando la integridad referencial 3FN.
 */
export async function eliminarUsuario(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({ success: false, mensaje: 'Usuario no encontrado.' });
      return;
    }

    if (req.user && req.user.id === usuario.id) {
      res.status(400).json({
        success: false,
        mensaje: 'No puedes eliminar la cuenta con la que tienes sesión activa actualmente.',
      });
      return;
    }

    // Verificar integridad referencial 3FN antes de eliminar
    const [objetosAsociados, reclamacionesAsociadas] = await Promise.all([
      Objeto.count({ where: { usuario_id: usuario.id } }),
      Reclamacion.count({ where: { usuario_id: usuario.id } }),
    ]);

    if (objetosAsociados > 0 || reclamacionesAsociadas > 0) {
      res.status(400).json({
        success: false,
        mensaje: `Integridad Referencial (3FN): No se puede eliminar a "${usuario.nombre}" porque tiene ${objetosAsociados} objeto(s) y ${reclamacionesAsociadas} reclamación(es) vinculadas.`,
      });
      return;
    }

    await usuario.destroy();

    res.status(200).json({
      success: true,
      mensaje: 'Usuario eliminado correctamente de la base de datos.',
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar el usuario.',
      error: error.message,
    });
  }
}

export default {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
