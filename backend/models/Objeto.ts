import { DataTypes } from 'sequelize';
import sequelize from '../database/database';
import { EntidadBase, ResultadoValidacionPOO } from './EntidadBase';

export interface ObjetoAttributes {
  id?: number;
  usuario_id: number;
  categoria_id: number;
  ubicacion_id: number;
  estado_id: number;
  titulo: string;
  descripcion: string;
  fecha_reporte?: Date;
  latitud?: number | null;
  longitud?: number | null;
}

export class Objeto extends EntidadBase<ObjetoAttributes> implements ObjetoAttributes {
  declare public id: number;
  declare public usuario_id: number;
  declare public categoria_id: number;
  declare public ubicacion_id: number;
  declare public estado_id: number;
  declare public titulo: string;
  declare public descripcion: string;
  declare public fecha_reporte: Date;
  declare public latitud: number | null;
  declare public longitud: number | null;

  // Relaciones tipadas
  declare public readonly usuario?: any;
  declare public readonly categoria?: any;
  declare public readonly ubicacion?: any;
  declare public readonly estado?: any;

  // Polimorfismo POO: Resumen descriptivo del objeto
  public obtenerResumenPOO(): string {
    return `Objeto #${this.id}: "${this.titulo}" (Cat: ${this.categoria_id}, Ubi: ${this.ubicacion_id}, Estado: ${this.estado_id})`;
  }

  // Polimorfismo POO: Validación de formato de campos del objeto
  public validarDominio(): ResultadoValidacionPOO {
    const errores: string[] = [];
    if (!this.titulo || this.titulo.trim().length < 4 || this.titulo.trim().length > 150) {
      errores.push('El título del objeto debe contener entre 4 y 150 caracteres.');
    }
    if (!this.descripcion || this.descripcion.trim().length < 10) {
      errores.push('La descripción detallada debe contener al menos 10 caracteres.');
    }
    if (!this.categoria_id || !this.ubicacion_id || !this.estado_id) {
      errores.push('Categoría, ubicación y estado son claves foráneas obligatorias.');
    }
    return { valido: errores.length === 0, errores };
  }
}

Objeto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias',
        key: 'id',
      },
    },
    ubicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ubicaciones',
        key: 'id',
      },
    },
    estado_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estados',
        key: 'id',
      },
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fecha_reporte: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    latitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'objetos',
    timestamps: false,
  }
);

export default Objeto;
