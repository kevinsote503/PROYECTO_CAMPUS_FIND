import { DataTypes } from 'sequelize';
import sequelize from '../database/database';
import { EntidadBase, ResultadoValidacionPOO } from './EntidadBase';

export interface ReclamacionAttributes {
  id?: number;
  objeto_id: number;
  usuario_id: number;
  descripcion: string;
  fecha?: Date;
  estado_reclamacion_id: number;
}

export class Reclamacion extends EntidadBase<ReclamacionAttributes> implements ReclamacionAttributes {
  declare public id: number;
  declare public objeto_id: number;
  declare public usuario_id: number;
  declare public descripcion: string;
  declare public fecha: Date;
  declare public estado_reclamacion_id: number;

  declare public readonly objeto?: any;
  declare public readonly usuario?: any;
  declare public readonly estado_reclamacion?: any;
  declare public readonly entrega?: any;

  public obtenerResumenPOO(): string {
    return `Reclamación #${this.id} para Objeto #${this.objeto_id} (Estado: ${this.estado_reclamacion_id})`;
  }

  public validarDominio(): ResultadoValidacionPOO {
    const errores: string[] = [];
    if (!this.descripcion || this.descripcion.trim().length < 10) {
      errores.push('La justificación o evidencia debe tener al menos 10 caracteres.');
    }
    if (!this.objeto_id || !this.usuario_id) {
      errores.push('El objeto y el usuario reclamante son obligatorios.');
    }
    return { valido: errores.length === 0, errores };
  }
}

Reclamacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    objeto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'objetos',
        key: 'id',
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id',
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    estado_reclamacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'estados_reclamacion',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'reclamaciones',
    timestamps: false,
  }
);

export default Reclamacion;
