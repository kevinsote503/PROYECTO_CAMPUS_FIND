import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/database';

export interface EntregaAttributes {
  id?: number;
  reclamacion_id: number;
  fecha?: Date;
  observaciones?: string;
}

export class Entrega extends Model<EntregaAttributes> implements EntregaAttributes {
  declare public id: number;
  declare public reclamacion_id: number;
  declare public fecha: Date;
  declare public observaciones: string;

  declare public readonly reclamacion?: any;
}

Entrega.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    reclamacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'reclamaciones',
        key: 'id',
      },
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'entregas',
    timestamps: false,
  }
);

export default Entrega;
