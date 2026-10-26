import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/database';

export interface EstadoAttributes {
  id?: number;
  nombre: string;
}

export class Estado extends Model<EstadoAttributes> implements EstadoAttributes {
  declare public id: number;
  declare public nombre: string;
}

Estado.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'estados',
    timestamps: false,
  }
);

export default Estado;
