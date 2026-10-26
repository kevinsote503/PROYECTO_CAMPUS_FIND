import { DataTypes } from 'sequelize';
import sequelize from '../database/database';
import bcrypt from 'bcryptjs';
import { EntidadBase, ResultadoValidacionPOO } from './EntidadBase';

export interface UsuarioAttributes {
  id?: number;
  nombre: string;
  correo: string;
  contraseña?: string;
  telefono?: string;
  tipo_usuario_id: number;
  creado_en?: Date;
}

export class Usuario extends EntidadBase<UsuarioAttributes> implements UsuarioAttributes {
  declare public id: number;
  declare public nombre: string;
  declare public correo: string;
  declare public contraseña: string;
  declare public telefono: string;
  declare public tipo_usuario_id: number;
  declare public readonly creado_en: Date;
  declare public readonly tipo_usuario?: any;

  // Comparar contraseña con el hash almacenado
  public async verificarContraseña(passwordPlano: string): Promise<boolean> {
    return bcrypt.compare(passwordPlano, this.contraseña);
  }

  // Eliminar contraseña del objeto JSON devuelto al cliente (Encapsulamiento)
  public toSafeJSON() {
    const values = { ...this.get() };
    delete values.contraseña;
    return values;
  }

  // Polimorfismo POO: Resumen descriptivo de la instancia
  public obtenerResumenPOO(): string {
    return `Usuario #${this.id}: ${this.nombre} <${this.correo}> (Rol ID: ${this.tipo_usuario_id})`;
  }

  // Polimorfismo POO: Validación de formato e integridad de dominio
  public validarDominio(): ResultadoValidacionPOO {
    const errores: string[] = [];
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.()'-]{3,100}$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const regexTelefono = /^[0-9+\-\s()]{7,20}$/;

    if (!this.nombre || !regexNombre.test(this.nombre.trim())) {
      errores.push('El nombre debe tener entre 3 y 100 caracteres alfabéticos válidos.');
    }
    if (!this.correo || !regexCorreo.test(this.correo.trim())) {
      errores.push('El correo electrónico no cumple con el formato estándar (usuario@dominio.edu).');
    }
    if (this.telefono && this.telefono.trim().length > 0 && !regexTelefono.test(this.telefono.trim())) {
      errores.push('El teléfono debe contener entre 7 y 20 dígitos o caracteres telefónicos válidos.');
    }
    if (!this.tipo_usuario_id || isNaN(Number(this.tipo_usuario_id))) {
      errores.push('Debe especificarse un tipo de usuario válido.');
    }

    return { valido: errores.length === 0, errores };
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    correo: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    tipo_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tipos_usuario',
        key: 'id',
      },
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: false,
    hooks: {
      beforeCreate: async (user: Usuario) => {
        if (user.contraseña && !user.contraseña.startsWith('$2a$') && !user.contraseña.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.contraseña = await bcrypt.hash(user.contraseña, salt);
        }
      },
      beforeUpdate: async (user: Usuario) => {
        if (user.changed('contraseña') && user.contraseña && !user.contraseña.startsWith('$2a$') && !user.contraseña.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.contraseña = await bcrypt.hash(user.contraseña, salt);
        }
      },
    },
  }
);

export default Usuario;
